import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bot, Sparkles, CheckCircle, FileText, UploadCloud, Download, ChevronRight, ChevronDown,
  ShieldOff, ClipboardCheck, X, UserCheck,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SearchableSelect from '../components/ui/SearchableSelect'
import {
  PsfSection, PsfSubHeading, PsfField, PsfNarrative, PsfNote, PsfCheckboxGrid,
  PsfHistoryTable, PsfMilestoneTable, PsfTendererTable, PsfIcvTable,
} from '../components/psf/PsfFields'
import AiAnalysisLoader from '../components/ui/AiAnalysisLoader'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { exportPsfPDF } from '../utils/exportPDF'
import { TEMPLATE_DEFS } from './StrategyTemplatesDashboard'
import {
  EM_DASH, toCheckboxes, PSF_REVIEW_OPTIONS, PSF_ESTIMATE_BASIS_OPTIONS,
  PSF_DEFAULT_CONFIDENCE_LEVEL, PSF_TENDER_PLAN_TYPES, PSF_MILESTONE_LABELS,
  PSF_TENDER_STRATEGY_OPTIONS, PSF_COMPETITIVE_DROP_LIST, PSF_SINGLE_SOURCE_DROP_LIST,
  PSF_TENDERER_ROW_COUNT, PSF_ICV_REQUIREMENTS, PSF_HEADER_FIELDS, PSF_NARRATIVE_FIELDS,
} from '../data/psfTemplate'
import { tenderRef } from '../utils/tenderRef'

/*
 * PSF Strategy — Procurement Submission Form (Strategy variant).
 *
 * Sits between Strategy Templates and ITT Creation. The Contract Holder
 * re-uploads every completed strategy template, AI drafts the PSF from the
 * tender record, and submitting marks the tender psfCompleted — which is what
 * gates it into ITT Creation.
 */

const GEN_TASKS = [
  'Reading uploaded strategy templates',
  'Extracting contract history from previous awards',
  'Summarising the statement of work',
  'Compiling anticipated value & funding source',
  'Drafting background and executive summary',
  'Assembling Procurement Submission Form',
]

// Supporting documents uploaded alongside the strategy templates on the PSF page.
const EXTRA_PSF_DOCS = [
  { id: 'single-source-justification', title: 'Single Source Justification' },
  { id: 'contract-strategy-workshop',  title: 'Contract Strategy Workshop' },
  { id: 'other-documents',             title: 'Other Documents' },
]

/*
 * Assembles the Procurement Submission Form from the tender and the files
 * uploaded on step 0. Structure mirrors `PSF Strategy.docx` from `Attachments:`
 * onward — see src/data/psfTemplate.js for the section inventory.
 *
 * The template marks a dozen fields in red with instructions like "AI to
 * generate background from previous contracts". Those are rendered as drafted
 * prose the Contract Holder edits, never as the instruction itself.
 */

/** The template's HISTORY tables start blank apart from the zeroed money rows. */
function emptyHistory(includeActualSpend) {
  const base = { awardDate: '', expiryDate: '', contractorName: '', method: '', acv: '0.00' }
  return includeActualSpend ? { ...base, actualSpend: '0.00' } : base
}

/* Every red field's drafted prose, in one place so the wording is reviewable. */
function buildNarrative(tender, uploads) {
  const title = tender?.title || 'This requirement'
  const value = tender?.budget || EM_DASH
  const department = tender?.department || 'the requesting department'
  const category = tender?.tenderType || 'the applicable'
  const uploaded = Object.keys(uploads || {}).length
  const bidders = tender?.bidders ?? 0

  return {
    background:
      `${title} is being tendered by ${department} with an anticipated value of ${value}. ` +
      `Pre-qualification returned ${bidders} qualified bidder(s) following QHSE, technical and ` +
      `administrative assessment${tender?.financialAssessmentRequired ? ', together with a financial assessment completed by the Contract Engineer' : ''}. ` +
      `The strategy templates listed in this submission were completed and re-submitted as supporting evidence.`,

    justification:
      `The requirement is being taken to tender to secure continuity of supply for ${department} ` +
      `under a ${category.toLowerCase()} category award. The contract strategy, company estimate and ` +
      `risk assessments prepared for this tender support proceeding on the basis set out below.`,

    scopeOverview:
      `Approval is sought to proceed to tender for ${title} under ${category} category. The contract ` +
      `strategy, company estimate, risk assessments and negotiation approach have been reviewed. ` +
      `${uploaded} supporting document(s) accompany this form. The recommended award route is set out ` +
      `in the tender strategy section below.`,

    manpowerRequirements:
      `Manpower requirements follow the scope of work prepared for ${title}. No dedicated Oman LNG ` +
      `headcount is created by this award; the contractor supplies personnel for the duration of the contract.`,

    goodsServicesRequirements:
      `Goods and services requirements are as set out in the scope of work, priced against the company ` +
      `estimate of ${(tender?.companyEstimate || []).length} line item(s) and covered by the technical ` +
      `evaluation matrix's ${(tender?.technicalEvalMatrix || []).length} criterion(s).`,

    otherRequirements:
      `${(tender?.contractRiskAssessment || []).length} contract risk(s) and ` +
      `${(tender?.hseRiskAssessment || []).length} HSE hazard(s) have been assessed for this scope, ` +
      `together with ${(tender?.icvPlan || []).length} ICV commitment(s). Any residual requirement is ` +
      `carried in the tender documents.`,

    benchmarking:
      `The estimate has been benchmarked against previous contract rates and available market ` +
      `intelligence for comparable scope, with escalation applied to bring historic rates to current ` +
      `terms. The company estimate is the basis for the anticipated value of ${value}.`,

    negotiationDetails:
      `Negotiation will follow the approved negotiation template, covering the ` +
      `${(tender?.negotiationStrategy || []).length} negotiation theme(s) prepared for this tender and ` +
      `informed by the proposed scope of work, market intelligence, the company estimate and the ICV ` +
      `requirements set out in this submission.`,

    tendererJustification:
      `Tender Board is kindly requested to endorse the bidder list below, drawn from the ERP and JSRS ` +
      `registry and assessed at pre-qualification against the QHSE, technical and administrative criteria.`,

    recommendation:
      `Tender Board is kindly requested to endorse the sourcing strategy, the bidder list, the technical ` +
      `evaluation matrix, the company estimate and the negotiation strategy for ${title}, at an ` +
      `anticipated value of ${value}.`,
  }
}

/* The TENDERER LIST seeds from whichever bidders pre-qualification carried through. */
function buildTendererRows(tender) {
  const qualified = (tender?.prequalBidders || []).filter(b => !b.droppedAt)
  const seeded = qualified.map((b, i) => ({
    id: `tenderer-${i}`,
    reference: b.name,
    prequalResult: 'Qualified',
    justification: 'Met the QHSE, technical and administrative pre-qualification criteria.',
  }))
  // The template's blank rows stay available to type into either way.
  const blanks = Array.from({ length: PSF_TENDERER_ROW_COUNT }, (_, i) => ({
    id: `tenderer-blank-${i}`, reference: '', prequalResult: '', justification: '',
  }))
  return [...seeded, ...blanks]
}

function buildPsf(tender, uploads) {
  return {
    attachments: Object.values(uploads || {}).map(f => f?.name).filter(Boolean),

    header: {
      title: tender?.title || EM_DASH,
      contractNumber: tenderRef(tender) || EM_DASH,
      anticipatedValue: tender?.budget || EM_DASH,
      duration: tender?.duration || EM_DASH,
      sourceOfFunds: tender?.costCode ? `Cost Centre ${tender.costCode}` : 'Operating Budget',
      costCentre: tender?.costCode || EM_DASH,
      expenditureType: tender?.tenderType === 'Goods' ? 'Capital Expenditure' : 'Operating Expenditure',
    },

    history: { previous: emptyHistory(true), existing: emptyHistory(false), currentSpend: '' },

    reviews: toCheckboxes(PSF_REVIEW_OPTIONS),

    narrative: buildNarrative(tender, uploads),

    estimate: {
      confidenceLevel: PSF_DEFAULT_CONFIDENCE_LEVEL,
      basis: toCheckboxes(PSF_ESTIMATE_BASIS_OPTIONS),
    },

    tenderPlan: {
      types: toCheckboxes(PSF_TENDER_PLAN_TYPES),
      requiredBy: tender?.deadline || '',
      milestones: PSF_MILESTONE_LABELS.map((label, i) => ({
        // Index-suffixed: the template repeats "PSF Submitted to CPL for
        // Review", so the label alone is not a unique key.
        id: `milestone-${i}`, label, planned: '', actual: '',
      })),
      deviations: '',
    },

    tenderStrategy: toCheckboxes(PSF_TENDER_STRATEGY_OPTIONS),

    dropLists: {
      competitive: toCheckboxes(PSF_COMPETITIVE_DROP_LIST),
      singleSourceOem: toCheckboxes(PSF_SINGLE_SOURCE_DROP_LIST),
    },

    assessments: { technical: '', cutOff: '', commercial: '' },

    alternativesConsidered:
      'Default competitive strategy or OEM, therefore no alternative has been considered.',
    assessmentOtherDetails: '',
    omanisationImplications: '',
    omanisationOtherDetails: '',

    negotiation: { applicability: 'Applicable (see below)' },
    strategyAdditionalNotes: '',

    tendererList: { source: '', rows: buildTendererRows(tender) },
    tendererAdditionalNotes: '',

    icvReviewDetail: '',
    icvRequirements: PSF_ICV_REQUIREMENTS.map(row => ({
      id: `icv-${row.ordinal}`, ...row, answer: '', comment: '',
    })),
  }
}

/*
 * A PSF saved before the template sections existed is flat — `background` and
 * `executiveSummary` at the top level and nothing else. Rebuild it on the full
 * shape rather than let the review UI read `psf.narrative.background` off
 * undefined, carrying across the two prose fields the Holder may have edited.
 */
function normalisePsf(psf, tender, uploads) {
  if (!psf) return null
  if (psf.narrative && Array.isArray(psf.reviews)) return psf
  const rebuilt = buildPsf(tender, uploads)
  return {
    ...rebuilt,
    header: { ...rebuilt.header, ...(psf.title ? { title: psf.title } : {}) },
    narrative: {
      ...rebuilt.narrative,
      ...(psf.background ? { background: psf.background } : {}),
      ...(psf.executiveSummary ? { scopeOverview: psf.executiveSummary } : {}),
    },
  }
}

// The tender is handed on at submit to the people who own the ITT sections that
// follow: the Contract Engineer creates and exports the ITT, HSE owns Section C
// (QHSSE) and ICV owns Section H. One group per role, each drawn from the
// active users holding it.
const ASSIGNMENT_GROUPS = [
  {
    key: 'ce',
    roleId: 'pof',
    title: 'Contract Engineers',
    short: 'CE',
    noun: 'Contract Engineers',
    empty: 'No active Contract Engineers',
    note: 'Picks this up for the ITT Draft and commercial stages.',
    tenderKey: 'assignedContractEngineers',
  },
  {
    key: 'hse',
    roleId: 'hse',
    title: 'HSE',
    short: 'HSE',
    noun: 'HSE Officers',
    empty: 'No active HSE Officers',
    note: 'Owns Section C — QHSSE Requirements on the ITT.',
    tenderKey: 'assignedHseOfficers',
  },
  {
    key: 'icv',
    roleId: 'icv',
    title: 'ICV',
    short: 'ICV',
    noun: 'ICV Leads',
    empty: 'No active ICV Leads',
    note: 'Owns Section H — ICV Requirements on the ITT.',
    tenderKey: 'assignedIcvLeads',
  },
]


export default function PsfStrategy() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user, users } = useAuth()
  const { tenders, updateTender } = useTenders()

  const tender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const usersByGroup = useMemo(() => Object.fromEntries(
    ASSIGNMENT_GROUPS.map(g => [g.key, (users || []).filter(u => u.roleId === g.roleId && u.status === 'active')])
  ), [users])

  // Every template is uploadable on the PSF page, even ones not chosen at the
  // acknowledgement gate. None of them block generation — every upload here is optional.
  const isTemplateRequired = () => false

  // 0 = re-upload templates, 1 = AI generation, 2 = review & submit
  const [step, setStep] = useState(tender?.psfDocument ? 2 : 0)
  const [genStep, setGenStep] = useState(0)
  const [uploads, setUploads] = useState(tender?.psfUploads || {})
  const [psf, setPsf] = useState(() => normalisePsf(tender?.psfDocument, tender, tender?.psfUploads || {}))
  const [submitting, setSubmitting] = useState(false)
  const [assignedIds, setAssignedIds] = useState(() => ({
    ce: Array.isArray(tender?.assignedContractEngineers)
      ? tender.assignedContractEngineers.map(c => c.id)
      : tender?.assignedContractEngineer ? [tender.assignedContractEngineer.id] : [],
    hse: (tender?.assignedHseOfficers || []).map(c => c.id),
    icv: (tender?.assignedIcvLeads || []).map(c => c.id),
  }))
  const setGroupIds = (key, vals) => setAssignedIds(prev => ({ ...prev, [key]: vals }))
  // Who a group's picked ids resolve to, as the {id, name} pairs stored on the tender.
  const pickedIn = (key) => (usersByGroup[key] || [])
    .filter(u => (assignedIds[key] || []).some(id => String(id) === String(u.id)))
    .map(u => ({ id: u.id, name: u.name }))
  // The template hands the tender to all three roles, so submit needs all three.
  const isFullyAssigned = ASSIGNMENT_GROUPS.every(g => (assignedIds[g.key] || []).length > 0)
  /* Who this went to, once submitted — all three roles, not just the engineers. */
  const assignmentSummary = ASSIGNMENT_GROUPS
    .map(g => {
      const names = (tender?.[g.tenderKey]
        || (g.key === 'ce' ? [tender?.assignedContractEngineer].filter(Boolean) : []))
        .map(c => c.name).join(', ')
      return names ? (g.key === 'ce' ? names : `${names} (${g.short})`) : null
    })
    .filter(Boolean).join(', ') || EM_DASH
  const [templatesOpen, setTemplatesOpen] = useState(true)

  const qualifiedBidders = (tender?.prequalBidders || []).filter(b => !b.droppedAt)
  const hasPreQual = (tender?.prequalBidders?.length || 0) > 0

  // PSF only makes sense once every Strategy Template the Contract Holder
  // selected is complete — the Strategy Templates page's own Proceed button
  // already enforces this, but a direct URL visit bypasses that.
  const selectedCardIds = Array.isArray(tender?.selectedTemplates)
    ? tender.selectedTemplates
    : [...TEMPLATE_DEFS.map(t => t.id), 'pre-qual']
  const templatesComplete = selectedCardIds.length > 0 && selectedCardIds.every(id => {
    if (id === 'pre-qual') return tender?.status === 'draft'
    const dataKey = TEMPLATE_DEFS.find(t => t.id === id)?.dataKey
    return dataKey ? (tender?.[dataKey]?.length || 0) > 0 : true
  })

  useEffect(() => {
    if (tender && !tender.psfCompleted && !templatesComplete) {
      navigate(`/strategy-templates/${tenderId}`)
    }
  }, [tender, templatesComplete, tenderId, navigate])

  useBackHandler(() => {
    if (step === 2 && !tender?.psfCompleted) { setStep(0); return true }
    if (step === 1) { setGenStep(0); setStep(0); return true }
    return false
  })

  // Drive the generation ticker, then hand over the drafted document.
  useEffect(() => {
    if (step !== 1) return
    if (genStep >= GEN_TASKS.length) {
      const t = setTimeout(() => {
        setPsf(buildPsf(tender, uploads))
        setStep(2)
      }, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setGenStep(s => s + 1), 550)
    return () => clearTimeout(t)
  }, [step, genStep, tender, uploads])

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Holders can prepare the PSF Strategy.</p>
    </div>
  )

  if (!tender) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <FileText size={32} />
      <p className="text-sm font-medium">Tender not found.</p>
      <Button variant="secondary" size="sm" onClick={() => navigate('/tenders')}>Back to Tender List</Button>
    </div>
  )

  // The effect above is already sending this back to Strategy Templates —
  // render nothing rather than flash the PSF page for a frame first.
  if (!tender.psfCompleted && !templatesComplete) return null

  const handleUpload = (templateId, file) => {
    if (!file) return
    const next = { ...uploads, [templateId]: { name: file.name, size: file.size, uploadedAt: new Date().toISOString().split('T')[0] } }
    setUploads(next)
    updateTender(tender.id, { psfUploads: next })
  }

  const removeUpload = (templateId) => {
    const next = { ...uploads }
    delete next[templateId]
    setUploads(next)
    updateTender(tender.id, { psfUploads: next })
  }

  const startGeneration = () => { setGenStep(0); setStep(1) }

  // The document is nested now, so edits address a path rather than a key.
  const setPsfPath = (path, value) => setPsf(prev => {
    const next = { ...prev }
    let node = next
    for (let i = 0; i < path.length - 1; i++) {
      node[path[i]] = Array.isArray(node[path[i]]) ? [...node[path[i]]] : { ...node[path[i]] }
      node = node[path[i]]
    }
    node[path[path.length - 1]] = value
    return next
  })
  /* Flip one tick box in a checkbox group, leaving the rest as they were. */
  const toggleIn = (boxes, id, checked) =>
    boxes.map(box => (box.id === id ? { ...box, checked } : box))
  // A submitted PSF is the approved record — every field goes read-only.
  const readOnly = !!tender?.psfCompleted

  const handleSubmit = () => {
    const ces = pickedIn('ce')
    if (!isFullyAssigned) return
    setSubmitting(true)
    setTimeout(() => {
      updateTender(tender.id, {
        psfDocument: psf,
        psfUploads: uploads,
        psfCompleted: true,
        psfCompletedAt: new Date().toISOString().split('T')[0],
        assignedContractEngineers: ces,
        assignedHseOfficers: pickedIn('hse'),
        assignedIcvLeads: pickedIn('icv'),
        // Keep the single field for any code still reading it (first assignee).
        assignedContractEngineer: ces[0],
      })
      setSubmitting(false)
      // ITT Creation belongs to the Contract Engineer, so a Contract Holder is
      // handing the tender over rather than continuing into it.
      navigate('/tenders')
    }, 400)
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
              <Badge variant={tender.status}>{tender.stage}</Badge>
              {tender.psfCompleted && <Badge variant="success"><CheckCircle size={10} /> PSF Complete</Badge>}
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Procurement Submission Form — Strategy
              {tender.department ? ` · ${tender.department}` : ''}
            </p>
          </div>
        </div>
      </Card>

      {/* Stepper */}
      <div className="flex items-center gap-2 text-[11px] font-medium">
        {['Upload Templates', 'AI Generation', 'Review & Submit'].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full ${
              step === i ? 'bg-[var(--color-primary)] text-white'
                : step > i ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                : 'bg-slate-100 text-slate-400'}`}>
              {step > i ? '✓ ' : `${i + 1}. `}{label}
            </span>
            {i < 2 && <ChevronRight size={12} className="text-slate-300" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: re-upload every completed template ── */}
      {step === 0 && (
        <>
          <Card className="p-4 flex items-start gap-3">
            <UploadCloud size={16} className="text-[var(--color-primary)] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Re-upload completed strategy templates</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Complete or verify each template offline, then upload it back. Every included template must be
                uploaded before the PSF Strategy can be generated.
              </p>
            </div>
          </Card>

          {/* Strategy templates — collapsible dropdown, selected ones marked Required */}
          <Card className="overflow-hidden">
            <button
              onClick={() => setTemplatesOpen(o => !o)}
              className="w-full flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <FileText size={15} className="text-[var(--color-primary)]" />
                <span className="text-sm font-semibold text-slate-800">Strategy Templates</span>
                <span className="text-[11px] font-medium text-slate-400">
                  {TEMPLATE_DEFS.filter(t => uploads[t.id]).length} of {TEMPLATE_DEFS.length} uploaded
                </span>
              </div>
              <ChevronDown size={16} className={`text-slate-400 transition-transform ${templatesOpen ? 'rotate-180' : ''}`} />
            </button>

            {templatesOpen && (
              <div className="border-t border-slate-100 divide-y divide-slate-50">
                {TEMPLATE_DEFS.map(template => {
                  const up = uploads[template.id]
                  const rows = tender?.[template.dataKey] || []
                  const required = isTemplateRequired(template.id)
                  return (
                    <div key={template.id} className="p-4">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: `${template.color}14` }}>
                        <template.icon size={16} style={{ color: template.color }} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-slate-800 truncate">{template.title}</p>
                          {required
                            ? <span className="text-[9px] font-bold uppercase tracking-wide text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-1.5 py-0.5 rounded-full">Required</span>
                            : <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Optional</span>}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {rows.length} {template.rowLabel?.toLowerCase() || 'row'}{rows.length === 1 ? '' : 's'} completed
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {up ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                          <CheckCircle size={13} />
                          <span className="max-w-40 truncate">{up.name}</span>
                          <button onClick={() => removeUpload(template.id)} className="text-emerald-600 hover:text-emerald-800" title="Remove">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 text-xs font-medium border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors text-slate-600">
                          <UploadCloud size={13} className="text-slate-400" />
                          Upload
                          <input type="file" className="hidden" onChange={e => handleUpload(template.id, e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Pre-Qualification Document */}
          {(() => {
            const up = uploads['pre-qual']
            return (
              <Card className="p-4">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(0,137,207,0.1)' }}>
                      <ClipboardCheck size={16} style={{ color: '#0089cf' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-slate-800 truncate">Pre-Qualification Document</p>
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full">Optional</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {hasPreQual ? `${qualifiedBidders.length} qualified bidder${qualifiedBidders.length === 1 ? '' : 's'}` : 'No pre-qualification data'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {up ? (
                      <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                        <CheckCircle size={13} />
                        <span className="max-w-40 truncate">{up.name}</span>
                        <button onClick={() => removeUpload('pre-qual')} className="text-emerald-600 hover:text-emerald-800" title="Remove">
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex items-center gap-1.5 text-xs font-medium border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors text-slate-600">
                        <UploadCloud size={13} className="text-slate-400" />
                        Upload
                        <input type="file" className="hidden" onChange={e => handleUpload('pre-qual', e.target.files?.[0])} />
                      </label>
                    )}
                  </div>
                </div>
              </Card>
            )
          })()}

          {/* Additional supporting documents */}
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Supporting Documents <span className="text-slate-400 font-medium normal-case">(optional)</span></p>
            <div className="space-y-3">
              {EXTRA_PSF_DOCS.map(doc => {
                const up = uploads[doc.id]
                return (
                  <Card key={doc.id} className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(100,116,139,0.1)' }}>
                          <FileText size={16} className="text-slate-500" />
                        </div>
                        <p className="text-sm font-semibold text-slate-800 truncate">{doc.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {up ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5">
                            <CheckCircle size={13} />
                            <span className="max-w-40 truncate">{up.name}</span>
                            <button onClick={() => removeUpload(doc.id)} className="text-emerald-600 hover:text-emerald-800" title="Remove">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs font-medium border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[var(--color-primary)] transition-colors text-slate-600">
                            <UploadCloud size={13} className="text-slate-400" />
                            Upload
                            <input type="file" className="hidden" onChange={e => handleUpload(doc.id, e.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </div>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <Sparkles size={14} className="text-[var(--color-primary)]" /> Generate PSF Strategy
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  All template uploads are optional — ready to generate.
                </p>
              </div>
              <Button onClick={startGeneration}>
                <Bot size={13} /> Generate with AI
              </Button>
            </div>
          </Card>
        </>
      )}

      {/* ── Step 1: AI generation ── */}
      {step === 1 && (
        <div className="flex items-center justify-center py-10">
          <AiAnalysisLoader
            className="max-w-md"
            title="Generating the Procurement Submission Form"
            description="Building the PSF Strategy from your templates and contract details"
            progress={(genStep / GEN_TASKS.length) * 100}
            steps={GEN_TASKS.map((task, i) => ({
              id: task,
              label: task,
              status: i < genStep ? 'complete' : i === genStep ? 'active' : 'pending',
            }))}
          />
        </div>
      )}

      {/* ── Step 2: review & submit ── */}
      {step === 2 && psf && (
        <>
          {/* ── Attachments ── */}
          <PsfSection title="Attachments">
            {psf.attachments.length === 0 ? (
              <p className="text-xs text-slate-400">
                No attachments yet — files added on the upload stage appear here.
              </p>
            ) : (
              <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
                {psf.attachments.map((name, i) => (
                  // Index-keyed: the same file can legitimately be attached
                  // against two rows, so the name alone is not unique.
                  <li key={`${i}-${name}`} className="truncate">{name}</li>
                ))}
              </ol>
            )}
          </PsfSection>

          {/* ── Submission details ── */}
          <PsfSection title="Procurement Submission Form — Strategy">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PSF_HEADER_FIELDS.map(field => (
                <PsfField
                  key={field.key}
                  label={field.label}
                  value={psf.header[field.key] || ''}
                  readOnly={readOnly}
                  onChange={v => setPsfPath(['header', field.key], v)}
                />
              ))}
            </div>
          </PsfSection>

          {/* ── History ── */}
          <PsfSection title="History">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <PsfSubHeading>Previous contract</PsfSubHeading>
                <PsfHistoryTable
                  scope="previous"
                  entry={psf.history.previous}
                  readOnly={readOnly}
                  onChange={patch => setPsfPath(['history', 'previous'], { ...psf.history.previous, ...patch })}
                />
              </div>
              <div>
                <PsfSubHeading>Existing contract</PsfSubHeading>
                <PsfHistoryTable
                  scope="existing"
                  entry={psf.history.existing}
                  readOnly={readOnly}
                  onChange={patch => setPsfPath(['history', 'existing'], { ...psf.history.existing, ...patch })}
                />
                <div className="mt-3">
                  <PsfField
                    label="Current Spend"
                    value={psf.history.currentSpend}
                    readOnly={readOnly}
                    onChange={v => setPsfPath(['history', 'currentSpend'], v)}
                  />
                </div>
              </div>
            </div>
          </PsfSection>

          {/* ── Reviews / approvals ── */}
          <PsfSection title="Reviews / Approvals Established">
            <PsfCheckboxGrid
              options={psf.reviews}
              readOnly={readOnly}
              onToggle={(id, checked) => setPsfPath(['reviews'], toggleIn(psf.reviews, id, checked))}
            />
          </PsfSection>

          {/* ── The red "AI to generate…" fields ── */}
          <PsfSection title="Submission Narrative">
            <div className="space-y-4">
              {PSF_NARRATIVE_FIELDS.map(field => (
                <PsfNarrative
                  key={field.key}
                  label={field.label}
                  rows={field.rows}
                  value={psf.narrative[field.key] || ''}
                  readOnly={readOnly}
                  onChange={v => setPsfPath(['narrative', field.key], v)}
                />
              ))}
            </div>
          </PsfSection>

          {/* ── Estimate basis & benchmarking ── */}
          <PsfSection title="Estimate Basis">
            <div className="max-w-xs mb-3">
              <PsfField
                label="Confidence Level"
                value={psf.estimate.confidenceLevel}
                readOnly={readOnly}
                onChange={v => setPsfPath(['estimate', 'confidenceLevel'], v)}
              />
            </div>
            <PsfCheckboxGrid
              options={psf.estimate.basis}
              readOnly={readOnly}
              onToggle={(id, checked) => setPsfPath(['estimate', 'basis'], toggleIn(psf.estimate.basis, id, checked))}
            />
            <div className="mt-4">
              <PsfNarrative
                label="Benchmarking of Estimates"
                rows={4}
                value={psf.narrative.benchmarking || ''}
                readOnly={readOnly}
                onChange={v => setPsfPath(['narrative', 'benchmarking'], v)}
              />
            </div>
          </PsfSection>

          {/* ── Tender plan ── */}
          <PsfSection title="Tender Plan">
            <PsfCheckboxGrid
              options={psf.tenderPlan.types}
              readOnly={readOnly}
              onToggle={(id, checked) => setPsfPath(['tenderPlan', 'types'], toggleIn(psf.tenderPlan.types, id, checked))}
            />
            <div className="max-w-xs mt-3 mb-4">
              <PsfField
                label="New services required in place / on site by"
                value={psf.tenderPlan.requiredBy}
                readOnly={readOnly}
                onChange={v => setPsfPath(['tenderPlan', 'requiredBy'], v)}
              />
            </div>
            <PsfMilestoneTable
              milestones={psf.tenderPlan.milestones}
              readOnly={readOnly}
              onChange={(id, patch) => setPsfPath(
                ['tenderPlan', 'milestones'],
                psf.tenderPlan.milestones.map(m => (m.id === id ? { ...m, ...patch } : m)),
              )}
            />
            <div className="mt-4">
              <PsfNote
                label="Deviations"
                value={psf.tenderPlan.deviations}
                readOnly={readOnly}
                onChange={v => setPsfPath(['tenderPlan', 'deviations'], v)}
              />
            </div>
          </PsfSection>

          {/* ── Tender strategy & drop lists ── */}
          <PsfSection title="Tender Strategy">
            <PsfCheckboxGrid
              options={psf.tenderStrategy}
              readOnly={readOnly}
              onToggle={(id, checked) => setPsfPath(['tenderStrategy'], toggleIn(psf.tenderStrategy, id, checked))}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div>
                <PsfSubHeading>Competitive — drop list</PsfSubHeading>
                <PsfCheckboxGrid
                  columns={1}
                  options={psf.dropLists.competitive}
                  readOnly={readOnly}
                  onToggle={(id, checked) => setPsfPath(['dropLists', 'competitive'], toggleIn(psf.dropLists.competitive, id, checked))}
                />
              </div>
              <div>
                <PsfSubHeading>Single source / OEM — drop list</PsfSubHeading>
                <PsfCheckboxGrid
                  columns={1}
                  options={psf.dropLists.singleSourceOem}
                  readOnly={readOnly}
                  onToggle={(id, checked) => setPsfPath(['dropLists', 'singleSourceOem'], toggleIn(psf.dropLists.singleSourceOem, id, checked))}
                />
              </div>
            </div>
          </PsfSection>

          {/* ── Assessment basis ── */}
          <PsfSection title="Proposed Basis for Tender Assessments">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[['technical', 'Technical'], ['cutOff', 'Cut Off'], ['commercial', 'Commercial']].map(([key, label]) => (
                <PsfField
                  key={key}
                  label={label}
                  value={psf.assessments[key]}
                  readOnly={readOnly}
                  onChange={v => setPsfPath(['assessments', key], v)}
                />
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <PsfNote
                label="Alternatives Considered"
                value={psf.alternativesConsidered}
                readOnly={readOnly}
                onChange={v => setPsfPath(['alternativesConsidered'], v)}
              />
              <PsfNote
                label="Other Details"
                value={psf.assessmentOtherDetails}
                readOnly={readOnly}
                onChange={v => setPsfPath(['assessmentOtherDetails'], v)}
              />
              <PsfNote
                label="Omanisation Implications"
                value={psf.omanisationImplications}
                readOnly={readOnly}
                onChange={v => setPsfPath(['omanisationImplications'], v)}
              />
              <PsfNote
                label="Other Details (Omanisation)"
                value={psf.omanisationOtherDetails}
                readOnly={readOnly}
                onChange={v => setPsfPath(['omanisationOtherDetails'], v)}
              />
            </div>
          </PsfSection>

          {/* ── Negotiation strategy ── */}
          <PsfSection title="Negotiation Strategy (OEM & single source only)">
            <div className="max-w-sm mb-4">
              <PsfField
                label="Applicability"
                value={psf.negotiation.applicability}
                readOnly={readOnly}
                onChange={v => setPsfPath(['negotiation', 'applicability'], v)}
              />
            </div>
            <PsfNarrative
              label="Negotiation Strategy Details"
              rows={4}
              value={psf.narrative.negotiationDetails || ''}
              readOnly={readOnly}
              onChange={v => setPsfPath(['narrative', 'negotiationDetails'], v)}
            />
            <div className="mt-4">
              <PsfNote
                label="Additional Notes"
                value={psf.strategyAdditionalNotes}
                readOnly={readOnly}
                onChange={v => setPsfPath(['strategyAdditionalNotes'], v)}
              />
            </div>
          </PsfSection>

          {/* ── Tenderer list ── */}
          <PsfSection title="Tenderer List">
            <div className="max-w-md mb-4">
              <PsfField
                label="Source of Tenderer List"
                value={psf.tendererList.source}
                readOnly={readOnly}
                onChange={v => setPsfPath(['tendererList', 'source'], v)}
              />
            </div>
            <PsfTendererTable
              rows={psf.tendererList.rows}
              readOnly={readOnly}
              onChange={(id, patch) => setPsfPath(
                ['tendererList', 'rows'],
                psf.tendererList.rows.map(r => (r.id === id ? { ...r, ...patch } : r)),
              )}
            />
            <div className="mt-4 space-y-4">
              <PsfNarrative
                label="Justification"
                rows={4}
                value={psf.narrative.tendererJustification || ''}
                readOnly={readOnly}
                onChange={v => setPsfPath(['narrative', 'tendererJustification'], v)}
              />
              <PsfNote
                label="Additional Notes"
                value={psf.tendererAdditionalNotes}
                readOnly={readOnly}
                onChange={v => setPsfPath(['tendererAdditionalNotes'], v)}
              />
              <PsfNarrative
                label="Recommendation / Request"
                rows={4}
                value={psf.narrative.recommendation || ''}
                readOnly={readOnly}
                onChange={v => setPsfPath(['narrative', 'recommendation'], v)}
              />
            </div>
          </PsfSection>

          {/* ── ICV review ── */}
          <PsfSection title="ICV Review Detail">
            <div className="mb-4">
              <PsfNote
                label="ICV Review Detail"
                value={psf.icvReviewDetail}
                readOnly={readOnly}
                onChange={v => setPsfPath(['icvReviewDetail'], v)}
              />
            </div>
            <PsfIcvTable
              rows={psf.icvRequirements}
              readOnly={readOnly}
              onChange={(id, patch) => setPsfPath(
                ['icvRequirements'],
                psf.icvRequirements.map(r => (r.id === id ? { ...r, ...patch } : r)),
              )}
            />
          </PsfSection>

          {/* ── Assign Team: the three owning roles, one card, side by side ── */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <UserCheck size={15} className="text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-slate-800">Assign Team</h3>
              <span className="text-[11px] text-slate-400">— all three required</span>
            </div>

            {tender.psfCompleted ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                <CheckCircle size={14} /> Assigned to {assignmentSummary}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {ASSIGNMENT_GROUPS.map(group => {
                  const options = usersByGroup[group.key] || []
                  const picked = assignedIds[group.key] || []
                  return (
                    <div key={group.key}>
                      <label className="text-[11px] font-medium text-slate-600 mb-1 block">
                        {group.title} <span className="font-secondary text-red-400">*</span>
                      </label>
                      <SearchableSelect
                        multiple
                        value={picked}
                        onChange={vals => setGroupIds(group.key, vals)}
                        options={options}
                        getValue={u => u.id}
                        getLabel={u => u.name}
                        getSubLabel={u => u.username}
                        placeholder={`Select ${group.noun}…`}
                        searchPlaceholder={`Search ${group.noun.toLowerCase()}…`}
                        emptyText={group.empty}
                        ariaLabel={group.title}
                      />
                      {picked.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {options.filter(u => picked.some(id => String(id) === String(u.id))).map(u => (
                            <span key={u.id} className="flex items-center gap-1 text-[11px] font-medium text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-2 py-0.5 rounded-full">
                              {u.name}
                              <button
                                onClick={() => setGroupIds(group.key, picked.filter(id => String(id) !== String(u.id)))}
                                className="hover:text-red-500"
                                title="Remove"
                              >
                                <X size={11} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-[11px] text-slate-400 mt-1.5">{group.note}</p>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">
                  {tender.psfCompleted ? 'PSF Strategy submitted' : 'Submit PSF Strategy'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {tender.psfCompleted
                    ? `Submitted on ${tender.psfCompletedAt}. Assigned to ${(tender.assignedContractEngineers || [tender.assignedContractEngineer].filter(Boolean)).map(c => c.name).join(', ') || 'the Contract Engineer'} for ITT creation.`
                    : 'Submitting assigns this tender to the selected Contract Engineer(s) for ITT creation.'}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => exportPsfPDF(tender, psf)}>
                  <Download size={13} /> Export PSF
                </Button>
                {!tender.psfCompleted && (
                  <Button variant="secondary" onClick={() => setStep(0)}>Back to Uploads</Button>
                )}
                {tender.psfCompleted ? (
                  <Button variant="secondary" onClick={() => navigate('/tenders')}>Back to Tender List</Button>
                ) : (
                  <Button disabled={submitting || !isFullyAssigned} onClick={handleSubmit}>
                    {submitting ? 'Submitting…' : 'Submit'} <ChevronRight size={14} />
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </>
      )}

    </div>
  )
}
