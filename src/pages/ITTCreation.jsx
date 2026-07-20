import { useState, useEffect, useRef, useMemo } from 'react'
import JSZip from 'jszip'
import {
  Bot, Sparkles, CheckCircle, RefreshCw, ChevronRight,
  FileText, AlertCircle, Circle, Download,
  UploadCloud, X, Paperclip, PackageCheck, Layers, Clock, User,
  Briefcase, Plus, Inbox, Hash, ShieldAlert, Info
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { buildFilledDocxBlob } from '../utils/docxTemplate'
import SectionFillStep from '../components/itt/SectionFillStep'
import B1CategoryChooser from '../components/itt/B1CategoryChooser'
import { B1_CATEGORY_MAP } from '../components/itt/b1Categories'
import ErrorBoundary from '../components/ErrorBoundary'

// Fixed section order for the real ITT template fill-in wizard: 1 → A → D → B1 → B2 → C → E → F → H → J → K → L → G
const SECTION_FLOW = [
  { id: 'section1', title: 'Section 1 — Instructions to Tenderers', docxUrl: '/itt-templates/section-1-instructions.docx', exportFilename: 'Section 1 - Instructions.docx' },
  { id: 'sectionA', title: 'Section A — Form of Agreement', docxUrl: '/itt-templates/section-a-form-of-agreement.docx', exportFilename: 'Section A - Form of Agreement.docx' },
  { id: 'sectionD', title: 'Section D — Scope of Work', docxUrl: '/itt-templates/section-d-scope-of-work.docx', exportFilename: 'Section D - Scope of Work.docx' },
  { id: 'sectionB1', title: 'Section B1 — General Conditions of Contract', kind: 'b1-chooser' },
  { id: 'sectionB2', title: 'Section B2 — Special Conditions of Contract', docxUrl: '/itt-templates/section-b2-special-conditions.docx', exportFilename: 'Section B2 - Special Conditions.docx' },
  { id: 'sectionC', title: 'Section C — QHSSE Requirements', docxUrl: '/itt-templates/section-c-qhsse.docx', exportFilename: 'Section C - QHSSE Requirements.docx' },
  { id: 'sectionE', title: 'Section E — Schedule of Prices', docxUrl: '/itt-templates/section-e-schedule-of-prices.docx', exportFilename: 'Section E - Schedule of Prices.docx' },
  { id: 'sectionF', title: 'Section F — Execution Methodology', docxUrl: '/itt-templates/section-f-execution-methodology.docx', exportFilename: 'Section F - Execution Methodology.docx' },
  { id: 'sectionH', title: 'Section H — ICV Requirements', docxUrl: '/itt-templates/section-h-icv-requirements.docx', exportFilename: 'Section H - ICV Requirements.docx', attachmentUrl: '/itt-templates/section-h-appendix-tenderplan.xlsx', attachmentLabel: 'Appendix A — Tender Plan (reference)' },
  { id: 'sectionJ', title: 'Section J — JSRS Requirements', docxUrl: '/itt-templates/section-j-jsrs-requirements.docx', exportFilename: 'Section J - JSRS Requirements.docx' },
  { id: 'sectionK', title: 'Section K — OPAL Requirements', docxUrl: '/itt-templates/section-k-opal-requirements.docx', exportFilename: 'Section K - OPAL Requirements.docx' },
  { id: 'sectionL', title: 'Section L — Minimum Salaries', docxUrl: '/itt-templates/section-l-minimum-salaries.docx', exportFilename: 'Section L - Minimum Salaries.docx' },
  { id: 'sectionG', title: 'Section G — Administration Instructions', docxUrl: '/itt-templates/section-g-admin-instructions.docx', exportFilename: 'Section G - Administration Instructions.docx' },
]

function resolveFlow(b1Category) {
  return SECTION_FLOW.map(s => {
    if (s.kind !== 'b1-chooser') return s
    if (!b1Category) return s
    const cat = B1_CATEGORY_MAP[b1Category]
    return { id: s.id, title: s.title, docxUrl: cat.docxUrl, exportFilename: cat.exportFilename, isStandIn: cat.isStandIn, nearestTier: cat.nearestTier }
  })
}

// steps moved inside component to use t()

const generationTasks = [
  'Analysing project requirements',
  'Loading Section 1 — Instructions to Tenderers',
  'Loading Section A — Form of Agreement',
  'Loading Section D — Scope of Work',
  'Loading Sections B1 & B2 — General & Special Conditions of Contract',
  'Loading Section C — QHSSE Requirements',
  'Loading Sections E & F — Pricing & Methodology',
  'Loading Sections H, J, K, L — ICV, JSRS, OPAL & Salaries',
  'Loading Section G — Administration Instructions',
  'Preparing fill-in workspace',
]

const draftStatusMap = [
  { label: 'ITT Draft', sub: 'Filling in project details', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  { label: 'ITT Draft', sub: 'Preparing document templates...', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  { label: 'ITT Draft', sub: 'Filling in section templates', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'Ready to Export', sub: 'Export for external review', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
]

export default function ITTCreation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { tenders, addTender, advanceTender, updateTender } = useTenders()
  const { t } = useLanguage()
  const { user } = useAuth()
  const approverName = user?.name || 'Contract Engineer'
  const approverRole = user?.role?.label || 'Contract Engineer'
  const approverInitials = approverName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const steps = [t('itt.step1'), t('itt.step2'), t('itt.step3'), t('itt.step4')]

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null

  // Direct access to /create-itt (no tenderId) shouldn't jump straight into a
  // blank form — tenders sitting in "Draft — Pending Export" (including ones
  // just handed off from Pre-Qualification) need to be picked first.
  const [skipDraftPicker, setSkipDraftPicker] = useState(false)
  const draftTenders = useMemo(() => tenders.filter(t => t.status === 'draft'), [tenders])
  const showDraftPicker = !tenderId && !skipDraftPicker && draftTenders.length > 0

  // Detect if this tender was pre-populated from Contract Strategy
  const hasStrategyData = existingTender && (existingTender.budget || existingTender.description)

  const initialForm = existingTender
    ? { title: existingTender.title || '', department: existingTender.department || '', budget: existingTender.budget || '', deadline: existingTender.deadline || '', duration: existingTender.duration || '', description: existingTender.description || '', costCode: existingTender.costCode || '', currency: existingTender.currency || 'USD' }
    : { title: '', department: '', budget: '', deadline: '', duration: '', description: '', costCode: '', currency: 'USD' }

  // A tender handed off from Pre-Qualification has an id but has never been
  // through this wizard's generation step (no sectionAnswers yet) — it should
  // start at the same detail-entry step as a brand-new ITT, not jump to review.
  const alreadyGenerated = existingTender?.sectionAnswers != null
  const [step, setStep] = useState(alreadyGenerated ? 2 : 0)
  const [genStep, setGenStep] = useState(0)
  const [draftTenderId, setDraftTenderId] = useState(existingTender?.id || null)
  const [sectionAnswers, setSectionAnswers] = useState(existingTender?.sectionAnswers || {})
  const [b1Category, setB1Category] = useState(existingTender?.b1Category || null)
  const [currentSectionIndex, setCurrentSectionIndex] = useState(() => {
    if (!existingTender?.sectionAnswers) return 0
    const idx = SECTION_FLOW.findIndex(s => !existingTender.sectionAnswers[s.id])
    return idx === -1 ? SECTION_FLOW.length - 1 : idx
  })
  const [approvalNote, setApprovalNote] = useState('')
  const [ittApproved, setIttApproved] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [showErrors, setShowErrors] = useState(false)
  const draftSavedRef  = useRef(false)
  const fileInputRef   = useRef(null)

  const [descMode,     setDescMode]     = useState('type') // 'type' | 'upload'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragging,   setIsDragging]   = useState(false)

  const handleFileUpload = (file) => {
    if (!file) return
    setUploadedFile(file)
    if (file.type === 'text/plain') {
      const reader = new FileReader()
      reader.onload = e => setField('description', e.target.result)
      reader.readAsText(file)
    } else {
      setField('description', `[Extracted from: ${file.name} — AI will parse this document during generation]`)
    }
    setDescMode('upload')
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) handleFileUpload(file)
  }

  const requiredFields = ['title', 'department', 'budget', 'deadline', 'description']
  const isFormValid = requiredFields.every(f => form[f].trim() !== '')
  const fieldError = (key) => showErrors && form[key].trim() === ''

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const setBudget = (raw) => {
    const digits = raw.replace(/[^0-9]/g, '')
    if (!digits) { setField('budget', ''); return }
    const num = parseInt(digits, 10)
    const prefix = form.currency || 'USD'
    setField('budget', prefix + ' ' + num.toLocaleString('en-US'))
  }

  // Auto-tick generation tasks, then add draft tender + advance to Review
  useEffect(() => {
    if (step !== 1) return
    if (genStep >= generationTasks.length) {
      const t = setTimeout(() => {
        if (!draftSavedRef.current) {
          draftSavedRef.current = true
          if (draftTenderId) {
            // Tender already exists (e.g. handed off from Pre-Qualification) —
            // fill in the details CE just entered without touching bidderList/
            // bidders/aiScore that an earlier stage may have already set.
            updateTender(draftTenderId, {
              title: form.title,
              department: form.department,
              budget: form.budget,
              deadline: form.deadline,
              description: form.description,
              duration: form.duration,
              costCode: form.costCode,
              status: 'draft',
              stage: 'Draft — Pending Export',
              sectionAnswers: existingTender?.sectionAnswers || {},
              b1Category: existingTender?.b1Category ?? null,
            })
          } else {
            const maxNum = tenders.reduce((max, t) => Math.max(max, parseInt(t.id.split('-')[2]) || 0), 0)
            const newId = `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
            addTender({
              id: newId,
              title: form.title,
              department: form.department,
              budget: form.budget,
              deadline: form.deadline,
              description: form.description,
              duration: form.duration,
              costCode: form.costCode,
              status: 'draft',
              stage: 'Draft — Pending Export',
              created: new Date().toISOString().split('T')[0],
              bidders: 0,
              bidderList: [],
              aiScore: null,
              sectionAnswers: {},
              b1Category: null,
            })
            setDraftTenderId(newId)
          }
        }
        setStep(2)
      }, 400)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setGenStep(g => g + 1), 550)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, genStep])

  const handleGenerate = () => {
    if (!isFormValid) { setShowErrors(true); return }
    setGenStep(0)
    setStep(1)
  }
  const prefillMap = useMemo(() => {
    const map = {}
    if (form.title) map['contract title'] = form.title
    if (draftTenderId) map['contract no'] = draftTenderId
    if (draftTenderId && form.title) map['contract number & title'] = `${draftTenderId} — ${form.title}`
    else if (form.title) map['contract number & title'] = form.title
    // Section B2's only fillable field is the template's own authoring note —
    // default it to "NOT USED" (per Section A's own instruction for an
    // inapplicable section), editable if the CE wants to specify real deviations.
    map['(ai to identify and draft clauses where deviate from b 1 clauses)'] =
      'NOT USED — Section B1 General Conditions of Contract apply without modification.'
    return map
  }, [form.title, draftTenderId])

  const effectiveFlow = useMemo(() => resolveFlow(b1Category), [b1Category])
  const currentFlowItem = effectiveFlow[currentSectionIndex]
  const isFirstSection = currentSectionIndex === 0
  const isLastSection = currentSectionIndex === effectiveFlow.length - 1

  const handleAnswersChange = (sectionId, answers) => {
    setSectionAnswers(prev => ({ ...prev, [sectionId]: answers }))
  }

  // Persist section answers to the tender record as a side effect (not inside the
  // setSectionAnswers updater, which React may invoke outside of a normal commit).
  useEffect(() => {
    if (draftTenderId) updateTender(draftTenderId, { sectionAnswers })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionAnswers, draftTenderId])

  const handleB1Select = (categoryId) => {
    setB1Category(categoryId)
    if (draftTenderId) updateTender(draftTenderId, { b1Category: categoryId })
  }

  const goToNextSection = () => {
    if (isLastSection) {
      // Check if all sections are completed before going to export
      const allCompleted = effectiveFlow.every(section => {
        if (section.id === 'sectionB1') {
          return b1Category !== null // B1 requires category selection
        }
        return sectionAnswers[section.id] && Object.keys(sectionAnswers[section.id]).length > 0
      })
      if (!allCompleted) {
        alert('Please complete all sections before proceeding to export')
        return
      }
      setStep(3)
      return
    }
    setCurrentSectionIndex(i => i + 1)
  }
  const goToPrevSection = () => {
    if (isFirstSection) return
    setCurrentSectionIndex(i => i - 1)
  }

  const [downloadingZip, setDownloadingZip] = useState(false)
  const [zipError, setZipError] = useState(null)

  const handleDownloadIttPackage = async () => {
    setDownloadingZip(true)
    setZipError(null)
    try {
      const zip = new JSZip()
      for (const section of effectiveFlow) {
        const answers = sectionAnswers[section.id] || []
        const blob = await buildFilledDocxBlob(section.docxUrl, answers)
        zip.file(section.exportFilename, blob)
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(zipBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${draftTenderId || 'ITT'}-Package.zip`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setZipError(err.message || 'Failed to build the ITT package. Please try again.')
    } finally {
      setDownloadingZip(false)
    }
  }

  // Handoff documents from Pre-Qualification are real File objects when
  // uploaded through the app (in-memory, no backend) — download them as-is.
  // Seed/mock tenders only carry a filename string, so a placeholder is
  // generated on download since the original bytes were never captured.
  const handleDownloadHandoffDoc = (value, label) => {
    const isRealFile = value instanceof Blob
    const fileName = isRealFile ? value.name : value
    const blob = isRealFile
      ? value
      : new Blob([`Mock document: ${label}\nFile name: ${fileName}\n\nPlaceholder content — original file was not retained in this demo environment.`], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName || label
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const currentDraftStatus = ittApproved
    ? { label: 'ITT Exported', sub: 'Exported — awaiting bid upload', cls: 'bg-green-100 text-green-700 border-green-200' }
    : draftStatusMap[step] || draftStatusMap[0]

  if (showDraftPicker) {
    return (
      <div className="space-y-5">
        <div className="olng-slide-up">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1b4c6f' }}>
            <Inbox size={20} style={{ color: '#0089cf' }} />
            Create ITT
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a tender in <strong>Draft — Pending Export</strong> to continue its ITT, or start a brand-new one from scratch.
          </p>
        </div>

        <div className="space-y-3 olng-slide-up" style={{ animationDelay: '60ms' }}>
          {draftTenders.map(dt => (
            <Card
              key={dt.id}
              branded
              className="p-4 cursor-pointer transition-shadow hover:shadow-md"
              onClick={() => navigate(`/create-itt/${dt.id}`)}
            >
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                    <Briefcase size={16} style={{ color: '#0089cf' }} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>{dt.id}</span>
                      <Badge variant="draft">{dt.stage || 'Draft — Pending Export'}</Badge>
                      {dt.bidderList?.length > 0 && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', color: '#059669' }}>
                          From Pre-Qualification · {dt.bidderList.length} qualified
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold mt-1 truncate" style={{ color: '#1b4c6f' }}>{dt.title || 'Untitled tender'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {dt.department || 'No department set'}{dt.deadline ? ` · Deadline ${dt.deadline}` : ''}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0" style={{ color: '#94a3b8' }} />
              </div>
            </Card>
          ))}
        </div>

        <Button
          variant="secondary"
          onClick={() => setSkipDraftPicker(true)}
          className="w-full justify-center py-3"
        >
          <Plus size={14} /> Start New ITT (No Pre-Qualification)
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* ── Branded Status Banner ── */}
      <div className="flex items-center justify-between olng-slide-up">
        <div className="olng-status-banner">
          <span className="status-dot" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>{currentDraftStatus.label}</span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">{currentDraftStatus.sub}</span>
          </div>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded-lg font-medium" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf', border: '1px solid rgba(0,137,207,0.15)' }}>
          {draftTenderId || 'New Draft'}
        </span>
      </div>

      {/* ── Premium Step Indicator ── */}
      <div className="flex items-center gap-0 olng-slide-up" style={{ animationDelay: '60ms' }}>
        {steps.map((s, i) => (
          <div key={i} className="flex items-center" style={{ flex: i < steps.length - 1 ? 1 : 'none' }}>
            <div className="flex items-center gap-2.5 shrink-0">
              <div className={`olng-step-circle ${
                i < step ? 'olng-step-circle--done' :
                i === step ? 'olng-step-circle--active' :
                'olng-step-circle--pending'
              }`}>
                {i < step ? <CheckCircle size={15} /> : i + 1}
              </div>
              <span className={`text-sm whitespace-nowrap ${
                i === step ? 'font-semibold' : i < step ? 'font-medium' : ''
              }`} style={{
                color: i === step ? '#1b4c6f' : i < step ? '#0089cf' : '#94a3b8'
              }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`olng-step-connector mx-3 ${i < step ? 'olng-step-connector--done' : ''}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 0: Project Details ── */}
      {step === 0 && (
        <div className="space-y-4 olng-slide-up" style={{ animationDelay: '120ms' }}>
          {/* Pre-fill Banner — shown when data comes from Contract Strategy */}
          {hasStrategyData && (
            <div className="flex items-start gap-2.5 rounded-xl px-4 py-3" style={{
              background: 'linear-gradient(135deg, rgba(0,137,207,0.06), rgba(16,185,129,0.04))',
              border: '1px solid rgba(0,137,207,0.15)',
              borderLeft: '3px solid #0089cf'
            }}>
              <Info size={16} style={{ color: '#0089cf' }} className="mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-semibold" style={{ color: '#1b4c6f' }}>{t('strategy.prefillBanner')}</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Fields below are populated from the Contract Strategy stage. You can modify them before generating.</p>
              </div>
            </div>
          )}

          <Card branded className="p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2.5" style={{ color: '#1b4c6f', fontSize: '15px' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                <FileText size={16} style={{ color: '#0089cf' }} />
              </div>
              Project Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { key: 'title',      label: t('itt.fieldTitle'),    placeholder: 'e.g. Enterprise Cloud Infrastructure Upgrade', span: 2, required: true },
                { key: 'department', label: t('itt.fieldDept'),     placeholder: 'e.g. IT Department', required: true },
                { key: 'budget',     label: t('itt.fieldBudget'),   placeholder: 'e.g. 500000', required: true, onChangeFn: setBudget },
                { key: 'deadline',   label: t('itt.fieldDeadline'), type: 'date', required: true },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                    {f.label}
                    {f.required && <span style={{ color: '#0089cf' }}>*</span>}
                  </label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => f.onChangeFn ? f.onChangeFn(e.target.value) : setField(f.key, e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${fieldError(f.key) ? 'olng-input--error' : ''}`}
                  />
                  {fieldError(f.key) && (
                    <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />{f.label} is required</p>
                  )}
                </div>
              ))}

              {/* Contract Duration — years + months duration picker */}
              {(() => {
                const yearOpts  = Array.from({ length: 11 }, (_, i) => i)   // 0–10 years
                const monthOpts = Array.from({ length: 12 }, (_, i) => i)   // 0–11 months
                const match     = (form.duration || '').match(/^(\d+)\s+year[s]?\s+(\d+)\s+month[s]?$/)
                const selYears  = match ? match[1] : ''
                const selMonths = match ? match[2] : ''
                const setDuration = (y, m) => {
                  if (y === '' && m === '') { setField('duration', ''); return }
                  const yv = y !== '' ? y : '0'
                  const mv = m !== '' ? m : '0'
                  setField('duration', `${yv} year${yv === '1' ? '' : 's'} ${mv} month${mv === '1' ? '' : 's'}`)
                }
                return (
                  <div>
                    <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                      <Clock size={12} style={{ color: '#0089cf' }} />
                      {t('itt.fieldDuration')}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selYears}
                        onChange={e => setDuration(e.target.value, selMonths)}
                        className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input">
                        <option value="">Years</option>
                        {yearOpts.map(y => <option key={y} value={y}>{y} year{y === 1 ? '' : 's'}</option>)}
                      </select>
                      <select
                        value={selMonths}
                        onChange={e => setDuration(selYears, e.target.value)}
                        className="flex-1 px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input">
                        <option value="">Months</option>
                        {monthOpts.map(m => <option key={m} value={m}>{m} month{m === 1 ? '' : 's'}</option>)}
                      </select>
                    </div>
                  </div>
                )
              })()}

              {/* Cost Code */}
              <div>
                <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                  <Hash size={12} style={{ color: '#0089cf' }} />
                  {t('strategy.fieldCostCode')}
                </label>
                <input
                  value={form.costCode}
                  onChange={e => setField('costCode', e.target.value)}
                  placeholder="e.g. CC-2025-001"
                  className="w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input"
                />
              </div>


              <div className="col-span-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                    Project Description / Key Requirements
                    <span style={{ color: '#0089cf' }}>*</span>
                  </label>
                  {/* Mode toggle */}
                  <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(0,137,207,0.06)', border: '1px solid rgba(0,137,207,0.1)' }}>
                    {[{ id: 'type', icon: FileText, label: 'Type' }, { id: 'upload', icon: UploadCloud, label: 'Upload File' }].map(m => (
                      <button key={m.id} type="button" onClick={() => setDescMode(m.id)}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                        style={descMode === m.id
                          ? { background: '#fff', color: '#1b4c6f', boxShadow: '0 1px 3px rgba(27,76,111,0.1)' }
                          : { color: '#94a3b8' }
                        }>
                        <m.icon size={11} /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* ── Type mode: plain textarea ── */}
                {descMode === 'type' && (
                  <textarea
                    rows={4}
                    placeholder="Describe the project scope, objectives, and key requirements..."
                    value={form.description}
                    onChange={e => setField('description', e.target.value)}
                    className={`w-full px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-all olng-input ${fieldError('description') ? 'olng-input--error' : ''}`}
                  />
                )}

                {/* ── Upload mode ── */}
                {descMode === 'upload' && (
                  <div className="space-y-2">
                    {/* Drop zone (hidden once file attached) */}
                    {!uploadedFile && (
                      <div
                        onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`olng-dropzone w-full cursor-pointer flex flex-col items-center justify-center gap-3 py-8 transition-all
                          ${isDragging ? 'olng-dropzone--active' : ''}
                          ${fieldError('description') ? 'olng-input--error' : ''}`}>
                        <div className="w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                          style={{ background: isDragging ? 'rgba(0,137,207,0.1)' : 'rgba(0,137,207,0.06)' }}>
                          <UploadCloud size={22} style={{ color: isDragging ? '#0089cf' : '#94a3b8' }} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium" style={{ color: '#1b4c6f' }}>
                            Drag & drop or <span style={{ color: '#0089cf' }} className="underline underline-offset-2 cursor-pointer">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-1">.pdf · .docx · .txt · .doc</p>
                        </div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.docx,.txt,.doc,.rtf"
                          className="hidden"
                          onChange={e => handleFileUpload(e.target.files?.[0])}
                        />
                      </div>
                    )}

                    {/* File attached chip + extracted textarea */}
                    {uploadedFile && (
                      <>
                        <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{
                          background: 'rgba(0,137,207,0.05)',
                          border: '1px solid rgba(0,137,207,0.15)',
                          borderLeft: '3px solid #0089cf'
                        }}>
                          <Paperclip size={13} style={{ color: '#0089cf' }} className="shrink-0" />
                          <span className="text-xs font-medium flex-1 truncate" style={{ color: '#1b4c6f' }}>{uploadedFile.name}</span>
                          <span className="text-[10px] text-slate-400">{(uploadedFile.size / 1024).toFixed(0)} KB</span>
                          <button type="button"
                            onClick={() => { setUploadedFile(null); setField('description', '') }}
                            className="p-0.5 rounded hover:bg-red-100 text-slate-400 hover:text-red-500 transition-colors">
                            <X size={12} />
                          </button>
                        </div>
                        <textarea
                          rows={4}
                          placeholder="Extracted content will appear here — you can edit before generating…"
                          value={form.description}
                          onChange={e => setField('description', e.target.value)}
                          className={`w-full px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-all olng-input ${fieldError('description') ? 'olng-input--error' : ''}`}
                        />
                      </>
                    )}
                  </div>
                )}

                {fieldError('description') && (
                  <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1"><AlertCircle size={10} />Project description is required</p>
                )}
              </div>
            </div>
          </Card>

          {/* Pre-Qualification Handoff Section — if this tender came from pre-qual */}
          {existingTender?.bidderList && existingTender?.bidderList.length > 0 && (
            <Card branded accent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2.5" style={{ color: '#1b4c6f', fontSize: '15px' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                  <User size={16} style={{ color: '#0089cf' }} />
                </div>
                Qualified Bidders — From Pre-Qualification
              </h3>
              <div className="space-y-2">
                {existingTender.bidderList.map((bidder, idx) => (
                  <div key={bidder.id} className="flex items-center gap-3 p-3 rounded-lg" style={{ background: 'rgba(0,137,207,0.04)', border: '1px solid rgba(0,137,207,0.1)' }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#0089cf', color: '#fff' }}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium" style={{ color: '#1b4c6f' }}>{bidder.name}</p>
                      <p className="text-xs text-slate-400">{bidder.country}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded" style={{ background: '#10b98130', color: '#059669' }}>
                      ✓ Passed Pre-Qual
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Handoff Documents Section — if pre-qual documents exist */}
          {existingTender?.handoffDocuments && Object.keys(existingTender.handoffDocuments).length > 0 && (
            <Card branded accent className="p-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2.5" style={{ color: '#1b4c6f', fontSize: '15px' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                  <Paperclip size={16} style={{ color: '#0089cf' }} />
                </div>
                Internal Reference Documents
              </h3>
              <div className="space-y-2 text-sm">
                {Object.entries(existingTender.handoffDocuments).map(([key, value]) => {
                  const docLabel = {
                    benchmarking: 'OEM Benchmarking Rates',
                    companyEstimate: 'Company Estimate',
                    riskAssessment: 'Contract Risk Assessment'
                  }[key] || key
                  const fileName = value instanceof Blob ? value.name : value
                  return (
                    <div key={key} className="flex items-center gap-2.5 p-2.5 rounded-lg" style={{ background: 'rgba(0,137,207,0.04)', border: '1px solid rgba(0,137,207,0.1)' }}>
                      <FileText size={13} style={{ color: '#0089cf' }} className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium" style={{ color: '#1b4c6f' }}>{docLabel}</span>
                        <span className="ml-1.5 text-xs truncate" style={{ color: '#94a3b8' }}>— {fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDownloadHandoffDoc(value, docLabel)}
                        className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-md transition-colors hover:bg-white shrink-0"
                        style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}>
                        <Download size={11} /> Download
                      </button>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          <Button
            variant="brand"
            onClick={handleGenerate}
            className="w-full justify-center py-3.5 text-[15px]"
            disabled={showErrors && !isFormValid}
          >
            <Sparkles size={16} />
            Generate with AI
          </Button>

          {showErrors && !isFormValid && (
            <p className="text-[11px] text-red-500 text-center flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Please fill in all required fields marked with *
            </p>
          )}

          {!showErrors && (
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              AI will generate the ITT from your project details. Choose a template after generation.
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Fill In ITT Sections ── */}
      {step === 2 && (
        <div className="space-y-4 olng-slide-up">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: '#1b4c6f' }}>Review & Redesign Sections</h3>
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
              {effectiveFlow.filter(s =>
                s.id === 'sectionB1'
                  ? b1Category !== null
                  : sectionAnswers[s.id] && Object.keys(sectionAnswers[s.id]).length > 0
              ).length} of {effectiveFlow.length} completed
            </span>
          </div>

          {/* Section dropdown selector */}
          <Card branded className="p-4">
            <label className="text-xs font-semibold mb-2 block" style={{ color: '#1b4c6f' }}>Select Section to Edit</label>
            <select
              value={currentSectionIndex}
              onChange={(e) => {
                const idx = parseInt(e.target.value)
                setCurrentSectionIndex(idx)
              }}
              className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
              style={{
                borderColor: 'rgba(0,137,207,0.2)',
                backgroundColor: '#fff',
                color: '#1b4c6f',
                focusRing: '#0089cf'
              }}
            >
              {effectiveFlow.map((item, idx) => {
                const isCompleted = item.id === 'sectionB1'
                  ? b1Category !== null
                  : sectionAnswers[item.id] && Object.keys(sectionAnswers[item.id]).length > 0
                return (
                  <option key={item.id} value={idx}>
                    {item.title} {isCompleted ? '✓' : ''}
                  </option>
                )
              })}
            </select>

            {/* Dependency info messages */}
            {currentFlowItem.id === 'sectionB1' && !sectionAnswers.sectionD && (
              <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#1e40af' }}>
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>Tip: Complete <strong>Section D — Scope of Work</strong> first for better context when editing B1</span>
              </div>
            )}

            {currentFlowItem.id === 'sectionB2' && (!sectionAnswers.sectionD || !b1Category) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs" style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', color: '#1e40af' }}>
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>Tip: Complete <strong>Section D — Scope of Work</strong> and select <strong>Section B1 category</strong> first for context</span>
              </div>
            )}
          </Card>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{
                background: 'linear-gradient(135deg, rgba(0,137,207,0.1), rgba(27,76,111,0.06))',
                color: '#1b4c6f',
                border: '1px solid rgba(0,137,207,0.15)'
              }}>
                <Layers size={12} style={{ color: '#0089cf' }} />
                {currentFlowItem.title}
              </div>
              <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Section {currentSectionIndex + 1} of {effectiveFlow.length}</span>
            </div>
            <div className="olng-progress-bar w-40 h-2">
              <div
                className="olng-progress-fill"
                style={{ width: `${Math.round(((currentSectionIndex + 1) / effectiveFlow.length) * 100)}%` }}
              />
            </div>
          </div>

          <ErrorBoundary>
            {currentFlowItem && currentFlowItem.kind === 'b1-chooser' ? (
              <B1CategoryChooser
                selected={b1Category}
                onConfirm={handleB1Select}
                onBack={goToPrevSection}
              />
            ) : currentFlowItem ? (
              <SectionFillStep
                section={currentFlowItem}
                answers={sectionAnswers[currentFlowItem.id]}
                prefill={prefillMap}
                onAnswersChange={handleAnswersChange}
                onNext={goToNextSection}
                onBack={goToPrevSection}
                isFirst={isFirstSection}
                isLast={isLastSection}
                standInNotice={currentFlowItem.isStandIn && (
                  <div className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs olng-info-alert" style={{ borderLeft: '3px solid #e69c00' }}>
                    <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: '#e69c00' }} />
                    <span>Dedicated template not yet available for this category — showing the nearest {currentFlowItem.nearestTier} template as a stand-in.</span>
                  </div>
                )}
              />
            ) : (
              <div className="p-6 bg-red-50 border border-red-200 rounded-lg text-center text-red-600">
                <p className="text-sm font-semibold">Section not found</p>
                <p className="text-xs mt-1">Please select a valid section from the dropdown</p>
              </div>
            )}
          </ErrorBoundary>
        </div>
      )}

      {/* ── Step 1: AI Generation ── */}
      {step === 1 && (
        <Card branded className="p-12 olng-scale-in">
          <div className="olng-dot-pattern absolute inset-0 opacity-40 pointer-events-none rounded-2xl" style={{ position: 'absolute' }} />
          <div className="relative z-10">
            <div className="text-center mb-10">
              <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 olng-float" style={{
                background: 'linear-gradient(135deg, rgba(0,137,207,0.15), rgba(27,76,111,0.1))',
                boxShadow: '0 8px 32px rgba(0,137,207,0.15)'
              }}>
                <Bot size={36} style={{ color: '#0089cf' }} />
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: '#1b4c6f' }}>AI is Generating Your ITT</h3>
              <p className="text-sm text-slate-400">Building your document based on project requirements and compliance standards</p>
            </div>

            <div className="max-w-sm mx-auto space-y-3 mb-10">
              {generationTasks.map((task, i) => (
                <div key={i} className="flex items-center gap-3 olng-slide-up olng-stagger" style={{ '--i': i }}>
                  <div className={`olng-gen-dot shrink-0 ${
                    i < genStep ? 'olng-gen-dot--done' :
                    i === genStep ? 'olng-gen-dot--active' :
                    'olng-gen-dot--pending'
                  }`}>
                    {i < genStep
                      ? <CheckCircle size={14} className="text-white" />
                      : i === genStep
                      ? <RefreshCw size={13} className="text-white animate-spin" />
                      : <Circle size={12} style={{ color: '#cce6f8' }} />}
                  </div>
                  <span className={`text-sm transition-colors ${
                    i < genStep ? 'text-slate-400 line-through' :
                    i === genStep ? 'font-semibold' : 'text-slate-300'
                  }`} style={i === genStep ? { color: '#1b4c6f' } : {}}>{task}</span>
                </div>
              ))}
            </div>

            <div className="max-w-sm mx-auto">
              <div className="olng-progress-bar h-2">
                <div
                  className="olng-progress-fill"
                  style={{ width: `${Math.round((genStep / generationTasks.length) * 100)}%` }}
                />
              </div>
              <p className="text-center text-xs mt-2.5 font-medium" style={{ color: '#0089cf' }}>
                {Math.round((genStep / generationTasks.length) * 100)}% complete
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ── Step 3: Export ITT ── */}
      {step === 3 && !ittApproved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 olng-slide-up">
          {/* Export status */}
          <Card branded className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="olng-export-icon">
                <Download size={20} />
              </div>
              <div>
                <h3 className="font-semibold" style={{ color: '#1b4c6f' }}>Ready to Export</h3>
                <p className="text-xs text-slate-400 mt-0.5">{draftTenderId} ready for external review</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Prepared By', value: approverName, sub: approverRole, icon: User },
                { label: 'Prepared On', value: new Date().toISOString().split('T')[0], sub: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' local time', icon: Clock },
                { label: 'Sections Completed', value: `${effectiveFlow.length} of ${effectiveFlow.length}`, sub: 'All sections filled in', icon: Layers },
              ].map(item => (
                <div key={item.label} className="rounded-xl px-4 py-3 flex items-start gap-3" style={{
                  background: 'linear-gradient(135deg, rgba(236,244,252,0.6), rgba(0,137,207,0.04))',
                  border: '1px solid rgba(0,137,207,0.08)'
                }}>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(0,137,207,0.08)' }}>
                    <item.icon size={14} style={{ color: '#0089cf' }} />
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5 font-semibold" style={{ color: '#94a3b8' }}>{item.label}</p>
                    <p className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>{item.value}</p>
                    {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2.5 olng-info-alert px-3.5 py-3 text-xs">
              <AlertCircle size={14} className="mt-0.5 shrink-0" style={{ color: '#0089cf' }} />
              <span>Export the ITT document for external review, then upload the finalised version to proceed.</span>
            </div>
          </Card>

          {/* Export panel */}
          <Card branded className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shrink-0" style={{
                background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))',
                color: '#0089cf'
              }}>
                {approverInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>{approverName}</p>
                <p className="text-xs text-slate-400">{approverRole}</p>
              </div>
              <Badge variant="info">Exporter</Badge>
            </div>

            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: '#0089cf' }}>ITT Summary</p>
            <div className="mb-4 space-y-0">
              {[
                { label: 'Tender ID', value: draftTenderId || '—' },
                { label: 'Project', value: form.title },
                { label: 'Budget', value: form.budget },
                { label: 'Department', value: form.department },
                { label: 'Sections', value: `${effectiveFlow.length} sections · all completed` },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-2 text-xs" style={{ borderBottom: '1px solid rgba(0,137,207,0.08)' }}>
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-semibold" style={{ color: '#1b4c6f' }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-semibold mb-2 block" style={{ color: '#1b4c6f' }}>Export Notes (Optional)</label>
              <textarea
                value={approvalNote}
                onChange={e => setApprovalNote(e.target.value)}
                rows={3}
                placeholder="Add notes for the external reviewer..."
                className="w-full px-3.5 py-2.5 text-sm focus:outline-none resize-none transition-all olng-input"
              />
            </div>

            {zipError && (
              <div className="mb-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-600">
                <AlertCircle size={13} className="mt-0.5 shrink-0" />
                {zipError}
              </div>
            )}

            <div className="flex gap-2 mb-2">
              <Button
                variant="secondary"
                className="flex-1 justify-center"
                disabled={downloadingZip}
                onClick={handleDownloadIttPackage}
              >
                {downloadingZip ? <RefreshCw size={15} className="animate-spin" /> : <PackageCheck size={15} />}
                {downloadingZip ? 'Building Package…' : 'Download ITT Package (.zip)'}
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="secondary" className="flex-1 justify-center" onClick={() => { setCurrentSectionIndex(effectiveFlow.length - 1); setStep(2) }}>
                Back to Sections
              </Button>
              <Button variant="brand" className="flex-1 justify-center" onClick={() => {
                if (draftTenderId) advanceTender(draftTenderId)
                setIttApproved(true)
              }}>
                <Download size={15} /> Export ITT
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── ITT Exported & Created ── */}
      {step === 3 && ittApproved && (
        <Card branded className="p-12 text-center olng-scale-in">
          <div className="olng-success-ring mx-auto mb-5">
            <CheckCircle size={32} style={{ color: '#0089cf' }} />
          </div>
          <Badge variant="success" className="mb-3">ITT Exported</Badge>
          <h2 className="text-xl font-bold mb-1" style={{ color: '#1b4c6f' }}>ITT Exported & Created</h2>
          <p className="text-sm mb-1" style={{ color: '#64748b' }}>Exported by {approverName} · {approverRole}</p>
          <p className="text-xs mb-6" style={{ color: '#94a3b8' }}>{draftTenderId} — {form.title} is exported for external review. Upload the finalised version when ready.</p>
          {zipError && (
            <div className="max-w-md mx-auto mb-4 flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-xs text-red-600 text-left">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              {zipError}
            </div>
          )}
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Button variant="secondary" disabled={downloadingZip} onClick={handleDownloadIttPackage}>
              {downloadingZip ? <RefreshCw size={15} className="animate-spin" /> : <PackageCheck size={15} />}
              {downloadingZip ? 'Building Package…' : 'Download ITT Package (.zip)'}
            </Button>
            <Button variant="brand" onClick={() => navigate('/tenders')}>
              <FileText size={15} /> View in Tender List
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
