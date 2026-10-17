/*
 * PSF Strategy — document building, migration and the read-only derivations the
 * page and its stages share. Plain functions (no components) so the .jsx files
 * stay Fast-Refresh clean.
 *
 * The document shape mirrors the Next.js app's `PsfDocument`
 * (tender-management-frontend psf-form.types.ts) and is persisted as-is on
 * `tender.psfDocument`.
 */

import {
  EM_DASH, toCheckboxes, PSF_REVIEW_OPTIONS, PSF_ESTIMATE_BASIS_OPTIONS,
  PSF_DEFAULT_CONFIDENCE_LEVEL, PSF_TENDER_PLAN_TYPES, PSF_MILESTONE_LABELS,
  PSF_TENDER_STRATEGY_OPTIONS, PSF_COMPETITIVE_DROP_LIST, PSF_SINGLE_SOURCE_DROP_LIST,
  PSF_TENDERER_ROW_COUNT, PSF_ICV_REQUIREMENTS, PSF_STRATEGY_TEMPLATES,
  PSF_PREQUAL_DOCUMENT, PSF_SUPPORTING_DOCUMENTS, PSF_TEAM_ROLES,
} from '../../data/psfTemplate'
import { tenderRef } from '../../utils/tenderRef'

/** Every upload slot on the upload stage, in on-screen order. */
export const PSF_UPLOAD_SLOTS = [
  ...PSF_STRATEGY_TEMPLATES.map(t => ({ id: t.id, label: t.label })),
  PSF_PREQUAL_DOCUMENT,
  ...PSF_SUPPORTING_DOCUMENTS,
]

/** Attached file names, in slot order — so the list never reshuffles. */
export function attachmentNames(uploads) {
  return PSF_UPLOAD_SLOTS
    .map(slot => uploads?.[slot.id]?.name)
    .filter(Boolean)
}

export const todayKey = () => new Date().toISOString().split('T')[0]

/* ── Strategy completeness (the page guard) ─────────────────────────────── */

/** Statuses a tender sits in while pre-qualification is still running. */
const PREQUAL_OPEN_STATUSES = new Set([
  'cif_draft', 'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4',
  'prequal_final_review', 'prequal_rejected',
])

/** The Technical Evaluation Matrix is always included, ticked or not. */
const MANDATORY_TEMPLATE_IDS = ['technical-eval-matrix']

/*
 * "Complete" = every selected template has been submitted
 * (`templateMeta[id].submittedAt`), falling back to a non-empty register so
 * seeded tenders still count. Pre-qualification is complete once the tender
 * has left the prequal_* statuses (status `draft` or later).
 */
export function isStrategyComplete(tender, templateDefs) {
  if (!tender) return false
  const selected = Array.isArray(tender.selectedTemplates)
    ? tender.selectedTemplates
    : [...templateDefs.map(t => t.id), 'pre-qual']
  const ids = [...new Set([...selected, ...MANDATORY_TEMPLATE_IDS])]
  return ids.every(id => {
    if (tender.templateMeta?.[id]?.submittedAt) return true
    if (id === 'pre-qual') return !!tender.status && !PREQUAL_OPEN_STATUSES.has(tender.status)
    const dataKey = templateDefs.find(t => t.id === id)?.dataKey
    return dataKey ? (tender[dataKey]?.length || 0) > 0 : true
  })
}

/* ── Assigned team ─────────────────────────────────────────────────────── */

/** `[{ id, name }]` currently on the tender for one team role. */
export function membersFor(tender, roleDef) {
  const list = tender?.[roleDef.tenderKey]
  if (Array.isArray(list) && list.length) return list
  if (roleDef.singleKey && tender?.[roleDef.singleKey]) return [tender[roleDef.singleKey]]
  return []
}

export function isTeamComplete(tender) {
  return PSF_TEAM_ROLES.every(r => membersFor(tender, r).length > 0)
}

/** "John Smith, Layla Nasser (HSE), Omar Habib (LC)" — or an em dash. */
export function summariseTeam(tender) {
  const parts = PSF_TEAM_ROLES.flatMap(r => membersFor(tender, r)
    .map(m => m?.name)
    .filter(Boolean)
    .map(name => (r.suffix ? `${name} (${r.suffix})` : name)))
  return parts.length ? parts.join(', ') : EM_DASH
}

/* ── Building the document ─────────────────────────────────────────────── */

/** The template's HISTORY tables start blank apart from the zeroed money rows. */
function emptyHistory(includeActualSpend) {
  const base = { awardDate: '', expiryDate: '', contractorName: '', method: '', acv: '0.00' }
  return includeActualSpend ? { ...base, actualSpend: '0.00' } : base
}

/** `OMR 500,000` — the budget already carries its currency on most tenders. */
function formatValue(tender) {
  const budget = tender?.budget ? String(tender.budget) : ''
  if (!budget) return EM_DASH
  const currency = tender?.currency
  return currency && !budget.includes(currency) && /^[\d.,\s]+$/.test(budget) ? `${currency} ${budget}` : budget
}

/* Every drafted ("AI to generate…") field's prose, in one place. */
function buildNarrative(tender, uploads) {
  const title = tender?.title || 'This requirement'
  const value = formatValue(tender)
  const department = tender?.department || 'the requesting department'
  const category = tender?.tenderType || 'the applicable'
  const uploaded = attachmentNames(uploads).length
  const qualified = (tender?.prequalBidders || []).filter(b => !b.droppedAt).length
  const bidders = qualified || tender?.bidders || 0

  return {
    background:
      `${title} is being tendered by ${department} with an anticipated value of ${value}. ` +
      `Pre-qualification returned ${bidders} qualified bidder(s) following QHSE, technical and ` +
      `administrative assessment${tender?.financialAssessmentRequired ? ', together with a financial assessment completed by the Contract Engineer' : ''}. ` +
      'The strategy templates listed in this submission were completed and re-submitted as supporting evidence.',

    justification:
      `The requirement is being taken to tender to secure continuity of supply for ${department} ` +
      `under a ${category.toLowerCase()} category award. The contract strategy, company estimate and ` +
      'risk assessments prepared for this tender support proceeding on the basis set out below.',

    scopeOverview:
      `Approval is sought to proceed to tender for ${title} under ${category} category. The contract ` +
      'strategy, company estimate, risk assessments and negotiation approach have been reviewed. ' +
      `${uploaded} supporting document(s) accompany this form. The recommended award route is set out ` +
      'in the tender strategy section below.',

    manpowerRequirements:
      `Manpower requirements follow the scope of work prepared for ${title}. No dedicated Oman LNG ` +
      'headcount is created by this award; the contractor supplies personnel for the duration of the contract.',

    goodsServicesRequirements:
      'Goods and services requirements are as set out in the scope of work, priced against the company ' +
      `estimate of ${(tender?.companyEstimate || []).length} line item(s) and covered by the technical ` +
      `evaluation matrix's ${(tender?.technicalEvalMatrix || []).length} criteria.`,

    otherRequirements:
      `${(tender?.contractRiskAssessment || []).length} contract risk(s) and ` +
      `${(tender?.hseRiskAssessment || []).length} HSE hazard(s) have been assessed for this scope, ` +
      `together with ${(tender?.icvPlan || []).length} LC commitment(s). Any residual requirement is ` +
      'carried in the tender documents.',

    benchmarking:
      'The estimate has been benchmarked against previous contract rates and available market ' +
      'intelligence for comparable scope, with escalation applied to bring historic rates to current ' +
      `terms. The company estimate is the basis for the anticipated value of ${value}.`,

    negotiationDetails:
      'Negotiation will follow the approved negotiation template, covering the ' +
      `${(tender?.negotiationStrategy || []).length} negotiation theme(s) prepared for this tender and ` +
      'informed by the proposed scope of work, market intelligence, the company estimate and the LC ' +
      'requirements set out in this submission.',

    tendererJustification:
      'Tender Board is kindly requested to endorse the bidder list below, drawn from the ERP and JSRS ' +
      'registry and assessed at pre-qualification against the QHSE, technical and administrative criteria.',

    recommendation:
      'Tender Board is kindly requested to endorse the sourcing strategy, the bidder list, the technical ' +
      `evaluation matrix, the company estimate and the negotiation strategy for ${title}, at an ` +
      `anticipated value of ${value}.`,
  }
}

/*
 * The TENDERER LIST seeds one row per bidder pre-qualification carried through,
 * then tops the register up to the template's four rows.
 */
function buildTendererRows(tender) {
  const qualified = (tender?.prequalBidders || []).filter(b => !b.droppedAt)
  const seeded = qualified.map((b, i) => ({
    id: `tenderer-${i}`,
    reference: b.name || '',
    prequalResult: 'Qualified',
    justification: 'Met the QHSE, technical and administrative pre-qualification criteria.',
  }))
  const blanks = Array.from({ length: Math.max(0, PSF_TENDERER_ROW_COUNT - seeded.length) }, (_, i) => ({
    id: `tenderer-blank-${i}`, reference: '', prequalResult: '', justification: '',
  }))
  return [...seeded, ...blanks]
}

function buildIcvRows() {
  return PSF_ICV_REQUIREMENTS.map(row => ({ id: `icv-${row.ordinal}`, ...row, answer: '', comment: '' }))
}

export function buildPsf(tender, uploads) {
  return {
    attachments: attachmentNames(uploads),

    header: {
      title: tender?.title || EM_DASH,
      contractNumber: tenderRef(tender) || EM_DASH,
      anticipatedValue: formatValue(tender),
      duration: tender?.duration || EM_DASH,
      sourceOfFunds: tender?.costCode ? `Cost Centre ${tender.costCode}` : 'Operating Budget',
      costCentre: tender?.costCode || EM_DASH,
      expenditureType: tender?.tenderType === 'Goods' ? 'Capital Expenditure' : 'Operating Expenditure',
    },

    history: { previous: emptyHistory(true), existing: emptyHistory(false), currentSpend: '' },

    reviews: toCheckboxes(PSF_REVIEW_OPTIONS),

    narrative: buildNarrative(tender, uploads),

    estimate: {
      confidenceLevel: PSF_DEFAULT_CONFIDENCE_LEVEL,
      basis: toCheckboxes(PSF_ESTIMATE_BASIS_OPTIONS),
    },

    tenderPlan: {
      types: toCheckboxes(PSF_TENDER_PLAN_TYPES),
      requiredBy: tender?.deadline || '',
      // Index-keyed: the template repeats "PSF Submitted to CPL for Review".
      milestones: PSF_MILESTONE_LABELS.map((label, i) => ({ id: `milestone-${i}`, label, planned: '', actual: '' })),
      deviations: '',
    },

    tenderStrategy: toCheckboxes(PSF_TENDER_STRATEGY_OPTIONS),

    dropLists: {
      competitive: toCheckboxes(PSF_COMPETITIVE_DROP_LIST),
      singleSourceOem: toCheckboxes(PSF_SINGLE_SOURCE_DROP_LIST),
    },

    assessments: { technical: '', cutOff: '', commercial: '' },

    alternativesConsidered: '',
    assessmentOtherDetails: '',
    omanisationImplications: '',
    omanisationOtherDetails: '',

    negotiation: { applicability: 'Applicable (see below)' },
    strategyAdditionalNotes: '',

    tendererList: { source: '', rows: buildTendererRows(tender) },
    tendererAdditionalNotes: '',

    icvReviewDetail: '',
    icvRequirements: buildIcvRows(),
  }
}

/* ── Migrating a saved document ────────────────────────────────────────── */

/** Re-label a saved checkbox group from today's seeds, keeping every tick. */
function relabel(saved, seeds) {
  if (!Array.isArray(saved)) return toCheckboxes(seeds)
  const byId = new Map(seeds.map(s => [s.id, s.label]))
  return saved.map(box => (byId.has(box.id) ? { ...box, label: byId.get(box.id) } : box))
}

/*
 * Brings any saved PSF onto the current shape so old data still loads:
 *  - the earliest flat shape (`background` / `executiveSummary` at the top
 *    level) is rebuilt on the full template, carrying both prose fields across;
 *  - a full-shape document keeps every value, gains any slice it is missing and
 *    picks up today's labels (ICV → LC) by stable id.
 */
export function normalisePsf(psf, tender, uploads) {
  if (!psf) return null
  const rebuilt = buildPsf(tender, uploads)

  if (!(psf.narrative && Array.isArray(psf.reviews))) {
    return {
      ...rebuilt,
      header: { ...rebuilt.header, ...(psf.title ? { title: psf.title } : {}) },
      narrative: {
        ...rebuilt.narrative,
        ...(psf.background ? { background: psf.background } : {}),
        ...(psf.executiveSummary ? { scopeOverview: psf.executiveSummary } : {}),
      },
    }
  }

  const icvText = new Map(PSF_ICV_REQUIREMENTS.map(r => [r.ordinal, r.requirement]))
  return {
    ...rebuilt,
    ...psf,
    header: { ...rebuilt.header, ...psf.header },
    history: { ...rebuilt.history, ...psf.history },
    narrative: { ...rebuilt.narrative, ...psf.narrative },
    reviews: relabel(psf.reviews, PSF_REVIEW_OPTIONS),
    estimate: {
      ...rebuilt.estimate,
      ...psf.estimate,
      basis: relabel(psf.estimate?.basis, PSF_ESTIMATE_BASIS_OPTIONS),
    },
    tenderPlan: {
      ...rebuilt.tenderPlan,
      ...psf.tenderPlan,
      types: relabel(psf.tenderPlan?.types, PSF_TENDER_PLAN_TYPES),
      milestones: Array.isArray(psf.tenderPlan?.milestones) && psf.tenderPlan.milestones.length
        ? psf.tenderPlan.milestones
        : rebuilt.tenderPlan.milestones,
    },
    tenderStrategy: relabel(psf.tenderStrategy, PSF_TENDER_STRATEGY_OPTIONS),
    dropLists: {
      competitive: relabel(psf.dropLists?.competitive, PSF_COMPETITIVE_DROP_LIST),
      singleSourceOem: relabel(psf.dropLists?.singleSourceOem, PSF_SINGLE_SOURCE_DROP_LIST),
    },
    assessments: { ...rebuilt.assessments, ...psf.assessments },
    negotiation: { ...rebuilt.negotiation, ...psf.negotiation },
    tendererList: {
      ...rebuilt.tendererList,
      ...psf.tendererList,
      rows: Array.isArray(psf.tendererList?.rows) ? psf.tendererList.rows : rebuilt.tendererList.rows,
    },
    icvRequirements: Array.isArray(psf.icvRequirements) && psf.icvRequirements.length
      ? psf.icvRequirements.map(r => (icvText.has(r.ordinal) ? { ...r, requirement: icvText.get(r.ordinal) } : r))
      : rebuilt.icvRequirements,
  }
}
