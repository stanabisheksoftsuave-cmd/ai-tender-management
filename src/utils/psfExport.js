/*
 * PSF Strategy export — the Procurement Submission Form as a Word document,
 * matching the Next.js app's "Export PSF" (which downloads `PSF Strategy.docx`).
 *
 * Walks every section of the template rather than a chosen few, in the same
 * order as the Review & Submit sub-steps, with the LC labels the Contract
 * Holder sees on screen.
 */

import {
  AlignmentType, BorderStyle, Document, HeadingLevel, Packer, Paragraph, ShadingType, Table, TableCell,
  TableRow, TextRun, WidthType,
} from 'docx'
import { tenderRef } from './tenderRef'
import { EM_DASH, PSF_HEADER_FIELDS, PSF_NARRATIVE_FIELDS } from '../data/psfTemplate'

const FONT = 'Calibri'
const BRAND = '1B4C6F'
const MUTED = '64748B'

const txt = v => {
  const s = v === null || v === undefined ? '' : String(v).trim()
  return s || EM_DASH
}

const heading = (text) => new Paragraph({
  spacing: { before: 280, after: 100 },
  children: [new TextRun({ text: text.toUpperCase(), bold: true, size: 22, color: BRAND, font: FONT })],
})

const sub = (text) => new Paragraph({
  spacing: { before: 120, after: 60 },
  children: [new TextRun({ text, bold: true, size: 18, color: MUTED, font: FONT })],
})

const para = (text) => String(txt(text)).split('\n').map(line => new Paragraph({
  spacing: { after: 80 },
  children: [new TextRun({ text: line, size: 20, font: FONT })],
}))

const cell = (text, { bold = false, header = false, width } = {}) => new TableCell({
  width: width ? { size: width, type: WidthType.PERCENTAGE } : undefined,
  shading: header ? { type: ShadingType.CLEAR, color: 'auto', fill: 'F1F5F9' } : undefined,
  margins: { top: 60, bottom: 60, left: 100, right: 100 },
  children: [new Paragraph({
    children: [new TextRun({ text: txt(text), bold: bold || header, size: header ? 16 : 18, font: FONT, color: header ? MUTED : undefined })],
  })],
})

/** A header row plus body rows; `widths` are percentages. */
const table = (headers, widths, rows) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: [
    new TableRow({ tableHeader: true, children: headers.map((h, i) => cell(h, { header: true, width: widths[i] })) }),
    ...rows.map(r => new TableRow({ children: r.map((c, i) => cell(c, { width: widths[i] })) })),
  ],
})

/** Label | value rows. */
const kvTable = (pairs) => new Table({
  width: { size: 100, type: WidthType.PERCENTAGE },
  rows: pairs.map(([k, v]) => new TableRow({
    children: [cell(k, { bold: true, width: 40 }), cell(v, { width: 60 })],
  })),
})

const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const NO_BORDERS = { top: NONE, bottom: NONE, left: NONE, right: NONE }

/** `☒ Ticked` / `☐ Unticked`, three to a row like the template's own columns. */
const checkboxes = (boxes = []) => {
  if (!boxes.length) return [new Paragraph({ children: [new TextRun({ text: EM_DASH, font: FONT })] })]
  const rows = []
  for (let i = 0; i < boxes.length; i += 3) {
    const slice = boxes.slice(i, i + 3)
    while (slice.length < 3) slice.push(null)
    rows.push(new TableRow({
      children: slice.map(b => new TableCell({
        width: { size: 33, type: WidthType.PERCENTAGE },
        borders: NO_BORDERS,
        children: [new Paragraph({
          children: b ? [new TextRun({ text: `${b.checked ? '☒' : '☐'} ${b.label}`, size: 18, font: FONT, bold: !!b.checked })] : [],
        })],
      })),
    }))
  }
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })]
}

const gap = () => new Paragraph({ spacing: { after: 80 }, children: [] })

/**
 * @param {object} tender
 * @param {object} psf   the PSF document (tender.psfDocument shape)
 * @param {{label:string, names:string[]}[]} team  one entry per role
 */
export function buildPsfDocx(tender, psf, team = []) {
  const children = []
  const p = psf || {}

  children.push(new Paragraph({
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: 'PROCUREMENT SUBMISSION FORM', bold: true, size: 32, color: BRAND, font: FONT })],
  }))
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 200 },
    children: [new TextRun({ text: `${tenderRef(tender)} · ${tender?.title || ''}`, size: 20, color: MUTED, font: FONT })],
  }))

  children.push(heading('Submission Type'))
  children.push(...checkboxes([
    { label: 'Strategy', checked: true },
    { label: 'Strategy Amendment', checked: false },
    { label: 'Award', checked: false },
    { label: 'Variation', checked: false },
  ]))

  children.push(heading('Attachments'))
  if (p.attachments?.length) p.attachments.forEach((name, i) => children.push(...para(`${i + 1}. ${name}`)))
  else children.push(...para(''))

  children.push(heading('Procurement Submission Form - Strategy'))
  children.push(kvTable(PSF_HEADER_FIELDS.map(f => [f.label, p.header?.[f.key]])))

  children.push(heading('History'))
  ;['previous', 'existing'].forEach(scope => {
    const e = p.history?.[scope] || {}
    children.push(sub(`${scope === 'previous' ? 'Previous' : 'Existing'} contract`))
    children.push(kvTable([
      [`Award date of ${scope} Contract`, e.awardDate],
      [`Expiry date of ${scope} Contract`, e.expiryDate],
      [`Contractor Name (${scope})`, e.contractorName],
      [`Method of procuring ${scope} Contract`, e.method],
      [`ACV (${scope})`, e.acv],
      ...(e.actualSpend !== undefined ? [['Actual Spend', e.actualSpend]] : []),
    ]))
  })
  children.push(gap())
  children.push(kvTable([['Current Spend', p.history?.currentSpend]]))

  children.push(heading('Reviews/Approvals Established'))
  children.push(...checkboxes(p.reviews))

  children.push(heading('Estimate Basis'))
  children.push(kvTable([['Confidence Level', p.estimate?.confidenceLevel]]))
  children.push(gap())
  children.push(...checkboxes(p.estimate?.basis))
  children.push(sub('Benchmarking of Estimates'))
  children.push(...para(p.narrative?.benchmarking))

  children.push(heading('Submission Narrative'))
  PSF_NARRATIVE_FIELDS.forEach(f => {
    children.push(sub(f.label))
    children.push(...para(p.narrative?.[f.key]))
  })

  children.push(heading('Tender Plan'))
  children.push(...checkboxes(p.tenderPlan?.types))
  children.push(kvTable([['New services required to be in place/on site by', p.tenderPlan?.requiredBy]]))
  children.push(gap())
  children.push(table(['Milestone', 'Planned', 'Actual'], [56, 22, 22],
    (p.tenderPlan?.milestones || []).map(m => [m.label, m.planned, m.actual])))
  children.push(sub('Deviations'))
  children.push(...para(p.tenderPlan?.deviations))

  children.push(heading('Tender Strategy'))
  children.push(...checkboxes(p.tenderStrategy))

  children.push(heading('Drop Lists'))
  children.push(sub('Competitive'))
  children.push(...checkboxes(p.dropLists?.competitive))
  children.push(sub('Single source / OEM'))
  children.push(...checkboxes(p.dropLists?.singleSourceOem))

  children.push(heading('Proposed Basis for Tender Assessments'))
  children.push(kvTable([
    ['Technical', p.assessments?.technical],
    ['Cut Off', p.assessments?.cutOff],
    ['Commercial', p.assessments?.commercial],
  ]))
  children.push(sub('Alternatives Considered'))
  children.push(...para(p.alternativesConsidered))
  children.push(sub('Other Details (tender assessments)'))
  children.push(...para(p.assessmentOtherDetails))
  children.push(sub('Omanisation Implications'))
  children.push(...para(p.omanisationImplications))
  children.push(sub('Other Details (Omanisation)'))
  children.push(...para(p.omanisationOtherDetails))

  children.push(heading('Negotiation Strategy (for OEM & single source only)'))
  children.push(kvTable([['Applicability', p.negotiation?.applicability]]))
  children.push(sub('Negotiation Strategy Details'))
  children.push(...para(p.narrative?.negotiationDetails))
  children.push(sub('Additional Notes (tender strategy)'))
  children.push(...para(p.strategyAdditionalNotes))

  children.push(heading('Tenderer List'))
  children.push(kvTable([['Source of tenderer list', p.tendererList?.source]]))
  children.push(gap())
  children.push(table(
    ['S/No.', 'Contractor / Supplier Reference', 'Pre-Qualification Result', 'Result Justification'],
    [8, 32, 20, 40],
    (p.tendererList?.rows || []).map((r, i) => [String(i + 1), r.reference, r.prequalResult, r.justification]),
  ))
  children.push(sub('Justification'))
  children.push(...para(p.narrative?.tendererJustification))
  children.push(sub('Additional Notes (tenderer list)'))
  children.push(...para(p.tendererAdditionalNotes))

  children.push(heading('Recommendation/Request'))
  children.push(sub('Recommendation to Tender Board'))
  children.push(...para(p.narrative?.recommendation))

  children.push(heading('LC Review'))
  children.push(sub('LC Review Detail'))
  children.push(...para(p.icvReviewDetail))
  children.push(table(['#', 'Requirement', 'Yes/No · %', 'Justification / Comments'], [6, 46, 14, 34],
    (p.icvRequirements || []).map(r => [r.ordinal, r.requirement, r.answer, r.comment])))

  children.push(heading('Assigned Team'))
  children.push(kvTable(team.map(m => [m.label, m.names?.length ? m.names.join(', ') : 'Not assigned'])))
  if (tender?.psfCompletedAt) {
    children.push(gap())
    children.push(kvTable([['Submitted on', tender.psfCompletedAt]]))
  }

  return new Document({
    creator: 'AI Tender Management',
    title: 'PSF Strategy',
    sections: [{ children }],
  })
}

/** Builds the .docx and triggers the browser download. */
export async function exportPsfDocx(tender, psf, team = []) {
  const blob = await Packer.toBlob(buildPsfDocx(tender, psf, team))
  const ref = String(tenderRef(tender) || 'PSF').replace(/[\\/:*?"<>|]+/g, '-')
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${ref} - PSF Strategy.docx`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
