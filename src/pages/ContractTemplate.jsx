import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useBackHandler } from '../context/NavigationContext'
import { openHtmlDoc, rejectionLetterDoc } from '../utils/docGen'

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Svg = ({ size=16, sw=1.6, style, className='', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const Bot           = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>
const Star          = p => <Svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>
const CheckCircle   = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const Eye           = p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>
const Send          = p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
const ChevronRight  = p => <Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>
const Globe         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>
const BarChart3     = p => <Svg {...p}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></Svg>
const Award         = p => <Svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></Svg>
const ShieldOff     = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const FileText      = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>

// ── Stage breadcrumb ──────────────────────────────────────────────────────────
const flowStages = [
  { label: 'Ingestion',      done: true  },
  { label: 'AI Extraction',  done: true  },
  { label: 'Tech Eval',      done: true  },
  { label: 'Comm Eval',      done: true  },
  { label: 'Mgmt Review',    done: true  },
  { label: 'Contract Draft', done: false, active: true },
]

// ── Combined score helper ─────────────────────────────────────────────────────
// Simple average of the technical and commercial results, out of 100.
const combined = b => Math.round(((b.techScore ?? 75) + (b.commScore ?? 70)) / 2)

// The ITT sections a contract can be drafted against — mirrors the ITT creation
// section flow, offered here as a reference dropdown.
const ITT_SECTIONS = [
  'Section 1 — Instructions to Tenderers',
  'Section A — Form of Agreement',
  'Section D — Statement of Work',
  'Section B1 — General Conditions of Contract',
  'Section B2 — Special Conditions of Contract',
  'Section C — QHSSE Requirements',
  'Section E — Schedule of Prices',
  'Section F — Execution Methodology',
  'Section H — ICV Requirements',
  'Section J — JSRS Requirements',
  'Section K — OPAL Requirements',
  'Section L — Minimum Salaries',
  'Section G — Administration Instructions',
]

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContractTemplate() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { tenders, updateTender }  = useTenders()
  const tender       = tenders.find(t => t.id === tenderId)

  const [sent,        setSent]        = useState(false)
  const [sentLetters, setSentLetters] = useState(false)
  const [ittSection,  setIttSection]  = useState('')
  const [reviewOpen,  setReviewOpen]  = useState(false)
  const [ittApproved, setIttApproved] = useState(false)

  // The Contract Engineer is the only role on this page (role-gated below), so
  // the ITT template review & approval is theirs by definition.
  const approver     = user?.name || 'Contract Engineer'
  const approverRole = user?.role?.label || 'Contract Engineer'
  const approvedDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

  useBackHandler(() => {
    if (reviewOpen) { setReviewOpen(false); return true }
    return false
  })

  // ── Role gate ──
  if (user?.role?.id !== 'pof') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Engineers can access this page.</p>
    </div>
  )

  // ── No tender selected ──
  if (!tenderId) return (
    <TenderSelectList
      tenders={tenders}
      status="award"
      basePath="/contract"
      title="Contract Drafting"
      description="Select an awarded tender to begin contract drafting"
      emptyText="No tenders at the award stage"
    />
  )

  if (!tender || tender.status !== 'award') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found or not yet awarded.</p>
      <p className="text-xs">Complete Management Review before drafting a contract.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
        Back to Dashboard
      </Button>
    </div>
  )

  // ── Derive bidder list ──
  const tenderBidders = Array.isArray(tender.bidderList)
    ? tender.bidderList
    : seedBidders.slice(0, tender.bidders || 4)

  // Winner: prefer the one management approved, else fallback to highest combined score
  const awardedBidder = tender.mgmtWinnerId
    ? tenderBidders.find(b => b.id === tender.mgmtWinnerId) ?? [...tenderBidders].sort((a, b) => combined(b) - combined(a))[0]
    : [...tenderBidders].sort((a, b) => combined(b) - combined(a))[0]

  // All bidders ranked (for the overview)
  const ranked = [...tenderBidders].sort((a, b) => combined(b) - combined(a))

  // Commercial hands over a recommendation (a bidder), not a score. Use the
  // recorded recommendation; fall back to the strongest commercial bidder for
  // seeded tenders that predate it.
  const commRec = tender.commercialRecommendation
  const commRecId = commRec?.bidderId
    ?? [...tenderBidders].sort((a, b) => (b.commScore ?? 0) - (a.commScore ?? 0))[0]?.id ?? null

  // Unsuccessful bidders — everyone except the awarded party — get a regret letter.
  const failedBidders = ranked.filter(b => awardedBidder && b.id !== awardedBidder.id)
  const letterDate = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const openRejectionLetter = (b) => {
    const d = rejectionLetterDoc({
      tenderId: tender.id, tenderTitle: tender.title, bidderName: b.name,
      department: tender.department, awardedTo: awardedBidder?.name, dateStr: letterDate,
    })
    openHtmlDoc(d.title, d.content)
  }

  return (
    <div className="space-y-5">

      {/* ── Tender header ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="award">Contract Drafting</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · {tender.budget}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 shrink-0">
            <Bot size={13} /> AI contract drafting from the ITT
          </div>
        </div>
      </Card>

      {/* ── Stage breadcrumb ── */}
      <div className="flex items-center gap-0 overflow-x-auto pb-1">
        {flowStages.map((stage, i) => (
          <div key={stage.label} className="flex items-center shrink-0">
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-medium border transition-all
              ${stage.active
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : stage.done
                ? 'bg-green-50 text-green-700 border-green-200'
                : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
              {stage.done && !stage.active && <CheckCircle size={10} />}
              {stage.label}
            </div>
            {i < flowStages.length - 1 && <ChevronRight size={13} className="mx-1 text-slate-300 shrink-0" />}
          </div>
        ))}
      </div>

      {/* ── Evaluator scores summary (read-only, informational) ── */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
          <BarChart3 size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">Evaluation Summary</h3>
          <Badge variant="success"><CheckCircle size={10} /> Management Approved</Badge>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 font-semibold text-slate-600">Bidder</th>
                <th className="text-center px-3 py-3 font-semibold text-blue-500">Technical<br/><span className="font-normal text-slate-400">/100</span></th>
                <th className="text-center px-3 py-3 font-semibold text-violet-500">Commercial<br/><span className="font-normal text-slate-400">recommendation</span></th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranked.map((b) => {
                const isAwarded  = b.id === awardedBidder?.id
                const isCommRec  = b.id === commRecId
                return (
                  <tr key={b.id} className={isAwarded ? 'bg-[var(--color-primary)]/5' : 'hover:bg-slate-50/40'}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center shrink-0
                          ${isAwarded ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {b.name?.[0]}
                        </div>
                        <div>
                          <p className={`font-semibold ${isAwarded ? 'text-[var(--color-primary)]' : 'text-slate-700'}`}>{b.name}</p>
                          {isAwarded && <p className="text-[10px] text-[var(--color-primary)]/70">★ Awarded</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center font-semibold text-blue-600">{b.techScore ?? 75}</td>
                    <td className="px-3 py-3 text-center">
                      {isCommRec
                        ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 bg-violet-50 border border-violet-200 px-2 py-0.5 rounded-full">Recommended</span>
                        : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-3 text-center">
                      {isAwarded
                        ? <Badge variant="award"><Star size={9} fill="currentColor" stroke="none" /> Awarded</Badge>
                        : <Badge variant="non_compliant">Not Selected</Badge>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {tender.mgmtRemarks && (
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <p className="text-[11px] text-slate-500">
              <span className="font-semibold text-slate-600">Management Remarks: </span>{tender.mgmtRemarks}
            </p>
          </div>
        )}
      </Card>

      {/* ── Winner profile ── */}
      {awardedBidder && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award size={16} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-slate-800 text-sm">Award Winner — Contract Party</h3>
            <Badge variant="award"><Star size={10} /> Awarded</Badge>
          </div>
          <div className="flex items-start gap-4 mb-5">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-primary)]/10 flex items-center justify-center shrink-0">
              <span className="text-xl font-bold text-[var(--color-primary)]">{awardedBidder.name?.[0]}</span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800">{awardedBidder.name}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                {awardedBidder.country && (
                  <span className="flex items-center gap-1"><Globe size={11} /> {awardedBidder.country}</span>
                )}
                {awardedBidder.totalBid && (
                  <span>Contract value: <strong className="text-slate-700">{awardedBidder.totalBid}</strong></span>
                )}
              </div>
            </div>
          </div>
          {/* ── ITT section reference ── */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <label className="text-xs font-semibold text-slate-600 mb-1.5 flex items-center gap-1.5">
              <FileText size={13} className="text-[var(--color-primary)]" /> ITT Section
            </label>
            <select
              value={ittSection}
              onChange={e => setIttSection(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            >
              <option value="">Select an ITT section to draft against…</option>
              {ITT_SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p className="text-[11px] text-slate-500 mt-2">
              {ittSection
                ? <>The contract will be drafted with reference to <strong className="text-slate-700">{ittSection}</strong> from the ITT.</>
                : 'Choose the ITT section this contract should be drafted against.'}
            </p>
          </div>
        </Card>
      )}

      {/* ── ITT template review & approval (Contract Engineer only) ── */}
      {awardedBidder && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <FileText size={16} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-slate-800 text-sm">ITT Template — Review &amp; Approve</h3>
            {ittApproved
              ? <Badge variant="success"><CheckCircle size={10} /> Approved</Badge>
              : <Badge variant="non_compliant">Pending review</Badge>}
          </div>
          <p className="text-xs text-slate-500 mb-4">
            The <strong>Contract Engineer</strong> reviews the ITT template{ittSection ? <> ({ittSection})</> : ''} and approves it before the contract is drafted.
          </p>

          {ittApproved ? (
            <div className="flex items-center justify-between gap-3 flex-wrap rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-emerald-800">ITT template reviewed &amp; approved</p>
                  <p className="text-[11px] text-emerald-700">By {approver} · {approverRole} · {approvedDate}</p>
                </div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setIttApproved(false)}>
                Re-open review
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="secondary" size="sm" onClick={() => setReviewOpen(true)}>
                <Eye size={13} /> Review Template
              </Button>
              <Button size="sm" onClick={() => setIttApproved(true)}>
                <CheckCircle size={13} /> Approve ITT Template
              </Button>
              <span className="text-[11px] text-slate-400">Approval unlocks contract drafting.</span>
            </div>
          )}
        </Card>
      )}

      {/* ── AI Drafting ── */}
      {awardedBidder && (
        <Card className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2.5 rounded-xl bg-blue-50 shrink-0">
              <Bot size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-800 text-sm mb-1">
                Draft Contract for {awardedBidder.name}
              </h3>
              <p className="text-xs text-slate-500 mb-3">
                The contract will be drafted from {ittSection ? <strong>{ittSection}</strong> : 'the ITT'} and
                populated with the tender scope, {awardedBidder.name}'s agreed terms
                {awardedBidder.totalBid ? ` (${awardedBidder.totalBid})` : ''}, and all legal clauses.
              </p>
              {!sent ? (
                <>
                  <Button disabled={!ittApproved} onClick={() => setSent(true)}>
                    <Send size={14} /> Draft Contract with AI <ChevronRight size={14} />
                  </Button>
                  {!ittApproved && (
                    <p className="text-[11px] text-amber-600 mt-2 flex items-center gap-1">
                      <CheckCircle size={11} /> Review &amp; approve the ITT template above to enable drafting.
                    </p>
                  )}
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                    <CheckCircle size={15} />
                    Contract drafted for {awardedBidder.name}.
                  </div>
                  <p className="text-xs text-slate-500">
                    Draft the contract for the winner and prepare the regret letters below, then submit the draft to the Supply Chain Manager. Nothing is issued until the SCM approves — on approval the winner’s contract and every regret letter are released together.
                  </p>
                  <Button onClick={() => { updateTender(tender.id, { status: 'scm_gate3', stage: 'SCM Review — Contract Draft', contractDraftReady: true }); navigate('/tenders') }}>
                    <CheckCircle size={14} /> Submit Draft for SCM Approval <ChevronRight size={14} />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Unsuccessful bidder notifications (after the contract is drafted) ── */}
      {sent && awardedBidder && failedBidders.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <FileText size={16} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-slate-800 text-sm">Notify Unsuccessful Bidders</h3>
            <Badge variant="non_compliant">{failedBidders.length} not selected</Badge>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Generate a regret letter for each bidder who was not awarded, then send the notifications so the outcome is communicated.
          </p>
          <div className="space-y-2">
            {failedBidders.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-2.5 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-500 font-bold text-sm flex items-center justify-center shrink-0">{b.name?.[0]}</div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{b.name}</p>
                    <p className="text-[11px] text-slate-400">Technical {b.techScore ?? 75}/100 · Not selected</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sentLetters && (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle size={12} /> Sent
                    </span>
                  )}
                  <Button variant="secondary" size="sm" onClick={() => openRejectionLetter(b)}>
                    <Eye size={12} /> View Letter
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-[11px] text-slate-400">
              {sentLetters
                ? 'Regret letters have been sent to all unsuccessful bidders.'
                : 'Each letter carries the tender outcome and a courteous regret message.'}
            </p>
            <Button disabled={sentLetters} onClick={() => setSentLetters(true)}>
              <Send size={13} /> {sentLetters ? 'Notifications Sent' : `Send Regret Letters (${failedBidders.length})`}
            </Button>
          </div>
        </Card>
      )}

      {/* ── ITT Template Review Modal ── */}
      {reviewOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setReviewOpen(false)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">ITT Template Review</h3>
                <p className="text-xs text-slate-400">{ittSection || 'Full ITT'} · {tender.id}</p>
              </div>
              <button onClick={() => setReviewOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {['1. Instructions to Tenderers','2. Form of Agreement','3. Statement of Work','4. Conditions of Contract','5. QHSSE Requirements','6. Schedule of Prices','7. Execution Methodology','8. Administration Instructions'].map(section => (
                <div key={section}>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1">{section}</h4>
                  <div className="h-2 bg-slate-100 rounded mb-1 w-4/5" />
                  <div className="h-2 bg-slate-100 rounded mb-1 w-3/5" />
                  <div className="h-2 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
              <p className="text-xs text-slate-400 italic text-center">
                Read-only preview of the ITT template for the Contract Engineer's review.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 p-4 border-t border-slate-100">
              <Button variant="secondary" size="sm" onClick={() => setReviewOpen(false)}>Close</Button>
              <Button size="sm" onClick={() => { setIttApproved(true); setReviewOpen(false) }}>
                <CheckCircle size={13} /> Approve ITT Template
              </Button>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
