// Pure helpers for the Contract Initiating Form + generated SOW port.
// Ported from MAIN's utils/format.ts, initiating-form/sow-basis.ts,
// tender-title-prefill.ts, use-cif-drafts.ts and lib/existing-tender-destination.ts,
// re-expressed against TARGET's local tender objects (no backend).

import {
  COMPLETED_STATUSES,
  CURRENCIES,
  DEFAULT_CURRENCY,
  DRAFT_PROGRESS_STAGES,
  MAX_BUDGET_INTEGER_DIGITS,
  MAX_COST_CODE_LENGTH,
  TENDER_TYPES,
} from './cifConstants'
import { tenderRef } from '../../utils/tenderRef'

// ─── Budget / cost code / duration ──────────────────────────────────────────

/** Thousands-grouped digits, keeping any fractional part (so a typed decimal
 * can be flagged instead of silently rounded). '' when there are no digits. */
export function formatBudget(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '')
  if (!/\d/.test(cleaned)) return ''
  const separatorIndex = cleaned.indexOf('.')
  const hasFraction = separatorIndex !== -1
  const integerDigits = (hasFraction ? cleaned.slice(0, separatorIndex) : cleaned).replace(/^0+(?=\d)/, '')
  const fractionDigits = hasFraction ? cleaned.slice(separatorIndex + 1).replace(/\./g, '') : ''
  const grouped = (integerDigits || '0').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return hasFraction ? `${grouped}.${fractionDigits}` : grouped
}

export function exceedsMaxBudgetIntegerDigits(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '')
  const separatorIndex = cleaned.indexOf('.')
  const integerDigits = separatorIndex === -1 ? cleaned : cleaned.slice(0, separatorIndex)
  return integerDigits.replace(/^0+(?=\d)/, '').length > MAX_BUDGET_INTEGER_DIGITS
}

export function isZeroBudget(value) {
  const cleaned = String(value ?? '').replace(/[^0-9.]/g, '')
  return /\d/.test(cleaned) && Number(cleaned) === 0
}

export function exceedsMaxCostCodeLength(value) {
  return String(value ?? '').length > MAX_COST_CODE_LENGTH
}

/** Cost codes are identifiers: letters, digits and `- _ / .` only. */
export function sanitizeCostCode(value) {
  return String(value ?? '').replace(/[^A-Za-z0-9\-_/.]/g, '')
}

export function durationLabel(value, unit) {
  return `${value} ${unit}${value === '1' ? '' : 's'}`
}

export function totalDurationMonths(form) {
  return (parseInt(form.durationYears, 10) || 0) * 12 + (parseInt(form.durationMonths, 10) || 0)
}

export function isZeroDuration(form) {
  return totalDurationMonths(form) <= 0
}

/** "2 years 3 months" / "18 months" / "2 years" → { years, months } strings. */
export function parseDuration(value) {
  const text = String(value ?? '').toLowerCase()
  if (!text.trim()) return { years: '', months: '' }
  const y = text.match(/(\d+)\s*year/)
  const m = text.match(/(\d+)\s*month/)
  if (!y && !m) return { years: '', months: '' }
  let total = (y ? parseInt(y[1], 10) * 12 : 0) + (m ? parseInt(m[1], 10) : 0)
  // Years beyond the dropdown's range fold back into it rather than vanishing.
  total = Math.min(total, 10 * 12 + 11)
  return { years: String(Math.floor(total / 12)), months: String(total % 12) }
}

/** The stored duration string other pages parse (ITTCreation's regex). */
export function buildDurationString(years, months) {
  const yv = years === '' ? '0' : years
  const mv = months === '' ? '0' : months
  return `${yv} year${yv === '1' ? '' : 's'} ${mv} month${mv === '1' ? '' : 's'}`
}

// ─── Tender <-> form ────────────────────────────────────────────────────────

export function emptyCifForm() {
  return {
    title: '',
    tenderType: '',
    department: '',
    currency: DEFAULT_CURRENCY,
    budget: '',
    costCode: '',
    deadline: '',
    durationYears: '',
    durationMonths: '',
    description: '',
  }
}

/** `"OMR 1,234"` (+ optional `tender.currency`) → { currency, budget: "1,234" }. */
export function splitStoredBudget(tender) {
  const raw = String(tender?.budget ?? '').trim()
  const prefix = raw.match(/^([A-Za-z]{3})\b/)
  const prefixCode = prefix && CURRENCIES.includes(prefix[1].toUpperCase()) ? prefix[1].toUpperCase() : null
  const currency = (tender?.currency && CURRENCIES.includes(tender.currency) ? tender.currency : null)
    || prefixCode
    || DEFAULT_CURRENCY
  const amount = prefix ? raw.slice(prefix[0].length) : raw
  return { currency, budget: formatBudget(amount) }
}

function matchTenderType(value) {
  const needle = String(value ?? '').trim().toLowerCase()
  return TENDER_TYPES.find(t => t.toLowerCase() === needle) || ''
}

const isDateKey = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value ?? ''))

/** Seeds the form from a stored tender (MAIN `cifToFormPatch`). */
export function tenderToCifForm(tender) {
  if (!tender) return emptyCifForm()
  const { currency, budget } = splitStoredBudget(tender)
  const hasSplitDuration = tender.durationYears !== undefined || tender.durationMonths !== undefined
  const { years, months } = hasSplitDuration
    ? { years: String(tender.durationYears ?? ''), months: String(tender.durationMonths ?? '') }
    : parseDuration(tender.duration)
  return {
    title: String(tender.title ?? '').trimStart(),
    tenderType: matchTenderType(tender.tenderType),
    department: tender.department || '',
    currency,
    budget,
    costCode: sanitizeCostCode(tender.costCode || ''),
    deadline: isDateKey(tender.deadline) ? tender.deadline : '',
    durationYears: years,
    durationMonths: months,
    description: String(tender.description ?? '').trimStart(),
  }
}

export const EMPTY_ASSIGNMENTS = { contractEngineerId: null, hseId: null, icvId: null }

export function assignmentsFromTender(tender) {
  if (!tender) return EMPTY_ASSIGNMENTS
  const ce = (Array.isArray(tender.assignedContractEngineers) && tender.assignedContractEngineers[0])
    || tender.assignedContractEngineer
  return {
    contractEngineerId: ce?.id ?? null,
    hseId: tender.assignedHseOfficers?.[0]?.id ?? null,
    icvId: tender.assignedIcvLeads?.[0]?.id ?? null,
  }
}

const sameId = (a, b) => a !== null && a !== undefined && String(a) === String(b)

/** Every role filled with somebody still on its active roster (MAIN `isTeamComplete`). */
export function isTeamComplete(assignments, rosters) {
  return rosters.contractEngineers.some(u => sameId(assignments.contractEngineerId, u.id))
    && rosters.hseOfficers.some(u => sameId(assignments.hseId, u.id))
    && rosters.icvOfficers.some(u => sameId(assignments.icvId, u.id))
}

function pickUser(roster, id) {
  const user = roster.find(u => sameId(id, u.id))
  return user ? { id: user.id, name: user.name } : null
}

/** Form + team → the fields written onto the tender. Budget stays in the
 * `"OMR 1,234"` string format every other page parses, plus `currency`. */
export function buildTenderPayload(form, assignments, rosters) {
  const ce = pickUser(rosters.contractEngineers, assignments.contractEngineerId)
  const hse = pickUser(rosters.hseOfficers, assignments.hseId)
  const icv = pickUser(rosters.icvOfficers, assignments.icvId)
  return {
    title: form.title.trim(),
    tenderType: form.tenderType,
    department: form.department,
    currency: form.currency,
    budget: `${form.currency} ${formatBudget(form.budget)}`,
    costCode: form.costCode.trim(),
    deadline: form.deadline,
    duration: buildDurationString(form.durationYears, form.durationMonths),
    durationYears: form.durationYears,
    durationMonths: form.durationMonths,
    description: form.description,
    assignedContractEngineers: ce ? [ce] : [],
    assignedContractEngineer: ce,
    assignedHseOfficers: hse ? [hse] : [],
    assignedIcvLeads: icv ? [icv] : [],
  }
}

/** Fingerprint of everything the SOW is generated from (MAIN sow-basis.ts) —
 * an unchanged basis with a SOW already on the tender skips regeneration. */
export function buildSowBasis(form, assignments) {
  return JSON.stringify([
    form.title,
    form.description,
    form.deadline,
    String(form.budget).replace(/[^0-9.]/g, '').replace(/\.0+$/, '').replace(/^0+(?=\d)/, ''),
    form.tenderType || '',
    form.department || '',
    form.costCode.trim(),
    form.currency || '',
    totalDurationMonths(form),
    assignments.contractEngineerId === null ? null : String(assignments.contractEngineerId),
    assignments.hseId === null ? null : String(assignments.hseId),
    assignments.icvId === null ? null : String(assignments.icvId),
  ])
}

export function nextTenderId(tenders) {
  const maxNum = tenders.reduce((max, t) => Math.max(max, parseInt(String(t.id).split('-')[2], 10) || 0), 0)
  return `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
}

export function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// ─── Drafts picker ──────────────────────────────────────────────────────────

/** The stage a picker row resumes at. Legacy cif_draft tenders predate the
 * field and are still at CIF creation. */
export function draftProgressStage(tender) {
  return tender.cifProgressStage || (tender.status === 'cif_draft' ? 'cif_creation' : null)
}

/** A draft = a cif_draft tender, or one the CIF flow has stamped with a
 * pre-PSF progress stage and whose PSF is not yet completed. */
export function isCifDraft(tender) {
  if (tender.status === 'cif_draft') return true
  return DRAFT_PROGRESS_STAGES.includes(tender.cifProgressStage) && !tender.psfCompleted
}

export function selectCifDrafts(tenders) {
  return tenders
    .filter(isCifDraft)
    .slice()
    .sort((a, b) => String(b.created || '').localeCompare(String(a.created || ''))
      || String(b.id).localeCompare(String(a.id)))
}

export function matchesDraftSearch(tender, query) {
  const needle = query.trim().toLowerCase()
  if (!needle) return true
  return [tender.title, tender.costCode, tender.department, tender.id]
    .some(field => String(field ?? '').toLowerCase().includes(needle))
}

/** MAIN `routeForDraftProgress`. `state.autoGenerate` mirrors MAIN's
 * `requestAutoGenerate` for a draft still at CIF creation. */
export function routeForDraftProgress(tender) {
  switch (draftProgressStage(tender)) {
    case 'select_templates':
      return { to: `/strategy-templates/${tender.id}?new=true` }
    case 'strategy_templates':
      return { to: `/strategy-templates/${tender.id}` }
    case 'psf':
      return { to: `/psf-strategy/${tender.id}` }
    case 'cif_creation':
      return { to: `/contract-strategy/${tender.id}`, state: { autoGenerate: true } }
    default:
      return { to: `/contract-strategy/${tender.id}` }
  }
}

export function normalizeStage(value) {
  return value ? value.split('_').join(' ') : '-'
}

const DEADLINE_FORMAT = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })

export function formatDeadlineUtc(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : DEADLINE_FORMAT.format(date)
}

// ─── Title suggestions / existing tender ────────────────────────────────────

export function existingTenderStatusLabel(tender) {
  if (tender.status === 'cancelled') return 'Cancelled'
  if (COMPLETED_STATUSES.includes(tender.status)) return 'Completed'
  return 'In progress'
}

/** Where "continue the existing tender" goes (MAIN `resolveExistingTenderDestination`). */
export function existingTenderDestination(tender) {
  const progress = draftProgressStage(tender)
  if (!tender.psfCompleted && progress) {
    if (progress === 'select_templates') return `/strategy-templates/${tender.id}?new=true`
    if (progress === 'strategy_templates') return `/strategy-templates/${tender.id}`
    if (progress === 'psf') return `/psf-strategy/${tender.id}`
    return `/contract-strategy/${tender.id}`
  }
  if (String(tender.status).startsWith('prequal_')) return `/strategy-templates/${tender.id}`
  if (tender.psfCompleted && !tender.sectionsGenerated && tender.status !== 'draft') return '/create-itt'
  if (tender.status === 'draft') return `/create-itt/${tender.id}`
  return '/tenders'
}

export function titleSuggestionsFor(tenders, query, limit) {
  const needle = query.trim().toLowerCase()
  if (!needle) return []
  return tenders
    .filter(t => String(t.title ?? '').toLowerCase().includes(needle))
    .slice(0, limit)
    .map(t => ({
      id: t.id,
      title: t.title,
      status: existingTenderStatusLabel(t),
      detail: [t.stage, t.department, t.costCode].filter(Boolean).join(' · '),
    }))
}

// ─── Duplicate check (MAIN: the create call's `warning`) ────────────────────

export function findDuplicateWarning(tenders, form, selfId) {
  const others = tenders.filter(t => t.id !== selfId)
  const code = form.costCode.trim().toLowerCase()
  if (code) {
    const clash = others.find(t => String(t.costCode ?? '').trim().toLowerCase() === code)
    if (clash) {
      return {
        costCodeMatch: true,
        message: `Cost code "${form.costCode.trim()}" is already used by "${clash.title || 'Untitled Contract Initiating Form'}". Check this is not a duplicate before you continue.`,
      }
    }
  }
  const title = form.title.trim().toLowerCase()
  const similar = others.find(t =>
    String(t.title ?? '').trim().toLowerCase() === title
    && String(t.department ?? '') === form.department)
  if (title && similar) {
    return {
      costCodeMatch: false,
      message: `A tender with the same title and department already exists (${tenderRef(similar)}). Check this is not a duplicate before you continue.`,
    }
  }
  return null
}

// ─── SOW document ───────────────────────────────────────────────────────────

const LONG_DATE = { day: '2-digit', month: 'long', year: 'numeric' }

function formatLongDate(key) {
  if (!isDateKey(key)) return key || 'the agreed deadline'
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', LONG_DATE)
}

/**
 * The mock "AI" SOW. Same eight sections TARGET always generated, reshaped to
 * MAIN's SOW structure: every section is `{ id, heading, content }` where
 * `content` is a plain-text body (paragraphs + `- ` bullet lines), so it can
 * be rendered, selected, AI-rewritten and manually edited uniformly.
 */
export function generateSowContent(form, reference) {
  const budget = `${form.currency} ${formatBudget(form.budget)}`
  const duration = buildDurationString(form.durationYears, form.durationMonths)
  const now = new Date()
  const sections = [
    ['1. Introduction & Background',
      `This Statement of Work (SOW) document defines the requirements, deliverables, and responsibilities for "${form.title.trim()}" under the ${form.department || 'requesting department'}. The contract has an estimated value of ${budget}.`],
    ['2. Objective',
      form.description.trim() || 'The objective of this contract is to deliver the specified goods/services/works in accordance with Oman LNG standards, safety requirements, and applicable regulations.'],
    ['3. Statement of Work',
      'The Contractor shall provide all necessary resources, materials, equipment, and personnel required to execute the following scope:\n\n- Mobilisation and establishment of required facilities\n- Execution of all works/services as described in the project scope overview\n- Compliance with all Oman LNG QHSSE requirements and standards\n- Provision of regular progress reports and documentation\n- Demobilisation and site restoration upon completion'],
    ['4. Contract Details',
      [
        `- Tender Type: ${form.tenderType}`,
        `- Estimated Value: ${budget}`,
        `- Cost Code: ${form.costCode.trim()}`,
        `- Submission Deadline: ${formatLongDate(form.deadline)}`,
        `- Contract Duration: ${duration}`,
      ].join('\n')],
    ['5. Key Deliverables & Milestones',
      `The following milestones shall apply to this contract:\n\n- Milestone 1 — Mobilisation & Kick-off: Within 14 days of contract award\n- Milestone 2 — Detailed Work Plan Submission: Within 30 days\n- Milestone 3 — Progress Review (50% completion): As per agreed schedule\n- Milestone 4 — Substantial Completion: Prior to ${formatLongDate(form.deadline)}\n- Milestone 5 — Final Completion & Handover: As per contract terms`],
    ['6. QHSSE Requirements',
      'The Contractor shall comply with all Oman LNG QHSSE requirements including but not limited to:\n\n- Life Saving Rules and Permit to Work system\n- Environmental management and waste disposal standards\n- Incident reporting and investigation procedures\n- Personnel competency and training requirements\n- Emergency response and evacuation procedures'],
    ['7. Performance Standards & Acceptance Criteria',
      'All deliverables shall meet the following standards:\n\n- Compliance with applicable Omani regulations and Oman LNG standards\n- Quality management system aligned with ISO 9001 requirements\n- Zero LTI (Lost Time Injury) target throughout contract duration\n- Timely delivery per the agreed project schedule\n- Documentation in accordance with Oman LNG document control procedures'],
    ['8. Responsibilities',
      'Contractor Responsibilities:\n- Provide all labour, materials, and equipment\n- Maintain compliance with QHSSE requirements\n- Submit progress reports as required\n- Ensure quality control throughout execution\n\nOman LNG Responsibilities:\n- Provide site access and necessary permits\n- Designate Contract Holder for contract administration\n- Provide timely reviews and approvals\n- Process payments per contract terms'],
  ]
  return {
    title: `Statement of Work - ${form.title.trim()}`,
    reference: reference || 'New Draft',
    generatedAt: now.toISOString(),
    generatedDate: now.toLocaleDateString('en-GB', LONG_DATE),
    sections: sections.map(([heading, content], i) => ({ id: `sow-sec-${i + 1}`, heading, content })),
  }
}

/** Legacy section shapes (items grid / subsections) → one text body. */
function legacySectionText(section) {
  if (typeof section.content === 'string') return section.content
  if (typeof section.body === 'string') return section.body
  if (Array.isArray(section.items)) {
    return section.items.map(item => `- ${item.label}: ${item.value}`).join('\n')
  }
  if (Array.isArray(section.subsections)) {
    return section.subsections
      .map(sub => `${sub.title}:\n${(sub.items || []).map(item => `- ${item}`).join('\n')}`)
      .join('\n\n')
  }
  return ''
}

/** Any stored SOW (this flow's, a legacy one, or one the Templates page
 * edited) → `{ ...doc, sections: [{ id, heading, content }] }`. */
export function normalizeSowDocument(doc) {
  if (!doc || !Array.isArray(doc.sections)) return null
  return {
    ...doc,
    sections: doc.sections.map((section, i) => ({
      id: section.id || `sow-sec-${i + 1}`,
      heading: section.heading || '',
      content: legacySectionText(section),
    })),
  }
}

export function formatSowGeneratedDate(doc) {
  if (doc?.generatedAt) {
    const date = new Date(doc.generatedAt)
    if (!Number.isNaN(date.getTime())) return date.toLocaleDateString('en-GB', LONG_DATE)
  }
  return doc?.generatedDate || ''
}
