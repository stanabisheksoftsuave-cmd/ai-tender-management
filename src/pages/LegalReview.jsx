import { useState } from 'react'
import {
  Shield, CheckCircle, AlertTriangle, Bot, Send, FileText, X,
  Clock, Scale, ShieldOff, ChevronDown, ChevronUp, Hash, Calendar,
  ArrowLeft, AlertCircle, Gavel
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'

// ── Legal review criteria ────────────────────────────────────────────────────

const LEGAL_ITEMS = [
  { id: 'l1', category: 'Contractual',  item: 'Force Majeure Clause',          level: 'low' },
  { id: 'l2', category: 'Regulatory',   item: 'Local Content / ICV ≥30%',      level: 'medium' },
  { id: 'l3', category: 'Financial',    item: 'Bid Bond Validity (120 days)',   level: 'low' },
  { id: 'l4', category: 'Contractual',  item: 'Limitation of Liability Cap',   level: 'high' },
  { id: 'l5', category: 'Regulatory',   item: 'Data Protection Compliance',    level: 'low' },
  { id: 'l6', category: 'Insurance',    item: 'Professional Indemnity Cover',  level: 'medium' },
]

// Per-bidder legal compliance seed (bidder ID → item ID → status)
const LEGAL_SEED = {
  1: { l1: 'compliant',         l2: 'compliant',         l3: 'compliant', l4: 'compliant',         l5: 'compliant',         l6: 'compliant' },
  2: { l1: 'compliant',         l2: 'partial_compliant', l3: 'compliant', l4: 'non_compliant',     l5: 'compliant',         l6: 'compliant' },
  3: { l1: 'compliant',         l2: 'non_compliant',     l3: 'compliant', l4: 'partial_compliant', l5: 'compliant',         l6: 'non_compliant' },
  4: { l1: 'partial_compliant', l2: 'compliant',         l3: 'compliant', l4: 'compliant',         l5: 'partial_compliant', l6: 'compliant' },
}

const LEGAL_DETAIL = {
  l1: { 1: 'Standard clause present, no deviations.',            2: 'Standard clause present, no deviations.',            3: 'Standard clause present, no deviations.',              4: 'Minor wording deviation — acceptable.' },
  l2: { 1: 'ICV certificate provided, 42% local content.',       2: 'Proposes 27% — below 30% threshold. Flag for review.', 3: 'No ICV certificate submitted.',                        4: 'ICV at 31% — marginally compliant.' },
  l3: { 1: 'Valid until 15 Jul 2025 — within 120-day window.',   2: 'Valid until 15 Jul 2025 — within 120-day window.',    3: 'Valid until 15 Jul 2025 — within 120-day window.',     4: 'Valid until 15 Jul 2025 — within 120-day window.' },
  l4: { 1: 'Liability capped at 100% contract value — standard.',2: 'Capped at 50% contract value — below standard.',      3: 'Capped at 75% — partial gap. Negotiation recommended.',4: 'Liability capped at 100% contract value — standard.' },
  l5: { 1: 'DPA signed, sub-processor list provided.',           2: 'DPA signed, sub-processor list provided.',            3: 'DPA signed, sub-processor list provided.',             4: 'DPA signed but sub-processor list incomplete.' },
  l6: { 1: 'PI cover OMR 2M — meets requirement.',               2: 'PI cover OMR 2M — meets requirement.',                3: 'PI cover OMR 500K — below OMR 1M requirement.',        4: 'PI cover OMR 1.5M — meets requirement.' },
}

const levelColor = {
  low:    'text-slate-600 bg-slate-100 border-slate-200',
  medium: 'text-amber-700 bg-amber-50  border-amber-200',
  high:   'text-red-700   bg-red-50    border-red-200',
}

const statusCfg = {
  compliant:         { label: 'Compliant',         cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  partial_compliant: { label: 'Partial Compliant', cls: 'text-amber-700   bg-amber-50   border-amber-200' },
  non_compliant:     { label: 'Non-Compliant',      cls: 'text-red-700     bg-red-50     border-red-200' },
}

const decisionCfg = {
  approved: { label: 'Approved',  cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  flagged:  { label: 'Flagged',   cls: 'text-amber-700   bg-amber-50   border-amber-200' },
  rejected: { label: 'Rejected',  cls: 'text-red-700     bg-red-50     border-red-200' },
}

export default function LegalReview() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { tenders, advanceTender } = useTenders()
  const tender = tenders.find(t => t.id === tenderId)

  const [expandedBidder, setExpandedBidder] = useState(null)
  const [expandedItem,   setExpandedItem]   = useState(null)
  // { [bidderId]: { decision: 'approved'|'flagged'|'rejected', note: '' } }
  const [reviews,  setReviews]  = useState({})
  const [finalSubmitted, setFinalSubmitted] = useState(false)

  if (user?.role?.id !== 'legal_review') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Legal Reviewers can access this page.</p>
    </div>
  )

  if (!tenderId) return (
    <TenderSelectList
      tenders={tenders.filter(t => t.status === 'legal_review')}
      status="legal_review"
      basePath="/legal-review"
      title="Legal Review"
      description="Select a tender to begin bidder-wise legal review"
      emptyText="No tenders in legal review"
    />
  )

  if (!tender || tender.status !== 'legal_review') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  const reviewedCount  = tenderBidders.filter(b => reviews[b.id]?.decision).length
  const allReviewed    = reviewedCount === tenderBidders.length
  const approvedCount  = tenderBidders.filter(b => reviews[b.id]?.decision === 'approved').length
  const flaggedCount   = tenderBidders.filter(b => reviews[b.id]?.decision === 'flagged').length
  const rejectedCount  = tenderBidders.filter(b => reviews[b.id]?.decision === 'rejected').length

  const setReview = (bidderId, field, value) =>
    setReviews(prev => ({ ...prev, [bidderId]: { ...(prev[bidderId] || {}), [field]: value } }))

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
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
              <Badge variant="legal_review">Legal Review</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · {tender.budget}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shrink-0">
            <Bot size={12} /> AI pre-analysis complete — {LEGAL_ITEMS.length} criteria per bidder
          </div>
        </div>
      </Card>

      {/* ── Progress stat row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Bidders',  value: tenderBidders.length, cls: 'text-slate-700' },
          { label: 'Approved',       value: approvedCount,         cls: 'text-emerald-700' },
          { label: 'Flagged',        value: flaggedCount,          cls: 'text-amber-700' },
          { label: 'Rejected',       value: rejectedCount,         cls: 'text-red-700' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-center">
            <div className={`text-2xl font-bold ${s.cls}`}>{s.value}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Bidder accordion ── */}
      <div className="space-y-3">
        {tenderBidders.map((bidder, idx) => {
          const isOpen    = expandedBidder === bidder.id
          const review    = reviews[bidder.id] || {}
          const items     = LEGAL_SEED[bidder.id] || LEGAL_SEED[1]
          const nonCount  = LEGAL_ITEMS.filter(i => items[i.id] === 'non_compliant').length
          const partCount = LEGAL_ITEMS.filter(i => items[i.id] === 'partial_compliant').length
          const okCount   = LEGAL_ITEMS.filter(i => items[i.id] === 'compliant').length
          const decided   = !!review.decision
          const dcfg      = decided ? decisionCfg[review.decision] : null

          return (
            <Card key={bidder.id} className={`overflow-hidden transition-shadow ${isOpen ? 'shadow-md ring-2 ring-[var(--color-primary)]/15' : ''}`}>

              {/* Row header */}
              <button
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
                onClick={() => setExpandedBidder(isOpen ? null : bidder.id)}>

                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center shrink-0">
                  {bidder.name?.[0] || bidder.company?.[0]}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-800 text-sm">{bidder.name || bidder.company}</span>
                    <span className="text-xs text-slate-400">{bidder.country || bidder.phone}</span>
                    {decided && (
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${dcfg.cls}`}>
                        {dcfg.label}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-0.5">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Hash size={10} /> LR-{tender.id}-{String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] text-emerald-600">{okCount} compliant</span>
                    {partCount > 0 && <span className="text-[11px] text-amber-600">{partCount} partial</span>}
                    {nonCount  > 0 && <span className="text-[11px] text-red-600">{nonCount} non-compliant</span>}
                  </div>
                </div>

                {/* Mini status bar */}
                <div className="hidden md:flex items-center gap-1 shrink-0">
                  {LEGAL_ITEMS.map(item => {
                    const st = items[item.id]
                    return (
                      <div key={item.id}
                        title={item.item}
                        className={`w-2.5 h-6 rounded-sm ${
                          st === 'compliant'         ? 'bg-emerald-400' :
                          st === 'partial_compliant' ? 'bg-amber-400'   : 'bg-red-400'
                        }`} />
                    )
                  })}
                </div>

                {isOpen ? <ChevronUp size={16} className="text-slate-400 shrink-0" /> : <ChevronDown size={16} className="text-slate-400 shrink-0" />}
              </button>

              {/* Expanded content */}
              {isOpen && (
                <div className="border-t border-slate-100">

                  {/* Legal items table */}
                  <div className="divide-y divide-slate-50">
                    {LEGAL_ITEMS.map(item => {
                      const st     = items[item.id] || 'compliant'
                      const scfg   = statusCfg[st]
                      const detail = LEGAL_DETAIL[item.id]?.[bidder.id] || '—'
                      const isItemOpen = expandedItem === `${bidder.id}-${item.id}`

                      return (
                        <div key={item.id}
                          className="px-5 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors"
                          onClick={() => setExpandedItem(isItemOpen ? null : `${bidder.id}-${item.id}`)}>
                          <div className="flex items-center gap-3">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${levelColor[item.level]}`}>
                              {item.level}
                            </span>
                            <span className="text-[11px] text-slate-400 w-24 shrink-0">{item.category}</span>
                            <span className="text-xs font-medium text-slate-700 flex-1">{item.item}</span>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0 ${scfg.cls}`}>
                              {scfg.label}
                            </span>
                          </div>
                          {isItemOpen && (
                            <div className="mt-2 ml-28 text-[11px] text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 leading-relaxed">
                              {detail}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>

                  {/* Review decision */}
                  <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/40">
                    <div className="flex items-start gap-6 flex-wrap">
                      <div className="flex-1 min-w-52">
                        <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1.5">
                          <Gavel size={12} className="text-[var(--color-primary)]" /> Legal Review Decision
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {[
                            { val: 'approved', label: 'Approve',   cls: 'border-emerald-300 text-emerald-700 bg-emerald-50  hover:bg-emerald-100' },
                            { val: 'flagged',  label: 'Flag',      cls: 'border-amber-300   text-amber-700   bg-amber-50    hover:bg-amber-100' },
                            { val: 'rejected', label: 'Reject',    cls: 'border-red-300     text-red-700     bg-red-50      hover:bg-red-100' },
                          ].map(opt => (
                            <button key={opt.val}
                              onClick={e => { e.stopPropagation(); setReview(bidder.id, 'decision', opt.val) }}
                              className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition-all
                                ${review.decision === opt.val
                                  ? opt.cls + ' ring-2 ring-offset-1 ring-current'
                                  : 'border-slate-200 text-slate-500 bg-white hover:border-slate-300'}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex-1 min-w-52">
                        <p className="text-xs font-semibold text-slate-600 mb-2">Reviewer Notes</p>
                        <textarea
                          rows={2}
                          value={review.note || ''}
                          onChange={e => { e.stopPropagation(); setReview(bidder.id, 'note', e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          placeholder="Add legal review notes, conditions or flags for this bidder…"
                          className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-slate-700 placeholder-slate-400 bg-white"
                        />
                      </div>
                    </div>
                    {decided && (
                      <div className={`mt-3 flex items-center gap-2 text-xs px-3 py-2 rounded-lg border ${dcfg.cls}`}>
                        <CheckCircle size={12} />
                        Decision recorded: <strong className="ml-1">{dcfg.label}</strong>
                        {review.note && <span className="ml-1 opacity-70">· "{review.note}"</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* ── Final submission ── */}
      <Card className={`p-4 transition-opacity ${!allReviewed ? 'opacity-60' : ''}`}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
              <Scale size={14} className="text-[var(--color-primary)]" />
              Submit Legal Review
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {allReviewed
                ? `All ${tenderBidders.length} bidders reviewed — ${approvedCount} approved, ${flaggedCount} flagged, ${rejectedCount} rejected.`
                : `${reviewedCount} of ${tenderBidders.length} bidders reviewed. Complete all before submitting.`}
            </p>
          </div>
          {!finalSubmitted ? (
            <Button disabled={!allReviewed} onClick={() => { advanceTender(tender.id); setFinalSubmitted(true) }}>
              <Send size={13} /> Submit Legal Review
            </Button>
          ) : (
            <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle size={13} /> Legal review submitted — tender advanced.
            </div>
          )}
        </div>
        {!allReviewed && !finalSubmitted && (
          <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            <AlertTriangle size={12} />
            {tenderBidders.length - reviewedCount} bidder{tenderBidders.length - reviewedCount !== 1 ? 's' : ''} still need a review decision before submitting.
          </div>
        )}
      </Card>

    </div>
  )
}
