import { useState, useEffect, useRef, useMemo } from 'react'
import JSZip from 'jszip'
import {
  Bot, Sparkles, CheckCircle, RefreshCw, ChevronRight, ChevronDown,
  FileText, AlertCircle, Circle, Download,
  UploadCloud, X, Paperclip, PackageCheck, Layers, Clock, User,
  Briefcase, Plus, Inbox, Hash, ShieldAlert, Info, Eye, Pencil
} from 'lucide-react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { buildFilledDocxBlob, parseDocxTemplate } from '../utils/docxTemplate'
import AiEditableTextarea from '../components/ui/AiEditableTextarea'
import SectionFillStep from '../components/itt/SectionFillStep'
import B1CategoryChooser from '../components/itt/B1CategoryChooser'
import B2ClassEditor from '../components/itt/B2ClassEditor'
import { B1_CATEGORY_MAP } from '../components/itt/b1Categories'
import { resolveFlow } from '../components/itt/sectionFlow'
import { cloneB2Classes, renderB2Text } from '../components/itt/b2Classes'
import ErrorBoundary from '../components/ErrorBoundary'

// Who fills which ITT section. Contract Holder owns the SOW & methodology; HSE
// owns QHSSE; ICV owns the ICV requirements; the Contract Engineer owns the
// rest, initiates the ITT and exports once every section is complete.
const SECTION_OWNER = {
  section1: 'pof', sectionA: 'pof', sectionD: 'contract_holder', sectionB1: 'pof',
  sectionB2: 'pof', sectionC: 'hse', sectionE: 'pof', sectionF: 'contract_holder',
  sectionH: 'icv', sectionJ: 'pof', sectionK: 'pof', sectionL: 'pof', sectionG: 'pof',
}
// The section picker indexes the *full* flow, so it must not open on index 0 —
// that is Section 1 (Contract Engineer) and every other role would land on a
// read-only section. Open on the role's first un-approved own section instead.
function defaultSectionIndexFor(flow, roleId, approved = {}) {
  const owned = flow.reduce((acc, s, i) => ((SECTION_OWNER[s.id] || 'pof') === roleId ? [...acc, i] : acc), [])
  if (owned.length === 0) return 0 // role owns nothing — still opens somewhere, read-only
  const pending = owned.find(i => !approved[flow[i].id])
  return pending ?? owned[0]
}

const OWNER_LABEL = { pof: 'Contract Engineer', contract_holder: 'Contract Holder', hse: 'Contract HSE', icv: 'ICV' }
const OWNER_COLOR = { pof: '#1B4F8A', contract_holder: '#0891B2', hse: '#0EA5E9', icv: '#DB2777' }

// Sections whose owner may attach a finalised document alongside filling the
// template fields — Section B1 (General Conditions) and Section H (ICV).
const SECTION_UPLOAD_LABELS = { sectionB1: 'General Conditions of Contract', sectionH: 'ICV Requirements' }

// steps moved inside component to use t()

const generationTasks = [
  'Analysing project requirements',
  'Loading Section 1 — Instructions to Tenderers',
  'Loading Section A — Form of Agreement',
  'Loading Section D — Statement of Work',
  'Loading Sections B1 & B2 — General & Special Conditions of Contract',
  'Loading Section C — QHSSE Requirements',
  'Loading Sections E & F — Pricing & Methodology',
  'Loading Sections H, J, K, L — ICV, JSRS, OPAL & Salaries',
  'Loading Section G — Administration Instructions',
  'Preparing fill-in workspace',
]

// The seven strategy templates a Contract Holder uploads when they create an ITT
// directly (skipping the PSF Strategy step, which would otherwise carry them
// forward). Mirrors the set collected on the PSF Strategy page.
const ITT_STRATEGY_TEMPLATES = [
  { id: 'sow',                  title: 'Statement of Work (SOW)' },
  { id: 'company-estimate',     title: 'Company Estimate' },
  { id: 'contract-risk',        title: 'Contract Risk Assessment' },
  { id: 'icv',                  title: 'ICV' },
  { id: 'technical-eval-matrix',title: 'Technical Evaluation Matrix' },
  { id: 'hse-risk',             title: 'HSE Risk Assessment' },
  { id: 'negotiation-strategy', title: 'Negotiation Strategy' },
  { id: 'pre-qual',             title: 'Pre-Qualification' },
]

// Statuses a tender can be in and still be awaiting ITT creation. It becomes
// 'draft' by the time the ITT is generated/exported; the prequal_* entries cover
// tenders whose PSF was completed before the pre-qual hand-off wrote 'draft'.
const ITT_READY_STATUSES = new Set([
  'draft',
  'prequal_stage1', 'prequal_stage2', 'prequal_stage3', 'prequal_stage4',
  'prequal_final_review',
])

const draftStatusMap = [
  { label: 'ITT Draft', sub: 'Filling in project details', cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  { label: 'ITT Draft', sub: 'Preparing document templates...', cls: 'bg-violet-100 text-violet-700 border-violet-200' },
  { label: 'ITT Draft', sub: 'Filling in section templates', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  { label: 'Ready to Export', sub: 'Export for external review', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
]

export default function ITTCreation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { tenders, addTender, advanceTender, updateTender, dropdownConfig } = useTenders()
  // Admin-configurable, shared with the Contract Initiating Form so a tender's
  // department stays on the same vocabulary end to end.
  const CONFIGURED_DEPARTMENTS = dropdownConfig.departments || []
  const { t } = useLanguage()
  const { user } = useAuth()
  const approverName = user?.name || 'Contract Engineer'
  const approverRole = user?.role?.label || 'Contract Engineer'
  const approverInitials = approverName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const steps = [t('itt.step1'), t('itt.step2'), t('itt.step3'), t('itt.step4')]

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null

  // Direct access to /create-itt (no tenderId) shouldn't jump straight into a
  // blank form — a draft tender must be picked first. Only tenders that have
  // completed the PSF Strategy step qualify; the picker and the
  // /create-itt/:tenderId deep link both enforce that gate.
  const [skipDraftPicker, setSkipDraftPicker] = useState(false)
  const roleId = user?.role?.id
  // The Contract Holder now owns ITT creation: entering project details, running
  // AI generation and (on the direct path) uploading the strategy templates. The
  // Contract Engineer owns the final Draft & Export step. Section owners
  // (Contract Holder, HSE, ICV, Contract Engineer) each fill their own sections.
  const isCreator  = roleId === 'contract_holder'
  const isExporter = roleId === 'pof'

  // The Contract Holder picks any PSF-complete tender to generate its ITT. The
  // section-owner / exporter roles (HSE / ICV / Contract Engineer) only see
  // tenders the Holder has already generated, so they can fill / export.
  //
  // The gate is psfCompleted — not status === 'draft'. A tender can finish the
  // PSF while still carrying a prequal_* status (e.g. PSF submitted before the
  // pre-qual final-review hand-off writes 'draft'), and it must still surface
  // here. Anything already exported (upload/eval/award/…) is past ITT creation.
  const draftTenders = useMemo(
    () => tenders.filter(t => {
      if (!ITT_READY_STATUSES.has(t.status)) return false
      // Contract Holder generates the ITT — needs a PSF-complete pre-ITT tender.
      if (isCreator) return t.psfCompleted === true
      // Section owners / exporter (HSE / ICV / Contract Engineer) work on any ITT
      // the Holder has already generated — sectionsGenerated is the real signal,
      // independent of the PSF path the tender took to get here.
      return t.sectionsGenerated === true
    }),
    [tenders, isCreator]
  )
  // Split the picker: tenders that came through the PSF Strategy flow vs. ITTs
  // the Contract Holder started directly (no pre-qualification / PSF — flagged
  // psfSkipped when created via "Start New ITT").
  const afterPsfTenders  = draftTenders.filter(t => !t.psfSkipped)
  const directIttTenders = draftTenders.filter(t => t.psfSkipped)

  const showDraftPicker = !tenderId && !skipDraftPicker
  const psfBlocked = Boolean(existingTender) && existingTender.psfCompleted !== true

  // Detect if this tender was pre-populated from Contract Strategy
  const hasStrategyData = existingTender && (existingTender.budget || existingTender.description)
  // A "direct" ITT is one the Contract Holder started without pre-qualification /
  // PSF: either a brand-new draft (no backing tender yet) or a tender explicitly
  // flagged psfSkipped. Only these need the strategy templates uploaded here.
  const isDirectItt = !existingTender || existingTender.psfSkipped === true

  const initialForm = existingTender
    ? { title: existingTender.title || '', department: existingTender.department || '', budget: existingTender.budget || '', deadline: existingTender.deadline || '', duration: existingTender.duration || '', description: existingTender.description || '', costCode: existingTender.costCode || '', currency: existingTender.currency || 'USD' }
    : { title: '', department: '', budget: '', deadline: '', duration: '', description: '', costCode: '', currency: 'USD' }

  // A tender handed off from Pre-Qualification has an id but has never been
  // through this wizard's generation step (no sectionAnswers yet) — it should
  // start at the same detail-entry step as a brand-new ITT, not jump to review.
  const alreadyGenerated = existingTender?.sectionsGenerated === true
  const [step, setStep] = useState(alreadyGenerated ? 2 : 0)
  const [genStep, setGenStep] = useState(0)
  const [draftTenderId, setDraftTenderId] = useState(existingTender?.id || null)
  const [sectionAnswers, setSectionAnswers] = useState(existingTender?.sectionAnswers || {})
  // AI edits made to a section template's own prose (not its fields), keyed
  // { [sectionId]: { [textRunIndex]: rewrittenText } }.
  const [sectionProse, setSectionProse] = useState(existingTender?.sectionProse || {})
  // Which sections each owner has reviewed and approved: { [sectionId]: true }.
  const [sectionApproved, setSectionApproved] = useState(existingTender?.sectionApproved || {})
  const [b1Category, setB1Category] = useState(existingTender?.b1Category || null)
  // Section B2 is authored as clause classes / sub-classes rather than template
  // fields. Seeded from the AI default set the first time the section is opened.
  const [b2Classes, setB2Classes] = useState(existingTender?.sectionB2Classes || cloneB2Classes())
  // Index into the *full* section flow of the section shown in the picker.
  // Seeded (not 0) so the signed-in role opens on a section it owns.
  const [mySectionIndex, setMySectionIndex] = useState(() =>
    defaultSectionIndexFor(resolveFlow(existingTender?.b1Category || null), roleId, existingTender?.sectionApproved || {})
  )
  // Guards the re-default below: it fires once per role + tender, so a section
  // the user picked by hand (including a view-only one) is never clobbered.
  const defaultedForRef = useRef(`${roleId}|${existingTender?.id || ''}`)
  const [approvalNote, setApprovalNote] = useState('')
  const [ittApproved, setIttApproved] = useState(false)
  const [form, setForm] = useState(initialForm)
  const [showErrors, setShowErrors] = useState(false)
  const draftSavedRef  = useRef(false)
  const fileInputRef   = useRef(null)

  const [descMode,     setDescMode]     = useState('type') // 'type' | 'upload'
  const [uploadedFile, setUploadedFile] = useState(null)
  const [isDragging,   setIsDragging]   = useState(false)

  // Direct-path strategy template uploads (Contract Holder, no PSF). Keyed by id.
  const [templateUploads, setTemplateUploads] = useState(existingTender?.strategyTemplateUploads || {})
  const [templatesOpen,   setTemplatesOpen]   = useState(true)

  const handleTemplateUpload = (id, file) => {
    if (!file) return
    setTemplateUploads(prev => ({ ...prev, [id]: { name: file.name, size: file.size } }))
  }
  const removeTemplateUpload = (id) =>
    setTemplateUploads(prev => { const next = { ...prev }; delete next[id]; return next })

  // Owner-attached finalised documents for sections that allow it (B1, H).
  const [sectionUploads, setSectionUploads] = useState(existingTender?.sectionUploads || {})
  const handleSectionUpload = (id, file) => {
    if (!file) return
    setSectionUploads(prev => {
      const next = { ...prev, [id]: { name: file.name, size: file.size } }
      if (draftTenderId) updateTender(draftTenderId, { sectionUploads: next })
      return next
    })
  }
  const removeSectionUpload = (id) =>
    setSectionUploads(prev => {
      const next = { ...prev }; delete next[id]
      if (draftTenderId) updateTender(draftTenderId, { sectionUploads: next })
      return next
    })

  // Keep the wizard in sync with the opened tender. The component is reused
  // across the /create-itt (picker) → /create-itt/:id navigation, so without
  // this a pre-filled tender (CIF + PSF completed) could render with a blank
  // form and the wrong step.
  useEffect(() => {
    if (!existingTender) return
    setForm({
      title:       existingTender.title || '',
      department:  existingTender.department || '',
      budget:      existingTender.budget || '',
      deadline:    existingTender.deadline || '',
      duration:    existingTender.duration || '',
      description: existingTender.description || '',
      costCode:    existingTender.costCode || '',
      currency:    existingTender.currency || 'USD',
    })
    setDraftTenderId(existingTender.id)
    setSectionAnswers(existingTender.sectionAnswers || {})
    setSectionProse(existingTender.sectionProse || {})
    setSectionApproved(existingTender.sectionApproved || {})
    setB1Category(existingTender.b1Category || null)
    setB2Classes(existingTender.sectionB2Classes || cloneB2Classes())
    setTemplateUploads(existingTender.strategyTemplateUploads || {})
    setSectionUploads(existingTender.sectionUploads || {})
    setStep(existingTender.sectionsGenerated === true ? 2 : 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenderId, existingTender?.id])

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
              // Explicit flag: the section board (and non-CE visibility) keys on
              // this, not on sectionAnswers, so merely opening an un-generated
              // tender can't make it look ready.
              sectionsGenerated: true,
              // A generated ITT is, by definition, past the PSF gate — keep the
              // flag set so the tender stays visible in every role's ITT picker.
              psfCompleted: true,
              // Read the live record, not existingTender — on the paramless
              // /create-itt route that is null, so re-generating after a Back to
              // the details step would blank out answers already filled in.
              sectionAnswers: tenders.find(t => t.id === draftTenderId)?.sectionAnswers || {},
              b1Category: tenders.find(t => t.id === draftTenderId)?.b1Category ?? null,
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
              sectionsGenerated: true,
              sectionAnswers: {},
              b1Category: null,
              // Strategy templates the Contract Holder uploaded in lieu of PSF.
              strategyTemplateUploads: templateUploads,
              // Started here deliberately without pre-qualification, so it never
              // passes through PSF Strategy. Without this it would fail the PSF
              // gate below and become unreachable by every role.
              psfCompleted: true,
              psfSkipped: true,
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
    // fill it from the same clause classes the B2 editor works on, so the
    // template and the editor never show different special conditions.
    map['(ai to identify and draft clauses where deviate from b 1 clauses)'] =
      renderB2Text(b2Classes)
    return map
  }, [form.title, draftTenderId, b2Classes])

  const effectiveFlow = useMemo(() => resolveFlow(b1Category), [b1Category])
  // Section-board helpers.
  const ownerOf = sectionId => SECTION_OWNER[sectionId] || 'pof'
  const canEditSection = sectionId => ownerOf(sectionId) === roleId
  // A section is "complete" once its owner has reviewed and approved it.
  const isSectionComplete = section => !!sectionApproved[section.id]
  // Optional sections (e.g. Section B2) never block completion — they can be
  // filled and approved, or skipped.
  const isSectionRequired = section => !section.optional
  const requiredPending = effectiveFlow.filter(s => isSectionRequired(s) && !isSectionComplete(s)).length
  const allSectionsComplete = requiredPending === 0
  // Every role sees the full section list in the dropdown; it edits the sections
  // it owns and views the rest read-only. myFlow is still the role's own subset,
  // used for its approval progress and to advance through its own sections.
  const flow = effectiveFlow
  const myFlow = flow.filter(s => canEditSection(s.id))
  const myCompletedCount = myFlow.filter(isSectionComplete).length
  const myPendingCount = myFlow.filter(s => isSectionRequired(s) && !isSectionComplete(s)).length
  const currentIndex = Math.min(mySectionIndex, Math.max(0, flow.length - 1))
  const current = flow[currentIndex] || null
  const canEditCurrent = current ? canEditSection(current.id) : false
  // Indices (within the full flow) of the sections this role owns.
  const myIndices = flow.reduce((acc, s, i) => (canEditSection(s.id) ? [...acc, i] : acc), [])
  // The section picker is split by access mode rather than listed flat, so the
  // editable sections are never interleaved with the read-only ones. Both keep
  // the original flow index as their value, so selection logic is unchanged.
  const editableOptions = flow.map((item, idx) => ({ item, idx })).filter(o => canEditSection(o.item.id))
  const viewOnlyOptions = flow.map((item, idx) => ({ item, idx })).filter(o => !canEditSection(o.item.id))
  // Re-seed the picker when the role changes or the opened tender first resolves
  // (its sectionApproved decides which of the role's sections is still pending).
  // Keyed by role + tender so navigation inside one tender leaves the manual
  // selection — and goToNext/Prev/approveAndAdvance — untouched.
  useEffect(() => {
    const key = `${roleId}|${existingTender?.id || ''}`
    if (defaultedForRef.current === key || effectiveFlow.length === 0) return
    defaultedForRef.current = key
    // Read approvals off the tender when there is one — the local mirror may not
    // have been re-synced yet on the commit where the tender first resolves.
    setMySectionIndex(defaultSectionIndexFor(effectiveFlow, roleId, existingTender?.sectionApproved || sectionApproved))
  }, [roleId, existingTender, effectiveFlow, sectionApproved])

  const isLastOwn = canEditCurrent && myIndices[myIndices.length - 1] === currentIndex
  const goToNextSection = () => setMySectionIndex(i => Math.min(i + 1, flow.length - 1))
  const goToPrevSection = () => setMySectionIndex(i => Math.max(i - 1, 0))

  const approveSection = sectionId => {
    setSectionApproved(prev => {
      const next = { ...prev, [sectionId]: true }
      if (draftTenderId) updateTender(draftTenderId, { sectionApproved: next })
      return next
    })
  }
  // Review the current section, approve it (owners only), and jump to the role's
  // next un-approved section. Falls back to the next section in the full list so
  // navigation never dead-ends.
  const approveAndAdvance = () => {
    if (current && canEditSection(current.id)) approveSection(current.id)
    const nextOwn = myIndices.find(i => i > currentIndex && !isSectionComplete(flow[i]))
    if (nextOwn != null) setMySectionIndex(nextOwn)
    else goToNextSection()
  }
  // Skip an optional section without approving it — advances like approve does,
  // but leaves the section un-approved (it doesn't count toward completion).
  const skipAndAdvance = () => {
    const nextOwn = myIndices.find(i => i > currentIndex && !isSectionComplete(flow[i]))
    if (nextOwn != null) setMySectionIndex(nextOwn)
    else goToNextSection()
  }

  const handleAnswersChange = (sectionId, answers) => {
    setSectionAnswers(prev => ({ ...prev, [sectionId]: answers }))
  }

  const handleProseChange = (sectionId, edits) => {
    setSectionProse(prev => ({ ...prev, [sectionId]: edits }))
  }

  // Persist section answers to the tender record as a side effect (not inside the
  // setSectionAnswers updater, which React may invoke outside of a normal commit).
  useEffect(() => {
    if (!draftTenderId) return
    // Don't let merely opening an un-generated tender write an empty
    // sectionAnswers — that would make it look ready to the other roles.
    if (!alreadyGenerated && Object.keys(sectionAnswers).length === 0) return
    updateTender(draftTenderId, { sectionAnswers })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionAnswers, draftTenderId])

  // Same for AI edits made to the section templates' prose.
  useEffect(() => {
    if (!draftTenderId) return
    if (!alreadyGenerated && Object.keys(sectionProse).length === 0) return
    updateTender(draftTenderId, { sectionProse })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionProse, draftTenderId])

  const handleB1Select = (categoryId) => {
    setB1Category(categoryId)
    if (draftTenderId) updateTender(draftTenderId, { b1Category: categoryId })
  }

  // Section B2's clause classes persist to the tender so an add / edit / delete
  // survives a reload or a role hand-off. The write is debounced — typing clause
  // text would otherwise re-serialise the whole tender list on every keystroke —
  // and flushed whenever the editor is left.
  const b2PendingRef = useRef(null)
  const b2TimerRef   = useRef(null)
  const flushB2 = () => {
    if (b2TimerRef.current) { clearTimeout(b2TimerRef.current); b2TimerRef.current = null }
    if (b2PendingRef.current && draftTenderId) {
      updateTender(draftTenderId, { sectionB2Classes: b2PendingRef.current })
      b2PendingRef.current = null
    }
  }
  const handleB2Change = (next) => {
    setB2Classes(next)
    if (!draftTenderId) return
    b2PendingRef.current = next
    if (b2TimerRef.current) clearTimeout(b2TimerRef.current)
    b2TimerRef.current = setTimeout(flushB2, 600)
  }

  // Export step -> back to the section board. Shared by the in-page "Back to
  // Sections" button and the global Back button.
  const goToSectionsFromExport = () => {
    setStep(2)
  }

  // Re-entering details means the draft has to be written again on the next
  // generation pass, otherwise edits made here never reach the tender record.
  const goToProjectDetails = () => {
    draftSavedRef.current = false
    setGenStep(0)
    setStep(0)
  }

  // Global Back unwinds this wizard inside-out: section -> major step -> route.
  useBackHandler(() => {
    if (showDraftPicker) return false
    if (step === 3) {
      if (ittApproved) return false // export already advanced the tender — terminal
      goToSectionsFromExport()
      return true
    }
    if (step === 2) {
      if (isCreator) { goToProjectDetails(); return true }
      return false
    }
    if (step === 1) {
      goToProjectDetails()
      return true
    }
    // Return to the picker even when it is empty — its empty state explains the
    // PSF gate, which beats silently discarding the form and leaving for /dashboard.
    if (skipDraftPicker) {
      setSkipDraftPicker(false)
      return true
    }
    return false
  })

  const [downloadingZip, setDownloadingZip] = useState(false)
  const [zipError, setZipError] = useState(null)

  const handleDownloadIttPackage = async () => {
    setDownloadingZip(true)
    setZipError(null)
    try {
      const zip = new JSZip()
      for (const section of effectiveFlow) {
        const answers = [...(sectionAnswers[section.id] || [])]
        // Section B2's clause classes fill the template's "clauses that deviate
        // from B1" field, so the authored special conditions reach the export.
        if (section.id === 'sectionB2') {
          const model = await parseDocxTemplate(section.docxUrl)
          const idx = model.fields.findIndex(f => /deviate\s+from\s+b\s*1/i.test(f.defaultText || ''))
          if (idx >= 0) answers[idx] = renderB2Text(b2Classes)
        }
        const blob = await buildFilledDocxBlob(section.docxUrl, answers, sectionProse[section.id] || null)
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

  // Shared card for a tender row in the Create ITT picker.
  const renderDraftCard = (dt) => (
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
              {(dt.assignedContractEngineers || (dt.assignedContractEngineer ? [dt.assignedContractEngineer] : [])).length > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full" style={{ background: 'rgba(0,137,207,0.1)', color: '#0089cf' }}>
                  Assigned to {(dt.assignedContractEngineers || [dt.assignedContractEngineer]).map(c => c.name).join(', ')}
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
  )

  if (psfBlocked) {
    return (
      <div className="space-y-5">
        <div className="olng-slide-up">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1b4c6f' }}>
            <ShieldAlert size={20} style={{ color: '#d97706' }} />
            PSF Strategy Required
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            This tender cannot start ITT creation yet.
          </p>
        </div>

        <Card branded className="p-5 olng-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(217,119,6,0.12)' }}>
              <Info size={16} style={{ color: '#d97706' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>{existingTender.id}</span>
                <Badge variant="draft">{existingTender.stage || 'Draft'}</Badge>
              </div>
              <p className="text-sm font-semibold mt-1" style={{ color: '#1b4c6f' }}>{existingTender.title || 'Untitled tender'}</p>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                The Procurement Submission Form (PSF Strategy) has not been completed for this tender.
                Complete <strong>PSF Strategy</strong> after Strategy Templates, then return here to create the ITT.
              </p>
            </div>
          </div>
        </Card>

        <Button
          variant="secondary"
          onClick={() => navigate('/tenders')}
          className="w-full justify-center py-3"
        >
          <ChevronRight size={14} /> Back to Tender List
        </Button>
      </div>
    )
  }

  if (showDraftPicker) {
    return (
      <div className="space-y-5">
        <div className="olng-slide-up">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1b4c6f' }}>
            <Inbox size={20} style={{ color: '#0089cf' }} />
            Create ITT
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Select a tender that has completed <strong>PSF Strategy</strong> to continue its ITT, or start a brand-new one from scratch.
          </p>
        </div>

        {draftTenders.length === 0 && (
          <Card branded className="p-6 text-center olng-slide-up">
            <div className="w-11 h-11 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.1)' }}>
              <ShieldAlert size={18} style={{ color: '#0089cf' }} />
            </div>
            <p className="text-sm font-semibold mt-3" style={{ color: '#1b4c6f' }}>No tenders ready for ITT creation</p>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed max-w-md mx-auto">
              A tender must complete the <strong>PSF Strategy</strong> (Procurement Submission Form) step before its ITT can be created.
              Finish Strategy Templates and submit the PSF for a tender, then it will appear here.
            </p>
          </Card>
        )}

        {/* Group 1 — came through the PSF Strategy flow */}
        {afterPsfTenders.length > 0 && (
          <div className="olng-slide-up" style={{ animationDelay: '60ms' }}>
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={14} style={{ color: '#059669' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>From PSF Strategy</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.12)', color: '#059669' }}>{afterPsfTenders.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">Completed pre-qualification and PSF — details are pre-populated.</p>
            <div className="space-y-3">{afterPsfTenders.map(renderDraftCard)}</div>
          </div>
        )}

        {/* Group 2 — started directly, skipping PSF */}
        {directIttTenders.length > 0 && (
          <div className="olng-slide-up" style={{ animationDelay: '90ms' }}>
            <div className="flex items-center gap-2 mb-1">
              <Plus size={14} style={{ color: '#0089cf' }} />
              <h3 className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>Direct ITT (No PSF)</h3>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(0,137,207,0.12)', color: '#0089cf' }}>{directIttTenders.length}</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-2.5">Started directly without pre-qualification / PSF, with templates uploaded here.</p>
            <div className="space-y-3">{directIttTenders.map(renderDraftCard)}</div>
          </div>
        )}

        {isCreator && (
          <Button
            variant="secondary"
            onClick={() => setSkipDraftPicker(true)}
            className="w-full justify-center py-3"
          >
            <Plus size={14} /> Start New ITT (No Pre-Qualification)
          </Button>
        )}
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

      {/* Section-owner / exporter roles wait until the Contract Holder has generated the ITT */}
      {!isCreator && step < 2 && (
        <Card branded className="p-8 text-center olng-slide-up">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.1)' }}>
            <Clock size={20} style={{ color: '#0089cf' }} />
          </div>
          <p className="text-sm font-semibold mt-3" style={{ color: '#1b4c6f' }}>ITT is being prepared</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            The Contract Holder is still setting up this ITT. Your assigned sections will appear here for editing once the ITT has been generated.
          </p>
        </Card>
      )}

      {/* ── Step 0: Project Details (Contract Holder only) ── */}
      {step === 0 && isCreator && (
        <div className="space-y-4 olng-slide-up" style={{ animationDelay: '120ms' }}>
          {/* Pre-fill Banner — shown when data comes from Contract Strategy (not on direct ITTs) */}
          {hasStrategyData && !isDirectItt && (
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
                // A tender created before this list existed can carry a department that
                // isn't in it — keep its value as an option so the select isn't blank.
                { key: 'department', label: t('itt.fieldDept'),
                  options: form.department && !CONFIGURED_DEPARTMENTS.includes(form.department)
                    ? [form.department, ...CONFIGURED_DEPARTMENTS]
                    : CONFIGURED_DEPARTMENTS,
                  placeholder: 'Select department…', required: true },
                { key: 'budget',     label: t('itt.fieldBudget'),   placeholder: 'e.g. 500000', required: true, onChangeFn: setBudget },
                { key: 'deadline',   label: t('itt.fieldDeadline'), type: 'date', required: true },
              ].map(f => (
                <div key={f.key} className={f.span === 2 ? 'col-span-2' : ''}>
                  <label className="text-xs font-semibold mb-2 block flex items-center gap-1" style={{ color: '#1b4c6f' }}>
                    {f.label}
                    {f.required && <span style={{ color: '#0089cf' }}>*</span>}
                  </label>
                  {f.options ? (
                    <select
                      value={form[f.key]}
                      onChange={e => setField(f.key, e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${fieldError(f.key) ? 'olng-input--error' : ''}`}
                    >
                      <option value="">{f.placeholder}</option>
                      {f.options.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input
                      type={f.type || 'text'}
                      placeholder={f.placeholder}
                      value={form[f.key]}
                      onChange={e => f.onChangeFn ? f.onChangeFn(e.target.value) : setField(f.key, e.target.value)}
                      className={`w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${fieldError(f.key) ? 'olng-input--error' : ''}`}
                    />
                  )}
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
                  <AiEditableTextarea
                    rows={4}
                    placeholder="Describe the project scope, objectives, and key requirements..."
                    value={form.description}
                    onChange={val => setField('description', val)}
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
                        <AiEditableTextarea
                          rows={4}
                          placeholder="Extracted content will appear here — you can edit before generating…"
                          value={form.description}
                          onChange={val => setField('description', val)}
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

          {/* Strategy templates upload — shown on the direct path (Contract Holder
              creating an ITT without PSF). PSF-prefilled tenders skip this. */}
          {isDirectItt && (
            <Card branded className="overflow-hidden">
              <button
                type="button"
                onClick={() => setTemplatesOpen(o => !o)}
                className="w-full flex items-center justify-between gap-3 px-5 py-4"
              >
                <span className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                    <FileText size={16} style={{ color: '#0089cf' }} />
                  </span>
                  <span className="text-left min-w-0">
                    <span className="block font-semibold" style={{ color: '#1b4c6f', fontSize: '15px' }}>Strategy Templates</span>
                    <span className="block text-[11px] text-slate-400 mt-0.5">Upload the completed strategy templates for this ITT</span>
                  </span>
                </span>
                <span className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] font-semibold" style={{ color: '#0089cf' }}>
                    {Object.keys(templateUploads).length} of {ITT_STRATEGY_TEMPLATES.length} uploaded
                  </span>
                  <ChevronDown size={16} className="text-slate-400 transition-transform" style={{ transform: templatesOpen ? 'rotate(180deg)' : 'none' }} />
                </span>
              </button>

              {templatesOpen && (
                <div className="border-t border-slate-100 divide-y divide-slate-50">
                  {ITT_STRATEGY_TEMPLATES.map(tpl => {
                    const up = templateUploads[tpl.id]
                    return (
                      <div key={tpl.id} className="flex items-center justify-between gap-4 px-5 py-3 flex-wrap">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <FileText size={14} style={{ color: '#0089cf' }} className="shrink-0" />
                          <span className="text-sm font-medium truncate" style={{ color: '#1b4c6f' }}>{tpl.title}</span>
                        </div>
                        {up ? (
                          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0">
                            <CheckCircle size={13} />
                            <span className="max-w-40 truncate">{up.name}</span>
                            <button type="button" onClick={() => removeTemplateUpload(tpl.id)} className="text-emerald-600 hover:text-emerald-800" title="Remove">
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <label className="flex items-center gap-1.5 text-xs font-medium border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[#0089cf] transition-colors text-slate-600 shrink-0">
                            <UploadCloud size={13} className="text-slate-400" />
                            Upload
                            <input type="file" className="hidden" onChange={e => handleTemplateUpload(tpl.id, e.target.files?.[0])} />
                          </label>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>
          )}

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
                    icv: 'ICV Plan',
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

      {/* ── Step 2: Fill your ITT sections (scoped dropdown) ── */}
      {step === 2 && (
        <div className="space-y-4 olng-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="font-semibold" style={{ color: '#1b4c6f' }}>
              Your ITT Sections
              <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded-full align-middle" style={{ color: OWNER_COLOR[roleId] || '#1B4F8A', background: `${OWNER_COLOR[roleId] || '#1B4F8A'}14` }}>{OWNER_LABEL[roleId] || 'Contract Engineer'}</span>
            </h3>
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>{myCompletedCount} of {myFlow.length} approved</span>
          </div>

          {flow.length === 0 ? (
            <Card className="p-6 text-center text-slate-400">
              <Layers size={26} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No sections on this ITT.</p>
            </Card>
          ) : (
            <>
              {/* Section dropdown — the two access modes are kept apart so it is
                  never ambiguous whether the section being opened is editable.
                  Group 1: the sections this role owns and may edit.
                  Group 2: everyone else's sections, opened read-only. */}
              <Card branded className="p-4">
                <label className="text-xs font-semibold mb-2 block" style={{ color: '#1b4c6f' }}>Select Section</label>
                <select
                  value={currentIndex}
                  onChange={e => setMySectionIndex(parseInt(e.target.value))}
                  className="w-full px-3 py-2 text-sm rounded-lg border focus:outline-none focus:ring-2"
                  style={{ borderColor: 'rgba(0,137,207,0.2)', backgroundColor: '#fff', color: '#1b4c6f' }}
                >
                  {editableOptions.length > 0 && (
                    <optgroup label={`✏️  YOUR SECTIONS — you can edit (${editableOptions.length})`}>
                      {editableOptions.map(({ item, idx }) => (
                        <option key={item.id} value={idx}>
                          {item.title}
                          {isSectionComplete(item) ? '  —  ✓ Approved' : item.optional ? '  —  optional, not yet approved' : '  —  needs your review'}
                        </option>
                      ))}
                    </optgroup>
                  )}
                  {viewOnlyOptions.length > 0 && (
                    <optgroup label={`👁  OTHER ROLES' SECTIONS — view only (${viewOnlyOptions.length})`}>
                      {viewOnlyOptions.map(({ item, idx }) => (
                        <option key={item.id} value={idx}>
                          {item.title}  —  {OWNER_LABEL[ownerOf(item.id)]}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
                <div className="flex items-center gap-4 flex-wrap mt-2.5">
                  <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#0089cf' }}>
                    <Pencil size={11} /> Editable — {editableOptions.length} section{editableOptions.length === 1 ? '' : 's'} you own
                  </span>
                  <span className="flex items-center gap-1.5 text-[11px] font-medium" style={{ color: '#64748b' }}>
                    <Eye size={11} /> View only — {viewOnlyOptions.length} owned by other roles
                  </span>
                </div>
              </Card>

              {/* Mode banner — restates, in the section's own colour, which half of
                  the dropdown the open section came from. */}
              {current && (
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-2.5 flex-wrap"
                  style={canEditCurrent
                    ? { background: 'linear-gradient(135deg, rgba(0,137,207,0.08), rgba(27,76,111,0.04))', border: '1px solid rgba(0,137,207,0.25)' }
                    : { background: 'rgba(100,116,139,0.06)', border: '1px solid rgba(100,116,139,0.2)' }}
                >
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                    style={canEditCurrent
                      ? { background: 'rgba(0,137,207,0.14)', color: '#0089cf' }
                      : { background: 'rgba(100,116,139,0.14)', color: '#64748b' }}>
                    {canEditCurrent ? <Pencil size={13} /> : <Eye size={13} />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-bold" style={{ color: canEditCurrent ? '#1b4c6f' : '#475569' }}>
                      {canEditCurrent ? 'Edit mode' : 'View-only mode'}
                    </p>
                    <p className="text-[11px]" style={{ color: '#94a3b8' }}>
                      {canEditCurrent
                        ? 'You own this section — fill the fields, refine the wording, then approve it.'
                        : `Owned by ${OWNER_LABEL[ownerOf(current.id)]} — you can read it, but nothing here can be changed.`}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.1), rgba(27,76,111,0.06))', color: '#1b4c6f', border: '1px solid rgba(0,137,207,0.15)' }}>
                    <Layers size={12} style={{ color: '#0089cf' }} />
                    {current?.title}
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Section {currentIndex + 1} of {flow.length}</span>
                  {current && canEditCurrent && isSectionComplete(current) && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">Approved</span>
                  )}
                </div>
                <div className="olng-progress-bar w-40 h-2">
                  <div className="olng-progress-fill" style={{ width: `${myFlow.length ? Math.round((myCompletedCount / myFlow.length) * 100) : 0}%` }} />
                </div>
              </div>

              {/* Owner-attached finalised document — Section B1 & Section H only */}
              {current && canEditCurrent && SECTION_UPLOAD_LABELS[current.id] && (() => {
                const up = sectionUploads[current.id]
                const label = SECTION_UPLOAD_LABELS[current.id]
                return (
                  <Card branded className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                          <UploadCloud size={15} style={{ color: '#0089cf' }} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>Upload completed {label}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Attach the finalised document for this section (optional — the fields below still apply).</p>
                        </div>
                      </div>
                      {up ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 shrink-0">
                          <CheckCircle size={13} />
                          <span className="max-w-40 truncate">{up.name}</span>
                          <button type="button" onClick={() => removeSectionUpload(current.id)} className="text-emerald-600 hover:text-emerald-800" title="Remove">
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <label className="flex items-center gap-1.5 text-xs font-medium border border-dashed border-slate-300 rounded-lg px-3 py-2 cursor-pointer hover:border-[#0089cf] transition-colors text-slate-600 shrink-0">
                          <UploadCloud size={13} className="text-slate-400" /> Upload
                          <input type="file" className="hidden" onChange={e => handleSectionUpload(current.id, e.target.files?.[0])} />
                        </label>
                      )}
                    </div>
                  </Card>
                )
              })()}

              <ErrorBoundary>
                {current && current.kind === 'b1-chooser' ? (
                  canEditCurrent ? (
                    <B1CategoryChooser
                      selected={b1Category}
                      onConfirm={(cat) => { handleB1Select(cat); approveAndAdvance() }}
                      onBack={goToPrevSection}
                    />
                  ) : (
                    <Card branded className="p-6">
                      <h3 className="font-semibold" style={{ color: '#1b4c6f' }}>Section B1 — General Conditions of Contract</h3>
                      {b1Category ? (
                        <div className="mt-3 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.05), rgba(236,244,252,0.6))', border: '1px solid rgba(0,137,207,0.2)' }}>
                          <p className="text-sm font-bold" style={{ color: '#1b4c6f' }}>{B1_CATEGORY_MAP[b1Category]?.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{B1_CATEGORY_MAP[b1Category]?.sub}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mt-3">The {OWNER_LABEL[ownerOf('sectionB1')]} has not selected a General Conditions tier yet.</p>
                      )}
                      <p className="mt-4 text-[11px] font-medium flex items-center gap-1.5" style={{ color: '#64748b' }}>
                        <Eye size={12} /> Read-only — owned by {OWNER_LABEL[ownerOf('sectionB1')]}
                      </p>
                    </Card>
                  )
                ) : current && current.id === 'sectionB2' ? (
                  /* Section B2 is authored as clause classes → sub-classes → clause
                     text, rather than as template fields. */
                  <B2ClassEditor
                    key={current.id}
                    section={current}
                    classes={b2Classes}
                    onChange={handleB2Change}
                    onNext={() => { flushB2(); approveAndAdvance() }}
                    onSkip={current.optional ? () => { flushB2(); skipAndAdvance() } : undefined}
                    onBack={() => { flushB2(); goToPrevSection() }}
                    /* Here Save & Continue approves the section, so the editor
                       gates it on every clause class being approved first. */
                    nextApproves
                    readOnly={!canEditCurrent}
                    readOnlyNote={`Read-only — owned by ${OWNER_LABEL[ownerOf(current.id)]}`}
                  />
                ) : current ? (
                  canEditCurrent ? (
                    <SectionFillStep
                      key={current.id}
                      section={current}
                      answers={sectionAnswers[current.id]}
                      prefill={prefillMap}
                      proseEdits={sectionProse[current.id] || {}}
                      onProseChange={handleProseChange}
                      onAnswersChange={handleAnswersChange}
                      onNext={approveAndAdvance}
                      onSkip={current.optional ? skipAndAdvance : undefined}
                      onBack={goToPrevSection}
                      isFirst={currentIndex === 0}
                      isLast={isLastOwn}
                      nextLabel="Review & Approve"
                      lastLabel={isLastOwn ? 'Approve & Send to Contract Engineer' : undefined}
                      standInNotice={current.isStandIn && (
                        <div className="mb-4 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs olng-info-alert" style={{ borderLeft: '3px solid #e69c00' }}>
                          <AlertCircle size={13} className="mt-0.5 shrink-0" style={{ color: '#e69c00' }} />
                          <span>Dedicated template not yet available for this category — showing the nearest {current.nearestTier} template as a stand-in.</span>
                        </div>
                      )}
                    />
                  ) : (
                    <SectionFillStep
                      key={current.id}
                      section={current}
                      answers={sectionAnswers[current.id]}
                      prefill={prefillMap}
                      // Prose edits made by the owner are shown here, but this
                      // role only views the section — no onProseChange.
                      proseEdits={sectionProse[current.id] || {}}
                      onAnswersChange={() => {}}
                      onNext={() => {}}
                      onBack={goToPrevSection}
                      isFirst={currentIndex === 0}
                      isLast={false}
                      readOnly
                      readOnlyNote={`Read-only — owned by ${OWNER_LABEL[ownerOf(current.id)]}`}
                    />
                  )
                ) : null}
              </ErrorBoundary>
            </>
          )}

          {/* Export / handoff — Contract Engineer drafts & exports once all approved */}
          <Card branded className="p-4">
            {isExporter ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>Draft &amp; Export ITT</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {allSectionsComplete ? 'Every owner has approved their required sections — draft and export the ITT to share with bidders.' : `${requiredPending} required section(s) still awaiting owner approval.`}
                  </p>
                </div>
                <Button variant="brand" disabled={!allSectionsComplete} onClick={() => setStep(3)}>
                  <ChevronRight size={14} /> Draft &amp; Export ITT
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <Info size={15} style={{ color: '#0089cf' }} className="mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500">
                  {myPendingCount > 0 ? `Review and approve your ${myPendingCount} remaining section(s).` : 'Your sections are approved and sent to the Contract Engineer.'} The Contract Engineer drafts and exports the ITT once every owner has approved.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Step 1: AI Generation (Contract Holder only) ── */}
      {step === 1 && isCreator && (
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
              <AiEditableTextarea
                value={approvalNote}
                onChange={setApprovalNote}
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
              <Button variant="secondary" className="flex-1 justify-center" onClick={goToSectionsFromExport}>
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
