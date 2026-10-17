// Static option lists, labels, limits and copy for the Contract Initiating
// Form (CIF) and its generated Statement of Work — ported from MAIN's
// contract-holder/mock/initiating-form.ts, utils/format.ts and the
// initiating-form/* components. Kept in a .js file (not a component file) so
// the react-refresh lint rule stays happy.

export const TENDER_TYPES = ['Goods', 'Services', 'Works', 'Consultancy']

/** Oman LNG's own directorates (MAIN `fallbackDepartments`). */
export const DEPARTMENTS = [
  'New Business Development (NBD)',
  'Chief Executive Office (CEO)',
  'Engineering & Technology (EN)',
  'OLNG Development Foundation (ODF)',
  'Internal Audit (IA)',
  'Finance (NGF)',
  'Human Resources (HR)',
  'Operations & Production (OP)',
  'Marketing & Shipping (NGM)',
  'Quality Health Safety & Environment (HS)',
  'Corporate Security (HSC)',
  'Digital and Information Technology (DI)',
  'Strategic Planning Management (SPM)',
  'Facility Management (FM)',
  'Contracting, Procurement & Logistics (CPL)',
  'Major Project (MP)',
  'Chief Operating Officer (COO)',
  'Legal (NGL)',
  'Lean and Continuous Improvement (LCI)',
  'Maintenance and Turnarounds (TM)',
  'In Country Value (ICV)',
  'Decarbonisation & New Energies (NZ)',
  'Asset Improvement (AI)',
  'Others',
]

/** OMR first — it is the CIF's default currency. */
export const CURRENCIES = ['OMR', 'USD', 'EUR', 'SAR', 'AED', 'GBP']
export const DEFAULT_CURRENCY = CURRENCIES[0]

/** Contract Duration selects: bare numeric strings, labelled at render. */
export const YEAR_OPTIONS = Array.from({ length: 11 }, (_, i) => String(i))
export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i))

export const PLACEHOLDERS = {
  title: 'e.g. Enterprise Cloud Infrastructure Upgrade',
  budget: 'e.g. 500,000',
  costCode: 'e.g. CC-2025-001',
  description: 'Provide Scope Overview - Describe the project scope, objectives and key requirements',
}

export const REQUIRED_FIELD_LABELS = {
  title: 'Project Title',
  tenderType: 'Tender Type',
  department: 'Department / Entity',
  budget: 'Estimated Budget',
  costCode: 'Cost Code',
  deadline: 'Submission Deadline',
  duration: 'Contract Duration',
  durationYears: 'Contract Duration (Years)',
  durationMonths: 'Contract Duration (Months)',
  description: 'Scope Overview',
}

/** Every field on the form is required (MAIN `REQUIRED_FIELDS`). */
export const REQUIRED_FIELDS = [
  'title',
  'tenderType',
  'department',
  'budget',
  'costCode',
  'deadline',
  'durationYears',
  'durationMonths',
  'description',
]

export const DURATION_FIELDS = ['durationYears', 'durationMonths']

export const MAX_CIF_TITLE_LENGTH = 200
export const MAX_COST_CODE_LENGTH = 64
export const MAX_SCOPE_OVERVIEW_LENGTH = 4000
export const MAX_BUDGET_INTEGER_DIGITS = 14

export const BUDGET_HINT = 'Whole numbers only, up to 14 digits.'
export const BUDGET_TOO_LONG_MESSAGE = 'Estimated Budget cannot exceed 14 digits'
export const BUDGET_DECIMAL_MESSAGE = 'Decimal values are not allowed'
export const ZERO_BUDGET_MESSAGE = 'Estimated Budget must be greater than 0'
export const COST_CODE_TOO_LONG_MESSAGE = 'Cost Code cannot exceed 64 characters'
export const ZERO_DURATION_MESSAGE = 'Contract Duration cannot be 0'

export const TITLE_SUGGESTION_MIN_QUERY_LENGTH = 2
export const TITLE_SUGGESTION_LIMIT = 8

/** MAIN `SOW_GENERATION_STEPS` (lib/use-decorative-generation-steps.ts). */
export const SOW_GENERATION_STEPS = [
  'Reading the Contract Initiating Form',
  'Analysing scope and compliance standards',
  'Structuring the Statement of Work',
  'Drafting section content with AI',
  'Finalising the Statement of Work',
]
export const SOW_GENERATION_TICK_MS = 550
/** How long the mock drafting "call" runs before the document lands. */
export const SOW_GENERATION_DURATION_MS = 3000
/** MAIN's "let the progress bar finish" hand-off before navigating to the SOW. */
export const SOW_HANDOFF_MS = 700
export const SOW_GENERATION_HELPER_TEXT =
  'This is a live AI drafting call and usually takes about a minute. It stops automatically after 3 minutes.'

export const SOW_SECTION_BODY_MAX_LENGTH = 50000
export const SOW_LIMIT_REACHED_MESSAGE = 'Maximum limit reached'
export const SOW_FALLBACK_FILENAME = 'Scope of Work.docx'

export const AI_QUICK_PROMPTS = [
  'Make it more formal',
  'Shorten this',
  'Expand with more detail',
  'Convert to bullet points',
]

/** Picker page size (MAIN `DEFAULT_PAGE_SIZE`). */
export const DRAFTS_PAGE_SIZE = 10

/** cifProgressStage values that still belong on the drafts picker. */
export const DRAFT_PROGRESS_STAGES = ['cif_creation', 'select_templates', 'strategy_templates']

/** Statuses MAIN would report as a finished tender in the title suggestions. */
export const COMPLETED_STATUSES = ['active', 'contract_execution', 'contract_closure', 'closed']
