/*
 * Contract Strategy hub data — main app's contract-strategy/page.tsx,
 * mock/contract-strategy.ts (tabs, statusLabels) and
 * ai-system-status.utils.ts, mapped onto this app's real tender statuses.
 *
 * The main app's hub board knows draft / upload / tech_eval / comm_eval /
 * legal_review / mgmt_review / award. Here the SCM approval gates stand in for
 * its "mgmt_review" (management review), and a parallel evaluation counts as
 * both technical and commercial evaluation.
 */
import { tenderRef } from '../../utils/tenderRef'

export const HUB_ACTIVE_STATUSES = ['draft', 'upload', 'tech_eval', 'comm_eval', 'parallel_eval']
export const HUB_REVIEW_STATUSES = ['legal_review', 'scm_gate1', 'scm_gate2', 'scm_gate3']

export const HUB_TABS = [
  { key: 'all',      label: 'All Tenders', statuses: null },
  { key: 'progress', label: 'In Progress', statuses: ['draft', 'upload'] },
  { key: 'tech',     label: 'Tech Eval',   statuses: ['tech_eval', 'parallel_eval'] },
  { key: 'comm',     label: 'Comm Eval',   statuses: ['comm_eval', 'parallel_eval'] },
  { key: 'review',   label: 'Review',      statuses: HUB_REVIEW_STATUSES },
  { key: 'award',    label: 'Awarded',     statuses: ['award'] },
]

const HUB_STATUS_LABELS = {
  draft: 'Pending Approval',
  upload: 'Awaiting Ingestion',
  tech_eval: 'Technical Evaluation',
  comm_eval: 'Commercial Evaluation',
  parallel_eval: 'Parallel Evaluation',
  legal_review: 'Legal Review',
  scm_gate1: 'SCM Review — Technical',
  scm_gate2: 'SCM Review — Award',
  scm_gate3: 'SCM Review — Contract Draft',
  award: 'Award Recommended',
  prequal_stage1: 'Pre-Qual — Bidder Matching',
  prequal_stage2: 'Pre-Qual — Questionnaire',
  prequal_stage3: 'Pre-Qual — Response Review',
  prequal_stage4: 'Pre-Qual — Financial Assessment',
  prequal_final_review: 'Pre-Qual — Final Review',
  prequal_rejected: 'Pre-Qualification Rejected',
  active: 'Contract Active',
  contract_closure: 'Closure In Progress',
  closed: 'Closed & Archived',
}

export const hubStatusLabel = (tender) => HUB_STATUS_LABELS[tender.status] || tender.stage || tender.status

// Badge tone per status (main app's StatusBadge variants).
const TONE_BY_STATUS = {
  draft: 'neutral',
  upload: 'warning',
  tech_eval: 'primary',
  comm_eval: 'primary',
  parallel_eval: 'primary',
  legal_review: 'info',
  scm_gate1: 'info',
  scm_gate2: 'info',
  scm_gate3: 'info',
  award: 'success',
  active: 'success',
}
export const hubStatusTone = (tender) => TONE_BY_STATUS[tender.status] || 'info'

/** Tenders on the hub board — everything past the CIF draft. */
export const hubTenders = (tenders) => tenders.filter(t => t.status !== 'cif_draft')

export const countByStatuses = (list, statuses) => list.filter(t => statuses.includes(t.status)).length

export const tabCount = (list, tab) => (tab.statuses === null ? list.length : countByStatuses(list, tab.statuses))

export function filterHubTenders(list, tabKey, search) {
  const statuses = HUB_TABS.find(tab => tab.key === tabKey)?.statuses ?? null
  const q = search.trim().toLowerCase()
  return list.filter(t => {
    const matchesTab = statuses === null || statuses.includes(t.status)
    const matchesQuery = q === ''
      || String(t.id).toLowerCase().includes(q)
      || tenderRef(t).toLowerCase().includes(q)
      || String(t.title || '').toLowerCase().includes(q)
    return matchesTab && matchesQuery
  })
}

/** Port of getAiSystemStatus — engine online/load derived from the board. */
export function getAiSystemStatus(list) {
  const count = (...statuses) => countByStatuses(list, statuses)
  const cap = (n, max) => Math.min(Math.round((n / max) * 100), 100)
  const draftCount = count('draft')
  const uploadCount = count('upload')
  const evalCount = count('tech_eval', 'comm_eval', 'parallel_eval')
  const awardedCount = count('award')
  return [
    { label: 'ITT Generator',     online: draftCount > 0,   load: cap(draftCount, 3),   tone: 'primary' },
    { label: 'Extraction Engine', online: uploadCount > 0,  load: cap(uploadCount, 3),  tone: 'warning' },
    { label: 'Evaluation AI',     online: evalCount > 0,    load: cap(evalCount, 8),    tone: 'success' },
    { label: 'Contract Drafter',  online: awardedCount > 0, load: cap(awardedCount, 3), tone: 'info' },
  ]
}
