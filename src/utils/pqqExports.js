import { jsPDF } from 'jspdf'
import { downloadSheets } from './exportExcel'
import { tenderRef } from './tenderRef'
import {
  FINANCIAL_SHEET, SHEETS, computedOverall, financialVerdict, isApplicable, markLabel, overallVerdict,
  qualificationLabel, stage3Verdict,
} from '../components/pqq/pqqModel'

/*
 * Pre-Qualification exports — client-side stand-ins for MAIN's server-built
 * workbooks (bidder list, evaluation results, pre-qual summary) and its two
 * failure-reasoning PDFs. File names carry the tender reference (cost code),
 * never the internal id.
 */

const sanitize = s => String(s || '').replace(/[\\/:*?"<>|]+/g, '-').replace(/\s+/g, ' ').trim()
const stem = tender => sanitize(tenderRef(tender)) || 'Tender'
const dash = v => (v === undefined || v === null || v === '' ? '—' : String(v))

export function exportBiddersListXlsx(tender) {
  const bidders = (tender?.prequalBidders || []).filter(b => !b.droppedAt)
  const aoa = [
    ['Bidder', 'Country', 'Category', 'Source', 'CR No', 'JSRS No', 'Contact Name', 'Contact Email'],
    ...bidders.map(b => [
      dash(b.name), dash(b.country), dash(b.category),
      [b.sourceErp !== false ? 'ERP' : null, b.sourceJsrs ? 'JSRS' : null].filter(Boolean).join(' / ') || '—',
      dash(b.regNo), dash(b.jsrsNo), dash(b.contactName), dash(b.contactEmail),
    ]),
  ]
  downloadSheets(`${stem(tender)} - Shortlisted Bidders.xlsx`, [{ name: 'Shortlisted Bidders', aoa }])
}

function cellFor(bidder, sheetKey, criterion) {
  if (!isApplicable(criterion, bidder)) return 'Not applicable'
  const v = bidder.stage3?.[sheetKey]?.[criterion.id]
  return v ? markLabel(v) : 'Not yet evaluated'
}

const reviewRows = tender => (tender?.prequalBidders || []).filter(b => !b.droppedAt || b.droppedAt === 'holder_excluded' || b.droppedAt === 'not_qualified')

export function exportPrequalEvaluationResultsXlsx(tender) {
  const bidders = reviewRows(tender)
  const header = ['Criterion', 'Requirement', ...bidders.map(b => b.name)]
  const sheets = SHEETS.map(sheet => ({
    name: sheet.label.replace(' Pre-Qualification', ''),
    aoa: [
      [sheet.label],
      [],
      header,
      ...sheet.criteria.map(c => [c.item, c.detail, ...bidders.map(b => cellFor(b, sheet.key, c))]),
      [],
      ['Reasons'],
      ...sheet.criteria.flatMap(c => bidders
        .filter(b => b.stage3?.[sheet.key]?.[c.id] === 'fail')
        .map(b => [c.item, b.name, dash(b.stage3Reasons?.[sheet.key]?.[c.id])])),
    ],
  }))
  if (tender?.financialAssessmentRequired) {
    sheets.push({
      name: 'Financial',
      aoa: [
        [FINANCIAL_SHEET.label],
        [],
        header,
        ...FINANCIAL_SHEET.criteria.map(c => [c.item, c.detail, ...bidders.map(b => {
          const v = b.stage4Marks?.financial?.[c.id]
          return v ? markLabel(v) : 'Not yet evaluated'
        })]),
      ],
    })
  }
  sheets.unshift({
    name: 'Results',
    aoa: [
      ['Pre-Qualification Evaluation Results'],
      ['Tender', dash(tenderRef(tender))],
      ['Title', dash(tender?.title)],
      [],
      ['Bidder', 'Country', 'Technical & QHSE', 'Financial', 'Qualification'],
      ...bidders.map(b => {
        const fin = financialVerdict(tender, b)
        return [
          b.name, dash(b.country), stage3Verdict(b), fin === null ? 'Not assessed' : fin,
          b.droppedAt === 'holder_excluded' ? 'Rejected' : qualificationLabel(overallVerdict(tender, b)),
        ]
      }),
    ],
  })
  downloadSheets(`${stem(tender)} - PreQual Evaluation Results.xlsx`, sheets)
}

export function exportPrequalSummaryXlsx(tender) {
  const all = tender?.prequalBidders || []
  const rows = reviewRows(tender)
  const qualified = rows.filter(b => !b.droppedAt && overallVerdict(tender, b) === 'pass')
  const overview = [
    ['Pre-Qualification Summary'],
    [],
    ['Tender', dash(tenderRef(tender))],
    ['Title', dash(tender?.title)],
    ['Department', dash(tender?.department)],
    ['Work Category', dash(tender?.workCategory)],
    ['Financial Assessment Required', tender?.financialAssessmentRequired ? 'Yes' : 'No'],
    ['Financial Assessment By', dash(tender?.financialAssessmentCompletedBy)],
    ['Financial Assessment Date', dash(tender?.financialAssessmentCompletedAt)],
    [],
    ['Bidders Shortlisted', all.length],
    ['Bidders In Final Review', rows.length],
    ['Qualified', qualified.length],
  ]
  const decisions = [
    ['Bidder', 'Country', 'Category', 'Technical & QHSE', 'Financial', 'Computed', 'Qualification', 'Override / Exclusion Reason'],
    ...rows.map(b => {
      const fin = financialVerdict(tender, b)
      const excluded = b.droppedAt === 'holder_excluded'
      return [
        b.name, dash(b.country), dash(b.category), stage3Verdict(b), fin === null ? 'Not assessed' : fin,
        computedOverall(tender, b),
        excluded ? 'Rejected' : qualificationLabel(overallVerdict(tender, b)),
        excluded ? dash(b.pqExcludeRationale) : b.pqOverallOverride ? `Overridden from ${b.pqOverallOverride.computedValue}: ${b.pqOverallOverride.rationale}` : '—',
      ]
    }),
  ]
  const others = all.filter(b => b.droppedAt && b.droppedAt !== 'holder_excluded' && b.droppedAt !== 'not_qualified')
  const notParticipating = [
    ['Bidder', 'Country', 'Reason'],
    ...others.map(b => [b.name, dash(b.country), b.droppedAt === 'no_response' ? 'No response submitted' : String(b.droppedAt)]),
  ]
  downloadSheets(`${stem(tender)} - PreQual Summary.xlsx`, [
    { name: 'Overview', aoa: overview },
    { name: 'Final Review', aoa: decisions },
    { name: 'Did Not Participate', aoa: notParticipating },
  ])
}

// ── Failure-reasoning PDFs (MAIN technical-/financial-fail-reason-pdf) ───────

const MARGIN_X = 15
const TOP_Y = 20
const TEXT_WIDTH = 180
const LINE_HEIGHT = 6
const BLOCK_GAP = 3
const PAGE_BREAK_Y = 265

function pdfWriter() {
  const doc = new jsPDF()
  let y = TOP_Y
  const write = (text, size = 10) => {
    doc.setFontSize(size)
    doc.splitTextToSize(String(text), TEXT_WIDTH).forEach(line => {
      if (y > PAGE_BREAK_Y) { doc.addPage(); y = TOP_Y }
      doc.text(line, MARGIN_X, y)
      y += LINE_HEIGHT
    })
  }
  const gap = () => { y += BLOCK_GAP }
  return { doc, write, gap }
}

export function exportTechnicalFailReasonPdf(tender, bidder) {
  const { doc, write, gap } = pdfWriter()
  write('Technical Pre-Qualification - Failure Reasoning', 16)
  gap()
  write(`Tender: ${tenderRef(tender)}`)
  write(`Bidder: ${bidder.name}`)
  write('Result: FAIL')
  gap()
  write('Why this bidder did not pass', 12)
  gap()
  const failed = SHEETS.flatMap(sheet => sheet.criteria
    .filter(c => isApplicable(c, bidder) && bidder.stage3?.[sheet.key]?.[c.id] === 'fail')
    .map(c => ({ sheet, c })))
  failed.forEach(({ sheet, c }, i) => {
    write(`${i + 1}. [${sheet.label}] ${c.item}`)
    write('Value: Fail')
    const reason = bidder.stage3Overrides?.[sheet.key]?.[c.id]?.rationale || bidder.stage3Reasons?.[sheet.key]?.[c.id] || bidder.stage3AiReasons?.[sheet.key]?.[c.id]
    if (reason) write(`Finding: ${reason}`)
    gap()
  })
  if (failed.length === 0) {
    write('No individual criterion is marked as failing. This bidder was failed on the overall Stage 3 assessment recorded below.')
    gap()
  }
  gap()
  write(`${bidder.name} did not meet the technical pre-qualification criteria for this tender and is recorded as FAIL.`)
  doc.save(`${sanitize(bidder.name) || 'Bidder'} - Technical Failure Reasoning.pdf`)
}

export function exportFinancialFailReasonPdf(tender, bidder) {
  const { doc, write, gap } = pdfWriter()
  write('Financial Assessment - Failure Reasoning', 16)
  gap()
  write(`Tender: ${tenderRef(tender)}`)
  write(`Bidder: ${bidder.name}`)
  write('Result: FAIL')
  gap()
  write('Why this bidder did not pass', 12)
  gap()
  const failed = FINANCIAL_SHEET.criteria.filter(c => bidder.stage4Marks?.financial?.[c.id] === 'fail')
  failed.forEach((c, i) => {
    write(`${i + 1}. ${c.item}`)
    write(`Requirement: ${c.detail}`)
    const reason = bidder.stage4Reasons?.financial?.[c.id]
    if (reason) write(`Finding: ${reason}`)
    gap()
  })
  if (failed.length === 0) {
    write('No individual criterion is marked Fail. This bidder was failed on the overall assessment recorded below.')
    gap()
  }
  gap()
  write(`${bidder.name} did not meet the financial pre-qualification criteria for this tender and is recorded as FAIL.`)
  doc.save(`${sanitize(bidder.name) || 'Bidder'} - Financial Failure Reasoning.pdf`)
}
