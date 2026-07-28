import { useState, useEffect, Fragment } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
const Svg = ({ size=16, sw=1.6, style, className='', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const BarChart3     = p => <Svg {...p}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></Svg>
const CheckCircle   = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const XCircle       = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Svg>
const TrendingDown  = p => <Svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Svg>
const TrendingUp    = p => <Svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>
const Send          = p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
const AlertTriangle = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const ArrowLeft     = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>
const ArrowRight    = p => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>
const ShieldOff     = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const Bot           = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>
const UploadCloud   = p => <Svg {...p}><path d="M16 16l-4-4-4 4"/><path d="M12 12v9"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></Svg>
const Award         = p => <Svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Svg>
const Sparkles      = p => <Svg {...p}><path d="M12 3l1.9 5.8L20 10l-5.5 2.2L12 18l-2.5-5.8L4 10l6.1-1.2L12 3z"/></Svg>
const FileText      = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Svg>
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import {
  bidders, commercialEstimate, commercialBidFactors, commercialComplianceDocs,
  COMMERCIAL_MARKET_INCREASE,
} from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useNavigation, useBackHandler } from '../context/NavigationContext'

// OMR money — whole numbers for totals, 3 dp for unit rates (per the workbook).
const fmtMoney = (n) => 'OMR ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtRate  = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const round3   = (n) => Math.round(n * 1000) / 1000

const COMM_AI_STEPS = [
  'Reading bidder commercial submissions…',
  'Extracting priced schedules & unit rates…',
  'Comparing unit rates against the company estimate…',
  'Rolling up section & grand totals…',
  'Ranking bidders — preparing recommendation…',
]

const COMPLIANCE_AI_STEPS = [
  'Opening bidder commercial documents…',
  'Checking mandatory commercial documents…',
  'Verifying bid bonds & price validity…',
  'Compliance matrix ready',
]

export default function CommercialEvaluation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { goBack } = useNavigation()
  const { user } = useAuth()
  const { tenders, advanceTender, submitParallelEval, updateTender } = useTenders()

  const [step, setStep]           = useState('compliance') // 'compliance' | 'comparison'
  const [docChecks, setDocChecks] = useState({})           // { [bidderId]: { [docId]: 'compliant'|'non_compliant' } }
  const [compAi, setCompAi]       = useState({ running: false, step: 0, done: false })
  const [priceAi, setPriceAi]     = useState({ running: false, step: 0, done: false })
  const [recId, setRecId]         = useState(null)         // evaluator's chosen recommendation
  const [note, setNote]           = useState('')
  const [submitted, setSubmitted] = useState(false)

  const tender = tenders.find(t => t.id === tenderId)
  const tenderBidders = Array.isArray(tender?.bidderList) && tender.bidderList.length
    ? tender.bidderList
    : (tender?.bidders > 0 ? bidders.slice(0, tender.bidders) : bidders)

  // Linear collects the commercial documents after technical evaluation; parallel
  // already collected them at ingestion.
  const commercialDocsReady = tender?.evaluationMode !== 'linear' || tender?.commercialDocsUploaded === true

  useBackHandler(() => {
    if (step === 'comparison') { setStep('compliance'); return true }
    return false
  }, [step])

  // AI pre-checks the commercial documents when the compliance step opens.
  useEffect(() => {
    if (step !== 'compliance' || !commercialDocsReady || compAi.done || compAi.running) return
    if (!tender) return
    setCompAi({ running: true, step: 0, done: false })
  }, [step, commercialDocsReady, tender]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!compAi.running) return
    if (compAi.step >= COMPLIANCE_AI_STEPS.length) {
      // Pre-fill every mandatory doc as compliant; the evaluator can flip any cell.
      setDocChecks(prev => {
        const next = { ...prev }
        tenderBidders.forEach(b => {
          next[b.id] = { ...(next[b.id] || {}) }
          commercialComplianceDocs.forEach(d => { if (!next[b.id][d.id]) next[b.id][d.id] = 'compliant' })
        })
        return next
      })
      setCompAi(a => ({ ...a, running: false, done: true }))
      return
    }
    const t = setTimeout(() => setCompAi(a => ({ ...a, step: a.step + 1 })), 480)
    return () => clearTimeout(t)
  }, [compAi.running, compAi.step]) // eslint-disable-line react-hooks/exhaustive-deps

  // AI runs the price comparison when the comparison step opens.
  useEffect(() => {
    if (step !== 'comparison' || priceAi.done || priceAi.running) return
    setPriceAi({ running: true, step: 0, done: false })
  }, [step]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!priceAi.running) return
    if (priceAi.step >= COMM_AI_STEPS.length) { setPriceAi(a => ({ ...a, running: false, done: true })); return }
    const t = setTimeout(() => setPriceAi(a => ({ ...a, step: a.step + 1 })), 460)
    return () => clearTimeout(t)
  }, [priceAi.running, priceAi.step]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Role gate — commercial evaluation is owned by the Contract Engineer ──
  if (user?.role?.id !== 'pof') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldOff size={22} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
          <p className="text-xs text-slate-400 mt-1">Commercial Evaluation is only accessible to the Contract Engineer.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={13} /> Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!tenderId) {
    const assignedTenders = tenders.filter(
      t => t.assignedCommEval?.id === user?.id && (
        t.status === 'comm_eval' ||
        (t.status === 'parallel_eval' && t.commSide === 'evaluating')
      )
    )
    return (
      <TenderSelectList
        tenders={assignedTenders}
        status="comm_eval"
        basePath="/commercial-eval"
        title="Commercial Evaluation"
        description="Select a tender to begin or continue commercial evaluation"
        emptyText="No tenders assigned to you for commercial evaluation"
      />
    )
  }

  if (!tender || tender.assignedCommEval?.id !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <p className="text-sm">{!tender ? 'Tender not found.' : 'This tender is not assigned to you.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={13} /> Back to Dashboard
        </Button>
      </div>
    )
  }

  // ── Pricing helpers (company estimate vs bidder proposals) ──
  const mktUnit      = (u) => u * (1 + COMMERCIAL_MARKET_INCREASE)
  const estItemTotal = (it) => it.qty * mktUnit(it.estUnit)
  const estGrand     = commercialEstimate.reduce((s, it) => s + estItemTotal(it), 0)
  const estSection   = (sec) => commercialEstimate.filter(it => it.section === sec).reduce((s, it) => s + estItemTotal(it), 0)
  const bidUnit = (bidderId, it) => {
    const f = commercialBidFactors[bidderId] ?? 1
    const seed = (((it.no * 7 + bidderId * 3) % 7) - 3) * 0.012
    return round3(mktUnit(it.estUnit) * f * (1 + seed))
  }
  const bidItemTotal = (bidderId, it) => bidUnit(bidderId, it) * it.qty
  const bidGrand     = (bidderId) => commercialEstimate.reduce((s, it) => s + bidItemTotal(bidderId, it), 0)
  const bidSection   = (bidderId, sec) => commercialEstimate.filter(it => it.section === sec).reduce((s, it) => s + bidItemTotal(bidderId, it), 0)
  const variancePct  = (bidderId) => estGrand ? ((bidGrand(bidderId) - estGrand) / estGrand) * 100 : 0
  const itemVarPct   = (bidderId, it) => estItemTotal(it) ? ((bidItemTotal(bidderId, it) - estItemTotal(it)) / estItemTotal(it)) * 100 : 0

  // ── Compliance ──
  const docStatus = (bidderId, docId) => docChecks[bidderId]?.[docId] ?? 'compliant'
  const toggleDoc = (bidderId, docId) => setDocChecks(prev => ({
    ...prev,
    [bidderId]: { ...(prev[bidderId] || {}), [docId]: docStatus(bidderId, docId) === 'compliant' ? 'non_compliant' : 'compliant' },
  }))
  const bidderCompliant = (bidderId) => commercialComplianceDocs.every(d => !d.mandatory || docStatus(bidderId, d.id) === 'compliant')
  const compliantBidders = tenderBidders.filter(b => bidderCompliant(b.id))
  const excludedBidders  = tenderBidders.filter(b => !bidderCompliant(b.id))

  // ── Recommendation — lowest compliant grand total ──
  const ranked = [...compliantBidders].sort((a, b) => bidGrand(a.id) - bidGrand(b.id))
  const aiRecId = ranked[0]?.id ?? null
  const effectiveRecId = recId ?? aiRecId
  const recBidder = tenderBidders.find(b => b.id === effectiveRecId) || null

  const isParallel = tender.evaluationMode === 'parallel'
  const sections = ['Material', 'Services']

  const handleSubmit = () => {
    if (!recBidder) return
    updateTender(tenderId, {
      commercialDocChecks: docChecks,
      commercialRecommendation: {
        bidderId: recBidder.id,
        bidderName: recBidder.name,
        total: Math.round(bidGrand(recBidder.id)),
        estimate: Math.round(estGrand),
        variancePct: Number(variancePct(recBidder.id).toFixed(1)),
        note: note.trim(),
        recommendedBy: user?.name || 'Commercial Evaluator',
        // The rest of the field, ranked lowest → highest, for the report.
        ranking: ranked.map(b => ({ id: b.id, name: b.name, total: Math.round(bidGrand(b.id)), variancePct: Number(variancePct(b.id).toFixed(1)) })),
        excluded: excludedBidders.map(b => ({ id: b.id, name: b.name })),
      },
    })
    if (isParallel) submitParallelEval(tenderId, 'comm')
    else advanceTender(tenderId)
    setSubmitted(true)
  }

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {/* Header */}
      <Card className="p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={goBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="evaluation">Commercial Evaluation</Badge>
              {isParallel && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Parallel</span>}
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · Compare bidder proposals against the company estimate and recommend the best-priced compliant bidder</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <BarChart3 size={13} className="text-slate-400" /> Estimate vs proposals
          </div>
        </div>
      </Card>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {[{ id: 'compliance', label: '1 · Compliance Check' }, { id: 'comparison', label: '2 · Price Comparison & Recommendation' }].map((s, i) => {
          const active = step === s.id
          const done = (s.id === 'compliance' && step === 'comparison')
          return (
            <div key={s.id} className="flex items-center gap-2">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors
                ${active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                  : done ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-white text-slate-400 border-slate-200'}`}>
                {done ? <CheckCircle size={11} className="inline mr-1 -mt-0.5" /> : null}{s.label}
              </span>
              {i === 0 && <ArrowRight size={13} className="text-slate-300" />}
            </div>
          )
        })}
      </div>

      {/* ══════════ STEP 1 — COMPLIANCE CHECK ══════════ */}
      {step === 'compliance' && (
        <>
          {!commercialDocsReady ? (
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-1">
                <UploadCloud size={16} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-slate-800">Upload Commercial Documents</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Technical evaluation is complete. Upload the bidders' commercial submissions to begin the compliance check.</p>
              <div className="rounded-xl border-2 border-dashed border-slate-200 hover:border-[var(--color-primary)]/50 transition-colors flex flex-col items-center justify-center gap-2.5 py-10">
                <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center"><UploadCloud size={22} className="text-slate-400" /></div>
                <p className="text-xs text-slate-500">Drop commercial documents or</p>
                <label className="cursor-pointer">
                  <span className="px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity">Browse Files</span>
                  <input type="file" multiple className="hidden" onChange={e => { if (e.target.files?.length) { updateTender(tenderId, { commercialDocsUploaded: true }); e.target.value = '' } }} />
                </label>
                <p className="text-[10px] text-slate-400">PDF · DOCX · XLSX · ZIP</p>
              </div>
            </Card>
          ) : compAi.running ? (
            <Card className="overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                <Bot size={14} className="text-white" />
                <p className="text-xs font-semibold text-white">AI Commercial Compliance Check…</p>
                <div className="ml-auto w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
              <div className="p-4 space-y-2">
                {COMPLIANCE_AI_STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-0.5 transition-all ${i > compAi.step ? 'opacity-20' : 'opacity-100'}`}>
                    {i < compAi.step ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      : i === compAi.step ? <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />}
                    <span className={`text-xs ${i < compAi.step ? 'text-slate-400 line-through' : i === compAi.step ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}>{s}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <>
              <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
                <Bot size={14} className="text-blue-600 shrink-0" />
                <span className="text-xs text-blue-800"><strong>AI compliance check complete.</strong> Review each bidder's mandatory commercial documents. Click a cell to override. Only compliant bidders move to the price comparison.</span>
              </div>

              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <CheckCircle size={15} className="text-[var(--color-primary)]" />
                  <h3 className="font-semibold text-slate-800 text-sm">Commercial Document Compliance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100">
                        <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-64">Mandatory Commercial Document</th>
                        {tenderBidders.map(b => (
                          <th key={b.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 min-w-36">{b.name.split(' ')[0]}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {commercialComplianceDocs.map(d => (
                        <tr key={d.id} className="hover:bg-slate-50/50">
                          <td className="px-4 py-3 text-slate-700 flex items-center gap-2"><FileText size={13} className="text-slate-400 shrink-0" />{d.name}</td>
                          {tenderBidders.map(b => {
                            const ok = docStatus(b.id, d.id) === 'compliant'
                            return (
                              <td key={b.id} className="px-3 py-3 text-center">
                                <button onClick={() => toggleDoc(b.id, d.id)}
                                  className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors
                                    ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                                  {ok ? <><CheckCircle size={11} /> Compliant</> : <><XCircle size={11} /> Non-Compliant</>}
                                </button>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                      {/* Overall */}
                      <tr className="bg-slate-50 border-t-2 border-slate-200">
                        <td className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Result</td>
                        {tenderBidders.map(b => (
                          <td key={b.id} className="px-3 py-3 text-center">
                            {bidderCompliant(b.id)
                              ? <Badge variant="compliant"><CheckCircle size={10} /> Eligible</Badge>
                              : <Badge variant="non_compliant"><XCircle size={10} /> Excluded</Badge>}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-500">
                  {compliantBidders.length} of {tenderBidders.length} bidder{tenderBidders.length !== 1 ? 's' : ''} compliant
                  {excludedBidders.length > 0 && ` · ${excludedBidders.length} excluded from the price comparison`}
                </p>
                <Button size="sm" disabled={compliantBidders.length === 0} onClick={() => setStep('comparison')}>
                  Proceed to Price Comparison <ArrowRight size={13} />
                </Button>
              </div>
              {compliantBidders.length === 0 && (
                <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                  <AlertTriangle size={12} /> No compliant bidders — at least one bidder must clear all mandatory documents to continue.
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ══════════ STEP 2 — PRICE COMPARISON & RECOMMENDATION ══════════ */}
      {step === 'comparison' && !submitted && (
        <>
          {priceAi.running ? (
            <Card className="overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                <Bot size={14} className="text-white" />
                <p className="text-xs font-semibold text-white">AI Price Comparison in Progress…</p>
                <div className="ml-auto w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
              <div className="p-4 space-y-2">
                {COMM_AI_STEPS.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-0.5 transition-all ${i > priceAi.step ? 'opacity-20' : 'opacity-100'}`}>
                    {i < priceAi.step ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      : i === priceAi.step ? <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />}
                    <span className={`text-xs ${i < priceAi.step ? 'text-slate-400 line-through' : i === priceAi.step ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}>{s}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : (
            <>
              {/* AI recommendation */}
              {recBidder && (
                <Card className="p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><Award size={20} className="text-emerald-600" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Sparkles size={13} className="text-emerald-600" />
                        <p className="text-sm font-semibold text-slate-800">AI recommends <span className="text-emerald-700">{recBidder.name}</span></p>
                      </div>
                      <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                        Lowest compliant total at <strong>{fmtMoney(bidGrand(recBidder.id))}</strong> —{' '}
                        {variancePct(recBidder.id) <= 0
                          ? <span className="text-emerald-700 font-semibold">{Math.abs(variancePct(recBidder.id)).toFixed(1)}% below</span>
                          : <span className="text-amber-700 font-semibold">{variancePct(recBidder.id).toFixed(1)}% above</span>} the company estimate of {fmtMoney(estGrand)}.
                        This is a suggestion — the Commercial Evaluator's recommendation is recorded, not a score.
                      </p>
                    </div>
                  </div>

                  {/* Evaluator's recommendation selector */}
                  <div className="mt-4 pt-4 border-t border-emerald-100">
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Commercial Evaluator's Recommendation</p>
                    <div className="flex flex-wrap gap-2">
                      {ranked.map((b, i) => {
                        const chosen = effectiveRecId === b.id
                        return (
                          <button key={b.id} onClick={() => setRecId(b.id)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs transition-colors
                              ${chosen ? 'border-emerald-400 bg-emerald-50 text-emerald-800' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}>
                            <span className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center ${chosen ? 'border-emerald-500' : 'border-slate-300'}`}>
                              {chosen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                            </span>
                            <span className="font-semibold">{b.name.split(' ')[0]}</span>
                            <span className="text-slate-400">{fmtMoney(bidGrand(b.id))}</span>
                            {i === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Lowest</span>}
                          </button>
                        )
                      })}
                    </div>
                    <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                      placeholder="Optional note on the recommendation (e.g. reason for not selecting the lowest bid)…"
                      className="mt-3 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none" />
                  </div>
                </Card>
              )}

              {/* Summary strip — each compliant bidder vs estimate */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {ranked.map((b, i) => {
                  const v = variancePct(b.id)
                  const isRec = effectiveRecId === b.id
                  return (
                    <Card key={b.id} className={`p-4 ${isRec ? 'ring-2 ring-emerald-400' : ''}`}>
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-xs font-semibold text-slate-600">{b.name.split(' ')[0]}</p>
                        {i === 0 && <Badge variant="success"><TrendingDown size={10} /> Lowest</Badge>}
                      </div>
                      <p className="text-xl font-bold text-slate-800">{fmtMoney(bidGrand(b.id))}</p>
                      <p className={`text-[11px] mt-1 font-semibold flex items-center gap-1 ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {v <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                        {v <= 0 ? `${Math.abs(v).toFixed(1)}% below estimate` : `${v.toFixed(1)}% above estimate`}
                      </p>
                    </Card>
                  )
                })}
              </div>

              {excludedBidders.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                  <XCircle size={12} className="text-red-400" />
                  Excluded (non-compliant): {excludedBidders.map(b => b.name).join(', ')}
                </div>
              )}

              {/* The detailed line-item comparison table */}
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
                  <BarChart3 size={15} className="text-[var(--color-primary)]" />
                  <h3 className="font-semibold text-slate-800 text-sm">Cost Comparison — Company Estimate vs Bidder Proposals</h3>
                  <span className="text-[10px] text-slate-400">Estimate applies a {(COMMERCIAL_MARKET_INCREASE * 100).toFixed(0)}% market increase · %age = proposal vs estimate</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[12px] border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-56">Item</th>
                        <th rowSpan={2} className="text-center px-2 py-2 font-semibold">UOM</th>
                        <th rowSpan={2} className="text-right px-2 py-2 font-semibold">Qty</th>
                        <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200 bg-slate-100/60">Company Estimate</th>
                        {compliantBidders.map(b => (
                          <th key={b.id} colSpan={3} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">{b.name.split(' ')[0]}</th>
                        ))}
                      </tr>
                      <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                        <th className="text-right px-2 py-1.5 border-l border-slate-200 bg-slate-100/60">Unit +{(COMMERCIAL_MARKET_INCREASE*100).toFixed(0)}%</th>
                        <th className="text-right px-2 py-1.5 bg-slate-100/60">Total</th>
                        {compliantBidders.map(b => (
                          <Fragment key={b.id}>
                            <th className="text-right px-2 py-1.5 border-l border-slate-200">Unit</th>
                            <th className="text-right px-2 py-1.5">Total</th>
                            <th className="text-right px-2 py-1.5">%age</th>
                          </Fragment>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sections.map(sec => (
                        <Fragment key={sec}>
                          <tr className="bg-[var(--color-primary)]/5 border-y border-slate-100">
                            <td colSpan={3 + 2 + compliantBidders.length * 3} className="px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wide">{sec}</td>
                          </tr>
                          {commercialEstimate.filter(it => it.section === sec).map(it => (
                            <tr key={it.id} className="border-b border-slate-50 hover:bg-slate-50/40">
                              <td className="px-3 py-2 sticky left-0 bg-white">
                                <span className="font-medium text-slate-700">{it.no}. {it.description}</span>
                                <span className="block text-[10px] text-slate-400">{it.size}</span>
                              </td>
                              <td className="px-2 py-2 text-center text-slate-500">{it.uom}</td>
                              <td className="px-2 py-2 text-right text-slate-500">{it.qty.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right border-l border-slate-100 bg-slate-50/40 text-slate-600">{fmtRate(mktUnit(it.estUnit))}</td>
                              <td className="px-2 py-2 text-right bg-slate-50/40 font-medium text-slate-700">{fmtMoney(estItemTotal(it))}</td>
                              {compliantBidders.map(b => {
                                const v = itemVarPct(b.id, it)
                                return (
                                  <Fragment key={b.id}>
                                    <td className="px-2 py-2 text-right border-l border-slate-100 text-slate-600">{fmtRate(bidUnit(b.id, it))}</td>
                                    <td className="px-2 py-2 text-right text-slate-700">{fmtMoney(bidItemTotal(b.id, it))}</td>
                                    <td className={`px-2 py-2 text-right font-semibold ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{v > 0 ? '+' : ''}{v.toFixed(0)}%</td>
                                  </Fragment>
                                )
                              })}
                            </tr>
                          ))}
                          {/* Section subtotal */}
                          <tr className="bg-slate-50 border-y border-slate-200 font-semibold text-slate-700">
                            <td colSpan={3} className="px-3 py-2 text-[11px] uppercase">{sec} Subtotal</td>
                            <td className="border-l border-slate-200 bg-slate-100/50" />
                            <td className="px-2 py-2 text-right bg-slate-100/50">{fmtMoney(estSection(sec))}</td>
                            {compliantBidders.map(b => {
                              const v = estSection(sec) ? ((bidSection(b.id, sec) - estSection(sec)) / estSection(sec)) * 100 : 0
                              return (
                                <Fragment key={b.id}>
                                  <td className="border-l border-slate-200" />
                                  <td className="px-2 py-2 text-right">{fmtMoney(bidSection(b.id, sec))}</td>
                                  <td className={`px-2 py-2 text-right ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{v > 0 ? '+' : ''}{v.toFixed(0)}%</td>
                                </Fragment>
                              )
                            })}
                          </tr>
                        </Fragment>
                      ))}
                      {/* Grand total */}
                      <tr className="bg-[var(--color-primary)]/10 border-t-2 border-[var(--color-primary)]/30 font-bold text-slate-800">
                        <td colSpan={3} className="px-3 py-3 uppercase text-xs">Grand Total (Materials + Services)</td>
                        <td className="border-l border-slate-200" />
                        <td className="px-2 py-3 text-right">{fmtMoney(estGrand)}</td>
                        {compliantBidders.map(b => {
                          const v = variancePct(b.id)
                          const isRec = effectiveRecId === b.id
                          return (
                            <Fragment key={b.id}>
                              <td className="border-l border-slate-200" />
                              <td className={`px-2 py-3 text-right ${isRec ? 'text-emerald-700' : ''}`}>{fmtMoney(bidGrand(b.id))}</td>
                              <td className={`px-2 py-3 text-right ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{v > 0 ? '+' : ''}{v.toFixed(1)}%</td>
                            </Fragment>
                          )
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>

              {/* Submit */}
              <Card className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-slate-800">Submit Commercial Recommendation</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {recBidder
                        ? <>Recommending <strong>{recBidder.name}</strong> at {fmtMoney(bidGrand(recBidder.id))}. This recommendation (not a score) is sent to Management Review.</>
                        : 'Select a bidder to recommend.'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setStep('compliance')}>
                      <ArrowLeft size={13} /> Compliance
                    </Button>
                    <Button size="sm" disabled={!recBidder} onClick={handleSubmit}>
                      <Send size={13} /> Submit Recommendation
                    </Button>
                  </div>
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ══════════ SUBMITTED ══════════ */}
      {submitted && recBidder && (
        <Card className="p-6 space-y-3">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Commercial Recommendation Submitted</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                You recommended <strong>{recBidder.name}</strong> ({fmtMoney(bidGrand(recBidder.id))},{' '}
                {variancePct(recBidder.id) <= 0 ? `${Math.abs(variancePct(recBidder.id)).toFixed(1)}% below` : `${variancePct(recBidder.id).toFixed(1)}% above`} the company estimate).
                {isParallel ? ' Once the technical side is also submitted, the tender moves to Management Review.' : ' The tender has advanced to Management Review.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={13} /> Back to Dashboard
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
