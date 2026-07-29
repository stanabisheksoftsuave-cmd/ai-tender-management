/*
 * Section B2 — Special Conditions of Contract.
 *
 * B2 exists to amend, add to or disapply clauses of the B1 General Conditions.
 * It is organised as CLASSES (the clause families of the General Conditions)
 * containing SUB-CLASSES — one sub-class is one drafting entry, i.e. one row of
 * the client's "Section B2 Template.xlsx":
 *
 *   A  Target B2 Clause No.            -> code
 *   B  Source Clause No.               -> sourceClauseNo        (B1 drop list)
 *   C  Source Clause Title             -> sourceClauseTitle     (auto-linked from B)
 *   D  Source Sub-clause · Level 1     -> sourceLevel1          (optional)
 *   E  Source Sub-clause · Level 2     -> sourceLevel2          (optional)
 *   F  Source Sub-clause · Level 3     -> sourceLevel3          (optional)
 *   G  Source Sub-Clause Title         -> sourceSubclauseTitle  (auto-linked from D/E/F)
 *   H  Type of Action                  -> actionType            (controlled list)
 *   I  Action Object                   -> actionObject          (controlled list)
 *   J  Source / Evidence for Drafting  -> evidenceSource + evidenceFile (upload)
 *   K  Drafting Instruction to AI      -> instruction           (Contract Engineer)
 *   L  Generated Clause/Sub-clause Text-> content               (AI drafts from K + J)
 *
 * The sheet labels the three optional levels "from Section B1 / B2 / B3"; there
 * is no Section B3 in this ITT, so they are read as the nesting depth of the
 * source sub-clause (40.1 -> 40.1.2 -> 40.1.2(a)) and their options come from
 * B1_CLAUSE_CATALOGUE below.
 *
 * The seed set is the clause text of the client's own "Section B2 - Special
 * Conditions.docx" — copied verbatim, including clause numbering, percentages
 * and the defined terms in CAPS. It must not be reworded here; only the new
 * metadata columns were back-filled onto it. The Contract Engineer can add,
 * edit and delete classes and sub-classes per tender, and those edits persist
 * on the tender (sectionB2Classes).
 *
 * This module is the single source for B2 in both flows: ITT creation
 * (ITTCreation.jsx) and contract drafting (ContractTemplate.jsx) seed the
 * B2ClassEditor from cloneB2Classes() and read/write the same tender key.
 */

import { applyAiInstruction } from '../../utils/aiTextEdit'

// Shown wherever B2 carries no special conditions at all — the wording
// Section A prescribes for an inapplicable section.
export const B2_NOT_USED_NOTE =
  'NOT USED — Section B1 General Conditions of Contract apply without modification.'

let uid = 0
export const newId = (prefix) => `${prefix}-${Date.now().toString(36)}-${(uid++).toString(36)}`

/* ────────────────────── Controlled dropdown values ──────────────────────
 * Verbatim from rows 4-18 of the client's template — the single source of
 * truth for every B2 dropdown in the editor. */

export const B2_ACTION_TYPES = ['ADD', 'AMEND', 'DELETE', 'DELETE_AND_REPLACE', 'RENUMBER']

export const B2_ACTION_OBJECTS = [
  'Clause', 'Subclause', 'Definition', 'Cross-Reference', 'Value', 'Schedule', 'Appendix', 'Table',
]

export const B2_EVIDENCE_SOURCES = [
  'Section B2 Existing Amendment',
  'Scope of Work (Section D)',
  'Schedule of Prices (Section E)',
  'HSE Requirement',
  'ICV Requirement',
  'Risk Assessment',
  'Technical Evaluation',
  'Negotiation Outcome',
  'Bidder Clarification',
  'Legal Review',
  'Tender Board Decision',
  'Policy / Procedure',
  'Previous Contract',
  'Lessons Learned',
  'Other',
]

// Trailing options on the clause / sub-clause drop lists: picking one lets the
// engineer type a number the General Conditions catalogue doesn't carry.
export const ADD_NEW_CLAUSE = 'Add New Clause'
export const ADD_NEW_SUBCLAUSE = 'Add New Sub-Clause'

/* ────────────────────── Section B1 clause catalogue ──────────────────────
 * The selectable Source Clause / Sub-clause numbers and the titles columns C
 * and G auto-link to. B1 itself ships as four .docx tiers (b1Categories.js),
 * so its clause list is not machine-readable anywhere in the app — this is a
 * representative General Conditions structure covering the clause families the
 * seed uses plus the common ones a Contract Engineer amends. */

const cl = (no, title, subclauses = []) => ({ no, title, subclauses })
const sub = (no, title, children = []) => ({ no, title, children })

export const B1_CLAUSE_CATALOGUE = [
  cl('1', 'DEFINITIONS', [
    sub('1.1', 'Defined Terms'),
    sub('1.2', 'Rules of Interpretation'),
  ]),
  cl('2', 'SCOPE OF THE CONTRACT', [
    sub('2.1', 'The WORK'),
    sub('2.2', 'Order of Precedence of Documents'),
  ]),
  cl('3', 'CONTRACT PERIOD', [sub('3.1', 'Commencement'), sub('3.2', 'Extension of the CONTRACT')]),
  cl('4', 'CALL-OFF PROCEDURE', [
    sub('4.1', 'Issue of a CALL-OFF'),
    sub('4.2', 'Acceptance of a CALL-OFF'),
    sub('4.3', 'CALL-OFF Value and Limits'),
  ]),
  cl('5', "CONTRACTOR'S GENERAL OBLIGATIONS"),
  cl('6', "COMPANY'S GENERAL OBLIGATIONS"),
  cl('7', 'CONTRACT HOLDER AND REPRESENTATIVES'),
  cl('8', 'PERSONNEL', [sub('8.1', 'Key Personnel'), sub('8.2', 'Removal of Personnel'), sub('8.3', 'Omanisation')]),
  cl('9', 'SUBCONTRACTING', [sub('9.1', 'COMPANY Consent'), sub('9.2', 'Liability for SUBCONTRACTORS')]),
  cl('10', 'HEALTH, SAFETY AND ENVIRONMENT', [
    sub('10.1', 'HSE Management System'),
    sub('10.2', 'HSE Performance and Reporting'),
    sub('10.3', 'Life Saving Rules'),
  ]),
  cl('11', 'QUALITY ASSURANCE AND QUALITY CONTROL'),
  cl('12', 'INSPECTION AND TESTING'),
  cl('13', 'VARIATIONS', [sub('13.1', 'Right to Vary'), sub('13.2', 'Valuation of a VARIATION')]),
  cl('14', 'CONTRACT PRICE', [sub('14.1', 'Price Basis'), sub('14.2', 'Price Adjustment')]),
  cl('15', 'INVOICING AND PAYMENT', [
    sub('15.1', 'Submission of Invoices'),
    sub('15.2', 'Payment Terms', [
      sub('15.2.1', 'Payment Period'),
      sub('15.2.2', 'Disputed Invoices'),
    ]),
    sub('15.3', 'Retention'),
  ]),
  cl('16', 'TAXES AND DUTIES'),
  cl('17', 'IN-COUNTRY VALUE', [sub('17.1', 'ICV Commitments'), sub('17.2', 'ICV Reporting')]),
  cl('18', 'WARRANTY AND DEFECTS'),
  cl('19', 'TITLE AND RISK'),
  cl('20', 'COMPANY PROVIDED ITEMS'),
  cl('21', 'INSURANCE', [sub('21.1', 'Required Policies'), sub('21.2', 'Evidence of Insurance')]),
  cl('22', 'INDEMNITIES'),
  cl('23', 'LIMITATION OF LIABILITY', [sub('23.1', 'Consequential Loss'), sub('23.2', 'Aggregate Cap')]),
  cl('24', 'CONFIDENTIALITY'),
  cl('25', 'INTELLECTUAL PROPERTY'),
  cl('26', 'BUSINESS ETHICS AND ANTI-BRIBERY'),
  cl('27', 'CONFLICT OF INTEREST'),
  cl('28', 'DATA PROTECTION'),
  cl('29', 'AUDIT AND RECORDS'),
  cl('30', 'FORCE MAJEURE'),
  cl('31', 'SUSPENSION'),
  cl('32', 'TERMINATION', [
    sub('32.1', 'Termination for Convenience'),
    sub('32.2', 'Termination for Default'),
    sub('32.3', 'Consequences of Termination'),
  ]),
  cl('33', 'ASSIGNMENT AND NOVATION'),
  cl('34', 'PERFORMANCE GUARANTEE'),
  cl('35', 'NOTICES'),
  cl('36', 'GOVERNING LAW'),
  cl('37', 'DISPUTE RESOLUTION', [sub('37.1', 'Amicable Settlement'), sub('37.2', 'Arbitration')]),
  cl('38', 'SITE ACCESS AND SECURITY'),
  cl('39', 'IMPORT, EXPORT AND CUSTOMS'),
  cl('40', 'DELAYS TO COMPLETION', [
    sub('40.1', 'Delay in Completion of Fixed Lump Sum WORK', [
      sub('40.1.1', 'Rate of Liquidated Damages'),
      sub('40.1.2', 'Partial Completion'),
    ]),
    sub('40.2', 'Delay in Completion of Unit Priced WORK'),
    sub('40.3', 'Delay in Mobilization'),
    sub('40.4', 'Aggregate Cap on Delay Liquidated Damages'),
  ]),
  cl('41', 'ENTIRE AGREEMENT'),
]

export const b1ClauseNumbers = () => B1_CLAUSE_CATALOGUE.map(c => c.no)

export const b1ClauseTitle = (no) =>
  B1_CLAUSE_CATALOGUE.find(c => c.no === no)?.title || ''

/*
 * Options for one of the three optional Source Sub-clause levels. Level 1 lists
 * the chosen clause's sub-clauses; levels 2 and 3 list the children of the
 * level above, so an unselected parent yields an empty (disabled) drop list.
 */
export function b1SubclauseOptions(clauseNo, level1, level2, level = 1) {
  const clause = B1_CLAUSE_CATALOGUE.find(c => c.no === clauseNo)
  if (!clause) return []
  if (level === 1) return clause.subclauses
  const l1 = clause.subclauses.find(s => s.no === level1)
  if (level === 2) return l1?.children || []
  const l2 = (l1?.children || []).find(s => s.no === level2)
  return l2?.children || []
}

// The title column G auto-links to: the deepest level the engineer selected.
export function b1SubclauseTitle(clauseNo, level1, level2, level3) {
  if (level3) return b1SubclauseOptions(clauseNo, level1, level2, 3).find(s => s.no === level3)?.title || ''
  if (level2) return b1SubclauseOptions(clauseNo, level1, null, 2).find(s => s.no === level2)?.title || ''
  if (level1) return b1SubclauseOptions(clauseNo, null, null, 1).find(s => s.no === level1)?.title || ''
  return ''
}

// The deepest source reference a sub-class points at, phrased for clause text.
export const sourceRef = (s) => {
  const no = s.sourceLevel3 || s.sourceLevel2 || s.sourceLevel1
  if (no) return `Sub-Clause ${no}`
  return s.sourceClauseNo ? `Clause ${s.sourceClauseNo}` : ''
}

/*
 * One-line summary of the structured source columns (B-G). Replaces the old
 * free-text b1Ref field — legacy sub-classes persisted in localStorage still
 * carry b1Ref, so fall back to it rather than showing nothing.
 */
export function sourceRefLabel(s) {
  const ref = sourceRef(s)
  if (!ref) return s.b1Ref || ''
  const title = (s.sourceLevel1 ? s.sourceSubclauseTitle : s.sourceClauseTitle) || ''
  return title ? `${ref} — ${title}` : ref
}

/* ────────────────────────── The drafting entry ────────────────────────── */

// Blank spreadsheet row: every column exists on every entry so the editor never
// has to guard for undefined and a saved tender keeps a stable shape.
export const newSubclass = (code, patch = {}) => ({
  id: newId('b2s'),
  code,
  title: 'New Special Condition',
  sourceClauseNo: '',
  sourceClauseTitle: '',
  sourceLevel1: '',
  sourceLevel2: '',
  sourceLevel3: '',
  sourceSubclauseTitle: '',
  actionType: '',
  actionObject: '',
  evidenceSource: '',
  evidenceFile: '',
  instruction: '',
  content: '',
  ...patch,
})

const sc = (code, title, meta, content) =>
  newSubclass(code, { ...meta, title, content, id: `b2-${code.replace(/\./g, '-')}` })

export const B2_DEFAULT_CLASSES = [
  {
    id: 'b2c-1', code: '1', title: 'DEFINITIONS', status: 'generated',
    description: 'Contract-specific definitions added to Article 1 of the General Conditions.',
    subclasses: [
      sc('1.1', 'CALL-OFF VALUE', {
        sourceClauseNo: '1', sourceClauseTitle: 'DEFINITIONS',
        actionType: 'ADD', actionObject: 'Definition',
        evidenceSource: 'Previous Contract',
        instruction: 'Add a CALL-OFF VALUE definition to Article 1 fixing the authorised ceiling COMPANY approves per call-off and the maximum CONTRACTOR may invoice against it.',
      },
        'Article 1 is hereby amended to include the following definition:\n\n“CALL-OFF VALUE” means the total monetary amount authorized by COMPANY for a specific call-off or purchase order under this CONTRACT. Such amount shall be separately identified in the relevant call-off documentation and is the maximum sum CONTRACTOR is entitled to invoice for that particular scope of services or WORK, unless otherwise agreed in writing by the COMPANY.'),
    ],
  },
  {
    id: 'b2c-40', code: '40', title: 'DELAYS TO COMPLETION', status: 'generated',
    description: 'Liquidated damages for delayed completion and delayed mobilization, and the aggregate cap on them.',
    subclasses: [
      sc('40.1', 'Delay in Completion of Fixed Lump Sum WORK', {
        sourceClauseNo: '40', sourceClauseTitle: 'DELAYS TO COMPLETION',
        sourceLevel1: '40.1', sourceSubclauseTitle: 'Delay in Completion of Fixed Lump Sum WORK',
        actionType: 'DELETE_AND_REPLACE', actionObject: 'Subclause',
        evidenceSource: 'Schedule of Prices (Section E)',
        instruction: 'Replace the standard delay damages wording with 0.5% of the CALL-OFF VALUE per day of delay for lump sum WORK under Schedule 1, capped at 10%, and pro-rate the damages where only part of the CALL-OFF is late.',
      },
        'Sub-Clause 40.1 is hereby deleted and replaced by the following:\n\nIf CONTRACTOR fails to complete the WORK under a lump sum CALL-OFF, Schedule 1 of Section E (or any part thereof) within the period specified, or within any extension granted in writing by the CONTRACT HOLDER, CONTRACTOR shall pay COMPANY liquidated damages at a rate of zero-point five percent (0.5%) of the CALL-OFF VALUE for each day of delay beyond the agreed completion date of that CALL-OFF, up to a maximum of ten percent (10%) of the CALL-OFF VALUE.\n\nIf only a portion or sub-task of the WORK under a CALL-OFF is delayed, liquidated damages shall be calculated based on the portion of the CALL-OFF VALUE attributable to the delayed work, as reasonably determined by the breakdown or schedule of rates.'),
      sc('40.2', 'Delay in Completion of Unit Priced WORK', {
        sourceClauseNo: '40', sourceClauseTitle: 'DELAYS TO COMPLETION',
        sourceLevel1: '40.2', sourceSubclauseTitle: 'Delay in Completion of Unit Priced WORK',
        actionType: 'DELETE_AND_REPLACE', actionObject: 'Subclause',
        evidenceSource: 'Schedule of Prices (Section E)',
        instruction: 'Replace the sub-clause with a 1% per day liquidated damages rate on the CALL-OFF VALUE for unit priced WORK under Schedules 2, 3, 4 and TPM/TPS, capped at 10%, pro-rated for partial delay.',
      },
        'Sub-Clause 40.2 is hereby deleted and replaced by the following:\n\nIf CONTRACTOR fails to complete the WORK covered by Schedules 2, 3, and 4 and TPM/TPS of Section E (or any part thereof) within the period specified, or within any extension granted in writing by the CONTRACT HOLDER, CONTRACTOR shall pay COMPANY liquidated damages at a rate of one percent (1%) of the CALL-OFF VALUE for each day of delay beyond the agreed completion date of that CALL-OFF, up to a maximum of ten percent (10%) of the CALL-OFF VALUE.\n\nIf only a portion or sub-task of the WORK under a CALL-OFF is delayed, liquidated damages shall be calculated based on the portion of the CALL-OFF VALUE attributable to the delayed work, as reasonably determined by the breakdown or schedule of rates.'),
      sc('40.3', 'Delay in Mobilization', {
        sourceClauseNo: '40', sourceClauseTitle: 'DELAYS TO COMPLETION',
        sourceLevel1: '40.3', sourceSubclauseTitle: 'Delay in Mobilization',
        actionType: 'DELETE_AND_REPLACE', actionObject: 'Subclause',
        evidenceSource: 'Scope of Work (Section D)',
        instruction: 'Replace the sub-clause so late mobilization against the Clause 3 Section D duration attracts 1% of the CALL-OFF VALUE per day capped at 10%, excluding force majeure and COMPANY GROUP default.',
      },
        'Sub-Clause 40.3 is hereby deleted and replaced by the following:\n\nIf CONTRACTOR fails to commence the WORK in accordance within the mobilization duration stipulated in Clause 3 of Section D, and such failure is neither attributable to force majeure (as defined in Section B1) nor due to a default by COMPANY GROUP, CONTRACTOR shall pay COMPANY liquidated damages at a rate of one percent (1%) of the CALL-OFF VALUE for each day of delay beyond the mobilization duration stipulated in Section D, up to a maximum of ten percent (10%) of the CALL-OFF VALUE unless otherwise specified in SECTION E Schedule of Prices.'),
      sc('40.4', 'Aggregate Cap on Delay Liquidated Damages', {
        sourceClauseNo: '40', sourceClauseTitle: 'DELAYS TO COMPLETION',
        sourceLevel1: '40.4', sourceSubclauseTitle: 'Aggregate Cap on Delay Liquidated Damages',
        actionType: 'AMEND', actionObject: 'Value',
        evidenceSource: 'Schedule of Prices (Section E)',
        instruction: 'Amend the aggregate cap on all Clause 40 delay liquidated damages to fifteen percent (15%) of the CALL-OFF VALUE and give COMPANY a discretionary right to terminate once it is exceeded.',
      },
        'Sub-Clause 40.4 is hereby amended as the following:\n\nIn no event shall the sum of CONTRACTOR\'s liability to COMPANY under any CALL-OFF for all delay liquidated damages assessed further to this Clause 40 exceed, in the aggregate, fifteen percent (15%) of the CALL-OFF VALUE unless otherwise specified in SECTION E Schedule of Prices. In the event that CONTRACTOR\'s liability for delay liquidated damages under any CALL-OFF exceeds this fifteen percent (15%) threshold, the COMPANY shall have the right, at its absolute discretion, to terminate the CONTRACT.'),
    ],
  },
]

// A fresh, deep copy — the editor mutates its own working set, never the seed.
export const cloneB2Classes = () => B2_DEFAULT_CLASSES.map(c => ({
  ...c,
  subclasses: c.subclasses.map(s => ({ ...s })),
}))

export const countSubclasses = (classes) => (classes || []).reduce((n, c) => n + c.subclasses.length, 0)

/* ────────────────────── Per-class approval lifecycle ──────────────────────
 * draft -> generated -> approved. A class must have its template drafted and
 * that draft reviewed before Section B2 as a whole can be approved, so the
 * status rides on the class object and persists in tender.sectionB2Classes. */

/*
 * Classes saved before the lifecycle existed carry no status. They cannot be
 * assumed approved (nobody reviewed them) and must not be stuck either, so a
 * class whose sub-classes all already carry clause text is read as "generated"
 * — one review away — and anything else falls back to draft.
 */
export function classStatus(cls) {
  if (cls?.status) return cls.status
  const subs = cls?.subclasses || []
  return subs.length && subs.every(s => (s.content || '').trim()) ? 'generated' : 'draft'
}

// Classes still blocking the section-level approval.
export const classesPendingApproval = (classes) =>
  (classes || []).filter(c => classStatus(c) !== 'approved')

/* ────────────────────────── Column L: the AI draft ────────────────────────── */

const LEAD_IN = {
  ADD: (ref, obj) => `${ref} is hereby amended to include the following ${obj.toLowerCase()}:`,
  AMEND: (ref) => `${ref} is hereby amended as the following:`,
  DELETE: (ref) => `${ref} is hereby deleted in its entirety.`,
  DELETE_AND_REPLACE: (ref) => `${ref} is hereby deleted and replaced by the following:`,
  RENUMBER: (ref) => `${ref} is hereby renumbered as follows:`,
}

/*
 * Mock draft of column L from the Drafting Instruction (K) and evidence (J).
 * It reuses applyAiInstruction — the same mock engine behind every
 * select-to-edit-with-AI surface — so there is one place to swap in a real LLM.
 */
export function draftB2Clause(s) {
  const instruction = (s.instruction || '').trim()
  if (!instruction) return s.content || ''
  const object = s.actionObject || 'Clause'
  const ref = sourceRef(s) || `Clause ${s.code}`
  const lead = (LEAD_IN[s.actionType] || LEAD_IN.AMEND)(ref, object)
  if (s.actionType === 'DELETE') return lead

  const seed = `CONTRACTOR shall comply with the requirements of this ${object.toLowerCase()} in accordance with the CONTRACT.`
  const body = applyAiInstruction(seed, instruction).trim()
  const provenance = s.evidenceSource
    ? `\n\nThis ${object.toLowerCase()} is drafted on the basis of ${s.evidenceSource}${s.evidenceFile ? ` (${s.evidenceFile})` : ''}.`
    : ''
  return `${lead}\n\n${body}${provenance}`
}

/* ────────────────────────── Export to the ITT ────────────────────────── */

/*
 * One clause class as a document: its heading and one entry per sub-class, in
 * export order. The on-screen Section B2 template (B2ClassEditor) and
 * renderB2Text() below both build from this, so the template the engineer
 * reviews and approves cannot drift from the text that is exported.
 */
export function b2ClassDocument(cls) {
  const tagsOf = (s) => [
    [s.actionType, s.actionObject].filter(Boolean).join(' '),
    sourceRefLabel(s) && `Source: ${sourceRefLabel(s)}`,
  ].filter(Boolean).join(' · ')

  return {
    heading: `${cls?.code ? `${cls.code}. ` : ''}${cls?.title || ''}`,
    entries: (cls?.subclasses || []).map(s => ({
      id: s.id,
      heading: `${s.code || ''} ${s.title || ''}`.trim(),
      tags: tagsOf(s),
      text: (s.content || '').trim(),
    })),
  }
}

// Flatten the classes to the plain text that fills the B2 template's
// "clauses where deviate from B1" field on export. The metadata columns ride
// along in a single bracketed tag so the exported section still reads as prose.
export function renderB2Text(classes) {
  const lines = []
  const list = classes || []
  list.forEach(c => {
    if (!c.subclasses.length) return
    const doc = b2ClassDocument(c)
    lines.push(doc.heading)
    doc.entries.forEach(e => {
      lines.push(`${e.heading}${e.tags ? ` [${e.tags}]` : ''}`)
      lines.push(e.text)
    })
  })
  return lines.length ? lines.join('\n') : B2_NOT_USED_NOTE
}
