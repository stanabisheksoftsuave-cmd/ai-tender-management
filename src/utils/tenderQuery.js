/**
 * Front-end "AI" tender query engine.
 *
 * Takes a natural-language prompt ("show me tenders above OMR 1 million in
 * technical evaluation", "top 5 highest budget", "closing in April") and turns
 * it into a filtered / sorted tender list plus a human-readable explanation of
 * what it understood. No backend — everything is derived locally from the
 * tender records already in context.
 */

const STATUS_KEYWORDS = [
  { statuses: ['prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4'], label: 'Pre-Qualification', words: ['pre qual', 'prequal', 'pre-qualification', 'prequalification', 'التأهيل المسبق'] },
  { statuses: ['prequal_rejected'], label: 'Pre-Qualification Rejected', words: ['prequal rejected', 'rejected'] },
  { statuses: ['draft'], label: 'Draft', words: ['draft', 'pending export', 'مسودة'] },
  { statuses: ['upload'], label: 'Awaiting Ingestion', words: ['ingestion', 'awaiting ingestion', 'upload', 'bid upload'] },
  { statuses: ['tech_eval'], label: 'Technical Evaluation', words: ['technical evaluation', 'tech eval', 'technical', 'التقييم الفني'] },
  { statuses: ['comm_eval'], label: 'Commercial Evaluation', words: ['commercial evaluation', 'comm eval', 'commercial', 'التقييم التجاري'] },
  { statuses: ['mgmt_review'], label: 'Management Review', words: ['management review', 'mgmt review', 'management', 'review stage'] },
  { statuses: ['award'], label: 'Award Recommended', words: ['award', 'awarded', 'award recommended', 'الترسية'] },
  { statuses: ['legal_review'], label: 'Legal Review', words: ['legal review', 'legal'] },
  { statuses: ['contract_execution'], label: 'Contract Execution', words: ['contract execution', 'signing', 'execution'] },
  { statuses: ['active'], label: 'Contract Active', words: ['active contract', 'contract active', 'ongoing contract'] },
  { statuses: ['contract_closure'], label: 'Closure In Progress', words: ['closure', 'closing contract'] },
  { statuses: ['closed'], label: 'Closed & Archived', words: ['closed', 'archived'] },
  { statuses: ['legal_review', 'contract_execution', 'active', 'contract_closure'], label: 'Contract stage', words: ['contract stage', 'contracts', 'contract'] },
]

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']

/** "OMR 1,539,000" → 1539000 */
export const budgetValue = (budget) => {
  if (typeof budget === 'number') return budget
  const digits = String(budget || '').replace(/[^0-9.]/g, '')
  return digits ? parseFloat(digits) : 0
}

/** "1.5 million" / "900k" / "1,200,000" → number */
const parseAmount = (raw, suffix = '') => {
  const n = parseFloat(String(raw).replace(/,/g, ''))
  if (isNaN(n)) return null
  const s = (suffix || '').toLowerCase()
  if (s.startsWith('m') || s.startsWith('mn')) return n * 1_000_000
  if (s.startsWith('k')) return n * 1_000
  if (s.startsWith('b')) return n * 1_000_000_000
  return n
}

const AMOUNT = '(?:omr\\s*)?([0-9][0-9,.]*)\\s*(million|mn|m|thousand|k|billion|b)?'

const fmtOMR = (n) =>
  `OMR ${Math.round(n).toLocaleString('en-US')}`

/**
 * @returns {{ results: Array, explanation: string, matched: boolean, sort: string|null }}
 */
export function runTenderQuery(prompt, tenders) {
  const q = String(prompt || '').toLowerCase().trim()
  if (!q) return { results: tenders, explanation: '', matched: false }

  let list = [...tenders]
  const notes = []
  let understood = false

  // ── Stage / status ────────────────────────────────────────────────────────
  const stageHit = STATUS_KEYWORDS.find(s => s.words.some(w => q.includes(w)))
  if (stageHit) {
    list = list.filter(t => stageHit.statuses.includes(t.status))
    notes.push(`stage is ${stageHit.label}`)
    understood = true
  }

  // ── Budget ────────────────────────────────────────────────────────────────
  const between = q.match(new RegExp(`between\\s+${AMOUNT}\\s+(?:and|to|-)\\s+${AMOUNT}`))
  if (between) {
    const lo = parseAmount(between[1], between[2])
    const hi = parseAmount(between[3], between[4])
    if (lo != null && hi != null) {
      list = list.filter(t => budgetValue(t.budget) >= lo && budgetValue(t.budget) <= hi)
      notes.push(`budget between ${fmtOMR(lo)} and ${fmtOMR(hi)}`)
      understood = true
    }
  } else {
    const above = q.match(new RegExp(`(?:above|over|greater than|more than|higher than|>=?|at least|exceeding)\\s+${AMOUNT}`))
    const below = q.match(new RegExp(`(?:below|under|less than|lower than|cheaper than|<=?|at most|within)\\s+${AMOUNT}`))
    const isBidderCtx = (m) => m && /bidder|bid|vendor|supplier/.test(q.slice(m.index, m.index + m[0].length + 12))

    if (above && !isBidderCtx(above)) {
      const v = parseAmount(above[1], above[2])
      if (v != null) {
        list = list.filter(t => budgetValue(t.budget) > v)
        notes.push(`budget above ${fmtOMR(v)}`)
        understood = true
      }
    }
    if (below && !isBidderCtx(below)) {
      const v = parseAmount(below[1], below[2])
      if (v != null) {
        list = list.filter(t => budgetValue(t.budget) < v)
        notes.push(`budget below ${fmtOMR(v)}`)
        understood = true
      }
    }
  }

  // ── Bidder count ──────────────────────────────────────────────────────────
  const bidMore = q.match(/(?:more than|above|over|at least|>=?)\s*(\d+)\s*(?:bidders?|bids?|vendors?)/)
  const bidLess = q.match(/(?:less than|fewer than|below|under|at most|<=?)\s*(\d+)\s*(?:bidders?|bids?|vendors?)/)
  const bidExact = q.match(/(?:with|having|has)\s*(\d+)\s*(?:bidders?|bids?|vendors?)/)
  if (bidMore) {
    list = list.filter(t => (t.bidders || 0) > Number(bidMore[1]))
    notes.push(`more than ${bidMore[1]} bidders`); understood = true
  } else if (bidLess) {
    list = list.filter(t => (t.bidders || 0) < Number(bidLess[1]))
    notes.push(`fewer than ${bidLess[1]} bidders`); understood = true
  } else if (bidExact) {
    list = list.filter(t => (t.bidders || 0) === Number(bidExact[1]))
    notes.push(`exactly ${bidExact[1]} bidders`); understood = true
  }

  // ── AI score ──────────────────────────────────────────────────────────────
  const score = q.match(/(?:ai\s*score|score)\s*(?:above|over|greater than|more than|>=?)?\s*(\d{1,3})/)
  if (score) {
    list = list.filter(t => (t.aiScore || 0) >= Number(score[1]))
    notes.push(`AI score ${score[1]}% or higher`); understood = true
  }

  // ── Deadline ──────────────────────────────────────────────────────────────
  const monthIdx = MONTHS.findIndex(m => q.includes(m))
  if (monthIdx >= 0) {
    const yearM = q.match(/\b(20\d{2})\b/)
    const mm = String(monthIdx + 1).padStart(2, '0')
    list = list.filter(t => {
      const d = String(t.deadline || '')
      return d.slice(5, 7) === mm && (!yearM || d.slice(0, 4) === yearM[1])
    })
    notes.push(`deadline in ${MONTHS[monthIdx][0].toUpperCase()}${MONTHS[monthIdx].slice(1)}${yearM ? ' ' + yearM[1] : ''}`)
    understood = true
  }

  const dBefore = q.match(/(?:deadline|closing|due|expire\w*)\s*(?:is\s*)?(?:before|prior to|earlier than)\s*(\d{4}-\d{2}-\d{2})/)
  const dAfter = q.match(/(?:deadline|closing|due|expire\w*)\s*(?:is\s*)?(?:after|later than|beyond)\s*(\d{4}-\d{2}-\d{2})/)
  if (dBefore) {
    list = list.filter(t => String(t.deadline) < dBefore[1])
    notes.push(`deadline before ${dBefore[1]}`); understood = true
  }
  if (dAfter) {
    list = list.filter(t => String(t.deadline) > dAfter[1])
    notes.push(`deadline after ${dAfter[1]}`); understood = true
  }

  // ── Sorting ───────────────────────────────────────────────────────────────
  let sort = null
  if (/highest|largest|biggest|most expensive|descending|top/.test(q) && /budget|value|amount|cost|expensive|top/.test(q)) {
    list.sort((a, b) => budgetValue(b.budget) - budgetValue(a.budget)); sort = 'budget-desc'
    notes.push('sorted by highest budget'); understood = true
  } else if (/lowest|smallest|cheapest|ascending/.test(q)) {
    list.sort((a, b) => budgetValue(a.budget) - budgetValue(b.budget)); sort = 'budget-asc'
    notes.push('sorted by lowest budget'); understood = true
  } else if (/earliest|soonest|urgent|closing soon|nearest deadline/.test(q)) {
    list.sort((a, b) => String(a.deadline).localeCompare(String(b.deadline))); sort = 'deadline-asc'
    notes.push('sorted by earliest deadline'); understood = true
  } else if (/latest deadline|furthest/.test(q)) {
    list.sort((a, b) => String(b.deadline).localeCompare(String(a.deadline))); sort = 'deadline-desc'
    notes.push('sorted by latest deadline'); understood = true
  }

  // ── Free-text fallback (department / title / id keywords) ─────────────────
  if (!understood) {
    const stop = new Set(['show', 'me', 'the', 'a', 'an', 'all', 'list', 'give', 'i', 'need', 'want', 'get', 'find', 'tender', 'tenders', 'record', 'records', 'please', 'of', 'for', 'with', 'in', 'on', 'and', 'is', 'are', 'which', 'that', 'this', 'these', 'those', 'my', 'our', 'to', 'from', 'by', 'it', 'their'])
    const terms = q.split(/[^a-z0-9\-]+/).filter(w => w.length > 2 && !stop.has(w))
    if (terms.length) {
      const hay = t => `${t.id} ${t.title} ${t.department} ${t.stage}`.toLowerCase()
      list = list.filter(t => terms.every(w => hay(t).includes(w)))
      if (list.length === 0) {
        // Loosen: any term instead of all terms
        list = tenders.filter(t => terms.some(w => hay(t).includes(w)))
      }
      notes.push(`matching "${terms.join(' ')}"`)
    }
  }

  // ── Top N ─────────────────────────────────────────────────────────────────
  const topN = q.match(/\b(?:top|first|latest)\s+(\d+)\b/)
  if (topN) {
    const n = Number(topN[1])
    if (!sort && /budget|value|expensive/.test(q)) list.sort((a, b) => budgetValue(b.budget) - budgetValue(a.budget))
    list = list.slice(0, n)
    notes.push(`limited to top ${n}`)
  }

  const explanation = notes.length
    ? `Showing tenders where ${notes.join(', ')}.`
    : 'Could not match any filter — showing the closest results.'

  return { results: list, explanation, matched: notes.length > 0, sort }
}

export const QUERY_SUGGESTIONS = [
  'Tenders above OMR 1 million',
  'Show technical evaluation tenders',
  'Top 5 highest budget tenders',
  'Tenders with more than 3 bidders',
  'Deadline in April 2025',
  'Ministry of Health tenders',
]
