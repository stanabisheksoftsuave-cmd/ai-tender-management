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
import { useHomePath } from '../utils/permissions'
import { returnRecipient } from '../utils/evalAssignment'

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Svg = ({ size=16, sw=1.6, style, className='', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const ArrowLeft      = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>
const ShieldOff      = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const FileText       = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>
const CheckCircle    = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const XCircle        = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Svg>
const AlertTriangle  = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const Award          = p => <Svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></Svg>
const BarChart3      = p => <Svg {...p}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></Svg>
const ChevronRight   = p => <Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>
const ThumbsUp       = p => <Svg {...p}><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/><path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></Svg>
const ThumbsDown     = p => <Svg {...p}><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/><path d="M17 2h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></Svg>
const Star           = p => <Svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>
const RotateCcw      = p => <Svg {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></Svg>
const Bot            = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>

// The commercial recommendation carries its own currency (a single-source
// tender can be priced in USD), so the gate reads it rather than assuming OMR.
const fmtMoney = (n, ccy = 'OMR') => `${ccy} ` + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })

// Gate 2 clears both evaluations at once, so a return names the side to redo.
// `owner` is the role that owns the side; the actual person is resolved from the
// tender's assignment at render time (returnRecipient).
const RETURN_TARGETS = [
  { id: 'tech', label: 'Technical',  owner: 'Contract Holder',
    hint: 'The Contract Holder re-opens the technical evaluation. The commercial recommendation is kept.' },
  { id: 'comm', label: 'Commercial', owner: 'Contract Engineer',
    hint: 'The Contract Engineer re-opens the commercial evaluation. The technical result is kept.' },
  { id: 'both', label: 'Both',       owner: 'Holder & Engineer',
    hint: 'Both sides are re-opened. A linear tender restarts at technical evaluation and walks forward through the technical gate again.' },
]

const scoreBar = (val, max = 100) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
    <div className={`h-1.5 rounded-full transition-all duration-500 ${val >= 80 ? 'bg-emerald-400' : val >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
      style={{ width: `${(val / max) * 100}%` }} />
  </div>
)

// ── Component ─────────────────────────────────────────────────────────────────
export default function AwardRecommendation() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { goBack }   = useNavigation()
  const { user }     = useAuth()
  const home         = useHomePath()
  const { tenders, updateTender, approveGate, returnGate } = useTenders()

  const [winnerId,   setWinnerId]   = useState(null)
  const [rejected,   setRejected]   = useState({}) // { [bidderId]: true }
  const [remarks,    setRemarks]    = useState('')
  const [submitted,  setSubmitted]  = useState(false)
  // Gate 2 sits downstream of both evaluations, so a return has to name the side
  // being sent back — otherwise a technical concern lands on the Contract Engineer.
  const [returnTo,   setReturnTo]   = useState('comm') // 'tech' | 'comm' | 'both'

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
      <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
        <ArrowLeft size={13} /> Back to Home
      </Button>
    </div>
  )

  // ── No tender selected ──
  if (!tenderId) return (
    <TenderSelectList
      tenders={tenders}
      status="scm_gate2"
      basePath="/scm-review"
      title="SCM Review — Commercial & Award"
      description="Select a tender to review the technical result and commercial recommendation, then award or reject"
      emptyText="No tenders pending SCM award review"
    />
  )

  const tender = tenders.find(t => t.id === tenderId)

  // Once submitted, keep rendering even though the tender has advanced — the
  // reviewer can still see the outcome and use "Change decision" to revise it.
  if (!tender || (tender.status !== 'scm_gate2' && !submitted)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <FileText size={32} className="text-slate-300" />
      <p className="text-sm font-medium">Tender not found or not in Management Review stage.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
        <ArrowLeft size={13} /> Back to Home
      </Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  // The commercial side hands over a RECOMMENDATION (a bidder), not a score. Use
  // the recorded recommendation; for seeded tenders that predate it, fall back to
  // the strongest commercial bidder so the screen still reads sensibly.
  const commRec = tender.commercialRecommendation
  const commRecId = commRec?.bidderId
    ?? [...tenderBidders].sort((a, b) => (b.commScore ?? 0) - (a.commScore ?? 0))[0]?.id
    ?? null
  const commRecName = commRec?.bidderName ?? tenderBidders.find(b => b.id === commRecId)?.name

  // Rank by technical score (there is no combined average any more).
  const ranked = [...tenderBidders].sort((a, b) => (b.techScore ?? 0) - (a.techScore ?? 0))
  const winnerBidder = tenderBidders.find(b => b.id === winnerId)

  const toggleReject = (bidderId) => {
    if (winnerId === bidderId) setWinnerId(null)
    setRejected(prev => ({ ...prev, [bidderId]: !prev[bidderId] }))
  }

  const selectWinner = (bidderId) => {
    setWinnerId(prev => prev === bidderId ? null : bidderId)
    if (rejected[bidderId]) setRejected(prev => ({ ...prev, [bidderId]: false }))
  }

  const handleSubmit = () => {
    updateTender(tender.id, {
      mgmtWinnerId:  winnerId,
      mgmtRemarks:   remarks,
      mgmtRejected:  Object.keys(rejected).filter(id => rejected[id]),
    })
    // Gate 2 approval releases the tender to contract drafting.
    approveGate(tender.id, 'scm_gate2', remarks.trim())
    setSubmitted(true)
  }

  // Who the chosen return target actually reaches on this tender.
  const returnDest = returnRecipient(tender, returnTo)

  // Send the tender back to the evaluator that owns the side being reworked.
  const handleReturn = () => {
    returnGate(tender.id, 'scm_gate2', remarks.trim(), returnTo)
    navigate('/tenders')
  }

  // Revise a submitted decision: pull the tender back into SCM award review so
  // the approve/reject can be changed, and re-open the decision UI.
  const handleChangeDecision = () => {
    updateTender(tender.id, { status: 'scm_gate2', stage: 'SCM Review — Commercial & Award' })
    setSubmitted(false)
  }

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={goBack}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="scm_gate">SCM Award Review</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · {tender.budget}</p>
          </div>
        </div>
      </Card>

      {/* ── AI Summary Strip ── */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3.5 flex items-start gap-3">
        <Bot size={14} className="text-blue-500 mt-0.5 shrink-0" />
        <div className="flex-1">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Evaluation Summary · Read-only</span>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            The Technical Evaluation produced a score; the Commercial Evaluator submitted a <strong>recommendation</strong> (not a score),
            so there is no combined average — the two are shown side by side.
            {commRecName && <> Commercial recommends <strong>{commRecName}</strong>{commRec && <> at {fmtMoney(commRec.total, commRec.currency)} ({commRec.variancePct <= 0 ? `${Math.abs(commRec.variancePct)}% below` : `${commRec.variancePct}% above`} estimate)</>}.</>}
            <strong className="ml-1">Only one bidder can be approved for award.</strong>
          </p>
        </div>
      </div>

      {/* ── Evaluator Results Table ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Evaluator Results</h3>
          <span className="text-[10px] text-slate-400 ml-1">Technical score &amp; Commercial recommendation · Read-only</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '26%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '18%' }} />
              <col style={{ width: '22%' }} />
              <col style={{ width: '20%' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Bidder</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Compliance</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-blue-500">Technical Score<br/><span className="font-normal text-slate-400">out of 100</span></th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-violet-500">Commercial<br/><span className="font-normal text-slate-400">evaluator's recommendation</span></th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranked.map((b, idx) => {
                const isWinner   = winnerId === b.id
                const isRejected = rejected[b.id]
                const isTop      = idx === 0
                const isCommRec  = b.id === commRecId

                return (
                  <tr key={b.id} className={`transition-colors
                    ${isWinner   ? 'bg-emerald-50/60' :
                      isRejected ? 'bg-red-50/40 opacity-70' :
                      'hover:bg-slate-50/50'}`}>

                    {/* Bidder */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0
                          ${isWinner ? 'bg-emerald-500 text-white' :
                            isCommRec ? 'bg-violet-500 text-white' :
                            'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                          {b.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                            {isTop && !isRejected && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                <Star size={8} fill="currentColor" stroke="none" /> Top Technical
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{b.country} · {b.totalBid}</p>
                        </div>
                      </div>
                    </td>

                    {/* Compliance */}
                    <td className="px-3 py-4 text-center">
                      <Badge variant="compliant">Compliant</Badge>
                    </td>

                    {/* Technical score */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${(b.techScore ?? 75) >= 80 ? 'text-emerald-600' : (b.techScore ?? 75) >= 65 ? 'text-amber-600' : 'text-red-500'}`}>
                          {b.techScore ?? 75}
                        </span>
                        <span className="text-[9px] text-slate-400">/100</span>
                        {scoreBar(b.techScore ?? 75)}
                      </div>
                    </td>

                    {/* Commercial recommendation (not a score) */}
                    <td className="px-3 py-4 text-center">
                      {isCommRec ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="flex items-center gap-1 text-[10px] font-bold text-violet-700 bg-violet-50 border border-violet-200 px-2.5 py-1 rounded-full">
                            <ThumbsUp size={10} /> Commercial recommends
                          </span>
                          {commRec && (
                            <span className="text-[10px] text-slate-500">
                              {fmtMoney(commRec.total, commRec.currency)} · {commRec.variancePct <= 0 ? `${Math.abs(commRec.variancePct)}% below` : `${commRec.variancePct}% above`} est.
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400">Not recommended</span>
                      )}
                    </td>

                    {/* Decision */}
                    <td className="px-3 py-4">
                      {submitted ? (
                        <div className="flex items-center justify-center">
                          {isWinner ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full">
                              <CheckCircle size={10} /> Approved
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full">
                              <XCircle size={10} /> Rejected
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => selectWinner(b.id)}
                            className={`w-full flex items-center justify-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all
                              ${isWinner
                                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                                : 'border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 bg-white'}`}>
                            <ThumbsUp size={10} />
                            {isWinner ? 'Approved' : 'Approve'}
                          </button>
                          <button
                            onClick={() => toggleReject(b.id)}
                            className={`w-full flex items-center justify-center gap-1 text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all
                              ${isRejected
                                ? 'bg-red-500 border-red-500 text-white shadow-sm'
                                : 'border-slate-200 text-slate-400 hover:border-red-300 hover:text-red-500 bg-white'}`}>
                            <ThumbsDown size={10} />
                            {isRejected ? 'Rejected' : 'Reject'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Per-bidder summary cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ranked.map(b => {
          const isWinner = winnerId === b.id
          const isCommRec = b.id === commRecId
          return (
            <div key={b.id} className={`rounded-2xl border px-4 py-3 transition-all
              ${isWinner
                ? 'bg-emerald-50 border-emerald-200 ring-2 ring-emerald-300/50'
                : rejected[b.id]
                ? 'bg-slate-50 border-slate-200 opacity-50'
                : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-slate-700 truncate mr-2">{b.name.split(' ')[0]}</p>
                {isWinner && <CheckCircle size={12} className="text-emerald-500 shrink-0" />}
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px]">
                  <span className="text-blue-500 font-medium">Technical</span>
                  <span className="font-bold text-slate-700">{b.techScore ?? 75}/100</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100 mt-1">
                  <span className="text-violet-500 font-medium">Commercial</span>
                  <span className={`font-bold ${isCommRec ? 'text-violet-700' : 'text-slate-400'}`}>{isCommRec ? 'Recommended' : '—'}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Award Recommendation / Decision Panel ── */}
      {!submitted ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Award size={14} className={winnerId ? 'text-[var(--color-primary)]' : 'text-slate-400'} />
            <h3 className="text-sm font-semibold text-slate-800">Award Decision</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {winnerBidder
              ? <>Approving <strong className="text-slate-800">{winnerBidder.name}</strong> for contract award. All other bidder proposals will be rejected.</>
              : 'Approve one bidder above to unlock the decision. The approved bidder will proceed to contract drafting.'}
          </p>

          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={3}
            placeholder="Add decision remarks, justification, or notes for the contract stage…"
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none mb-3 text-slate-700 placeholder-slate-400"
          />

          {!winnerId && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={12} />
              Approve one bidder to submit the decision.
            </div>
          )}

          {/* Return target — the tender goes back to whichever evaluator owns it */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Return for re-evaluation to</p>
            <div className="flex flex-wrap gap-2">
              {RETURN_TARGETS.map(t => {
                const active = returnTo === t.id
                return (
                  <button key={t.id} onClick={() => setReturnTo(t.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors
                      ${active ? 'border-[var(--color-primary)] bg-white text-slate-800' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                    <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center shrink-0
                      ${active ? 'border-[var(--color-primary)]' : 'border-slate-300'}`}>
                      {active && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
                    </span>
                    <span className="font-semibold">{t.label}</span>
                    <span className="text-slate-400">{t.owner}</span>
                  </button>
                )
              })}
            </div>
            {/* Name the person, not just the role — resolved from this tender's assignment */}
            <p className="text-xs text-slate-800 font-semibold mt-2.5">
              Goes to {returnDest.name}
              <span className="text-slate-400 font-normal ml-1.5">· {returnDest.roleLabel}</span>
            </p>
            {returnDest.unassigned && (
              <p className="text-[11px] text-amber-700 mt-1">
                No named evaluator on this tender — it appears in the owning role’s queue marked “Unassigned”.
              </p>
            )}
            <p className="text-[11px] text-slate-500 mt-1.5">{RETURN_TARGETS.find(t => t.id === returnTo)?.hint}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="secondary"
              className="flex-1 justify-center"
              disabled={!remarks.trim()}
              onClick={handleReturn}>
              <RotateCcw size={13} /> Return for Re-Evaluation
            </Button>
            <Button
              className="flex-1 justify-center"
              disabled={!winnerId}
              onClick={handleSubmit}>
              <Award size={14} /> Approve Award
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 mb-4">
            <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Decision Submitted</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                <strong>{winnerBidder?.name}</strong> has been approved for award (Technical {winnerBidder?.techScore ?? 75}/100
                {winnerBidder?.id === commRecId ? ' · commercially recommended' : ''}).
                The tender has advanced to <strong>Contract Drafting</strong>.
              </p>
              {remarks && (
                <p className="text-xs text-emerald-600 mt-2 italic">"{remarks}"</p>
              )}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" className="flex-1 justify-center" onClick={handleChangeDecision}>
              <RotateCcw size={13} /> Change Decision
            </Button>
            <Button className="flex-1 justify-center" onClick={() => navigate('/contract')}>
              Proceed to Contract Drafting <ChevronRight size={14} />
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
