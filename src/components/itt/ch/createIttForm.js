/*
 * Create ITT (Contract Holder) — the Project Details form's vocabularies,
 * field helpers and validation. A plain-JS port of the main app's
 * `create-itt-form.schema.ts` + `create-itt-form.utils.ts`: same fields, same
 * limits, same error messages, in the same order the schema reports them.
 */

// ── Limits & messages ────────────────────────────────────────────────────────

export const TITLE_MAX_LENGTH = 200
export const TITLE_MAX_MESSAGE = `Project Title cannot exceed ${TITLE_MAX_LENGTH} characters.`

export const DESCRIPTION_MAX_LENGTH = 4000
export const DESCRIPTION_MAX_MESSAGE = `Project Description / Key Requirements cannot exceed ${DESCRIPTION_MAX_LENGTH} characters.`
export const DOCUMENT_MAX_MESSAGE = `Document should not contain more than ${DESCRIPTION_MAX_LENGTH} characters.`

export const COST_CODE_MAX_LENGTH = 64

const MAX_BUDGET_INTEGER_DIGITS = 14
const MAX_SAFE_BUDGET_DIGITS = 15

// ── Static option vocabularies ───────────────────────────────────────────────

export const CATEGORIES = ['Materials', 'Services', 'Equipment', 'Works']
export const CURRENCIES = ['OMR', 'USD', 'EUR', 'SAR', 'AED', 'GBP']
export const DEFAULT_CURRENCY = CURRENCIES[0]

export const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
  value: String(i), label: `${i} year${i === 1 ? '' : 's'}`,
}))
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => ({
  value: String(i), label: `${i} month${i === 1 ? '' : 's'}`,
}))

/** Assign-team copy — MAIN renames ICV to "LC" in the Contract Holder UI. */
export const ASSIGN_TEAM_COPY = {
  ce:  { label: 'Contract Engineers', placeholder: 'Select Contract Engineers...', hint: 'Picks this up for the PQQ financial assessment, PSF and ITT creation.' },
  hse: { label: 'HSE',                placeholder: 'Select HSE Officers...',       hint: 'Owns Section C - QHSSE Requirements on the ITT.' },
  icv: { label: 'LC',                 placeholder: 'Select LC Leads...',           hint: 'Owns Section H - LC Requirements on the ITT.' },
}

/*
 * The eight strategy documents a direct ITT (no PSF) carries. Ids are the ones
 * already stored on tenders as `strategyTemplateUploads`; labels, order and the
 * optional flags follow MAIN — LC, Negotiation Strategy and Pre-Qualification
 * never block continuing.
 */
export const STRATEGY_TEMPLATES = [
  { id: 'sow',                   label: 'Statement of Work (SOW)' },
  { id: 'company-estimate',      label: 'Company Estimate' },
  { id: 'contract-risk',         label: 'Contract Risk Assessment' },
  { id: 'icv',                   label: 'LC', optional: true },
  { id: 'technical-eval-matrix', label: 'Technical Evaluation Matrix' },
  { id: 'hse-risk',              label: 'HSE Risk Assessment' },
  { id: 'negotiation-strategy',  label: 'Negotiation Strategy', optional: true },
  { id: 'pre-qual',              label: 'Pre-Qualification', optional: true },
]
export const REQUIRED_STRATEGY_TEMPLATES = STRATEGY_TEMPLATES.filter(t => !t.optional)

export const missingRequiredTemplates = (uploads) =>
  REQUIRED_STRATEGY_TEMPLATES.filter(t => !uploads?.[t.id]).length

// ── Field helpers ────────────────────────────────────────────────────────────

/** Groups a budget entry's digits, keeping any fractional part so the
 * "Decimal values are not allowed" rule can still see and report it. */
export function formatBudget(raw) {
  const cleaned = String(raw ?? '').replace(/[^0-9.]/g, '')
  if (!/\d/.test(cleaned)) return ''
  const sep = cleaned.indexOf('.')
  const hasFraction = sep !== -1
  const integerDigits = (hasFraction ? cleaned.slice(0, sep) : cleaned).replace(/^0+(?=\d)/, '')
  const fractionDigits = hasFraction ? cleaned.slice(sep + 1).replace(/\./g, '') : ''
  const grouped = (integerDigits || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return hasFraction ? `${grouped}.${fractionDigits}` : grouped
}

export function exceedsMaxBudgetIntegerDigits(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '')
  const sep = cleaned.indexOf('.')
  const integerDigits = sep === -1 ? cleaned : cleaned.slice(0, sep)
  return integerDigits.replace(/^0+(?=\d)/, '').length > MAX_BUDGET_INTEGER_DIGITS
}

export function parseBudget(value) {
  const numeric = Number(String(value ?? '').replace(/[^0-9.]/g, ''))
  if (!Number.isFinite(numeric) || numeric > Number.MAX_SAFE_INTEGER) return 0
  return numeric
}

export function hasSafeBudgetPrecision(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '')
  const [intPart = '', fracPart = ''] = cleaned.split('.')
  return `${intPart}${fracPart}`.replace(/^0+/, '').replace(/0+$/, '').length <= MAX_SAFE_BUDGET_DIGITS
}

export function isZeroDuration(years, months) {
  return (parseInt(years, 10) || 0) * 12 + (parseInt(months, 10) || 0) <= 0
}

/** The duration string every other screen reads ("2 years 6 months"). */
export function buildDuration(years, months) {
  if (!years && !months) return ''
  const y = years || '0'
  const m = months || '0'
  return `${y} year${y === '1' ? '' : 's'} ${m} month${m === '1' ? '' : 's'}`
}

function parseDuration(duration) {
  const text = String(duration || '')
  const both = text.match(/^(\d+)\s+years?\s+(\d+)\s+months?$/)
  if (both) return { years: both[1], months: both[2] }
  const onlyMonths = text.match(/^(\d+)\s*months?$/)
  if (onlyMonths) {
    const total = parseInt(onlyMonths[1], 10)
    return { years: String(Math.floor(total / 12)), months: String(total % 12) }
  }
  const onlyYears = text.match(/^(\d+)\s*years?$/)
  if (onlyYears) return { years: onlyYears[1], months: '0' }
  return { years: '', months: '' }
}

/** A tender's stored budget is "OMR 923,000" — split it into currency + amount. */
function parseStoredBudget(budget, currency) {
  if (budget == null || budget === '') return { currency: currency || DEFAULT_CURRENCY, amount: '' }
  if (typeof budget === 'number') return { currency: currency || DEFAULT_CURRENCY, amount: formatBudget(String(Math.round(budget))) }
  const text = String(budget)
  const prefix = text.match(/^([A-Za-z]{3})\s/)
  const digits = text.replace(/[^0-9]/g, '')
  return {
    currency: currency || (prefix ? prefix[1].toUpperCase() : DEFAULT_CURRENCY),
    amount: digits ? formatBudget(digits) : '',
  }
}

export const isoToday = () => {
  const d = new Date()
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function isValidIsoDate(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value || '')
  if (!m) return false
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.getFullYear() === Number(m[1]) && d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[3])
}

const firstId = (list, single) => {
  if (Array.isArray(list) && list.length > 0) return String(list[0].id)
  if (single?.id != null) return String(single.id)
  return ''
}

export const EMPTY_FORM = {
  title: '', department: '', category: '', currency: DEFAULT_CURRENCY, budget: '', deadline: '',
  description: '', descMode: 'type', uploadedFileName: '', durationYears: '', durationMonths: '',
  costCode: '', contractEngineerId: '', hseId: '', icvId: '',
}

/** Pre-populates the form from a tender record (CIF / PSF / an earlier save). */
export function tenderToForm(tender) {
  if (!tender) return { ...EMPTY_FORM }
  const { currency, amount } = parseStoredBudget(tender.budget, tender.currency)
  // The CIF now stores the two halves alongside the display string.
  const parsed = parseDuration(tender.duration)
  const years = tender.durationYears != null && tender.durationYears !== '' ? String(tender.durationYears) : parsed.years
  const months = tender.durationMonths != null && tender.durationMonths !== '' ? String(tender.durationMonths) : parsed.months
  return {
    ...EMPTY_FORM,
    title: tender.title || '',
    department: tender.department || '',
    category: tender.tenderType || tender.category || '',
    currency,
    budget: amount,
    deadline: tender.deadline || '',
    description: tender.description || '',
    durationYears: years,
    durationMonths: months,
    costCode: tender.costCode || '',
    contractEngineerId: firstId(tender.assignedContractEngineers, tender.assignedContractEngineer),
    hseId: firstId(tender.assignedHseOfficers),
    icvId: firstId(tender.assignedIcvLeads),
  }
}

/** Field values → the tender fields the rest of the app reads. */
export function formToTenderFields(form) {
  return {
    title: form.title.trim(),
    department: form.department,
    tenderType: form.category,
    currency: form.currency,
    budget: form.budget ? `${form.currency} ${formatBudget(form.budget.replace(/\..*$/, ''))}` : '',
    deadline: form.deadline,
    description: form.description.trim(),
    duration: buildDuration(form.durationYears, form.durationMonths),
    durationYears: form.durationYears,
    durationMonths: form.durationMonths,
    costCode: form.costCode.trim(),
    descriptionFileName: form.descMode === 'upload' ? form.uploadedFileName : '',
  }
}

export const isDescriptionOverLimit = (value) => (value ?? '').trim().length > DESCRIPTION_MAX_LENGTH

/**
 * Validates every field and returns `{ [field]: message }` — the first failing
 * rule per field, in the order MAIN's zod schema checks them. Empty object ⇒ valid.
 */
export function validateCreateIttForm(v) {
  const e = {}
  const title = (v.title || '').trim()
  if (!title) e.title = 'Project title is required'
  else if (title.length > TITLE_MAX_LENGTH) e.title = TITLE_MAX_MESSAGE

  if (!v.department) e.department = 'Select a department / entity'
  if (!v.category) e.category = 'Select a tender type'
  if (!v.currency) e.currency = 'Select a currency'

  const budget = v.budget || ''
  if (!budget) e.budget = 'Estimated budget is required'
  else if (exceedsMaxBudgetIntegerDigits(budget)) e.budget = 'Estimated Budget cannot exceed 14 digits'
  else if (budget.includes('.')) e.budget = 'Decimal values are not allowed'
  else if (!(parseBudget(budget) > 0)) e.budget = 'Estimated Budget must be greater than 0'
  else if (!hasSafeBudgetPrecision(budget)) e.budget = 'Enter a value with fewer total digits'

  if (!v.deadline) e.deadline = 'Submission deadline is required'
  else if (!isValidIsoDate(v.deadline)) e.deadline = 'Enter a valid submission deadline'

  if (isDescriptionOverLimit(v.description)) e.description = DESCRIPTION_MAX_MESSAGE
  else if (v.descMode === 'type' && !(v.description || '').trim()) e.description = 'Project description is required'
  if (v.descMode === 'upload' && !(v.uploadedFileName || '').trim()) e.uploadedFileName = 'Upload a requirements file'

  if (!v.durationYears) e.durationYears = 'Contract Duration (Years) is required'
  if (!v.durationMonths) e.durationMonths = 'Contract Duration (Months) is required'
  if (v.durationYears && v.durationMonths && isZeroDuration(v.durationYears, v.durationMonths)) {
    e.durationYears = 'Contract Duration cannot be 0'
    e.durationMonths = 'Contract Duration cannot be 0'
  }

  const costCode = (v.costCode || '').trim()
  if (!costCode) e.costCode = 'Cost Code is required'
  else if (costCode.length > COST_CODE_MAX_LENGTH) e.costCode = `Cost Code cannot exceed ${COST_CODE_MAX_LENGTH} characters`

  if (!v.contractEngineerId) e.contractEngineerId = 'Contract Engineer assignment is required'
  if (!v.hseId) e.hseId = 'HSE assignment is required'
  if (!v.icvId) e.icvId = 'LC assignment is required'
  return e
}

// ── "This tender already exists" (title suggestions) ─────────────────────────

const PHASE_LABEL = {
  cif_draft: 'Draft',
  select_templates: 'Selecting templates',
  strategy_templates: 'Strategy templates',
  prequalification: 'Pre-qualification',
  psf: 'PSF',
  psf_submitted: 'PSF submitted',
  itt_drafting: 'ITT drafting',
  upload: 'Awaiting ingestion',
  tech_eval: 'Technical evaluation',
  comm_eval: 'Commercial evaluation',
  awarded: 'Awarded',
  contract: 'Contract drafting',
  completed: 'Completed',
}

const ITT_READY = new Set(['draft', 'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4', 'prequal_final_review'])

/** Where an existing tender is in MAIN's phase vocabulary. */
export function tenderPhase(t) {
  if (!t) return null
  if (t.status === 'cif_draft') return 'cif_draft'
  if (ITT_READY.has(t.status)) {
    if (t.sectionsGenerated) return 'itt_drafting'
    if (t.psfCompleted) return 'psf_submitted'
    if (t.cifProgressStage === 'select_templates') return 'select_templates'
    if (t.cifProgressStage === 'psf') return 'psf'
    if (t.status !== 'draft') return 'prequalification'
    return 'strategy_templates'
  }
  if (['upload', 'ingestion'].includes(t.status)) return 'upload'
  if (['tech_eval', 'parallel_eval'].includes(t.status)) return 'tech_eval'
  if (t.status === 'comm_eval') return 'comm_eval'
  if (t.status === 'completed' || t.status === 'closed') return 'completed'
  return t.status || null
}

export const phaseLabel = (phase) => {
  if (!phase) return null
  if (PHASE_LABEL[phase]) return PHASE_LABEL[phase]
  const text = String(phase).replace(/_/g, ' ').trim()
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : null
}

export function existingTenderStatusLabel(t) {
  if (t?.status === 'cancelled') return 'Cancelled'
  if (['completed', 'closed', 'awarded'].includes(t?.status)) return 'Completed'
  return 'In progress'
}

/** The route that continues an existing tender at its current step. */
export function existingTenderDestination(t) {
  switch (tenderPhase(t)) {
    case 'cif_draft':          return `/contract-strategy/${t.id}`
    case 'select_templates':   return `/strategy-templates/${t.id}?new=true`
    case 'strategy_templates':
    case 'prequalification':   return `/strategy-templates/${t.id}`
    case 'psf':                return `/psf-strategy/${t.id}`
    case 'psf_submitted':
    case 'itt_drafting':       return `/create-itt/${t.id}`
    default:                   return '/tenders'
  }
}

export const normalizeTitle = (s) => String(s || '').trim().toLowerCase().replace(/\s+/g, ' ')
export const TITLE_SUGGESTION_MIN_QUERY_LENGTH = 2
