import {
  DollarSign, ShieldAlert, BarChart3, ClipboardList, ClipboardCheck, Users, UserCheck,
} from 'lucide-react'
import { tenderRef } from './tenderRef'

/*
 * Strategy Templates — field definitions, AI pre-fill generators and the
 * register rules ported from tender-management-frontend (MAIN):
 *   - field sets follow MAIN's per-template mocks (mock/*.ts) and the client
 *     xlsx column structure; dataKeys stay the prototype's so every reader
 *     (Sidebar, PSF, ITT, exports) keeps working;
 *   - validation/limits/messages mirror ArtefactRowFields.tsx,
 *     use-register-validation.ts and technical-evaluation/score-zero.ts.
 *
 * Rows are plain objects keyed by field id, plus private meta keys:
 *   _id (stable row id), _source ('ai' | 'manual' | 'imported'),
 *   _confidence (0..1 AI score) and _band ('high' | 'medium' | 'low').
 */

/* ─── Numbers ─── */

const DECIMAL_PATTERN = /^(\d+(\.\d+)?|\.\d+)$/

/** A plain non-negative decimal as a number, or null when blank/invalid. */
export function parseDecimal(value) {
  const trimmed = String(value ?? '').trim().replace(/,/g, '')
  if (!DECIMAL_PATTERN.test(trimmed)) return null
  return Number(trimmed)
}

export function formatAmount(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return ''
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/* ─── Risk levels (utils/risk-level.ts) ─── */

/** Text colour for a Low/Medium/High value — shared by the computed boxes and
 * the "Overall Risk" pill; the background stays neutral. */
export function riskLevelTextClass(value) {
  if (value === 'Low') return 'text-emerald-600'
  if (value === 'Medium') return 'text-amber-600'
  if (value === 'High') return 'text-red-600'
  return 'text-slate-800'
}

const RISK_ORDER = ['Low', 'Medium', 'High']

/** The register's rollup: the highest risk level any row reaches. */
export function overallRiskLevel(levels) {
  let best = -1
  levels.forEach(level => { best = Math.max(best, RISK_ORDER.indexOf(level)) })
  return best === -1 ? '' : RISK_ORDER[best]
}

/** HSE "RISK H/M/L" from the RAM code (e.g. "P-2C"): severity 0–5 × likelihood A–E. */
export function riskLevelFromRam(ram) {
  const match = String(ram ?? '').trim().toUpperCase().match(/(\d)\s*([A-E])\s*$/)
  if (!match) return ''
  const score = Number(match[1]) * ('ABCDE'.indexOf(match[2]) + 1)
  if (score <= 4) return 'Low'
  if (score <= 9) return 'Medium'
  return 'High'
}

/* ─── Field definitions ─── */

const COMPANY_ESTIMATE_FIELDS = [
  { id: 'itemDescription', label: 'Item / Service Description', type: 'text', required: true, placeholder: 'e.g. Supply of Gas Turbine Filters', span: 2 },
  { id: 'quantity', label: 'Est. Quantity', type: 'number', required: true, placeholder: 'e.g. 10' },
  { id: 'unit', label: 'UOM (Unit of Measure)', type: 'text', required: true, placeholder: 'e.g. Each, Lot, Set' },
  { id: 'unitRate', label: 'Unit Price (price of 1 piece)', type: 'number', required: true, placeholder: 'e.g. 5000' },
  { id: 'contingency', label: 'Contingency %', type: 'number', placeholder: 'e.g. 10' },
  {
    id: 'totalEstimate', label: 'Total Price (1 piece × quantity)', type: 'computed',
    compute: row => {
      const quantity = parseDecimal(row.quantity)
      const unitPrice = parseDecimal(row.unitRate)
      return quantity === null || unitPrice === null ? '' : formatAmount(quantity * unitPrice)
    },
  },
  { id: 'benchmarkUnitPrice', label: 'Benchmark Unit Price', type: 'number', required: true, placeholder: 'e.g. 4800' },
  { id: 'benchmarkPercentageDifference', label: 'Percentage % Difference', type: 'text', required: true, placeholder: 'e.g. +4.2%' },
  { id: 'benchmarkSource', label: 'Source of Benchmark', type: 'text', required: true, placeholder: 'e.g. Previous contract rates, market survey', span: 2 },
  { id: 'remarks', label: 'Remarks / Assumptions', type: 'text', placeholder: 'Any assumptions or notes', span: 2 },
]

export function contractRiskLevel(row) {
  if (!row.likelihood || !row.impact) return ''
  if (row.likelihood === 'High' && row.impact === 'High') return 'High'
  if (row.likelihood === 'Low' && row.impact === 'Low') return 'Low'
  return 'Medium'
}

const CONTRACT_RISK_FIELDS = [
  { id: 'riskCategory', label: 'Risk Category', type: 'select', required: true, options: ['Commercial', 'Technical', 'Operational', 'Schedule', 'Legal', 'HSE'] },
  { id: 'activity', label: 'Activity', type: 'text', required: true, placeholder: 'e.g. Contract Award & Procurement' },
  { id: 'riskDescription', label: 'Contract Risk Description', type: 'text', required: true, placeholder: 'Describe the identified contract risk', span: 2 },
  { id: 'consequence', label: 'Credible Potential Consequence', type: 'text', required: true, placeholder: 'Potential impact or consequence if the risk materialises', span: 2 },
  { id: 'likelihood', label: 'Risk Likelihood', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
  { id: 'impact', label: 'Risk Impact', type: 'select', required: true, options: ['Low', 'Medium', 'High'] },
  { id: 'riskScore', label: 'Risk Score (RAM)', type: 'text', placeholder: 'e.g. M-5' },
  { id: 'riskRating', label: 'Risk Level (H/M/L)', type: 'computed', riskLevel: true, compute: contractRiskLevel },
  { id: 'owner', label: 'Risk Owner / Manager', type: 'text', placeholder: 'e.g. Contract Holder / Manager' },
  { id: 'mitigation', label: 'Existing Mitigation and Controls and where Included', type: 'text', required: true, placeholder: 'Existing controls and clause/document references', span: 2 },
  { id: 'additionalMitigation', label: 'Additional Mitigation and Controls and where to be Included', type: 'text', placeholder: 'Additional planned mitigations and where they will be included', span: 2 },
]

const ICV_FIELDS = [
  { id: 'icvCategory', label: 'ICV Category', type: 'select', required: true, options: [
    'Local Fabrication',
    'Omanisation (Skilled)',
    'Local Subcontracting',
    'Materials Procurement',
    'Training & Development',
  ] },
  { id: 'description', label: 'Description / Commitment', type: 'text', required: true, placeholder: 'e.g. Local fabrication of spool pieces at Sohar facility', span: 2 },
  { id: 'plannedSpend', label: 'Planned Contract Spend', type: 'number', required: true, placeholder: 'e.g. 500000' },
  { id: 'icvSpend', label: 'In-Country Spend', type: 'number', required: true, placeholder: 'e.g. 350000' },
  {
    id: 'icvPercent', label: 'ICV %', type: 'computed',
    compute: row => {
      const planned = parseDecimal(row.plannedSpend)
      const inCountry = parseDecimal(row.icvSpend)
      if (!planned || inCountry === null) return ''
      return `${((inCountry / planned) * 100).toFixed(1)}%`
    },
  },
  { id: 'targetPercent', label: 'Target ICV %', type: 'number', placeholder: 'e.g. 40' },
  {
    id: 'icvStatus', label: 'Against Target', type: 'computed',
    compute: row => {
      const planned = parseDecimal(row.plannedSpend)
      const inCountry = parseDecimal(row.icvSpend)
      const target = parseDecimal(row.targetPercent)
      if (!planned || inCountry === null || target === null) return ''
      const diff = (inCountry / planned) * 100 - target
      return diff >= 0 ? `Meets target (+${diff.toFixed(1)}%)` : `Below target (${diff.toFixed(1)}%)`
    },
  },
  { id: 'omaniHeadcount', label: 'Omani Headcount Committed', type: 'number', placeholder: 'e.g. 12' },
  { id: 'evidence', label: 'Evidence / Verification Basis', type: 'text', placeholder: 'e.g. Certificate of Omani origin, MOL records', span: 2 },
]

export const TEM_PART_OPTIONS = ['Part 1: QHSE', 'Part 2: Contract-Specific', 'Part 3: Contract-Generic']

/** "Must — set min score" is the gate a Must criterion shows until it has one. */
export const isUnsetMustGate = value => /set min score/i.test(String(value || ''))

// Mirrors "Appendix I — Technical Evaluation Model Template" plus MAIN's
// Score 0 band (`band_0`), which every Want needs before the ITT is issued.
const TECHNICAL_EVAL_MATRIX_FIELDS = [
  { id: 'part', label: 'Part', type: 'select', required: true, options: TEM_PART_OPTIONS },
  { id: 'criteriaType', label: 'Must / Want', type: 'select', required: true, options: ['Must', 'Want'] },
  { id: 'criterion', label: 'Criterion', type: 'text', required: true, placeholder: 'e.g. Methodology Statement — manner and sequence of executing the Work', span: 2 },
  { id: 'weight', label: 'Weight', type: 'number', required: true, placeholder: 'e.g. 10' },
  { id: 'minScore', label: 'Min. Score (Musts only)', type: 'number', placeholder: 'e.g. 2' },
  { id: 'band0', label: 'Score 0 — Description', type: 'text', placeholder: 'e.g. No submission, or submission does not address the requirement', span: 2 },
  { id: 'band1', label: 'Score 1 — Description', type: 'text', placeholder: 'e.g. Submission shows lack of understanding of Work', span: 2 },
  { id: 'band2', label: 'Score 2 — Description', type: 'text', placeholder: 'e.g. Submission shows a competent understanding of Work', span: 2 },
  { id: 'band3', label: 'Score 3 — Description', type: 'text', placeholder: 'e.g. Submission shows a detailed understanding of Work', span: 2 },
  {
    id: 'maxWeighted', label: 'Max Weighted Score', type: 'computed',
    compute: row => {
      const weight = parseDecimal(row.weight)
      return weight ? formatAmount(weight * 3) : ''
    },
  },
  {
    id: 'gate', label: 'Gate', type: 'computed',
    compute: row => {
      if (row.criteriaType === 'Must') {
        return String(row.minScore ?? '').trim() ? `Must — min ${String(row.minScore).trim()}` : 'Must — set min score'
      }
      if (row.criteriaType === 'Want') return 'Want — no minimum'
      return ''
    },
  },
]

// MAIN's HSE register = the client's "HSE Risk Assessment.xlsx" Risk Register
// sheet, column for column (mock/hse-risk.ts `Hazard`).
const HSE_RISK_FIELDS = [
  { id: 'activity', label: 'Activity', type: 'text', required: true, placeholder: 'e.g. Equipment Installation at Elevated Platforms', span: 2 },
  { id: 'riskDescription', label: 'HSSE Risk Description', type: 'text', required: true, placeholder: 'Describe the HSSE risk', span: 2 },
  { id: 'potentialConsequences', label: 'Credible Potential Consequences', type: 'text', required: true, placeholder: 'Credible potential consequence if the risk materialises', span: 2 },
  { id: 'ram', label: 'RAM', type: 'text', required: true, placeholder: 'e.g. P-2C' },
  { id: 'riskLevel', label: 'Risk H/M/L', type: 'computed', riskLevel: true, compute: row => riskLevelFromRam(row.ram) },
  { id: 'riskOwner', label: 'Risk Owner / Manager', type: 'text', placeholder: 'e.g. Site HSE Officer' },
  { id: 'existingControls', label: 'Existing Mitigation and Controls and where Included', type: 'text', required: true, placeholder: 'Current controls and where they are included', span: 2 },
  { id: 'additionalControls', label: 'Additional Mitigation and Controls and where to be Included', type: 'text', placeholder: 'Extra measures and where they will be included', span: 2 },
  { id: 'monitoringActivities', label: 'Integrity Assurance / Monitoring Activities', type: 'text', placeholder: 'e.g. Weekly harness and anchor point inspection', span: 2 },
]

const NEGOTIATION_STRATEGY_FIELDS = [
  { id: 'theme', label: 'Theme', type: 'text', required: true, placeholder: 'e.g. Cost Price, Liquidated Damages, Payments' },
  { id: 'negotiationPoints', label: 'Negotiation Points', type: 'text', required: true, placeholder: 'Describe the points of negotiation', span: 2 },
  { id: 'aspiration', label: 'Aspiration', type: 'text', placeholder: 'Best possible outcome' },
  { id: 'target', label: 'Target', type: 'text', required: true, placeholder: 'Realistic target' },
  { id: 'walkAway', label: 'Walk-Away', type: 'text', required: true, placeholder: 'Minimum acceptable outcome' },
  { id: 'finalAchievement', label: 'Final Negotiation Achievement', type: 'text', locked: true, placeholder: 'Updated post-negotiation' },
]

/* ─── Template definitions (shape kept for Sidebar / PSF / ITT) ─── */

export const TEMPLATE_DEFS = [
  {
    id: 'company-estimate',
    title: 'Company Estimate',
    description: 'Estimate project costs, quantities, unit rates, and contingencies.',
    icon: DollarSign,
    color: '#0089cf',
    tone: 'success',
    fields: COMPANY_ESTIMATE_FIELDS,
    dataKey: 'companyEstimate',
    rowLabel: 'Line Item',
    fileUrl: '/templates/COMPANY ESTIMATE (1).xlsx',
    fileType: 'excel',
  },
  {
    id: 'contract-risk',
    title: 'Contract Risk Assessment',
    description: 'Identify, evaluate and plan mitigations for contract risks.',
    icon: ShieldAlert,
    color: '#0089cf',
    tone: 'danger',
    fields: CONTRACT_RISK_FIELDS,
    dataKey: 'contractRiskAssessment',
    rowLabel: 'Risk',
    fileUrl: '/templates/Contract Risk Assessment.xlsx',
    fileType: 'excel',
  },
  {
    id: 'icv',
    title: 'LC',
    description: 'Plan Local Content: local sourcing, Omanisation and in-Oman investment.',
    icon: BarChart3,
    color: '#0089cf',
    tone: 'primary',
    fields: ICV_FIELDS,
    dataKey: 'icvPlan',
    rowLabel: 'Commitment',
    fileType: 'excel',
  },
  {
    id: 'technical-eval-matrix',
    title: 'Technical Evaluation Matrix',
    description: 'Define weighted Must/Want criteria and scoring bands for technical evaluation.',
    icon: ClipboardList,
    color: '#0089cf',
    tone: 'teal',
    fields: TECHNICAL_EVAL_MATRIX_FIELDS,
    dataKey: 'technicalEvalMatrix',
    rowLabel: 'Criterion',
    fileUrl: '/templates/Appendix I - Technical Evaluation Model Template.xls',
    fileType: 'excel',
  },
  {
    id: 'hse-risk',
    title: 'HSE Risk Assessment',
    description: 'Identify hazards and assess HSE risks with control measures.',
    icon: ClipboardCheck,
    color: '#0089cf',
    tone: 'warning',
    fields: HSE_RISK_FIELDS,
    dataKey: 'hseRiskAssessment',
    rowLabel: 'Hazard',
    fileUrl: '/templates/HSE Risk Assessment.xlsx',
    fileType: 'excel',
  },
  {
    id: 'negotiation-strategy',
    title: 'Negotiation Strategy',
    description: 'Plan aspirations, targets, and walk-away points for negotiations.',
    icon: Users,
    color: '#0089cf',
    tone: 'violet',
    fields: NEGOTIATION_STRATEGY_FIELDS,
    dataKey: 'negotiationStrategy',
    rowLabel: 'Negotiation Point',
    fileType: 'word', // rendered as a generated Word document (no source file)
  },
]

export const PRE_QUAL_ID = 'pre-qual'
export const TEM_ID = 'technical-eval-matrix'

/** Templates every tender includes whatever the user picks (MAIN's MANDATORY_TEMPLATE_KEYS). */
export const MANDATORY_TEMPLATE_IDS = new Set([TEM_ID])

/** The seven Yes/No documents, in MAIN's order (mock/strategy-templates.ts). */
export const STRATEGY_DOCUMENTS = [
  ...TEMPLATE_DEFS.map(t => ({ id: t.id, label: t.title, description: t.description, icon: t.icon, isWorkflow: false })),
  {
    id: PRE_QUAL_ID,
    label: 'Pre-Qualification Document',
    description: 'Run the full bidder pre-qualification process - match, evaluate, and shortlist bidders.',
    icon: UserCheck,
    isWorkflow: true,
  },
]

export const findTemplateDef = id => TEMPLATE_DEFS.find(t => t.id === id) || null

/** Ids the tender includes — the stored selection plus every mandatory template. */
export function includedTemplateIds(tender) {
  const stored = Array.isArray(tender?.selectedTemplates)
    ? tender.selectedTemplates
    : STRATEGY_DOCUMENTS.map(d => d.id)
  return STRATEGY_DOCUMENTS.map(d => d.id).filter(id => stored.includes(id) || MANDATORY_TEMPLATE_IDS.has(id))
}

/* ─── Completion ─── */

/** Pre-Qualification is finished once the tender has left the prequal_* stages
 * (TARGET's PQ completion moves it to `draft`), or a PQ lane flag says so. */
export function isPreQualFinalised(tender) {
  if (!tender) return false
  if (tender.prequalCompleted === true || tender.prequalFinalised === true) return true
  const status = tender.status || ''
  return status !== '' && status !== 'cif_draft' && !status.startsWith('prequal_')
}

/** Past Stage 3 the card re-enters the PQ flow at Final Review (MAIN pqqCardAction). */
export const isPreQualAtFinalReview = tender =>
  tender?.status === 'prequal_stage4' || tender?.status === 'prequal_final_review'

/** A form template is completed once submitted (templateMeta[id].submittedAt);
 * seeded tenders without meta still count when their rows are non-empty. */
export function isTemplateComplete(tender, id) {
  if (!tender) return false
  if (id === PRE_QUAL_ID) return isPreQualFinalised(tender)
  if (tender.templateMeta?.[id]?.submittedAt) return true
  const def = findTemplateDef(id)
  return def ? (tender[def.dataKey]?.length || 0) > 0 : false
}

/* ─── Auto-generate confirmation (lib/use-auto-generate-confirm.tsx) ─── */

export const AUTO_GENERATE_CONFIRM_TITLE = 'Open the AI-powered form?'
export const AUTO_GENERATE_CONFIRM_DESCRIPTION =
  'The AI will pre-fill this template for your review. The whole application will be disabled until it finishes.'

export const templateFormHref = (tenderId, templateId, autogen = false) =>
  `/strategy-templates/${tenderId}?form=${templateId}${autogen ? '&autogen=1' : ''}`

/* ─── Generation narration (lib/use-decorative-generation-steps.ts) ─── */

export function artefactRegisterGenerationSteps(rowLabel) {
  const row = String(rowLabel || 'Row').toLowerCase()
  return [
    'Reviewing the contract and CIF details',
    `Identifying candidate ${row}s`,
    `Drafting ${row} details with AI`,
    'Cross-checking against compliance requirements',
    'Finalising the register',
  ]
}

/* ─── Field rules (ArtefactRowFields.tsx) ─── */

export const EMPTY_VALUE_TEXT = 'NA'
export const ARTEFACT_SHORT_TEXT_MAX_LENGTH = 100
export const ARTEFACT_LONG_TEXT_MAX_LENGTH = 2000
const MAX_NUMERIC_FIELD_INTEGER_DIGITS = 13
const SHORT_TEXT_FIELD_PATTERN = /(^|[\s_])(uom|unit of measure)($|[\s_])/i
const QUANTITY_FIELD_PATTERN = /quantity/i

const fieldText = field => `${field.id} ${field.label}`

export function isNumericField(field) {
  return field.type === 'number' || /(quantity|unit\s*price|benchmark.*price)/i.test(fieldText(field))
}

/** Long answers get a two-row textarea; everything else stays single-line. */
export function isMultilineField(field) {
  return /(risk description|description|commitment|criterion|criteria|consequence|mitigation|control|remark|assumption|note|comment|rationale|justification)/i.test(fieldText(field))
}

export function fieldTextLimit(field) {
  return SHORT_TEXT_FIELD_PATTERN.test(fieldText(field)) ? ARTEFACT_SHORT_TEXT_MAX_LENGTH : ARTEFACT_LONG_TEXT_MAX_LENGTH
}

export function isTextAtLimit(field, value) {
  if (field.type === 'computed' || field.type === 'select' || isNumericField(field)) return false
  return String(value ?? '').length >= fieldTextLimit(field)
}

/** Caps the integer part of a typed amount at 13 digits (a number input ignores maxLength). */
export function capNumericValue(value) {
  const separatorIndex = value.indexOf('.')
  if (separatorIndex === -1) return value.slice(0, MAX_NUMERIC_FIELD_INTEGER_DIGITS)
  return value.slice(0, separatorIndex).slice(0, MAX_NUMERIC_FIELD_INTEGER_DIGITS) + value.slice(separatorIndex)
}

/** What is wrong with a typed numeric value (QA Bug 22), or undefined. */
export function numericFieldError(field, value) {
  if (!isNumericField(field)) return undefined
  const trimmed = String(value ?? '').trim()
  if (trimmed === '') return undefined
  const isQuantity = QUANTITY_FIELD_PATTERN.test(fieldText(field))
  if (/^-(\d+(\.\d+)?|\.\d+)$/.test(trimmed)) {
    return isQuantity ? `${field.label} must be greater than 0.` : `${field.label} cannot be negative.`
  }
  if (!DECIMAL_PATTERN.test(trimmed)) return `Enter ${field.label} as a number, such as 12.55.`
  if (isQuantity && Number(trimmed) === 0) return `${field.label} must be greater than 0.`
  return undefined
}

/** A select's options plus a stored value that is no longer one of them. */
export function optionsWithCurrent(options, current) {
  if (!current || options.includes(current)) return [...options]
  return [current, ...options]
}

/** Every invalid `rowId:fieldId` (use-register-validation.ts collectInvalidArtefactFields). */
export function collectInvalidFields(rows, fields, { extraRule, isFieldLocked } = {}) {
  const invalid = new Set()
  rows.forEach(row => {
    fields.forEach(field => {
      if (field.type === 'computed' || isFieldLocked?.(field)) return
      const value = String(row[field.id] ?? '')
      const key = `${row._id}:${field.id}`
      if (isTextAtLimit(field, value)) { invalid.add(key); return }
      if (value.trim() === '') {
        if (field.required) invalid.add(key)
        return
      }
      if (numericFieldError(field, value) !== undefined || extraRule?.(field, value) !== undefined) invalid.add(key)
    })
  })
  return invalid
}

/* ─── Technical Evaluation Matrix (technical-evaluation/score-zero.ts) ─── */

export const SCORE_ZERO_FIELD_ID = 'band0'
export const SCORE_ZERO_WARNING = 'A Want needs a Score 0 description before the ITT can be issued.'
export const PASSING_SCORE_RANGE_MESSAGE = 'Enter the passing score as a number from 1 to 100.'

export const isScoreZeroRequired = row => row?.criteriaType === 'Want'
export const isScoreZeroMissing = row =>
  isScoreZeroRequired(row) && String(row?.[SCORE_ZERO_FIELD_ID] ?? '').trim() === ''

export function validateTemField(field, value) {
  if (field.id !== 'weight') return undefined
  const trimmed = String(value ?? '').trim()
  if (trimmed === '' || Number(trimmed) > 0) return undefined
  return 'Weight must be greater than 0.'
}

export const isValidPassingScore = value =>
  /^\d{1,3}$/.test(value) && Number(value) >= 1 && Number(value) <= 100

/** Weight per Part (in Part order) and the total across every criterion. */
export function temWeightings(rows) {
  const sections = {}
  let total = 0
  let hasAny = false
  rows.forEach(row => {
    const weight = parseDecimal(row.weight)
    if (weight === null) return
    hasAny = true
    total += weight
    const part = row.part || 'Unassigned'
    sections[part] = (sections[part] || 0) + weight
  })
  const ordered = {}
  ;[...TEM_PART_OPTIONS, ...Object.keys(sections)].forEach(part => {
    if (sections[part] !== undefined && ordered[part] === undefined) ordered[part] = Number(sections[part].toFixed(2))
  })
  return { sections: ordered, total: hasAny ? Number(total.toFixed(2)) : null }
}

/* ─── Rows ─── */

let rowSequence = 0
/** Only called from event handlers / timers, never during render. */
export const nextRowId = () => `row-${Date.now().toString(36)}-${(rowSequence += 1)}`

export function emptyRow(template) {
  const row = { _id: nextRowId(), _source: 'manual' }
  template.fields.forEach(f => { if (f.type !== 'computed') row[f.id] = '' })
  return row
}

/** Saved rows given stable ids (deterministic, so it is safe during render). */
export function normaliseRows(rows, templateId) {
  return (Array.isArray(rows) ? rows : []).map((row, index) => (
    row && row._id ? row : { ...row, _id: `${templateId}-saved-${index}` }
  ))
}

export function confidenceBand(score) {
  if (score === null || score === undefined) return null
  if (score >= 0.8) return 'high'
  if (score >= 0.6) return 'medium'
  return 'low'
}

/** Whole-percentage AI score, rounded down (ConfidenceBadge formatConfidence). */
export const formatConfidence = score => `${Math.floor(score * 100 + 1e-9)}%`

// Deterministic AI confidences, so the same template always scores alike.
const CONFIDENCE_SEQUENCE = [0.93, 0.86, 0.74, 0.88, 0.67, 0.58, 0.91, 0.81]

/* ─── AI pre-fill (MAIN per-template mocks) ─── */

function aiSeedRows(templateId, tender) {
  const title = tender?.title || 'the contract'
  const budget = tender?.budget || 'the approved budget'
  switch (templateId) {
    case 'company-estimate':
      return [
        { itemDescription: `Primary equipment supply for ${title}`, quantity: '5', unit: 'Each', unitRate: '12000', contingency: '10', benchmarkUnitPrice: '12500', benchmarkPercentageDifference: '-4%', benchmarkSource: 'Global Equipment Index 2024', remarks: 'Based on similar contract benchmarks and market analysis' },
        { itemDescription: 'Installation & commissioning services', quantity: '1', unit: 'Lump Sum', unitRate: '35000', contingency: '15', benchmarkUnitPrice: '33000', benchmarkPercentageDifference: '+6%', benchmarkSource: 'Oman Contractor Rates Q3', remarks: 'Includes mobilisation, testing and handover' },
        { itemDescription: 'Technical supervision & quality assurance', quantity: '120', unit: 'Days', unitRate: '450', contingency: '5', benchmarkUnitPrice: '460', benchmarkPercentageDifference: '-2%', benchmarkSource: 'Regional Engineering Salary Guide', remarks: 'Based on estimated project duration' },
      ]
    case 'contract-risk':
      return [
        { riskCategory: 'Commercial', activity: 'Contract Award & Procurement', riskDescription: 'Price volatility of raw materials affecting contract cost estimation.', consequence: 'Cost overrun exceeding approved budget threshold.', likelihood: 'Medium', impact: 'High', riskScore: 'M-5', owner: 'Commercial Manager', mitigation: 'Fixed-price capping clause and index-linked adjustment mechanism.', additionalMitigation: 'Regular market price monitoring and early material locking.' },
        { riskCategory: 'Technical', activity: 'Engineering & Design Review', riskDescription: 'Delay in technical clarification response from contractor.', consequence: 'Project execution delay and rework during construction.', likelihood: 'Low', impact: 'Medium', riskScore: 'L-3', owner: 'Technical Lead', mitigation: 'SLA for technical queries and mandatory weekly clarification meetings.', additionalMitigation: 'Dedicated senior technical coordinator assigned to contract.' },
        { riskCategory: 'Operational', activity: 'Site Mobilisation & Setup', riskDescription: 'Inadequate contractor workforce availability during peak periods.', consequence: 'Schedule slippage in key project milestones.', likelihood: 'Medium', impact: 'Medium', riskScore: 'M-4', owner: 'Contract Holder', mitigation: 'Pre-qualification manpower audit and required key personnel commitment.', additionalMitigation: 'Bi-weekly resource tracking and manpower mobilization ramp-up plan.' },
        { riskCategory: 'Schedule', activity: 'Long-lead Items Procurement', riskDescription: `Global supply chain disruption for specialized equipment on ${title}.`, consequence: 'Commissioning deadline missed by 2-3 months.', likelihood: 'High', impact: 'High', riskScore: 'H-8', owner: 'Supply Chain Lead', mitigation: 'Early purchase order placement and dual-vendor strategy.', additionalMitigation: 'Expedited shipping agreement and factory acceptance test acceleration.' },
      ]
    case 'icv':
      return [
        { icvCategory: 'Local Fabrication', description: 'Local fabrication of spool pieces at Sohar facility', plannedSpend: '500000', icvSpend: '350000', targetPercent: '40', omaniHeadcount: '12', evidence: 'Certificate of Omani origin, MOL records' },
        { icvCategory: 'Omanisation (Skilled)', description: 'Hiring of skilled Omani technicians for site works', plannedSpend: '200000', icvSpend: '180000', targetPercent: '20', omaniHeadcount: '8', evidence: 'MOL records, Payroll data' },
        { icvCategory: 'Local Subcontracting', description: 'Subcontracting civil works to local SMEs', plannedSpend: '150000', icvSpend: '150000', targetPercent: '15', omaniHeadcount: '25', evidence: 'Subcontractor agreements, SME certificates' },
        { icvCategory: 'Materials Procurement', description: 'Sourcing cement and steel from local manufacturers', plannedSpend: '100000', icvSpend: '100000', targetPercent: '10', omaniHeadcount: '0', evidence: 'Invoices, Delivery notes' },
      ]
    case 'technical-eval-matrix':
      return [
        { part: 'Part 1: QHSE', criteriaType: 'Must', criterion: 'Contractor HSE Capability Assessment: response to the HSE Capability Questionnaire', weight: '25', minScore: '2', band0: 'No response to the HSE Capability Questionnaire', band1: 'Red banded', band2: 'Amber banded', band3: 'Green banded' },
        { part: 'Part 2: Contract-Specific', criteriaType: 'Must', criterion: 'Methodology Statement: manner and sequence of carrying out the required Work/Services', weight: '30', minScore: '2', band0: 'No methodology statement submitted', band1: 'Submission shows lack of understanding of Work', band2: 'Submission shows a competent understanding of Work', band3: 'Submission shows a detailed understanding of Work' },
        { part: 'Part 2: Contract-Specific', criteriaType: 'Must', criterion: 'Omanisation Plan: compliance with Labour Law and contract requirements, including staff development and training', weight: '25', minScore: '2', band0: 'No Omanisation plan submitted', band1: 'Submission complies with Labour Law', band2: 'Submission proposes an alternate equivalent plan', band3: 'Submission meets or exceeds requirements' },
        { part: 'Part 3: Contract-Generic', criteriaType: 'Want', criterion: 'Proposed Organisational Structure: decision-making process, roles and responsibilities, management competency', weight: '20', minScore: '', band0: 'No organisational structure provided', band1: 'Submission includes simple outline', band2: 'Submission meets requirements', band3: 'Submission includes clear, concise and detailed information' },
      ]
    case 'hse-risk':
      return [
        { activity: 'Equipment Installation at Elevated Platforms', riskDescription: 'Working at height during installation and maintenance activities', potentialConsequences: 'Lost Time Injury from a fall during equipment installation or maintenance at elevation', ram: 'P-2C', riskOwner: 'Site HSE Officer', existingControls: 'Fall arrest systems, safety harnesses, scaffolding with guardrails, PTW system', additionalControls: 'Implement buddy system; mandatory tool-tethering; enhanced pre-task risk assessment', monitoringActivities: 'Weekly harness and anchor point inspection; monthly permit-to-work audit trail review' },
        { activity: 'Chemical Handling & Storage Operations', riskDescription: 'Exposure to hazardous chemicals and substances', potentialConsequences: 'Medical Treatment following chemical exposure or inhalation of fumes during handling and storage', ram: 'P-1B', riskOwner: 'Chemical Handling Supervisor', existingControls: 'MSDS availability, PPE provisions, chemical storage protocols, spill containment kits', additionalControls: 'Quarterly chemical handling refresher training; enhanced ventilation monitoring', monitoringActivities: 'Quarterly SDS register audit; monthly ventilation system inspection' },
        { activity: 'Mechanical Lifting Operations', riskDescription: 'Heavy lifting and crane operations near live equipment', potentialConsequences: 'Permanent Disability from a dropped load or crane contact with live equipment during lifting', ram: 'P-3D', riskOwner: 'Lifting Supervisor / Appointed Person', existingControls: 'Certified crane operators, lift plans, exclusion zones, banksman requirement', additionalControls: 'Independent lift plan review; real-time load monitoring system; enhanced exclusion zone marking', monitoringActivities: 'Daily lifting gear pre-use inspection; independent lift plan sign-off before each lift' },
      ]
    case 'negotiation-strategy':
      return [
        { theme: 'Cost Price', negotiationPoints: `Overall contract pricing for ${title} appears above the internal estimate; seek reduction through volume commitment and scope optimisation`, aspiration: '12% reduction from submitted price', target: '7% reduction from submitted price', walkAway: `Price at or below approved budget of ${budget}`, finalAchievement: '' },
        { theme: 'Liquidated Damages', negotiationPoints: 'Agree LD rate and cap for delayed delivery to protect Oman LNG against schedule slippage', aspiration: '1.0% per week, capped at 15% of contract value', target: '0.5% per week, capped at 10% of contract value', walkAway: 'Minimum 0.5% per week with a 5% cap', finalAchievement: '' },
        { theme: 'Payments', negotiationPoints: 'Improve cash-flow terms and reduce advance payment exposure', aspiration: 'No advance payment; 60-day payment terms', target: 'Max 10% advance against bank guarantee; 45-day terms', walkAway: 'Max 15% advance against bank guarantee; 30-day terms', finalAchievement: '' },
      ]
    default:
      return []
  }
}

/** Fresh AI rows for a template, each with a deterministic confidence. */
export function generateAiRows(templateId, tender) {
  const offset = Math.max(0, TEMPLATE_DEFS.findIndex(t => t.id === templateId))
  return aiSeedRows(templateId, tender).map((seed, index) => {
    const score = CONFIDENCE_SEQUENCE[(index + offset) % CONFIDENCE_SEQUENCE.length]
    return { _id: nextRowId(), _source: 'ai', _confidence: score, _band: confidenceBand(score), ...seed }
  })
}

/** Negotiation: a Final Negotiation Achievement, once recorded, is locked and
 * survives a regenerate — carried onto the regenerated theme of the same name,
 * or kept as its own row when the new pass no longer has that theme. */
export function preserveLockedNegotiationRows(previousRows, freshRows) {
  const locked = previousRows.filter(row => String(row.finalAchievement ?? '').trim() !== '')
  if (locked.length === 0) return freshRows
  const byTheme = new Map(locked.map(row => [String(row.theme ?? '').trim().toLowerCase(), row]))
  const merged = freshRows.map(row => {
    const match = byTheme.get(String(row.theme ?? '').trim().toLowerCase())
    if (!match) return row
    byTheme.delete(String(row.theme ?? '').trim().toLowerCase())
    return { ...row, finalAchievement: match.finalAchievement }
  })
  return [...[...byTheme.values()], ...merged]
}

/** Strips private meta keys before rows are compared or exported. */
export const stripRowMeta = row =>
  Object.fromEntries(Object.entries(row || {}).filter(([key]) => !key.startsWith('_')))

/* ─── Submitted documents: open in a new tab (Excel / Word viewer) ─── */

const computedValue = (field, row) => {
  const value = field.compute(row)
  return value === '' || value === null || value === undefined ? EMPTY_VALUE_TEXT : String(value)
}

function buildTemplatePayload(template, rows, tender) {
  return {
    title: template.title,
    tenderRef: tenderRef(tender),
    tenderTitle: tender?.title || '',
    rowLabel: template.rowLabel || 'Item',
    headers: template.fields.map(f => f.label),
    rows: rows.map(row => template.fields.map(f => (
      f.type === 'computed' ? computedValue(f, row) : String(row[f.id] ?? '')
    ))),
  }
}

function generateTemplateText(template, rows, tender) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  let text = `${template.title.toUpperCase()}\n\nTender Reference: ${tenderRef(tender) || 'N/A'}\nTender Title: ${tender?.title || 'N/A'}\nGenerated Date: ${today}\n\n`
  rows.forEach((row, idx) => {
    text += `${template.rowLabel} #${idx + 1}\n`
    template.fields.forEach(field => {
      const value = field.type === 'computed' ? computedValue(field, row) : (row[field.id] || EMPTY_VALUE_TEXT)
      text += `  ${field.label}: ${value}\n`
    })
    text += '\n'
  })
  return text
}

/** Opens the completed template's submitted rows in the Excel / Word viewer tab. */
export function openTemplateFile(template, rows, tender, tenderId) {
  if ((template.fileType === 'excel' || template.fileType === 'word') && rows?.length > 0) {
    const route = template.fileType === 'word' ? 'docx-viewer' : 'excel-viewer'
    const key = `atm_doc_${tenderId || 'draft'}_${template.id}`
    try {
      localStorage.setItem(key, JSON.stringify(buildTemplatePayload(template, rows, tender)))
    } catch {
      /* storage full — the viewer will show its own empty state */
    }
    window.open(`/${route}?data=${encodeURIComponent(key)}&name=${encodeURIComponent(template.title)}`, '_blank', 'noopener,noreferrer')
    return
  }
  if (template.fileUrl) {
    window.open(encodeURI(template.fileUrl), '_blank', 'noopener,noreferrer')
    return
  }
  const blob = new Blob([generateTemplateText(template, rows || [], tender)], { type: 'text/plain' })
  window.open(URL.createObjectURL(blob), '_blank', 'noopener,noreferrer')
}
