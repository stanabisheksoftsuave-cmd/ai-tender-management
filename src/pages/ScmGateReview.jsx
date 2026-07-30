import { useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import SectionTemplateModal from '../components/contract/SectionTemplateModal'
import { contractSections } from '../components/itt/sectionFlow'
import { bidders as seedBidders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useNavigation } from '../context/NavigationContext'
import { returnRecipient } from '../utils/evalAssignment'
import { awardOutcome, openRegretLetter } from '../utils/contractDocs'

// ── Inline SVG icons (matching the rest of the app) ──────────────────────────
const Svg = ({ size = 16, sw = 1.6, style, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const ArrowLeft     = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Svg>
const ShieldOff     = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" /><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" /><line x1="1" y1="1" x2="23" y2="23" /></Svg>
const FileText      = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></Svg>
const CheckCircle   = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Svg>
const AlertTriangle = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></Svg>
const RotateCcw     = p => <Svg {...p}><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.1" /></Svg>
const BarChart3     = p => <Svg {...p}><path d="M18 20V10" /><path d="M12 20V4" /><path d="M6 20v-6" /></Svg>
const ChevronRight  = p => <Svg {...p}><polyline points="9 18 15 12 9 6" /></Svg>
const Eye           = p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></Svg>

const scoreBar = (val, max = 100) => (
  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
    <div className={`h-1.5 rounded-full transition-all duration-500 ${val >= 80 ? 'bg-emerald-400' : val >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
      style={{ width: `${(val / max) * 100}%` }} />
  </div>
)

// Each gate describes what Supply Chain is clearing and where the
// tender goes next. Gate 2 (the award decision) has its own richer screen in
// AwardRecommendation — this component covers gates 1 and 3.
const SCM_GATES = {
  scm_gate1: { short: 'Technical Review', path: '/scm-tech-review' },
  scm_gate2: { short: 'Award Review',     path: '/scm-review' },
  scm_gate3: { short: 'Contract Review',  path: '/scm-contract-review' },
}

// Which step a return re-opens, so the panel can name the person it reaches.
const GATE_RETURN_SIDE = { scm_gate1: 'tech', scm_gate3: 'draft' }

const GATE_COPY = {
  scm_gate1: {
    title: 'SCM Review — Technical Evaluation',
    description: 'Review the technical evaluation outcome, then approve to release commercial evaluation or return it to the evaluator',
    empty: 'No tenders awaiting technical review',
    approveLabel: 'Approve — Release Commercial Evaluation',
    approvedText: 'Commercial Evaluation is now open to the Contract Engineer.',
    returnHint: 'Returning sends this tender back to Technical Evaluation with your comment.',
    returnStep: 'Technical Evaluation',
  },
  scm_gate3: {
    title: 'SCM Review — Contract Draft',
    description: 'Review the drafted contract, then approve to issue the winner’s contract and the regret letters, or return it for redraft',
    empty: 'No contract drafts awaiting review',
    approveLabel: 'Approve — Issue Contract & Regret Letters',
    approvedText: 'The winner’s contract has been issued and regret letters generated for the unsuccessful bidders. The Contract Engineer can export both from Contract Management.',
    returnHint: 'Returning sends this tender back to Contract Drafting with your comment.',
    returnStep: 'Contract Drafting',
  },
}

export default function ScmGateReview({ gate }) {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { goBack }   = useNavigation()
  const { user }     = useAuth()
  const { tenders, approveGate, returnGate } = useTenders()

  const [comment,  setComment]  = useState('')
  const [outcome,  setOutcome]  = useState(null) // 'approved' | 'returned'
  // The contract draft is read back as its ITT section documents, one at a
  // time — same read-only viewer Contract Management shows the issued record in.
  const [docOpen,   setDocOpen]   = useState(false)
  const [sectionId, setSectionId] = useState('sectionA')

  const copy = GATE_COPY[gate]
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const sections = useMemo(() => contractSections(tender?.b1Category), [tender?.b1Category])
  const section  = sections.find(s => s.id === sectionId) || sections[0]

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
      status={gate}
      basePath={SCM_GATES[gate].path}
      title={copy.title}
      description={copy.description}
      emptyText={copy.empty}
    />
  )

  // Keep rendering after a decision so the manager can see (and revise) it.
  if (!tender || (tender.status !== gate && !outcome)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
      <FileText size={32} className="text-slate-300" />
      <p className="text-sm font-medium">Tender not found or not awaiting this review.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
        <ArrowLeft size={13} /> Back to Dashboard
      </Button>
    </div>
  )

  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  const ranked = [...tenderBidders].sort((a, b) => (b.techScore ?? 0) - (a.techScore ?? 0))
  // Winner + regret list — the same derivation Contract Drafting and Contract
  // Management use, so gate 3 previews exactly the bidders whose documents it
  // is about to release.
  const { awarded: awardedBidder, unsuccessful: failedBidders } = awardOutcome(tender)
  const openRejectionLetter = (b) => openRegretLetter(tender, b, awardedBidder?.name)

  const handleApprove = () => { approveGate(tender.id, gate, comment.trim()); setOutcome('approved') }
  const handleReturn  = () => { returnGate(tender.id, gate, comment.trim());  setOutcome('returned') }

  // Name the destination before the manager commits — a return used to land
  // silently, with nothing on screen confirming who picks the tender up.
  const recipient = returnRecipient(tender, GATE_RETURN_SIDE[gate])

  return (
    <div className="space-y-5">

      {/* ── Header ── */}
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
              <Badge variant="scm_gate">{SCM_GATES[gate].short}</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · {tender.budget}</p>
          </div>
        </div>
      </Card>

      {/* ── Gate 1: technical evaluation outcome, read-only ── */}
      {gate === 'scm_gate1' && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <BarChart3 size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Technical Evaluation Result</h3>
            <span className="text-[10px] text-slate-400 ml-1">Read-only</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Bidder</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500">Compliance</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-blue-500">Technical Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {ranked.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl font-bold text-sm flex items-center justify-center shrink-0 bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                          {b.name?.[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{b.name}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{b.country} · {b.totalBid}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center"><Badge variant="compliant">Compliant</Badge></td>
                    <td className="px-3 py-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`text-lg font-bold ${(b.techScore ?? 75) >= 80 ? 'text-emerald-600' : (b.techScore ?? 75) >= 65 ? 'text-amber-600' : 'text-red-500'}`}>
                          {b.techScore ?? 75}
                        </span>
                        <span className="text-[9px] text-slate-400">/100</span>
                        {scoreBar(b.techScore ?? 75)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Gate 3: the contract draft and regret letters SCM is approving ── */}
      {gate === 'scm_gate3' && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <FileText size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Contract Draft — Award Outcome</h3>
          </div>
          {awardedBidder ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Winner — contract to be issued</p>
                    <p className="text-sm font-semibold text-emerald-900 mt-1">{awardedBidder.name}</p>
                    <p className="text-xs text-emerald-700 mt-0.5">{awardedBidder.country} · {awardedBidder.totalBid}</p>
                  </div>
                  <Button size="sm" variant="secondary" className="shrink-0" onClick={() => setDocOpen(true)}>
                    <Eye size={12} /> View Contract Draft
                  </Button>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Unsuccessful — {failedBidders.length} regret letter{failedBidders.length !== 1 ? 's' : ''} to be generated
                </p>
                {failedBidders.length === 0 ? (
                  <p className="text-xs text-slate-500">—</p>
                ) : (
                  <div className="space-y-2">
                    {failedBidders.map(b => (
                      <div key={b.id} className="flex items-center justify-between gap-3 rounded-lg bg-white border border-slate-200 px-3 py-2 flex-wrap">
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-slate-700 truncate">{b.name}</p>
                          <p className="text-[10px] text-slate-400">{b.country}</p>
                        </div>
                        <Button size="sm" variant="secondary" className="shrink-0" onClick={() => openRejectionLetter(b)}>
                          <Eye size={12} /> View Letter
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {tender.mgmtRemarks && (
                <p className="text-xs text-slate-500 italic">Award remarks: “{tender.mgmtRemarks}”</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No award decision recorded on this tender.</p>
          )}
        </Card>
      )}

      {/* ── Decision panel ── */}
      {!outcome ? (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Supply Chain Decision</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">{copy.returnHint}</p>

          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={3}
            placeholder="Add your review comment — required when returning…"
            className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none mb-3 text-slate-700 placeholder-slate-400"
          />

          {!comment.trim() && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
              <AlertTriangle size={12} />
              A comment is required to return this tender. Approving without one is allowed.
            </div>
          )}

          {/* Where a return lands, resolved from the tender's own assignment */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 mb-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Returning sends this tender to</p>
            <p className="text-xs text-slate-800 font-semibold mt-1">
              {recipient.name}
              <span className="text-slate-400 font-normal ml-1.5">· {recipient.roleLabel} · {copy.returnStep}</span>
            </p>
            {recipient.unassigned && (
              <p className="text-[11px] text-amber-700 mt-1">
                No named owner recorded on this tender — it lands in the {recipient.roleLabel} queue for any {recipient.roleLabel} to pick up.
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="secondary" className="flex-1 justify-center" disabled={!comment.trim()} onClick={handleReturn}>
              <RotateCcw size={13} /> Return for Rework
            </Button>
            <Button className="flex-1 justify-center" onClick={handleApprove}>
              <CheckCircle size={14} /> {copy.approveLabel}
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
            <div>
              <p className={`text-sm font-semibold ${outcome === 'approved' ? 'text-emerald-800' : 'text-amber-800'}`}>
                {outcome === 'approved' ? 'Approved' : 'Returned for Rework'}
              </p>
              <p className={`text-xs mt-0.5 ${outcome === 'approved' ? 'text-emerald-700' : 'text-amber-700'}`}>
                {outcome === 'approved'
                  ? copy.approvedText
                  : <>Sent back to <strong>{copy.returnStep}</strong> with <strong>{recipient.name}</strong> ({recipient.roleLabel}).</>}
              </p>
              {comment.trim() && (
                <p className={`text-xs mt-2 italic ${outcome === 'approved' ? 'text-emerald-600' : 'text-amber-600'}`}>“{comment.trim()}”</p>
              )}
            </div>
          </div>
          <Button className="w-full justify-center" onClick={() => navigate('/tenders')}>
            Back to Tenders <ChevronRight size={14} />
          </Button>
        </Card>
      )}

      {/* The drafted contract, read through the same section templates it was
          drafted against — read-only, this is a review copy, not a working draft. */}
      {docOpen && (
        <SectionTemplateModal
          tender={tender}
          section={section}
          sections={sections}
          onSectionChange={setSectionId}
          title="Contract Draft Review"
          readOnly
          readOnlyNote="Awaiting Supply Chain approval — read-only"
          onClose={() => setDocOpen(false)}
        />
      )}
    </div>
  )
}
