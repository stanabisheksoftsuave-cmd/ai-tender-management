import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders, contractTemplates } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const Svg = ({ size=16, sw=1.6, style, className='', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const FileSignature = p => <Svg {...p}><path d="M20 19.5v.5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8.5L18 5.5"/><path d="M18 14v4h4"/><path d="m21.5 12.5-5 5"/></Svg>
const Bot           = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>
const Star          = p => <Svg {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></Svg>
const CheckCircle   = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const Eye           = p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>
const Send          = p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
const ChevronRight  = p => <Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>
const Tag           = p => <Svg {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></Svg>
const Globe         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>
const BarChart3     = p => <Svg {...p}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></Svg>
const Award         = p => <Svg {...p}><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></Svg>
const ShieldOff     = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const FileText      = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>
const Scale         = p => <Svg {...p}><line x1="12" y1="3" x2="12" y2="21"/><path d="M3 6l9 6 9-6"/><path d="M3 18h18"/></Svg>

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
const combined = b => Math.round((b.techScore ?? 75) * 0.6 + (b.commScore ?? 70) * 0.4)

// ── Component ─────────────────────────────────────────────────────────────────
export default function ContractTemplate() {
  const { tenderId } = useParams()
  const navigate     = useNavigate()
  const { user }     = useAuth()
  const { tenders }  = useTenders()
  const tender       = tenders.find(t => t.id === tenderId)

  const [selected, setSelected] = useState(null)
  const [preview,  setPreview]  = useState(null)
  const [sent,     setSent]     = useState(false)

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

  // All bidders ranked (for the scores overview)
  const ranked = [...tenderBidders].sort((a, b) => combined(b) - combined(a))

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
            <Bot size={13} /> {contractTemplates.length} AI contract templates available
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
                <th className="text-center px-3 py-3 font-semibold text-blue-500">Technical<br/><span className="font-normal text-slate-400">60%</span></th>
                <th className="text-center px-3 py-3 font-semibold text-violet-500">Commercial<br/><span className="font-normal text-slate-400">40%</span></th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600">Combined</th>
                <th className="text-center px-3 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranked.map((b, i) => {
                const comb       = combined(b)
                const isAwarded  = b.id === awardedBidder?.id
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
                    <td className="px-3 py-3 text-center font-semibold text-violet-600">{b.commScore ?? 70}</td>
                    <td className="px-3 py-3 text-center">
                      <span className={`font-bold ${comb >= 80 ? 'text-emerald-600' : comb >= 65 ? 'text-amber-600' : 'text-red-500'}`}>{comb}</span>
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
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Combined Score',   value: `${combined(awardedBidder)}/100`, icon: Award,    cls: 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' },
              { label: 'Technical Score',  value: `${awardedBidder.techScore ?? 75}/100`, icon: Scale,    cls: 'text-blue-600 bg-blue-50' },
              { label: 'Commercial Score', value: `${awardedBidder.commScore ?? 70}/100`, icon: BarChart3, cls: 'text-violet-600 bg-violet-50' },
            ].map(s => (
              <div key={s.label} className={`rounded-xl p-3 ${s.cls.split(' ')[1]}`}>
                <s.icon size={14} className={`${s.cls.split(' ')[0]} mb-1.5`} />
                <p className={`text-lg font-bold ${s.cls.split(' ')[0]}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Template selection ── */}
      {awardedBidder && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <FileSignature size={16} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-slate-800 text-sm">
              Select Contract Template for {awardedBidder.name}
            </h3>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {contractTemplates.map(t => (
              <Card
                key={t.id}
                className={`overflow-hidden cursor-pointer transition-all hover:shadow-md ${selected === t.id ? 'ring-2 ring-[var(--color-primary)]' : ''}`}
                onClick={() => setSelected(t.id)}>
                {t.recommended && (
                  <div className="flex items-center gap-1.5 px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-medium">
                    <Star size={11} /> AI Recommended
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="p-2.5 rounded-xl bg-[var(--color-primary)]/10">
                      <FileSignature size={18} className="text-[var(--color-primary)]" />
                    </div>
                    {selected === t.id && (
                      <div className="w-5 h-5 rounded-full bg-[var(--color-primary)] flex items-center justify-center">
                        <CheckCircle size={12} className="text-white" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-semibold text-slate-800 text-sm mb-1">{t.name}</h3>
                  <p className="text-xs text-slate-400 mb-3">{t.pages} pages · {t.type}</p>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{t.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {t.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                        <Tag size={8} /> {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="px-4 pb-4 flex gap-2">
                  <Button variant="secondary" size="sm" className="flex-1 justify-center"
                    onClick={e => { e.stopPropagation(); setPreview(t) }}>
                    <Eye size={12} /> Preview
                  </Button>
                  <Button variant={selected === t.id ? 'primary' : 'ghost'} size="sm" className="flex-1 justify-center"
                    onClick={e => { e.stopPropagation(); setSelected(t.id) }}>
                    {selected === t.id ? 'Selected' : 'Select'}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── AI Drafting ── */}
      {selected && awardedBidder && (
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
                Template <strong>{contractTemplates.find(t => t.id === selected)?.name}</strong> will be
                populated with tender scope, {awardedBidder.name}'s agreed terms
                {awardedBidder.totalBid ? ` (${awardedBidder.totalBid})` : ''}, and all legal clauses.
              </p>
              {!sent ? (
                <Button onClick={() => setSent(true)}>
                  <Send size={14} /> Draft Contract with AI <ChevronRight size={14} />
                </Button>
              ) : (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                  <CheckCircle size={15} />
                  Contract drafting in progress for {awardedBidder.name} — estimated 3 minutes.
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* ── Preview Modal ── */}
      {preview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setPreview(null)}>
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div>
                <h3 className="font-semibold text-slate-800">{preview.name}</h3>
                <p className="text-xs text-slate-400">{preview.pages} pages · {preview.type}</p>
              </div>
              <button onClick={() => setPreview(null)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
            </div>
            <div className="p-5 space-y-4">
              {['1. Parties & Recitals','2. Scope of Work','3. Contract Price & Payment','4. Delivery & Milestones','5. Warranties & SLA','6. Liability & Indemnity','7. Dispute Resolution','8. Governing Law'].map(section => (
                <div key={section}>
                  <h4 className="text-xs font-semibold text-slate-700 mb-1">{section}</h4>
                  <div className="h-2 bg-slate-100 rounded mb-1 w-4/5" />
                  <div className="h-2 bg-slate-100 rounded mb-1 w-3/5" />
                  <div className="h-2 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
              <p className="text-xs text-slate-400 italic text-center">
                AI will populate all sections with {awardedBidder?.name}'s tender data
              </p>
            </div>
          </Card>
        </div>
      )}

    </div>
  )
}
