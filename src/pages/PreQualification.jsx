import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users, Bot, Send, ShieldOff, FileText, ArrowLeft, CheckCircle,
  XCircle, Download, Award, ChevronRight, UploadCloud, Ban, Wallet, RotateCcw,
  UserPlus, Plus, Save, Search, UserCheck, X,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SearchableSelect from '../components/ui/SearchableSelect'
import SectionFillStep from '../components/itt/SectionFillStep'
import {
  erpBidders, WORK_CATEGORIES, QHSE_CRITERIA, TECHNICAL_CRITERIA_PQ,
  ADMINISTRATIVE_CRITERIA, FINANCIAL_CRITERIA, HANDOFF_DOCS,
} from '../data/mockData'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useNavigation, useBackHandler, useDismissable } from '../context/NavigationContext'
import { useHomePath } from '../utils/permissions'
import { buildFilledDocxBlob } from '../utils/docxTemplate'
import { exportPreQualSummaryPDF, exportBidderFailReasonsPDF } from '../utils/exportPDF'

const PREQUAL_STATUSES = ['prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4', 'prequal_final_review', 'prequal_rejected']

// The stages are one page each, switched on tender.status rather than by route,
// so Back has to walk this list rather than touch history. Labels must match the
// ones the forward transitions write (ContractStrategy seeds stage 1).
const PREQUAL_STAGE_FLOW = [
  { status: 'prequal_stage1', stage: 'Pre-Qualification — Bidder Matching' },
  { status: 'prequal_stage2', stage: 'Pre-Qualification — Questionnaire' },
  { status: 'prequal_stage3', stage: 'Pre-Qualification — Response Review' },
  { status: 'prequal_stage4', stage: 'Pre-Qualification — Financial Assessment' },
  { status: 'prequal_final_review', stage: 'Pre-Qualification — Final Review' },
]

// Who owns each stage. Stage 4 (financial assessment) belongs to the Contract
// Engineer; the Contract Holder gets it back at final review to submit.
const STAGE_OWNER = {
  prequal_stage1:       'contract_holder',
  prequal_stage2:       'contract_holder',
  prequal_stage3:       'contract_holder',
  prequal_stage4:       'pof',
  prequal_final_review: 'contract_holder',
  prequal_rejected:     'contract_holder',
}

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

// Stage 4 is a single Pass/Fail sheet, marked exactly like a Stage 3 sheet but
// stored under stage4Marks / stage4Ai / stage4Reasons.
const FINANCIAL_SHEET = { key: 'financial', label: 'Financial Pre-Qualification', criteria: FINANCIAL_CRITERIA }

function stage4Overall(bidder) {
  const marks = bidder.stage4Marks?.financial || {}
  if (FINANCIAL_CRITERIA.some(c => marks[c.id] === 'fail')) return 'fail'
  if (FINANCIAL_CRITERIA.every(c => marks[c.id])) return 'pass'
  return null
}

// The two rounds are reported side by side; the system does not auto-decide.
// The Contract Holder reviews both results at final review and chooses which
// bidders to carry forward.
function resultSummary(bidder) {
  const s3 = stage3Overall(bidder) === 'pass' ? 'Pass' : 'Fail'
  const s4 = stage4Overall(bidder) === 'pass' ? 'Pass' : 'Fail'
  return `Technical/QHSE: ${s3} · Financial: ${s4}.`
}

let aiFinancialCount = 0
// Mock AI marking of the financial sheet — first two default all-pass, then an
// occasional fail, mirroring generateAiStage3.
function generateAiStage4() {
  aiFinancialCount++
  const forcePass = aiFinancialCount <= 2
  const marks = {}
  const reasons = {}
  FINANCIAL_CRITERIA.forEach(c => {
    if (!forcePass && Math.random() < 0.2) {
      marks[c.id] = 'fail'
      reasons[c.id] = 'AI flagged a shortfall against this financial criterion in the submitted statements.'
    } else {
      marks[c.id] = 'pass'
    }
  })
  return { marks: { financial: marks }, reasons: { financial: reasons } }
}

let aiEvaluationsCount = 0

// AI's simulated first-pass evaluation — defaults every applicable criterion to
// Pass. This is the baseline the Contract Holder reviews and can override; it's
// stored separately (stage3Ai) so overrides can be visually distinguished and reset.
function generateAiStage3(bidder) {
  aiEvaluationsCount++
  const forcePass = aiEvaluationsCount <= 2

  const marks = {}
  const reasons = {}
  SHEETS.forEach(sheet => {
    marks[sheet.key] = {}
    reasons[sheet.key] = {}
    sheet.criteria.filter(c => !(c.localOnly && !bidder.isLocal)).forEach(c => { 
      // 15% chance to mock a fail for demonstration of the flow
      if (!forcePass && Math.random() < 0.15) {
        marks[sheet.key][c.id] = 'fail'
        reasons[sheet.key][c.id] = 'AI detected missing or outdated information in the provided document.'
      } else {
        marks[sheet.key][c.id] = 'pass' 
      }
    })
  })
  return { marks, reasons }
}

export default function PreQualification() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user, users } = useAuth()
  const home = useHomePath()
  const { tenders, updateTender } = useTenders()
  const { goBack } = useNavigation()
  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  // The Contract Holder picks which Contract Engineer(s) pick up the financial
  // assessment — mirrors the Assign Contract Engineers step at PSF Strategy submit.
  const contractEngineers = useMemo(
    () => (users || []).filter(u => u.roleId === 'pof' && u.status === 'active'),
    [users]
  )
  const [assignedCeIds, setAssignedCeIds] = useState(
    Array.isArray(tender?.assignedContractEngineers)
      ? tender.assignedContractEngineers.map(c => c.id)
      : tender?.assignedContractEngineer ? [tender.assignedContractEngineer.id] : []
  )

  // Stage 1 local state
  const [sowFileName, setSowFileName] = useState('')
  const [erpListFileName, setErpListFileName] = useState('')
  const [jsrsListFileName, setJsrsListFileName] = useState('')
  const [workCategory, setWorkCategory] = useState(WORK_CATEGORIES[0])
  const [matching, setMatching] = useState(false)
  const [matched, setMatched] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [registrySearch, setRegistrySearch] = useState('')
  const [registrySource, setRegistrySource] = useState('all') // 'all' | 'erp' | 'jsrs'

  // Stage 2 local state
  const [pqqAnswers, setPqqAnswers] = useState(null)
  const [generating, setGenerating] = useState(false)
  const [generated, setGenerated] = useState(false)

  // Stage 3 local state
  const [processingId, setProcessingId] = useState(null)
  const [processingPhase, setProcessingPhase] = useState(null) // 'upload' | 'ai'
  const [selectedUploadIdRaw, setSelectedUploadIdRaw] = useState(null)
  const [financialAssessmentNeeded, setFinancialAssessmentNeeded] = useState(tender?.financialAssessmentRequired ?? true)

  // Stage 4 local state
  const [finalizing, setFinalizing] = useState(false)
  const [selectedAssessIdRaw, setSelectedAssessIdRaw] = useState(null)
  const [handoffDocuments, setHandoffDocuments] = useState(tender?.handoffDocuments || {})
  const [showAddBidder, setShowAddBidder] = useState(false)
  const [addBidderSearch, setAddBidderSearch] = useState('')

  // Final review: which bidders the Contract Holder chooses to carry forward.
  // Pre-selects those that passed both rounds; the Holder can include or exclude
  // any bidder after seeing both the PQQ and financial results.
  const [includedIds, setIncludedIds] = useState(() => {
    const bidders = (tender?.prequalBidders || []).filter(b => !b.droppedAt)
    return new Set(bidders.filter(b => stage3Overall(b) === 'pass' && stage4Overall(b) === 'pass').map(b => b.id))
  })
  const toggleInclude = id =>
    setIncludedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })

  // Back steps the stage machine down one, so the questionnaire returns to
  // bidder matching instead of leaving for the strategy templates. Returns false
  // once there is no earlier stage, letting route-level back take over.
  const goToPrevStage = () => {
    // `generated` is stage 2's own sub-view and is not reset when the tender
    // advances, so only honour it while stage 2 is actually on screen.
    if (generated && tender?.status === 'prequal_stage2') { setGenerated(false); return true }
    const i = PREQUAL_STAGE_FLOW.findIndex(s => s.status === tender?.status)
    if (i <= 0) return false
    const prev = PREQUAL_STAGE_FLOW[i - 1]
    // Never let Back push the tender into a stage this role doesn't own — a
    // Contract Engineer stepping back would silently take Response Review off
    // the Contract Holder's desk.
    if (STAGE_OWNER[prev.status] !== user?.role?.id) return false
    updateTender(tender.id, { status: prev.status, stage: prev.stage })
    return true
  }

  // Ahead of goToPrevStage — closing this panel must not roll the tender's
  // status back a stage.
  useDismissable(showAddBidder, () => setShowAddBidder(false))

  useBackHandler(goToPrevStage)

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

  const roleId = user?.role?.id
  // The Contract Engineer is here only for the financial assessment he owns.
  const isCE = roleId === 'pof'

  if (roleId !== 'contract_holder' && !isCE) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Holders and Contract Engineers can access this page.</p>
    </div>
  )

  if (!tenderId) {
    const list = tenders.filter(t =>
      PREQUAL_STATUSES.includes(t.status) && (!isCE || STAGE_OWNER[t.status] === 'pof'))
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-700">{isCE ? 'Financial Assessment' : 'Pre-Qualification'}</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isCE
                ? 'Pre-qualification documents awaiting your financial assessment'
                : 'Select a tender to continue pre-qualification'}
            </p>
          </div>
          <span className="text-xs text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{list.length} tender{list.length !== 1 ? 's' : ''}</span>
        </div>
        {list.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">
              {isCE ? 'No pre-qualifications awaiting financial assessment' : 'No tenders in pre-qualification'}
            </p>
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
      <Button variant="secondary" size="sm" onClick={() => navigate(home)}>Back to Home</Button>
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

  // Stage 4 — bidders still awaiting a financial-statement upload appear in the dropdown.
  const pendingFinancialUpload = activeBidders.filter(b => !b.financialUploaded && b.id !== processingId)
  const selectedFinancialId = pendingFinancialUpload.some(b => b.id === selectedAssessIdRaw)
    ? selectedAssessIdRaw
    : pendingFinancialUpload[0]?.id ?? null

  const patchBidder = (bidderId, patch) => {
    const next = prequalBidders.map(b => b.id === bidderId ? { ...b, ...patch } : b)
    updateTender(tender.id, { prequalBidders: next })
  }

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  // Every ERP-registered bidder is in the registry; a subset also carries a JSRS
  // number, so JSRS is a flag on the same record rather than a separate list.
  const selectedJsrsCount = selectedIds.filter(id => erpBidders.find(b => b.id === id)?.jsrsNo).length
  const registryBidders = (() => {
    const q = registrySearch.trim().toLowerCase()
    return erpBidders
      // 'erp' narrows to ERP-only records — every bidder is on ERP, so the useful
      // cut is the ones that are NOT also JSRS-registered.
      .filter(b => registrySource === 'all' || (registrySource === 'jsrs' ? !!b.jsrsNo : !b.jsrsNo))
      .filter(b => !q || [b.name, b.category, b.country, b.regNo, b.jsrsNo].some(v => (v || '').toLowerCase().includes(q)))
  })()

  const confirmShortlist = () => {
    const shortlisted = erpBidders
      .filter(b => selectedIds.includes(b.id))
      .map(b => ({ id: b.id, name: b.name, country: b.country, category: b.category, isLocal: b.isLocal, responseUploaded: false, stage3: { qhse: {}, technical: {}, administrative: {} } }))
    updateTender(tender.id, {
      status: 'prequal_stage2',
      stage: 'Pre-Qualification — Questionnaire',
      sowFileName,
      erpBidderListFile: erpListFileName,
      jsrsBidderListFile: jsrsListFileName,
      workCategory,
      prequalBidders: shortlisted,
    })
  }

  // ── Export Bidders List as CSV ──
  const exportBiddersCSV = () => {
    const header = 'Name,Country,Category,Contact Name,Contact Email\n'
    const rows = prequalBidders.map(b => {
      const erp = erpBidders.find(e => e.id === b.id)
      return `"${b.name}","${b.country}","${b.category}","${erp?.contactName || ''}","${erp?.contactEmail || ''}"`
    }).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `Bidders-${tender.id}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  // ── Add a new bidder from ERP to the prequalBidders list ──
  const availableBiddersToAdd = erpBidders.filter(
    b => !prequalBidders.some(pb => pb.id === b.id)
  )

  const filteredBiddersToAdd = (() => {
    const q = addBidderSearch.trim().toLowerCase()
    if (!q) return availableBiddersToAdd
    return availableBiddersToAdd.filter(b =>
      [b.name, b.category, b.country].some(v => (v || '').toLowerCase().includes(q))
    )
  })()

  const addBidderToList = (bidderId) => {
    const b = erpBidders.find(e => e.id === bidderId)
    if (!b) return
    const newBidder = {
      id: b.id,
      name: b.name,
      country: b.country,
      category: b.category,
      isLocal: b.isLocal,
      responseUploaded: false,
      stage3: { qhse: {}, technical: {}, administrative: {} },
    }
    const updated = [...prequalBidders, newBidder]
    updateTender(tender.id, { prequalBidders: updated })
    setShowAddBidder(false)
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
        const aiResult = generateAiStage3(bidder)
        patchBidder(bidderId, { 
          responseUploaded: true, 
          responseFileName: file.name, 
          stage3: aiResult.marks, 
          stage3Ai: aiResult.marks, 
          stage3Reasons: aiResult.reasons,
          reuploadRequested: false
        })
        setProcessingId(null)
        setProcessingPhase(null)
      }, 1100)
    }, 700)
  }

  const setSheetMark = (bidderId, sheetKey, criterionId, value) => {
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder) return
    let reason = bidder.stage3Reasons?.[sheetKey]?.[criterionId]
    if (value === 'fail') {
      const input = prompt('Please provide a reason for failing this criteria:')
      if (input !== null) {
        reason = input
      } else {
        return // Cancel
      }
    } else {
      reason = undefined // Clear reason on pass
    }

    patchBidder(bidderId, { 
      stage3: { ...bidder.stage3, [sheetKey]: { ...bidder.stage3[sheetKey], [criterionId]: value } },
      stage3Reasons: { ...bidder.stage3Reasons, [sheetKey]: { ...(bidder.stage3Reasons?.[sheetKey] || {}), [criterionId]: reason } }
    })
  }

  const resetMarkToAi = (bidderId, sheetKey, criterionId) => {
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder?.stage3Ai) return
    const aiValue = bidder.stage3Ai[sheetKey][criterionId]
    // We don't restore AI reason on reset for simplicity, or we could if we stored it
    patchBidder(bidderId, { 
      stage3: { ...bidder.stage3, [sheetKey]: { ...bidder.stage3[sheetKey], [criterionId]: aiValue } },
      stage3Reasons: { ...bidder.stage3Reasons, [sheetKey]: { ...(bidder.stage3Reasons?.[sheetKey] || {}), [criterionId]: undefined } }
    })
  }

  // Sends the bidder back for a fresh submission: clears the uploaded response
  // and every mark derived from it, so the sheets are re-evaluated on re-upload.
  const handleRequestReupload = (bidderId) => {
    patchBidder(bidderId, {
      responseUploaded: false,
      reuploadRequested: true,
      stage3: { qhse: {}, technical: {}, administrative: {} },
      stage3Reasons: { qhse: {}, technical: {}, administrative: {} }
    })
  }

  // ── Stage 4 (financial) — same upload → AI-mark → override flow as Stage 3 ──
  const handleFinancialFileChosen = (bidderId, file) => {
    if (!file) return
    setProcessingId(bidderId)
    setProcessingPhase('upload')
    setTimeout(() => {
      setProcessingPhase('ai')
      setTimeout(() => {
        const aiResult = generateAiStage4()
        patchBidder(bidderId, {
          financialUploaded: true,
          financialFileName: file.name,
          stage4Marks: aiResult.marks,
          stage4Ai: aiResult.marks,
          stage4Reasons: aiResult.reasons,
          financialReuploadRequested: false,
        })
        setProcessingId(null)
        setProcessingPhase(null)
      }, 1100)
    }, 700)
  }

  const setFinancialMark = (bidderId, criterionId, value) => {
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder) return
    let reason = bidder.stage4Reasons?.financial?.[criterionId]
    if (value === 'fail') {
      const input = prompt('Please provide a reason for failing this criteria:')
      if (input !== null) reason = input
      else return
    } else {
      reason = undefined
    }
    patchBidder(bidderId, {
      stage4Marks: { financial: { ...(bidder.stage4Marks?.financial || {}), [criterionId]: value } },
      stage4Reasons: { financial: { ...(bidder.stage4Reasons?.financial || {}), [criterionId]: reason } },
    })
  }

  const resetFinancialMark = (bidderId, criterionId) => {
    const bidder = prequalBidders.find(b => b.id === bidderId)
    if (!bidder?.stage4Ai) return
    patchBidder(bidderId, {
      stage4Marks: { financial: { ...(bidder.stage4Marks?.financial || {}), [criterionId]: bidder.stage4Ai.financial[criterionId] } },
      stage4Reasons: { financial: { ...(bidder.stage4Reasons?.financial || {}), [criterionId]: undefined } },
    })
  }

  const handleRequestFinancialReupload = (bidderId) => {
    patchBidder(bidderId, {
      financialUploaded: false,
      financialReuploadRequested: true,
      stage4Marks: { financial: {} },
      stage4Reasons: { financial: {} },
    })
  }

  // Contract Holder marks a bidder that did not submit a response as Not
  // Participating. It sets droppedAt so the bidder is filtered out of the dropdown,
  // evaluation table and the proceed gate — while remaining on record (restorable).
  const markNotParticipating = (bidderId) => {
    const b = prequalBidders.find(x => x.id === bidderId)
    if (!b) return
    if (!window.confirm(`Mark "${b.name}" as Not Participating?\n\nThey did not submit a response and will be removed from this pre-qualification. You can restore them later.`)) return
    patchBidder(bidderId, { droppedAt: 'no_response', responseUploaded: false, reuploadRequested: false })
  }

  const restoreBidder = (bidderId) => {
    patchBidder(bidderId, { droppedAt: undefined })
  }

  // Bidders removed for not submitting a response (Stage 3 only).
  const notParticipatedBidders = prequalBidders.filter(b => b.droppedAt === 'no_response')

  // Save current Stage 3 progress and exit — marks already persist on each change,
  // so this re-commits the current state and returns to the pre-qualification list.
  const handleSaveDraft = () => {
    updateTender(tender.id, { prequalBidders })
    navigate('/pre-qualification')
  }

  const allStage3Decided = activeBidders.length > 0 && activeBidders.every(b => b.responseUploaded && stage3Overall(b))
  const stage3ReadyToSubmit = allStage3Decided && (!financialAssessmentNeeded || assignedCeIds.length > 0)

  const finalizeStage3 = () => {
    // Every bidder who responded continues to financial assessment — including
    // Stage-3 failures — because the final decision averages the two rounds. Only
    // non-responders (already droppedAt) stay out.
    if (activeBidders.length === 0) {
      updateTender(tender.id, { status: 'prequal_rejected', prequalBidders })
      return
    }
    // Hand the document to the assigned Contract Engineer(s). financialAssessmentRequired is
    // persisted because the decision has to outlive this page — the CE and the
    // dashboards both need to know the assessment was asked for.
    const ces = contractEngineers
      .filter(u => assignedCeIds.some(id => String(id) === String(u.id)))
      .map(u => ({ id: u.id, name: u.name }))
    updateTender(tender.id, {
      status: 'prequal_stage4',
      stage: 'Pre-Qualification — Financial Assessment',
      financialAssessmentRequired: true,
      financialAssessmentAssignedAt: new Date().toISOString().split('T')[0],
      assignedContractEngineers: ces,
      // Keep the single field for any code still reading it (first assignee).
      assignedContractEngineer: ces[0],
    })
  }

  // When financial assessment is NOT required, Stage 3 pass results are final:
  // qualify the passed bidders directly and hand off to the Strategy Templates flow.
  const finalizeStage3AsFinal = () => {
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
    updateTender(tender.id, {
      status: 'draft',
      stage: 'Draft — Pending Export',
      prequalBidders: nextBidders,
      bidderList: passed.map(b => ({ id: b.id, name: b.name, country: b.country })),
      bidders: passed.length,
      handoffDocuments,
      financialAssessmentRequired: false,
    })
    navigate(`/strategy-templates/${tender.id}`)
  }

  // Stage 3 submit — branch on whether a financial assessment is required.
  const handleStage3Submit = () => {
    if (financialAssessmentNeeded) finalizeStage3()
    else finalizeStage3AsFinal()
  }

  // Every active bidder must have their financial statement uploaded and all
  // three criteria decided before the assessment can be returned.
  const allStage4Assessed = activeBidders.length > 0 && activeBidders.every(b => b.financialUploaded && stage4Overall(b))
  const financialPassers = activeBidders.filter(b => stage4Overall(b) === 'pass')

  // Contract Engineer finishes the financial assessment and returns the document
  // to the Contract Holder — with BOTH round results attached, no auto-filtering.
  // The Holder decides who to carry forward.
  const sendBackToHolder = () => {
    setFinalizing(true)
    const nextBidders = [
      ...activeBidders.map(b => ({ ...b, stage4: { result: stage4Overall(b) === 'pass' ? 'PASS' : 'FAIL', recommendation: resultSummary(b) } })),
      ...prequalBidders.filter(b => b.droppedAt),
    ]
    setTimeout(() => {
      updateTender(tender.id, {
        status: 'prequal_final_review',
        stage: 'Pre-Qualification — Final Review',
        prequalBidders: nextBidders,
        financialAssessmentCompletedBy: user?.name || 'Contract Engineer',
        financialAssessmentCompletedAt: new Date().toISOString().split('T')[0],
      })
      setFinalizing(false)
      navigate('/pre-qualification')
    }, 400)
  }

  // Contract Holder confirms which bidders qualify (from the two results shown)
  // and hands the tender to the Strategy Templates flow. Excluding everyone
  // archives the tender.
  const finalizeFinalReview = () => {
    setFinalizing(true)
    const included = activeBidders.filter(b => includedIds.has(b.id))
    const excluded = activeBidders.filter(b => !includedIds.has(b.id))
    setTimeout(() => {
      if (included.length === 0) {
        updateTender(tender.id, {
          status: 'prequal_rejected',
          prequalBidders: [...excluded.map(b => ({ ...b, droppedAt: 'holder_excluded' })), ...prequalBidders.filter(b => b.droppedAt)],
        })
        setFinalizing(false)
        return
      }
      updateTender(tender.id, {
        status: 'draft',
        stage: 'Draft — Pending Export',
        prequalBidders: [...included, ...excluded.map(b => ({ ...b, droppedAt: 'holder_excluded' })), ...prequalBidders.filter(b => b.droppedAt)],
        bidderList: included.map(b => ({ id: b.id, name: b.name, country: b.country })),
        bidders: included.length,
        handoffDocuments,
      })
      setFinalizing(false)
      navigate(`/strategy-templates/${tender.id}`)
    }, 400)
  }

  return (
    <div className="space-y-5">

      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={() => navigate(`/strategy-templates/${tender.id}`)} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Strategies
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
              Upload the tender's Statement of Work and select a Work Category. Optionally attach the ERP and
              JSRS bidder lists for the record. The system will match the ERP &amp; JSRS bidder registry against
              this tender's scope before pre-qualification is issued.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Statement of Work (SOW)</label>
                <label className="flex items-center gap-2 text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                  <UploadCloud size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">{sowFileName || 'Choose file to upload...'}</span>
                  <input type="file" className="hidden" onChange={e => setSowFileName(e.target.files?.[0]?.name || '')} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">ERP Bidder List <span className="text-slate-400 font-normal">(optional)</span></label>
                <label className="flex items-center gap-2 text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                  <UploadCloud size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">{erpListFileName || 'Choose file to upload...'}</span>
                  <input type="file" className="hidden" onChange={e => setErpListFileName(e.target.files?.[0]?.name || '')} />
                </label>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">JSRS Bidder List <span className="text-slate-400 font-normal">(optional)</span></label>
                <label className="flex items-center gap-2 text-sm border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors">
                  <UploadCloud size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-600 truncate">{jsrsListFileName || 'Choose file to upload...'}</span>
                  <input type="file" className="hidden" onChange={e => setJsrsListFileName(e.target.files?.[0]?.name || '')} />
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
                <div className="px-4 py-3 border-b border-slate-100 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Users size={14} className="text-[var(--color-primary)]" />
                    <h3 className="text-sm font-semibold text-slate-800">ERP &amp; JSRS Bidder Registry</h3>
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                      {selectedIds.length} matched to "{workCategory}" · {selectedJsrsCount} JSRS-registered
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="text"
                      value={registrySearch}
                      onChange={e => setRegistrySearch(e.target.value)}
                      placeholder="Search bidders, category, CR or JSRS no..."
                      className="flex-1 min-w-[200px] text-sm border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
                    />
                    <div className="flex items-center gap-1">
                      {[
                        { key: 'all', label: 'All' },
                        { key: 'erp', label: 'ERP only' },
                        { key: 'jsrs', label: 'JSRS-registered' },
                      ].map(opt => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setRegistrySource(opt.key)}
                          className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                            registrySource === opt.key
                              ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                              : 'bg-white text-slate-500 border-slate-200 hover:border-[var(--color-primary)]'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {registryBidders.length === 0 && (
                    <p className="px-4 py-6 text-xs text-slate-400 text-center">No bidders match this filter.</p>
                  )}
                  {registryBidders.map(b => {
                    const isMatch = b.category === workCategory
                    return (
                      <label key={b.id} className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50/60 transition-colors">
                        <input type="checkbox" checked={selectedIds.includes(b.id)} onChange={() => toggleSelect(b.id)} className="accent-[var(--color-primary)]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-slate-800">{b.name}</span>
                            <span className="text-xs text-slate-400">{b.country}</span>
                            <span title={`ERP registration ${b.regNo}`} className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded-full">ERP</span>
                            {b.jsrsNo && <span title={`JSRS registration ${b.jsrsNo}`} className="text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">JSRS</span>}
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
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Shortlisted Bidders</h4>
              <button
                onClick={exportBiddersCSV}
                className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-slate-50"
                style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}
              >
                <Download size={11} /> Export Bidders List
              </button>
            </div>
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
              onBack={() => { if (!goToPrevStage()) goBack() }}
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
          <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
            <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Stage 3 — Response Review</h4>
            {/* Add Bidders Dropdown */}
            {availableBiddersToAdd.length > 0 && (
              <div className="relative">
                <button
                  onClick={() => { setShowAddBidder(!showAddBidder); setAddBidderSearch('') }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white"
                  style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}
                >
                  <UserPlus size={12} /> Add Bidders
                </button>
                {showAddBidder && (
                  <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-100 z-50 w-64 overflow-hidden" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}>
                    <div className="flex items-center gap-2 px-2.5 py-2 border-b border-slate-100 bg-slate-50/60">
                      <Search size={13} className="text-slate-400 shrink-0" />
                      <input
                        autoFocus
                        value={addBidderSearch}
                        onChange={e => setAddBidderSearch(e.target.value)}
                        placeholder="Search bidders…"
                        aria-label="Search bidders"
                        className="w-full text-xs bg-transparent text-slate-700 placeholder:text-slate-400 focus:outline-none"
                      />
                    </div>
                    <div className="py-1 max-h-60 overflow-y-auto">
                      {filteredBiddersToAdd.length === 0 ? (
                        <p className="px-3 py-4 text-center text-xs text-slate-400">No matching bidders</p>
                      ) : filteredBiddersToAdd.map(b => (
                        <button
                          key={b.id}
                          onClick={() => addBidderToList(b.id)}
                          className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors flex items-center gap-2"
                        >
                          <Plus size={12} style={{ color: '#0089cf' }} />
                          <div>
                            <p className="text-xs font-semibold text-slate-700">{b.name}</p>
                            <p className="text-[10px] text-slate-400">{b.country} · {b.category}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <Card className="p-3.5">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={financialAssessmentNeeded}
                onChange={e => setFinancialAssessmentNeeded(e.target.checked)}
                className="accent-[var(--color-primary)] w-4 h-4"
              />
              Financial assessment required
              <span className="text-[11px] text-slate-400 font-normal">
                — {financialAssessmentNeeded
                  ? 'submit sends the pre-qualification document to the Contract Engineer'
                  : 'submit finalises and returns to Strategy Templates'}
              </span>
            </label>
          </Card>

          {financialAssessmentNeeded && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <UserCheck size={15} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-slate-800">Assign Contract Engineers</h3>
                <span className="text-[11px] text-slate-400">— at least one required</span>
              </div>
              <div className="max-w-sm">
                <SearchableSelect
                  multiple
                  value={assignedCeIds}
                  onChange={vals => setAssignedCeIds(vals)}
                  options={contractEngineers}
                  getValue={u => u.id}
                  getLabel={u => u.name}
                  getSubLabel={u => u.username}
                  placeholder="Select Contract Engineers…"
                  searchPlaceholder="Search contract engineers…"
                  emptyText="No active Contract Engineers"
                  ariaLabel="Assign Contract Engineers"
                />
                {assignedCeIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {contractEngineers.filter(u => assignedCeIds.some(id => String(id) === String(u.id))).map(u => (
                      <span key={u.id} className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2 py-0.5 rounded-full">
                        {u.name}
                        <button onClick={() => setAssignedCeIds(prev => prev.filter(id => String(id) !== String(u.id)))} className="hover:text-red-500" title="Remove">
                          <X size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Once submitted, every assigned Contract Engineer picks up this tender for the financial assessment.
                </p>
              </div>
            </Card>
          )}

          {(pendingUploadBidders.length > 0 || processingId != null) && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <UploadCloud size={14} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-slate-800">Upload Bidder Response</h3>
              </div>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-48">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Bidder</label>
                  <SearchableSelect
                    value={selectedUploadId ?? ''}
                    onChange={v => setSelectedUploadIdRaw(Number(v))}
                    options={pendingUploadBidders}
                    getValue={b => b.id}
                    getLabel={b => `${b.name} ${b.reuploadRequested ? '(Awaiting Re-upload)' : ''}`.trim()}
                    getSubLabel={b => `${b.country} · ${b.category}`}
                    disabled={processingId != null}
                    placeholder="Select bidder…"
                    searchPlaceholder="Search bidders…"
                    emptyText="No matching bidders"
                    ariaLabel="Bidder"
                  />
                </div>
                <label className={`flex items-center gap-1.5 text-xs font-semibold text-white px-4 py-2.5 rounded-lg transition-all ${processingId != null ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  style={{ background: 'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))' }}>
                  <UploadCloud size={13} /> Upload Response
                  <input type="file" className="hidden" disabled={processingId != null}
                    onChange={e => { if (selectedUploadId != null) handleResponseFileChosen(selectedUploadId, e.target.files?.[0]) }} />
                </label>
                <button
                  type="button"
                  onClick={() => { if (selectedUploadId != null) markNotParticipating(selectedUploadId) }}
                  disabled={processingId != null || selectedUploadId == null}
                  className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2.5 rounded-lg border bg-white transition-all hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ color: '#dc2626', borderColor: 'rgba(220,38,38,0.3)' }}
                >
                  <Ban size={13} /> Mark as Not Participating
                </button>
              </div>
              <p className="mt-2 text-[11px] text-slate-400">
                If a bidder does not submit a response, mark them as Not Participating to remove them from evaluation.
              </p>
              {processingId != null && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  {processingPhase === 'upload'
                    ? <><UploadCloud size={13} className="animate-pulse" /> Uploading {prequalBidders.find(b => b.id === processingId)?.name}'s response…</>
                    : <><Bot size={13} /> AI evaluating {prequalBidders.find(b => b.id === processingId)?.name}'s submission against QHSE, Technical &amp; Administrative criteria…</>}
                </div>
              )}
            </Card>
          )}

          {notParticipatedBidders.length > 0 && (
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Ban size={14} className="text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-700">Did Not Participate</h3>
                <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{notParticipatedBidders.length}</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3">Removed for not submitting a response — excluded from evaluation. Restore if a response is received later.</p>
              <div className="space-y-2">
                {notParticipatedBidders.map(b => (
                  <div key={b.id} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-500 line-through">{b.name}</p>
                      <p className="text-[10px] text-slate-400">{b.country} · {b.category}</p>
                    </div>
                    <button
                      onClick={() => restoreBidder(b.id)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[var(--color-primary)] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-[var(--color-primary)]/40 transition-colors shrink-0"
                    >
                      <RotateCcw size={11} /> Restore
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr>
                  <th className="p-3 border-b border-slate-200 bg-slate-50 sticky left-0 z-10 w-80 shadow-[1px_0_0_0_#e2e8f0]">Criteria</th>
                  {prequalBidders.filter(b => b.responseUploaded).map(bidder => {
                    const overall = stage3Overall(bidder)
                    return (
                      <th key={bidder.id} className="p-3 border-b border-slate-200 bg-slate-50 border-l">
                        <div className="flex flex-col items-center justify-center text-center">
                          <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1">
                            <span className="text-sm font-semibold text-slate-800">{bidder.name}</span>
                            {overall === 'pass' && <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>}
                            {overall === 'fail' && <Badge variant="error"><XCircle size={10} /> Fail</Badge>}
                          </div>
                          {overall === 'fail' && (
                            <>
                              <button 
                                onClick={() => handleRequestReupload(bidder.id)}
                                className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition-colors mt-1 font-semibold w-full"
                              >
                                Reupload Bidders Documents
                              </button>
                              <button 
                                onClick={() => exportBidderFailReasonsPDF(tender, bidder)}
                                className="flex items-center justify-center gap-1 text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 hover:bg-slate-50 transition-colors mt-1 mb-1 font-semibold w-full"
                              >
                                <Download size={10} /> Export Reason
                              </button>
                            </>
                          )}
                          <span className="text-[10px] text-slate-400 font-normal">{bidder.country} · {bidder.category}</span>
                        </div>
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody>
                {SHEETS.map(sheet => (
                  <React.Fragment key={sheet.key}>
                    <tr>
                      <td colSpan={prequalBidders.filter(b => b.responseUploaded).length + 1} className="px-3 py-2 bg-slate-100 font-semibold text-slate-700 text-xs uppercase tracking-wider sticky left-0 shadow-[1px_0_0_0_#f1f5f9]">
                        {sheet.label}
                      </td>
                    </tr>
                    {sheet.criteria.map(c => (
                      <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                        <td className="p-3 sticky left-0 bg-white border-r border-slate-100 z-10 group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_#f1f5f9]">
                          <p className="text-xs font-medium text-slate-700">{c.item}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 whitespace-normal w-72">{c.detail}</p>
                        </td>
                        {prequalBidders.filter(b => b.responseUploaded).map(bidder => {
                          if (c.localOnly && !bidder.isLocal) {
                            return <td key={bidder.id} className="p-3 text-center align-top border-l border-slate-100 bg-slate-50/50"><span className="text-[10px] text-slate-400">N/A</span></td>
                          }
                          const mark = bidder.stage3?.[sheet.key]?.[c.id]
                          const aiMark = bidder.stage3Ai?.[sheet.key]?.[c.id]
                          const overridden = aiMark != null && mark !== aiMark
                          return (
                            <td key={bidder.id} className="p-3 text-center align-top border-l border-slate-100">
                              <div className="flex flex-col items-center gap-1.5">
                                <div className="flex gap-1.5 shrink-0 justify-center">
                                  <button onClick={() => setSheetMark(bidder.id, sheet.key, c.id, 'pass')}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${mark === 'pass' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 ring-1 ring-emerald-300' : 'border-slate-200 text-slate-500 bg-white hover:border-emerald-300'}`}>Pass</button>
                                  <button onClick={() => setSheetMark(bidder.id, sheet.key, c.id, 'fail')}
                                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all ${mark === 'fail' ? 'border-red-300 text-red-700 bg-red-50 ring-1 ring-red-300' : 'border-slate-200 text-slate-500 bg-white hover:border-red-300'}`}>Fail</button>
                                </div>
                                {overridden ? (
                                  <button onClick={() => resetMarkToAi(bidder.id, sheet.key, c.id)}
                                    className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700">
                                    <RotateCcw size={9} /> Reset
                                  </button>
                                ) : (
                                  <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                    <Bot size={9} /> AI suggested
                                  </span>
                                )}
                                {mark === 'fail' && bidder.stage3Reasons?.[sheet.key]?.[c.id] && (
                                  <div className="text-[9px] text-red-600 mt-1 max-w-[120px] text-left leading-tight bg-red-50 p-1 rounded border border-red-100">
                                    <span className="font-semibold block mb-0.5 text-[8px] uppercase tracking-wider">Reason</span>
                                    {bidder.stage3Reasons[sheet.key][c.id]}
                                  </div>
                                )}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="space-y-2.5">
                <p className={`text-xs text-slate-500 ${!stage3ReadyToSubmit ? 'opacity-70' : ''}`}>
                  {!allStage3Decided
                    ? 'Upload responses and complete QHSE, Technical and Administrative marking for every bidder before proceeding.'
                    : !stage3ReadyToSubmit
                      ? 'Assign at least one Contract Engineer before proceeding to financial assessment.'
                      : `${activeBidders.filter(b => stage3Overall(b) === 'pass').length} of ${activeBidders.length} bidders passed Stage 3.`}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" onClick={handleSaveDraft}>
                  <Save size={13} /> Save to Draft
                </Button>
                <Button disabled={!stage3ReadyToSubmit} onClick={handleStage3Submit}>
                  Submit <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Stage 4: Financial Assessment — owned by the Contract Engineer ── */}
      {tender.status === 'prequal_stage4' && (
        <>
          <Card className="p-4 flex items-start gap-3">
            <Wallet size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">
                {isCE ? 'Financial assessment assigned to you' : 'With the Contract Engineer'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isCE
                  ? 'Assess each qualified bidder, then return the pre-qualification document to the Contract Holder.'
                  : 'The Contract Engineer is completing the financial assessment. It will return here for your final review and submission.'}
              </p>
            </div>
          </Card>

          {/* CE uploads each bidder's financial statement; AI marks the criteria, CE overrides */}
          {isCE && pendingFinancialUpload.length > 0 && (
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <UploadCloud size={14} className="text-[var(--color-primary)]" />
                <h3 className="text-sm font-semibold text-slate-800">Upload Financial Statement</h3>
              </div>
              <div className="flex items-end gap-3 flex-wrap">
                <div className="flex-1 min-w-48">
                  <label className="text-xs font-medium text-slate-600 mb-1 block">Bidder</label>
                  <SearchableSelect
                    value={selectedFinancialId ?? ''}
                    onChange={v => setSelectedAssessIdRaw(Number(v))}
                    options={pendingFinancialUpload}
                    getValue={b => b.id}
                    getLabel={b => `${b.name}${b.financialReuploadRequested ? ' (Awaiting Re-upload)' : ''}`}
                    getSubLabel={b => `${b.country} · ${b.category}`}
                    placeholder="Select bidder…"
                    searchPlaceholder="Search bidders…"
                    emptyText="No matching bidders"
                    ariaLabel="Bidder"
                  />
                </div>
                <label className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-opacity ${processingId != null || selectedFinancialId == null ? 'opacity-50 pointer-events-none' : ''}`}
                  style={{ color: '#fff', background: 'var(--color-primary)' }}>
                  <UploadCloud size={13} /> Upload Statement
                  <input type="file" className="hidden"
                    onChange={e => handleFinancialFileChosen(selectedFinancialId, e.target.files?.[0])} />
                </label>
              </div>
              {processingId != null && (
                <div className="mt-3 flex items-center gap-2 text-xs text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                  <Bot size={12} className="animate-pulse" />
                  {processingPhase === 'upload' ? 'Uploading financial statement…' : 'AI assessing financial criteria…'}
                </div>
              )}
            </Card>
          )}

          {/* Financial criteria matrix — same Pass/Fail shape as Stage 3 */}
          {activeBidders.some(b => b.financialUploaded) && (
            <Card className="overflow-x-auto pb-2">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr>
                    <th className="p-3 border-b border-slate-200 bg-slate-50 sticky left-0 z-10 w-80 shadow-[1px_0_0_0_#e2e8f0]">Criteria</th>
                    {activeBidders.filter(b => b.financialUploaded).map(bidder => {
                      const overall = stage4Overall(bidder)
                      return (
                        <th key={bidder.id} className="p-3 border-b border-slate-200 bg-slate-50 border-l">
                          <div className="flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-1.5 flex-wrap justify-center mb-1">
                              <span className="text-sm font-semibold text-slate-800">{bidder.name}</span>
                              {overall === 'pass' && <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>}
                              {overall === 'fail' && <Badge variant="error"><XCircle size={10} /> Fail</Badge>}
                            </div>
                            {isCE && overall === 'fail' && (
                              <button onClick={() => handleRequestFinancialReupload(bidder.id)}
                                className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 hover:bg-amber-100 transition-colors mt-1 font-semibold w-full">
                                Reupload Bidders Documents
                              </button>
                            )}
                            <span className="text-[10px] text-slate-400 font-normal">{bidder.country} · {bidder.category}</span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={activeBidders.filter(b => b.financialUploaded).length + 1} className="px-3 py-2 bg-slate-100 font-semibold text-slate-700 text-xs uppercase tracking-wider sticky left-0 shadow-[1px_0_0_0_#f1f5f9]">
                      {FINANCIAL_SHEET.label}
                    </td>
                  </tr>
                  {FINANCIAL_SHEET.criteria.map(c => (
                    <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors group">
                      <td className="p-3 sticky left-0 bg-white border-r border-slate-100 z-10 group-hover:bg-slate-50 transition-colors shadow-[1px_0_0_0_#f1f5f9]">
                        <p className="text-xs font-medium text-slate-700">{c.item}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5 whitespace-normal w-72">{c.detail}</p>
                      </td>
                      {activeBidders.filter(b => b.financialUploaded).map(bidder => {
                        const mark = bidder.stage4Marks?.financial?.[c.id]
                        const aiMark = bidder.stage4Ai?.financial?.[c.id]
                        const overridden = aiMark != null && mark !== aiMark
                        return (
                          <td key={bidder.id} className="p-3 text-center align-top border-l border-slate-100">
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="flex gap-1.5 shrink-0 justify-center">
                                <button disabled={!isCE} onClick={() => setFinancialMark(bidder.id, c.id, 'pass')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all disabled:opacity-60 ${mark === 'pass' ? 'border-emerald-300 text-emerald-700 bg-emerald-50 ring-1 ring-emerald-300' : 'border-slate-200 text-slate-500 bg-white hover:border-emerald-300'}`}>Pass</button>
                                <button disabled={!isCE} onClick={() => setFinancialMark(bidder.id, c.id, 'fail')}
                                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all disabled:opacity-60 ${mark === 'fail' ? 'border-red-300 text-red-700 bg-red-50 ring-1 ring-red-300' : 'border-slate-200 text-slate-500 bg-white hover:border-red-300'}`}>Fail</button>
                              </div>
                              {overridden ? (
                                <button disabled={!isCE} onClick={() => resetFinancialMark(bidder.id, c.id)}
                                  className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-700 disabled:opacity-60">
                                  <RotateCcw size={9} /> Reset
                                </button>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                  <Bot size={9} /> AI suggested
                                </span>
                              )}
                              {mark === 'fail' && bidder.stage4Reasons?.financial?.[c.id] && (
                                <div className="text-[9px] text-red-600 mt-1 max-w-[120px] text-left leading-tight bg-red-50 p-1 rounded border border-red-100">
                                  <span className="font-semibold block mb-0.5 text-[8px] uppercase tracking-wider">Reason</span>
                                  {bidder.stage4Reasons.financial[c.id]}
                                </div>
                              )}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          )}

          <Card className={`p-4 transition-opacity ${!allStage4Assessed ? 'opacity-60' : ''}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2"><Award size={14} className="text-[var(--color-primary)]" /> Financial Assessment Complete</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {!allStage4Assessed
                    ? "Upload every bidder's financial statement and mark all criteria before finalising."
                    : `${financialPassers.length} of ${activeBidders.length} bidders passed the financial assessment. The Contract Holder decides the final shortlist from both results.`}
                </p>
              </div>
              <div className="flex gap-2">
                {allStage4Assessed && (
                  <Button variant="secondary" onClick={() => exportPreQualSummaryPDF(tender, financialPassers)}>
                    <Download size={13} /> Export Pre-Qual Summary
                  </Button>
                )}
                {isCE && (
                  <Button disabled={!allStage4Assessed || finalizing} onClick={sendBackToHolder}>
                    {finalizing ? 'Processing…' : 'Return to Contract Holder'}
                    {!finalizing && <ChevronRight size={14} />}
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

      {/* ── Final Review: back with the Contract Holder to submit ── */}
      {tender.status === 'prequal_final_review' && (
        <>
          <Card className="p-4 flex items-start gap-3">
            <CheckCircle size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Financial assessment complete</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Returned by {tender.financialAssessmentCompletedBy || 'the Contract Engineer'}
                {tender.financialAssessmentCompletedAt ? ` on ${tender.financialAssessmentCompletedAt}` : ''}.
                Both results are shown per bidder — include or exclude each, then submit.
              </p>
            </div>
          </Card>

          {/* Decision table: both round results side by side, Holder includes/excludes */}
          <Card className="overflow-x-auto pb-2">
            <table className="w-full text-left border-collapse min-w-max">
              <thead>
                <tr className="text-xs text-slate-500">
                  <th className="p-3 border-b border-slate-200 bg-slate-50">Bidder</th>
                  <th className="p-3 border-b border-slate-200 bg-slate-50 text-center">Technical / QHSE (PQQ)</th>
                  <th className="p-3 border-b border-slate-200 bg-slate-50 text-center">Financial Assessment</th>
                  <th className="p-3 border-b border-slate-200 bg-slate-50 text-center">Decision</th>
                </tr>
              </thead>
              <tbody>
                {activeBidders.map(bidder => {
                  const s3 = stage3Overall(bidder)
                  const s4 = stage4Overall(bidder)
                  const included = includedIds.has(bidder.id)
                  return (
                    <tr key={bidder.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <p className="text-sm font-semibold text-slate-800">{bidder.name}</p>
                        <p className="text-[10px] text-slate-400">{bidder.country} · {bidder.category}</p>
                      </td>
                      <td className="p-3 text-center">
                        {s3 === 'pass'
                          ? <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>
                          : <Badge variant="error"><XCircle size={10} /> Fail</Badge>}
                      </td>
                      <td className="p-3 text-center">
                        {s4 === 'pass'
                          ? <Badge variant="success"><CheckCircle size={10} /> Pass</Badge>
                          : <Badge variant="error"><XCircle size={10} /> Fail</Badge>}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => !isCE && toggleInclude(bidder.id)}
                          disabled={isCE}
                          className={`px-3 py-1 rounded-lg text-[11px] font-semibold border transition-all disabled:opacity-60 ${included ? 'border-emerald-300 text-emerald-700 bg-emerald-50 ring-1 ring-emerald-300' : 'border-slate-200 text-slate-500 bg-white hover:border-emerald-300'}`}
                        >
                          {included ? 'Selected' : 'Rejected'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Award size={14} className="text-[var(--color-primary)]" /> Final Shortlist
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {includedIds.size} of {activeBidders.length} bidders selected to qualify.
                  {includedIds.size === 0 && ' Submitting with none selected archives the tender.'}
                </p>
              </div>
              <div className="flex gap-2">
                {includedIds.size > 0 && (
                  <Button variant="secondary" onClick={() => exportPreQualSummaryPDF(tender, activeBidders.filter(b => includedIds.has(b.id)))}>
                    <Download size={13} /> Export Pre-Qual Summary
                  </Button>
                )}
                {!isCE && (
                  <Button disabled={finalizing} onClick={finalizeFinalReview}>
                    {finalizing ? 'Processing…' : includedIds.size > 0 ? 'Submit' : 'Reject & Archive'} <ChevronRight size={14} />
                  </Button>
                )}
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
