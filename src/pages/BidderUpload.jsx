import { useState, useEffect, useRef } from 'react'
import { Upload, FileArchive, CheckCircle, Clock, Bot, X, AlertCircle, ArrowLeft, ChevronRight, Users, Calendar, Building2, Lock, Activity, UserPlus, Save, Phone, Bell, FileText, AlertTriangle, Send, UploadCloud, Ban, RotateCcw, Wrench, Wallet, GitBranch, ArrowRightLeft } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SearchableSelect from '../components/ui/SearchableSelect'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
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
  const { users } = useAuth()
  const uploadTenders = tenders.filter(t => t.status === 'upload')

  // Technical evaluation is owned by the Contract Holder; commercial by the
  // Contract Engineer. Evaluator pools are drawn from those roles.
  const techEvaluators = users.filter(u => u.roleId === 'contract_holder' && u.status === 'active')
  const commEvaluators = users.filter(u => u.roleId === 'pof' && u.status === 'active')

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

  // Evaluator assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignments, setAssignments] = useState({ techEval: '', commEval: '', mode: 'linear' })
  const [assignModalErrors, setAssignModalErrors] = useState({})

  // Correction request portal (for POF re-upload flow)
  const [correctionTender,    setCorrectionTender]    = useState(null)
  const [correctionUploads,   setCorrectionUploads]   = useState({}) // { bidderId-docId: fileName }
  const [correctionSubmitted, setCorrectionSubmitted] = useState({}) // { bidderId: true }
  const [correctionExtracting,   setCorrectionExtracting]   = useState({}) // { bidderId: bool }
  const [correctionExtracted,    setCorrectionExtracted]    = useState({}) // { bidderId: bool }
  const [correctionExtractPct,   setCorrectionExtractPct]   = useState({}) // { bidderId: 0-100 }
  const [correctionGeneral,      setCorrectionGeneral]      = useState({}) // { bidderId: [{name,size}] }

  // Reassign evaluators modal (for tenders already in evaluation)
  const [reassignTender,  setReassignTender]  = useState(null)
  const [reassignForm,    setReassignForm]    = useState({ techEval: '', commEval: '' })
  const [reassignErrors,  setReassignErrors]  = useState({})

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
  // reassignTender renders inside the list branch below an early return, so this
  // must stay at top level to be a valid hook call.
  useDismissable(reassignTender, () => setReassignTender(null))
  useDismissable(showTracker, () => setShowTracker(false))
  useDismissable(showAssignModal, () => setShowAssignModal(false))
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

  // Tenders currently in evaluation (tech or commercial) — POF can reassign evaluators
  const evaluationTenders = tenders.filter(
    t => t.status === 'tech_eval' || t.status === 'comm_eval'
  )

  const openReassignModal = (tender) => {
    setReassignTender(tender)
    setReassignForm({
      techEval: tender.assignedTechEval ? String(tender.assignedTechEval.id) : '',
      commEval: tender.assignedCommEval ? String(tender.assignedCommEval.id) : '',
    })
    setReassignErrors({})
  }

  const confirmReassign = () => {
    const errs = {}
    if (!reassignForm.techEval) errs.techEval = 'Required'
    if (!reassignForm.commEval) errs.commEval = 'Required'
    if (Object.keys(errs).length) { setReassignErrors(errs); return }
    const techUser = techEvaluators.find(u => String(u.id) === reassignForm.techEval)
    const commUser = commEvaluators.find(u => String(u.id) === reassignForm.commEval)
    updateTender(reassignTender.id, {
      assignedTechEval: techUser ? { id: techUser.id, name: techUser.name } : reassignTender.assignedTechEval,
      assignedCommEval: commUser ? { id: commUser.id, name: commUser.name } : reassignTender.assignedCommEval,
    })
    setReassignTender(null)
  }

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

  const proceedToEvaluation = () => {
    setAssignments({ techEval: '', commEval: '', mode: 'linear' })
    setAssignModalErrors({})
    setShowAssignModal(true)
  }

  const confirmProceedToEvaluation = () => {
    const errs = {}
    if (!assignments.techEval) errs.techEval = 'Required'
    if (!assignments.commEval) errs.commEval = 'Required'
    if (Object.keys(errs).length) { setAssignModalErrors(errs); return }

    const bidderList = activeBidders.map(b => ({
      id: b.id,
      name: b.company,
      country: b.phone ? b.phone.split(' ')[0] : '—',
      contact: b.contact,
      phone: b.phone || '',
    }))
    const techUser = users.find(u => u.id === Number(assignments.techEval))
    const commUser = users.find(u => u.id === Number(assignments.commEval))
    // Evaluation flow is decided at ingestion (evalMode), not in this modal.
    const isParallel = evalMode === 'parallel'
    updateTender(selectedTender.id, {
      bidderList,
      bidders: bidderList.length,
      assignedTechEval: techUser ? { id: techUser.id, name: techUser.name } : null,
      assignedCommEval: commUser ? { id: commUser.id, name: commUser.name } : null,
      evaluationMode: isParallel ? 'parallel' : 'linear',
      ...(isParallel
        ? { status: 'parallel_eval', stage: 'Parallel Evaluation', evalProgress: 'not_started', techSide: 'evaluating', commSide: 'evaluating' }
        : {}),
    })
    // Linear keeps the existing status chain (upload → tech_eval → …).
    // Parallel is placed directly into 'parallel_eval' above.
    if (!isParallel) advanceTender(selectedTender.id)
    setShowAssignModal(false)
    navigate('/tenders')
  }

  // ── Correction Request portal (POF re-upload view) ──
  if (correctionTender) {
    const requests = (correctionTender.correctionRequests || []).filter(r => !r.resolved)
    return (
      <div className="space-y-5">
        <button
          onClick={closeCorrectionPortal}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
        >
          <ArrowLeft size={14} /> Back
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap bg-white border border-slate-200 rounded-2xl px-5 py-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{correctionTender.id}</span>
              <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Bell size={10} /> Correction Requests from Technical Evaluator
              </span>
            </div>
            <h3 className="font-semibold text-slate-800">{correctionTender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {correctionTender.department} · Upload missing documents flagged by the Technical Evaluator
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold text-amber-600">{requests.length}</p>
            <p className="text-xs text-slate-400">Pending bidder{requests.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Bidder correction cards */}
        <div className="space-y-4">
          {requests.map(req => {
            const isSubmitted   = !!correctionSubmitted[`${correctionTender.id}-${req.bidderId}`]
            const isExtracting  = !!correctionExtracting[req.bidderId]
            const isExtracted   = !!correctionExtracted[req.bidderId]
            const extractPct    = correctionExtractPct[req.bidderId] || 0
            const specificUploaded = req.missingDocs.filter(
              d => correctionUploads[`${req.bidderId}-${d.id}`]
            ).length
            const generalFiles  = correctionGeneral[req.bidderId] || []
            const uploadedCount = specificUploaded + generalFiles.length

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

            return (
              <div key={req.bidderId} className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
                {/* Bidder header */}
                <div className="px-5 py-4 border-b border-slate-100 bg-amber-50 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center shrink-0">
                      <Bell size={16} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{req.bidderName}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        <span className="font-semibold text-slate-700">{req.evaluatorName || 'Technical Evaluator'}</span> sent a re-upload request · {req.notifiedAt}
                      </p>
                    </div>
                  </div>
                  {isSubmitted && (
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-white border border-emerald-200 px-3 py-1.5 rounded-full">
                      <CheckCircle size={11} /> Submitted
                    </span>
                  )}
                </div>

                {/* Missing docs list */}
                <div className="px-5 py-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                    Missing Documents — {req.missingDocs.length} item{req.missingDocs.length !== 1 ? 's' : ''}
                  </p>
                  <div className="space-y-2">
                    {req.missingDocs.map(doc => {
                      const key = `${req.bidderId}-${doc.id}`
                      const fileName = correctionUploads[key]
                      const inputId = `corr-${req.bidderId}-${doc.id}`
                      return (
                        <div key={doc.id}
                          className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all
                            ${fileName ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
                              ${doc.kind === 'mandatory' ? 'bg-red-100' : 'bg-amber-100'}`}>
                              <FileText size={13} className={doc.kind === 'mandatory' ? 'text-red-500' : 'text-amber-500'} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-700 truncate">{doc.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-mono text-slate-400">{doc.docRef}</span>
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold
                                  ${doc.kind === 'mandatory' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                  {doc.kind === 'mandatory' ? 'Mandatory' : 'Optional'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="shrink-0">
                            {fileName ? (
                              <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-semibold">
                                <CheckCircle size={12} />
                                <span className="max-w-[120px] truncate">{fileName}</span>
                              </div>
                            ) : (
                              <label htmlFor={inputId}
                                className={`flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg border cursor-pointer transition-colors
                                  ${isSubmitted
                                    ? 'opacity-40 pointer-events-none bg-slate-100 border-slate-200 text-slate-400'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]'}`}>
                                <Upload size={11} /> Upload
                              </label>
                            )}
                            <input id={inputId} type="file" className="hidden" disabled={isSubmitted}
                              onChange={e => handleCorrectionFileSelect(req.bidderId, doc.id, e.target.files?.[0])} />
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* General document upload zone — always available */}
                  <div className={`mt-3 border-2 border-dashed rounded-xl transition-all
                    ${isSubmitted ? 'opacity-40 pointer-events-none border-slate-200' : 'border-slate-300 hover:border-[var(--color-primary)]/60'}`}>
                    <label className="flex flex-col items-center gap-2 py-5 cursor-pointer">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Upload size={16} className="text-[var(--color-primary)]" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-600">Upload documents for this bidder</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">PDF, ZIP, RAR, DOCX — any format accepted</p>
                      </div>
                      <input type="file" multiple className="hidden" disabled={isSubmitted}
                        onChange={e => { handleGeneralFiles(e.target.files); e.target.value = '' }} />
                    </label>
                    {generalFiles.length > 0 && (
                      <div className="px-4 pb-4 space-y-1.5">
                        {generalFiles.map((f, i) => (
                          <div key={i} className="flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                              <span className="text-[11px] font-medium text-slate-700 truncate">{f.name}</span>
                              <span className="text-[10px] text-slate-400 shrink-0">{f.size}</span>
                            </div>
                            {!isSubmitted && (
                              <button onClick={() => setCorrectionGeneral(prev => ({
                                ...prev,
                                [req.bidderId]: prev[req.bidderId].filter((_, idx) => idx !== i),
                              }))} className="text-slate-300 hover:text-red-400 shrink-0">
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit row — 3-phase: upload → extract → submit */}
                <div className="px-5 pb-5 space-y-3">

                  {/* Phase indicator pills */}
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                    <span className={`px-2.5 py-1 rounded-full ${uploadedCount > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}>1 Upload</span>
                    <span className="text-slate-300">›</span>
                    <span className={`px-2.5 py-1 rounded-full ${isExtracting ? 'bg-blue-100 text-blue-700' : isExtracted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>2 AI Extraction</span>
                    <span className="text-slate-300">›</span>
                    <span className={`px-2.5 py-1 rounded-full ${isSubmitted ? 'bg-emerald-100 text-emerald-700' : isExtracted ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>3 Submit</span>
                  </div>

                  {/* Extraction progress bar */}
                  {isExtracting && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Activity size={12} className="text-blue-600 animate-pulse" />
                          <span className="text-xs font-semibold text-blue-700">AI Extraction Running...</span>
                        </div>
                        <span className="text-xs font-bold text-blue-600">{extractPct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-blue-100 overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${extractPct}%`, background: 'var(--color-primary)' }} />
                      </div>
                    </div>
                  )}

                  {/* Extraction complete */}
                  {isExtracted && !isSubmitted && (
                    <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
                      <CheckCircle size={12} /> AI extraction complete — documents indexed &amp; ready
                    </div>
                  )}

                  {/* Action row */}
                  <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                    <span className="text-xs text-slate-500">
                      {isSubmitted   ? 'Documents submitted to Technical Evaluator for review.'
                       : isExtracted ? 'Extraction complete — submit when ready'
                       : isExtracting ? 'Extracting uploaded documents…'
                       : `${uploadedCount} of ${req.missingDocs.length} file${req.missingDocs.length !== 1 ? 's' : ''} ready`}
                    </span>

                    {/* Phase 2: Run AI Extraction */}
                    {!isSubmitted && !isExtracted && !isExtracting && (
                      <button
                        disabled={uploadedCount === 0}
                        onClick={() => {
                          setCorrectionExtractPct(prev => ({ ...prev, [req.bidderId]: 0 }))
                          setCorrectionExtracting(prev => ({ ...prev, [req.bidderId]: true }))
                        }}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all
                          ${uploadedCount > 0
                            ? 'text-white hover:opacity-90'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        style={uploadedCount > 0 ? { background: 'var(--color-primary)' } : {}}>
                        <Bot size={12} /> Run AI Extraction
                      </button>
                    )}

                    {/* Phase 3: Submit (only after extraction) */}
                    {!isSubmitted && (isExtracted || isExtracting) && (
                      <button
                        disabled={!isExtracted}
                        onClick={() => handleSubmitCorrection(correctionTender, req.bidderId)}
                        className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all
                          ${isExtracted
                            ? 'bg-[var(--color-primary)] hover:opacity-90 text-white'
                            : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                        <Send size={12} /> Submit to Technical Evaluator
                      </button>
                    )}

                    {/* Submitted */}
                    {isSubmitted && (
                      <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-100 text-emerald-600 px-4 py-2 rounded-lg">
                        <CheckCircle size={12} /> Submitted
                      </span>
                    )}
                  </div>
                </div>
              </div>
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

      {/* ── Reassign Evaluator Modal ── */}
      {reassignTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-slate-200">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Reassign Evaluators</h3>
                <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs">{reassignTender.title}</p>
              </div>
              <button onClick={() => setReassignTender(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Technical Evaluator</label>
                <SearchableSelect
                  value={reassignForm.techEval}
                  onChange={v => setReassignForm(f => ({ ...f, techEval: v === '' ? '' : String(v) }))}
                  options={techEvaluators}
                  getValue={u => u.id}
                  getLabel={u => u.name}
                  getSubLabel={u => u.email || u.username || ''}
                  placeholder="— Select Technical Evaluator —"
                  searchPlaceholder="Search evaluators…"
                  emptyText="No matching evaluators"
                  ariaLabel="Technical Evaluator"
                  clearable
                />
                {reassignErrors.techEval && <p className="text-[11px] text-red-500 mt-1">{reassignErrors.techEval}</p>}
                {reassignTender.assignedTechEval && (
                  <p className="text-[11px] text-slate-400 mt-1">Current: {reassignTender.assignedTechEval.name}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Commercial Evaluator</label>
                <SearchableSelect
                  value={reassignForm.commEval}
                  onChange={v => setReassignForm(f => ({ ...f, commEval: v === '' ? '' : String(v) }))}
                  options={commEvaluators}
                  getValue={u => u.id}
                  getLabel={u => u.name}
                  getSubLabel={u => u.email || u.username || ''}
                  placeholder="— Select Commercial Evaluator —"
                  searchPlaceholder="Search evaluators…"
                  emptyText="No matching evaluators"
                  ariaLabel="Commercial Evaluator"
                  clearable
                />
                {reassignErrors.commEval && <p className="text-[11px] text-red-500 mt-1">{reassignErrors.commEval}</p>}
                {reassignTender.assignedCommEval && (
                  <p className="text-[11px] text-slate-400 mt-1">Current: {reassignTender.assignedCommEval.name}</p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-slate-100">
              <button onClick={() => setReassignTender(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">
                Cancel
              </button>
              <button onClick={confirmReassign}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[var(--color-primary)] text-white hover:opacity-90 transition-all">
                <Save size={12} /> Confirm Reassignment
              </button>
            </div>
          </div>
        </div>
      )}
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
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{uploadTenders.length} {t('ing.ready')}</span>
        </div>
        {uploadTenders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <Lock size={32} />
            <p className="text-sm font-medium">{t('ing.noTenders')}</p>
            <p className="text-xs">{t('ing.noTendersSub')}</p>
          </div>
        )}
        <div className="space-y-3">
          {uploadTenders.map(tender => (
            <Card key={tender.id} className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group" onClick={() => setSelectedTender(tender)}>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stageColor[tender.status] || 'bg-slate-100 text-slate-600'}`}>{stageLabel[tender.status] || tender.stage}</span>
                    {tender.status === 'upload' && <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-blue-600 text-white animate-pulse">Ready for Upload</span>}
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 truncate">{tender.title}</h3>
                  <div className="flex items-center gap-4 mt-2">
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Building2 size={11} /> {tender.department}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Calendar size={11} /> Deadline {tender.deadline}</span>
                    <span className="flex items-center gap-1 text-xs text-slate-400"><Users size={11} /> {tender.bidders} bidder{tender.bidders !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800">{tender.budget}</p>
                    <p className="text-[10px] text-slate-400">Budget</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-primary)] transition-colors" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* ── Active Evaluations — Reassign Evaluator ── */}
        {evaluationTenders.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-700">Active Evaluations</h3>
              <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{evaluationTenders.length}</span>
            </div>
            <div className="space-y-3">
              {evaluationTenders.map(tender => (
                <Card key={tender.id} className="p-4 border-slate-200">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">{tender.stage}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 truncate">{tender.title}</h3>
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        {tender.assignedTechEval && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-emerald-100 text-emerald-700 text-[9px] font-bold flex items-center justify-center">
                              {tender.assignedTechEval.name[0]}
                            </span>
                            Tech: {tender.assignedTechEval.name}
                          </span>
                        )}
                        {tender.assignedCommEval && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1">
                            <span className="w-4 h-4 rounded bg-blue-100 text-blue-700 text-[9px] font-bold flex items-center justify-center">
                              {tender.assignedCommEval.name[0]}
                            </span>
                            Comm: {tender.assignedCommEval.name}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => openReassignModal(tender)}
                      className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors shrink-0">
                      <UserPlus size={12} /> Reassign
                    </button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ── Correction Requests from Technical Evaluator ── */}
        {correctionTenders.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Bell size={14} className="text-amber-500" />
              <h3 className="text-sm font-semibold text-slate-700">Correction Requests — Technical Evaluator</h3>
              <span className="text-xs font-bold text-white bg-amber-500 px-2 py-0.5 rounded-full">
                {correctionTenders.reduce((n, t) => n + (t.correctionRequests?.filter(r => !r.resolved).length || 0), 0)} pending
              </span>
            </div>
            <div className="space-y-3">
              {correctionTenders.map(tender => {
                const pending = tender.correctionRequests.filter(r => !r.resolved)
                return (
                  <Card key={tender.id}
                    className="p-4 cursor-pointer hover:shadow-md hover:border-amber-300 transition-all group border-amber-200 bg-amber-50/40"
                    onClick={() => { setCorrectionTender(tender); setCorrectionUploads({}); setCorrectionSubmitted({}); setCorrectionExtracting({}); setCorrectionExtracted({}); setCorrectionExtractPct({}); setCorrectionGeneral({}) }}>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
                            {tender.stage}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800 truncate">{tender.title}</h3>
                        <div className="flex items-center gap-4 mt-2">
                          <span className="flex items-center gap-1 text-xs text-slate-400"><Building2 size={11} /> {tender.department}</span>
                          <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                            <AlertTriangle size={11} /> {pending.length} bidder{pending.length !== 1 ? 's' : ''} need re-upload
                          </span>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-amber-300 group-hover:text-amber-500 transition-colors shrink-0" />
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
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

      {/* ── Evaluator Assignment Modal ── */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <Card className="w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <Users size={14} className="text-[var(--color-primary)]" /> Assign Evaluators
              </h3>
              <button onClick={() => setShowAssignModal(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="px-5 py-2 bg-blue-50 border-b border-blue-100">
              <p className="text-[11px] text-blue-700">
                Assign evaluators before moving <span className="font-semibold">{selectedTender?.id}</span> to evaluation.
                Each evaluator will only see tenders assigned to them.
              </p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Evaluation flow — chosen at ingestion, shown read-only here */}
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-xs font-medium text-slate-600">Evaluation Flow</span>
                <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary)]">
                  {evalMode === 'parallel' ? <ArrowRightLeft size={13} /> : <GitBranch size={13} />}
                  {evalMode === 'parallel' ? 'Parallel' : 'Linear'}
                </span>
              </div>

              {/* Technical Evaluator — Contract Holder */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Technical Evaluator <span className="text-slate-400 font-medium">(Contract Holder)</span> <span className="font-secondary text-red-400">*</span>
                </label>
                <SearchableSelect
                  value={assignments.techEval}
                  onChange={v => { setAssignments(a => ({ ...a, techEval: v === '' ? '' : String(v) })); setAssignModalErrors(er => ({ ...er, techEval: '' })) }}
                  options={techEvaluators}
                  getValue={u => u.id}
                  getLabel={u => u.name}
                  getSubLabel={u => u.email || u.username || ''}
                  placeholder="— Select Contract Holder —"
                  searchPlaceholder="Search contract holders…"
                  emptyText="No matching contract holders"
                  ariaLabel="Technical Evaluator"
                  error={!!assignModalErrors.techEval}
                  clearable
                />
                {assignModalErrors.techEval && <p className="text-[10px] text-red-500 mt-0.5">{assignModalErrors.techEval}</p>}
              </div>

              {/* Commercial Evaluator — Contract Engineer */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Commercial Evaluator <span className="text-slate-400 font-medium">(Contract Engineer)</span> <span className="font-secondary text-red-400">*</span>
                </label>
                <SearchableSelect
                  value={assignments.commEval}
                  onChange={v => { setAssignments(a => ({ ...a, commEval: v === '' ? '' : String(v) })); setAssignModalErrors(er => ({ ...er, commEval: '' })) }}
                  options={commEvaluators}
                  getValue={u => u.id}
                  getLabel={u => u.name}
                  getSubLabel={u => u.email || u.username || ''}
                  placeholder="— Select Contract Engineer —"
                  searchPlaceholder="Search contract engineers…"
                  emptyText="No matching contract engineers"
                  ariaLabel="Commercial Evaluator"
                  error={!!assignModalErrors.commEval}
                  clearable
                />
                {assignModalErrors.commEval && <p className="text-[10px] text-red-500 mt-0.5">{assignModalErrors.commEval}</p>}
              </div>

            </div>

            <div className="flex gap-2 px-5 pb-5">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowAssignModal(false)}>
                Cancel
              </Button>
              <Button className="flex-1 justify-center" onClick={confirmProceedToEvaluation}>
                <CheckCircle size={13} /> Confirm &amp; Proceed
              </Button>
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
                style={{ background: 'var(--color-primary)' }}
                  style={{ width: uploadedBidders.length ? `${(uploadedBidders.filter(b => b.status === 'completed').length / uploadedBidders.length) * 100}%` : '0%' }}
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
