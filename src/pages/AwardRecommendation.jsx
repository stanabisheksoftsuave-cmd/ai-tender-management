import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'

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
const Download       = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
const Bot            = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>

// ── Helpers ───────────────────────────────────────────────────────────────────
const combined = b => Math.round((b.techScore ?? 75) * 0.6 + (b.commScore ?? 70) * 0.4)

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
  const { user }     = useAuth()
  const { tenders, advanceTender, updateTender } = useTenders()

  const [winnerId,   setWinnerId]   = useState(null)
  const [rejected,   setRejected]   = useState({}) // { [bidderId]: true }
  const [remarks,    setRemarks]    = useState('')
  const [submitted,  setSubmitted]  = useState(false)

  // ── Role gate ──
  if (user?.role?.id !== 'mgmt_review') return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
        <ShieldOff size={22} className="text-red-400" />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
        <p className="text-xs text-slate-400 mt-1">Management Review is only accessible to Management Reviewers.</p>
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
      status="mgmt_review"
      basePath="/mgmt-review"
      title="Management Review"
      description="Select a tender to review evaluator scores and submit an award recommendation"
      emptyText="No tenders pending management review"
    />
  )

  const tender = tenders.find(t => t.id === tenderId)

  if (!tender || tender.status !== 'mgmt_review') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <FileText size={32} className="text-slate-300" />
      <p className="text-sm font-medium">Tender not found or not in Management Review stage.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={13} /> Back to Dashboard
      </Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  // Sort by combined score descending
  const ranked = [...tenderBidders].sort((a, b) => combined(b) - combined(a))
  const topBidder   = ranked[0]
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
    advanceTender(tender.id)
    setSubmitted(true)
  }

  return (
    <div className="space-y-5">

      {/* ── Page Header ── */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="mgmt_review">Management Review</Badge>
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
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">AI Evaluation Summary · Read-only</span>
          <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">
            Technical and Commercial evaluations are complete. Scores below are from the respective evaluators.
            Review the results and approve or reject each bidder proposal for contract drafting.
            <strong className="ml-1">Only one bidder can be approved for award.</strong>
          </p>
        </div>
      </div>

      {/* ── Evaluator Score Table ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Evaluator Scores</h3>
          <span className="text-[10px] text-slate-400 ml-1">From Technical &amp; Commercial Evaluation stages · Read-only</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '22%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '16%' }} />
              <col style={{ width: '14%' }} />
              <col style={{ width: '19%' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Bidder</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Compliance</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-blue-500">Technical Score<br/><span className="font-normal text-slate-400">60% weight</span></th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-violet-500">Commercial Score<br/><span className="font-normal text-slate-400">40% weight</span></th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-600">Combined</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Decision</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranked.map((b, idx) => {
                const comb       = combined(b)
                const isWinner   = winnerId === b.id
                const isRejected = rejected[b.id]
                const isTop      = idx === 0

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
                            isTop ? 'bg-[var(--color-primary)] text-white' :
                            'bg-[var(--color-primary)]/10 text-[var(--color-primary)]'}`}>
                          {b.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                            {isTop && !isRejected && (
                              <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                                <Star size={8} fill="currentColor" stroke="none" /> Top Score
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

                    {/* Commercial score */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${(b.commScore ?? 70) >= 80 ? 'text-emerald-600' : (b.commScore ?? 70) >= 65 ? 'text-amber-600' : 'text-red-500'}`}>
                          {b.commScore ?? 70}
                        </span>
                        <span className="text-[9px] text-slate-400">/100</span>
                        {scoreBar(b.commScore ?? 70)}
                      </div>
                    </td>

                    {/* Combined */}
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-xl font-bold ${comb >= 80 ? 'text-emerald-600' : comb >= 65 ? 'text-amber-600' : 'text-red-500'}`}>
                          {comb}
                        </span>
                        <span className="text-[9px] text-slate-400">/100</span>
                        {scoreBar(comb)}
                      </div>
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

      {/* ── Score breakdown legend ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {ranked.map(b => {
          const comb = combined(b)
          const isWinner = winnerId === b.id
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
                  <span className="font-bold text-slate-700">{b.techScore ?? 75}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span className="text-violet-500 font-medium">Commercial</span>
                  <span className="font-bold text-slate-700">{b.commScore ?? 70}</span>
                </div>
                <div className="flex justify-between text-[10px] pt-1 border-t border-slate-100 mt-1">
                  <span className="text-slate-500 font-semibold">Combined</span>
                  <span className={`font-bold ${comb >= 80 ? 'text-emerald-600' : comb >= 65 ? 'text-amber-600' : 'text-red-500'}`}>{comb}/100</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* ── Award Recommendation Panel ── */}
      {!submitted ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <Award size={14} className={winnerId ? 'text-[var(--color-primary)]' : 'text-slate-400'} />
            <h3 className="text-sm font-semibold text-slate-800">Award Recommendation</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            {winnerBidder
              ? <>Recommending <strong className="text-slate-800">{winnerBidder.name}</strong> (Combined: {combined(winnerBidder)}/100) for contract award. All other bidder proposals will be rejected.</>
              : 'Approve one bidder above to unlock the recommendation. The approved bidder will proceed to contract drafting.'}
          </p>

          <textarea
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            rows={3}
            placeholder="Add recommendation remarks, justification, or notes for the contract stage…"
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none mb-3 text-slate-700 placeholder-slate-400"
          />

          {!winnerId && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={12} />
              Approve one bidder to submit the award recommendation.
            </div>
          )}

          <Button
            className="w-full justify-center"
            disabled={!winnerId}
            onClick={handleSubmit}>
            <Award size={14} /> Submit Award Recommendation
          </Button>
        </Card>
      ) : (
        <Card className="p-5">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-4 mb-4">
            <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Award Recommendation Submitted</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                <strong>{winnerBidder?.name}</strong> has been recommended for award (score: {combined(winnerBidder ?? ranked[0])}/100).
                The tender has advanced to <strong>Contract Drafting</strong>.
              </p>
              {remarks && (
                <p className="text-xs text-emerald-600 mt-2 italic">"{remarks}"</p>
              )}
            </div>
          </div>
          <Button className="w-full justify-center" onClick={() => navigate('/contract')}>
            Proceed to Contract Drafting <ChevronRight size={14} />
          </Button>
        </Card>
      )}
    </div>
  )
}
