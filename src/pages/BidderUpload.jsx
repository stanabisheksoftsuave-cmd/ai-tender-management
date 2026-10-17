import { useState, useEffect, useRef } from 'react'
import {
  Upload, FileArchive, CheckCircle, Clock, Bot, X, AlertCircle, ArrowLeft,
  ChevronRight, ChevronDown, Users, Calendar, Building2, Lock, Activity, UserPlus,
  Save, Phone, Bell, FileText, AlertTriangle, Send, UploadCloud, Ban, RotateCcw,
  Wrench, Wallet, GitBranch, ArrowRightLeft, Network, Search, Hash, CalendarClock, ArrowRight
} from 'lucide-react'
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
  const { lang, t } = useLanguage()
  const uploadTenders = tenders.filter(t => t.status === 'upload')

  const paramTender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const [selectedTender, setSelectedTender] = useState(paramTender || null)
  const [bidders, setBidders] = useState([])
  const [extracting, setExtracting] = useState(false)
  const [showTracker, setShowTracker] = useState(false)
  const [logEntries, setLogEntries] = useState([])
  const [search, setSearch] = useState('')
  const [showNotParticipating, setShowNotParticipating] = useState(false)

  // Keep selectedTender in sync with URL or tenders context
  useEffect(() => {
    if (tenderId) {
      const match = tenders.find(t => t.id === tenderId)
      if (match) setSelectedTender(match)
    }
  }, [tenderId, tenders])

  const currentTenderIdRef = useRef(selectedTender?.id)
  useEffect(() => {
    if (selectedTender?.id !== currentTenderIdRef.current) {
      currentTenderIdRef.current = selectedTender?.id
      if (selectedTender?.bidderList && Array.isArray(selectedTender.bidderList) && selectedTender.bidderList.length > 0) {
        setBidders(selectedTender.bidderList.map((b, idx) => ({
          id: b.id || idx + 1,
          company: b.name || b.company || 'Unknown Bidder',
          contact: b.contact || 'Mohamed Al-Balushi',
          phone: b.phone || '+968 2483 5100',
          techDoc: b.techDoc || null,
          commDoc: b.commDoc || null,
          status: b.status || (b.techDoc ? 'queued' : 'no_document'),
          extracted: b.extracted || 0,
          _max: b._max || 120,
        })))
      } else {
        setBidders([])
      }
    }
  }, [selectedTender?.id, selectedTender?.bidderList])

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
  const notParticipatingBidders = bidders.filter(b => b.status === 'not_participating')
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

  // ── Tender selection screen (Ingestion Worklist) ──
  if (!selectedTender) {
    const isSearching = search.trim() !== ''
    const filteredIngestionList = ingestionList.filter(({ tender }) => {
      if (!isSearching) return true
      const q = search.trim().toLowerCase()
      return (
        (tender.title || '').toLowerCase().includes(q) ||
        (tender.costCode || '').toLowerCase().includes(q) ||
        (tender.id || '').toLowerCase().includes(q) ||
        (tender.department || '').toLowerCase().includes(q)
      )
    })

    return (
      <div className="space-y-5">
        {/* ── Evaluation Report Uploads (Tech & Comm) if any ── */}
        {pendingReports.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <UploadCloud size={16} className="text-orange-500" />
              <h3 className="text-sm font-semibold text-slate-800">Evaluation Report Uploads</h3>
              <span className="text-[10px] font-semibold text-orange-700 bg-orange-100 border border-orange-200 px-2 py-0.5 rounded-full animate-pulse">
                {pendingReports.length} pending
              </span>
            </div>
            <p className="text-xs text-slate-500 -mt-1">
              Upload the signed evaluation report from the evaluator to advance each tender to its next stage.
            </p>
            <div className="space-y-3">
              {pendingReports.map(({ tender, side, mode }) => {
                const isTech = side === 'tech'
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
                  <div key={key} className={`overflow-hidden rounded-xl border transition-all bg-white ${uploaded ? 'border-emerald-300' : 'border-slate-200'}`}>
                    <div className={`px-4 py-3 flex items-center justify-between gap-3 flex-wrap border-b ${uploaded ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50/70 border-slate-100'}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded shrink-0">{tenderRef(tender)}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isTech ? 'bg-blue-100 text-blue-700' : 'bg-violet-100 text-violet-700'}`}>
                          {reportLabel} Eval Report
                        </span>
                        {mode === 'parallel' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 bg-indigo-100 text-indigo-700">Parallel</span>
                        )}
                        <p className="text-xs font-semibold text-slate-800 truncate">{tender.title}</p>
                      </div>
                      {uploaded ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-full shrink-0">
                          <CheckCircle size={10} /> Uploaded · {nextStage}
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full shrink-0">
                          <Clock size={10} /> Awaiting Upload
                        </span>
                      )}
                    </div>

                    <div className="p-4">
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
                          className={`rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 py-6 transition-all cursor-pointer
                            ${dragging ? 'border-[#0089cf] bg-[#0089cf]/5' : 'border-slate-200 hover:border-[#0089cf]/40 hover:bg-slate-50/60'}`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${dragging ? 'bg-[#0089cf]/10 text-[#0089cf]' : 'bg-slate-100 text-slate-400'}`}>
                            <UploadCloud size={20} />
                          </div>
                          <div className="text-center">
                            <p className="text-xs font-semibold text-slate-800">
                              Upload <span className={isTech ? 'text-[#0089cf]' : 'text-violet-600'}>{reportLabel} Evaluation Report</span>
                            </p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Drag & drop or</p>
                          </div>
                          <label className="cursor-pointer">
                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#0089cf] text-white hover:bg-[#1b4c6f] transition-colors shadow-sm">
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
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Worklist Panel Container ── */}
        <div className="olng-slide-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[#0089cf]"
                  style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}
                >
                  <Upload size={20} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 className="text-base font-semibold text-slate-900">
                    Ingestion
                  </h2>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Only tenders in the Bid Ingestion stage can receive document uploads.
                  </p>
                </div>
              </div>
              <div className="flex w-full items-center gap-3 sm:w-auto">
                <div className="relative min-w-0 flex-1 sm:w-64 sm:flex-none">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search ingestion tenders"
                    aria-label="Search ingestion tenders"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-xs placeholder:text-slate-400 focus:border-[#0089cf] focus:outline-none focus:ring-2 focus:ring-[#0089cf]/20"
                  />
                </div>
                <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500 tabular-nums">
                  {filteredIngestionList.length} tender{filteredIngestionList.length === 1 ? '' : 's'}
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 p-4 sm:p-5">
            {filteredIngestionList.length === 0 ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 p-8 text-center sm:p-12">
                <span
                  className="flex size-10 items-center justify-center rounded-xl text-[#0089cf] mb-1"
                  style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}
                >
                  {isSearching ? <Search size={20} /> : <Lock size={20} />}
                </span>
                <p className="text-sm font-semibold text-slate-800">
                  {isSearching ? 'No tenders match your search' : 'No tenders awaiting ingestion'}
                </p>
                <p className="max-w-md font-sans text-xs text-slate-500">
                  {isSearching
                    ? 'Try a different cost code, title or department.'
                    : 'Tenders move here after the ITT has been exported and finalised. Check back once an ITT is ready for bidder upload.'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredIngestionList.map(({ tender, isCorrection }) => {
                  const pending = isCorrection ? (tender.correctionRequests?.filter(r => !r.resolved) || []) : []
                  const hasClarification = isCorrection || pending.length > 0
                  return (
                    <div
                      key={tender.id}
                      onClick={() => {
                        if (isCorrection) {
                          setCorrectionTender(tender)
                          setCorrectionUploads({})
                          setCorrectionSubmitted({})
                          setCorrectionExtracting({})
                          setCorrectionExtracted({})
                          setCorrectionExtractPct({})
                          setCorrectionGeneral({})
                        } else {
                          setSelectedTender(tender)
                        }
                      }}
                      className="group block rounded-xl cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30"
                    >
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0089cf]/40 hover:bg-[#0089cf]/[0.02]">
                        <div className="flex items-center justify-between gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                              <h3 className="max-w-full truncate text-sm font-semibold text-slate-800">
                                {tender.title}
                              </h3>
                              {hasClarification ? (
                                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-700 ring-1 ring-amber-200">
                                  Technical Clarification ({pending.length || 1})
                                </span>
                              ) : (
                                <span className="shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase bg-[#afd9f4]/40 text-[#0089cf] ring-1 ring-[#0089cf]/20 animate-pulse">
                                  Awaiting Upload
                                </span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                              {(tender.costCode || tender.id) && (
                                <span className="flex min-w-0 items-center gap-1 font-mono">
                                  <Hash size={12} className="shrink-0" />
                                  Cost Code: {tender.costCode || tender.id}
                                </span>
                              )}
                              {tender.deadline && (
                                <span className="flex items-center gap-1">
                                  <CalendarClock size={12} className="shrink-0" />
                                  Deadline: {tender.deadline}
                                </span>
                              )}
                              {tender.department && (
                                <span className="flex items-center gap-1">
                                  <Building2 size={12} className="shrink-0" />
                                  {tender.department}
                                </span>
                              )}
                              <span className="flex items-center gap-1">
                                <Users size={12} className="shrink-0" />
                                {tender.bidders || 0} bidder{(tender.bidders || 0) === 1 ? '' : 's'}
                              </span>
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            {tender.budget && (
                              <div className="text-right">
                                <p className="font-sans text-[11px] text-slate-400">Budget</p>
                                <p className="text-sm font-semibold text-slate-800">{tender.budget}</p>
                              </div>
                            )}
                            <ChevronRight
                              size={16}
                              className="shrink-0 text-slate-400 transition-colors group-hover:text-[#0089cf]"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  if (selectedTender && selectedTender.status !== 'upload') {
    return (
      <div className="space-y-5">
        <button onClick={exitTenderDetail} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer">
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

  // ── Main ingestion screen (Detail Screen) ──
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={exitTenderDetail}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} /> {tenderId ? t('common.backToList') : 'Back to Ingestion'}
        </button>
        <span className="text-slate-200">|</span>
        <span className="text-xs text-slate-400 font-mono">{tenderRef(selectedTender)}</span>
      </div>

      <div className="olng-slide-up overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Header Section */}
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="min-w-0 text-lg font-bold break-words text-slate-900">
                {selectedTender.title}
              </h2>
              <span className="rounded-full uppercase tracking-wide px-2.5 py-0.5 text-[10px] font-bold bg-[#afd9f4]/40 text-[#0089cf] ring-1 ring-[#0089cf]/20">
                INGESTION
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Register bidders, attach their proposal bundles, and run AI extraction
            </p>
          </div>
          <div className="flex max-w-full flex-wrap items-center gap-3">
            <div className="relative inline-flex gap-0.5 rounded-lg border border-slate-200 bg-slate-100 p-0.5">
              {[
                { value: 'linear', label: 'Linear', Icon: GitBranch },
                { value: 'parallel', label: 'Parallel', Icon: Network },
              ].map(({ value, label, Icon }) => {
                const active = evalMode === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => changeEvalMode(value)}
                    className={`relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                      active
                        ? 'bg-white font-semibold text-[#0089cf] shadow-sm'
                        : 'font-medium text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className="size-3.5" aria-hidden="true" />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Registered Bidders Sub-Header Bar */}
        <div className="border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              Registered Bidders
              <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#afd9f4]/50 text-[11px] font-semibold text-[#0089cf]">
                {activeBidders.length}
              </span>
            </h2>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => {
                  setBidderForm({ company: '', contact: '', phone: '' })
                  setBidderErrors({})
                  setShowAddBidder(true)
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
              >
                <UserPlus className="size-3.5" aria-hidden="true" />
                Add Bidder
              </button>
              {extracting ? (
                <button
                  type="button"
                  onClick={() => { setShowTracker(true); setLogEntries([]) }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 shadow-sm transition-colors cursor-pointer"
                >
                  <Bot className="size-3.5" aria-hidden="true" />
                  Track Extraction
                </button>
              ) : hasQueued && !extracting ? (
                <button
                  type="button"
                  onClick={() => { setExtracting(true); setShowTracker(true); setLogEntries([]) }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#0089cf] text-white hover:bg-[#1b4c6f] shadow-sm transition-colors cursor-pointer"
                >
                  <Bot className="size-3.5" aria-hidden="true" />
                  Run AI Extraction
                </button>
              ) : null}
              <button
                type="button"
                disabled={!allExtracted}
                onClick={proceedToEvaluation}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                  allExtracted
                    ? 'bg-[#0089cf] text-white hover:bg-[#1b4c6f] shadow-sm cursor-pointer'
                    : 'bg-[#0089cf] text-white opacity-50 cursor-not-allowed'
                }`}
              >
                {!allExtracted && <Lock className="size-3.5" aria-hidden="true" />}
                Begin Evaluation
                {allExtracted && <ArrowRight className="size-3.5" aria-hidden="true" />}
              </button>
            </div>
          </div>
          {!allExtracted && (
            <p className="px-4 pb-3 sm:px-5 text-xs text-slate-400 sm:text-right">
              {activeBidders.length === 0
                ? 'Add a bidder to begin evaluation.'
                : 'Requires all documents uploaded and extracted.'}
            </p>
          )}
        </div>

        {/* Bidders Content Area */}
        <div className="border-t border-slate-200 p-4 sm:p-5 space-y-4">
          {activeBidders.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-slate-200 bg-white p-8 text-center sm:p-12">
              <div className="flex flex-col items-center justify-center gap-2">
                <span
                  className="flex size-10 items-center justify-center rounded-xl text-[#0089cf] mb-1"
                  style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}
                >
                  <Users size={20} aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-800">No bidders registered yet</p>
                <p className="max-w-md text-xs text-slate-500 mb-2">
                  Add bidders first, then attach their proposal documents
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setBidderForm({ company: '', contact: '', phone: '' })
                    setBidderErrors({})
                    setShowAddBidder(true)
                  }}
                  className="rounded-full px-4 h-9 text-[13px] font-semibold bg-[#0089cf] text-white hover:bg-[#1b4c6f] inline-flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus size={14} /> Add First Bidder
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBidders.map(b => {
                const isExtracted = b.status === 'completed'
                const isProcessing = b.status === 'processing'
                const isQueued = b.status === 'queued'
                const isNoDoc = b.status === 'no_document'

                const statusBadgeConfig = {
                  completed: { cls: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200', label: 'Extracted' },
                  processing: { cls: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200', label: 'Processing' },
                  queued: { cls: 'bg-blue-50 text-[#0089cf] ring-1 ring-[#0089cf]/20', label: 'Queued' },
                  no_document: { cls: 'bg-slate-100 text-slate-600 ring-1 ring-slate-200', label: 'Awaiting Document' },
                }
                const currentBadge = statusBadgeConfig[b.status] || statusBadgeConfig.no_document

                return (
                  <div
                    key={b.id}
                    className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <span
                          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                            isExtracted ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isNoDoc ? (
                            <Users className="size-4" aria-hidden="true" />
                          ) : (
                            <FileArchive
                              className={`size-4 ${isExtracted ? 'text-emerald-600' : 'text-[#0089cf]'}`}
                              aria-hidden="true"
                            />
                          )}
                        </span>

                        <div className="min-w-0">
                          <div className="flex min-w-0 flex-wrap items-center gap-2">
                            <span className="min-w-0 text-sm font-semibold break-words text-slate-900">
                              {b.company}
                            </span>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold tracking-wide uppercase ${currentBadge.cls}`}>
                              {currentBadge.label}
                            </span>
                          </div>

                          {(b.contact || b.phone) && (
                            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              {b.contact && <span>Contact Person · {b.contact}</span>}
                              {b.phone && (
                                <span className="flex items-center gap-1 text-slate-400">
                                  <Phone className="size-3" aria-hidden="true" />
                                  {b.phone}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markNotParticipating(b.id)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer shadow-sm"
                        >
                          <Ban className="size-3.5" aria-hidden="true" />
                          Mark as Not Participating
                        </button>
                        <button
                          type="button"
                          onClick={() => setBidders(prev => prev.filter(x => x.id !== b.id))}
                          className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors cursor-pointer"
                          title="Remove bidder"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Documents slots */}
                    <div className={`grid grid-cols-1 ${evalMode === 'parallel' ? 'sm:grid-cols-2' : ''} gap-3`}>
                      {/* Technical Document */}
                      {b.techDoc ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#afd9f4]/40 text-[#0089cf]">
                              <Wrench className="size-3.5" aria-hidden="true" />
                            </span>
                            <span className="truncate text-xs font-medium text-slate-800">
                              {b.techDoc.name}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                              <CheckCircle size={10} /> {isExtracted ? 'Extracted' : 'Uploaded'}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeDoc(b.id, 'technical')}
                            className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Remove file"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex min-h-36 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-[#0089cf]/25 bg-[#0089cf]/[0.03] px-4 py-5 text-center transition-all cursor-pointer hover:border-solid hover:border-[#0089cf]/50">
                          <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-white text-[#0089cf] shadow-sm">
                            <Wrench className="size-5" aria-hidden="true" />
                          </span>
                          <span className="text-sm font-semibold text-slate-800">
                            Technical Bundle <span className="text-red-500">*</span>
                          </span>
                          <span className="text-xs font-semibold text-[#0089cf]">
                            Upload technical
                          </span>
                          <span className="text-[11px] text-slate-400">
                            Drag and drop or click to browse · .pdf, .docx, .xlsx, .zip · up to 10 files
                          </span>
                          <input
                            type="file"
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                            className="sr-only"
                            onChange={e => { attachDocToBidder(b.id, 'technical', e.target.files); e.target.value = '' }}
                          />
                        </label>
                      )}

                      {/* Commercial Document in Parallel Mode */}
                      {evalMode === 'parallel' && (
                        b.commDoc ? (
                          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50/70 px-3 py-2.5">
                            <span className="flex min-w-0 items-center gap-2">
                              <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-violet-100 text-violet-600">
                                <Wallet className="size-3.5" aria-hidden="true" />
                              </span>
                              <span className="truncate text-xs font-medium text-slate-800">
                                {b.commDoc.name}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
                                <CheckCircle size={10} /> {isExtracted ? 'Extracted' : 'Uploaded'}
                              </span>
                            </span>
                            <button
                              type="button"
                              onClick={() => removeDoc(b.id, 'commercial')}
                              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors cursor-pointer"
                              title="Remove file"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex min-h-36 flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-violet-300/40 bg-violet-50/20 px-4 py-5 text-center transition-all cursor-pointer hover:border-solid hover:border-violet-400">
                            <span className="mb-1 flex size-10 items-center justify-center rounded-full bg-white text-violet-600 shadow-sm">
                              <Wallet className="size-5" aria-hidden="true" />
                            </span>
                            <span className="text-sm font-semibold text-slate-800">
                              Commercial Bundle <span className="text-red-500">*</span>
                            </span>
                            <span className="text-xs font-semibold text-violet-600">
                              Upload commercial
                            </span>
                            <span className="text-[11px] text-slate-400">
                              Drag and drop or click to browse · .pdf, .docx, .xlsx, .zip · up to 10 files
                            </span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.rar"
                              className="sr-only"
                              onChange={e => { attachDocToBidder(b.id, 'commercial', e.target.files); e.target.value = '' }}
                            />
                          </label>
                        )
                      )}
                    </div>

                    {evalMode === 'linear' && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
                        <Wallet size={12} className="text-violet-400 shrink-0" />
                        Commercial document is uploaded after technical evaluation, at the commercial evaluation stage.
                      </p>
                    )}

                    {/* Processing progress */}
                    {isProcessing && (
                      <div className="rounded-lg bg-amber-50/60 border border-amber-200/60 p-3">
                        <div className="flex justify-between text-xs text-amber-800 mb-1 font-medium">
                          <span className="flex items-center gap-1.5">
                            <Bot size={13} className="text-amber-600" /> Extracting data with AI...
                          </span>
                          <span>{Math.round((b.extracted / (b._max || 142)) * 100)}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-amber-100 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-amber-500 transition-all duration-300"
                            style={{ width: `${Math.round((b.extracted / (b._max || 142)) * 100)}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Extracted summary */}
                    {isExtracted && (
                      <div className="flex items-center gap-3">
                        <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 ring-1 ring-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle size={11} /> {b.extracted} events extracted
                        </span>
                        <span className="text-[11px] font-medium text-[#0089cf] bg-blue-50 ring-1 ring-[#0089cf]/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Bot size={11} /> AI mapped &amp; indexed
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Not Participating Section */}
          {notParticipatingBidders.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setShowNotParticipating(prev => !prev)}
                  className="flex min-h-8 cursor-pointer items-center gap-1.5 rounded-md text-sm font-semibold text-slate-800 transition-colors hover:text-[#0089cf]"
                >
                  <ChevronDown
                    className={`size-4 transition-transform ${!showNotParticipating ? '-rotate-90' : ''}`}
                    aria-hidden="true"
                  />
                  Not Participating
                  <span className="inline-flex size-5 items-center justify-center rounded-full bg-[#afd9f4]/50 text-[11px] font-semibold text-[#0089cf]">
                    {notParticipatingBidders.length}
                  </span>
                </button>
                <span className="text-xs text-slate-400">
                  {showNotParticipating
                    ? 'Excluded bidders are skipped by extraction and evaluation.'
                    : 'Click to view or restore excluded bidders.'}
                </span>
              </div>
              {showNotParticipating && (
                <div className="mt-3 space-y-3">
                  {notParticipatingBidders.map(b => (
                    <div
                      key={b.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-xl bg-slate-200/60 text-slate-400">
                          <Ban size={16} />
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-slate-600 line-through">{b.company}</p>
                          <p className="text-xs text-slate-400">Excluded from evaluation</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => restoreBidder(b.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                      >
                        <RotateCcw size={13} /> Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {allExtracted && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <CheckCircle size={18} className="text-emerald-600 shrink-0" />
                <span className="text-sm font-medium text-emerald-800">
                  All documents extracted. Ready to begin evaluation.
                </span>
              </div>
              <button
                type="button"
                onClick={proceedToEvaluation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-[#0089cf] text-white hover:bg-[#1b4c6f] shadow-sm transition-colors cursor-pointer"
              >
                Begin Evaluation <ArrowRight size={14} />
              </button>
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
              <button
                type="button"
                className="flex-1 justify-center inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                onClick={() => setShowAddBidder(false)}
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                className="flex-1 justify-center inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-[#0089cf] text-white hover:bg-[#1b4c6f] transition-colors shadow-sm cursor-pointer"
                onClick={submitAddBidder}
              >
                <Save size={13} /> {t('ing.register')}
              </button>
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
                <button
                  type="button"
                  className="w-full justify-center inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold rounded-xl bg-[#0089cf] text-white hover:bg-[#1b4c6f] transition-colors shadow-sm cursor-pointer"
                  onClick={() => { setShowTracker(false); setExtracting(false); proceedToEvaluation() }}
                >
                  <Bot size={13} /> {t('ing.proceed')}
                </button>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
