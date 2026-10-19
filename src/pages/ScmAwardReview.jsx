import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useNavigation } from '../context/NavigationContext'
import { returnRecipient } from '../utils/evalAssignment'
import { tenderRef } from '../utils/tenderRef'

/*
 * SCM Award Review — the main app's `scm/AwardReview` (`/scm-award-review`),
 * on the local tenders. Same gate as the Award Decision screen (`/scm-review`,
 * AwardRecommendation) but laid out as the main app's Gate 2 review: the
 * technical ranking and the commercial recommendation side by side (never
 * blended), a per-bidder Winner / Reject decision saved as it is clicked, then
 * the final approve, or a return to Commercial Evaluation.
 */

// ── Inline SVG icons (matching the rest of the app) ──────────────────────────
const Svg = ({ size = 16, sw = 1.6, style, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const ArrowLeft      = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Svg>
const ShieldOff      = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" /><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" /><line x1="1" y1="1" x2="23" y2="23" /></Svg>
const FileText       = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Svg>
const CheckCircle    = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Svg>
const XCircle        = p => <Svg {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></Svg>
const AlertTriangle  = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>
const RotateCcw      = p => <Svg {...p}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.1" /></Svg>
const BarChart3      = p => <Svg {...p}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></Svg>
const ClipboardCheck = p => <Svg {...p}><rect x="8" y="2" width="8" height="4" rx="1" /><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" /><path d="m9 14 2 2 4-4" /></Svg>
const ChevronRight   = p => <Svg {...p}><polyline points="9 18 15 12 9 6" /></Svg>

const COPY = {
  title: 'SCM Review - Award',
  description: 'Review the technical and commercial rankings, decide each bidder, then approve the award or return it to commercial evaluation',
  empty: 'No tenders awaiting award review',
  approveLabel: 'Confirm & Approve Award',
  approvedText: 'The award decision is final. Contract finalisation can proceed.',
  returnHint: 'Returning sends this tender back to Commercial Evaluation with your comment.',
  returnStep: 'Commercial Evaluation',
}

const BADGE = 'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase'

// This screen's own stage chip — violet, distinct from the other gates' indigo.
const AWARD_BADGE = `${BADGE} bg-violet-50 text-violet-600 ring-1 ring-violet-200`

const DECISION_LABEL = { winner: 'Winner', rejected: 'Rejected', none: 'Undecided' }
const DECISION_BADGE = {
  winner:   `${BADGE} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200`,
  rejected: `${BADGE} bg-red-50 text-red-700 ring-1 ring-red-200`,
  none:     `${BADGE} bg-slate-100 text-slate-500`,
}

// Green for Winner, red for Reject — the destructive choice never shares the
// affirmative one's colour, and each matches the badge it produces.
const DECISION_BUTTON = 'inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'
const DECISION_BUTTON_TONE = {
  winner: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
  reject: 'border-red-200 bg-red-50 text-red-700 hover:bg-red-100',
  clear:  'border-slate-200 bg-white text-[var(--color-primary)] hover:bg-slate-50',
}

const fmtMoney = (n, ccy = 'OMR') => `${ccy} ` + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const describeVariance = (pct) => (pct <= 0 ? `${Math.abs(pct)}% below` : `${pct}% above`)

export default function ScmAwardReview() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { goBack }   = useNavigation()
  const { user }     = useAuth()
  const { tenders, updateTender, approveGate, returnGate } = useTenders()

  const [comment, setComment] = useState('')
  const [outcome, setOutcome] = useState(null) // 'approved' | 'returned'

  // ── Role gate ──
  if (user?.role?.id !== 'scm') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldOff size={22} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
        <p className="text-xs text-slate-400 mt-1">This review is only accessible to Supply Chain.</p>
      </div>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={13} /> Back to Dashboard
      </Button>
    </div>
  )

  // ── No tender selected ──
  if (!tenderId) return (
    <TenderSelectList
      tenders={tenders}
      status="scm_gate2"
      basePath="/scm-award-review"
      title={COPY.title}
      description={COPY.description}
      emptyText={COPY.empty}
    />
  )

  const tender = tenders.find(t => t.id === tenderId)

  // Keep rendering after a decision so the manager can see the outcome.
  if (!tender || (tender.status !== 'scm_gate2' && !outcome)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <FileText size={32} className="text-slate-300" />
      <p className="text-sm font-medium">Tender not found or not awaiting this review.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/scm-award-review')}>
        <ArrowLeft size={13} /> Back to Award Review
      </Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  // The two sides are ranked independently — never blended into one score.
  const rankedTechnical  = [...tenderBidders].sort((a, b) => (b.techScore ?? -1) - (a.techScore ?? -1))
  const rankedCommercial = [...tenderBidders].sort((a, b) => (b.commScore ?? -1) - (a.commScore ?? -1))

  // The commercial side hands over a recommendation (a bidder), not a score.
  // Seeded tenders that predate it fall back to the strongest commercial bidder.
  const commRec     = tender.commercialRecommendation
  const commRecId   = commRec?.bidderId ?? rankedCommercial[0]?.id ?? null
  const commRecName = commRec?.bidderName ?? tenderBidders.find(b => b.id === commRecId)?.name

  const decisions   = tender.awardDecisions || {}
  const decisionOf  = id => decisions[id] || 'none'
  const winnerId    = tenderBidders.find(b => decisionOf(b.id) === 'winner')?.id ?? null
  const trimmed     = comment.trim()
  const recipient   = returnRecipient(tender, 'comm')

  // Each click is saved straight onto the tender. Only one bidder can win, so
  // naming a new winner sends the previous one back to undecided.
  const decide = (bidderId, decision) => {
    const next = { ...decisions }
    if (decision === 'winner') {
      Object.keys(next).forEach(id => { if (next[id] === 'winner') delete next[id] })
    }
    if (decision === 'none') delete next[bidderId]
    else next[bidderId] = decision
    updateTender(tender.id, { awardDecisions: next })
  }

  // Approving records the award the same way the Award Decision screen does,
  // so Contract Drafting and the gate 3 review read the same winner.
  const handleApprove = () => {
    if (!winnerId) return
    updateTender(tender.id, {
      mgmtWinnerId: winnerId,
      mgmtRemarks:  trimmed,
      mgmtRejected: tenderBidders.filter(b => b.id !== winnerId).map(b => b.id),
    })
    approveGate(tender.id, 'scm_gate2', trimmed)
    setOutcome('approved')
  }

  const handleReturn = () => {
    if (!trimmed) return
    returnGate(tender.id, 'scm_gate2', trimmed, 'comm')
    setOutcome('returned')
  }

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <button type="button" onClick={goBack}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                Cost Code: {tender.costCode || tenderRef(tender)}
              </span>
              <span className={AWARD_BADGE}>Award Review</span>
            </div>
            <h3 className="font-semibold text-slate-800 break-words">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tender.department} · Deadline: {tender.deadline || 'NA'} · {tender.budget}
            </p>
          </div>
        </div>
      </Card>

      {/* ── Technical ranking, read-only ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Technical Ranking</h3>
          <span className="text-[11px] font-medium text-slate-400 ml-1">Read-only</span>
        </div>
        {rankedTechnical.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">No technical ranking available.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Bidder</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Compliance</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-[var(--color-primary)]">Technical Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {rankedTechnical.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                    </td>
                    <td className="px-3 py-3 text-center"><Badge variant="compliant">Compliant</Badge></td>
                    <td className="px-3 py-3 text-center">
                      {b.techScore == null
                        ? <span className="text-xs text-slate-400">-</span>
                        : <span className="text-sm font-bold text-slate-800">{b.techScore}</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ── Commercial recommendation, read-only ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <ClipboardCheck size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Commercial Recommendation</h3>
          <span className="text-[11px] font-medium text-slate-400 ml-1">Read-only</span>
        </div>
        {!commRecName ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">Commercial Evaluation completed with no priced bidder.</p>
        ) : (
          <>
            <div className="mx-4 my-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Recommended</p>
              <p className="mt-1 text-sm font-semibold text-emerald-900">{commRecName}</p>
              {commRec?.total != null && (
                <p className="mt-0.5 text-xs text-emerald-700">
                  {fmtMoney(commRec.total, commRec.currency)}
                  {commRec.variancePct != null && <> · {describeVariance(commRec.variancePct)} estimate</>}
                </p>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Bidder</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Total Bid</th>
                    <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Commercial Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {rankedCommercial.map(b => (
                    <tr key={b.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-sm font-semibold text-slate-800">{b.name}</td>
                      <td className="px-3 py-3 text-center text-sm font-medium text-slate-700">{b.totalBid || '-'}</td>
                      <td className="px-3 py-3 text-center text-sm font-medium text-slate-700">{b.commScore ?? '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>

      {/* ── Per-bidder decision — saved on each click ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <CheckCircle size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Bidder Decisions</h3>
        </div>
        {tenderBidders.length === 0 ? (
          <p className="px-4 py-6 text-center text-xs text-slate-400">No bidders to decide.</p>
        ) : (
          <ul className="divide-y divide-slate-50">
            {tenderBidders.map(b => {
              const decision = decisionOf(b.id)
              const locked = !!outcome
              return (
                <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-4">
                  <p className="min-w-0 text-sm font-semibold text-slate-800 break-words">{b.name}</p>
                  <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
                    {/* Fixed width so the buttons line up down the column. */}
                    <span className={`${DECISION_BADGE[decision]} w-[5.25rem] justify-center`}>{DECISION_LABEL[decision]}</span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" className={`${DECISION_BUTTON} ${DECISION_BUTTON_TONE.winner}`}
                        disabled={locked || decision === 'winner'} onClick={() => decide(b.id, 'winner')}>
                        <CheckCircle size={11} /> Winner
                      </button>
                      <button type="button" className={`${DECISION_BUTTON} ${DECISION_BUTTON_TONE.reject}`}
                        disabled={locked || decision === 'rejected'} onClick={() => decide(b.id, 'rejected')}>
                        <XCircle size={11} /> Reject
                      </button>
                      {decision !== 'none' && (
                        <button type="button" className={`${DECISION_BUTTON} ${DECISION_BUTTON_TONE.clear}`}
                          disabled={locked} onClick={() => decide(b.id, 'none')}>
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      {/* ── Final decision panel ── */}
      {!outcome ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Supply Chain Decision</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">{COPY.returnHint}</p>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            aria-label="Review comment"
            placeholder="Add your review comment - required when returning…"
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none mb-3 text-slate-700 placeholder-slate-400"
          />

          {!trimmed && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={12} className="shrink-0" />
              A comment is required to return this tender. Approving without one is allowed.
            </div>
          )}

          {!winnerId && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={12} className="shrink-0" />
              Mark one bidder as the winner above before approving the award.
            </div>
          )}

          {/* Where a return lands, resolved from the tender's own assignment */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Returning sends this tender to</p>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              {recipient.name}
              <span className="text-slate-400 font-normal ml-1.5">· {recipient.roleLabel} · {COPY.returnStep}</span>
            </p>
            {recipient.unassigned && (
              <p className="text-[11px] text-amber-700 mt-1">
                No named owner recorded on this tender — it lands in the {recipient.roleLabel} queue for any {recipient.roleLabel} to pick up.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" className="flex-1 justify-center" disabled={!trimmed} onClick={handleReturn}>
              <RotateCcw size={13} /> Return to Commercial Evaluation
            </Button>
            <Button className="flex-1 justify-center" disabled={!winnerId} onClick={handleApprove}>
              <CheckCircle size={14} /> {COPY.approveLabel}
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <div className={`flex items-start gap-3 rounded-xl px-4 py-4 mb-4 border
            ${outcome === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
            {outcome === 'approved'
              ? <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              : <RotateCcw size={18} className="text-amber-500 shrink-0 mt-0.5" />}
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${outcome === 'approved' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {outcome === 'approved' ? 'Approved' : 'Returned to Commercial Evaluation'}
              </p>
              <p className={`text-xs mt-0.5 ${outcome === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {outcome === 'approved'
                  ? COPY.approvedText
                  : <>Sent back to <strong>{COPY.returnStep}</strong> with <strong>{recipient.name}</strong> ({recipient.roleLabel}).</>}
              </p>
              {trimmed && (
                <p className={`text-xs mt-2 italic break-words ${outcome === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>“{trimmed}”</p>
              )}
            </div>
          </div>
          <Button className="w-full justify-center" onClick={() => navigate('/scm-award-review')}>
            Back to Tenders <ChevronRight size={14} />
          </Button>
        </Card>
      )}
    </div>
  )
}
