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
const MinusCircle   = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></Svg>
const TrendingDown  = p => <Svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Svg>
const TrendingUp    = p => <Svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>
const Send          = p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
const AlertTriangle = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const ArrowLeft     = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>
const ArrowRight    = p => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></Svg>
const ShieldOff     = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const Shield        = p => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>
const Bot           = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>
const UploadCloud   = p => <Svg {...p}><path d="M16 16l-4-4-4 4"/><path d="M12 12v9"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></Svg>
const Award         = p => <Svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Svg>
const Sparkles      = p => <Svg {...p}><path d="M12 3l1.9 5.8L20 10l-5.5 2.2L12 18l-2.5-5.8L4 10l6.1-1.2L12 3z"/></Svg>
const FileText      = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Svg>
const Database      = p => <Svg {...p}><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></Svg>
const Activity      = p => <Svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>
const Scale         = p => <Svg {...p}><path d="M12 3v18"/><path d="M5 7h14"/><path d="M8 21h8"/><path d="M5 7l-3 7h6z"/><path d="M19 7l-3 7h6z"/></Svg>
const Globe         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>
const Handshake     = p => <Svg {...p}><path d="M11 17l2 2a1 1 0 0 0 1.4 0l3.6-3.6"/><path d="M3 11l3.6-3.6a2 2 0 0 1 2.8 0L12 10l2.6-2.6a2 2 0 0 1 2.8 0L21 11"/><path d="M3 11v3l4 4"/><path d="M21 11v3l-4 4"/></Svg>
const MessageSquare = p => <Svg {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></Svg>
const Lock          = p => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></Svg>
const Info          = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Svg>
const ChevronDown   = p => <Svg {...p}><polyline points="6 9 12 15 18 9"/></Svg>
const ChevronRight  = p => <Svg {...p}><polyline points="9 18 15 12 9 6"/></Svg>
const RotateCcw     = p => <Svg {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Svg>
const Quote         = p => <Svg {...p}><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2H4c-1.25 0-2 .75-2 2v8c0 1.25.75 2 2 2h1"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2-2-2h-4c-1.25 0-2 .75-2 2v8c0 1.25.75 2 2 2h1"/></Svg>
const Download      = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
const Upload        = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>
const Paperclip     = p => <Svg {...p}><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></Svg>
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import {
  bidders, commercialEstimate, commercialBidFactors, commercialComplianceDocs,
  commercialComplianceGroups, COMMERCIAL_MARKET_INCREASE,
  commercialSteps, commercialExtractionFields,
  commercialReviewItems, commercialResponsiveness, commercialRiskRules,
  commercialNormalization, commercialHistoricalAwards, commercialScenarios,
  commercialScenarioFamilies, commercialStability, commercialPafDefaults,
  COMMERCIAL_PAF_NOTE, omaniEligibleTypes, commercialNegotiationRules,
  commercialClarificationStatuses, commercialClarificationReplies, commercialProfileFor,
} from '../data/mockData'
import {
  EVALUATION_TYPES, ceScenarioFor, ceStepsFor, ceSummary, ceFormat,
} from '../data/ceScenarios'
import {
  CeNormalizationPanel, ComplexPricedPanel, SimplePricedPanel, SensitivityCasesPanel,
  OptimizationPanel, CeOptimizationPanel, NegotiationRoundsPanel, BenchmarkPanel,
  ScopeMergePanel, TenderBoardPanel, EvaluationTypeBadge,
} from '../components/commercial/CeScenarioPanels'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useNavigation, useBackHandler } from '../context/NavigationContext'
import { useHomePath } from '../utils/permissions'
import { canEvaluate, isUnassignedSide } from '../utils/evalAssignment'
import { openHtmlDoc, clarificationRequestDoc } from '../utils/docGen'
import { tenderRef } from '../utils/tenderRef'

// OMR money — whole numbers for totals, 3 dp for unit rates (per the workbook).
const fmtMoney = (n) => 'OMR ' + Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })
const fmtRate  = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
const fmtPct   = (n, dp = 1) => `${n > 0 ? '+' : ''}${Number(n).toFixed(dp)}%`
const round3   = (n) => Math.round(n * 1000) / 1000

const SECTIONS = ['Material', 'Services']
const N = commercialNormalization
const REVIEW_CYCLE = ['compliant', 'deviation', 'exception']
const REVIEW_TONE = {
  compliant: { label: 'Compliant', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', Icon: CheckCircle },
  deviation: { label: 'Deviation', cls: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',        Icon: AlertTriangle },
  exception: { label: 'Exception', cls: 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100',                Icon: XCircle },
}
// Staged AI messages for the per-document re-check, mirroring the technical
// screen's RE_EVAL_STEPS — the evaluation restarts at compliance for that bidder.
const DOC_RECHECK_STEPS = [
  'Receiving the re-submitted commercial document…',
  'Validating issuer, reference and validity date…',
  'Re-running the mandatory submission check…',
  'Recomputing commercial responsiveness…',
  'Compliance re-check complete',
]
const RATING_BADGE = { High: 'error', Medium: 'warning', Low: 'info' }
const RATING_BAR   = { High: 'bg-red-400', Medium: 'bg-amber-400', Low: 'bg-blue-400' }
const BAND_BADGE   = { High: 'error', Medium: 'warning', Low: 'info', Minimal: 'compliant' }

export default function CommercialEvaluation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { goBack } = useNavigation()
  const { user } = useAuth()
  const home = useHomePath()
  const { tenders, advanceTender, submitParallelEval, updateTender } = useTenders()

  const tender = tenders.find(t => t.id === tenderId)

  // The nine steps run in order. `runs` holds each step's AI progress exactly
  // like the old two-step flow did, just keyed by step id.
  const [step, setStep]       = useState('extraction')
  const [runs, setRuns]       = useState({})   // { [stepId]: { running, step, done } }
  const [skipped, setSkipped] = useState({})   // optional steps the evaluator skipped
  const [openField, setOpenField]     = useState(null)   // step 1 evidence row
  const [docChecks, setDocChecks]     = useState({})     // step 2A { [bidderId]: { [docId]: 'pass'|'fail'|'na' } }
  const [review, setReview]           = useState({})     // step 2B { [bidderId]: { [itemId]: { status, note } } }
  const [riskAck, setRiskAck]         = useState({})     // step 3
  const [benchTab, setBenchTab]       = useState('compare')  // step 4
  const [indexPct, setIndexPct]       = useState(0)      // step 5 user-defined index
  const [paf, setPaf]                 = useState(commercialPafDefaults) // step 6
  const [negoPicked, setNegoPicked]   = useState({})     // step 7
  const [clarifications, setClarifications] = useState([])   // step 8
  const [recId, setRecId]             = useState(null)   // step 9
  const [note, setNote]               = useState('')
  const [submitted, setSubmitted]     = useState(false)
  const [optPicked, setOptPicked]     = useState({})     // scenario optimization targets
  // ── Step 2 document round ──
  // A missing or failing mandatory document raises a request against the bidder
  // instead of dropping them. Keyed `${bidderId}:${docId}` so a request survives
  // the re-check that clears it — the evaluator keeps the trail on screen.
  const [docRounds, setDocRounds]     = useState({})

  // ── Evaluation shape ──
  // A tender that names a priced scenario is evaluated with the panels for its
  // declared `evaluationType`; everything else keeps the generic nine-step flow.
  const scenario   = ceScenarioFor(tender)
  const evalType   = tender?.evaluationType || scenario?.type || null
  const typeMeta   = evalType ? EVALUATION_TYPES[evalType] : null
  const isSingleSource = evalType === 'single-source'
  const summary    = scenario ? ceSummary(scenario) : null
  const sFmt       = ceFormat(scenario?.currency)
  const steps      = scenario ? ceStepsFor(scenario.type) : commercialSteps

  const tenderBidders = Array.isArray(tender?.bidderList) && tender.bidderList.length
    ? tender.bidderList
    : (tender?.bidders > 0 ? bidders.slice(0, tender.bidders) : bidders)

  // Linear collects the commercial documents after technical evaluation; parallel
  // already collected them at ingestion.
  const commercialDocsReady = tender?.evaluationMode !== 'linear' || tender?.commercialDocsUploaded === true

  // ── The bidder set, each carrying its commercial profile ──
  const rows = tenderBidders.map((b, i) => ({
    ...b, idx: i,
    p: commercialProfileFor(i),
    short: String(b.name).split(' ')[0],
    isOmani: b.isLocal === true || b.country === 'Oman',
  }))
  const rowOf = (id) => rows.find(r => r.id === id) || rows[0]
  const profOf = (id) => rowOf(id)?.p ?? commercialProfileFor(0)

  // ── Step navigation ──
  const stepIdx  = Math.max(0, steps.findIndex(s => s.id === step))
  const stepDef  = steps[stepIdx]
  const run      = runs[step] || { running: false, step: 0, done: false }
  const isDone    = (id) => runs[id]?.done === true
  const isSkipped = (id) => skipped[id] === true
  // A step is settled once it has run, or once an optional step has been skipped.
  const isSettled = (id) => isDone(id) || isSkipped(id)
  // Award Recommendation only opens once every preceding step is settled.
  const priorStepsDone = steps.slice(0, -1).every(s => isSettled(s.id))
  const goNext = () => { const n = steps[stepIdx + 1]; if (n) setStep(n.id) }
  const goPrev = () => { const p = steps[stepIdx - 1]; if (p) setStep(p.id) }
  // Optional steps can be skipped — the step is recorded as skipped in the audit
  // trail and its adjustments are simply not applied to this tender.
  const skipStep = () => { setSkipped(prev => ({ ...prev, [step]: true })); goNext() }
  const includeStep = () => setSkipped(prev => ({ ...prev, [step]: false }))

  useBackHandler(() => {
    const p = steps[stepIdx - 1]
    if (p) { setStep(p.id); return true }
    return false
  }, [step])

  // ── Pricing helpers (company estimate vs bidder proposals) ──
  const mktUnit      = (u) => u * (1 + COMMERCIAL_MARKET_INCREASE)
  const estItemTotal = (it) => it.qty * mktUnit(it.estUnit)
  const estGrand     = commercialEstimate.reduce((s, it) => s + estItemTotal(it), 0)
  const estSection   = (sec) => commercialEstimate.filter(it => it.section === sec).reduce((s, it) => s + estItemTotal(it), 0)
  const factorOf = (id) => commercialBidFactors[id] ?? [1.03, 0.91, 1.10, 0.86][(rowOf(id)?.idx ?? 0) % 4]
  const bidUnit = (bidderId, it) => {
    const seed = (((it.no * 7 + (Number(bidderId) || 1) * 3) % 7) - 3) * 0.012
    return round3(mktUnit(it.estUnit) * factorOf(bidderId) * (1 + seed))
  }
  const bidItemTotal = (bidderId, it) => bidUnit(bidderId, it) * it.qty
  const bidGrand     = (bidderId) => commercialEstimate.reduce((s, it) => s + bidItemTotal(bidderId, it), 0)
  const bidSection   = (bidderId, sec) => commercialEstimate.filter(it => it.section === sec).reduce((s, it) => s + bidItemTotal(bidderId, it), 0)
  const variancePct  = (bidderId) => estGrand ? ((bidGrand(bidderId) - estGrand) / estGrand) * 100 : 0
  const itemVarPct   = (bidderId, it) => estItemTotal(it) ? ((bidItemTotal(bidderId, it) - estItemTotal(it)) / estItemTotal(it)) * 100 : 0

  // ── STEP 1 — extracted commercial record ──
  // A scenario tender reports the priced dataset's own total (and currency)
  // rather than the generic pricing model's.
  const codeOfId = scenario ? Object.fromEntries(scenario.bidders.map(b => [b.id, b.code])) : {}
  const scenarioLineCount = scenario
    ? (scenario.rollup
        ? scenario.rollup.length
        : scenario.schedules.reduce((s, x) => s + x.items.length, 0))
    : 0
  const scenarioPricingOf = (id) => {
    if (!scenario) return null
    if (isSingleSource) {
      const r = scenario.rounds[scenario.rounds.length - 1]
      return `${sFmt.money2(summary.totals.final.total)} · ${scenarioLineCount} priced lines (${r.label.toLowerCase()})`
    }
    const total = summary.totals.bids[codeOfId[id]]
    const unit = scenario.rollup ? 'priced Section E schedules' : 'priced lines'
    return total == null ? '—' : `${sFmt.money2(total)} · ${scenarioLineCount} ${unit}`
  }
  const extractionOf = (id) => {
    const p = profOf(id)
    return {
      pricing:    scenario ? scenarioPricingOf(id) : `${fmtMoney(bidGrand(id))} · ${commercialEstimate.length} priced lines`,
      discount:   p.discountText,
      payment:    p.advancePct > 0 ? `${(p.advancePct * 100).toFixed(0)}% advance · ${p.paymentDays} days net` : `${p.paymentDays} days net · no advance`,
      warranty:   `${p.warrantyMonths} months`,
      delivery:   `${p.deliveryWeeks} weeks from NTP`,
      bond:       p.performanceBondPct ? `${p.performanceBondPct}% of contract value` : 'Not offered',
      insurance:  p.insuranceText,
      escalation: p.escalationCapPct == null ? 'Uncapped' : `CPI-linked, capped at ${p.escalationCapPct}% p.a.`,
      lc:         `${p.lcScorePct}% local content`,
      icv:        `${p.icvRetainedPct}% ICV retained value`,
    }
  }

  // ── STEP 2 — compliance ──
  const docApplicable = (id, d) => !(d.localOnly && !rowOf(id)?.isOmani)
  const docStatus = (bidderId, docId) => {
    const d = commercialComplianceDocs.find(x => x.id === docId)
    if (d && !docApplicable(bidderId, d)) return 'na'
    return docChecks[bidderId]?.[docId] ?? 'pass'
  }
  const toggleDoc = (bidderId, docId) => setDocChecks(prev => ({
    ...prev,
    [bidderId]: { ...(prev[bidderId] || {}), [docId]: docStatus(bidderId, docId) === 'pass' ? 'fail' : 'pass' },
  }))
  const reviewCell = (bidderId, itemId) =>
    review[bidderId]?.[itemId] ?? profOf(bidderId).review?.[itemId] ?? { status: 'compliant' }
  const cycleReview = (bidderId, itemId) => {
    const cur = reviewCell(bidderId, itemId)
    const next = REVIEW_CYCLE[(REVIEW_CYCLE.indexOf(cur.status) + 1) % REVIEW_CYCLE.length]
    setReview(prev => ({
      ...prev,
      [bidderId]: { ...(prev[bidderId] || {}), [itemId]: { status: next, note: cur.note || '' } },
    }))
  }
  const failedDocs   = (id) => commercialComplianceDocs.filter(d => docStatus(id, d.id) === 'fail')

  // ── Step 2 document round — request → upload → AI re-check → resolved ──
  // Same shape as the technical Interim loop and the PQQ re-upload round: the
  // bidder is asked for the document, the upload re-runs the compliance check
  // for that bidder, and the outcome is recomputed rather than just flipped.
  const docKey     = (bidderId, docId) => `${bidderId}:${docId}`
  const docRound   = (bidderId, docId) => docRounds[docKey(bidderId, docId)]
  const setRound   = (key, changes) => setDocRounds(prev => ({ ...prev, [key]: { ...(prev[key] || {}), ...changes } }))
  const requestDoc = (bidderId, docId) =>
    setRound(docKey(bidderId, docId), { bidderId, docId, requestedAt: new Date().toLocaleString('en-GB'), step: null, done: false })

  const handleDocUpload = (bidderId, docId, file, e) => {
    if (!file) return
    if (e?.target) e.target.value = ''   // let the same file be picked again
    const key = docKey(bidderId, docId)
    setRound(key, { bidderId, docId, fileName: file.name, step: 0, done: false })
    let step = 0
    const advance = () => {
      step++
      if (step < DOC_RECHECK_STEPS.length) {
        setRound(key, { step })
        setTimeout(advance, 620)
        return
      }
      // The AI genuinely re-assesses the replacement, so ~20% of the time the
      // document still does not satisfy the requirement and the bidder is asked
      // for another one — the same "still not resolved" path the tech screen has.
      const passed = Math.random() >= 0.2
      setDocChecks(prev => ({ ...prev, [bidderId]: { ...(prev[bidderId] || {}), [docId]: passed ? 'pass' : 'fail' } }))
      setRound(key, { step: DOC_RECHECK_STEPS.length - 1, done: true })
    }
    setTimeout(advance, 620)
  }

  const isRechecking  = (bidderId, docId) => { const r = docRound(bidderId, docId); return !!r && r.step != null && !r.done }
  // A bidder blocks the gate while any mandatory document is still failing, or
  // while a re-check is still running.
  const outstandingOf = (id) => failedDocs(id).filter(d => !isRechecking(id, d.id))
  const blockedRows   = rows.filter(r => failedDocs(r.id).length > 0 ||
    commercialComplianceDocs.some(d => isRechecking(r.id, d.id)))
  const docRoundOpen  = blockedRows.length > 0
  const docRoundRows  = rows.filter(r =>
    commercialComplianceDocs.some(d => docStatus(r.id, d.id) === 'fail' || docRound(r.id, d.id)))
  const docBlockHint  = docRoundOpen
    ? `Outstanding commercial documents: ${blockedRows.map(r => `${r.short} (${outstandingOf(r.id).length || 'in re-check'})`).join(' · ')}. Request and re-check each one, or override the cell in the matrix above.`
    : null
  const deviationsOf = (id) => commercialReviewItems.filter(i => reviewCell(id, i.id).status === 'deviation')
  const exceptionsOf = (id) => commercialReviewItems.filter(i => reviewCell(id, i.id).status === 'exception')
  // Responsiveness is driven by the mandatory submission matrix alone; deviations
  // and exceptions make a bidder conditionally responsive, never non-responsive.
  const responsivenessOf = (id) => {
    if (failedDocs(id).length) return 'nonResponsive'
    return (deviationsOf(id).length || exceptionsOf(id).length) ? 'conditional' : 'responsive'
  }
  const eligibleRows = rows.filter(r => responsivenessOf(r.id) !== 'nonResponsive')
  const excludedRows = rows.filter(r => responsivenessOf(r.id) === 'nonResponsive')
  const deviationRegister = rows.flatMap(r => deviationsOf(r.id).map(i => ({ row: r, item: i, note: reviewCell(r.id, i.id).note })))
  const exceptionsLog     = rows.flatMap(r => exceptionsOf(r.id).map(i => ({ row: r, item: i, note: reviewCell(r.id, i.id).note })))

  // ── STEP 3 — risk ──
  const risksOf = (id) => {
    const p = profOf(id)
    const order = { High: 0, Medium: 1, Low: 2 }
    return commercialRiskRules.filter(k => k.applies(p))
      .map(k => ({ id: k.id, risk: k.risk, impact: k.impact, rating: k.rating, detail: k.detail(p), mitigation: k.mitigation }))
      .sort((a, b) => order[a.rating] - order[b.rating])
  }
  const riskBandOf = (id) => {
    const s = risksOf(id).reduce((t, k) => t + (k.rating === 'High' ? 3 : k.rating === 'Medium' ? 2 : 1), 0)
    return s >= 7 ? 'High' : s >= 4 ? 'Medium' : s > 0 ? 'Low' : 'Minimal'
  }
  const allRisks = eligibleRows.flatMap(r => risksOf(r.id).map(k => ({ ...k, row: r })))

  // ── STEP 4 — normalization & benchmarking ──
  // Restates every bidder onto the same commercial basis. Positive amounts are
  // added to the bidder's price; negative amounts are deducted.
  const adjustmentsOf = (id) => {
    const p = profOf(id); const price = bidGrand(id); const adj = []
    if (p.advancePct > 0) adj.push({ id: 'adv', label: 'Advance payment financing',
      detail: `${(p.advancePct * 100).toFixed(0)}% advance carried at ${(N.financingRatePa * 100).toFixed(0)}% p.a. over ~6 months`,
      amount: price * p.advancePct * N.financingRatePa * 0.5 })
    if (p.paymentDays !== N.standardPaymentDays) adj.push({ id: 'pay', label: 'Payment terms alignment',
      detail: `${p.paymentDays}-day terms restated to the ${N.standardPaymentDays}-day standard`,
      amount: price * ((N.standardPaymentDays - p.paymentDays) / 365) * N.financingRatePa })
    if (p.warrantyMonths < N.standardWarrantyMths) adj.push({ id: 'war', label: 'Warranty shortfall',
      detail: `${N.standardWarrantyMths - p.warrantyMonths} months short of the ${N.standardWarrantyMths}-month requirement`,
      amount: price * (N.standardWarrantyMths - p.warrantyMonths) * N.warrantyCostPerMonth })
    if (p.performanceBondPct < N.standardBondPct) adj.push({ id: 'bond', label: 'Performance security shortfall',
      detail: `Bond at ${p.performanceBondPct}% against the ${N.standardBondPct}% requirement`,
      amount: price * ((N.standardBondPct - p.performanceBondPct) / 100) * N.bondRiskFactor })
    if (!p.personnelInsured) adj.push({ id: 'ins', label: 'Insurance shortfall',
      detail: 'Cost of procuring the missing personnel cover', amount: price * 0.005 })
    if (p.escalationCapPct == null) adj.push({ id: 'esc', label: 'Uncapped escalation provision',
      detail: `${(N.uncappedEscalationPa * 100).toFixed(0)}% assumed on the ${(p.escalationExposure * 100).toFixed(0)}% escalation-exposed scope`,
      amount: price * p.escalationExposure * N.uncappedEscalationPa })
    if (p.discountApplied && p.discountPct > 0) adj.push({ id: 'disc', label: 'Unconditional discount',
      detail: p.discountText, amount: -price * p.discountPct })
    return adj
  }
  const normPrice   = (id) => bidGrand(id) + adjustmentsOf(id).reduce((s, a) => s + a.amount, 0)
  const normVarPct  = (id) => estGrand ? ((normPrice(id) - estGrand) / estGrand) * 100 : 0
  const historical  = commercialHistoricalAwards.map(h => ({ ...h, valueOmr: estGrand * h.ratio }))
  const historicalMean = historical.reduce((s, h) => s + h.valueOmr, 0) / (historical.length || 1)
  const histVarPct  = (id) => historicalMean ? ((normPrice(id) - historicalMean) / historicalMean) * 100 : 0
  const abnormalityOf = (id) => {
    const v = normVarPct(id)
    if (v <= N.abnormallyLowPct)  return { key: 'low',  label: 'Abnormally Low',  badge: 'warning',   detail: `${Math.abs(v).toFixed(1)}% below the company estimate — verify the bidder has priced the full scope.` }
    if (v >= N.abnormallyHighPct) return { key: 'high', label: 'Abnormally High', badge: 'warning',   detail: `${v.toFixed(1)}% above the company estimate — request a build-up for the principal rates.` }
    return { key: 'normal', label: 'Within Range', badge: 'compliant', detail: `${fmtPct(v)} against the company estimate — inside the normal band.` }
  }
  const rateBenchmark = () => commercialEstimate.map(it => {
    const rates = eligibleRows.map(r => ({ id: r.id, name: r.short, rate: bidUnit(r.id, it) }))
    if (!rates.length) return null
    const sorted = [...rates].sort((a, b) => a.rate - b.rate)
    const average = rates.reduce((s, x) => s + x.rate, 0) / rates.length
    return {
      item: it, estimateRate: mktUnit(it.estUnit), average,
      lowest: sorted[0], highest: sorted[sorted.length - 1],
      outliers: rates.filter(x => average && Math.abs((x.rate - average) / average) * 100 >= N.outlierRatePct),
    }
  }).filter(Boolean)
  const abnormalRows = eligibleRows.filter(r => abnormalityOf(r.id).key !== 'normal')

  // ── STEP 5 — sensitivity ──
  // Scenarios are applied to the normalized price, so the stress test starts from
  // the true commercial position rather than the raw submitted number.
  const scenarioPrice = (id, sc) => {
    const p = profOf(id); const base = normPrice(id); let price = base
    if (sc.esc != null) price = base * (1 + sc.esc * p.escalationExposure)
    if (sc.qty != null) { const fixed = base * p.mobilisationPct; price = fixed + (base - fixed) * (1 + sc.qty) }
    if (sc.fx  != null) price = base * (1 + sc.fx * p.fxShare)
    if (sc.npvDays !== undefined) {
      const days = sc.npvDays ?? p.paymentDays
      const advance = sc.npvDays == null ? p.advancePct : 0
      price = base * (advance + (1 - advance) / (1 + N.financingRatePa * (days / 365)))
    }
    return price * (1 + (indexPct / 100) * p.escalationExposure)
  }
  const sensitivityMatrix = () => commercialScenarios.map(sc => {
    const prices = eligibleRows.map(r => ({ id: r.id, name: r.short, price: scenarioPrice(r.id, sc) }))
    return { sc, prices, winner: prices.length ? prices.reduce((a, b) => (b.price < a.price ? b : a)) : null }
  })
  const stability = () => {
    const matrix = sensitivityMatrix()
    const baseWinner = matrix[0]?.winner?.id ?? null
    const held = matrix.filter(m => m.winner?.id === baseWinner).length
    const pct = matrix.length ? (held / matrix.length) * 100 : 0
    return { matrix, baseWinner, heldPct: pct, key: pct >= 90 ? 'stable' : pct >= 60 ? 'moderate' : 'high', flips: matrix.filter(m => m.winner?.id !== baseWinner) }
  }

  // ── STEP 6 — LC + ICV + PAF + Omani preference ──
  // LCC Adjustment Factor = LC Score x LCC Weighting %
  // ICV Adjustment Factor = ICV Retained Value x ICV Weighting %
  // Total LC Adjustment   = LCC + ICV (capped) · Adjustment Value = Bid Price x Total
  // Evaluated Price       = Bid Price − Adjustment Value
  const pafOf = (id) => {
    const r = rowOf(id); const p = profOf(id)
    const basePrice = paf.basis === 'submitted' ? bidGrand(id) : normPrice(id)
    const lccFactor = (p.lcScorePct / 100) * (paf.lccWeightingPct / 100)
    const icvFactor = (p.icvRetainedPct / 100) * (paf.icvWeightingPct / 100)
    const rawTotal  = lccFactor + icvFactor
    const totalPaf  = Math.min(rawTotal, paf.capPct / 100)
    const adjustmentValue = basePrice * totalPaf
    const evaluatedPrice  = basePrice - adjustmentValue
    const eligible = paf.applyPreference && (r?.isOmani || omaniEligibleTypes.includes(p.entityType))
    const preferenceValue = eligible ? evaluatedPrice * (paf.omaniPreferencePct / 100) : 0
    return {
      entityType: p.entityType, eligible, basePrice,
      lcScorePct: p.lcScorePct, icvRetainedPct: p.icvRetainedPct,
      lccFactor, icvFactor, rawTotal, totalPaf, capped: rawTotal > paf.capPct / 100,
      adjustmentValue, evaluatedPrice, preferenceValue, preferencePrice: evaluatedPrice - preferenceValue,
    }
  }
  const preferenceOn = isDone('preference') && !isSkipped('preference')
  // The price the final ranking is built on.
  const evaluatedPriceOf = (id) => preferenceOn ? pafOf(id).preferencePrice : normPrice(id)
  const rankingBasis = preferenceOn
    ? `Lowest evaluated price after PAF${paf.applyPreference ? ' & Omani Preference' : ''}`
    : 'Lowest normalized commercial price'

  // ── STEP 7 — negotiation ──
  const opportunitiesOf = (id) => {
    const p = profOf(id); const price = normPrice(id)
    return commercialNegotiationRules.filter(k => k.applies(p))
      .map(k => ({ id: k.id, title: k.title, unit: k.unit, basis: k.basis(p, price), savings: Math.max(0, k.savings(p, price)) }))
      .sort((a, b) => b.savings - a.savings)
  }
  const pickedSavings = eligibleRows.reduce((s, r) =>
    s + opportunitiesOf(r.id).filter(o => negoPicked[`${r.id}:${o.id}`]).reduce((t, o) => t + o.savings, 0), 0)

  // ── STEP 8 — clarification register ──
  // Drafted from every open finding produced by the preceding steps.
  const buildClarifications = () => {
    const out = []
    const add = (row, kind, subject, request) => out.push({
      ref: `CL-${String(out.length + 1).padStart(3, '0')}`,
      bidderId: row.id, bidderName: row.name, kind, subject, request,
      status: 'draft', response: '',
    })
    rows.forEach(r => {
      failedDocs(r.id).forEach(d => add(r, 'submission', d.name,
        `The mandatory submission "${d.name}" was not found in your tender. Please provide the document, valid at the tender closing date, within 3 working days.`))
      exceptionsOf(r.id).forEach(i => add(r, 'exception', i.name,
        `Your submission takes a material exception to the ITT requirement for ${i.name} (${i.requirement}). Please confirm whether the exception is withdrawn, or state the commercial value attached to it.`))
      deviationsOf(r.id).forEach(i => add(r, 'deviation', i.name,
        `Your submission deviates from the ITT requirement for ${i.name} (${i.requirement}). Please confirm whether you will comply without price change.`))
    })
    if (scenario) {
      // Straight from the workbook: every tenderer is approached to confirm the
      // basis of their offer and to explain the significant variance elements
      // that feed the optimization and negotiation approach.
      eligibleRows.forEach(r => {
        add(r, 'pricing', 'Basis of offer & significant variances',
          'Please confirm compliance and no deviation to the tender requirements, including the basis of your offer submission, and provide your assumptions and rate build-up for the significant variance elements against the Company Estimate.')
      })
      if (isSingleSource) {
        eligibleRows.forEach(r => {
          add(r, 'pricing', 'Non-priced lines & Schedule 3 deviation',
            'Please confirm which lines are carried as "included" within another rate, confirm the lines you have not quoted where OLNG is to provide the resource, and explain the equipment hire build-up for the vacuum-truck line on Schedule 3.')
        })
      }
      return out
    }
    eligibleRows.forEach(r => {
      const ab = abnormalityOf(r.id)
      if (ab.key !== 'normal') add(r, 'pricing', `${ab.label} bid`,
        `Your submitted price is ${ab.label.toLowerCase()} against the company estimate. Please provide the rate build-up for the principal line items and confirm the full scope is priced.`)
    })
    return out
  }
  const setClar = (ref, changes) => setClarifications(prev => prev.map(c => c.ref === ref ? { ...c, ...changes } : c))

  // There is no bidder-facing portal, so a clarification leaves the platform as
  // an exported document and returns as an uploaded file.
  const clarificationDate = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  const exportClarification = (c) => {
    const d = clarificationRequestDoc({
      ref: c.ref, tenderId: tender?.id, tenderTitle: tender?.title, bidderName: c.bidderName,
      department: tender?.department, subject: c.subject, request: c.request, dateStr: clarificationDate(),
    })
    openHtmlDoc(d.title, d.content)
    if (c.status === 'draft') setClar(c.ref, { status: 'exported', exportedAt: clarificationDate() })
  }
  const exportAllClarifications = () => {
    clarifications.filter(c => c.status === 'draft').forEach(exportClarification)
  }
  const uploadClarificationResponse = (c, file, e) => {
    if (!file) return
    setClar(c.ref, {
      status: 'responded',
      responseFile: file.name,
      response: commercialClarificationReplies[c.kind],
    })
    // Let the same file be picked again if the evaluator re-uploads.
    if (e?.target) e.target.value = ''
  }
  const openClarifications   = clarifications.filter(c => c.status !== 'closed')
  const closedClarifications = clarifications.filter(c => c.status === 'closed')

  // ── STEP 9 — award recommendation ──
  const ranked = [...eligibleRows].sort((a, b) => evaluatedPriceOf(a.id) - evaluatedPriceOf(b.id))
  // In scenario mode the recommendation comes from the priced dataset, not from
  // the generic pricing model — a single-source tender has nothing to rank.
  const scenarioAwardId = scenario
    ? (isSingleSource ? scenario.bidder.id
      : scenario.bidders.find(b => b.code === scenario.award.awardeeCode)?.id ?? scenario.bidders[0]?.id)
    : null
  const aiRecId = scenario ? scenarioAwardId : (ranked[0]?.id ?? null)
  const effectiveRecId = recId ?? aiRecId
  const recBidder = rows.find(b => b.id === effectiveRecId) || (scenario ? rows[0] : null) || null

  // ── The generic step runner — one AI pass per step, same as the old flow ──
  useEffect(() => {
    if (!tender || !commercialDocsReady) return
    if (isSkipped(step)) return
    const r = runs[step]
    if (r?.done || r?.running) return
    setRuns(prev => ({ ...prev, [step]: { running: true, step: 0, done: false } }))
  }, [step, commercialDocsReady, tender, skipped]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const r = runs[step]
    if (!r?.running) return
    const def = steps.find(s => s.id === step)
    if (!def) return
    if (r.step >= def.steps.length) {
      // Each step writes its first-pass result when it finishes; the evaluator
      // can then override anything on screen.
      if (step === 'compliance') {
        setDocChecks(prev => {
          const next = { ...prev }
          rows.forEach(b => {
            next[b.id] = { ...(next[b.id] || {}) }
            commercialComplianceDocs.forEach(d => {
              if (!next[b.id][d.id]) next[b.id][d.id] = b.p.submissionFails.includes(d.id) ? 'fail' : 'pass'
            })
          })
          return next
        })
      }
      if (step === 'clarification' && clarifications.length === 0) setClarifications(buildClarifications())
      setRuns(prev => ({ ...prev, [step]: { ...prev[step], running: false, done: true } }))
      return
    }
    const t = setTimeout(() => setRuns(prev => ({ ...prev, [step]: { ...prev[step], step: prev[step].step + 1 } })), 440)
    return () => clearTimeout(t)
  }, [runs, step]) // eslint-disable-line react-hooks/exhaustive-deps

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
        <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
          <ArrowLeft size={13} /> Back to Home
        </Button>
      </div>
    )
  }

  if (!tenderId) {
    // canEvaluate, not a bare id match: an unassigned commercial side falls back
    // to the Contract Engineer so a returned tender can never be invisible. The
    // guard below uses the same call, so listed and openable stay in step.
    const assignedTenders = tenders.filter(
      t => canEvaluate(t, 'comm', user) && (
        t.status === 'comm_eval' ||
        (t.status === 'parallel_eval' && t.commSide === 'evaluating')
      )
    )
    return (
      <TenderSelectList
        tenders={assignedTenders}
        status={['comm_eval', 'parallel_eval']}
        basePath="/commercial-eval"
        title="Commercial Evaluation"
        description="Select a tender to begin or continue commercial evaluation"
        emptyText="No tenders assigned to you for commercial evaluation"
        isUnassigned={t => isUnassignedSide(t, 'comm')}
      />
    )
  }

  if (!tender || !canEvaluate(tender, 'comm', user)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <p className="text-sm">{!tender ? 'Tender not found.' : 'This tender is not assigned to you.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
          <ArrowLeft size={13} /> Back to Home
        </Button>
      </div>
    )
  }

  const isParallel = tender.evaluationMode === 'parallel'

  // Supply Chain returned this tender for commercial rework — the gate comment is
  // the brief, so it has to be on screen. It stands until the CE answers it.
  const scmReturn = (() => {
    if (submitted) return null
    const d = tender.scmDecisions?.scm_gate2
    if (d?.decision !== 'returned' || d.target === 'tech') return null
    return tender.commEvalSubmittedAt && tender.commEvalSubmittedAt > d.at ? null : d
  })()

  const handleSubmit = () => {
    if (!recBidder) return
    const pafRec = !scenario && preferenceOn ? pafOf(recBidder.id) : null
    const runRecord = {
      steps: steps.map(s => ({
        no: s.no, id: s.id, name: s.name,
        status: isSkipped(s.id) ? 'skipped' : isDone(s.id) ? 'complete' : 'not_run',
      })),
      responsiveness: rows.map(r => ({ id: r.id, name: r.name, result: commercialResponsiveness[responsivenessOf(r.id)].label })),
      risksHigh: allRisks.filter(k => k.rating === 'High').length,
      clarifications: clarifications.map(c => ({ ref: c.ref, bidder: c.bidderName, subject: c.subject, status: c.status })),
    }
    // The scenario recommendation carries the priced dataset's own figures so
    // the SCM award gate reads the client's real numbers, not the generic model.
    const recommendation = scenario
      ? {
          bidderId: recBidder.id,
          bidderName: scenario.award.awardeeName,
          evaluationType: scenario.type,
          currency: scenario.currency,
          total: Math.round(summary.awardTotal),
          estimate: Math.round(summary.ceTotal),
          variancePct: Number((summary.awardPct ?? 0).toFixed(1)),
          evaluatedTotal: Math.round(scenario.award.value),
          acv: scenario.award.acv,
          acvLabel: scenario.award.acvLabel,
          duration: scenario.award.duration,
          basis: summary.ranked
            ? 'Lowest evaluated total against the normalized Company Estimate (L1)'
            : 'Single source — negotiated position against the optimized Company Estimate',
          awardNote: scenario.award.text,
          conditions: scenario.award.conditions,
          noteBlocks: scenario.notes,
          commercialModel: scenario.commercialModel,
          optimizationTargets: Object.keys(optPicked).filter(k => optPicked[k]),
          note: note.trim(),
          recommendedBy: user?.name || 'Commercial Evaluator',
          ranking: summary.ranked
            ? summary.totals.ranked.map((r, i) => ({
                id: scenario.bidders.find(b => b.code === r.code)?.id ?? i,
                name: scenario.bidders.find(b => b.code === r.code)?.name ?? r.code,
                total: Math.round(r.total),
                evaluated: Math.round(r.total),
                variancePct: Number(r.pct.toFixed(1)),
              }))
            : scenario.rounds.map(r => ({
                id: r.id, name: r.label,
                total: Math.round(summary.totals.rounds[r.id].total),
                evaluated: Math.round(summary.totals.rounds[r.id].total),
                variancePct: Number(summary.totals.rounds[r.id].pct.toFixed(1)),
              })),
          excluded: excludedRows.map(b => ({ id: b.id, name: b.name })),
        }
      : {
          bidderId: recBidder.id,
          bidderName: recBidder.name,
          total: Math.round(bidGrand(recBidder.id)),
          estimate: Math.round(estGrand),
          variancePct: Number(variancePct(recBidder.id).toFixed(1)),
          normalizedTotal: Math.round(normPrice(recBidder.id)),
          evaluatedTotal: Math.round(evaluatedPriceOf(recBidder.id)),
          pafPct: pafRec ? Number((pafRec.totalPaf * 100).toFixed(2)) : null,
          basis: rankingBasis,
          awardNote: COMMERCIAL_PAF_NOTE,
          note: note.trim(),
          recommendedBy: user?.name || 'Commercial Evaluator',
          // The rest of the field, ranked lowest → highest evaluated price.
          ranking: ranked.map(b => ({
            id: b.id, name: b.name,
            total: Math.round(bidGrand(b.id)),
            evaluated: Math.round(evaluatedPriceOf(b.id)),
            variancePct: Number(variancePct(b.id).toFixed(1)),
          })),
          excluded: excludedRows.map(b => ({ id: b.id, name: b.name })),
        }
    updateTender(tenderId, {
      commercialDocChecks: docChecks,
      commEvalSubmittedAt: new Date().toISOString(),
      commercialEvalRun: scenario ? runRecord : {
        ...runRecord,
        stability: commercialStability[stability().key].label,
        pafConfig: isSkipped('preference') ? null : paf,
        negotiationSavings: isSkipped('negotiation') ? null : Math.round(pickedSavings),
      },
      commercialRecommendation: recommendation,
    })
    if (isParallel) submitParallelEval(tenderId, 'comm')
    else advanceTender(tenderId)
    setSubmitted(true)
  }

  // Short audit line per step, for the award recommendation package.
  const auditLine = (id) => {
    if (isSkipped(id)) {
      return id === 'preference'
        ? 'Skipped — no Local Content, ICV, PAF or Omani Preference adjustment applied to this tender.'
        : 'Skipped — commercial negotiation is not permitted under this tendering strategy.'
    }
    // Scenario-specific steps report against the priced dataset.
    if (scenario) {
      switch (id) {
        case 'ceNormalization': return isSingleSource
          ? `Approved Company Estimate ${sFmt.money2(scenario.ceOptimization.approved)} re-baselined to ${sFmt.money2(scenario.ceOptimization.optimized)} across ${scenario.ceOptimization.items.length} adjustments.`
          : `Approved Company Estimate ${sFmt.money2(scenario.normalization.approved)} normalized to ${sFmt.money2(scenario.normalization.normalized)} across ${scenario.normalization.items.length} adjustments.`
        case 'priced': return summary.ranked
          ? `${summary.totals.ranked[0].code} is L1 at ${sFmt.money2(summary.totals.ranked[0].total)} (${sFmt.pct(summary.totals.ranked[0].pct, 0)}) · L1 to L2 gap ${summary.totals.gapPct.toFixed(0)}%.`
          : ''
        case 'rounds': return `${scenario.rounds.length} negotiation rounds · the offer moved to ${sFmt.pct(summary.totals.final.pct, 0)} against the optimized Company Estimate. No L1 / L2 ranking — single source.`
        case 'benchmarkRates': return `${scenario.benchmark.rows.length} line(s) benchmarked against ${scenario.benchmark.sources.length} external rate sources and prior contract ${scenario.benchmark.priorContract} · ${scenario.sensitivityCases.length} sensitivity cases.`
        case 'scopeMerge': return `Scope merge (Tr-2 & Tr-3) — Company Estimate ${sFmt.money2(scenario.scopeMerge.ceTotal)} against a bidder total of ${sFmt.money2(scenario.scopeMerge.bidTotal)}.`
        case 'sensitivityCases': return `${scenario.sensitivityCases.length} cases modelled · ${scenario.sensitivityCases.filter(c => c.changed).length} changed the outcome.`
        case 'optimization': return `${Object.values(optPicked).filter(Boolean).length} of ${scenario.optimizationTargets.length} items selected as the negotiation mandate with L1.`
        case 'tbAward': return `Award recommendation: ${scenario.award.awardeeName} · ${scenario.award.acvLabel} ${sFmt.money2(scenario.award.acv)}.`
        default: break
      }
    }
    switch (id) {
      case 'extraction':    return `${commercialExtractionFields.length} data points extracted per bidder, each with a document / page evidence reference.`
      case 'compliance':    return `${eligibleRows.length} of ${rows.length} bidders responsive · ${deviationRegister.length} deviations · ${exceptionsLog.length} exceptions.`
      case 'risk':          return `${allRisks.length} findings (${allRisks.filter(k => k.rating === 'High').length} High) — advisory, no bidder rejected on risk.`
      case 'benchmark':     return `Normalized against the estimate of ${fmtMoney(estGrand)} and ${historical.length} historical awards · ${abnormalRows.length} abnormal bid(s) flagged.`
      case 'sensitivity':   return `${commercialScenarios.length} scenarios modelled · ${commercialStability[stability().key].label} (${stability().heldPct.toFixed(0)}% of scenarios hold the ranking).`
      case 'preference':    return `PAF up to ${paf.capPct}% (LC ${paf.lccWeightingPct}% + ICV ${paf.icvWeightingPct}%)${paf.applyPreference ? ` · ${paf.omaniPreferencePct}% Omani preference` : ''}. Evaluation prices only.`
      case 'negotiation':   return `${fmtMoney(pickedSavings)} of indicative savings selected as the negotiation mandate.`
      case 'clarification': return `${clarifications.length} clarifications raised · ${closedClarifications.length} closed · ${openClarifications.length} outstanding.`
      case 'award':         return `Ranking built on: ${rankingBasis}.`
      default: return ''
    }
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
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
              <Badge variant="evaluation">Commercial Evaluation</Badge>
              <EvaluationTypeBadge meta={typeMeta} />
              {isParallel && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Parallel</span>}
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tender.department} · Deadline: {tender.deadline}
              {scenario && <> · {scenario.tenderRef} · {scenario.currency} · {scenario.duration}</>}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">{stepDef.purpose}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <BarChart3 size={13} className="text-slate-400" /> Step {stepDef.no} of {steps.length}
          </div>
        </div>
      </Card>

      {/* Step indicator — the nine steps share the row, so it never scrolls */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => {
          const active = step === s.id
          const wasSkipped = isSkipped(s.id)
          const done = !wasSkipped && i < stepIdx
          return (
            <Fragment key={s.id}>
              <span title={wasSkipped ? `${s.name} — skipped, not applied to this tender` : `${s.no} · ${s.name}`}
                className={`flex-auto min-w-0 flex items-center justify-center gap-1.5 pl-1.5 pr-2.5 py-1 rounded-full border transition-colors
                  ${active ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                    : wasSkipped ? 'bg-slate-50 text-slate-300 border-slate-200'
                    : done ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-white text-slate-400 border-slate-200'}`}>
                <span className={`shrink-0 rounded-full flex items-center justify-center text-[9px] font-bold
                  ${active ? 'bg-white/25 text-white'
                    : done ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-slate-100 text-slate-400'}`}
                  style={{ width: 18, height: 18 }}>
                  {done ? <CheckCircle size={11} /> : wasSkipped ? <MinusCircle size={11} /> : s.no}
                </span>
                <span className={`text-[11px] font-semibold truncate ${wasSkipped ? 'line-through' : ''}`}>{s.short}</span>
              </span>
              {i < steps.length - 1 && (
                <span className={`shrink-0 w-1.5 h-px ${done ? 'bg-emerald-300' : 'bg-slate-200'}`} />
              )}
            </Fragment>
          )
        })}
      </div>

      {/* ── Supply Chain sent this back — the comment is the whole brief ── */}
      {scmReturn && (
        <Card className="p-4 border border-amber-200 bg-amber-50/60">
          <div className="flex items-start gap-3">
            <RotateCcw size={15} className="text-amber-500 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-amber-800">
                Returned by Supply Chain for re-evaluation
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Award Gate
                </span>
              </p>
              {scmReturn.comment
                ? <p className="text-xs text-amber-700 mt-1 leading-relaxed italic">“{scmReturn.comment}”</p>
                : <p className="text-xs text-amber-700 mt-1">No comment was recorded with the return.</p>}
              <p className="text-[11px] text-amber-600 mt-1.5">
                Returned {new Date(scmReturn.at).toLocaleString('en-GB')} · rework the steps below and submit the recommendation again.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ══════════ Upload gate (linear evaluations) ══════════ */}
      {!commercialDocsReady ? (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-1">
            <UploadCloud size={16} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Upload Commercial Documents</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">Technical evaluation is complete. Upload the bidders' commercial submissions so the data extraction step can run.</p>
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
      ) : submitted && recBidder ? (
        /* ══════════ SUBMITTED ══════════ */
        <Card className="p-6 space-y-3">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Commercial Recommendation Submitted</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {scenario
                  ? <>You recommended <strong>{scenario.award.awardeeName}</strong> — {scenario.award.acvLabel} {sFmt.money2(scenario.award.acv)}
                      {summary.ranked ? ' (L1, lowest evaluated total).' : ' (single source — negotiated position, no ranking applies).'}</>
                  : <>You recommended <strong>{recBidder.name}</strong> — evaluated at {fmtMoney(evaluatedPriceOf(recBidder.id))}, to be awarded at the submitted bid price of {fmtMoney(bidGrand(recBidder.id))}.</>}
                {isParallel ? ' Once the technical side is also submitted, the tender moves to SCM review.' : ' The tender has advanced to SCM review.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
              <ArrowLeft size={13} /> Back to Home
            </Button>
          </div>
        </Card>
      ) : (
        <>
          {run.running ? (
            /* AI progress — the same card the two-step flow used */
            <Card className="overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                <Bot size={14} className="text-white" />
                <p className="text-xs font-semibold text-white">AI {stepDef.name} in Progress…</p>
                <div className="ml-auto w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
              <div className="p-4 space-y-2">
                {stepDef.steps.map((s, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-0.5 transition-all ${i > run.step ? 'opacity-20' : 'opacity-100'}`}>
                    {i < run.step ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      : i === run.step ? <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                      : <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />}
                    <span className={`text-xs ${i < run.step ? 'text-slate-400 line-through' : i === run.step ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}>{s}</span>
                  </div>
                ))}
              </div>
            </Card>
          ) : isSkipped(step) ? (
            /* An optional step the evaluator chose to skip */
            <>
              <Card className="p-6 text-center">
                <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center mx-auto">
                  <MinusCircle size={20} className="text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-700 mt-3">{stepDef.name} — Skipped</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xl mx-auto leading-relaxed">
                  {step === 'preference'
                    ? 'No Local Content, ICV, PAF or Omani Preference adjustment is applied to this tender. The ranking stays on the normalized commercial price.'
                    : 'No commercial negotiation is permitted under this tendering strategy, so no negotiation position is prepared.'}
                  {' '}This is recorded in the evaluation audit trail.
                </p>
              </Card>
              <StepFooter onBack={goPrev} backLabel="Back" onNext={goNext} nextLabel="Continue"
                onInclude={includeStep} includeLabel="Include this step"
                hint="Skipped steps are reported in the recommendation package, not hidden." />
            </>
          ) : (
            <>
              {/* ══════════ STEP 1 — COMMERCIAL DATA EXTRACTION ══════════ */}
              {step === 'extraction' && (
                <>
                  <AiStrip>
                    <strong>AI data extraction complete.</strong> {commercialExtractionFields.length} commercial data points extracted for {rows.length} bidder{rows.length !== 1 ? 's' : ''}, each with an evidence reference. Click a row to see the source document, page and quoted text.
                  </AiStrip>

                  <Card className="overflow-hidden">
                    <PanelHead icon={Database} title="Structured Commercial Data" hint="Click a row to open the evidence references" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-60">Commercial Data Point</th>
                            {rows.map(r => (
                              <th key={r.id} className="text-left px-3 py-3 text-xs font-semibold text-slate-500 min-w-44">
                                {r.short}
                                <span className="block text-[10px] font-normal text-slate-400">{r.country} · {r.p.currency}</span>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {commercialExtractionFields.map(f => {
                            const open = openField === f.id
                            return (
                              <Fragment key={f.id}>
                                <tr className="hover:bg-slate-50/60 cursor-pointer" onClick={() => setOpenField(open ? null : f.id)}>
                                  <td className="px-4 py-3 text-slate-700 font-medium">
                                    <span className="flex items-center gap-1.5">
                                      {open ? <ChevronDown size={13} className="text-slate-400 shrink-0" /> : <ChevronRight size={13} className="text-slate-400 shrink-0" />}
                                      {f.label}
                                    </span>
                                  </td>
                                  {rows.map(r => (
                                    <td key={r.id} className="px-3 py-3 text-slate-700 text-[12px] align-top">{extractionOf(r.id)[f.id]}</td>
                                  ))}
                                </tr>
                                {open && (
                                  <tr className="bg-slate-50/70">
                                    <td className="px-4 py-3 align-top">
                                      <span className="text-[10px] font-bold uppercase tracking-wide text-slate-400 flex items-center gap-1"><Quote size={11} /> Evidence</span>
                                    </td>
                                    {rows.map(r => {
                                      const e = r.p.evidence[f.id]
                                      return (
                                        <td key={r.id} className="px-3 py-3 align-top">
                                          {e ? (
                                            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                                              <p className="text-[10px] font-semibold text-slate-600 flex items-center gap-1">
                                                <FileText size={10} className="text-slate-400 shrink-0" />{e.doc} · p.{e.page}
                                              </p>
                                              <p className="text-[11px] text-slate-500 italic mt-1.5 leading-relaxed">“{e.quote}”</p>
                                            </div>
                                          ) : <span className="text-[11px] text-slate-300">No reference</span>}
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )}
                              </Fragment>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {rows.map(r => {
                      const withEv = commercialExtractionFields.filter(f => r.p.evidence[f.id]).length
                      return (
                        <Card key={r.id} className="p-4">
                          <p className="text-xs font-semibold text-slate-600">{r.short}</p>
                          <p className="text-xl font-bold text-slate-800 mt-1">{withEv}<span className="text-sm text-slate-400">/{commercialExtractionFields.length}</span></p>
                          <p className="text-[11px] text-slate-400 mt-0.5">data points extracted with evidence</p>
                        </Card>
                      )
                    })}
                  </div>

                  <StepFooter onNext={goNext} nextLabel="Continue to Compliance"
                    hint="Extracted data feeds every downstream step — no figure is entered by hand." />
                </>
              )}

              {/* ══════════ STEP 2 — COMMERCIAL COMPLIANCE ══════════ */}
              {step === 'compliance' && (
                <>
                  <AiStrip>
                    <strong>AI compliance check complete.</strong> {eligibleRows.length} of {rows.length} bidder{rows.length !== 1 ? 's' : ''} cleared the mandatory submission gate · {deviationRegister.length} deviation{deviationRegister.length !== 1 ? 's' : ''} · {exceptionsLog.length} exception{exceptionsLog.length !== 1 ? 's' : ''}. Click a cell to override the AI. A missing or failing mandatory document raises a document request below — the bidder is not dropped, and the compliance check re-runs on the replacement.
                  </AiStrip>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {rows.map(r => {
                      const key = responsivenessOf(r.id)
                      const meta = commercialResponsiveness[key]
                      return (
                        <Card key={r.id} className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold text-slate-600">{r.short}</p>
                            <Badge variant={meta.badge}>{meta.label}</Badge>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{meta.hint}</p>
                          <div className="flex flex-wrap gap-1.5 mt-2.5">
                            {failedDocs(r.id).length > 0 && <Chip tone="red">{failedDocs(r.id).length} mandatory fail</Chip>}
                            {deviationsOf(r.id).length > 0 && <Chip tone="amber">{deviationsOf(r.id).length} deviation{deviationsOf(r.id).length !== 1 ? 's' : ''}</Chip>}
                            {exceptionsOf(r.id).length > 0 && <Chip tone="red">{exceptionsOf(r.id).length} exception{exceptionsOf(r.id).length !== 1 ? 's' : ''}</Chip>}
                            {!failedDocs(r.id).length && !deviationsOf(r.id).length && !exceptionsOf(r.id).length && <Chip tone="green">Clean</Chip>}
                          </div>
                        </Card>
                      )
                    })}
                  </div>

                  {/* A — Mandatory Submission Compliance Matrix */}
                  <Card className="overflow-hidden">
                    <PanelHead icon={Shield} title="A · Mandatory Submission Compliance Matrix"
                      hint="Presence, validity and completeness — a Fail here makes the bidder Non-Responsive" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-72">Mandatory Requirement</th>
                            {rows.map(r => <th key={r.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 min-w-36">{r.short}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {commercialComplianceGroups.map(group => (
                            <Fragment key={group}>
                              <tr className="bg-[var(--color-primary)]/5 border-y border-slate-100">
                                <td colSpan={1 + rows.length} className="px-4 py-1.5 text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wide">{group}</td>
                              </tr>
                              {commercialComplianceDocs.filter(d => d.group === group).map(d => (
                                <tr key={d.id} className="hover:bg-slate-50/50">
                                  <td className="px-4 py-3 text-slate-700">
                                    <span className="flex items-center gap-2">
                                      <FileText size={13} className="text-slate-400 shrink-0" />{d.name}
                                      {d.conditional && <span className="text-[10px] text-slate-400">(if applicable)</span>}
                                    </span>
                                  </td>
                                  {rows.map(r => {
                                    const st = docStatus(r.id, d.id)
                                    if (st === 'na') return (
                                      <td key={r.id} className="px-3 py-3 text-center">
                                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-slate-50 text-slate-400 border-slate-200">
                                          <MinusCircle size={11} /> N/A
                                        </span>
                                      </td>
                                    )
                                    const ok = st === 'pass'
                                    return (
                                      <td key={r.id} className="px-3 py-3 text-center">
                                        <button onClick={() => toggleDoc(r.id, d.id)}
                                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors
                                            ${ok ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'}`}>
                                          {ok ? <><CheckCircle size={11} /> Pass</> : <><XCircle size={11} /> Fail</>}
                                        </button>
                                      </td>
                                    )
                                  })}
                                </tr>
                              ))}
                            </Fragment>
                          ))}
                          <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Result</td>
                            {rows.map(r => (
                              <td key={r.id} className="px-3 py-3 text-center">
                                {failedDocs(r.id).length
                                  ? <Badge variant="non_compliant"><XCircle size={10} /> Excluded</Badge>
                                  : <Badge variant="compliant"><CheckCircle size={10} /> Eligible</Badge>}
                              </td>
                            ))}
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* B — Commercial Compliance Review */}
                  <Card className="overflow-hidden">
                    <PanelHead icon={Scale} title="B · Commercial Compliance Review" hint="Click a cell to cycle Compliant → Deviation → Exception" />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100">
                            <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-52">Commercial Condition</th>
                            <th className="text-left px-3 py-3 text-xs font-semibold text-slate-500 min-w-56">ITT Requirement</th>
                            {rows.map(r => <th key={r.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 min-w-40">{r.short}</th>)}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {commercialReviewItems.map(item => (
                            <tr key={item.id} className="hover:bg-slate-50/50 align-top">
                              <td className="px-4 py-3 text-slate-700 font-medium">{item.name}</td>
                              <td className="px-3 py-3 text-[11px] text-slate-500">{item.requirement}</td>
                              {rows.map(r => {
                                const cell = reviewCell(r.id, item.id)
                                const tone = REVIEW_TONE[cell.status]
                                const Icon = tone.Icon
                                return (
                                  <td key={r.id} className="px-3 py-3 text-center">
                                    <button onClick={() => cycleReview(r.id, item.id)}
                                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors ${tone.cls}`}>
                                      <Icon size={11} /> {tone.label}
                                    </button>
                                    {cell.note && <p className="text-[10px] text-slate-400 mt-1.5 leading-snug text-left">{cell.note}</p>}
                                  </td>
                                )
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Deviation register & exceptions log */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Register title="Commercial Deviation Register" prefix="DEV" tone="amber" entries={deviationRegister} empty="No deviations recorded." />
                    <Register title="Commercial Exceptions Log"     prefix="EXC" tone="red"   entries={exceptionsLog}     empty="No exceptions recorded." />
                  </div>

                  {/* ── Document request round ──
                      A missing or failing mandatory submission raises a request
                      against the bidder rather than dropping them. The upload
                      restarts the compliance check for that bidder. */}
                  {docRoundRows.length > 0 && (
                    <Card className={`overflow-hidden border ${docRoundOpen ? 'border-amber-200' : 'border-emerald-200'}`}>
                      <PanelHead icon={UploadCloud} title="Document Request Round"
                        hint={docRoundOpen
                          ? 'A bidder with a missing or failing submission is asked for the document — they are not dropped'
                          : 'All requested documents re-checked and cleared'} />
                      <div className="divide-y divide-slate-50">
                        {docRoundRows.map(r => {
                          const openDocs = commercialComplianceDocs.filter(d =>
                            docStatus(r.id, d.id) === 'fail' || docRound(r.id, d.id))
                          return (
                            <div key={r.id} className="px-4 py-3">
                              <div className="flex items-center gap-2 flex-wrap mb-2">
                                <span className="text-xs font-semibold text-slate-700">{r.name}</span>
                                {outstandingOf(r.id).length > 0
                                  ? <Chip tone="red">{outstandingOf(r.id).length} outstanding</Chip>
                                  : commercialComplianceDocs.some(d => isRechecking(r.id, d.id))
                                    ? <Chip tone="amber">Re-checking</Chip>
                                    : <Chip tone="green">Cleared</Chip>}
                              </div>
                              <div className="space-y-2">
                                {openDocs.map(d => {
                                  const round     = docRound(r.id, d.id)
                                  const running   = isRechecking(r.id, d.id)
                                  const failing   = docStatus(r.id, d.id) === 'fail'
                                  const requested = !!round
                                  return (
                                    <div key={d.id} className={`rounded-lg border px-3 py-2.5
                                      ${running ? 'border-blue-200 bg-blue-50/50'
                                        : failing ? 'border-amber-100 bg-amber-50/50'
                                        : 'border-emerald-100 bg-emerald-50/50'}`}>
                                      <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div className="min-w-0">
                                          <p className="text-[12px] font-medium text-slate-700 flex items-center gap-1.5">
                                            <FileText size={12} className="text-slate-400 shrink-0" />{d.name}
                                          </p>
                                          <p className={`text-[11px] mt-0.5 ${running ? 'text-blue-700' : failing ? 'text-amber-700' : 'text-emerald-700'}`}>
                                            {running ? DOC_RECHECK_STEPS[round.step]
                                              : failing && round?.done ? 'Re-checked — still does not satisfy the requirement. Request another copy.'
                                              : failing && requested ? `Requested ${round.requestedAt} — awaiting upload`
                                              : failing ? 'Missing or failing — raise a document request'
                                              : 'Re-checked and cleared'}
                                            {round?.fileName && !running ? ` · ${round.fileName}` : ''}
                                          </p>
                                        </div>
                                        {running ? (
                                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-blue-700 shrink-0">
                                            <div className="w-3 h-3 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                                            Re-checking
                                          </span>
                                        ) : failing ? (
                                          <div className="flex items-center gap-2 shrink-0">
                                            {!requested && (
                                              <Button variant="secondary" size="sm" onClick={() => requestDoc(r.id, d.id)}>
                                                <Send size={11} /> Request document
                                              </Button>
                                            )}
                                            {requested && (
                                              <label className="inline-flex">
                                                <input type="file" className="hidden"
                                                  accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                                  onChange={e => handleDocUpload(r.id, d.id, e.target.files?.[0], e)} />
                                                <span className="inline-flex items-center gap-1 cursor-pointer text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-dashed border-amber-300 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] bg-white transition-colors whitespace-nowrap">
                                                  <Upload size={11} /> {round?.done ? 'Upload again' : 'Upload document'}
                                                </span>
                                              </label>
                                            )}
                                          </div>
                                        ) : (
                                          <span className="flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 shrink-0">
                                            <CheckCircle size={11} /> Cleared on re-check
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </Card>
                  )}

                  <StepFooter onBack={goPrev} backLabel="Data Extraction" onNext={goNext} nextLabel="Continue to Risk"
                    nextDisabled={eligibleRows.length === 0 || docRoundOpen}
                    block={docBlockHint
                      ?? (eligibleRows.length === 0 ? 'No responsive bidders — at least one bidder must clear every mandatory submission requirement to continue.' : null)}
                    hint="Responsive and conditionally responsive bidders both continue past this gate." />
                </>
              )}

              {/* ══════════ STEP 3 — COMMERCIAL RISK ══════════ */}
              {step === 'risk' && (
                <>
                  <AiStrip>
                    <strong>AI risk assessment complete.</strong> {allRisks.length} risk finding{allRisks.length !== 1 ? 's' : ''} across {eligibleRows.length} bidder{eligibleRows.length !== 1 ? 's' : ''}, of which {allRisks.filter(k => k.rating === 'High').length} rated High.
                  </AiStrip>

                  <div className="flex items-start gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-600 leading-relaxed">
                      <strong>Advisory only.</strong> Risk findings inform the recommendation and the negotiation position — they never reject a bidder automatically. The Contract Engineer decides what to do with each finding.
                    </span>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {eligibleRows.map(r => {
                      const ks = risksOf(r.id); const band = riskBandOf(r.id)
                      return (
                        <Card key={r.id} className="p-4">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold text-slate-600">{r.short}</p>
                            <Badge variant={BAND_BADGE[band]}>{band} risk</Badge>
                          </div>
                          <p className="text-xl font-bold text-slate-800">{ks.length}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">finding{ks.length !== 1 ? 's' : ''} · {ks.filter(k => k.rating === 'High').length} high</p>
                          <div className="flex gap-0.5 mt-2.5 h-1.5">
                            {ks.length === 0 ? <span className="flex-1 rounded-full bg-emerald-200" />
                              : ks.map((k, i) => <span key={i} className={`flex-1 rounded-full ${RATING_BAR[k.rating]}`} />)}
                          </div>
                        </Card>
                      )
                    })}
                  </div>

                  <Card className="overflow-hidden">
                    <PanelHead icon={Shield} title="Commercial Risk Register" hint="Sorted High → Low" />
                    {allRisks.length === 0 ? (
                      <p className="px-4 py-8 text-xs text-slate-400 text-center">No commercial risks identified.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                              <th className="text-left px-4 py-3 text-xs font-semibold min-w-32">Bidder</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold min-w-52">Risk</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold min-w-36">Impact</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Rating</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold min-w-72">Finding & Recommended Mitigation</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold min-w-32">Acknowledged</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {allRisks.map(k => {
                              const key = `${k.row.id}:${k.id}`
                              const ack = !!riskAck[key]
                              return (
                                <tr key={key} className="hover:bg-slate-50/50 align-top">
                                  <td className="px-4 py-3 text-xs font-semibold text-slate-700">{k.row.short}</td>
                                  <td className="px-3 py-3 text-[12px] text-slate-700 font-medium">{k.risk}</td>
                                  <td className="px-3 py-3 text-[12px] text-slate-500">{k.impact}</td>
                                  <td className="px-3 py-3 text-center"><Badge variant={RATING_BADGE[k.rating]}>{k.rating}</Badge></td>
                                  <td className="px-3 py-3 text-[11px] text-slate-500 leading-relaxed">
                                    {k.detail}
                                    <span className="block mt-1 text-slate-600"><strong className="text-slate-500">Mitigation:</strong> {k.mitigation}</span>
                                  </td>
                                  <td className="px-3 py-3 text-center">
                                    <button onClick={() => setRiskAck(prev => ({ ...prev, [key]: !prev[key] }))}
                                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors
                                        ${ack ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                      {ack ? <><CheckCircle size={11} /> Noted</> : 'Acknowledge'}
                                    </button>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  <StepFooter onBack={goPrev} backLabel="Compliance"
                    onNext={goNext} nextLabel={scenario ? `Continue to ${steps[3].short}` : 'Continue to Normalization'}
                    hint="Findings carry into the negotiation strategy and the recommendation package." />
                </>
              )}

              {/* ══════════════════════════════════════════════════════════════
                  SCENARIO STEPS — which panels appear is driven entirely by the
                  tender's evaluation type. A single-source evaluation never
                  shows a ranking, an L1/L2 chip or a multi-bidder comparison.
                 ══════════════════════════════════════════════════════════════ */}
              {scenario && step === 'ceNormalization' && (
                <>
                  {isSingleSource
                    ? <CeOptimizationPanel scenario={scenario} />
                    : <CeNormalizationPanel scenario={scenario} />}
                  <StepFooter onBack={goPrev} backLabel="Risk" onNext={goNext} nextLabel={`Continue to ${steps[4].short}`}
                    hint="Every proposal is compared against this figure — not against the approved estimate." />
                </>
              )}

              {scenario && step === 'priced' && (
                <>
                  {scenario.type === 'competitive-complex'
                    ? <ComplexPricedPanel scenario={scenario} />
                    : <SimplePricedPanel scenario={scenario} />}
                  <StepFooter onBack={goPrev} backLabel={steps[3].short} onNext={goNext} nextLabel={`Continue to ${steps[5].short}`}
                    hint="Ranking is by lowest evaluated total — L1 is the lowest, L2 the second lowest." />
                </>
              )}

              {scenario && step === 'sensitivityCases' && (
                <>
                  <SensitivityCasesPanel scenario={scenario} />
                  <StepFooter onBack={goPrev} backLabel={steps[4].short} onNext={goNext} nextLabel={`Continue to ${steps[6].short}`}
                    hint="Each case is recorded with its result and an outcome-changed verdict for the Tender Board note." />
                </>
              )}

              {scenario && step === 'optimization' && (
                <>
                  <OptimizationPanel scenario={scenario} picked={optPicked}
                    onToggle={(ref) => setOptPicked(prev => ({ ...prev, [ref]: !prev[ref] }))} />
                  <StepFooter onBack={goPrev} backLabel={steps[5].short} onNext={goNext} nextLabel="Continue to Clarifications"
                    hint="Selected items form the negotiation mandate carried into the Tender Board submission." />
                </>
              )}

              {scenario && step === 'rounds' && (
                <>
                  <NegotiationRoundsPanel scenario={scenario} />
                  <StepFooter onBack={goPrev} backLabel={steps[3].short} onNext={goNext} nextLabel={`Continue to ${steps[5].short}`}
                    hint="Single source — value is evidenced by the movement across the rounds, not by a ranking." />
                </>
              )}

              {scenario && step === 'benchmarkRates' && (
                <>
                  <BenchmarkPanel scenario={scenario} />
                  <StepFooter onBack={goPrev} backLabel={steps[4].short} onNext={goNext} nextLabel={`Continue to ${steps[6].short}`}
                    hint="External rate sources stand in for the competitive tension a second bidder would provide." />
                </>
              )}

              {scenario && step === 'scopeMerge' && (
                <>
                  <ScopeMergePanel scenario={scenario} />
                  <StepFooter onBack={goPrev} backLabel={steps[5].short} onNext={goNext} nextLabel="Continue to Clarifications"
                    hint="The merged option is the basis of the award recommendation." />
                </>
              )}

              {scenario && step === 'tbAward' && (
                <>
                  {!priorStepsDone ? (
                    <Card className="p-6 text-center">
                      <Lock size={22} className="text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700 mt-2">Tender Board submission is locked</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Every preceding step must complete first — still open: {steps.slice(0, -1).filter(s => !isSettled(s.id)).map(s => `${s.no} · ${s.short}`).join(', ')}.
                      </p>
                    </Card>
                  ) : (
                    <>
                      <TenderBoardPanel scenario={scenario} summary={summary} note={note} onNote={setNote} />

                      <Card className="overflow-hidden">
                        <PanelHead icon={FileText} title="Evaluation Audit Trail" hint="What each step contributed to this recommendation" />
                        <div className="divide-y divide-slate-50">
                          {steps.map(s => {
                            const done = isDone(s.id)
                            return (
                              <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold
                                  ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{s.no}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-[12px] font-semibold text-slate-700">{s.name}</span>
                                    {done ? <Badge variant="compliant"><CheckCircle size={10} /> Complete</Badge> : <Badge variant="warning">Not run</Badge>}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{auditLine(s.id)}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Card>

                      <Card className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">Submit Commercial Recommendation</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              Recommending <strong>{scenario.award.awardeeName}</strong> — {scenario.award.acvLabel} {sFmt.money2(scenario.award.acv)}.
                              {' '}This recommendation (not a score) is sent to Supply Chain's commercial &amp; award gate.
                            </p>
                            {openClarifications.length > 0 && (
                              <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1.5">
                                <AlertTriangle size={12} /> {openClarifications.length} clarification{openClarifications.length !== 1 ? 's' : ''} still open — close them in the clarifications step before submitting.
                              </p>
                            )}
                            {docBlockHint && (
                              <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1.5">
                                <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {docBlockHint}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={goPrev}><ArrowLeft size={13} /> Clarifications</Button>
                            <Button size="sm" disabled={openClarifications.length > 0 || docRoundOpen} onClick={handleSubmit}>
                              <Send size={13} /> Submit Recommendation
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </>
                  )}
                </>
              )}

              {/* ══════════ STEP 4 — PRICE NORMALIZATION & BENCHMARKING ══════════ */}
              {step === 'benchmark' && (
                <>
                  <AiStrip>
                    <strong>AI price normalization complete.</strong> Normalized against the company estimate of {fmtMoney(estGrand)} and {historical.length} historical awards · {abnormalRows.length} abnormal bid{abnormalRows.length !== 1 ? 's' : ''} · {rateBenchmark().filter(b => b.outliers.length).length} line-item outlier{rateBenchmark().filter(b => b.outliers.length).length !== 1 ? 's' : ''}.
                  </AiStrip>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {[...eligibleRows].sort((a, b) => normPrice(a.id) - normPrice(b.id)).map((r, i) => {
                      const v = normVarPct(r.id); const ab = abnormalityOf(r.id)
                      const delta = normPrice(r.id) - bidGrand(r.id)
                      return (
                        <Card key={r.id} className={`p-4 ${i === 0 ? 'ring-2 ring-emerald-400' : ''}`}>
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <p className="text-xs font-semibold text-slate-600">{r.short}</p>
                            {i === 0 && <Badge variant="success"><TrendingDown size={10} /> Lowest</Badge>}
                          </div>
                          <p className="text-lg font-bold text-slate-800">{fmtMoney(normPrice(r.id))}</p>
                          <p className="text-[10px] text-slate-400">normalized · submitted {fmtMoney(bidGrand(r.id))}</p>
                          <p className={`text-[11px] mt-1.5 font-semibold flex items-center gap-1 ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {v <= 0 ? <TrendingDown size={11} /> : <TrendingUp size={11} />}
                            {v <= 0 ? `${Math.abs(v).toFixed(1)}% below estimate` : `${v.toFixed(1)}% above estimate`}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Normalization {delta >= 0 ? '+' : '−'}{fmtMoney(Math.abs(delta))}</p>
                          <div className="mt-2.5 pt-2.5 border-t border-slate-100"><Badge variant={ab.badge}>{ab.label}</Badge></div>
                        </Card>
                      )
                    })}
                  </div>

                  {abnormalRows.map(r => {
                    const ab = abnormalityOf(r.id)
                    return (
                      <div key={r.id} className="flex items-start gap-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
                        <AlertTriangle size={13} className="shrink-0 mt-0.5" />
                        <span><strong>{r.name} — {ab.label}.</strong> {ab.detail}</span>
                      </div>
                    )
                  })}

                  {/* Historical benchmark */}
                  <Card className="overflow-hidden">
                    <PanelHead icon={Database} title="Benchmark — Historical Awarded Contracts" hint={`Mean award value ${fmtMoney(historicalMean)}`} />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <th className="text-left px-4 py-2.5 text-xs font-semibold">Reference</th>
                            <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-64">Contract</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold">Year</th>
                            <th className="text-center px-3 py-2.5 text-xs font-semibold">Basis</th>
                            <th className="text-right px-4 py-2.5 text-xs font-semibold">Award Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {historical.map(h => (
                            <tr key={h.ref} className="hover:bg-slate-50/50">
                              <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500">{h.ref}</td>
                              <td className="px-3 py-2.5 text-[12px] text-slate-700">{h.title}</td>
                              <td className="px-3 py-2.5 text-center text-[12px] text-slate-500">{h.year}</td>
                              <td className="px-3 py-2.5 text-center text-[11px] text-slate-500">{h.basis}</td>
                              <td className="px-4 py-2.5 text-right text-[12px] font-medium text-slate-700">{fmtMoney(h.valueOmr)}</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 border-t-2 border-slate-200">
                            <td colSpan={4} className="px-4 py-2.5 text-xs font-bold text-slate-600 uppercase">Normalized bid vs historical mean</td>
                            <td className="px-4 py-2.5 text-right">
                              <div className="flex flex-col items-end gap-0.5">
                                {eligibleRows.map(r => {
                                  const v = histVarPct(r.id)
                                  return (
                                    <span key={r.id} className="text-[11px]">
                                      <span className="text-slate-500">{r.short}</span>{' '}
                                      <span className={`font-semibold ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{fmtPct(v)}</span>
                                    </span>
                                  )
                                })}
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </Card>

                  {/* Tabbed detail */}
                  <Card className="overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5 flex-wrap">
                      {[{ id: 'compare', label: 'Estimate vs Proposals' }, { id: 'normalize', label: 'Normalization Bridge' }, { id: 'benchmark', label: 'Rate Benchmarking' }].map(t => (
                        <button key={t.id} onClick={() => setBenchTab(t.id)}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
                            ${benchTab === t.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {benchTab === 'compare' && (
                      <>
                        <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">
                          Estimate applies a {(COMMERCIAL_MARKET_INCREASE * 100).toFixed(0)}% market increase · %age = submitted proposal vs estimate
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px] border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-56">Item</th>
                                <th rowSpan={2} className="text-center px-2 py-2 font-semibold">UOM</th>
                                <th rowSpan={2} className="text-right px-2 py-2 font-semibold">Qty</th>
                                <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200 bg-slate-100/60">Company Estimate</th>
                                {eligibleRows.map(r => <th key={r.id} colSpan={3} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">{r.short}</th>)}
                              </tr>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                                <th className="text-right px-2 py-1.5 border-l border-slate-200 bg-slate-100/60">Unit +{(COMMERCIAL_MARKET_INCREASE*100).toFixed(0)}%</th>
                                <th className="text-right px-2 py-1.5 bg-slate-100/60">Total</th>
                                {eligibleRows.map(r => (
                                  <Fragment key={r.id}>
                                    <th className="text-right px-2 py-1.5 border-l border-slate-200">Unit</th>
                                    <th className="text-right px-2 py-1.5">Total</th>
                                    <th className="text-right px-2 py-1.5">%age</th>
                                  </Fragment>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {SECTIONS.map(sec => (
                                <Fragment key={sec}>
                                  <tr className="bg-[var(--color-primary)]/5 border-y border-slate-100">
                                    <td colSpan={5 + eligibleRows.length * 3} className="px-3 py-1.5 text-[11px] font-bold text-[var(--color-primary)] uppercase tracking-wide">{sec}</td>
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
                                      {eligibleRows.map(r => {
                                        const v = itemVarPct(r.id, it)
                                        return (
                                          <Fragment key={r.id}>
                                            <td className="px-2 py-2 text-right border-l border-slate-100 text-slate-600">{fmtRate(bidUnit(r.id, it))}</td>
                                            <td className="px-2 py-2 text-right text-slate-700">{fmtMoney(bidItemTotal(r.id, it))}</td>
                                            <td className={`px-2 py-2 text-right font-semibold ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{v > 0 ? '+' : ''}{v.toFixed(0)}%</td>
                                          </Fragment>
                                        )
                                      })}
                                    </tr>
                                  ))}
                                  <tr className="bg-slate-50 border-y border-slate-200 font-semibold text-slate-700">
                                    <td colSpan={3} className="px-3 py-2 text-[11px] uppercase">{sec} Subtotal</td>
                                    <td className="border-l border-slate-200 bg-slate-100/50" />
                                    <td className="px-2 py-2 text-right bg-slate-100/50">{fmtMoney(estSection(sec))}</td>
                                    {eligibleRows.map(r => {
                                      const es = estSection(sec)
                                      const v = es ? ((bidSection(r.id, sec) - es) / es) * 100 : 0
                                      return (
                                        <Fragment key={r.id}>
                                          <td className="border-l border-slate-200" />
                                          <td className="px-2 py-2 text-right">{fmtMoney(bidSection(r.id, sec))}</td>
                                          <td className={`px-2 py-2 text-right ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{v > 0 ? '+' : ''}{v.toFixed(0)}%</td>
                                        </Fragment>
                                      )
                                    })}
                                  </tr>
                                </Fragment>
                              ))}
                              <tr className="bg-[var(--color-primary)]/10 border-t-2 border-[var(--color-primary)]/30 font-bold text-slate-800">
                                <td colSpan={3} className="px-3 py-3 uppercase text-xs">Submitted Grand Total</td>
                                <td className="border-l border-slate-200" />
                                <td className="px-2 py-3 text-right">{fmtMoney(estGrand)}</td>
                                {eligibleRows.map(r => {
                                  const v = variancePct(r.id)
                                  return (
                                    <Fragment key={r.id}>
                                      <td className="border-l border-slate-200" />
                                      <td className="px-2 py-3 text-right">{fmtMoney(bidGrand(r.id))}</td>
                                      <td className={`px-2 py-3 text-right ${v <= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>{fmtPct(v)}</td>
                                    </Fragment>
                                  )
                                })}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}

                    {benchTab === 'normalize' && (
                      <>
                        <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">
                          Every bidder restated to the same commercial basis: {N.standardPaymentDays}-day terms, no advance, {N.standardWarrantyMths}-month warranty,
                          {' '}{N.standardBondPct}% performance bond, insured personnel and capped escalation. Financing at {(N.financingRatePa * 100).toFixed(0)}% p.a.
                        </p>
                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 p-4">
                          {eligibleRows.map(r => {
                            const adj = adjustmentsOf(r.id)
                            return (
                              <div key={r.id} className="rounded-xl border border-slate-200 overflow-hidden">
                                <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                                  <span className="text-xs font-semibold text-slate-700">{r.short}</span>
                                  <span className="text-[10px] text-slate-400">{adj.length} adjustment{adj.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="px-3 py-2.5 flex items-center justify-between text-[12px] border-b border-slate-50">
                                  <span className="text-slate-500">Submitted price</span>
                                  <span className="font-semibold text-slate-700">{fmtMoney(bidGrand(r.id))}</span>
                                </div>
                                {adj.length === 0 && (
                                  <div className="px-3 py-2.5 text-[11px] text-slate-400 flex items-center gap-1.5">
                                    <CheckCircle size={11} className="text-emerald-500" /> Fully aligned to the ITT basis — no adjustment.
                                  </div>
                                )}
                                {adj.map(a => (
                                  <div key={a.id} className="px-3 py-2 border-b border-slate-50">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-[11px] text-slate-600">{a.label}</span>
                                      <span className={`text-[11px] font-semibold shrink-0 ${a.amount >= 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                        {a.amount >= 0 ? '+' : '−'}{fmtMoney(Math.abs(a.amount))}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{a.detail}</p>
                                  </div>
                                ))}
                                <div className="px-3 py-2.5 bg-[var(--color-primary)]/5 flex items-center justify-between">
                                  <span className="text-xs font-bold text-slate-700 uppercase">Normalized</span>
                                  <span className="text-sm font-bold text-[var(--color-primary)]">{fmtMoney(normPrice(r.id))}</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}

                    {benchTab === 'benchmark' && (
                      <>
                        <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">
                          Lowest, average and highest submitted unit rate per line. A rate {N.outlierRatePct}% or more away from the line average is flagged as an outlier.
                        </p>
                        <div className="overflow-x-auto">
                          <table className="w-full text-[12px]">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                <th className="text-left px-4 py-2.5 text-xs font-semibold min-w-56">Line Item</th>
                                <th className="text-center px-2 py-2.5 text-xs font-semibold">UOM</th>
                                <th className="text-right px-2 py-2.5 text-xs font-semibold">Estimate</th>
                                <th className="text-right px-2 py-2.5 text-xs font-semibold">Lowest</th>
                                <th className="text-right px-2 py-2.5 text-xs font-semibold">Average</th>
                                <th className="text-right px-2 py-2.5 text-xs font-semibold">Highest</th>
                                <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-44">Outliers</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {rateBenchmark().map(b => (
                                <tr key={b.item.id} className={`hover:bg-slate-50/40 ${b.outliers.length ? 'bg-amber-50/40' : ''}`}>
                                  <td className="px-4 py-2.5"><span className="font-medium text-slate-700">{b.item.no}. {b.item.description}</span></td>
                                  <td className="px-2 py-2.5 text-center text-slate-500">{b.item.uom}</td>
                                  <td className="px-2 py-2.5 text-right text-slate-500">{fmtRate(b.estimateRate)}</td>
                                  <td className="px-2 py-2.5 text-right text-emerald-600 font-semibold">{fmtRate(b.lowest.rate)}<span className="block text-[9px] font-normal text-slate-400">{b.lowest.name}</span></td>
                                  <td className="px-2 py-2.5 text-right text-slate-700 font-medium">{fmtRate(b.average)}</td>
                                  <td className="px-2 py-2.5 text-right text-amber-600 font-semibold">{fmtRate(b.highest.rate)}<span className="block text-[9px] font-normal text-slate-400">{b.highest.name}</span></td>
                                  <td className="px-3 py-2.5">
                                    {b.outliers.length === 0 ? <span className="text-[11px] text-slate-300">—</span>
                                      : b.outliers.map(o => (
                                          <span key={o.id} className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 mr-1 mb-1">
                                            <AlertTriangle size={9} /> {o.name} {fmtPct(((o.rate - b.average) / b.average) * 100, 0)}
                                          </span>
                                        ))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    )}
                  </Card>

                  <StepFooter onBack={goPrev} backLabel="Risk" onNext={goNext} nextLabel="Continue to Sensitivity"
                    hint="The normalized price is the base for the sensitivity analysis and every downstream adjustment." />
                </>
              )}

              {/* ══════════ STEP 5 — SENSITIVITY ANALYSIS ══════════ */}
              {step === 'sensitivity' && (() => {
                const s = stability()
                const meta = commercialStability[s.key]
                const baseName = rowOf(s.baseWinner)?.short
                return (
                  <>
                    <AiStrip>
                      <strong>AI sensitivity analysis complete.</strong> {s.matrix.length} scenarios modelled on the normalized prices. <strong>{baseName}</strong> holds first place in {s.heldPct.toFixed(0)}% of them — {meta.label}.
                    </AiStrip>

                    <div className="flex items-start gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                      <Info size={14} className="text-slate-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-slate-600 leading-relaxed">
                        Sensitivity runs <strong>before</strong> the preference mechanisms so the two questions stay separate: who has the best offer on pure commercial merit, and how the ranking moves once LC, ICV, PAF and Omani Preference are applied.
                      </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                      <Card className="p-4 lg:col-span-1">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Ranking Stability</p>
                        <div className="mt-2"><Badge variant={meta.badge}>{meta.label}</Badge></div>
                        <p className="text-2xl font-bold text-slate-800 mt-2.5">{s.heldPct.toFixed(0)}%</p>
                        <p className="text-[11px] text-slate-400">of scenarios keep {baseName} first</p>
                        <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{meta.hint}</p>
                      </Card>
                      <Card className="p-4 lg:col-span-2">
                        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Index-based adjustment · user defined</p>
                        <div className="flex items-center gap-3">
                          <input type="range" min={-10} max={20} step={1} value={indexPct}
                            onChange={e => setIndexPct(Number(e.target.value))} className="flex-1 accent-[var(--color-primary)]" />
                          <span className="text-sm font-bold text-slate-800 w-16 text-right">{fmtPct(indexPct, 0)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                          Applied to each bidder's escalation-exposed share of scope, on top of every scenario below. Set to 0% for the pure base case.
                        </p>
                        {s.flips.length > 0 && (
                          <p className="text-[11px] text-amber-700 mt-2.5 flex items-start gap-1.5">
                            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
                            Preferred bidder changes under: {s.flips.map(f => `${f.sc.label} → ${f.winner?.name}`).join(' · ')}
                          </p>
                        )}
                      </Card>
                    </div>

                    <Card className="overflow-hidden">
                      <PanelHead icon={Activity} title="Scenario Coverage" hint="Ranges tested" />
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold min-w-56">Scenario</th>
                              <th className="text-left px-3 py-2.5 text-xs font-semibold">Range Tested</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {commercialScenarioFamilies.map(f => (
                              <tr key={f.family} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 text-[12px] text-slate-700 font-medium">{f.family}</td>
                                <td className="px-3 py-2.5 text-[12px] text-slate-500">{f.range}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <Card className="overflow-hidden">
                      <PanelHead icon={BarChart3} title="Ranking Stability Output" hint="Evaluated price per scenario · preferred bidder is the lowest" />
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                              <th className="text-left px-4 py-3 text-xs font-semibold min-w-52">Scenario</th>
                              {eligibleRows.map(r => <th key={r.id} className="text-right px-3 py-3 text-xs font-semibold min-w-32">{r.short}</th>)}
                              <th className="text-center px-3 py-3 text-xs font-semibold min-w-36">Preferred Bidder</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {s.matrix.map(m => {
                              const flipped = m.winner?.id !== s.baseWinner
                              return (
                                <tr key={m.sc.id} className={`hover:bg-slate-50/50 ${flipped ? 'bg-amber-50/40' : ''}`}>
                                  <td className="px-4 py-2.5">
                                    <span className="text-[12px] font-medium text-slate-700">{m.sc.label}</span>
                                    <span className="block text-[10px] text-slate-400">{m.sc.family} · {m.sc.range}</span>
                                  </td>
                                  {m.prices.map(p => (
                                    <td key={p.id} className={`px-3 py-2.5 text-right text-[12px] ${p.id === m.winner?.id ? 'font-bold text-emerald-700' : 'text-slate-600'}`}>
                                      {fmtMoney(p.price)}
                                    </td>
                                  ))}
                                  <td className="px-3 py-2.5 text-center">
                                    <Badge variant={flipped ? 'warning' : 'compliant'}>{m.winner?.name ?? '—'}</Badge>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    </Card>

                    <StepFooter onBack={goPrev} backLabel="Normalization" onNext={goNext}
                      nextLabel="Continue to LC / ICV / PAF"
                      hint="This is the pure commercial merit position, before any policy-driven adjustment." />
                  </>
                )
              })()}

              {/* ══════════ STEP 6 — LC + ICV + PAF + OMANI PREFERENCE ══════════ */}
              {step === 'preference' && (
                <>
                  <AiStrip>
                    <strong>AI preference adjustment complete.</strong> PAF applied at up to {paf.capPct}% (LC {paf.lccWeightingPct}% + ICV {paf.icvWeightingPct}%){paf.applyPreference ? `, with a ${paf.omaniPreferencePct}% Omani Company preference` : ''}. Ranking rebuilt on evaluated price.
                  </AiStrip>

                  <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                    <Lock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-amber-800 leading-relaxed"><strong>Governance note.</strong> {COMMERCIAL_PAF_NOTE}</span>
                  </div>

                  {/* Configuration */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-0.5">PAF Configuration</h3>
                    <p className="text-xs text-slate-400 mb-3">Configurable per tender — this is the single source of truth for evaluation adjustments.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { key: 'lccWeightingPct',    label: 'LCC Weighting %',   max: 20 },
                        { key: 'icvWeightingPct',    label: 'ICV Weighting %',   max: 20 },
                        { key: 'capPct',             label: 'Total LC Cap %',    max: 30 },
                        { key: 'omaniPreferencePct', label: 'Omani Preference %', max: 25 },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="text-[11px] font-semibold text-slate-500">{f.label}</label>
                          <input type="number" min={0} max={f.max} value={paf[f.key]}
                            onChange={e => setPaf(prev => ({ ...prev, [f.key]: Math.max(0, Math.min(f.max, Number(e.target.value) || 0)) }))}
                            className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30" />
                        </div>
                      ))}
                      <div>
                        <label className="text-[11px] font-semibold text-slate-500">PAF Basis</label>
                        <select value={paf.basis} onChange={e => setPaf(prev => ({ ...prev, basis: e.target.value }))}
                          className="mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
                          <option value="normalized">Normalized price (price normalization)</option>
                          <option value="submitted">Submitted bid price</option>
                        </select>
                      </div>
                    </div>
                    <label className="flex items-center gap-2 mt-3 cursor-pointer">
                      <input type="checkbox" checked={paf.applyPreference}
                        onChange={e => setPaf(prev => ({ ...prev, applyPreference: e.target.checked }))}
                        className="accent-[var(--color-primary)]" />
                      <span className="text-xs text-slate-600">Apply Omani Company / SME / Omani JV preference</span>
                    </label>
                  </Card>

                  {/* Methodology */}
                  <Card className="p-4">
                    <h3 className="text-sm font-semibold text-slate-800 mb-2">PAF Methodology</h3>
                    <pre className="text-[11px] leading-relaxed text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3 overflow-x-auto">{
`LCC Adjustment Factor  =  LC Score           x  LCC Weighting %
ICV Adjustment Factor  =  ICV Retained Value x  ICV Weighting %
Total LC Adjustment    =  LCC Adjustment + ICV Adjustment   (capped at ${paf.capPct}%)
Adjustment Value       =  Bid Price x Total LC Adjustment
Evaluated Price        =  Bid Price - Adjustment Value`}</pre>
                  </Card>

                  <Card className="overflow-hidden">
                    <PanelHead icon={Globe} title="Evaluated Price — PAF & Omani Preference"
                      hint={`Basis: ${paf.basis === 'submitted' ? 'submitted bid price' : 'normalized price (price normalization)'}`} />
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <th className="text-left px-4 py-3 text-xs font-semibold min-w-36">Bidder</th>
                            <th className="text-left px-3 py-3 text-xs font-semibold min-w-32">Type</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold">Bid Price</th>
                            <th className="text-center px-3 py-3 text-xs font-semibold">LC Score</th>
                            <th className="text-center px-3 py-3 text-xs font-semibold">ICV Value</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold">Total PAF</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold">Adjustment</th>
                            <th className="text-right px-3 py-3 text-xs font-semibold">Evaluated Price</th>
                            {paf.applyPreference && <th className="text-right px-4 py-3 text-xs font-semibold">Preference Price</th>}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {[...eligibleRows].sort((a, b) => pafOf(a.id).preferencePrice - pafOf(b.id).preferencePrice).map((r, i) => {
                            const c = pafOf(r.id)
                            return (
                              <tr key={r.id} className={`hover:bg-slate-50/50 ${i === 0 ? 'bg-emerald-50/40' : ''}`}>
                                <td className="px-4 py-3">
                                  <span className="text-[12px] font-semibold text-slate-700">{r.short}</span>
                                  {i === 0 && <Badge variant="success" className="ml-2">Preferred</Badge>}
                                </td>
                                <td className="px-3 py-3 text-[11px] text-slate-500">
                                  {c.entityType}{c.eligible && <span className="block text-[10px] text-emerald-600 font-semibold">Preference eligible</span>}
                                </td>
                                <td className="px-3 py-3 text-right text-[12px] text-slate-600">{fmtMoney(c.basePrice)}</td>
                                <td className="px-3 py-3 text-center text-[12px] text-slate-600">{c.lcScorePct}%</td>
                                <td className="px-3 py-3 text-center text-[12px] text-slate-600">{c.icvRetainedPct}%</td>
                                <td className="px-3 py-3 text-right text-[12px] font-semibold text-violet-700">
                                  {(c.totalPaf * 100).toFixed(2)}%
                                  {c.capped && <span className="block text-[9px] font-normal text-amber-600">capped</span>}
                                </td>
                                <td className="px-3 py-3 text-right text-[12px] text-emerald-600">−{fmtMoney(c.adjustmentValue)}</td>
                                <td className="px-3 py-3 text-right text-[12px] font-semibold text-slate-800">{fmtMoney(c.evaluatedPrice)}</td>
                                {paf.applyPreference && (
                                  <td className="px-4 py-3 text-right text-[12px] font-bold text-[var(--color-primary)]">{fmtMoney(c.preferencePrice)}</td>
                                )}
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                      <p className="text-[10px] text-slate-500 leading-relaxed">
                        Omani preference is applied as a {paf.omaniPreferencePct}% reduction on the PAF-adjusted evaluation price for eligible entities
                        (Omani Company, Omani SME, Omani JV). Evaluation only — award remains at the submitted bid price.
                      </p>
                    </div>
                  </Card>

                  <StepFooter onBack={goPrev} backLabel="Sensitivity" onNext={goNext}
                    nextLabel="Continue to Negotiation" onSkip={skipStep}
                    hint="Optional step — skip it to leave the ranking on the normalized commercial price." />
                </>
              )}

              {/* ══════════ STEP 7 — NEGOTIATION STRATEGY ══════════ */}
              {step === 'negotiation' && (
                <>
                  <AiStrip>
                    <strong>AI negotiation scan complete.</strong> {eligibleRows.reduce((s, r) => s + opportunitiesOf(r.id).length, 0)} value-improvement opportunities identified. Select the ones to pursue to build the negotiation position.
                  </AiStrip>

                  <div className="flex items-start gap-2.5 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-xl">
                    <Handshake size={14} className="text-violet-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-violet-800 leading-relaxed">
                      Activated only where the tendering strategy permits commercial negotiations. Savings are <strong>indicative</strong> — they do not change the evaluated price.
                    </span>
                  </div>

                  {pickedSavings > 0 && (
                    <Card className="p-4 border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Selected negotiation position</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">{fmtMoney(pickedSavings)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">total indicative saving across the selected opportunities</p>
                    </Card>
                  )}

                  {eligibleRows.map(r => {
                    const ops = opportunitiesOf(r.id)
                    const chosen = ops.filter(o => negoPicked[`${r.id}:${o.id}`])
                    return (
                      <Card key={r.id} className="overflow-hidden">
                        <PanelHead icon={Handshake} title={r.name}
                          hint={`${ops.length} opportunit${ops.length === 1 ? 'y' : 'ies'} · ${chosen.length} selected · ${fmtMoney(chosen.reduce((s, o) => s + o.savings, 0))} indicative`} />
                        {ops.length === 0 ? (
                          <p className="px-4 py-6 text-xs text-slate-400 text-center">No negotiable positions identified — the offer is already at or below the OLNG benchmark.</p>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                  <th className="text-left px-4 py-2.5 text-xs font-semibold min-w-64">Opportunity</th>
                                  <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-80">Basis</th>
                                  <th className="text-right px-3 py-2.5 text-xs font-semibold">Indicative Saving</th>
                                  <th className="text-center px-3 py-2.5 text-xs font-semibold min-w-28">Pursue</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {ops.map(o => {
                                  const key = `${r.id}:${o.id}`
                                  const on = !!negoPicked[key]
                                  return (
                                    <tr key={o.id} className={`hover:bg-slate-50/50 ${on ? 'bg-emerald-50/40' : ''}`}>
                                      <td className="px-4 py-2.5 text-[12px] font-medium text-slate-700">{o.title}</td>
                                      <td className="px-3 py-2.5 text-[11px] text-slate-500 leading-relaxed">{o.basis}</td>
                                      <td className="px-3 py-2.5 text-right">
                                        <span className="text-[12px] font-semibold text-emerald-700">{fmtMoney(o.savings)}</span>
                                        <span className="block text-[10px] text-slate-400">{o.unit}</span>
                                      </td>
                                      <td className="px-3 py-2.5 text-center">
                                        <button onClick={() => setNegoPicked(prev => ({ ...prev, [key]: !prev[key] }))}
                                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors
                                            ${on ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                                          {on ? <><CheckCircle size={11} /> Selected</> : 'Select'}
                                        </button>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </Card>
                    )
                  })}

                  <StepFooter onBack={goPrev} backLabel="LC / ICV / PAF"
                    onNext={goNext} nextLabel="Continue to Clarifications" onSkip={skipStep}
                    hint="Optional step — skip it where the tendering strategy does not permit commercial negotiation." />
                </>
              )}

              {/* ══════════ STEP 8 — CLARIFICATION MANAGEMENT ══════════ */}
              {step === 'clarification' && (
                <>
                  <AiStrip>
                    <strong>AI clarification drafting complete.</strong> {clarifications.length} clarification request{clarifications.length !== 1 ? 's' : ''} drafted from the findings of the preceding steps · {closedClarifications.length} closed · {openClarifications.length} outstanding.
                  </AiStrip>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {Object.entries(commercialClarificationStatuses).map(([k, meta]) => (
                      <Card key={k} className="p-4">
                        <p className="text-xs font-semibold text-slate-600">{meta.label}</p>
                        <p className="text-xl font-bold text-slate-800 mt-1">{clarifications.filter(c => c.status === k).length}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">clarification{clarifications.filter(c => c.status === k).length !== 1 ? 's' : ''}</p>
                      </Card>
                    ))}
                  </div>

                  <Card className="overflow-hidden">
                    <PanelHead icon={MessageSquare} title="Clarification Register & Closure Tracker"
                      hint={`${closedClarifications.length} of ${clarifications.length} closed`}
                      action={
                        <div className="flex items-center gap-2">
                          <Button variant="secondary" size="sm"
                            disabled={!clarifications.some(c => c.status === 'draft')}
                            onClick={exportAllClarifications}>
                            <Download size={12} /> Export all drafts
                          </Button>
                          <Button size="sm"
                            disabled={!clarifications.some(c => c.status === 'responded')}
                            onClick={() => setClarifications(prev => prev.map(c => c.status === 'responded' ? { ...c, status: 'closed' } : c))}>
                            <CheckCircle size={12} /> Close all responded
                          </Button>
                        </div>
                      } />
                    {clarifications.length === 0 ? (
                      <p className="px-4 py-8 text-xs text-slate-400 text-center">No clarifications required — no open findings from the preceding steps.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                              <th className="text-left px-4 py-3 text-xs font-semibold">Ref</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold min-w-32">Bidder</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold min-w-44">Subject</th>
                              <th className="text-left px-3 py-3 text-xs font-semibold min-w-80">Request &amp; Uploaded Response</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold">Status</th>
                              <th className="text-center px-3 py-3 text-xs font-semibold min-w-40">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {clarifications.map(c => {
                              const meta = commercialClarificationStatuses[c.status]
                              return (
                                <tr key={c.ref} className={`hover:bg-slate-50/50 align-top ${c.status === 'closed' ? 'opacity-60' : ''}`}>
                                  <td className="px-4 py-3 text-[11px] font-mono text-slate-500">{c.ref}</td>
                                  <td className="px-3 py-3 text-[12px] font-semibold text-slate-700">{String(c.bidderName).split(' ')[0]}</td>
                                  <td className="px-3 py-3 text-[12px] text-slate-600">{c.subject}</td>
                                  <td className="px-3 py-3">
                                    <p className="text-[11px] text-slate-500 leading-relaxed">{c.request}</p>
                                    {c.responseFile && (
                                      <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1.5">
                                        <Paperclip size={10} className="text-slate-400 shrink-0" />
                                        <span className="font-medium text-slate-600 truncate">{c.responseFile}</span>
                                      </p>
                                    )}
                                    {c.response && (
                                      <p className="text-[11px] text-emerald-700 mt-1.5 leading-relaxed border-l-2 border-emerald-200 pl-2">
                                        <strong>Bidder response:</strong> {c.response}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 text-center"><Badge variant={meta.badge}>{meta.label}</Badge></td>
                                  <td className="px-3 py-3 text-center">
                                    {c.status === 'draft' && (
                                      <Button variant="secondary" size="sm" onClick={() => exportClarification(c)}>
                                        <Download size={11} /> Export
                                      </Button>
                                    )}
                                    {c.status === 'exported' && (
                                      <div className="flex items-center justify-center gap-1.5">
                                        <Button variant="secondary" size="sm" onClick={() => exportClarification(c)}>
                                          <Download size={11} />
                                        </Button>
                                        <label className="inline-flex">
                                          <input type="file" className="hidden"
                                            accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
                                            onChange={e => uploadClarificationResponse(c, e.target.files?.[0], e)} />
                                          <span className="inline-flex items-center gap-1 cursor-pointer text-[11px] font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] bg-white transition-colors whitespace-nowrap">
                                            <Upload size={11} /> Upload response
                                          </span>
                                        </label>
                                      </div>
                                    )}
                                    {c.status === 'responded' && (
                                      <Button size="sm" onClick={() => setClar(c.ref, { status: 'closed' })}><CheckCircle size={11} /> Close</Button>
                                    )}
                                    {c.status === 'closed' && <span className="text-[11px] text-slate-400">Closed</span>}
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>

                  <StepFooter onBack={goPrev} backLabel={scenario ? steps[6].short : 'Negotiation'}
                    onNext={goNext} nextLabel={`Continue to ${scenario ? steps[8].short : 'Award Recommendation'}`}
                    hint={openClarifications.length > 0
                      ? `${openClarifications.length} clarification${openClarifications.length !== 1 ? 's' : ''} still outstanding — close them before submitting the recommendation.`
                      : 'All clarifications closed.'} />
                </>
              )}

              {/* ══════════ STEP 9 — AWARD RECOMMENDATION ══════════ */}
              {step === 'award' && (
                <>
                  {!priorStepsDone ? (
                    <Card className="p-6 text-center">
                      <Lock size={22} className="text-slate-300 mx-auto" />
                      <p className="text-sm font-semibold text-slate-700 mt-2">Award Recommendation is locked</p>
                      <p className="text-xs text-slate-400 mt-1">
                        Every preceding step must complete first — still open: {steps.slice(0, -1).filter(s => !isDone(s.id)).map(s => `${s.no} · ${s.short}`).join(', ')}.
                      </p>
                    </Card>
                  ) : (
                    <>
                      <AiStrip>
                        <strong>AI consolidation complete.</strong> Outputs from every preceding step consolidated. Ranking basis: {rankingBasis}.
                      </AiStrip>

                      {/* Recommendation */}
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
                                Lowest evaluated price at <strong>{fmtMoney(evaluatedPriceOf(recBidder.id))}</strong> — submitted bid {fmtMoney(bidGrand(recBidder.id))},{' '}
                                {variancePct(recBidder.id) <= 0
                                  ? <span className="text-emerald-700 font-semibold">{Math.abs(variancePct(recBidder.id)).toFixed(1)}% below</span>
                                  : <span className="text-amber-700 font-semibold">{variancePct(recBidder.id).toFixed(1)}% above</span>} the company estimate of {fmtMoney(estGrand)}.
                                This is a suggestion — the Commercial Evaluator's recommendation is recorded, not a score.
                              </p>
                            </div>
                          </div>

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
                                    <span className="font-semibold">{b.short}</span>
                                    <span className="text-slate-400">{fmtMoney(evaluatedPriceOf(b.id))}</span>
                                    {i === 0 && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Lowest</span>}
                                  </button>
                                )
                              })}
                            </div>
                            <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
                              placeholder="Optional note on the recommendation (e.g. reason for not selecting the lowest evaluated price)…"
                              className="mt-3 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none" />
                          </div>
                        </Card>
                      )}

                      {preferenceOn && (
                        <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                          <Lock size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <span className="text-xs text-amber-800 leading-relaxed"><strong>Governance note.</strong> {COMMERCIAL_PAF_NOTE}</span>
                        </div>
                      )}

                      {/* Consolidated ranking */}
                      <Card className="overflow-hidden">
                        <PanelHead icon={Award} title="Consolidated Evaluated Price Ranking" hint={rankingBasis} />
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                                <th className="text-left px-4 py-3 text-xs font-semibold">Rank</th>
                                <th className="text-left px-3 py-3 text-xs font-semibold min-w-40">Bidder</th>
                                <th className="text-center px-3 py-3 text-xs font-semibold min-w-40">Responsiveness</th>
                                <th className="text-center px-3 py-3 text-xs font-semibold">Risk</th>
                                <th className="text-right px-3 py-3 text-xs font-semibold">Submitted</th>
                                <th className="text-right px-3 py-3 text-xs font-semibold">Normalized</th>
                                {preferenceOn && <th className="text-right px-3 py-3 text-xs font-semibold">PAF</th>}
                                <th className="text-right px-4 py-3 text-xs font-semibold">Evaluated</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {ranked.map((r, i) => {
                                const meta = commercialResponsiveness[responsivenessOf(r.id)]
                                return (
                                  <tr key={r.id} className={`hover:bg-slate-50/50 ${effectiveRecId === r.id ? 'bg-emerald-50/50' : ''}`}>
                                    <td className="px-4 py-3 text-[12px] font-bold text-slate-500">#{i + 1}</td>
                                    <td className="px-3 py-3 text-[12px] font-semibold text-slate-700">
                                      {r.name}
                                      {effectiveRecId === r.id && <Badge variant="success" className="ml-2">Recommended</Badge>}
                                    </td>
                                    <td className="px-3 py-3 text-center"><Badge variant={meta.badge}>{meta.label}</Badge></td>
                                    <td className="px-3 py-3 text-center"><Badge variant={BAND_BADGE[riskBandOf(r.id)]}>{riskBandOf(r.id)}</Badge></td>
                                    <td className="px-3 py-3 text-right text-[12px] text-slate-600">{fmtMoney(bidGrand(r.id))}</td>
                                    <td className="px-3 py-3 text-right text-[12px] text-slate-600">{fmtMoney(normPrice(r.id))}</td>
                                    {preferenceOn && <td className="px-3 py-3 text-right text-[12px] text-violet-700">{(pafOf(r.id).totalPaf * 100).toFixed(2)}%</td>}
                                    <td className="px-4 py-3 text-right text-[12px] font-bold text-slate-800">{fmtMoney(evaluatedPriceOf(r.id))}</td>
                                  </tr>
                                )
                              })}
                              {excludedRows.map(r => (
                                <tr key={r.id} className="opacity-50">
                                  <td className="px-4 py-3 text-[12px] text-slate-400">—</td>
                                  <td className="px-3 py-3 text-[12px] text-slate-500">{r.name}</td>
                                  <td className="px-3 py-3 text-center"><Badge variant="non_compliant">Non-Responsive</Badge></td>
                                  <td colSpan={preferenceOn ? 5 : 4} className="px-3 py-3 text-[11px] text-slate-400">Excluded at the mandatory submission gate</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Card>

                      {/* Audit trail */}
                      <Card className="overflow-hidden">
                        <PanelHead icon={FileText} title="Evaluation Audit Trail" hint="What each step contributed to this recommendation" />
                        <div className="divide-y divide-slate-50">
                          {steps.map(s => {
                            const wasSkipped = isSkipped(s.id)
                            const done = !wasSkipped && isDone(s.id)
                            return (
                              <div key={s.id} className="px-4 py-3 flex items-start gap-3">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold
                                  ${done ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>{s.no}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={`text-[12px] font-semibold ${wasSkipped ? 'text-slate-400' : 'text-slate-700'}`}>{s.name}</span>
                                    {wasSkipped ? <Badge variant="closed"><MinusCircle size={10} /> Skipped</Badge>
                                      : done ? <Badge variant="compliant"><CheckCircle size={10} /> Complete</Badge>
                                      : <Badge variant="warning">Not run</Badge>}
                                  </div>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{auditLine(s.id)}</p>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </Card>

                      {/* Submit */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between flex-wrap gap-4">
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">Submit Commercial Recommendation</h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {recBidder
                                ? <>Recommending <strong>{recBidder.name}</strong> — evaluated at {fmtMoney(evaluatedPriceOf(recBidder.id))}, awarded at the submitted bid price of {fmtMoney(bidGrand(recBidder.id))}. This recommendation (not a score) is sent to Supply Chain's commercial &amp; award gate.</>
                                : 'Select a bidder to recommend.'}
                            </p>
                            {openClarifications.length > 0 && (
                              <p className="text-xs text-amber-700 mt-1.5 flex items-center gap-1.5">
                                <AlertTriangle size={12} /> {openClarifications.length} clarification{openClarifications.length !== 1 ? 's' : ''} still open — close them in the clarifications step before submitting.
                              </p>
                            )}
                            {docBlockHint && (
                              <p className="text-xs text-amber-700 mt-1.5 flex items-start gap-1.5">
                                <AlertTriangle size={12} className="shrink-0 mt-0.5" /> {docBlockHint}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="secondary" size="sm" onClick={goPrev}><ArrowLeft size={13} /> Clarifications</Button>
                            <Button size="sm" disabled={!recBidder || openClarifications.length > 0 || docRoundOpen} onClick={handleSubmit}>
                              <Send size={13} /> Submit Recommendation
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

/* ── Small shared bits, in the same visual language as the rest of the page ── */

function AiStrip({ children }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
      <Bot size={14} className="text-blue-600 shrink-0 mt-0.5" />
      <span className="text-xs text-blue-800 leading-relaxed">{children}</span>
    </div>
  )
}

function PanelHead({ icon: Icon, title, hint, action }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
      {Icon && <Icon size={15} className="text-[var(--color-primary)]" />}
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

function Chip({ tone, children }) {
  const cls = tone === 'red' ? 'bg-red-50 text-red-600 border-red-200'
    : tone === 'amber' ? 'bg-amber-50 text-amber-700 border-amber-200'
    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
  return <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${cls}`}>{children}</span>
}

function Register({ title, entries, empty, tone, prefix }) {
  const headTone = tone === 'red' ? 'text-red-500' : 'text-amber-500'
  return (
    <Card className="overflow-hidden">
      <PanelHead icon={tone === 'red' ? XCircle : AlertTriangle} title={title} hint={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`} />
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-xs text-slate-400 text-center">{empty}</p>
      ) : (
        <div className="divide-y divide-slate-50">
          {entries.map((e, i) => (
            <div key={`${e.row.id}-${e.item.id}`} className="px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-mono font-bold ${headTone}`}>{prefix}-{String(i + 1).padStart(2, '0')}</span>
                <span className="text-xs font-semibold text-slate-700">{e.row.short}</span>
                <span className="text-slate-300">·</span>
                <span className="text-xs text-slate-600">{e.item.name}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{e.note || 'Departs from the ITT commercial condition.'}</p>
              <p className="text-[10px] text-slate-400 mt-1">ITT requirement: {e.item.requirement}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

function StepFooter({
  onBack, backLabel, onNext, nextLabel, nextDisabled, block, hint,
  onSkip, skipLabel = 'Skip this step', onInclude, includeLabel = 'Include this step',
}) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="min-w-0">
          {block
            ? <p className="text-xs text-amber-700 flex items-center gap-1.5"><AlertTriangle size={12} /> {block}</p>
            : hint && <p className="text-xs text-slate-400">{hint}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {onBack && <Button variant="secondary" size="sm" onClick={onBack}><ArrowLeft size={13} /> {backLabel}</Button>}
          {onSkip && (
            <button onClick={onSkip}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer">
              <MinusCircle size={13} /> {skipLabel}
            </button>
          )}
          {onInclude && (
            <button onClick={onInclude}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700 transition-colors cursor-pointer">
              <RotateCcw size={13} /> {includeLabel}
            </button>
          )}
          {onNext && <Button size="sm" disabled={nextDisabled} onClick={onNext}>{nextLabel} <ArrowRight size={13} /></Button>}
        </div>
      </div>
    </Card>
  )
}
