import { useState, useEffect, useRef } from 'react'
import { Upload, FileArchive, CheckCircle, Clock, Bot, X, AlertCircle, ArrowLeft, ChevronRight, Users, Calendar, Building2, Lock, Activity, UserPlus, Save, Phone, Bell, FileText, AlertTriangle, Send, UploadCloud, Ban, RotateCcw, Wrench, Wallet, GitBranch, ArrowRightLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useBackHandler, useDismissable } from '../context/NavigationContext'
import { tenderRef } from '../utils/tenderRef'


const stageColor = {
  upload: 'bg-blue-100 text-blue-700', evaluation: 'bg-amber-100 text-amber-700',
  review: 'bg-blue-50 text-blue-700', award: 'bg-green-100 text-green-700', draft: 'bg-slate-100 text-slate-600',
}
const stageLabel = {
  upload: 'Awaiting Upload', evaluation: 'In Evaluation',
  review: 'In Review', award: 'Award Stage', draft: 'Draft',
}

const LOG_MESSAGES = [
  'Parsing document structure and headers',
  'Extracting compliance clause references',
  'Mapping bid line items to evaluation criteria',
  'Identifying technical specification responses',
  'Indexing pricing tables and financial data',
  'Processing annexures and supporting documents',
  'Running named entity recognition',
  'Validating extracted event sequences',
  'Cross-referencing ITT requirements',
  'Finalising extraction index',
]

export default function BidderUpload() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { tenders, advanceTender, updateTender, uploadParallelReport } = useTenders()
  const { lang, t, } = useLanguage()
  const uploadTenders = tenders.filter(t => t.status === 'upload')

  const paramTender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const [selectedTender, setSelectedTender] = useState(paramTender || null)
  const [bidders, setBidders] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [showTracker, setShowTracker] = useState(false)
  const [logEntries, setLogEntries] = useState([])

  // Ingestion document-collection mode:
  //   linear   → only the Technical document is collected now; the Commercial
  //              document arrives later at the commercial evaluation stage.
  //   parallel → both Technical and Commercial documents are collected now.
  const [evalMode, setEvalMode] = useState('linear')

  // Add Bidder modal
  const [showAddBidder, setShowAddBidder] = useState(false)
  const [bidderForm, setBidderForm] = useState({ company: '', contact: '', phone: '' })
  const [bidderErrors, setBidderErrors] = useState({})


  // Correction request portal (for POF re-upload flow)
  const [correctionTender,    setCorrectionTender]    = useState(null)
  const [correctionUploads,   setCorrectionUploads]   = useState({}) // { bidderId-docId: fileName }
  const [correctionSubmitted, setCorrectionSubmitted] = useState({}) // { bidderId: true }
  const [correctionExtracting,   setCorrectionExtracting]   = useState({}) // { bidderId: bool }
  const [correctionExtracted,    setCorrectionExtracted]    = useState({}) // { bidderId: bool }
  const [correctionExtractPct,   setCorrectionExtractPct]   = useState({}) // { bidderId: 0-100 }
  const [correctionGeneral,      setCorrectionGeneral]      = useState({}) // { bidderId: [{name,size}] }

  const biddersRef = useRef(bidders)
  useEffect(() => { biddersRef.current = bidders }, [bidders])

  // Live extraction log
  useEffect(() => {
    if (!showTracker) return
    let idx = 0
    const interval = setInterval(() => {
      const processing = biddersRef.current.find(b => b.status === 'processing')
      if (processing) {
        setLogEntries(prev => [
          `${processing.company} — ${LOG_MESSAGES[idx % LOG_MESSAGES.length]}`,
          ...prev.slice(0, 8),
        ])
        idx++
      }
    }, 700)
    return () => clearInterval(interval)
  }, [showTracker])

  // Extraction engine — only runs when extracting === true
  useEffect(() => {
    if (!extracting) return
    const interval = setInterval(() => {
      setBidders(prev => {
        const uploaded = prev.filter(b => ['queued', 'processing', 'completed'].includes(b.status))
        if (uploaded.length === 0 || uploaded.every(b => b.status === 'completed')) return prev
        const hasProcessing = prev.some(b => b.status === 'processing')
        return prev.map(b => {
          if (b.status === 'queued' && !hasProcessing) return { ...b, status: 'processing' }
          if (b.status === 'processing') {
            const max = b._max || 142
            const next = Math.min(b.extracted + Math.ceil(max / 14), max)
            return next >= max ? { ...b, status: 'completed', extracted: max } : { ...b, extracted: next }
          }
          return b
        })
      })
    }, 300)
    return () => clearInterval(interval)
  }, [extracting])

  // Stop when all uploaded bidders are extracted
  useEffect(() => {
    const uploaded = bidders.filter(b => ['queued', 'processing', 'completed'].includes(b.status))
    if (extracting && uploaded.length > 0 && uploaded.every(b => b.status === 'completed')) {
      setExtracting(false)
    }
  }, [bidders, extracting])

  // Correction extraction animation
  useEffect(() => {
    const anyRunning = Object.values(correctionExtracting).some(Boolean)
    if (!anyRunning) return
    const interval = setInterval(() => {
      setCorrectionExtractPct(prev => {
        const next = { ...prev }
        Object.entries(correctionExtracting).forEach(([id, running]) => {
          if (running && (next[id] || 0) < 100) next[id] = Math.min((next[id] || 0) + 8, 100)
        })
        return next
      })
    }, 300)
    return () => clearInterval(interval)
  }, [correctionExtracting])

  // Mark extraction complete when pct hits 100
  useEffect(() => {
    const doneIds = Object.entries(correctionExtractPct)
      .filter(([id, pct]) => pct >= 100 && correctionExtracting[id])
      .map(([id]) => id)
    if (doneIds.length === 0) return
    setCorrectionExtracting(prev => { const n = { ...prev }; doneIds.forEach(id => { n[id] = false }); return n })
    setCorrectionExtracted(prev => { const n = { ...prev }; doneIds.forEach(id => { n[id] = true }); return n })
  }, [correctionExtractPct, correctionExtracting])

  // ── Handlers ──

  const closeCorrectionPortal = () => {
    setCorrectionTender(null); setCorrectionUploads({}); setCorrectionSubmitted({})
    setCorrectionExtracting({}); setCorrectionExtracted({}); setCorrectionExtractPct({}); setCorrectionGeneral({})
  }

  const exitTenderDetail = () => tenderId ? navigate('/tenders') : setSelectedTender(null)

  // Modals sit above the page — Back closes the topmost one before any in-page
  // or route unwinding. Each mirrors its own X / Cancel reset.
  useDismissable(showTracker, () => setShowTracker(false))
  useDismissable(showAddBidder, () => setShowAddBidder(false))

  // Shared Back unwinds in-page state first. With a :tenderId param the detail
  // IS the route, so we decline and let route-level back run.
  useBackHandler(() => {
    if (correctionTender) { closeCorrectionPortal(); return true }
    if (selectedTender && !tenderId) { setSelectedTender(null); return true }
    return false
  }, [correctionTender, selectedTender, tenderId])

  const fmtSize = (bytes) => bytes > 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${(bytes / 1024).toFixed(0)} KB`

  // Parallel collects both documents at ingestion. Linear collects only the
  // Technical document now — the Commercial document is uploaded later, once
  // technical evaluation completes, at the commercial evaluation stage.
  const docsComplete = (b) => evalMode === 'parallel' ? !!(b.techDoc && b.commDoc) : !!b.techDoc

  // Recompute a bidder's status after a document change: queued once both docs
  // are present (unless already processing/completed/opted-out).
  const withStatus = (b) => {
    if (b.status === 'not_participating') return b
    if (['processing', 'completed'].includes(b.status)) return b
    return { ...b, status: docsComplete(b) ? 'queued' : 'no_document' }
  }

  // Switching the flow changes what "complete" means at ingestion (linear needs
  // only the Technical document), so re-derive each bidder's status.
  const changeEvalMode = (mode) => {
    setEvalMode(mode)
    setBidders(prev => prev.map(b => {
      if (b.status === 'not_participating') return b
      if (['processing', 'completed'].includes(b.status)) return b
      const complete = mode === 'parallel' ? !!(b.techDoc && b.commDoc) : !!b.techDoc
      return { ...b, status: complete ? 'queued' : 'no_document' }
    }))
  }

  const attachDocToBidder = (bidderId, docType, incoming) => {
    const file = Array.from(incoming)[0]
    if (!file) return
    const docKey = docType === 'commercial' ? 'commDoc' : 'techDoc'
    const doc = { name: file.name, size: fmtSize(file.size) }
    setBidders(prev => prev.map(b =>
      b.id === bidderId ? withStatus({ ...b, [docKey]: doc }) : b
    ))
  }

  const removeDoc = (bidderId, docType) => {
    const docKey = docType === 'commercial' ? 'commDoc' : 'techDoc'
    setBidders(prev => prev.map(b =>
      b.id === bidderId ? withStatus({ ...b, [docKey]: null, extracted: 0, status: b.status === 'not_participating' ? 'not_participating' : b.status }) : b
    ))
  }

  const markNotParticipating = (bidderId) => {
    const b = bidders.find(x => x.id === bidderId)
    if (!b) return
    if (!window.confirm(`Mark "${b.company}" as Not Participating?\n\nThey will be excluded from extraction and evaluation. You can restore them later.`)) return
    setBidders(prev => prev.map(x =>
      x.id === bidderId ? { ...x, status: 'not_participating', extracted: 0 } : x
    ))
  }

  const restoreBidder = (bidderId) => {
    setBidders(prev => prev.map(x =>
      x.id === bidderId ? withStatus({ ...x, status: 'no_document' }) : x
    ))
  }

  const submitAddBidder = () => {
    const errs = {}
    if (!bidderForm.company.trim()) errs.company = 'Company name is required'
    if (!bidderForm.contact.trim()) errs.contact = 'Contact person is required'
    if (Object.keys(errs).length) { setBidderErrors(errs); return }
    const newId = Math.max(0, ...bidders.map(b => b.id)) + 1
    setBidders(prev => [...prev, {
      id: newId, company: bidderForm.company.trim(), contact: bidderForm.contact.trim(),
      phone: bidderForm.phone.trim(),
      techDoc: null, commDoc: null, status: 'no_document', extracted: 0, _max: 120,
    }])
    setBidderForm({ company: '', contact: '', phone: '' })
    setBidderErrors({})
    setShowAddBidder(false)
  }

  const statusBadge = {
    completed:   <Badge variant="success"><CheckCircle size={10} /> {t('bidder.extracted')}</Badge>,
    processing:  <Badge variant="warning"><Clock size={10} /> {t('bidder.processing')}</Badge>,
    queued:      <Badge variant="info">{t('bidder.queued')}</Badge>,
    no_document: <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{t('ing.awaitingDoc')}</span>,
    not_participating: <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">Not Participating</span>,
    error:       <Badge variant="error"><AlertCircle size={10} /> {lang === 'ar' ? 'خطأ' : 'Error'}</Badge>,
  }

  const activeBidders = bidders.filter(b => b.status !== 'not_participating')
  const uploadedBidders = bidders.filter(b => ['queued', 'processing', 'completed'].includes(b.status))
  const allExtracted = activeBidders.length > 0 &&
    activeBidders.every(b => b.status === 'completed') &&
    uploadedBidders.length > 0
  const hasQueued = bidders.some(b => b.status === 'queued')

  // Pre-qualified bidder companies carried over from the tender (Pre-Qual / PSF).
  // Offered as dropdown suggestions when registering bidders / assigning documents.
  const qualifiedCompanies = (Array.isArray(selectedTender?.bidderList) ? selectedTender.bidderList : [])
    .map(b => b.name)
    .filter(Boolean)

  // Tenders awaiting POF upload of evaluation reports
  // Pending evaluation-report uploads. Linear tenders expose one report at a time
  // (via their export status); parallel tenders can expose both sides at once.
  const pendingReports = []
  tenders.forEach(t => {
    if (t.status === 'tech_eval_export') pendingReports.push({ tender: t, side: 'tech', mode: 'linear' })
    if (t.status === 'comm_eval_export') pendingReports.push({ tender: t, side: 'comm', mode: 'linear' })
    if (t.status === 'parallel_eval') {
      if (t.techSide === 'awaiting_report') pendingReports.push({ tender: t, side: 'tech', mode: 'parallel' })
      if (t.commSide === 'awaiting_report') pendingReports.push({ tender: t, side: 'comm', mode: 'parallel' })
    }
  })
  const [evalUploaded, setEvalUploaded] = useState({}) // { `${tenderId}-${side}`: true }
  const [evalDragging, setEvalDragging] = useState({}) // { `${tenderId}-${side}`: true }

  // Tenders in tech_eval with pending correction requests for the POF
  const correctionTenders = tenders.filter(
    t => t.correctionRequests?.some(r => !r.resolved)
  )

  // One combined list for the picker screen — a correction-request tender
  // reads as just another row (flagged, not routed to its own separate
  // section) alongside everything else awaiting ingestion.
  const ingestionList = [
    ...uploadTenders.map(tender => ({ tender, isCorrection: false })),
    ...correctionTenders.map(tender => ({ tender, isCorrection: true })),
  ]

  const handleCorrectionFileSelect = (bidderId, docId, file) => {
    if (!file) return
    const key = `${bidderId}-${docId}`
    setCorrectionUploads(prev => ({ ...prev, [key]: file.name }))
  }

  const handleSubmitCorrection = (tender, bidderId) => {
    // Always use live tender from context — correctionTender is a stale snapshot.
    // Re-mapping a stale snapshot overwrites previously resolved bidders back to unresolved.
    const liveTender = tenders.find(t => t.id === tender.id) || tender
    const updated = (liveTender.correctionRequests || []).map(r =>
      r.bidderId === bidderId ? { ...r, resolved: true } : r
    )
    updateTender(tender.id, { correctionRequests: updated })
    setCorrectionSubmitted(prev => ({ ...prev, [`${tender.id}-${bidderId}`]: true }))
  }

  // No separate assignment step at ingestion: technical evaluation is owned by
  // the Contract Holder role (left unassigned — canEvaluate already falls back
  // to "any Contract Holder" for an unassigned tech side); commercial goes to
  // whichever Contract Engineer was assigned at the Contract Initiating Form
  // or Create ITT, carried straight through from the tender record.
  const proceedToEvaluation = () => {
    const bidderList = activeBidders.map(b => ({
      id: b.id,
      name: b.company,
      country: b.phone ? b.phone.split(' ')[0] : '—',
      contact: b.contact,
      phone: b.phone || '',
    }))
    const ce = Array.isArray(selectedTender.assignedContractEngineers) && selectedTender.assignedContractEngineers.length > 0
      ? selectedTender.assignedContractEngineers[0]
      : selectedTender.assignedContractEngineer || null
    const isParallel = evalMode === 'parallel'
    updateTender(selectedTender.id, {
      bidderList,
      bidders: bidderList.length,
      assignedTechEval: null,
      assignedCommEval: ce,
      evaluationMode: isParallel ? 'parallel' : 'linear',
      ...(isParallel
        ? { status: 'parallel_eval', stage: 'Parallel Evaluation', evalProgress: 'not_started', techSide: 'evaluating', commSide: 'evaluating' }
        : {}),
    })
    // Linear keeps the existing status chain (upload → tech_eval → …).
    // Parallel is placed directly into 'parallel_eval' above.
    if (!isParallel) advanceTender(selectedTender.id)
    navigate('/tenders')
  }

  // ── Correction Request portal (POF re-upload view) ──
  if (correctionTender) {
    const requests = (correctionTender.correctionRequests || []).filter(r => !r.resolved)
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-3">
          <button onClick={closeCorrectionPortal} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
            <ArrowLeft size={14} /> {t('common.backToList')}
          </button>
          <span className="text-slate-200">|</span>
          <span className="text-xs text-slate-400">{tenderRef(correctionTender)}</span>
        </div>

        {/* Header — same chrome as the normal ingestion screen (INGESTION badge,
            tender ref/title, registered-bidder count), so a re-upload request
            reads as the same screen, not a separate page. */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(correctionTender)}</span>
                <Badge variant="upload">Ingestion</Badge>
              </div>
              <h3 className="font-semibold text-slate-800">{correctionTender.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Upload missing documents flagged by the Technical Evaluator</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-amber-600">{requests.length}</p>
              <p className="text-xs text-slate-400">Pending bidder{requests.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </Card>

        {/* Evaluation Flow — read-only here: the tender already committed to a
            mode at ingestion, this screen only re-opens document upload. */}
        <Card className="p-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <GitBranch size={14} className="text-[var(--color-primary)] shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Evaluation Flow</p>
                <p className="text-[11px] text-slate-400">
                  {correctionTender.evaluationMode === 'parallel'
                    ? 'Parallel — Technical and Commercial evaluated together.'
                    : 'Linear — Technical first, then Commercial after technical evaluation.'}
                </p>
              </div>
            </div>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 bg-slate-100 px-3 py-1.5 rounded-lg shrink-0">
              <Lock size={11} /> Locked — a document has already been uploaded for this tender
            </span>
          </div>
        </Card>

        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Registered Bidders ({requests.length})</h3>
        </div>

        {/* Bidder cards — same shape as the normal ingestion bidder card
            (status icon, name, status pill, document rows with a delete icon,
            a labelled upload slot), with the clarification folded in as a
            banner instead of routing to a separate screen. */}
        <div className="space-y-4">
          {requests.map(req => {
            const isSubmitted   = !!correctionSubmitted[`${correctionTender.id}-${req.bidderId}`]
            const isExtracting  = !!correctionExtracting[req.bidderId]
            const isExtracted   = !!correctionExtracted[req.bidderId]
            const extractPct    = correctionExtractPct[req.bidderId] || 0
            const uploadedDocs  = req.missingDocs.filter(d => correctionUploads[`${req.bidderId}-${d.id}`])
            const pendingDocs   = req.missingDocs.filter(d => !correctionUploads[`${req.bidderId}-${d.id}`])
            const generalFiles  = correctionGeneral[req.bidderId] || []
            const uploadedCount = uploadedDocs.length + generalFiles.length
            const ready         = pendingDocs.length === 0
            const statusLabel   = isSubmitted ? 'Submitted' : isExtracted ? 'Extracted' : ready ? 'Ready' : 'Pending'

            const handleGeneralFiles = (incoming) => {
              const files = Array.from(incoming)
              if (!files.length) return
              const mapped = files.map(f => ({
                name: f.name,
                size: f.size > 1024 * 1024
                  ? `${(f.size / (1024 * 1024)).toFixed(1)} MB`
                  : `${(f.size / 1024).toFixed(0)} KB`,
              }))
              setCorrectionGeneral(prev => ({
                ...prev,
                [req.bidderId]: [...(prev[req.bidderId] || []), ...mapped],
              }))
            }

            const runExtraction = () => {
              setCorrectionExtractPct(prev => ({ ...prev, [req.bidderId]: 0 }))
              setCorrectionExtracting(prev => ({ ...prev, [req.bidderId]: true }))
            }

            return (
              <Card key={req.bidderId} className="p-4">
                <div className="flex items-start gap-3">
                  <span className={`flex w-9 h-9 shrink-0 items-center justify-center rounded-lg ${isSubmitted || isExtracted ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                    <FileText size={16} className={isSubmitted || isExtracted ? 'text-emerald-500' : 'text-amber-500'} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-sm font-semibold text-slate-800">{req.bidderName}</span>
                      <Badge variant={isSubmitted || isExtracted ? 'success' : 'warning'}>{statusLabel}</Badge>
                    </div>

                    {/* Clarification banner */}
                    <div className="mt-2.5 bg-amber-50 border border-amber-200 rounded-xl px-3.5 py-2.5">
                      <p className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                        <AlertTriangle size={12} className="shrink-0" />
                        {req.missingDocs.length} clarification{req.missingDocs.length !== 1 ? 's' : ''} from {req.evaluatorName || 'the Technical Evaluator'}
                      </p>
                      <ul className="mt-1 ml-5 list-disc text-[11px] text-amber-700 space-y-0.5">
                        <li>{req.bidderName} — missing or deficient documents · {req.notifiedAt}</li>
                      </ul>
                    </div>

                    {/* Already-uploaded documents — same delete-icon row as ingestion */}
                    {(uploadedDocs.length > 0 || generalFiles.length > 0) && (
                      <div className="mt-2 space-y-1.5">
                        {uploadedDocs.map(doc => {
                          const key = `${req.bidderId}-${doc.id}`
                          return (
                            <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                              <span className="flex items-center gap-2 min-w-0 text-xs font-medium text-slate-700">
                                <FileText size={13} className="text-[var(--color-primary)] shrink-0" />
                                <span className="truncate">{correctionUploads[key]}</span>
                              </span>
                              {!isSubmitted && (
                                <button type="button"
                                  onClick={() => setCorrectionUploads(prev => { const next = { ...prev }; delete next[key]; return next })}
                                  aria-label={`Remove ${doc.name}`}
                                  className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0">
                                  <X size={13} />
                                </button>
                              )}
                            </div>
                          )
                        })}
                        {generalFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                            <span className="flex items-center gap-2 min-w-0 text-xs font-medium text-slate-700">
                              <FileText size={13} className="text-[var(--color-primary)] shrink-0" />
                              <span className="truncate">{f.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{f.size}</span>
                            </span>
                            {!isSubmitted && (
                              <button type="button"
                                onClick={() => setCorrectionGeneral(prev => ({ ...prev, [req.bidderId]: prev[req.bidderId].filter((_, idx) => idx !== i) }))}
                                aria-label={`Remove ${f.name}`}
                                className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 shrink-0">
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Upload slot — one per document still flagged missing */}
                    {!isSubmitted && pendingDocs.map(doc => {
                      const inputId = `corr-${req.bidderId}-${doc.id}`
                      return (
                        <div key={doc.id} className="mt-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 flex items-center justify-between gap-2 bg-slate-50/60">
                          <span className="flex items-center gap-1.5 min-w-0 text-xs font-medium text-slate-600">
                            <FileText size={13} className="text-slate-400 shrink-0" />
                            <span className="truncate">{doc.name}</span>
                            {doc.kind === 'mandatory' && <span className="text-red-400 shrink-0">*</span>}
                          </span>
                          <label htmlFor={inputId} className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer shrink-0">
                            <Upload size={11} /> Upload {doc.name.split(' ')[0].toLowerCase()}
                          </label>
                          <input id={inputId} type="file" className="hidden"
                            onChange={e => handleCorrectionFileSelect(req.bidderId, doc.id, e.target.files?.[0])} />
                        </div>
                      )
                    })}

                    {!isSubmitted && (
                      <label className="mt-1.5 flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline cursor-pointer w-fit">
                        <Upload size={11} /> Upload additional documents
                        <input type="file" multiple className="hidden"
                          onChange={e => { handleGeneralFiles(e.target.files); e.target.value = '' }} />
                      </label>
                    )}

                    {isExtracting && (
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500">
                        <Activity size={11} className="text-[var(--color-primary)] animate-pulse" />
                        AI extraction running… {extractPct}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Ready bar — mirrors the normal ingestion screen's "ready for
                    evaluation" footer */}
                {isSubmitted ? (
                  <div className="mt-3 flex items-center gap-2 rounded-xl px-4 py-3 bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">
                    <CheckCircle size={13} className="shrink-0" />
                    Sent to Technical Evaluation — {req.bidderName}'s corrected documents were submitted to {req.evaluatorName || 'the Technical Evaluator'} for review.
                  </div>
                ) : (
                  <div className={`mt-3 flex items-center justify-between rounded-xl px-4 py-3 ${isExtracted ? 'bg-emerald-50 border border-emerald-200' : 'bg-slate-50 border border-slate-200'}`}>
                    <span className={`flex items-center gap-2 text-xs font-medium ${isExtracted ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {isExtracted ? <CheckCircle size={13} /> : <Clock size={13} />}
                      {isExtracted ? 'All documents extracted. Ready to resubmit.' : `${uploadedCount} of ${req.missingDocs.length} document${req.missingDocs.length !== 1 ? 's' : ''} ready`}
                    </span>
                    {isExtracted ? (
                      <Button size="sm" onClick={() => handleSubmitCorrection(correctionTender, req.bidderId)}>
                        Submit to Technical Evaluator <Send size={13} />
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" disabled={uploadedCount === 0 || isExtracting} onClick={runExtraction}>
                        <Bot size={13} /> Run AI Extraction
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Tender selection screen ──
  if (!selectedTender) {
    return (
      <div className="space-y-5">

        {/* ── Evaluation Report Uploads (Tech & Comm) ── */}
        {pendingReports.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UploadCloud size={14} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-700">Evaluation Report Uploads</h3>
              <span className="text-[10px] font-semibold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full animate-pulse">
                {pendingReports.length} pending
              </span>
            </div>
            <p className="text-xs text-slate-400 -mt-1">
              Upload the signed evaluation report from the evaluator to advance each tender to its next stage.
            </p>
            {pendingReports.map(({ tender, side, mode }) => {
              const isTech  = side === 'tech'
              const key = `${tender.id}-${side}`
              const uploaded = evalUploaded[key]
              const dragging = evalDragging[key]
              const reportLabel = isTech ? 'Technical' : 'Commercial'
              const otherSideDone = mode === 'parallel' &&
                (isTech ? tender.commSide === 'done' : tender.techSide === 'done')
              const nextStage = mode === 'parallel'
                ? (otherSideDone ? 'Management Review' : 'Awaiting the other evaluation')
                : (isTech ? 'Commercial Evaluation' : 'Management Review')
              const doUpload = () => {
                if (mode === 'parallel') uploadParallelReport(tender.id, side)
                else advanceTender(tender.id)
                setEvalUploaded(prev => ({ ...prev, [key]: true }))
              }

              return (
                <Card key={key} className={`overflow-hidden border-2 transition-all ${uploaded ? 'border-emerald-300' : 'border-orange-200'}`}>
                  {/* Tender header */}
                  <div className={`px-4 py-3 flex items-center justify-between gap-3 flex-wrap ${uploaded ? 'bg-emerald-50' : 'bg-orange-50'}`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-mono text-slate-400 bg-white/70 px-2 py-0.5 rounded shrink-0">{tenderRef(tender)}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isTech ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                        {reportLabel} Eval Report
                      </span>
                      {mode === 'parallel' && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-indigo-100 text-indigo-700">Parallel</span>
                      )}
                      <p className="text-xs font-semibold text-slate-700 truncate">{tender.title}</p>
                    </div>
                    {uploaded ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                        <CheckCircle size={10} /> Uploaded · {nextStage}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-white border border-orange-200 px-2.5 py-1 rounded-full shrink-0">
                        <Clock size={10} /> Awaiting Upload
                      </span>
                    )}
                  </div>

                  <div className="px-4 py-4">
                    {uploaded ? (
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <CheckCircle size={16} className="text-emerald-500 shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-emerald-800">{reportLabel} report uploaded successfully</p>
                          <p className="text-[11px] text-emerald-600 mt-0.5">
                            {mode === 'parallel' && !otherSideDone
                              ? <>Waiting for the {isTech ? 'Commercial' : 'Technical'} report before Management Review.</>
                              : <>Tender advanced to <strong>{nextStage}</strong>.</>}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div
                        onDragOver={e => { e.preventDefault(); setEvalDragging(prev => ({ ...prev, [key]: true })) }}
                        onDragLeave={() => setEvalDragging(prev => ({ ...prev, [key]: false }))}
                        onDrop={e => {
                          e.preventDefault()
                          setEvalDragging(prev => ({ ...prev, [key]: false }))
                          if (e.dataTransfer.files?.length) doUpload()
                        }}
                        className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2.5 py-8 transition-all cursor-pointer
                          ${dragging ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-slate-200 hover:border-orange-300 hover:bg-orange-50/40'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-[var(--color-primary)]/10' : 'bg-slate-100'}`}>
                          <UploadCloud size={20} className={dragging ? 'text-[var(--color-primary)]' : 'text-slate-400'} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-semibold text-slate-700">
                            Upload <span className={isTech ? 'text-blue-600' : 'text-violet-600'}>{reportLabel} Evaluation Report</span>
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Drag & drop or</p>
                        </div>
                        <label className="cursor-pointer">
                          <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity">
                            Browse File
                          </span>
                          <input type="file" accept=".pdf,.docx,.xlsx" className="hidden" onChange={e => {
                            if (e.target.files?.length) { doUpload(); e.target.value = '' }
                          }} />
                        </label>
                        <p className="text-[10px] text-slate-400">PDF · DOCX · XLSX</p>
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
            <div className="border-t border-slate-100 pt-1" />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">{t('ing.selectTitle')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t('ing.selectSub')}</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{ingestionList.length} {t('ing.ready')}</span>
        </div>
        {ingestionList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Lock size={32} />
            <p className="text-sm font-medium">{t('ing.noTenders')}</p>
            <p className="text-xs">{t('ing.noTendersSub')}</p>
          </div>
        )}
        {/* One unified list — a tender the Technical Evaluator sent back for
            re-upload sits alongside every other tender awaiting ingestion,
            just flagged with its own badge, rather than routing to a separate
            screen before you can even see it. */}
        <div className="space-y-3">
          {ingestionList.map(({ tender, isCorrection }) => {
            const pending = isCorrection ? tender.correctionRequests.filter(r => !r.resolved) : []
            return (
              <Card key={tender.id}
                className={`p-4 cursor-pointer hover:shadow-md transition-all group ${isCorrection ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300' : 'hover:border-[var(--color-primary)]/30'}`}
                onClick={() => {
                  if (isCorrection) {
                    setCorrectionTender(tender)
                    setCorrectionUploads({}); setCorrectionSubmitted({}); setCorrectionExtracting({})
                    setCorrectionExtracted({}); setCorrectionExtractPct({}); setCorrectionGeneral({})
                  } else {
                    setSelectedTender(tender)
                  }
                }}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
                      {isCorrection ? (
                        <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                          <Bell size={10} /> Needs re-upload
                        </span>
                      ) : (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor[tender.status] || 'bg-slate-100 text-slate-600'}`}>{stageLabel[tender.status] || tender.stage}</span>
                      )}
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{tender.title}</h3>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="flex items-center gap-1 text-xs text-slate-400"><Building2 size={11} /> {tender.department}</span>
                      {isCorrection ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                          <AlertTriangle size={11} /> {pending.length} bidder{pending.length !== 1 ? 's' : ''} need re-upload
                        </span>
                      ) : (
                        <>
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={11} /> Deadline {tender.deadline}</span>
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Users size={11} /> {tender.bidders} bidder{tender.bidders !== 1 ? 's' : ''}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!isCorrection && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-800">{tender.budget}</p>
                        <p className="text-[10px] text-slate-400">Budget</p>
                      </div>
                    )}
                    <ChevronRight size={16} className={`transition-colors ${isCorrection ? 'text-amber-300 group-hover:text-amber-500' : 'text-slate-300 group-hover:text-[var(--color-primary)]'}`} />
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    )
  }

  if (selectedTender && selectedTender.status !== 'upload') {
    return (
      <div className="space-y-5">
        <button onClick={exitTenderDetail} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Lock size={36} />
          <p className="text-sm font-semibold text-slate-700">Document upload not available</p>
          <p className="text-xs text-center max-w-xs">
            <span className="font-mono text-slate-500">{tenderRef(selectedTender)}</span> is currently in the <strong>{selectedTender.stage}</strong> stage.
            Only tenders in <strong>Awaiting Ingestion</strong> can receive document uploads.
          </p>
        </div>
      </div>
    )
  }

  // Where Proceed to Evaluation will route this tender — the Contract Engineer
  // assigned at the Contract Initiating Form / Create ITT, or "any Contract
  // Engineer" if this tender never went through either (falls back by role).
  const routedCe = Array.isArray(selectedTender?.assignedContractEngineers) && selectedTender.assignedContractEngineers.length > 0
    ? selectedTender.assignedContractEngineers[0]
    : selectedTender?.assignedContractEngineer || null

  // ── Main ingestion screen ──
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button onClick={exitTenderDetail} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> {tenderId ? t('common.backToList') : t('common.backToList2')}
        </button>
        <span className="text-slate-200">|</span>
        <span className="text-xs text-slate-400">{tenderRef(selectedTender)}</span>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(selectedTender)}</span>
              <Badge variant="upload">Ingestion</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{selectedTender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{t('ing.registerSub')}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[var(--color-primary)]">{bidders.length}</p>
            <p className="text-xs text-slate-400">{t('ing.bidderCount')}</p>
          </div>
        </div>
      </Card>

      {/* ── Document collection flow (linear / parallel) ── */}
      <Card className="p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-[var(--color-primary)] shrink-0" />
            <div>
              <p className="text-sm font-semibold text-slate-800">Evaluation Flow</p>
              <p className="text-[11px] text-slate-400">
                {evalMode === 'parallel'
                  ? 'Parallel — Technical and Commercial evaluated together. Upload both documents now.'
                  : 'Linear — Technical first. Upload the Technical document now; the Commercial document is uploaded after technical evaluation.'}
              </p>
            </div>
          </div>
          <div className="flex gap-1 p-0.5 rounded-lg bg-slate-100 shrink-0">
            {[
              { key: 'linear',   Icon: GitBranch,      label: 'Linear' },
              { key: 'parallel', Icon: ArrowRightLeft, label: 'Parallel' },
            ].map(({ key, Icon, label }) => (
              <button key={key} type="button" onClick={() => changeEvalMode(key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors
                  ${evalMode === key ? 'bg-white text-[var(--color-primary)] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                <Icon size={12} /> {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
          <Users size={12} className="text-slate-400 shrink-0" />
          Proceeding routes this to <strong className="text-slate-700 font-semibold">Technical → Contract Holder</strong>
          <span className="text-slate-300">·</span>
          <strong className="text-slate-700 font-semibold">Commercial → {routedCe?.name || 'any Contract Engineer'}</strong>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-5">
        {/* Bidder list — documents are attached per bidder, in each bidder's own
            Technical / Commercial slot below. */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">{t('ing.bidderCount')} ({bidders.length})</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => { setBidderForm({ company: '', contact: '', phone: '' }); setBidderErrors({}); setShowAddBidder(true) }}>
                <UserPlus size={13} /> {t('ing.addBidder')}
              </Button>
              {!extracting && hasQueued && (
                <Button size="sm" onClick={() => { setExtracting(true); setShowTracker(true); setLogEntries([]) }}>
                  <Bot size={13} /> {t('ing.runExtract')}
                </Button>
              )}
              {extracting && (
                <Button size="sm" variant="secondary" onClick={() => { setShowTracker(true); setLogEntries([]) }}>
                  <Activity size={13} /> {t('ing.trackExtract')}
                </Button>
              )}
              <Button size="sm" variant="secondary" disabled={!allExtracted} onClick={proceedToEvaluation}>
                <Bot size={13} /> {t('ing.startEval')}
              </Button>
            </div>
          </div>

          {bidders.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
              <Users size={28} />
              <p className="text-sm font-medium text-slate-600">{t('ing.noBidders')}</p>
              <p className="text-xs text-center">{t('ing.noBiddersSub')}</p>
              <Button size="sm" onClick={() => setShowAddBidder(true)}><UserPlus size={13} /> {t('ing.addFirst')}</Button>
            </div>
          )}

          {bidders.map(b => {
            const isOut = b.status === 'not_participating'
            const editable = !['processing', 'completed'].includes(b.status)
            return (
            <Card key={b.id} className={`p-4 ${isOut ? 'opacity-75' : ''}`}>
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={`p-2.5 rounded-xl shrink-0
                  ${b.status === 'completed' ? 'bg-green-50' : b.status === 'processing' ? 'bg-amber-50' : b.status === 'not_participating' ? 'bg-slate-100' : b.status === 'no_document' ? 'bg-slate-50' : 'bg-blue-50'}`}>
                  {b.status === 'not_participating'
                    ? <Ban size={18} className="text-slate-400" />
                    : b.status === 'no_document'
                    ? <Users size={18} className="text-slate-400" />
                    : <FileArchive size={18} className={b.status === 'completed' ? 'text-green-500' : b.status === 'processing' ? 'text-amber-500' : 'text-blue-400'} />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Company + status + remove */}
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`text-sm font-semibold truncate ${isOut ? 'text-slate-500' : 'text-slate-800'}`}>{b.company}</span>
                      {statusBadge[b.status]}
                    </div>
                    <button onClick={() => setBidders(prev => prev.filter(x => x.id !== b.id))} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 shrink-0">
                      <X size={13} />
                    </button>
                  </div>

                  {/* Contact person + phone */}
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-xs text-slate-500">{t('ing.contact')} · {b.contact}</p>
                    {b.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone size={10} /> {b.phone}
                      </span>
                    )}
                  </div>

                  {isOut ? (
                    <div className="mt-2 flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                      <span className="flex items-center gap-1.5 text-xs text-slate-500"><Ban size={12} /> Excluded from evaluation</span>
                      <button onClick={() => restoreBidder(b.id)}
                        className="flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary)] hover:underline">
                        <RotateCcw size={11} /> Restore
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* Document slots — both in parallel; Technical only in linear (Commercial comes after tech eval) */}
                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          { type: 'technical',  doc: b.techDoc, Icon: Wrench, label: 'Technical',  color: 'text-blue-500',   bg: 'bg-blue-50' },
                          ...(evalMode === 'parallel'
                            ? [{ type: 'commercial', doc: b.commDoc, Icon: Wallet, label: 'Commercial', color: 'text-violet-500', bg: 'bg-violet-50' }]
                            : []),
                        ].map(({ type, doc, Icon, label, color, bg }) => (
                          <div key={type} className={`rounded-lg border px-2.5 py-2 ${doc ? 'border-emerald-200 bg-emerald-50/50' : 'border-dashed border-slate-200 bg-slate-50/60'}`}>
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className={`w-5 h-5 rounded flex items-center justify-center ${bg}`}><Icon size={11} className={color} /></span>
                              <span className="text-[11px] font-semibold text-slate-600">{label}</span>
                              <span className="font-secondary text-red-400 text-[11px]">*</span>
                            </div>
                            {doc ? (
                              <div className="flex items-center justify-between gap-1">
                                <span className="flex items-center gap-1 text-[11px] text-emerald-700 min-w-0">
                                  <CheckCircle size={11} className="shrink-0" />
                                  <span className="truncate">{doc.name}</span>
                                </span>
                                {editable && (
                                  <button onClick={() => removeDoc(b.id, type)} className="text-slate-300 hover:text-red-400 shrink-0"><X size={11} /></button>
                                )}
                              </div>
                            ) : (
                              <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-[var(--color-primary)] hover:underline">
                                <Upload size={10} /> Upload {label.toLowerCase()}
                                <input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar" className="hidden"
                                  onChange={e => { attachDocToBidder(b.id, type, e.target.files); e.target.value = '' }} />
                              </label>
                            )}
                          </div>
                        ))}
                      </div>

                      {evalMode === 'linear' && (
                        <p className="mt-1.5 text-[10px] text-slate-400 flex items-center gap-1">
                          <Wallet size={10} className="text-violet-400 shrink-0" />
                          Commercial document is uploaded after technical evaluation, at the commercial evaluation stage.
                        </p>
                      )}

                      {/* Processing progress */}
                      {b.status === 'processing' && (
                        <div className="mt-2">
                          <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                            <span>Extracting data...</span>
                            <span>{Math.round((b.extracted / (b._max || 142)) * 100)}%</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${Math.round((b.extracted / (b._max || 142)) * 100)}%` }} />
                          </div>
                        </div>
                      )}

                      {/* Extracted summary */}
                      {b.status === 'completed' && (
                        <div className="mt-2 flex items-center gap-3">
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{b.extracted} events extracted</span>
                          <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">AI mapped &amp; indexed</span>
                        </div>
                      )}

                      {/* Not participating action */}
                      {editable && (
                        <button onClick={() => markNotParticipating(b.id)}
                          className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-red-500 transition-colors">
                          <Ban size={11} /> Mark as Not Participating
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </Card>
            )
          })}

          {allExtracted && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-500" />
                <span className="text-sm font-medium text-green-700">{t('ing.allExtracted')}</span>
              </div>
              <Button size="sm" onClick={proceedToEvaluation}>
                {t('ing.beginEval')}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Add Bidder Modal ── */}
      {showAddBidder && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <UserPlus size={14} className="text-[var(--color-primary)]" /> {t('ing.registerTitle')}
              </h3>
              <button onClick={() => setShowAddBidder(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t('ing.companyName')} <span className="font-secondary text-red-400">*</span></label>
                <input
                  value={bidderForm.company}
                  onChange={e => { setBidderForm(f => ({ ...f, company: e.target.value })); setBidderErrors(er => ({ ...er, company: '' })) }}
                  placeholder={t('ing.companyPlaceholder')}
                  list={qualifiedCompanies.length ? 'qualified-bidder-companies' : undefined}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${bidderErrors.company ? 'border-red-300' : 'border-slate-200'}`}
                />
                {qualifiedCompanies.length > 0 && (
                  <datalist id="qualified-bidder-companies">
                    {qualifiedCompanies.map(name => <option key={name} value={name} />)}
                  </datalist>
                )}
                {qualifiedCompanies.length > 0 && (
                  <p className="text-[10px] text-slate-400 mt-1">Choose a pre-qualified bidder or type a new company name.</p>
                )}
                {bidderErrors.company && <p className="text-[10px] text-red-500 mt-0.5">{bidderErrors.company}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t('ing.contactPerson')} <span className="font-secondary text-red-400">*</span></label>
                <input
                  value={bidderForm.contact}
                  onChange={e => { setBidderForm(f => ({ ...f, contact: e.target.value })); setBidderErrors(er => ({ ...er, contact: '' })) }}
                  placeholder={t('ing.contactPlaceholder')}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${bidderErrors.contact ? 'border-red-300' : 'border-slate-200'}`}
                />
                {bidderErrors.contact && <p className="text-[10px] text-red-500 mt-0.5">{bidderErrors.contact}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t('ing.contactNumber')}</label>
                <div className="relative">
                  <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    value={bidderForm.phone}
                    onChange={e => setBidderForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. +968 2483 5100"
                    type="tel"
                    className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowAddBidder(false)}>{t('common.cancel')}</Button>
              <Button className="flex-1 justify-center" onClick={submitAddBidder}><Save size={13} /> {t('ing.register')}</Button>
            </div>
          </Card>
        </div>
      )}


      {/* ── AI Extraction Tracker Modal ── */}
      {showTracker && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <Card className="w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <Activity size={15} style={{ color: 'var(--color-primary)' }} />
                <h3 className="font-semibold text-slate-800 text-sm">{t('ing.trackerTitle')}</h3>
                {!allExtracted && <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />}
              </div>
              <button onClick={() => setShowTracker(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>

            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-600">{t('ing.overall')}</span>
                <span className="text-xs font-bold text-slate-800">
                  {uploadedBidders.filter(b => b.status === 'completed').length} / {uploadedBidders.length} extracted
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    background: 'var(--color-primary)',
                    width: uploadedBidders.length ? `${(uploadedBidders.filter(b => b.status === 'completed').length / uploadedBidders.length) * 100}%` : '0%',
                  }}
                />
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5">
                {allExtracted ? t('ing.readyEval')
                  : extracting ? t('ing.uploading')
                  : t('ing.startPrompt')}
              </p>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">{t('ing.bundleStatus')}</p>
              {uploadedBidders.map(b => {
                const pct = Math.round((b.extracted / (b._max || 142)) * 100)
                return (
                  <div key={b.id} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0
                      ${b.status === 'completed' ? 'bg-green-100' : b.status === 'processing' ? 'bg-amber-100' : 'bg-slate-100'}`}>
                      {b.status === 'completed'
                        ? <CheckCircle size={12} className="text-green-500" />
                        : b.status === 'processing'
                        ? <Clock size={12} className="text-amber-500" />
                        : <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="min-w-0">
                          <span className="text-xs font-semibold text-slate-700 truncate block">{b.company}</span>
                          <span className="text-[10px] text-slate-400">{b.contact}</span>
                        </div>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">
                          {b.status === 'completed' ? `${b.extracted} events` : b.status === 'processing' ? `${pct}%` : 'Queued'}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden mt-1">
                        <div className={`h-full rounded-full transition-all ${b.status === 'completed' ? 'bg-green-400' : 'bg-amber-400'}`}
                          style={{ width: b.status === 'completed' ? '100%' : b.status === 'processing' ? `${pct}%` : '0%' }} />
                      </div>
                    </div>
                  </div>
                )
              })}

              {logEntries.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">{t('ing.liveLog')}</p>
                  <div className="space-y-1">
                    {logEntries.map((entry, i) => (
                      <p key={i} className={`text-[10px] font-mono ${i === 0 ? 'text-blue-600' : 'text-slate-400'}`}>› {entry}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {allExtracted && (
              <div className="px-5 pb-5 pt-3 border-t border-slate-100 shrink-0 space-y-3">
                <div className="flex items-center gap-2 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle size={12} /> {uploadedBidders.length} {t('ing.bundles')}
                </div>
                <Button className="w-full justify-center" onClick={() => { setShowTracker(false); setExtracting(false); proceedToEvaluation() }}>
                  <Bot size={13} /> {t('ing.proceed')}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
