import { useState, useEffect, useRef } from 'react'
import { Upload, FileArchive, CheckCircle, Clock, Bot, X, AlertCircle, ArrowLeft, ChevronRight, Users, Calendar, Building2, Lock, Activity, UserPlus, Save, Phone, Bell, FileText, AlertTriangle, Send } from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'


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
  const { tenders, advanceTender, updateTender } = useTenders()
  const { lang, t, } = useLanguage()
  const { users } = useAuth()
  const uploadTenders = tenders.filter(t => t.status === 'upload')

  const techEvaluators = users.filter(u => u.roleId === 'tech_eval' && u.status === 'active')
  const commEvaluators = users.filter(u => u.roleId === 'comm_eval' && u.status === 'active')

  const paramTender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const [selectedTender, setSelectedTender] = useState(paramTender || null)
  const [bidders, setBidders] = useState([])
  const [dragging, setDragging] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [showTracker, setShowTracker] = useState(false)
  const [logEntries, setLogEntries] = useState([])

  // Add Bidder modal
  const [showAddBidder, setShowAddBidder] = useState(false)
  const [bidderForm, setBidderForm] = useState({ company: '', contact: '', phone: '' })
  const [bidderErrors, setBidderErrors] = useState({})

  // Evaluator assignment modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignments, setAssignments] = useState({ techEval: '', commEval: '' })
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

  // Assign Document modal (when a file is dropped on the zone)
  const [pendingFile, setPendingFile] = useState(null)
  const [assignTo, setAssignTo] = useState('')
  const [newBidderForm, setNewBidderForm] = useState({ company: '', contact: '', phone: '' })
  const [assignErrors, setAssignErrors] = useState({})

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
        const uploaded = prev.filter(b => b.status !== 'no_document')
        if (uploaded.every(b => b.status === 'completed')) return prev
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
    const uploaded = bidders.filter(b => b.status !== 'no_document')
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

  const openAssignModal = (incoming) => {
    const file = Array.from(incoming).find(f => /\.(zip|rar)$/i.test(f.name))
    if (!file) return
    const size = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`
    setPendingFile({ name: file.name, size })
    const unassigned = bidders.find(b => b.status === 'no_document')
    setAssignTo(unassigned ? String(unassigned.id) : 'new')
    setNewBidderForm({ company: '', contact: '', phone: '' })
    setAssignErrors({})
  }

  const confirmAssign = () => {
    if (!pendingFile) return
    if (assignTo === 'new') {
      const errs = {}
      if (!newBidderForm.company.trim()) errs.company = 'Required'
      if (!newBidderForm.contact.trim()) errs.contact = 'Required'
      if (Object.keys(errs).length) { setAssignErrors(errs); return }
      const newId = Math.max(0, ...bidders.map(b => b.id)) + 1
      setBidders(prev => [...prev, {
        id: newId, company: newBidderForm.company.trim(), contact: newBidderForm.contact.trim(),
        phone: newBidderForm.phone.trim(),
        fileName: pendingFile.name, fileSize: pendingFile.size,
        status: 'queued', extracted: 0, _max: 120,
      }])
    } else {
      setBidders(prev => prev.map(b =>
        b.id === Number(assignTo)
          ? { ...b, fileName: pendingFile.name, fileSize: pendingFile.size, status: 'queued', extracted: 0, _max: 120 }
          : b
      ))
    }
    setPendingFile(null)
  }

  const attachFileToBidder = (bidderId, incoming) => {
    const file = Array.from(incoming).find(f => /\.(zip|rar)$/i.test(f.name))
    if (!file) return
    const size = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(file.size / 1024).toFixed(0)} KB`
    setBidders(prev => prev.map(b =>
      b.id === bidderId
        ? { ...b, fileName: file.name, fileSize: size, status: 'queued', extracted: 0, _max: 120 }
        : b
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
      fileName: null, fileSize: null, status: 'no_document', extracted: 0, _max: 120,
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
    error:       <Badge variant="error"><AlertCircle size={10} /> {lang === 'ar' ? 'خطأ' : 'Error'}</Badge>,
  }

  const uploadedBidders = bidders.filter(b => b.status !== 'no_document')
  const allExtracted = uploadedBidders.length > 0 && uploadedBidders.every(b => b.status === 'completed')
  const hasQueued = bidders.some(b => b.status === 'queued')

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
    setAssignments({ techEval: '', commEval: '', legalReview: '' })
    setAssignModalErrors({})
    setShowAssignModal(true)
  }

  const confirmProceedToEvaluation = () => {
    const errs = {}
    if (!assignments.techEval) errs.techEval = 'Required'
    if (!assignments.commEval) errs.commEval = 'Required'
    if (Object.keys(errs).length) { setAssignModalErrors(errs); return }

    const bidderList = bidders.map(b => ({
      id: b.id,
      name: b.company,
      country: b.phone ? b.phone.split(' ')[0] : '—',
      contact: b.contact,
      phone: b.phone || '',
    }))
    const techUser = users.find(u => u.id === Number(assignments.techEval))
    const commUser = users.find(u => u.id === Number(assignments.commEval))
    updateTender(selectedTender.id, {
      bidderList,
      bidders: bidders.length,
      assignedTechEval: techUser ? { id: techUser.id, name: techUser.name } : null,
      assignedCommEval: commUser ? { id: commUser.id, name: commUser.name } : null,
    })
    advanceTender(selectedTender.id)
    setShowAssignModal(false)
    navigate('/tenders')
  }

  // ── Correction Request portal (POF re-upload view) ──
  if (correctionTender) {
    const requests = (correctionTender.correctionRequests || []).filter(r => !r.resolved)
    return (
      <div className="space-y-5">
        <button
          onClick={() => { setCorrectionTender(null); setCorrectionUploads({}); setCorrectionSubmitted({}); setCorrectionExtracting({}); setCorrectionExtracted({}); setCorrectionExtractPct({}); setCorrectionGeneral({}) }}
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
                <select
                  value={reassignForm.techEval}
                  onChange={e => setReassignForm(f => ({ ...f, techEval: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-slate-700">
                  <option value="">— Select Technical Evaluator —</option>
                  {techEvaluators.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.name}</option>
                  ))}
                </select>
                {reassignErrors.techEval && <p className="text-[11px] text-red-500 mt-1">{reassignErrors.techEval}</p>}
                {reassignTender.assignedTechEval && (
                  <p className="text-[11px] text-slate-400 mt-1">Current: {reassignTender.assignedTechEval.name}</p>
                )}
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 mb-1.5 block">Commercial Evaluator</label>
                <select
                  value={reassignForm.commEval}
                  onChange={e => setReassignForm(f => ({ ...f, commEval: e.target.value }))}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-slate-700">
                  <option value="">— Select Commercial Evaluator —</option>
                  {commEvaluators.map(u => (
                    <option key={u.id} value={String(u.id)}>{u.name}</option>
                  ))}
                </select>
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
                    <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
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
                        <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
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
                          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
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
        <button onClick={() => tenderId ? navigate('/tenders') : setSelectedTender(null)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> Back
        </button>
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Lock size={36} />
          <p className="text-sm font-semibold text-slate-700">Document upload not available</p>
          <p className="text-xs text-center max-w-xs">
            <span className="font-mono text-slate-500">{selectedTender.id}</span> is currently in the <strong>{selectedTender.stage}</strong> stage.
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
        <button onClick={() => tenderId ? navigate('/tenders') : setSelectedTender(null)} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> {tenderId ? t('common.backToList') : t('common.backToList2')}
        </button>
        <span className="text-slate-200">|</span>
        <span className="text-xs text-slate-400">{selectedTender.id}</span>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{selectedTender.id}</span>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: Upload zone + AI info */}
        <div className="lg:col-span-1 space-y-4">
          <Card
            className={`border-2 border-dashed transition-all cursor-pointer ${dragging ? 'border-[var(--color-primary)] bg-blue-50' : 'border-slate-200 hover:border-[var(--color-primary)]/50'}`}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); openAssignModal(e.dataTransfer.files) }}
          >
            <div className="p-8 text-center">
              <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${dragging ? 'bg-[var(--color-primary)]' : 'bg-slate-100'}`}>
                <Upload size={24} className={dragging ? 'text-white' : 'text-slate-400'} />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">{t('ing.dropHere')}</p>
              <p className="text-xs text-slate-400 mb-4">{t('ing.supports')}</p>
              <label className="cursor-pointer">
                <span className="px-4 py-2 bg-[var(--color-primary)] text-white text-xs font-medium rounded-lg hover:opacity-90 transition-opacity">{t('ing.browseFiles')}</span>
                <input type="file" multiple accept=".zip,.rar" className="hidden" onChange={e => { openAssignModal(e.target.files); e.target.value = '' }} />
              </label>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bot size={14} style={{ color: 'var(--color-primary)' }} />
              <h3 className="text-sm font-semibold text-slate-800">{t('ing.aiEngine')}</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-600">
              {[
                { label: 'Documents Processed', value: '260 pages' },
                { label: 'Events Mapped', value: '327 items' },
                { label: 'Avg. Accuracy', value: '96.4%' },
                { label: 'Processing Time', value: '~4 min/bundle' },
              ].map(s => (
                <div key={s.label} className="flex justify-between">
                  <span className="text-slate-400">{s.label}</span>
                  <span className="font-medium text-slate-700">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right: Bidder list */}
        <div className="lg:col-span-2 space-y-3">
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

          {bidders.map(b => (
            <Card key={b.id} className="p-4">
              <div className="flex items-start gap-3">
                {/* Status icon */}
                <div className={`p-2.5 rounded-xl shrink-0
                  ${b.status === 'completed' ? 'bg-green-50' : b.status === 'processing' ? 'bg-amber-50' : b.status === 'no_document' ? 'bg-slate-50' : 'bg-blue-50'}`}>
                  {b.status === 'no_document'
                    ? <Users size={18} className="text-slate-400" />
                    : <FileArchive size={18} className={b.status === 'completed' ? 'text-green-500' : b.status === 'processing' ? 'text-amber-500' : 'text-blue-400'} />}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Company + status + remove */}
                  <div className="flex items-center justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 truncate">{b.company}</span>
                      {statusBadge[b.status]}
                    </div>
                    <button onClick={() => setBidders(prev => prev.filter(x => x.id !== b.id))} className="p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-500 shrink-0">
                      <X size={13} />
                    </button>
                  </div>

                  {/* Contact person + phone */}
                  <div className="flex items-center gap-3 mb-1">
                    <p className="text-xs text-slate-500">{b.contact} · {t('ing.contact')}</p>
                    {b.phone && (
                      <span className="flex items-center gap-1 text-xs text-slate-400">
                        <Phone size={10} /> {b.phone}
                      </span>
                    )}
                  </div>

                  {/* File info or attach prompt */}
                  {b.fileName
                    ? <p className="text-xs text-slate-400 truncate">{b.fileName} · {b.fileSize}</p>
                    : (
                      <label className="cursor-pointer mt-1 inline-flex items-center gap-1.5 text-xs text-[var(--color-primary)] hover:underline">
                        <Upload size={11} /> {t('ing.attachDoc')}
                        <input type="file" accept=".zip,.rar" className="hidden" onChange={e => { attachFileToBidder(b.id, e.target.files); e.target.value = '' }} />
                      </label>
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
                </div>
              </div>
            </Card>
          ))}

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
                <label className="text-xs font-medium text-slate-600 block mb-1">{t('ing.companyName')} <span className="text-red-400">*</span></label>
                <input
                  value={bidderForm.company}
                  onChange={e => { setBidderForm(f => ({ ...f, company: e.target.value })); setBidderErrors(er => ({ ...er, company: '' })) }}
                  placeholder={t('ing.companyPlaceholder')}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${bidderErrors.company ? 'border-red-300' : 'border-slate-200'}`}
                />
                {bidderErrors.company && <p className="text-[10px] text-red-500 mt-0.5">{bidderErrors.company}</p>}
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1">{t('ing.contactPerson')} <span className="text-red-400">*</span></label>
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

      {/* ── Assign Document Modal ── */}
      {pendingFile && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <Card className="w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                <FileArchive size={14} className="text-[var(--color-primary)]" /> {t('ing.assignTitle')}
              </h3>
              <button onClick={() => setPendingFile(null)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400"><X size={15} /></button>
            </div>
            <div className="px-5 py-4 space-y-4">
              {/* File info */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2.5">
                <FileArchive size={16} className="text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-700 truncate">{pendingFile.name}</p>
                  <p className="text-[10px] text-slate-400">{pendingFile.size}</p>
                </div>
              </div>

              {/* Bidder selector */}
              <div>
                <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('ing.assignTo')}</label>
                <div className="space-y-1.5">
                  {bidders.filter(b => b.status === 'no_document').map(b => (
                    <label key={b.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors
                      ${assignTo === String(b.id) ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                      <input type="radio" name="assignTo" value={String(b.id)} checked={assignTo === String(b.id)} onChange={e => setAssignTo(e.target.value)} className="text-[var(--color-primary)]" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">{b.company}</p>
                        <p className="text-xs text-slate-400">{b.contact}</p>
                      </div>
                    </label>
                  ))}
                  <label className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-colors
                    ${assignTo === 'new' ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5' : 'border-slate-200 hover:border-slate-300'}`}>
                    <input type="radio" name="assignTo" value="new" checked={assignTo === 'new'} onChange={() => setAssignTo('new')} className="text-[var(--color-primary)]" />
                    <p className="text-sm font-medium text-slate-500">{t('ing.newBidder')}</p>
                  </label>
                </div>
              </div>

              {/* New bidder inline form */}
              {assignTo === 'new' && (
                <div className="space-y-2 pl-6">
                  <div>
                    <input
                      value={newBidderForm.company}
                      onChange={e => { setNewBidderForm(f => ({ ...f, company: e.target.value })); setAssignErrors(er => ({ ...er, company: '' })) }}
                      placeholder="Company name *"
                      className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${assignErrors.company ? 'border-red-300' : 'border-slate-200'}`}
                    />
                    {assignErrors.company && <p className="text-[10px] text-red-500 mt-0.5">{assignErrors.company}</p>}
                  </div>
                  <div>
                    <input
                      value={newBidderForm.contact}
                      onChange={e => { setNewBidderForm(f => ({ ...f, contact: e.target.value })); setAssignErrors(er => ({ ...er, contact: '' })) }}
                      placeholder="Contact person *"
                      className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${assignErrors.contact ? 'border-red-300' : 'border-slate-200'}`}
                    />
                    {assignErrors.contact && <p className="text-[10px] text-red-500 mt-0.5">{assignErrors.contact}</p>}
                  </div>
                  <div className="relative">
                    <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      value={newBidderForm.phone}
                      onChange={e => setNewBidderForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="Contact number (optional)"
                      type="tel"
                      className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 px-5 pb-5">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => setPendingFile(null)}>{t('common.cancel')}</Button>
              <Button className="flex-1 justify-center" onClick={confirmAssign}><CheckCircle size={13} /> {t('ing.assign')}</Button>
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
                Assign evaluators before moving <span className="font-semibold">{selectedTender?.id}</span> to Technical Evaluation.
                Each evaluator will only see tenders assigned to them.
              </p>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Technical Evaluator */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Technical Evaluator <span className="text-red-400">*</span>
                </label>
                <select
                  value={assignments.techEval}
                  onChange={e => { setAssignments(a => ({ ...a, techEval: e.target.value })); setAssignModalErrors(er => ({ ...er, techEval: '' })) }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white
                    ${assignModalErrors.techEval ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">— Select Technical Evaluator —</option>
                  {techEvaluators.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
                {assignModalErrors.techEval && <p className="text-[10px] text-red-500 mt-0.5">{assignModalErrors.techEval}</p>}
              </div>

              {/* Commercial Evaluator */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1.5">
                  Commercial Evaluator <span className="text-red-400">*</span>
                </label>
                <select
                  value={assignments.commEval}
                  onChange={e => { setAssignments(a => ({ ...a, commEval: e.target.value })); setAssignModalErrors(er => ({ ...er, commEval: '' })) }}
                  className={`w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white
                    ${assignModalErrors.commEval ? 'border-red-300' : 'border-slate-200'}`}
                >
                  <option value="">— Select Commercial Evaluator —</option>
                  {commEvaluators.map(u => (
                    <option key={u.id} value={u.id}>{u.name}</option>
                  ))}
                </select>
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
