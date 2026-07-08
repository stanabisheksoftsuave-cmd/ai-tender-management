import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users, Bot, Send, ShieldOff, FileText, ArrowLeft, CheckCircle,
  XCircle, Download, Award, ChevronRight, UploadCloud, Ban, Wallet, RotateCcw,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SectionFillStep from '../components/itt/SectionFillStep'
import {
  erpBidders, WORK_CATEGORIES, QHSE_CRITERIA, TECHNICAL_CRITERIA_PQ,
  ADMINISTRATIVE_CRITERIA, assessFinancials,
} from '../data/mockData'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { buildFilledDocxBlob } from '../utils/docxTemplate'
import { exportPreQualSummaryPDF } from '../utils/exportPDF'

const PREQUAL_STATUSES = ['prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4', 'prequal_rejected']

const PQQ_SECTION = {
  id: 'pqq',
  title: 'Pre-Qualification Questionnaire',
  docxUrl: '/pq-templates/pre-qualification-questionnaire.docx',
}

const SHEETS = [
  { key: 'qhse', label: 'QHSE Pre-Qualification', criteria: QHSE_CRITERIA },
  { key: 'technical', label: 'Technical Pre-Qualification', criteria: TECHNICAL_CRITERIA_PQ },
  { key: 'administrative', label: 'Administrative Pre-Qualification', criteria: ADMINISTRATIVE_CRITERIA },
]

// Handed to the Contract Engineer alongside the qualified bidderList at ITT handoff.
const HANDOFF_DOCS = [
  { key: 'benchmarking',    label: 'OEM Benchmarking Rates' },
  { key: 'companyEstimate', label: 'Company Estimate' },
  { key: 'riskAssessment',  label: 'Contract Risk Assessment' },
]

function sheetOverall(bidder, sheetKey, criteria) {
  const marks = bidder.stage3?.[sheetKey] || {}
  const applicable = criteria.filter(c => !(c.localOnly && !bidder.isLocal))
  if (applicable.some(c => marks[c.id] === 'fail')) return 'fail'
  if (applicable.every(c => marks[c.id])) return 'pass'
  return null
}

function stage3Overall(bidder) {
  const results = SHEETS.map(s => sheetOverall(bidder, s.key, s.criteria))
  if (results.some(r => r === 'fail')) return 'fail'
  if (results.every(r => r === 'pass')) return 'pass'
  return null
}

// AI's simulated first-pass evaluation — defaults every applicable criterion to
// Pass. This is the baseline the Contract Holder reviews and can override; it's
// stored separately (stage3Ai) so overrides can be visually distinguished and reset.
function generateAiStage3(bidder) {
  const result = {}
  SHEETS.forEach(sheet => {
    const marks = {}
    sheet.criteria.filter(c => !(c.localOnly && !bidder.isLocal)).forEach(c => { marks[c.id] = 'pass' })
    result[sheet.key] = marks
  })
  return result
}

export default function PreQualification() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders, updateTender } = useTenders()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  // Stage 1 local state
  const [sowFileName, setSowFileName] = useState('')
  const [workCategory, setWorkCategory] = useState(WORK_CATEGORIES[0])
  const [matching, setMatching] = useState(false)
  const [matched, setMatched] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  // Stage 2 local state
  const [pqqAnswers, setPqqAnswers] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Stage 3 local state
  const [processingId, setProcessingId] = useState(null)
  const [processingPhase, setProcessingPhase] = useState(null) // 'upload' | 'ai'
  const [selectedUploadIdRaw, setSelectedUploadIdRaw] = useState(null)

  // Stage 4 local state
  const [finance, setFinance] = useState({}) // { [bidderId]: { statementSubmitted, auditOpinion, zZone } }
  const [finalizing, setFinalizing] = useState(false)
  const [selectedAssessIdRaw, setSelectedAssessIdRaw] = useState(null)

  useEffect(() => {
    if (matching) {
      const t = setTimeout(() => {
        setMatching(false)
        setMatched(true)
        setSelectedIds(erpBidders.filter(b => b.category === workCategory).map(b => b.id))
      }, 1100)
      return () => clearTimeout(t)
    }
  }, [matching, workCategory])

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Holders can access this page.</p>
    </div>
  )

  if (!tenderId) {
    const list = tenders.filter(t => PREQUAL_STATUSES.includes(t.status))
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">Pre-Qualification</h2>
            <p className="text-xs text-slate-400 mt-0.5">Select a tender to continue pre-qualification</p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{list.length} tender{list.length !== 1 ? 's' : ''}</span>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">No tenders in pre-qualification</p>
          </div>
        ) : (
          <div className="space-y-3">
            {list.map(td => (
              <Card key={td.id} className="p-4 cursor-pointer hover:shadow-md hover:border-[var(--color-primary)]/30 transition-all group"
                onClick={() => navigate(`/pre-qualification/${td.id}`)}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{td.id}</span>
                      <Badge variant={td.status}>{td.stage}</Badge>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{td.title}</h3>
                    <p className="text-xs text-slate-400 mt-1">{td.department || td.tenderType}</p>
                  </div>
                  <ChevronRight size={16} className="text-slate-300 group-hover:text-[var(--color-primary)] transition-colors shrink-0" />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (!tender || !PREQUAL_STATUSES.includes(tender.status)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found or not in pre-qualification.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>Back to Dashboard</Button>
    </div>
  )

  const prequalBidders = tender.prequalBidders || []
  const activeBidders = prequalBidders.filter(b => !b.droppedAt)

  // Bidders still awaiting a response upload (dropdown only offers these — once
  // uploaded/evaluated a bidder drops out of the dropdown and gets a result card).
  const pendingUploadBidders = activeBidders.filter(b => !b.responseUploaded && b.id !== processingId)
  const selectedUploadId = pendingUploadBidders.some(b => b.id === selectedUploadIdRaw)
    ? selectedUploadIdRaw
    : pendingUploadBidders[0]?.id ?? null

  // Same idea for Stage 4 — only bidders not yet financially assessed appear in the dropdown.
  const pendingAssessBidders = activeBidders.filter(b => !b.stage4?.result)
  const selectedAssessId = pendingAssessBidders.some(b => b.id === selectedAssessIdRaw)
    ? selectedAssessIdRaw
    : pendingAssessBidders[0]?.id ?? null

  const patchBidder = (bidderId, patch) => {
    const next = prequalBidders.map(b => b.id === bidderId ? { ...b, ...patch } : b)
    updateTender(tender.id, { prequalBidders: next })
  }

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const confirmShortlist = () => {
    const shortlisted = erpBidders
      .filter(b => selectedIds.includes(b.id))
      .map(b => ({ id: b.id, name: b.name, country: b.country, category: b.category, isLocal: b.isLocal, responseUploaded: false, stage3: { qhse: {}, technical: {}, administrative: {} } }))
    updateTender(tender.id, {
      status: 'prequal_stage2',
      stage: 'Pre-Qualification — Questionnaire',
      sowFileName,
      workCategory,
      prequalBidders: shortlisted,
    })
  }

  const handleGeneratePqq = async () => {
    setGenerating(true)
    try {
      const blob = await buildFilledDocxBlob(PQQ_SECTION.docxUrl, pqqAnswers || [])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `PQQ - ${tender.id}.docx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setGenerated(true)
    } finally {
      setGenerating(false)
    }
  }

  const distributeQuestionnaire = () => {
    updateTender(tender.id, { status: 'prequal_stage3', stage: 'Pre-Qualification — Response Review' })
  }

  const handleResponseFileChosen = (bidderId, file) => {
    if (!file) return
    setProcessingId(bidderId)
    setProcessingPhase('upload')
    setTimeout(() => {
      setProcessingPhase('ai')
      setTimeout(() => {
        const bidder = prequalBidders.find(b => b.id === bidderId)
        const aiMarks = generateAiStage3(bidder)
        patchBidder(bidderId, { responseUploaded: true, responseFileName: file.name, stage3: aiMarks, stage3Ai: aiMarks })
        setProcessingId(null)
        setProcessingPhase(null)
      }, 1100)
    }, 700)
  }

  const setSheetMark = (bidderId, sheetKey, criterionId, value) => {
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder) return
    patchBidder(bidderId, { stage3: { ...bidder.stage3, [sheetKey]: { ...bidder.stage3[sheetKey], [criterionId]: value } } })
  }

  const resetMarkToAi = (bidderId, sheetKey, criterionId) => {
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder?.stage3Ai) return
    setSheetMark(bidderId, sheetKey, criterionId, bidder.stage3Ai[sheetKey][criterionId])
  }

  const allStage3Decided = activeBidders.length > 0 && activeBidders.every(b => b.responseUploaded && stage3Overall(b))

  const finalizeStage3 = () => {
    const passed = activeBidders.filter(b => stage3Overall(b) === 'pass')
    const failed = activeBidders.filter(b => stage3Overall(b) === 'fail')
    const nextBidders = [
      ...passed,
      ...failed.map(b => ({ ...b, droppedAt: 'stage3' })),
      ...prequalBidders.filter(b => b.droppedAt),
    ]
    if (passed.length === 0) {
      updateTender(tender.id, { status: 'prequal_rejected', prequalBidders: nextBidders })
      return
    }
    updateTender(tender.id, { status: 'prequal_stage4', stage: 'Pre-Qualification — Financial Assessment', prequalBidders: nextBidders })
  }

  const setFinanceField = (bidderId, key, value) =>
    setFinance(prev => ({ ...prev, [bidderId]: { ...(prev[bidderId] || { statementSubmitted: true, auditOpinion: 'Unqualified Opinion', zZone: 'Green' }), [key]: value } }))

  const assessBidder = (bidderId) => {
    const input = finance[bidderId] || { statementSubmitted: true, auditOpinion: 'Unqualified Opinion', zZone: 'Green' }
    const { result, recommendation } = assessFinancials(input)
    patchBidder(bidderId, { stage4: { ...input, result, recommendation } })
  }

  const allStage4Assessed = activeBidders.length > 0 && activeBidders.every(b => b.stage4?.result)
  const qualifiedFinal = activeBidders.filter(b => b.stage4?.result === 'PASS')
  const allHandoffDocsUploaded = qualifiedFinal.length > 0 && qualifiedFinal.every(b => HANDOFF_DOCS.every(d => b.handoffDocs?.[d.key]))

  const uploadHandoffDoc = (bidderId, docKey, file) => {
    if (!file) return
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder) return
    patchBidder(bidderId, { handoffDocs: { ...bidder.handoffDocs, [docKey]: file.name } })
  }

  const finalizeStage4 = () => {
    setFinalizing(true)
    const failed = activeBidders.filter(b => b.stage4?.result !== 'PASS')
    const nextBidders = [
      ...qualifiedFinal,
      ...failed.map(b => ({ ...b, droppedAt: 'stage4' })),
      ...prequalBidders.filter(b => b.droppedAt),
    ]
    setTimeout(() => {
      if (qualifiedFinal.length === 0) {
        updateTender(tender.id, { status: 'prequal_rejected', prequalBidders: nextBidders })
        return
      }
      updateTender(tender.id, {
        status: 'draft',
        stage: 'Draft — Pending Export',
        prequalBidders: nextBidders,
        bidderList: qualifiedFinal.map(b => ({ id: b.id, name: b.name, country: b.country, handoffDocs: b.handoffDocs })),
        bidders: qualifiedFinal.length,
      })
      navigate('/tenders')
    }, 400)
  }

  return (
    <div className="space-y-5">

      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant={tender.status}>{tender.stage}</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.tenderType}{tender.department ? ` · ${tender.department}` : ''}</p>
          </div>
        </div>
      </Card>

      {/* ── Stage 1: Bidder Matching ── */}
      {tender.status === 'prequal_stage1' && (
        <>
          <Card className="p-5 space-y-4">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stage 1 — Bidder Matching</h4>
            <p className="text-xs text-slate-500">
              Upload the tender's Statement of Work and select a Work Category. The system will match the ERP
              bidder registry against this tender's scope before pre-qualification is issued.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Statement of Work (SOW)</label>
                <label className="flex items-center gap-2 text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                  <UploadCloud size={14} className="text-slate-400" />
                  <span className="text-slate-600 truncate">{sowFileName || 'Choose file to upload...'}</span>
                  <input type="file" className="hidden" onChange={e => setSowFileName(e.target.files?.[0]?.name || '')} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Work Category</label>
                <select
                  value={workCategory}
                  onChange={e => { setWorkCategory(e.target.value); setMatched(false) }}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
                >
                  {WORK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {!matched && (
              <Button disabled={!sowFileName || matching} onClick={() => setMatching(true)}>
                <Bot size={13} /> {matching ? 'Analysing SOW & Matching Bidders…' : 'Analyse SOW & Match Bidders'}
              </Button>
            )}
          </Card>

          {matched && (
            <>
              <Card className="overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                  <Users size={14} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-slate-800">ERP Bidder Registry</h3>
                  <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{selectedIds.length} matched to "{workCategory}"</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {erpBidders.map(b => {
                    const isMatch = b.category === workCategory
                    return (
                      <label key={b.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors">
                        <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} className="accent-[var(--color-primary)]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{b.name}</span>
                            <span className="text-xs text-slate-400">{b.country}</span>
                            {isMatch && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Category Match</span>}
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">{b.category} · {b.natureOfBusiness}</p>
                        </div>
                      </label>
                    )
                  })}
                </div>
              </Card>
              <div className="flex justify-end">
                <Button disabled={selectedIds.length === 0} onClick={confirmShortlist}>
                  Confirm Shortlist ({selectedIds.length}) <ChevronRight size={14} />
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* ── Stage 2: Questionnaire Generation ── */}
      {tender.status === 'prequal_stage2' && (
        <>
          <Card className="p-4">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Shortlisted Bidders</h4>
            <div className="flex flex-wrap gap-2">
              {prequalBidders.map(b => (
                <span key={b.id} className="text-xs font-medium text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">{b.name}</span>
              ))}
            </div>
          </Card>

          {!generated ? (
            <SectionFillStep
              section={PQQ_SECTION}
              answers={pqqAnswers}
              onAnswersChange={(_, values) => setPqqAnswers(values)}
              onNext={handleGeneratePqq}
              onBack={() => {}}
              isFirst
              isLast
              standInNotice={generating && (
                <div className="mb-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Bot size={12} /> Preparing questionnaire export…
                </div>
              )}
            />
          ) : (
            <Card className="p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                  <CheckCircle size={14} /> Questionnaire generated and downloaded — ready to distribute.
                </div>
                <Button onClick={distributeQuestionnaire}>
                  <Send size={13} /> Distribute to Bidders
                </Button>
              </div>
            </Card>
          )}
        </>
      )}

      {/* ── Stage 3: Response Review ── */}
      {tender.status === 'prequal_stage3' && (
        <>
          {(pendingUploadBidders.length > 0 || processingId != null) && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <UploadCloud size={14} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-slate-800">Upload Bidder Response</h3>
              </div>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-48">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Bidder</label>
                  <select
                    value={selectedUploadId ?? ''}
                    onChange={e => setSelectedUploadIdRaw(Number(e.target.value))}
                    disabled={processingId != null}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:opacity-60"
                  >
                    {pendingUploadBidders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <label className={`flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2.5 rounded-lg transition-all ${processingId != null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                  <UploadCloud size={13} /> Upload Response
                  <input type="file" className="hidden" disabled={processingId != null}
                    onChange={e => { if (selectedUploadId != null) handleResponseFileChosen(selectedUploadId, e.target.files?.[0]) }} />
                </label>
              </div>
              {processingId != null && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  {processingPhase === 'upload'
                    ? <><UploadCloud size={13} className="animate-pulse" /> Uploading {prequalBidders.find(b => b.id === processingId)?.name}'s response…</>
                    : <><Bot size={13} /> AI evaluating {prequalBidders.find(b => b.id === processingId)?.name}'s submission against QHSE, Technical &amp; Administrative criteria…</>}
                </div>
              )}
            </Card>
          )}

          <div className="space-y-3">
            {prequalBidders.filter(bidder => bidder.responseUploaded).map(bidder => {
              const overall = stage3Overall(bidder)
              return (
                <Card key={bidder.id} className="overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-slate-800">{bidder.name}</span>
                        <span className="text-xs text-slate-400">{bidder.country}</span>
                        {overall === 'pass' && <Badge variant="success"><CheckCircle size={10} /> Overall Pass</Badge>}
                        {overall === 'fail' && <Badge variant="error"><XCircle size={10} /> Overall Fail</Badge>}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {bidder.category}{bidder.responseFileName ? ` · ${bidder.responseFileName}` : ''}
                      </p>
                    </div>
                  </div>
                  {bidder.responseUploaded && (
                    <div className="divide-y divide-slate-50">
                      {SHEETS.map(sheet => {
                        const sheetResult = sheetOverall(bidder, sheet.key, sheet.criteria)
                        return (
                          <div key={sheet.key} className="px-4 py-3">
                            <div className="flex items-center gap-2 mb-2">
                              <p className="text-xs font-semibold text-slate-600">{sheet.label}</p>
                              {sheetResult === 'pass' && <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Pass</span>}
                              {sheetResult === 'fail' && <span className="text-[10px] font-semibold text-red-700 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded-full">Fail</span>}
                            </div>
                            <div className="space-y-2">
                              {sheet.criteria.filter(c => !(c.localOnly && !bidder.isLocal)).map(c => {
                                const mark = bidder.stage3?.[sheet.key]?.[c.id]
                                const aiMark = bidder.stage3Ai?.[sheet.key]?.[c.id]
                                const overridden = aiMark != null && mark !== aiMark
                                return (
                                  <div key={c.id} className="flex items-center justify-between gap-3 flex-wrap">
                                    <div className="min-w-0">
                                      <p className="text-xs font-medium text-slate-700">{c.item}</p>
                                      <p className="text-[11px] text-slate-400">{c.detail}</p>
                                      {overridden ? (
                                        <button onClick={() => resetMarkToAi(bidder.id, sheet.key, c.id)}
                                          className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 mt-0.5">
                                          <RotateCcw size={9} /> Overridden by Contract Holder · reset to AI
                                        </button>
                                      ) : (
                                        <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                          <Bot size={9} /> AI suggested
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                      <button onClick={() => setSheetMark(bidder.id, sheet.key, c.id, 'pass')}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${mark === 'pass' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 ring-1 ring-emerald-300' : 'border-slate-200 text-slate-500 bg-white hover:border-emerald-300'}`}>Pass</button>
                                      <button onClick={() => setSheetMark(bidder.id, sheet.key, c.id, 'fail')}
                                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${mark === 'fail' ? 'border-red-300 text-red-700 bg-red-50 ring-1 ring-red-300' : 'border-slate-200 text-slate-500 bg-white hover:border-red-300'}`}>Fail</button>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          <Card className={`p-4 transition-opacity ${!allStage3Decided ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <p className="text-xs text-slate-500">
                {allStage3Decided
                  ? `${activeBidders.filter(b => stage3Overall(b) === 'pass').length} of ${activeBidders.length} bidders passed Stage 3.`
                  : 'Upload responses and complete QHSE, Technical and Administrative marking for every bidder before proceeding.'}
              </p>
              <Button disabled={!allStage3Decided} onClick={finalizeStage3}>
                Proceed to Financial Assessment <ChevronRight size={14} />
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* ── Stage 4: Financial Assessment ── */}
      {tender.status === 'prequal_stage4' && (
        <>
          {pendingAssessBidders.length > 0 && (() => {
            const input = finance[selectedAssessId] || { statementSubmitted: true, auditOpinion: 'Unqualified Opinion', zZone: 'Green' }
            return (
              <Card className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Wallet size={14} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-slate-800">Financial Assessment</h3>
                </div>
                <div className="mb-3 max-w-xs">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Bidder</label>
                  <select value={selectedAssessId ?? ''} onChange={e => setSelectedAssessIdRaw(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
                    {pendingAssessBidders.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Audited Statement Submitted</label>
                    <select value={input.statementSubmitted ? 'yes' : 'no'} onChange={e => setFinanceField(selectedAssessId, 'statementSubmitted', e.target.value === 'yes')}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Outcome of Audit</label>
                    <select value={input.auditOpinion} onChange={e => setFinanceField(selectedAssessId, 'auditOpinion', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                      {['Unqualified Opinion', 'Qualified Opinion', 'Adverse Opinion', 'Disclaimer Opinion'].map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 mb-1 block">Z-Score Zone</label>
                    <select value={input.zZone} onChange={e => setFinanceField(selectedAssessId, 'zZone', e.target.value)}
                      className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white">
                      {['Green', 'Amber', 'Red'].map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <Button size="sm" onClick={() => assessBidder(selectedAssessId)}>Assess Financials</Button>
                  </div>
                </div>
              </Card>
            )
          })()}

          <div className="space-y-3">
            {activeBidders.filter(bidder => bidder.stage4?.result).map(bidder => (
              <Card key={bidder.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
                  <div className="flex items-center gap-2">
                    <Wallet size={14} className="text-[var(--color-primary)]" />
                    <span className="text-sm font-semibold text-slate-800">{bidder.name}</span>
                    {bidder.stage4.result === 'PASS' && <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>}
                    {bidder.stage4.result === 'FAIL' && <Badge variant="error"><Ban size={10} /> Fail</Badge>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">{bidder.stage4.recommendation}</p>
              </Card>
            ))}
          </div>

          {allStage4Assessed && qualifiedFinal.length > 0 && (
            <Card className="overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
                <FileText size={14} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-slate-800">Bidder Documents for ITT Handoff</h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">Shared with the Contract Engineer</span>
              </div>
              <div className="divide-y divide-slate-50">
                {qualifiedFinal.map(bidder => (
                  <div key={bidder.id} className="px-4 py-3">
                    <p className="text-sm font-semibold text-slate-800 mb-2">{bidder.name}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {HANDOFF_DOCS.map(doc => {
                        const fileName = bidder.handoffDocs?.[doc.key]
                        return (
                          <label key={doc.key}
                            className={`flex items-center gap-2 text-xs rounded-lg border px-3 py-2 cursor-pointer transition-colors ${fileName ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-dashed border-slate-300 text-slate-500 hover:border-[var(--color-primary)]'}`}>
                            {fileName ? <CheckCircle size={12} className="shrink-0" /> : <UploadCloud size={12} className="shrink-0" />}
                            <span className="min-w-0">
                              <span className="block font-medium">{doc.label}</span>
                              <span className="block truncate text-[10px] opacity-80">{fileName || 'Upload file…'}</span>
                            </span>
                            <input type="file" className="hidden" onChange={e => uploadHandoffDoc(bidder.id, doc.key, e.target.files?.[0])} />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className={`p-4 transition-opacity ${!allStage4Assessed ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Award size={14} className="text-[var(--color-primary)]" /> Final Qualified Bidders</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {!allStage4Assessed
                    ? 'Assess every bidder before finalising.'
                    : qualifiedFinal.length > 0 && !allHandoffDocsUploaded
                      ? 'Upload all 3 handoff documents for every qualified bidder before proceeding.'
                      : `${qualifiedFinal.length} of ${activeBidders.length} bidders financially qualified.`}
                </p>
              </div>
              <div className="flex gap-2">
                {allStage4Assessed && qualifiedFinal.length > 0 && (
                  <Button variant="secondary" onClick={() => exportPreQualSummaryPDF(tender, qualifiedFinal)}>
                    <Download size={13} /> Export Pre-Qual Summary
                  </Button>
                )}
                <Button disabled={!allStage4Assessed || (qualifiedFinal.length > 0 && !allHandoffDocsUploaded) || finalizing} onClick={finalizeStage4}>
                  {finalizing ? 'Processing…' : qualifiedFinal.length > 0 ? 'Confirm & Proceed to ITT' : 'Reject & Archive'}
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Terminal: prequal_rejected ── */}
      {tender.status === 'prequal_rejected' && (
        <Card className="p-6 text-center">
          <Ban size={28} className="text-red-500 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-800">Pre-Qualification Rejected</h3>
          <p className="text-xs text-slate-500 mt-1">No bidders met the pre-qualification criteria. This tender has been archived.</p>
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => navigate('/tenders')}>Back to Tender List</Button>
        </Card>
      )}

    </div>
  )
}
