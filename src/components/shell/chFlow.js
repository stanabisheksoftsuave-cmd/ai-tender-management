/*
 * Contract Holder shell helpers — pure data/logic shared by the Sidebar, the
 * CH Dashboard, the Contract Strategy hub and Tender Tracking.
 *
 * Ported from the main app's
 *   components/contract-holder/lib/{strategyFlow,nextActions,attentionFilters}.ts
 *   components/dashboard/{attention-filter,attention-markers}.ts
 * and re-expressed against this app's local tender objects (TenderContext),
 * since there is no backend to compute `next_action` / `urgent` for us.
 *
 * Kept in a .js module (no components) so the .jsx files that import it stay
 * Fast-Refresh friendly.
 */
import {
  STRATEGY_DOCUMENTS,
  includedTemplateIds,
  isTemplateComplete as templatesLaneIsComplete,
} from '../../utils/strategyTemplates'

// ── Strategy templates (sidebar grandchildren) ───────────────────────────────

/** The seven strategy templates in the main app's order and labels (ICV reads
 * "LC", PQQ "Pre-Qualification Document") — straight from the Templates lane. */
export const STRATEGY_TEMPLATE_ITEMS = STRATEGY_DOCUMENTS.map(d => ({ key: d.id, label: d.label }))

export const templateLabel = (key) =>
  STRATEGY_TEMPLATE_ITEMS.find(it => it.key === key)?.label || null

/**
 * A strategy template counts as completed by the Strategy Templates page's own
 * rule (utils/strategyTemplates): `templateMeta[id].submittedAt`, falling back
 * to "register rows saved" for seeded tenders; Pre-Qualification completes once
 * the tender has left the PQ statuses ('draft' or later). Sharing the one rule
 * keeps the sidebar's PSF lock in step with "Move Forward to PSF Strategy".
 */
export function isTemplateComplete(tender, key) {
  return templatesLaneIsComplete(tender, key)
}

/** The included template ids (selection + mandatory TEM), or null until the
 * Contract Holder has saved a selection. */
export const selectedTemplateKeys = (tender) =>
  Array.isArray(tender?.selectedTemplates) ? includedTemplateIds(tender) : null

/** Every included template completed — the PSF Strategy unlock rule. */
export function allTemplatesComplete(tender) {
  if (!selectedTemplateKeys(tender)) return false
  // includedTemplateIds adds the mandatory Technical Evaluation Matrix.
  return includedTemplateIds(tender).every(id => isTemplateComplete(tender, id))
}

// ── CIF progress stage ────────────────────────────────────────────────────────

const LEGACY_CIF_STATUSES = [
  'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4',
  'prequal_final_review', 'prequal_rejected',
]

/**
 * The tender's CIF progress stage (main app's `CifSummary.progressStage`).
 * New tenders carry `cifProgressStage`; older ones are inferred: a CIF that
 * reached the PQ statuses, or a draft with a template selection, is in its
 * strategy templates; a bare `cif_draft` is still being created.
 */
export function cifStageOf(tender) {
  if (!tender) return null
  if (tender.cifProgressStage) return tender.cifProgressStage
  if (tender.status === 'cif_draft') return 'cif_creation'
  if (LEGACY_CIF_STATUSES.includes(tender.status)) {
    return Array.isArray(tender.selectedTemplates) ? 'strategy_templates' : 'select_templates'
  }
  if (tender.status === 'draft' && Array.isArray(tender.selectedTemplates)) return 'strategy_templates'
  return null
}

/**
 * The drafts the sidebar's tender picker offers — the main app lists CIFs still
 * in `draft` status (PSF not yet submitted) that are past CIF creation.
 */
export function isPickableStrategyTender(tender) {
  const stage = cifStageOf(tender)
  if (!stage || stage === 'cif_creation') return false
  return !tender.psfCompleted
}

// '/contract-strategy/new' and friends carry no tender.
const STRATEGY_ROUTE_BASES = ['contract-strategy', 'strategy-templates', 'pre-qualification', 'psf-strategy']

/**
 * The tender a Contract Strategy route is about, or null. Scoped to the
 * strategy routes only — a /technical-eval/:id or /create-itt/:id page must
 * not silently retarget the strategy sub-items (prototype bug §8.A-18).
 */
export function strategyTenderIdFromPath(pathname) {
  const [, base, id] = String(pathname || '').split('/')
  if (!STRATEGY_ROUTE_BASES.includes(base)) return null
  if (!id || id === 'new') return null
  return decodeURIComponent(id)
}

// ── Next action (dashboard "Needs your attention") ───────────────────────────

export const NEXT_ACTION_LABELS = {
  resume_cif: 'Resume CIF',
  select_templates: 'Select Templates',
  complete_strategy_artefacts: 'Complete Strategy',
  pqq_bidder_matching: 'PQQ Bidder Matching',
  pqq_questionnaire: 'PQQ Questionnaire',
  pqq_response_review: 'PQQ Response Review',
  pqq_financial_assessment: 'PQQ Financial Assessment',
  pqq_financial_returned: 'PQQ Financial Returned',
  pqq_final_review: 'PQQ Final Review',
  pqq_rejected: 'PQQ Rejected',
  submit_psf: 'Submit PSF',
  create_itt: 'Create ITT',
  complete_itt_sections: 'Complete ITT Sections',
  score_technical_evaluation: 'Score Technical Evaluation',
  revise_technical_evaluation: 'Revise Technical Evaluation',
}

export function describeNextAction(type) {
  if (NEXT_ACTION_LABELS[type]) return NEXT_ACTION_LABELS[type]
  const words = String(type || '').replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'View'
}

// The Contract Holder fills ITT Sections D and F (see ITTCreation's SECTION_OWNER).
const CH_ITT_SECTIONS = ['sectionD', 'sectionF']

const PQQ_ACTION_BY_STATUS = {
  prequal_stage1: 'pqq_bidder_matching',
  prequal_stage2: 'pqq_questionnaire',
  prequal_stage3: 'pqq_response_review',
}

function pqqActionFor(tender) {
  if (PQQ_ACTION_BY_STATUS[tender.status]) return PQQ_ACTION_BY_STATUS[tender.status]
  if (tender.status === 'prequal_final_review') {
    // Back from the Contract Engineer's financial assessment when any bidder
    // carries a Stage 4 result; otherwise the CH skipped it.
    const returned = (tender.prequalBidders || []).some(b => b?.stage4?.result)
    return returned ? 'pqq_financial_returned' : 'pqq_final_review'
  }
  return null
}

function wasTechnicalReturned(tender) {
  const d = tender.scmDecisions || {}
  if (d.scm_gate1?.decision === 'returned') return true
  const g2 = d.scm_gate2
  return g2?.decision === 'returned' && (g2.target === 'tech' || g2.target === 'both')
}

/**
 * The Contract Holder's next action on a tender, or null when nothing waits on
 * them (it sits with another role, or is beyond their part of the flow).
 * Mirrors the main app's server-side `next_action` for owner = contract_holder.
 *
 * Stage 4 (financial assessment) is the Contract Engineer's, so it is never a
 * CH action; `prequal_rejected` has nothing left to do.
 */
export function chNextAction(tender) {
  if (!tender) return null
  const stage = tender.cifProgressStage || null

  if (tender.status === 'cif_draft') {
    if (!stage || stage === 'cif_creation') return 'resume_cif'
    if (stage === 'select_templates') return 'select_templates'
    if (stage === 'strategy_templates') return 'complete_strategy_artefacts'
    if (stage === 'psf') return tender.psfCompleted ? null : 'submit_psf'
    return 'resume_cif'
  }

  const inPq = !!PQQ_ACTION_BY_STATUS[tender.status]
    || ['prequal_stage4', 'prequal_final_review', 'prequal_rejected'].includes(tender.status)
  if (inPq) {
    // A CIF still choosing / filling its strategy templates — that comes first;
    // the PQQ is just one of those templates.
    const keys = selectedTemplateKeys(tender)
    if (stage === 'select_templates' || (stage && !keys)) return 'select_templates'
    if (stage === 'strategy_templates') {
      const othersPending = STRATEGY_TEMPLATE_ITEMS
        .filter(it => it.key !== 'pre-qual' && (keys || []).includes(it.key))
        .some(it => !isTemplateComplete(tender, it.key))
      if (othersPending) return 'complete_strategy_artefacts'
    }
    // Pre-Qualification left out of the selected templates: the tender never
    // walks the PQ stages, so its next step is the rest of the strategy.
    if (keys && !keys.includes('pre-qual')) {
      if (stage === 'psf') return tender.psfCompleted ? null : 'submit_psf'
      return stage ? 'complete_strategy_artefacts' : null
    }
    return pqqActionFor(tender)
  }

  if (tender.status === 'draft') {
    const cifFlow = Array.isArray(tender.selectedTemplates) || !!stage
    if (cifFlow && !tender.psfCompleted) {
      // Moved forward to PSF (or, for older tenders with no recorded stage,
      // every template already done) → the PSF is what's left.
      if (stage === 'psf' || (!stage && allTemplatesComplete(tender))) return 'submit_psf'
      return 'complete_strategy_artefacts'
    }
    if (!tender.sectionsGenerated) return 'create_itt'
    const approved = tender.sectionApproved || {}
    if (CH_ITT_SECTIONS.some(id => !approved[id])) return 'complete_itt_sections'
    return null
  }

  if (tender.status === 'tech_eval' || (tender.status === 'parallel_eval' && tender.techSide !== 'done')) {
    return wasTechnicalReturned(tender) ? 'revise_technical_evaluation' : 'score_technical_evaluation'
  }
  return null
}

/**
 * The row-menu action for a CH next action (main app's
 * getContractHolderNextAction), mapped onto this app's routes.
 */
export function chNextActionLink(tender, type) {
  if (!tender || !type) return null
  const id = encodeURIComponent(tender.id)
  switch (type) {
    case 'resume_cif':                  return { label: 'Resume CIF', href: `/contract-strategy/${id}` }
    case 'select_templates':
    case 'complete_strategy_artefacts': return { label: 'Continue Strategy', href: `/strategy-templates/${id}` }
    case 'pqq_bidder_matching':         return { label: 'Continue Bidder Matching', href: `/pre-qualification/${id}` }
    case 'pqq_questionnaire':           return { label: 'Continue Questionnaire', href: `/pre-qualification/${id}` }
    case 'pqq_response_review':         return { label: 'Continue Response Review', href: `/pre-qualification/${id}` }
    case 'pqq_financial_returned':      return { label: 'Review Financial Assessment', href: `/pre-qualification/${id}` }
    case 'pqq_final_review':            return { label: 'Review & Submit Pre-Qualification', href: `/pre-qualification/${id}` }
    case 'submit_psf':                  return { label: 'Submit PSF', href: `/psf-strategy/${id}` }
    case 'create_itt':                  return { label: 'Create ITT', href: `/create-itt/${id}` }
    case 'complete_itt_sections':       return { label: 'Edit ITT', href: `/create-itt/${id}` }
    case 'score_technical_evaluation':  return { label: 'Technical Evaluation', href: `/technical-eval/${id}` }
    case 'revise_technical_evaluation': return { label: 'Revise Evaluation', href: `/technical-eval/${id}` }
    default:                            return null
  }
}

// Action-type groups for the attention filter (main app's ACTION_GROUPS).
export const ACTION_GROUPS = [
  { value: 'strategy', label: 'Contract Strategy',
    includes: t => t === 'resume_cif' || t === 'select_templates' || t === 'complete_strategy_artefacts' },
  { value: 'pqq', label: 'PQQ', includes: t => t.startsWith('pqq_') },
  { value: 'psf', label: 'PSF', includes: t => t === 'submit_psf' },
  { value: 'itt', label: 'ITT', includes: t => t === 'create_itt' || t === 'complete_itt_sections' },
  { value: 'technical_evaluation', label: 'Technical Evaluation',
    includes: t => t === 'score_technical_evaluation' || t === 'revise_technical_evaluation' },
]

export const ALL_FILTER = 'all'
export const URGENT_FILTER = 'urgent'

/** All / Urgent, then one option per action group that has rows, in group order. */
export function buildAttentionOptions(rows) {
  const urgent = rows.filter(r => r.urgent).length
  const groups = []
  const other = new Map()
  ACTION_GROUPS.forEach(g => {
    const types = [...new Set(rows.filter(r => g.includes(r.nextAction)).map(r => r.nextAction))]
    const count = rows.filter(r => g.includes(r.nextAction)).length
    if (count > 0) groups.push({ value: g.value, label: g.label, count, actionTypes: types })
  })
  rows.forEach(r => {
    if (ACTION_GROUPS.some(g => g.includes(r.nextAction))) return
    const prev = other.get(r.nextAction)
    other.set(r.nextAction, {
      value: r.nextAction, label: describeNextAction(r.nextAction),
      count: (prev?.count || 0) + 1, actionTypes: [r.nextAction],
    })
  })
  return [
    { value: ALL_FILTER, label: 'All', count: rows.length },
    { value: URGENT_FILTER, label: 'Urgent', count: urgent },
    ...groups,
    ...other.values(),
  ]
}

// ── Dates, urgency, money ─────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000

function parseDay(value) {
  if (!value) return null
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value))
  const d = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Whole days from today to the deadline (negative = overdue), or null. */
export function deadlineInDays(deadline, now = new Date()) {
  const d = parseDay(deadline)
  if (!d) return null
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((d.getTime() - today.getTime()) / DAY_MS)
}

/**
 * "Urgent" (no server to tell us): a tender that is waiting on the Contract
 * Holder AND whose deadline is overdue or falls within the next 7 days.
 */
export const URGENT_WINDOW_DAYS = 7
export function isUrgent(daysLeft) {
  return daysLeft !== null && daysLeft <= URGENT_WINDOW_DAYS
}

export const daysOverdue = (daysLeft) => (daysLeft !== null && daysLeft < 0 ? -daysLeft : null)
export const describeOverdue = (days) => (days === 1 ? '1 day overdue' : `${days} days overdue`)

/** dd MMM yyyy, like the main app's formatDate; '—' when unknown. */
export function formatDate(value) {
  const d = parseDay(value)
  if (!d) return value ? String(value) : '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(d)
}

const LEADING_CURRENCY = /^([A-Za-z]{3})\s+(\d[\d,.]*)$/
const TRAILING_CURRENCY = /^(\d[\d,.]*)\s+([A-Za-z]{3})$/

/** 'OMR 923,000' → { currency: 'OMR', amount: '923,000' }; null otherwise. */
export function splitFormattedBudget(value) {
  const text = String(value ?? '').trim()
  if (!text) return null
  const lead = LEADING_CURRENCY.exec(text)
  if (lead) return { currency: lead[1], amount: lead[2] }
  const trail = TRAILING_CURRENCY.exec(text)
  if (trail) return { currency: trail[2], amount: trail[1] }
  return null
}

// ── Stage display (dashboard Stage column) ───────────────────────────────────

const STAGE_LABEL_BY_STATUS = {
  cif_draft: 'CIF Draft',
  prequal_stage1: 'Pre-Qualification',
  prequal_stage2: 'Pre-Qualification',
  prequal_stage3: 'Pre-Qualification',
  prequal_stage4: 'Pre-Qualification',
  prequal_final_review: 'Pre-Qualification',
  prequal_rejected: 'Pre-Qualification',
  upload: 'Bid Ingestion',
  tech_eval: 'Technical Evaluation',
  parallel_eval: 'Technical Evaluation',
  scm_gate1: 'SCM Technical Review',
  comm_eval: 'Commercial Evaluation',
  scm_gate2: 'SCM Award Review',
  award: 'Contract Drafting',
  scm_gate3: 'SCM Contract Review',
  active: 'Active Contract',
  contract_closure: 'Contract Closure',
  closed: 'Closed',
}

/** The main app's pipeline-stage label for a tender (getStageDisplay). */
export function stageDisplayLabel(tender) {
  if (!tender) return 'Unknown'
  if (tender.status === 'cif_draft') {
    const s = tender.cifProgressStage
    if (s === 'psf') return 'PSF'
    if (s === 'select_templates' || s === 'strategy_templates') return 'Contract Strategy'
    return 'CIF Draft'
  }
  if (tender.status === 'draft') {
    const cifFlow = Array.isArray(tender.selectedTemplates) || !!tender.cifProgressStage
    if (cifFlow && !tender.psfCompleted) return tender.cifProgressStage === 'psf' ? 'PSF' : 'Contract Strategy'
    return 'ITT Drafting'
  }
  if (STAGE_LABEL_BY_STATUS[tender.status]) return STAGE_LABEL_BY_STATUS[tender.status]
  const words = String(tender.status || '').replace(/_/g, ' ').trim()
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : 'Unknown'
}
