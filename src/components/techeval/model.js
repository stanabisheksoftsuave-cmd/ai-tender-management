/*
 * ITT Technical Evaluation — pure data + pure functions.
 *
 * Ported from MAIN's `itt-technical-evaluation/{compliance-model,
 * technical-model, evaluation-adapter}.ts`. MAIN reads the frozen matrix, the
 * AI's per-criterion evidence and its calculated scores from the server; this
 * app is mock-only, so the same shapes are produced here deterministically and
 * persisted on the tender (`tender.techEvalState`).
 *
 * ONE source of truth: every bidder carries a calculated + final score per
 * criterion. Compliance Review (Must/Want rows, the bidder's label) and
 * Technical Scoring (matrix, totals, pass/fail) are both derived from those
 * final scores — exactly as MAIN's server derives its label from the scores —
 * so an override in one tab moves the other.
 */

import { bidders as seedBidders, technicalEvalParts, TECHNICAL_OVERALL_PASS } from '../../data/mockData'

/** Every criterion is scored 0–3. */
export const MAX_SCORE = 3

/**
 * A criterion scored at or below this (of 0–3) puts the bidder into the
 * clarification / re-upload round whatever their weighted total says. Only a
 * full 3 clears it — MAIN's `CLARIFY_AT_OR_BELOW`.
 */
export const CLARIFY_AT_OR_BELOW = 2

/** FR-6.1 / NFR-1.5 — a re-uploaded bidder document may not exceed 20 MB. */
export const MAX_REUPLOAD_BYTES = 20 * 1024 * 1024

/** MAIN's `AI_STEPS` (TechnicalEvaluationFlow.tsx). The last line is the completion line. */
export const AI_STEPS = [
  'Parsing bidder submission bundles…',
  'Extracting mandatory compliance documents…',
  'Cross-referencing ITT requirements…',
  'Running entity recognition on legal clauses…',
  'Mapping optional criteria against submissions…',
  'Generating compliance matrix…',
  'AI evaluation complete — results ready',
]

/** The Contract Engineer re-upload loop's loader (prototype 4.31). */
export const RE_EXTRACT_STEPS = [
  'Receiving re-uploaded documents from Contract Engineer…',
  'Parsing corrected compliance documents…',
  'Re-validating against ITT requirements…',
  'Re-evaluating compliance status for updated bidders…',
  'Updating compliance matrix — new statuses applied',
]

/** What a scoring column shows while its interim upload is handled (MAIN). */
export const INTERIM_STEP_LABEL = {
  uploading: 'Uploading corrected document…',
  rescoring: 'Re-scoring this bidder…',
}

export const STATUS_ORDER = ['compliant', 'partial_compliant', 'non_compliant']

/** MAIN's `STATUS_CFG`, in this app's Tailwind palette. */
export const STATUS_CFG = {
  compliant: {
    label: 'Compliant',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
    dot: 'bg-emerald-500',
    hint: 'Full clearance',
  },
  partial_compliant: {
    label: 'Partial Compliant',
    chip: 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100',
    dot: 'bg-amber-500',
    hint: 'Conditional, needs a decision',
  },
  non_compliant: {
    label: 'Non-Compliant',
    chip: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
    dot: 'bg-red-500',
    hint: 'Eliminated from scoring',
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// Tender helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Open for technical evaluation — MAIN's `isOpenForTechnicalEvaluation`. */
export function isOpenForTech(tender) {
  return tender?.status === 'tech_eval' ||
    (tender?.status === 'parallel_eval' && tender?.techSide === 'evaluating')
}

/** Statuses that sit before the ITT is issued / ingested — the matrix is not frozen yet. */
const PRE_TECH_STATUSES = new Set([
  'cif_draft', 'draft', 'upload',
  'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4',
  'prequal_final_review', 'prequal_rejected',
])

export function isBeforeTech(tender) {
  return PRE_TECH_STATUSES.has(tender?.status)
}

/**
 * The pass mark: the Contract Strategy's TEM passing score when set (1–100),
 * else the mock default with MAIN's "Pass score not set" warning.
 */
export function passThreshold(tender) {
  const raw = Number(tender?.temPassingScore)
  if (tender?.temPassingScore !== undefined && tender?.temPassingScore !== null &&
      tender?.temPassingScore !== '' && Number.isFinite(raw) && raw >= 1 && raw <= 100) {
    return { passingScore: raw, isDefault: false }
  }
  return { passingScore: TECHNICAL_OVERALL_PASS, isDefault: true }
}

/**
 * Supply Chain can return a tender from gate 1 (technical) or gate 2 (award,
 * targeted at the technical side). A return stands until the evaluator
 * re-submits after it.
 */
export function scmReturnFor(tender) {
  const d = tender?.scmDecisions || {}
  const found = (d.scm_gate2?.decision === 'returned' && d.scm_gate2.target !== 'comm')
    ? { ...d.scm_gate2, gateLabel: 'Award Gate' }
    : d.scm_gate1?.decision === 'returned' ? { ...d.scm_gate1, gateLabel: 'Technical Gate' } : null
  if (!found) return null
  if (tender.techEvalSubmittedAt && found.at && tender.techEvalSubmittedAt > found.at) return null
  return found
}

/** FR-8.6 / SR-2.5 — an evaluator never sees a company name before award. */
export function maskedName(index) {
  return `Bidder-${String(index + 1).padStart(3, '0')}`
}

const SEED_BIDDER_COUNT = 4

/**
 * The tender's bidders as the evaluation shows them: `bidderList` when the
 * Contract Engineer ingested one, else the tender's bidder count. Names are
 * masked; the real name is kept only for the Contract Engineer's correction
 * request, which is the CE's own screen.
 */
export function evaluationBidders(tender) {
  const list = Array.isArray(tender?.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender?.bidders > 0 ? tender.bidders : SEED_BIDDER_COUNT)
  return list.map((b, index) => ({
    id: b.id,
    key: String(b.id),
    index,
    name: maskedName(index),
    realName: b.name || maskedName(index),
    country: b.country && b.country !== '—' ? b.country : '',
    raw: b,
  }))
}

// ─────────────────────────────────────────────────────────────────────────────
// Criteria — the Contract Strategy TEM when it has rows, else Appendix I
// ─────────────────────────────────────────────────────────────────────────────

const AI_PREFIX = /^\s*AI Suggested\s*[—–-]\s*/i

function toType(row) {
  const raw = String(row.criteriaType ?? row.mustOrWant ?? row.type ?? '').trim().toLowerCase()
  return raw === 'must' ? 'Must' : 'Want'
}

function toMinScore(row, type) {
  if (type !== 'Must') return null
  if (row.minScore === undefined || row.minScore === null || row.minScore === '') return null
  const n = Number(row.minScore)
  return Number.isFinite(n) ? Math.min(MAX_SCORE, Math.max(0, n)) : null
}

function splitCriterion(text) {
  const clean = String(text || '').replace(AI_PREFIX, '').trim()
  const colon = clean.indexOf(':')
  if (colon > 0 && colon <= 90) {
    return { criterion: clean.slice(0, colon).trim(), detail: clean.slice(colon + 1).trim() }
  }
  return { criterion: clean, detail: '' }
}

function partTitleOf(part) {
  return String(part || 'Part 2: Contract-Specific').replace(/\s*:\s*/, ' — ')
}

function partOrder(title) {
  const m = /Part\s*(\d+)/i.exec(title)
  return m ? Number(m[1]) : 99
}

/**
 * MAPPING (Templates lane TEM row → matrix criterion):
 *   part         → part group ("Part 1: QHSE" → "Part 1 — QHSE")
 *   criteriaType → type (also accepts MAIN's `mustOrWant`)
 *   criterion    → criterion / detail (split on the first ":"; "AI Suggested —" stripped)
 *   weight       → weight (rows with no criterion or weight ≤ 0 are skipped)
 *   minScore     → minScore (Musts only; Wants carry none)
 *   band1..band3 → bands[1..3] (also accepts MAIN's `score1..score3`); band 0 = "No information provided"
 *   QHSE banding → the first Must in a QHSE part (else the first HSE-named Must)
 *   section weight → temSectionWeightings[part] when set, else the sum of its weights
 */
function criteriaFromTem(tender) {
  const rows = Array.isArray(tender?.technicalEvalMatrix) ? tender.technicalEvalMatrix : []
  const mapped = rows.map((row, index) => {
    const type = toType(row)
    const { criterion, detail } = splitCriterion(row.criterion)
    const weight = Number(row.weight)
    return {
      // Strategy-template registers key rows by `_id`; prefer it so editing the
      // TEM doesn't change every criterion id and discard a saved evaluation.
      id: `tem-${row._id ?? row.id ?? index}`,
      partKey: row.part || 'Part 2: Contract-Specific',
      type,
      criterion,
      detail,
      weight: Number.isFinite(weight) ? weight : 0,
      maxScore: MAX_SCORE,
      minScore: toMinScore(row, type),
      bands: [
        'No information provided',
        row.band1 || row.score1 || 'Score 1',
        row.band2 || row.score2 || 'Score 2',
        row.band3 || row.score3 || 'Score 3',
      ],
    }
  }).filter(c => c.criterion && c.weight > 0)
  if (mapped.length === 0) return null

  const hse = mapped.find(c => c.type === 'Must' && /QHSE|HSE/i.test(c.partKey)) ||
    mapped.find(c => c.type === 'Must' && /HSE/i.test(c.criterion))
  const byPart = new Map()
  mapped.forEach(c => {
    if (!byPart.has(c.partKey)) byPart.set(c.partKey, [])
    byPart.get(c.partKey).push({ ...c, isHse: c === hse })
  })
  const weightings = tender?.temSectionWeightings || {}
  return [...byPart.entries()]
    .map(([partKey, criteria], i) => {
      const sum = criteria.reduce((s, c) => s + c.weight, 0)
      const set = Number(weightings[partKey])
      return {
        id: `tem-part-${partOrder(partKey)}-${i}`,
        title: partTitleOf(partKey),
        sectionWeight: Number.isFinite(set) && set > 0 ? set : Math.round(sum * 100) / 100,
        criteria: criteria.map(c => {
          const { partKey: _drop, ...rest } = c // eslint-disable-line no-unused-vars
          return rest
        }),
      }
    })
    .sort((a, b) => partOrder(a.title) - partOrder(b.title))
}

/** `{ parts, criteria, source }` — criteria flattened with their part id. */
export function buildCriteria(tender) {
  const tem = criteriaFromTem(tender)
  const parts = tem || technicalEvalParts
  const criteria = parts.flatMap(p => p.criteria.map(c => ({ ...c, part: p.id, partTitle: p.title })))
  return { parts, criteria, source: tem ? 'tem' : 'default' }
}

export const criteriaSignature = (criteria) => criteria.map(c => c.id).join('|')

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic mock AI — scores + evidence
// ─────────────────────────────────────────────────────────────────────────────

/** Seeded, never `Math.random()` — the same bidder shows the same scores every run (MAIN's `hashToRange`). */
export function hash(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h)
}

/**
 * The AI's calculated score for one criterion. Each bidder gets a profile by
 * its position — strong / partial / weak / partial — so a seeded tender lands
 * one bidder in each compliance status, as the prototype's SEED did. `round`
 * is how many corrected submissions the bidder has had re-read: each one
 * lifts the gaps the AI found by a band, so a corrected document genuinely
 * moves the result (deterministically — never a random re-assessment).
 */
function generateScore(bidder, criterion, mustOrdinal, round) {
  const h = hash(`${bidder.key}:${criterion.id}`) % 10
  const profile = bidder.index % 4
  let s
  if (criterion.type === 'Must') {
    if (profile === 0) s = 3
    else if (profile === 1) s = mustOrdinal === 0 ? 2 : (h < 6 ? 3 : 2)
    else if (profile === 2) s = mustOrdinal === 0 ? 1 : (h < 5 ? 3 : 2)
    else s = (mustOrdinal === 1 || h >= 7) ? 2 : 3
  } else if (profile === 0) s = h < 8 ? 3 : 2
  else if (profile === 1) s = h < 5 ? 3 : h < 9 ? 2 : 1
  else if (profile === 2) s = h < 4 ? 3 : h < 8 ? 2 : 1
  else s = h < 6 ? 3 : 2
  return Math.min(MAX_SCORE, s + (round || 0))
}

export const scoreKey = (bidderId, criterionId) => `${bidderId}-${criterionId}`

/** Fresh AI score entries for the given bidders (calculated = final, unreviewed). */
export function extractScores(bidders, criteria, rounds = {}) {
  const out = {}
  bidders.forEach(bidder => {
    let mustOrdinal = 0
    criteria.forEach(criterion => {
      const ordinal = criterion.type === 'Must' ? mustOrdinal++ : -1
      const calc = generateScore(bidder, criterion, ordinal, rounds[bidder.key])
      out[scoreKey(bidder.key, criterion.id)] = {
        calc, final: calc, reviewed: false, overridden: false, reason: null,
      }
    })
  })
  return out
}

const QUOTES = {
  3: c => `We will deliver the ${c} requirement in full, supported by the attached procedures, certificates and named resources.`,
  2: c => `Our approach to ${c} follows our standard company procedures, summarised in this section.`,
  1: c => `${c}: further details will be provided after award.`,
}

/** One line per citation — MAIN's `evidenceLines`. */
export function evidenceLines(evidence) {
  if (!evidence.citations.length) return ['No citation was recorded for this finding.']
  return evidence.citations.map(c => c.excerpt ? `${c.headingPath} — “${c.excerpt}”` : c.headingPath)
}

/** What the AI found for one criterion — MAIN's `TechnicalCriterionEvidence`, derived from the calculated score. */
export function evidenceFor(bidder, criterion, calc) {
  const key = scoreKey(bidder.key, criterion.id)
  const confidence = (72 + (hash(`${key}:conf`) % 27)) / 100
  const section = 2 + (hash(`${criterion.id}:sec`) % 6)
  const sub = 1 + (hash(`${criterion.id}:sub`) % 5)
  const headingPath = `${section}. Technical Proposal > ${section}.${sub} ${criterion.criterion}`
  const quote = QUOTES[calc] ? QUOTES[calc](criterion.criterion) : null
  const band = criterion.bands?.[calc]
  return {
    rationale: `${scoreNarrative(calc)}${band ? ` Scoring band: ${band}.` : ''}`,
    quote,
    confidence,
    flaggedForReview: confidence < 0.8,
    citations: calc === 0 ? [] : [
      { headingPath, excerpt: quote ? quote.slice(0, 80) + (quote.length > 80 ? '…' : '') : null },
      ...(calc === 3 ? [{ headingPath: `Annex ${String.fromCharCode(65 + (hash(key) % 5))} — Supporting documents`, excerpt: null }] : []),
    ],
  }
}

/** The AI's finding as plain text for the Source Proof pane — MAIN's `evidenceDocument`. */
export function evidenceDocument(evidence) {
  return [
    evidence.quote ? `“${evidence.quote}”` : 'No verbatim quote was recorded.',
    '',
    evidence.rationale,
    '',
    'Cited from:',
    ...evidenceLines(evidence).map(line => `  · ${line}`),
  ].join('\n')
}

// ─────────────────────────────────────────────────────────────────────────────
// Score maps + compliance
// ─────────────────────────────────────────────────────────────────────────────

/** `{ key: finalScore }` — what the matrix and every total read. */
export function finalScoreMap(state) {
  const out = {}
  Object.entries(state?.scores || {}).forEach(([k, v]) => { out[k] = v.final })
  return out
}

/** The criterion-level label for a scored criterion (MAIN's `TechnicalScoreLabel`). */
export function scoreLabel(criterion, score) {
  if (score >= MAX_SCORE) return 'Fully Compliant'
  if (criterion.type === 'Must') return score >= (criterion.minScore ?? MAX_SCORE) ? 'Partial' : 'Non-Compliant'
  return score > 0 ? 'Partial' : 'Non-Compliant'
}

/**
 * One bidder's compliance panel: Musts are the mandatory column (met once the
 * final score reaches the minimum), Wants the optional one (met only at the
 * maximum). An unscored criterion is not met. MAIN's `toComplianceView`.
 */
export function complianceView(state, bidder, criteria) {
  const mandatory = []
  const optional = []
  criteria.forEach(c => {
    const entry = state?.scores?.[scoreKey(bidder.key, c.id)]
    const v = entry?.final
    const isScored = v !== undefined && v !== ''
    const score = isScored ? Number(v) : null
    const evidence = entry ? evidenceFor(bidder, c, entry.calc) : null
    const metric = {
      id: c.id,
      name: c.criterion,
      docRef: evidence?.citations[0]?.headingPath ?? '—',
      docType: c.partTitle,
      evidence,
      kind: c.type === 'Must' ? 'mandatory' : 'optional',
      score,
      label: isScored ? scoreLabel(c, score) : null,
    }
    if (c.type === 'Must') {
      mandatory.push({ ...metric, present: isScored && score >= (c.minScore ?? MAX_SCORE) })
    } else {
      optional.push({ ...metric, present: isScored && score === MAX_SCORE })
    }
  })
  return { mandatory, optional }
}

/**
 * The AI-derived bidder label — MAIN's server rule: every Must at its maximum
 * is Compliant, any Must below its minimum is Non-Compliant, anything else is
 * Partial. A bidder with nothing scored reads Non-Compliant.
 */
export function derivedStatus(scores, bidder, criteria) {
  const musts = criteria.filter(c => c.type === 'Must')
  const values = musts.map(c => scores[scoreKey(bidder.key, c.id)])
  if (criteria.length > 0 && criteria.every(c => scores[scoreKey(bidder.key, c.id)] === undefined)) return 'non_compliant'
  if (musts.some((c, i) => values[i] === undefined || values[i] === '' || Number(values[i]) < (c.minScore ?? 0))) {
    return 'non_compliant'
  }
  if (musts.every((c, i) => Number(values[i]) >= MAX_SCORE)) return 'compliant'
  return 'partial_compliant'
}

/** A manual override is authoritative over the derived label. */
export function effectiveStatus(state, scores, bidder, criteria) {
  return state?.compliance?.[bidder.key]?.status ?? derivedStatus(scores, bidder, criteria)
}

// ─────────────────────────────────────────────────────────────────────────────
// Appendix I scoring maths — MAIN's technical-model.ts
// ─────────────────────────────────────────────────────────────────────────────

export function rawScore(scores, bidderKey, criterionId) {
  const v = scores[scoreKey(bidderKey, criterionId)]
  return v === '' || v === undefined ? 0 : Number(v)
}

/** Raw points: (score ÷ maxScore) × weight, so a full 3 earns the whole weight. */
export function weightedFor(scores, bidderKey, criterion) {
  return (rawScore(scores, bidderKey, criterion.id) / (criterion.maxScore || 3)) * criterion.weight
}

const roundToTwo = v => Math.round((v + Number.EPSILON) * 100) / 100

export const formatPercent = v => `${Number(v).toFixed(2)}%`
export const formatPassMark = p => (p === null || p === undefined ? 'Not set' : `${p}%`)

/** The total as a percentage of the maximum weighted score. */
export function totalFor(scores, bidderKey, criteria) {
  const maxPoints = criteria.reduce((s, c) => s + (c.maxScore || 3) * c.weight, 0)
  if (maxPoints === 0) return 0
  const points = criteria.reduce((s, c) => s + rawScore(scores, bidderKey, c.id) * c.weight, 0)
  return roundToTwo((points * 100) / maxPoints)
}

export function partTotalFor(scores, bidderKey, partId, criteria) {
  return criteria.filter(c => c.part === partId).reduce((s, c) => s + weightedFor(scores, bidderKey, c), 0)
}

export function hasAnyScore(scores, bidderKey, criteria) {
  return criteria.some(c => scores[scoreKey(bidderKey, c.id)] !== undefined)
}

export function isFullyScored(scores, bidderKey, criteria) {
  return criteria.every(c => {
    const v = scores[scoreKey(bidderKey, c.id)]
    return v !== undefined && v !== ''
  })
}

/** Musts scored below their minimum — these fail the bidder whatever the total. */
export function mustFailures(scores, bidderKey, criteria) {
  return criteria.filter(c => c.type === 'Must' && c.minScore != null && rawScore(scores, bidderKey, c.id) < c.minScore)
}

/** Criteria at or below the clarification threshold. */
export function belowBandFor(scores, bidderKey, criteria) {
  return criteria.filter(c => {
    const v = scores[scoreKey(bidderKey, c.id)]
    return v !== undefined && v !== '' && Number(v) <= CLARIFY_AT_OR_BELOW
  })
}

export function passFail(scores, bidderKey, passingScore, criteria) {
  return mustFailures(scores, bidderKey, criteria).length === 0 &&
    (passingScore === null || totalFor(scores, bidderKey, criteria) >= passingScore)
    ? 'PASS' : 'FAIL'
}

const HSE_BANDS = ['—', 'Red', 'Amber', 'Green']

export function hseBanding(scores, bidderKey, criteria) {
  const hse = criteria.find(c => c.isHse)
  if (!hse) return '—'
  return HSE_BANDS[rawScore(scores, bidderKey, hse.id)] || '—'
}

/** Musts under their minimum first, then the clarification criteria (MAIN's `failureRowsFor`). */
export function failureRowsFor(scores, bidderKey, criteria) {
  const musts = mustFailures(scores, bidderKey, criteria)
  const mustIds = new Set(musts.map(c => c.id))
  const clarify = belowBandFor(scores, bidderKey, criteria).filter(c => !mustIds.has(c.id))
  return [
    ...musts.map(c => ({ criterion: c.criterion, score: rawScore(scores, bidderKey, c.id), minScore: c.minScore, kind: 'Must below minimum' })),
    ...clarify.map(c => ({ criterion: c.criterion, score: rawScore(scores, bidderKey, c.id), minScore: c.minScore, kind: 'Clarification required' })),
  ]
}

const SCORE_NARRATIVE = {
  3: 'The submission demonstrates a comprehensive and fully compliant response. The bidder shows a clear, detailed understanding of the requirement with credible supporting evidence, exceeding the minimum expectation for this criterion.',
  2: 'The submission is competent and acceptable. The bidder addresses the requirement adequately, with a workable approach and reasonable supporting detail, though it does not stand out as best-in-class.',
  1: 'The submission is partial and below expectation. Key elements of the requirement are addressed only superficially or with gaps that raise delivery risk.',
  0: 'The submission does not meet the requirement. The response is absent, non-responsive, or materially deficient against what was requested.',
}

export function scoreNarrative(score) {
  return SCORE_NARRATIVE[Number(score)] ?? SCORE_NARRATIVE[0]
}

// ─────────────────────────────────────────────────────────────────────────────
// Persisted state
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The evaluation's working state, persisted on the tender so a reload, a draft
 * and an SCM return all resume where the evaluator left off (§8.B.6):
 *   { sig, extractedAt, rounds, scores, compliance, notes, uploads }
 * Read from `techEvalState`, falling back to the last "Save as Draft".
 * A state built against a different matrix is ignored (the criteria changed).
 */
export function readEvalState(tender, criteria) {
  const sig = criteriaSignature(criteria)
  const state = tender?.techEvalState || tender?.techEvalDraft?.state || null
  if (!state || state.sig !== sig) return null
  return state
}

export function emptyEvalState(criteria) {
  return { sig: criteriaSignature(criteria), extractedAt: null, rounds: {}, scores: {}, compliance: {}, notes: {}, uploads: {} }
}
