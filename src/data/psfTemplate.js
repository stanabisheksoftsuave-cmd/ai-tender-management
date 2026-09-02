/*
 * The Oman LNG Procurement Submission Form, as data.
 *
 * Transcribed from `PSF Strategy.docx` from `Attachments:` onward — the
 * masthead and the endorsement tick list above that line are out of scope, the
 * same cut the Next.js implementation makes. Held here rather than in the page
 * so a wording or default-tick change never touches a component.
 *
 * A "checkbox seed" is `{ id, label, checked }`. The id is stable so a relabel
 * never loses a Contract Holder's tick.
 */

/** The seven header scalars, in template order. */
export const PSF_HEADER_FIELDS = [
  { key: 'title',            label: 'Title' },
  { key: 'contractNumber',   label: 'Contract / PR Number' },
  { key: 'anticipatedValue', label: 'Anticipated Value' },
  { key: 'duration',         label: 'Duration' },
  { key: 'sourceOfFunds',    label: 'Source of Funds' },
  { key: 'costCentre',       label: 'Cost Centre/Cost Code' },
  { key: 'expenditureType',  label: 'Expenditure Type' },
]

/*
 * The fields the template prints in red as "AI to generate…" instructions.
 * These are drafted as prose for the Contract Holder to edit, never rendered as
 * the instruction itself. `rows` sizes each textarea to the room the template
 * leaves for it.
 */
export const PSF_NARRATIVE_FIELDS = [
  { key: 'background',                label: 'Background',                    rows: 5 },
  { key: 'justification',             label: 'Justification',                 rows: 4 },
  { key: 'scopeOverview',             label: 'Scope Overview',                rows: 4 },
  { key: 'manpowerRequirements',      label: 'Manpower Requirements',         rows: 3 },
  { key: 'goodsServicesRequirements', label: 'Goods & Services Requirements', rows: 3 },
  { key: 'otherRequirements',         label: 'Other Requirements',            rows: 3 },
]

/** REVIEWS/APPROVALS ESTABLISHED — read across the template's three columns. */
export const PSF_REVIEW_OPTIONS = [
  { id: 'board',                 label: 'Board',                          checked: false },
  { id: 'technical-committee',   label: 'Technical Committee',            checked: true  },
  { id: 'budget-availability',   label: 'Budget Availability',            checked: false },
  { id: 'management-team',       label: 'Management Team',                checked: false },
  { id: 'employment-committee',  label: 'Employment Committee',           checked: false },
  { id: 'cpl-review',            label: 'CPL Review',                     checked: false },
  { id: 'function-manager',      label: 'Function Manager (MT)',          checked: false },
  { id: 'it-steering-committee', label: 'IT Steering Committee',          checked: false },
  { id: 're-submission',         label: 'Re-Submission',                  checked: false },
  { id: 'line-manager',          label: 'Line Manager (MT -1)',           checked: false },
  { id: 'cp-steering-committee', label: 'C&P Steering Committee',         checked: true  },
  { id: 'budgeted-funds',        label: 'Availability of Budgeted Funds', checked: false },
  { id: 'other',                 label: 'Other',                          checked: false },
]

/** ESTIMATE BASIS. */
export const PSF_ESTIMATE_BASIS_OPTIONS = [
  { id: 'budgetary-quote',        label: 'Budgetary Quote',                   checked: true  },
  { id: 'estimated-by-ch',        label: 'Estimated By Contract Holder',      checked: false },
  { id: 'existing-contract-rate', label: 'Existing Contract Rate',            checked: false },
  { id: 'benchmarked',            label: 'Benchmarked with Similar Services', checked: false },
  { id: 'other',                  label: 'Other, please specify',             checked: false },
]

export const PSF_DEFAULT_CONFIDENCE_LEVEL = '+/- 10%'

/** TENDER PLAN — the three requisition types on one row. */
export const PSF_TENDER_PLAN_TYPES = [
  { id: 'new-contract',     label: 'New Contract/Purchase Requisition', checked: true  },
  { id: 'contract-renewal', label: 'Contract Renewal',                  checked: false },
  { id: 'variation',        label: 'Variation',                         checked: false },
]

/*
 * The 21 TENDER PLAN milestones, in template order. Dates are per tender, so
 * only the labels are seeded. The template genuinely repeats "PSF Submitted to
 * CPL for Review" — once for strategy, once for award — so rows are keyed by
 * index, not by label.
 */
export const PSF_MILESTONE_LABELS = [
  'Work Initiated',
  'CIF Completed',
  'C&PSC Approval Received (if necessary)',
  'Line Approvals of PSF Received',
  'PSF Submitted to CPL for Review',
  'Tender Board Endorsement of Strategy',
  'Preparation of Detailed Scope',
  'Preparation of Tender Documents',
  'Internal Approval of Tender Documents',
  'Issue of Tender Documents',
  'Return of Tender Documents',
  'Technical Evaluation Completed',
  'Commercial Evaluation Completed',
  'Line Approval of PSF Received',
  'PSF Submitted to CPL for Review',
  'Tender Board Endorsement of Award',
  'Board Approval of Award (if necessary)',
  'Preparation of Contract Documents',
  'Internal Approval of Contract Documents',
  'Contract Awarded',
  'Contract Begins',
]

/** TENDER STRATEGY — the template's three columns, read down each in turn. */
export const PSF_TENDER_STRATEGY_OPTIONS = [
  { id: 'competitive',        label: 'Competitive',        checked: false },
  { id: 'oem',                label: 'OEM',                checked: true  },
  { id: 'single-source',      label: 'Single Source',      checked: false },
  { id: 'others',             label: 'Others',             checked: true  },
  { id: 'once-off',           label: 'Once Off',           checked: true  },
  { id: 'call-off',           label: 'Call Off',           checked: false },
  { id: 'periodic',           label: 'Periodic',           checked: false },
  { id: 'continual',          label: 'Continual',          checked: false },
  { id: 'lump-sum',           label: 'Lump Sum',           checked: true  },
  { id: 'unit-rates',         label: 'Unit Rates',         checked: false },
  { id: 'hourly-rates',       label: 'Hourly Rates',       checked: false },
  { id: 'bill-of-quantities', label: 'Bill of Quantities', checked: false },
  { id: 'reimbursable',       label: 'Reimbursable',       checked: false },
]

/** COMPETITIVE: DROP LIST. */
export const PSF_COMPETITIVE_DROP_LIST = [
  { id: 'tem',              label: 'TEM',                       checked: true },
  { id: 'company-estimate', label: 'Company estimate',          checked: true },
  { id: 'benchmark',        label: 'Benchmark/ market intel',   checked: true },
  { id: 'spend-analysis',   label: 'Spend analysis comparison', checked: true },
  { id: 'icv',              label: 'ICV (if applicable)',       checked: true },
]

/** SINGLE SOURCE /OEM: DROP LIST. */
export const PSF_SINGLE_SOURCE_DROP_LIST = [
  { id: 'form-of-oem',          label: 'Form of OEM/SJJ',      checked: false },
  { id: 'negotiation-strategy', label: 'Negotiation Strategy', checked: false },
  { id: 'efa',                  label: 'EFA (if applicable)',  checked: false },
  { id: 'icv',                  label: 'ICV (if applicable)',  checked: true  },
]

/** Blank rows the TENDERER LIST table starts with. */
export const PSF_TENDERER_ROW_COUNT = 4

/*
 * The ICV requirements tables (template pages 8-10). `yesno` rows answer Yes/No
 * against a justification; `percentage` rows carry a figure against a comment.
 * The template runs both under one numbered sequence — including the lettered
 * sub-rows under item 11 — so they share one list.
 */
export const PSF_ICV_REQUIREMENTS = [
  { ordinal: '1',  requirement: 'Check MOL Omanization', kind: 'yesno' },
  { ordinal: '2',  requirement: 'Is ICV Plan Applicable', kind: 'yesno' },
  { ordinal: '3',  requirement: 'If No, is it suitable for unbundle?', kind: 'yesno' },
  { ordinal: '4',  requirement: 'Award based on preference of ICV Index at commercial evaluation (up to 10%).', kind: 'yesno' },
  { ordinal: '5',  requirement: 'Scope identified for ring-fencing.', kind: 'yesno' },
  { ordinal: '6',  requirement: 'Scope identified for VDP', kind: 'yesno' },
  { ordinal: '7',  requirement: 'Allocation of minimum 10% sub-contract value or direct award to SME, if applicable', kind: 'yesno' },
  { ordinal: '8',  requirement: 'Is the subcontract scope to SME will be announced in e-tendering', kind: 'yesno' },
  { ordinal: '9',  requirement: '1.2% Training Levy', kind: 'yesno' },
  { ordinal: '10', requirement: 'Estimated ICV retained percentage out of the total estimated contract value', kind: 'percentage' },
  { ordinal: '11', requirement: 'Omanization percentage reference to subject contract at top 4 skill categories', kind: 'percentage' },
  { ordinal: 'A',  requirement: 'Senior Management', kind: 'percentage' },
  { ordinal: 'B',  requirement: 'Professional', kind: 'percentage' },
  { ordinal: 'C',  requirement: 'Supervisory', kind: 'percentage' },
  { ordinal: 'D',  requirement: 'Skilled', kind: 'percentage' },
  { ordinal: '12', requirement: 'Ring-fencing strategy: what is the percentage of ring fencing? Reference No 5', kind: 'percentage' },
  { ordinal: '13', requirement: 'What is the percentage of VDP? Reference No 6', kind: 'percentage' },
  { ordinal: '14', requirement: 'What is the percentage of SME scope? Reference 7', kind: 'percentage' },
]

export const EM_DASH = '—'

/** Seeds carry their template default; state diverges from there on. */
export const toCheckboxes = (seeds) => seeds.map(seed => ({ ...seed }))
