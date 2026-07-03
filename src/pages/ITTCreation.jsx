import { useState, useEffect, useRef, useMemo } from 'react'
import JSZip from 'jszip'
import {
  Bot, Sparkles, CheckCircle, RefreshCw, ChevronRight,
  FileText, AlertCircle, Circle, Download,
  UploadCloud, X, Paperclip, PackageCheck
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { exportTenderPDF } from '../utils/exportPDF'
import { buildFilledDocxBlob } from '../utils/docxTemplate'
import SectionFillStep from '../components/itt/SectionFillStep'
import B1CategoryChooser from '../components/itt/B1CategoryChooser'
import { B1_CATEGORY_MAP } from '../components/itt/b1Categories'

// Fixed section order for the real ITT template fill-in wizard: 1 → D → B1 → C → E → F → H → J → K → L → G
// (Section A is excluded — handled separately by the future Contract Draft feature.)
const SECTION_FLOW = [
  { id: 'section1', title: 'Section 1 — Instructions to Tenderers', docxUrl: '/itt-templates/section-1-instructions.docx', exportFilename: 'Section 1 - Instructions.docx' },
  { id: 'sectionD', title: 'Section D — Scope of Work', docxUrl: '/itt-templates/section-d-scope-of-work.docx', exportFilename: 'Section D - Scope of Work.docx' },
  { id: 'sectionB1', title: 'Section B1 — General Conditions of Contract', kind: 'b1-chooser' },
  { id: 'sectionC', title: 'Section C — QHSSE Requirements', docxUrl: '/itt-templates/section-c-qhsse.docx', exportFilename: 'Section C - QHSSE Requirements.docx' },
  { id: 'sectionE', title: 'Section E — Schedule of Prices', docxUrl: '/itt-templates/section-e-schedule-of-prices.docx', exportFilename: 'Section E - Schedule of Prices.docx' },
  { id: 'sectionF', title: 'Section F — Execution Methodology', docxUrl: '/itt-templates/section-f-execution-methodology.docx', exportFilename: 'Section F - Execution Methodology.docx' },
  { id: 'sectionH', title: 'Section H — ICV Requirements', docxUrl: '/itt-templates/section-h-icv-requirements.docx', exportFilename: 'Section H - ICV Requirements.docx' },
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
  'Loading Section D — Scope of Work',
  'Loading Section B1 — General Conditions of Contract',
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
  const initialForm = existingTender
    ? { title: existingTender.title, department: existingTender.department, budget: existingTender.budget, deadline: existingTender.deadline, duration: existingTender.duration || '', description: existingTender.description || '' }
    : { title: '', department: '', budget: '', deadline: '', duration: '', description: '' }

  const [step, setStep] = useState(existingTender ? 2 : 0)
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
    setField('budget', 'OMR ' + num.toLocaleString('en-US'))
  }

  // Auto-tick generation tasks, then add draft tender + advance to Review
  useEffect(() => {
    if (step !== 1) return
    if (genStep >= generationTasks.length) {
      const t = setTimeout(() => {
        if (!draftSavedRef.current) {
          draftSavedRef.current = true
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
    if (isLastSection) { setStep(3); return }
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

  const currentDraftStatus = ittApproved
    ? { label: 'ITT Exported', sub: 'Exported — awaiting bid upload', cls: 'bg-green-100 text-green-700 border-green-200' }
    : draftStatusMap[step] || draftStatusMap[0]

  return (
    <div className="space-y-5">
      {/* Draft status banner */}
      <div className="flex items-center justify-between">
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border ${currentDraftStatus.cls}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
          <span>{currentDraftStatus.label}</span>
          <span className="opacity-40">·</span>
          <span className="opacity-70">{currentDraftStatus.sub}</span>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded">{draftTenderId || 'New Draft'}</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 flex-wrap gap-y-2">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                ${i < step ? 'bg-green-500 border-green-500 text-white' :
                  i === step ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white' :
                  'bg-white border-slate-200 text-slate-400'}`}>
                {i < step ? <CheckCircle size={14} /> : i + 1}
              </div>
              <span className={`text-sm ${i === step ? 'text-slate-800 font-medium' : 'text-slate-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && <ChevronRight size={16} className="mx-3 text-slate-300" />}
          </div>
        ))}
      </div>

      {/* ── Step 0: Project Details ── */}
      {step === 0 && (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <FileText size={16} className="text-[var(--color-primary)]" />
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
                  <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                    {f.label}
                    {f.required && <span className="text-red-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={f.type || 'text'}
                    placeholder={f.placeholder}
                    value={form[f.key]}
                    onChange={e => f.onChangeFn ? f.onChangeFn(e.target.value) : setField(f.key, e.target.value)}
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 transition-colors
                      ${fieldError(f.key)
                        ? 'border-red-400 focus:ring-red-300 bg-red-50'
                        : 'border-slate-200 focus:ring-[var(--color-primary)]/30'}`}
                  />
                  {fieldError(f.key) && (
                    <p className="text-[11px] text-red-500 mt-1">{f.label} is required</p>
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
                    <label className="text-xs font-medium text-slate-600 mb-1.5 block">
                      {t('itt.fieldDuration')}
                    </label>
                    <div className="flex gap-2">
                      <select
                        value={selYears}
                        onChange={e => setDuration(e.target.value, selMonths)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
                        <option value="">Years</option>
                        {yearOpts.map(y => <option key={y} value={y}>{y} year{y === 1 ? '' : 's'}</option>)}
                      </select>
                      <select
                        value={selMonths}
                        onChange={e => setDuration(selYears, e.target.value)}
                        className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30">
                        <option value="">Months</option>
                        {monthOpts.map(m => <option key={m} value={m}>{m} month{m === 1 ? '' : 's'}</option>)}
                      </select>
                    </div>
                  </div>
                )
              })()}
              <div className="col-span-2">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-slate-600">
                    Project Description / Key Requirements
                    <span className="text-red-500 ml-0.5">*</span>
                  </label>
                  {/* Mode toggle */}
                  <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
                    {[{ id: 'type', icon: FileText, label: 'Type' }, { id: 'upload', icon: UploadCloud, label: 'Upload File' }].map(m => (
                      <button key={m.id} type="button" onClick={() => setDescMode(m.id)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all
                          ${descMode === m.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
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
                    className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 resize-none transition-colors
                      ${fieldError('description')
                        ? 'border-red-400 focus:ring-red-300 bg-red-50'
                        : 'border-slate-200 focus:ring-[var(--color-primary)]/30'}`}
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
                        className={`w-full rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-2 py-7 transition-all
                          ${isDragging
                            ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                            : fieldError('description')
                            ? 'border-red-300 bg-red-50'
                            : 'border-slate-200 hover:border-[var(--color-primary)]/50 hover:bg-slate-50'}`}>
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors
                          ${isDragging ? 'bg-[var(--color-primary)]/10' : 'bg-slate-100'}`}>
                          <UploadCloud size={20} className={isDragging ? 'text-[var(--color-primary)]' : 'text-slate-400'} />
                        </div>
                        <div className="text-center">
                          <p className="text-xs font-medium text-slate-600">
                            Drag & drop or <span className="text-[var(--color-primary)] underline underline-offset-2">browse</span>
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">.pdf · .docx · .txt · .doc</p>
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
                        <div className="flex items-center gap-2 bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/20 rounded-lg px-3 py-2">
                          <Paperclip size={13} className="text-[var(--color-primary)] shrink-0" />
                          <span className="text-xs font-medium text-slate-700 flex-1 truncate">{uploadedFile.name}</span>
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
                          className={`w-full px-3 py-2 text-sm rounded-lg border bg-white focus:outline-none focus:ring-2 resize-none transition-colors
                            ${fieldError('description')
                              ? 'border-red-400 focus:ring-red-300 bg-red-50'
                              : 'border-slate-200 focus:ring-[var(--color-primary)]/30'}`}
                        />
                      </>
                    )}
                  </div>
                )}

                {fieldError('description') && (
                  <p className="text-[11px] text-red-500 mt-1">Project description is required</p>
                )}
              </div>
            </div>
          </Card>

          <Button
            onClick={handleGenerate}
            className="w-full justify-center py-3"
            disabled={showErrors && !isFormValid}
          >
            <Sparkles size={15} />
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
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="ai"><FileText size={10} /> {currentFlowItem.title}</Badge>
              <span className="text-xs text-slate-500">Section {currentSectionIndex + 1} of {effectiveFlow.length}</span>
            </div>
            <div className="w-40 h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500"
                style={{ width: `${Math.round(((currentSectionIndex + 1) / effectiveFlow.length) * 100)}%` }}
              />
            </div>
          </div>

          {currentFlowItem.kind === 'b1-chooser' ? (
            <B1CategoryChooser
              selected={b1Category}
              onConfirm={handleB1Select}
              onBack={goToPrevSection}
            />
          ) : (
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
                <div className="mb-4 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 text-xs text-amber-700">
                  <AlertCircle size={13} className="mt-0.5 shrink-0" />
                  Dedicated template not yet available for this category — showing the nearest {currentFlowItem.nearestTier} template as a stand-in.
                </div>
              )}
            />
          )}
        </div>
      )}

      {/* ── Step 1: AI Generation ── */}
      {step === 1 && (
        <Card className="p-12">
          <div className="text-center mb-10">
            <div className="w-20 h-20 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-4">
              <Bot size={36} className="text-violet-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">AI is Generating Your ITT</h3>
            <p className="text-sm text-slate-400">Building your document based on project requirements and compliance standards</p>
          </div>

          <div className="max-w-xs mx-auto space-y-3 mb-10">
            {generationTasks.map((task, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all
                  ${i < genStep ? 'bg-green-500' : i === genStep ? 'bg-violet-600' : 'bg-slate-200'}`}>
                  {i < genStep
                    ? <CheckCircle size={13} className="text-white" />
                    : i === genStep
                    ? <RefreshCw size={12} className="text-white animate-spin" />
                    : <Circle size={12} className="text-slate-400" />}
                </div>
                <span className={`text-sm transition-colors ${
                  i < genStep ? 'text-slate-400 line-through' :
                  i === genStep ? 'text-slate-800 font-medium' : 'text-slate-300'
                }`}>{task}</span>
              </div>
            ))}
          </div>

          <div className="max-w-xs mx-auto">
            <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${Math.round((genStep / generationTasks.length) * 100)}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mt-2">
              {Math.round((genStep / generationTasks.length) * 100)}% complete
            </p>
          </div>
        </Card>
      )}

      {/* ── Step 3: Export ITT ── */}
      {step === 3 && !ittApproved && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Export status */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Download size={20} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-800">Ready to Export</h3>
                <p className="text-xs text-slate-400">{draftTenderId} ready for external review</p>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Prepared By', value: approverName, sub: approverRole },
                { label: 'Prepared On', value: new Date().toISOString().split('T')[0], sub: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' local time' },
                { label: 'Sections Completed', value: `${effectiveFlow.length} of ${effectiveFlow.length}`, sub: 'All sections filled in' },
              ].map(item => (
                <div key={item.label} className="bg-slate-50 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="text-sm font-medium text-slate-800">{item.value}</p>
                  {item.sub && <p className="text-xs text-slate-400">{item.sub}</p>}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              <AlertCircle size={13} className="mt-0.5 shrink-0" />
              Export the ITT document for external review, then upload the finalised version to proceed.
            </div>
          </Card>

          {/* Export panel */}
          <Card className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] font-bold text-sm shrink-0">
                {approverInitials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-800">{approverName}</p>
                <p className="text-xs text-slate-400">{approverRole}</p>
              </div>
              <Badge variant="info">Exporter</Badge>
            </div>

            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">ITT Summary</p>
            <div className="mb-4 space-y-0">
              {[
                { label: 'Tender ID', value: draftTenderId || '—' },
                { label: 'Project', value: form.title },
                { label: 'Budget', value: form.budget },
                { label: 'Department', value: form.department },
                { label: 'Sections', value: `${effectiveFlow.length} sections · all completed` },
              ].map(item => (
                <div key={item.label} className="flex justify-between py-1.5 border-b border-slate-100 text-xs">
                  <span className="text-slate-400">{item.label}</span>
                  <span className="font-medium text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>

            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 mb-1.5 block">Export Notes (Optional)</label>
              <textarea
                value={approvalNote}
                onChange={e => setApprovalNote(e.target.value)}
                rows={3}
                placeholder="Add notes for the external reviewer..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none"
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
              <Button className="flex-1 justify-center" onClick={() => {
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
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={32} className="text-green-500" />
          </div>
          <Badge variant="success" className="mb-3">ITT Exported</Badge>
          <h2 className="text-xl font-bold text-slate-800 mb-1">ITT Exported & Created</h2>
          <p className="text-slate-500 text-sm mb-1">Exported by {approverName} · {approverRole}</p>
          <p className="text-slate-400 text-xs mb-6">{draftTenderId} — {form.title} is exported for external review. Upload the finalised version when ready.</p>
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
            <Button variant="secondary" onClick={() => {
              const tender = tenders.find(t => t.id === draftTenderId) || {
                id: draftTenderId,
                title: form.title,
                department: form.department,
                budget: form.budget,
                deadline: form.deadline,
                description: form.description,
                duration: form.duration,
                stage: 'ITT Created',
                created: new Date().toISOString().split('T')[0],
                bidders: 0,
              }
              exportTenderPDF(tender)
            }}>
              <Download size={15} /> {t('itt.export')}
            </Button>
            <Button onClick={() => navigate('/tenders')}>
              <FileText size={15} /> View in Tender List
            </Button>
          </div>
        </Card>
      )}
    </div>
  )
}
