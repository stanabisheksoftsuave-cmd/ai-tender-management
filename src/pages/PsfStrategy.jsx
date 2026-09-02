import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Bot, Sparkles, CheckCircle, FileText, UploadCloud, Download, ChevronRight, ChevronDown,
  ShieldOff, ClipboardCheck, X, UserCheck, Briefcase,
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import SearchableSelect from '../components/ui/SearchableSelect'
import AiEditableTextarea from '../components/ui/AiEditableTextarea'
import AiAnalysisLoader from '../components/ui/AiAnalysisLoader'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { exportTemplateExcel, exportPreQualSummaryExcel } from '../utils/exportExcel'
import { exportPsfPDF } from '../utils/exportPDF'
import { TEMPLATE_DEFS } from './StrategyTemplatesDashboard'
import { CONTRACTING_MODELS, MARKET_APPROACHES, COMMERCIAL_DRIVERS } from '../data/psfOptions'
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

// Mirrors the PSF Strategy document's header block.
/* Backfill the strategy fields on a PSF drafted before they existed. */
function withStrategyDefaults(psf) {
  if (!psf) return null
  return {
    ...psf,
    contractingModel: CONTRACTING_MODELS.includes(psf.contractingModel)
      ? psf.contractingModel
      : CONTRACTING_MODELS[0],
    marketApproach: MARKET_APPROACHES.includes(psf.marketApproach)
      ? psf.marketApproach
      : MARKET_APPROACHES[0],
    commercialDrivers: Array.isArray(psf.commercialDrivers)
      ? psf.commercialDrivers
      : COMMERCIAL_DRIVERS.filter(d => d.defaultChecked).map(d => d.id),
  }
}

function buildPsf(tender, uploads) {
  const value = tender?.budget || '—'
  return {
    title: tender?.title || '—',
    contractNumber: tenderRef(tender) || '—',
    anticipatedValue: value,
    duration: tender?.duration || '—',
    sourceOfFunds: tender?.costCode ? `Cost Centre ${tender.costCode}` : 'Operating Budget',
    costCentre: tender?.costCode || '—',
    expenditureType: tender?.tenderType === 'Goods' ? 'Capital Expenditure' : 'Operating Expenditure',
    // The CIF's own Contract Mode (Lump Sum / Reimbursable / Unit Rate) is a
    // different vocabulary from the PSF's contracting models, so it is only
    // carried over when it happens to name one of them.
    contractingModel: CONTRACTING_MODELS.includes(tender?.contractMode)
      ? tender.contractMode
      : CONTRACTING_MODELS[0],
    marketApproach: MARKET_APPROACHES[0],
    commercialDrivers: COMMERCIAL_DRIVERS.filter(d => d.defaultChecked).map(d => d.id),
    background:
      `${tender?.title || 'This requirement'} is being tendered by ${tender?.department || 'the requesting department'} ` +
      `with an anticipated value of ${value}. Pre-qualification returned ${tender?.bidders ?? 0} qualified bidder(s) ` +
      `following QHSE, technical and administrative assessment` +
      `${tender?.financialAssessmentRequired ? ', together with a financial assessment completed by the Contract Engineer' : ''}. ` +
      `The strategy templates listed below were completed and re-submitted as supporting evidence for this submission.`,
    executiveSummary:
      `Approval is sought to proceed to tender for ${tender?.title || 'this requirement'} under ` +
      `${tender?.tenderType || 'the applicable'} category. The contract strategy, company estimate, risk assessments and ` +
      `negotiation approach have been reviewed and are attached. ${Object.keys(uploads).length} supporting document(s) ` +
      `accompany this form. Recommended award route is competitive tender against the pre-qualified bidder list.`,
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
    title: 'Assign Contract Engineers',
    requirement: '— at least one required',
    noun: 'Contract Engineers',
    empty: 'No active Contract Engineers',
    note: 'Once submitted, the Contract Holder can create the ITT, and every assigned Contract Engineer picks it up for the ITT Draft and commercial stages.',
    tenderKey: 'assignedContractEngineers',
  },
  {
    key: 'hse',
    roleId: 'hse',
    title: 'Assign HSE',
    requirement: '— optional',
    noun: 'HSE Officers',
    empty: 'No active HSE Officers',
    note: 'Recorded on the PSF so the owner of Section C — QHSSE Requirements is known when the ITT is drafted.',
    tenderKey: 'assignedHseOfficers',
  },
  {
    key: 'icv',
    roleId: 'icv',
    title: 'Assign ICV',
    requirement: '— optional',
    noun: 'ICV Leads',
    empty: 'No active ICV Leads',
    note: 'Recorded on the PSF so the owner of Section H — ICV Requirements is known when the ITT is drafted.',
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
  const [psf, setPsf] = useState(() => withStrategyDefaults(tender?.psfDocument))
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
  const assignedCeIds = assignedIds.ce
  const [templatesOpen, setTemplatesOpen] = useState(true)

  const qualifiedBidders = (tender?.prequalBidders || []).filter(b => !b.droppedAt)
  const hasPreQual = (tender?.prequalBidders?.length || 0) > 0

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

  const downloadTemplate = (template) => {
    const rows = tender?.[template.dataKey] || []
    exportTemplateExcel(template, rows, tender)
  }

  const startGeneration = () => { setGenStep(0); setStep(1) }

  const setPsfField = (key, value) => setPsf(prev => ({ ...prev, [key]: value }))

  const handleSubmit = () => {
    const ces = pickedIn('ce')
    if (ces.length === 0) return
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
                Download each template, complete or verify it offline, then upload it back. Every included template must be
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
                      <Button variant="secondary" size="sm" onClick={() => downloadTemplate(template)}>
                        <Download size={13} /> Download
                      </Button>

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
                    {hasPreQual && (
                      <Button variant="secondary" size="sm" onClick={() => exportPreQualSummaryExcel(tender, qualifiedBidders)}>
                        <Download size={13} /> Download
                      </Button>
                    )}
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
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardCheck size={15} className="text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-slate-800">Procurement Submission Form — Strategy</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['title', 'Title'],
                ['contractNumber', 'Contract / PR Number'],
                ['anticipatedValue', 'Anticipated Value'],
                ['duration', 'Duration'],
                ['sourceOfFunds', 'Source of Funds'],
                ['costCentre', 'Cost Centre'],
                ['expenditureType', 'Expenditure Type'],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">{label}</label>
                  <input
                    value={psf[key] || ''}
                    onChange={e => setPsfField(key, e.target.value)}
                    disabled={tender.psfCompleted}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              ))}
            </div>
          </Card>

          {/* How the work is contracted and taken to market, and what the
              strategy is optimising for. */}
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase size={15} className="text-[var(--color-primary)]" />
              <h3 className="text-sm font-semibold text-slate-800">Procurement Strategy</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                ['contractingModel', 'Contracting Model', CONTRACTING_MODELS],
                ['marketApproach', 'Market Approach', MARKET_APPROACHES],
              ].map(([key, label, options]) => (
                <div key={key}>
                  <label className="text-[11px] font-medium text-slate-600 mb-1 block">{label}</label>
                  <select
                    value={psf[key] || ''}
                    onChange={e => setPsfField(key, e.target.value)}
                    disabled={tender.psfCompleted}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:bg-slate-50 disabled:text-slate-500"
                  >
                    {options.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <p className="text-[11px] font-medium text-slate-600 mb-1.5">Commercial Drivers</p>
              <div className="flex flex-wrap gap-2">
                {COMMERCIAL_DRIVERS.map(driver => {
                  const on = (psf.commercialDrivers || []).includes(driver.id)
                  return (
                    <label
                      key={driver.id}
                      className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${
                        tender.psfCompleted ? 'cursor-default' : 'cursor-pointer'
                      } ${on
                        ? 'border-[var(--color-primary)]/40 bg-[var(--color-primary)]/8 text-[var(--color-primary)]'
                        : 'border-slate-200 bg-white text-slate-500'}`}
                    >
                      <input
                        type="checkbox"
                        checked={on}
                        disabled={tender.psfCompleted}
                        onChange={() => setPsfField(
                          'commercialDrivers',
                          on
                            ? (psf.commercialDrivers || []).filter(id => id !== driver.id)
                            : [...(psf.commercialDrivers || []), driver.id],
                        )}
                        className="accent-[var(--color-primary)]"
                      />
                      {driver.label}
                    </label>
                  )
                })}
              </div>
            </div>
          </Card>

          <Card className="p-5 space-y-4">
            {[['background', 'Background'], ['executiveSummary', 'Executive Summary']].map(([key, label]) => (
              <div key={key}>
                <label className="text-[11px] font-medium text-slate-600 mb-1 flex items-center gap-1.5">
                  {label}
                  <span className="text-[10px] text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-1.5 py-0.5 rounded-full">AI drafted</span>
                </label>
                <AiEditableTextarea
                  value={psf[key] || ''}
                  onChange={val => setPsfField(key, val)}
                  disabled={tender.psfCompleted}
                  rows={5}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>
            ))}
          </Card>

          {/* Who picks this tender up once the PSF is submitted — one group per
              owning role: Contract Engineer, HSE and ICV. */}
          {ASSIGNMENT_GROUPS.map(group => {
            const options = usersByGroup[group.key] || []
            const picked = assignedIds[group.key] || []
            const submitted = (tender[group.tenderKey]
              || (group.key === 'ce' ? [tender.assignedContractEngineer].filter(Boolean) : []))
            return (
              <Card key={group.key} className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck size={15} className="text-[var(--color-primary)]" />
                  <h3 className="text-sm font-semibold text-slate-800">{group.title}</h3>
                  <span className="text-[11px] text-slate-400">{group.requirement}</span>
                </div>
                {tender.psfCompleted ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
                    <CheckCircle size={14} />
                    Assigned to {submitted.map(c => c.name).join(', ') || '—'}
                  </div>
                ) : (
                  <div className="max-w-sm">
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
                )}
              </Card>
            )
          })}

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
                  <Button disabled={submitting || assignedCeIds.length === 0} onClick={handleSubmit}>
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
