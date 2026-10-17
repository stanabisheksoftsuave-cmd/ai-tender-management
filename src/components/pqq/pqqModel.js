/*
 * Pre-Qualification (PQQ) — the data model shared by every stage.
 *
 * TARGET has no backend: everything MAIN does through the prequal API is done
 * here on the tender object (persisted through TenderContext). Constants,
 * verdict rules and the deterministic "AI" generators live in this .js file so
 * the .jsx components stay Fast-Refresh friendly.
 */
import {
  erpBidders, WORK_CATEGORIES, QHSE_CRITERIA, TECHNICAL_CRITERIA_PQ,
  ADMINISTRATIVE_CRITERIA, FINANCIAL_CRITERIA,
} from '../../data/mockData'

// ── Stage machine ────────────────────────────────────────────────────────────

export const PREQUAL_STATUSES = [
  'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4',
  'prequal_final_review', 'prequal_rejected',
]

export const STAGE_ORDER = [
  'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4', 'prequal_final_review',
]

// MAIN's stage pill labels (PqqPage STAGE_LABEL). Written to tender.stage on
// every forward transition and used for the pill, whatever an older write left
// in tender.stage.
export const STAGE_LABEL = {
  prequal_stage1: 'Pre-Qualification - Bidder Matching',
  prequal_stage2: 'Pre-Qualification - Questionnaire',
  prequal_stage3: 'Pre-Qualification - Response Review',
  prequal_stage4: 'Pre-Qualification - Financial Assessment',
  prequal_final_review: 'Pre-Qualification - Final Review',
  prequal_rejected: 'Pre-Qualification - Rejected',
  completed: 'Pre-Qualification - Submitted',
}

// Who owns each stage. Stage 4 (financial assessment) belongs to the Contract
// Engineer; everything else is the Contract Holder's.
export const STAGE_OWNER = {
  prequal_stage1: 'contract_holder',
  prequal_stage2: 'contract_holder',
  prequal_stage3: 'contract_holder',
  prequal_stage4: 'pof',
  prequal_final_review: 'contract_holder',
  prequal_rejected: 'contract_holder',
}

// MAIN Stage 2's Edit-with-AI quick prompts (same shape as AI_QUICK_ACTIONS).
export const PQQ_QUICK_PROMPTS = [
  'Make it more specific',
  'Shorten this',
  'Make it more formal',
  'Expand with more detail',
]

export const PQQ_TEMPLATE_URL = '/pq-templates/pre-qualification-questionnaire.docx'
export const PQQ_SECTION = {
  id: 'pqq',
  title: 'Pre-Qualification Questionnaire',
  docxUrl: PQQ_TEMPLATE_URL,
}

// ── Limits (MAIN text-limits.ts / upload-limits.ts) ──────────────────────────

export const PQQ_LONG_TEXT_MAX_LENGTH = 2000
export const PQQ_SEARCH_MAX_LENGTH = 100
export const PQQ_TEXT_LIMIT_MESSAGE = 'Input text exceeds the allowed character limit.'
export const PQQ_SEARCH_LIMIT_MESSAGE = 'Search input is too long.'
export const isAtTextLimit = (value, max) => (value || '').length >= max

export const MAX_UPLOAD_FILE_SIZE = 512 * 1024 * 1024
export const MAX_UPLOAD_BATCH_SIZE = 1024 * 1024 * 1024
export const MAX_UPLOAD_FILE_COUNT = 20
export const MAX_BIDDER_LIST_BYTES = 20 * 1024 * 1024
export const MAX_BIDDER_LIST_ROWS = 5000

export function capStagedFiles(staged, incoming) {
  const room = Math.max(0, MAX_UPLOAD_FILE_COUNT - staged.length)
  const accepted = incoming.slice(0, room)
  return { files: [...staged, ...accepted], skipped: incoming.length - accepted.length }
}

export function describeSkippedFiles(skipped) {
  return `You can select up to ${MAX_UPLOAD_FILE_COUNT} files at once. ${skipped} ${skipped === 1 ? 'file was' : 'files were'} not added.`
}

export const findOversizedFile = files => files.find(f => f.size > MAX_UPLOAD_FILE_SIZE) ?? null
export const totalFileSize = files => files.reduce((sum, f) => sum + f.size, 0)

export function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let n = bytes
  let u = 0
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u++ }
  return `${n >= 10 || u === 0 ? Math.round(n) : n.toFixed(1)} ${units[u]}`
}

export function validateBidderListFile(file) {
  if (!/\.xlsx$/i.test(file.name)) return 'Upload an Excel (.xlsx) file.'
  if (file.size === 0) return 'This file is empty.'
  if (file.size > MAX_BIDDER_LIST_BYTES) return 'This file is larger than 20 MB.'
  return null
}

export const validateSowFile = file => (file.size === 0 ? 'This file is empty.' : null)

// ── Criteria sheets ──────────────────────────────────────────────────────────

export const SHEETS = [
  { key: 'qhse', label: 'QHSE Pre-Qualification', criteria: QHSE_CRITERIA },
  { key: 'technical', label: 'Technical Pre-Qualification', criteria: TECHNICAL_CRITERIA_PQ },
  { key: 'administrative', label: 'Administrative Pre-Qualification', criteria: ADMINISTRATIVE_CRITERIA },
]

export const FINANCIAL_SHEET = { key: 'financial', label: 'Financial Pre-Qualification', criteria: FINANCIAL_CRITERIA }

export const MARK_CHOICES = ['pass', 'fail']
export const markLabel = v => (v === 'pass' ? 'Pass' : v === 'fail' ? 'Fail' : v || '')

export const isApplicable = (criterion, bidder) => !(criterion.localOnly && !bidder.isLocal)

export const emptyStage3 = () => ({ qhse: {}, technical: {}, administrative: {} })

// A Fail on any applicable criterion fails the bidder; every applicable
// criterion marked Pass passes it; anything else is still pending.
export function stage3Overall(bidder) {
  let allMarked = true
  for (const sheet of SHEETS) {
    const marks = bidder.stage3?.[sheet.key] || {}
    for (const c of sheet.criteria) {
      if (!isApplicable(c, bidder)) continue
      if (marks[c.id] === 'fail') return 'fail'
      if (!marks[c.id]) allMarked = false
    }
  }
  return allMarked ? 'pass' : null
}

export const stage3Verdict = bidder => stage3Overall(bidder) ?? 'pending'

// A seeded/legacy bidder carries only responseFileName — surface it as one document.
export function docsOf(b) {
  if (Array.isArray(b.pqDocuments) && b.pqDocuments.length > 0) return b.pqDocuments
  if (b.responseUploaded) return [{ id: `legacy-${b.id}`, name: b.responseFileName || 'Bidder response', size: 0, pageCount: null }]
  return []
}

export function hasAnyStage3Mark(bidder) {
  return SHEETS.some(s => Object.values(bidder.stage3?.[s.key] || {}).some(Boolean))
}

export function stage4Overall(bidder) {
  const marks = bidder.stage4Marks?.financial || {}
  if (FINANCIAL_CRITERIA.some(c => marks[c.id] === 'fail')) return 'fail'
  if (FINANCIAL_CRITERIA.every(c => marks[c.id])) return 'pass'
  return null
}

// The combined pre-qualification result — Stage 3, plus the financial round
// when the tender asked for one. `null` financial means "not required".
export function financialVerdict(tender, bidder) {
  if (!tender?.financialAssessmentRequired) {
    // A seeded/legacy bidder may still carry a recorded financial result.
    const legacy = bidder.stage4?.result
    return legacy ? legacy.toLowerCase() : null
  }
  return stage4Overall(bidder) ?? (bidder.stage4?.result ? bidder.stage4.result.toLowerCase() : 'pending')
}

export function computedOverall(tender, bidder) {
  const s3 = stage3Overall(bidder)
  const fin = financialVerdict(tender, bidder)
  if (s3 === 'fail' || fin === 'fail') return 'fail'
  if (s3 === 'pass' && (fin === null || fin === 'pass')) return 'pass'
  return 'pending'
}

export const overallVerdict = (tender, bidder) => bidder.pqOverallOverride?.value ?? computedOverall(tender, bidder)

export const verdictTone = v => (v === 'pass' ? 'success' : v === 'fail' ? 'danger' : 'neutral')

export function qualificationLabel(verdict) {
  if (verdict === 'pass') return 'Qualified'
  if (verdict === 'fail') return 'Not qualified'
  return 'Pending'
}

export function droppedReasonLabel(reason) {
  if (reason === 'holder_excluded') return 'Excluded by the Contract Holder'
  if (reason === 'stage3_fail' || reason === 'stage3') return 'Failed Stage 3'
  return 'No response submitted'
}

// ── Stage 1: work category + registry matching ───────────────────────────────

// The SOW analysis stands in for the real classifier: the tender's own scope
// is read for the terms that separate one registry category from another,
// title weighted over the supporting fields.
export const CATEGORY_KEYWORDS = {
  'Mechanical & Piping Works':    ['mechanical', 'piping', 'pipeline', 'valve', 'turbine', 'rotating', 'compressor', 'shutdown', 'turnaround', 'cladding', 'welding', 'pump', 'spare part'],
  'Fire & Safety Systems':        ['fire', 'extinguish', 'ppe', 'protective equipment', 'safety equipment', 'alarm', 'emergency response'],
  'Marine & Civil Works':         ['marine', 'jetty', 'quay', 'dredg', 'civil works', 'bridge', 'road', 'expressway', 'construction', 'building'],
  'Electrical & Instrumentation': ['electrical', 'instrument', 'substation', 'switchgear', 'cabling', 'scada', 'signalling', 'metering', 'power distribution'],
  'IT & Communications':          ['ict', 'digital', 'software', 'cloud', 'data centre', 'data center', 'cyber', 'telecom', 'communication', 'iot', 'information system', 'information technology', 'network', 'platform', 'automation', 'erp'],
}

export function detectWorkCategory(tender) {
  const title = (tender?.title || '').toLowerCase()
  const rest = [tender?.tenderType, tender?.department, tender?.description, tender?.workCategory]
    .filter(Boolean).join(' ').toLowerCase()
  let best = null
  let bestScore = 0
  for (const category of WORK_CATEGORIES) {
    const score = (CATEGORY_KEYWORDS[category] || []).reduce(
      (n, k) => n + (title.includes(k) ? 2 : 0) + (rest.includes(k) ? 1 : 0), 0)
    if (score > bestScore) { best = category; bestScore = score }
  }
  return best || WORK_CATEGORIES[0]
}

// Best category guess for a bidder row imported without one.
export function guessCategory(text) {
  const t = (text || '').toLowerCase()
  let best = null
  let bestScore = 0
  for (const category of WORK_CATEGORIES) {
    if (t.includes(category.toLowerCase())) return category
    const score = (CATEGORY_KEYWORDS[category] || []).reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0)
    if (score > bestScore) { best = category; bestScore = score }
  }
  return best
}

const normName = s => (s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function findRegistryBidder(row) {
  const n = normName(row.name)
  return erpBidders.find(b =>
    (n && normName(b.name) === n) ||
    (row.regNo && b.regNo && b.regNo.toLowerCase() === String(row.regNo).toLowerCase()) ||
    (row.jsrsNo && b.jsrsNo && b.jsrsNo.toLowerCase() === String(row.jsrsNo).toLowerCase())
  ) || null
}

// The bidder pool the analysis matches against: the uploaded ERP/JSRS lists,
// merged by name; or — with no list uploaded — the ERP registry on file.
export function buildRegistry(uploads = []) {
  const listed = uploads.filter(u => u.parseStatus !== 'failed' && Array.isArray(u.rows))
  if (listed.length === 0) {
    return erpBidders.map(b => ({
      bidderId: b.id, name: b.name, country: b.country, category: b.category, isLocal: b.isLocal,
      natureOfBusiness: b.natureOfBusiness, regNo: b.regNo, jsrsNo: b.jsrsNo,
      contactName: b.contactName, contactEmail: b.contactEmail,
      sourceErp: true, sourceJsrs: !!b.jsrsNo,
    }))
  }
  const byKey = new Map()
  listed.forEach(upload => {
    upload.rows.forEach(row => {
      const known = findRegistryBidder(row)
      const key = known ? `erp-${known.id}` : `new-${normName(row.name)}`
      const prev = byKey.get(key)
      const base = prev || {
        bidderId: known ? known.id : `pq-${normName(row.name).replace(/\s+/g, '-')}`,
        name: known?.name || row.name,
        country: row.country || known?.country || '',
        category: known?.category || row.category || guessCategory(`${row.category} ${row.natureOfBusiness} ${row.name}`) || 'Unclassified',
        isLocal: known ? known.isLocal : /oman/i.test(row.country || ''),
        natureOfBusiness: row.natureOfBusiness || known?.natureOfBusiness || '',
        regNo: row.regNo || known?.regNo || '',
        jsrsNo: row.jsrsNo || known?.jsrsNo || '',
        contactName: row.contactName || known?.contactName || '',
        contactEmail: row.contactEmail || known?.contactEmail || '',
        sourceErp: false,
        sourceJsrs: false,
      }
      if (upload.documentType === 'erp') base.sourceErp = true
      if (upload.documentType === 'jsrs') base.sourceJsrs = true
      if (!base.jsrsNo && row.jsrsNo) base.jsrsNo = row.jsrsNo
      byKey.set(key, base)
    })
  })
  return [...byKey.values()]
}

export function matchRegistry(tender, registry) {
  const category = detectWorkCategory(tender)
  const keywords = CATEGORY_KEYWORDS[category] || []
  const title = tender?.title || 'this tender'
  const scored = registry.map(b => {
    const text = `${b.natureOfBusiness} ${b.name}`.toLowerCase()
    const hits = keywords.filter(k => text.includes(k)).length
    const categoryMatch = b.category === category
    return { b, categoryMatch, score: (categoryMatch ? 10 : 0) + hits + (b.isLocal ? 0.5 : 0) + (b.sourceJsrs ? 0.25 : 0) }
  })
  const recommended = scored.filter(s => s.categoryMatch).sort((x, y) => y.score - x.score || x.b.name.localeCompare(y.b.name))
  const rank = new Map(recommended.map((s, i) => [s.b.bidderId, i + 1]))
  const sow = tender?.sowFileName ? ` (${tender.sowFileName})` : ''
  return {
    category,
    matches: scored.map(({ b, categoryMatch }) => {
      const r = rank.get(b.bidderId) ?? null
      const rationale = categoryMatch
        ? `Strong match for ${category} — The Statement of Work${sow} for "${title}" reads as ${category} scope. ` +
          `${b.name} is registered under ${b.category}${b.natureOfBusiness ? ` (${b.natureOfBusiness})` : ''}` +
          `${b.jsrsNo ? `, holds JSRS registration ${b.jsrsNo}` : ''}` +
          `${b.isLocal ? ' and is an Omani-registered supplier, supporting the tender\'s LC targets' : ''}. ` +
          `Ranked #${r} of ${recommended.length} on scope fit${b.isLocal ? ' and local content' : ''}.`
        : `Not recommended — Registered under ${b.category || 'no category'}, outside this tender's ${category} scope. ` +
          'Include it manually if there are other grounds to invite this bidder.'
      return {
        id: `m-${b.bidderId}`,
        ...b,
        recommended: categoryMatch,
        recommendationRank: r,
        recommendationRationale: rationale,
        selected: categoryMatch,
      }
    }),
  }
}

// What a Stage 3 row looks like for a bidder taken off the confirmed shortlist.
export function bidderRowFromMatch(m) {
  return {
    id: m.bidderId,
    name: m.name,
    country: m.country,
    category: m.category,
    isLocal: !!m.isLocal,
    sourceErp: !!m.sourceErp,
    sourceJsrs: !!m.sourceJsrs,
    regNo: m.regNo || '',
    jsrsNo: m.jsrsNo || '',
    contactName: m.contactName || '',
    contactEmail: m.contactEmail || '',
    responseUploaded: false,
    pqDocuments: [],
    stage3: emptyStage3(),
  }
}

// The registry a tender's Stage 1 ran against — or, for a tender that predates
// the persisted run, the ERP registry on file.
export function tenderMatches(tender) {
  if (Array.isArray(tender?.pqMatches) && tender.pqMatches.length > 0) return tender.pqMatches
  return buildRegistry([]).map(b => ({ id: `m-${b.bidderId}`, ...b, recommended: false, recommendationRank: null, recommendationRationale: '', selected: false }))
}

// ── Stage 2: questionnaire generation ────────────────────────────────────────

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

function parseBudget(tender) {
  const n = Number(String(tender?.budget || '').replace(/[^0-9.]/g, ''))
  return Number.isFinite(n) ? n : 0
}

// Deterministic stand-in for MAIN's "Generate with AI": every field gets a
// value derived from the tender (source 'system') or drafted (source 'ai').
export function generateQuestionnaireAnswers(fields, tender) {
  const years = parseBudget(tender) >= 1000000 ? 10 : 5
  const scope = tender?.workCategory || detectWorkCategory(tender) || ''
  const answers = []
  const sources = []
  fields.forEach(f => {
    const d = (f.defaultText || '').trim().toLowerCase()
    if (/specify|field|scope|discipline|category/.test(d)) {
      answers.push(scope || f.defaultText)
      sources.push('system')
    } else if (/^\[?x\]?$|^\d+$/.test(d)) {
      answers.push(d === String(years) ? `${years} (${NUMBER_WORDS[years]})` : String(years))
      sources.push('ai')
    } else if (NUMBER_WORDS.includes(d)) {
      answers.push(`${NUMBER_WORDS[years]} (${years})`)
      sources.push('ai')
    } else if (/name|company|tender|title/.test(d)) {
      answers.push(tender?.title || f.defaultText)
      sources.push('system')
    } else if (/date|deadline/.test(d)) {
      answers.push(tender?.deadline || f.defaultText)
      sources.push('system')
    } else {
      answers.push(`${f.defaultText} — as required for ${tender?.title || 'this tender'}`)
      sources.push('ai')
    }
  })
  return { answers, sources }
}

// The template's own prose carries "[Tender Number]" / "[Tender Title]"
// placeholders, usually split across several docx runs. MAIN arrives with
// those already filled from the CIF, so the generator writes them as prose
// edits: the replacement goes into the run holding the "[" and the other runs
// the token spanned are blanked. Returns { [textIndex]: string }.
const PROSE_TOKEN_RX = /\[\s*tender\s+(number|title)\s*\]/i
export function prefillQuestionnaireProse(texts, tender) {
  const parts = (texts || []).map(t => t?.text ?? '')
  const original = [...parts]
  const values = { number: tender?.costCode || tender?.id || '', title: tender?.title || '' }
  for (let guard = 0; guard < 50; guard++) {
    const joined = parts.join('')
    const m = joined.match(PROSE_TOKEN_RX)
    const value = m && values[m[1].toLowerCase()]
    if (!m || !value) break
    const isUpper = m[0] === m[0].toUpperCase()
    const replacement = isUpper ? value.toUpperCase() : value
    const start = m.index
    const end = m.index + m[0].length
    let offset = 0
    let first = -1
    parts.forEach((p, i) => {
      const pStart = offset
      const pEnd = offset + p.length
      offset = pEnd
      if (pEnd <= start || pStart >= end) return
      const keepHead = p.slice(0, Math.max(0, start - pStart))
      const keepTail = p.slice(Math.max(0, end - pStart))
      if (first === -1) {
        first = i
        parts[i] = keepHead + replacement + (pEnd >= end ? keepTail : '')
      } else {
        parts[i] = pEnd >= end ? keepTail : ''
      }
    })
  }
  const edits = {}
  parts.forEach((p, i) => { if (p !== original[i]) edits[i] = p })
  return edits
}

// ── Stage 3 / 4: AI evaluation stand-ins ─────────────────────────────────────

let aiEvaluationsCount = 0

// AI's first-pass evaluation of one bidder's response documents. The first two
// bidders evaluated default to all-pass so a demo always has a qualifier; after
// that, a missing-evidence fail is drawn now and then.
export function generateAiStage3(bidder) {
  aiEvaluationsCount++
  const forcePass = aiEvaluationsCount <= 2
  const docs = (bidder.pqDocuments || []).map(d => d.name)
  const cite = docs.length ? ` (${docs.slice(0, 2).join(', ')}${docs.length > 2 ? ', …' : ''})` : ''
  const marks = emptyStage3()
  const reasons = emptyStage3()
  SHEETS.forEach(sheet => {
    sheet.criteria.filter(c => isApplicable(c, bidder)).forEach(c => {
      if (!forcePass && Math.random() < 0.15) {
        marks[sheet.key][c.id] = 'fail'
        reasons[sheet.key][c.id] = `No evidence for "${c.item}" was found in the submitted response${cite} — ${c.detail}`
      } else {
        marks[sheet.key][c.id] = 'pass'
        reasons[sheet.key][c.id] = `Evidence for "${c.item}" found in the submitted response${cite}.`
      }
    })
  })
  return { marks, reasons }
}

let aiFinancialCount = 0

export function generateAiStage4() {
  aiFinancialCount++
  const forcePass = aiFinancialCount <= 2
  const marks = {}
  const reasons = {}
  FINANCIAL_CRITERIA.forEach(c => {
    if (!forcePass && Math.random() < 0.2) {
      marks[c.id] = 'fail'
      reasons[c.id] = 'AI flagged a shortfall against this financial criterion in the submitted statements.'
    } else {
      marks[c.id] = 'pass'
    }
  })
  return { marks: { financial: marks }, reasons: { financial: reasons } }
}

export const today = () => new Date().toISOString().split('T')[0]
