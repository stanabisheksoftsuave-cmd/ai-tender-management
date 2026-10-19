import { useState, useEffect, useRef, useMemo } from 'react'
import JSZip from 'jszip'
import {
  CheckCircle, RefreshCw, ChevronRight,
  FileText, AlertCircle,
  UploadCloud, X, PackageCheck, Layers, Clock,
  Briefcase, Plus, Inbox, ShieldAlert, Info, Eye, Pencil, ArrowRight
} from 'lucide-react'
import { useParams, useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import Card from '../components/ui/Card'
import AiAnalysisLoader from '../components/ui/AiAnalysisLoader'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { useTenders } from '../context/TenderContext'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import { useBackHandler } from '../context/NavigationContext'
import { useAiLockWhile } from '../hooks/useAiLockWhile'
import { buildFilledDocxBlob, parseDocxTemplate } from '../utils/docxTemplate'
import SectionFillStep from '../components/itt/SectionFillStep'
import B1CategoryChooser from '../components/itt/B1CategoryChooser'
import B2ClassEditor from '../components/itt/B2ClassEditor'
import { B1_CATEGORY_MAP } from '../components/itt/b1Categories'
import { resolveFlow } from '../components/itt/sectionFlow'
import { cloneB2Classes, renderB2Text } from '../components/itt/b2Classes'
import ErrorBoundary from '../components/ErrorBoundary'
import { tenderRef } from '../utils/tenderRef'
import { TEMPLATE_DEFS } from './StrategyTemplatesDashboard'
import { exportTemplateExcel, exportPreQualSummaryExcel } from '../utils/exportExcel'
import { ASSIGNMENT_GROUPS } from '../data/assignmentGroups'
import CreateIttPicker from '../components/itt/ch/CreateIttPicker'
import ProjectInformationCard from '../components/itt/ch/ProjectInformationCard'
import StrategyTemplatesCard from '../components/itt/ch/StrategyTemplatesCard'
import IttSectionPicker from '../components/itt/ch/IttSectionPicker'
import ApprovedSectionSummary from '../components/itt/ch/ApprovedSectionSummary'
import { WizardStatusBanner, IttWizardStepper } from '../components/itt/ch/WizardChrome'
import { tenderHeaderDetails } from '../components/itt/ch/wizardHeader'
import { SectionAssignmentsCard, AssignedTeamSelectCard } from '../components/itt/ch/TeamCards'
import { QualifiedBiddersCard, InternalReferenceDocumentsCard, GeneratedTemplatesCard } from '../components/itt/ch/ReferenceCards'
import { useDescriptionUpload } from '../components/itt/ch/useDescriptionUpload'
import {
  tenderToForm, formToTenderFields, validateCreateIttForm, missingRequiredTemplates,
  isDescriptionOverLimit, existingTenderStatusLabel, existingTenderDestination,
  tenderPhase, phaseLabel, normalizeTitle, TITLE_SUGGESTION_MIN_QUERY_LENGTH, EMPTY_FORM,
} from '../components/itt/ch/createIttForm'

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

const OWNER_LABEL = { pof: 'Contract Engineer', contract_holder: 'Contract Holder', hse: 'HSE', icv: 'LC' }
const OWNER_COLOR = { pof: '#0089cf', contract_holder: '#0089cf', hse: '#0089cf', icv: '#0089cf' }
// Where each section-owner role's Contract Initiating Form assignment lives on
// the tender — Contract Holder has none (they're the tender's own creator).
const ASSIGNEE_FIELD = { pof: 'assignedContractEngineers', hse: 'assignedHseOfficers', icv: 'assignedIcvLeads' }

// Sections whose owner may attach a finalised document alongside filling the
// template fields — Section B1 (General Conditions) and Section H (ICV).
const SECTION_UPLOAD_LABELS = { sectionB1: 'General Conditions of Contract', sectionH: 'LC Requirements' }

// steps moved inside component to use t()

const generationTasks = [
  'Analysing project requirements',
  'Loading Section 1 — Instructions to Tenderers',
  'Loading Section A — Form of Agreement',
  'Loading Section D — Scope of Work',
  'Loading Sections B1 & B2 — General & Special Conditions of Contract',
  'Loading Section C — QHSSE Requirements',
  'Loading Sections E & F — Pricing & Methodology',
  'Loading Sections H, J, K, L — LC, JSRS, OPAL & Salaries',
  'Loading Section G — Administration Instructions',
  'Preparing fill-in workspace',
]

// MAIN's owner labels for the Contract Holder's section picker / read-only
// notes (MAIN renames ICV to "LC" in the Contract Holder UI).
const CH_OWNER_LABEL = { pof: 'Contract Engineer', contract_holder: 'Contract Holder', hse: 'HSE', icv: 'LC' }

// Statuses a tender can be in and still be awaiting ITT creation or continued editing.
const ITT_READY_STATUSES = new Set([
  'draft', 'exported', 'in_progress', 'completed', 'awaiting_review',
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
  const { user, users } = useAuth()
  const approverName = user?.name || 'Contract Engineer'
  const approverRole = user?.role?.label || 'Contract Engineer'
  const steps = [t('itt.step1'), t('itt.step2'), t('itt.step3'), t('itt.step4')]

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null

  // The Strategy Templates completed before PSF submission, each with the rows
  // the Contract Holder actually filled in — shown so the Contract Engineer can
  // download the originals without leaving ITT creation.
  const generatedTemplates = useMemo(() => TEMPLATE_DEFS
    .map(template => ({ template, rows: existingTender?.[template.dataKey] || [] }))
    .filter(t => t.rows.length > 0), [existingTender])

  // Pre-Qualification is a separate document, not a TEMPLATE_DEFS row template —
  // shown alongside the generated templates when this tender has prequal data.
  const qualifiedBidders = (existingTender?.prequalBidders || []).filter(b => !b.droppedAt)
  const hasPreQual = (existingTender?.prequalBidders?.length || 0) > 0

  // Direct access to /create-itt (no tenderId) shouldn't jump straight into a
  // blank form — a draft tender must be picked first. Only tenders that have
  // completed the PSF Strategy step qualify; the picker and the
  // /create-itt/:tenderId deep link both enforce that gate.
  // `/create-itt?new=1` (the Dashboard's "New ITT") opens the Contract
  // Holder's blank direct-ITT form straight away instead of the picker.
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const startNewParam = searchParams.get('new') === '1'
  const roleId = user?.role?.id
  // The Contract Holder now owns ITT creation: entering project details, running
  // AI generation and (on the direct path) uploading the strategy templates. The
  // Contract Engineer owns the final Draft & Export step. Section owners
  // (Contract Holder, HSE, ICV, Contract Engineer) each fill their own sections.
  const isCreator  = roleId === 'contract_holder'
  const isExporter = roleId === 'pof'
  // Contract Engineer, HSE and ICV review and approve sections here rather
  // than author an ITT — the page reads as a review desk for them.
  const isIttReviewer = ['pof', 'hse', 'icv'].includes(roleId)

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
      // Contract Holder generates the ITT — needs a PSF-complete pre-ITT tender or a direct ITT.
      if (isCreator) return t.psfCompleted === true || t.psfSkipped === true
      // Section owners / exporter (HSE / ICV / Contract Engineer) work on any ITT
      // the Holder has already generated — sectionsGenerated is the real signal,
      // independent of the PSF path the tender took to get here.
      return t.sectionsGenerated === true || t.psfSkipped === true
    }),
    [tenders, isCreator]
  )

  const showDraftPicker = !tenderId && !(isCreator && startNewParam)
  const psfBlocked = Boolean(existingTender) && existingTender.psfCompleted !== true

  // A "direct" ITT is one the Contract Holder started without pre-qualification /
  // PSF: either a brand-new draft (no backing tender yet) or a tender explicitly
  // flagged psfSkipped. Only these need the strategy templates uploaded here.
  const isDirectItt = !existingTender || existingTender.psfSkipped === true

  // Active users per assignable role (Contract Engineer / HSE / LC).
  const usersByGroup = useMemo(() => Object.fromEntries(
    ASSIGNMENT_GROUPS.map(g => [g.key, (users || []).filter(u => u.roleId === g.roleId && u.status === 'active')])
  ), [users])
  // A PSF-sourced ITT already carries its team from the Contract Initiating
  // Form — shown read-only. A direct ITT (or a legacy PSF tender missing one of
  // the three) gets the editable Assign Team card instead.
  const teamNames = (key) => {
    const g = ASSIGNMENT_GROUPS.find(x => x.key === key)
    const list = existingTender?.[g.tenderKey] || (g.singleKey && existingTender?.[g.singleKey] ? [existingTender[g.singleKey]] : [])
    return list.map(c => c.name).filter(Boolean).join(', ')
  }
  const hasCompleteAssignment = ['ce', 'hse', 'icv'].every(k => teamNames(k) !== '')
  const showReadOnlyTeam = Boolean(existingTender) && !isDirectItt && hasCompleteAssignment

  // ── Project Details form (MAIN's create-itt-form schema) ──
  const [form, setForm] = useState(() => tenderToForm(existingTender))
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef(form)
  useEffect(() => { formRef.current = form })
  const setField = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }))
    setTouched(prev => (prev[key] ? prev : { ...prev, [key]: true }))
  }
  const resetForm = (values) => {
    setForm(values)
    setTouched({})
    setSubmitted(false)
  }
  const upload = useDescriptionUpload({ getForm: () => formRef.current, setField })
  const allErrors = useMemo(() => validateCreateIttForm(form), [form])
  const isFormComplete = Object.keys(allErrors).length === 0
  const visibleErrors = Object.fromEntries(Object.entries(allErrors).filter(([k]) =>
    submitted || touched[k]))
  if (upload.extractError && !visibleErrors.uploadedFileName) visibleErrors.uploadedFileName = upload.extractError
  const isDirty = Object.keys(touched).length > 0
  const showFieldErrors = !isFormComplete && (isDirty || submitted)
  const isDescriptionTooLong = isDescriptionOverLimit(form.description)
  const departmentOptions = form.department && !CONFIGURED_DEPARTMENTS.includes(form.department)
    ? [form.department, ...CONFIGURED_DEPARTMENTS]
    : CONFIGURED_DEPARTMENTS

  // Title suggestions — typing a new ITT's title lists existing tenders with a
  // matching title; picking one pre-fills from it, and while the title still
  // names that tender the button continues it instead of creating a duplicate.
  const canSuggestTitles = isCreator && !existingTender
  const [linkedTenderId, setLinkedTenderId] = useState(null)
  const titleQuery = form.title.trim().toLowerCase()
  const titleSuggestions = useMemo(() => {
    if (!canSuggestTitles || titleQuery.length < TITLE_SUGGESTION_MIN_QUERY_LENGTH) return []
    return tenders
      .filter(t => (t.title || '').toLowerCase().includes(titleQuery))
      .slice(0, 8)
      .map(t => ({
        id: t.id,
        title: t.title,
        status: existingTenderStatusLabel(t),
        detail: [phaseLabel(tenderPhase(t)), t.department, t.costCode].filter(Boolean).join(' · '),
      }))
  }, [canSuggestTitles, titleQuery, tenders])
  const linkedCandidate = linkedTenderId ? tenders.find(t => t.id === linkedTenderId) : null
  const linkedTender = canSuggestTitles && linkedCandidate && normalizeTitle(form.title) === normalizeTitle(linkedCandidate.title)
    ? linkedCandidate : null
  const existingTenderNotice = linkedTender
    ? `This tender already exists (${existingTenderStatusLabel(linkedTender)}${phaseLabel(tenderPhase(linkedTender)) ? `, ${phaseLabel(tenderPhase(linkedTender))}` : ''}). The button below takes you to its current step instead of creating a duplicate.`
    : undefined
  const handleSelectTitleSuggestion = (id) => {
    const t = tenders.find(x => x.id === id)
    if (!t) return
    setLinkedTenderId(id)
    const values = tenderToForm(t)
    const fields = ['title', 'department', 'category', 'currency', 'budget', 'deadline', 'durationYears', 'durationMonths', 'costCode',
      ...(form.descMode === 'type' ? ['description'] : [])]
    fields.forEach(f => { if (values[f] !== '') setField(f, values[f]) })
  }

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
  const [ittApproved, setIttApproved] = useState(false)
  const draftSavedRef  = useRef(false)

  // Direct-path strategy template uploads (Contract Holder, no PSF). Keyed by
  // id; saved to the tender as soon as each file is chosen (MAIN uploads each
  // one immediately against the saved ITT).
  const [templateUploads, setTemplateUploads] = useState(existingTender?.strategyTemplateUploads || {})
  const [showTemplateError, setShowTemplateError] = useState(false)
  const missingTemplateCount = existingTender && isDirectItt ? missingRequiredTemplates(templateUploads) : 0
  const handleTemplateUpload = (id, file) => {
    if (!file) return
    const next = { ...templateUploads, [id]: { name: file.name, size: file.size } }
    setTemplateUploads(next)
    if (existingTender) updateTender(existingTender.id, { strategyTemplateUploads: next })
  }
  const removeTemplateUpload = (id) => {
    const next = { ...templateUploads }
    delete next[id]
    setTemplateUploads(next)
    if (existingTender) updateTender(existingTender.id, { strategyTemplateUploads: next })
  }

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
    setForm(tenderToForm(existingTender))
    setTouched({})
    setSubmitted(false)
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

  // The team the form assigns, as the tender's assignment fields. A
  // PSF-sourced ITT's read-only team is never rewritten from here.
  const teamPatch = () => {
    if (showReadOnlyTeam) return {}
    // Fall back to the tender's own record of that person (e.g. a user since
    // deactivated) so re-saving never silently drops an existing assignment.
    const pick = (key, id) => {
      const active = (usersByGroup[key] || []).find(u => String(u.id) === String(id))
      if (active) return [{ id: active.id, name: active.name }]
      const g = ASSIGNMENT_GROUPS.find(x => x.key === key)
      const prior = [...(existingTender?.[g.tenderKey] || []), ...(g.singleKey && existingTender?.[g.singleKey] ? [existingTender[g.singleKey]] : [])]
        .find(c => String(c.id) === String(id))
      return prior ? [{ id: prior.id, name: prior.name }] : []
    }
    const ces = pick('ce', form.contractEngineerId)
    return {
      assignedContractEngineers: ces,
      assignedHseOfficers: pick('hse', form.hseId),
      assignedIcvLeads: pick('icv', form.icvId),
      assignedContractEngineer: ces[0] || null,
    }
  }
  const detailsPatch = () => ({ ...formToTenderFields(form), ...teamPatch() })

  // Auto-tick generation tasks, then add draft tender + advance to Review
  useEffect(() => {
    if (step !== 1) return
    if (genStep >= generationTasks.length) {
      const t = setTimeout(() => {
        if (!draftSavedRef.current) {
          draftSavedRef.current = true
          if (draftTenderId) {
            // The tender always exists by now — a direct ITT is created by its
            // first "Save & Continue". Fill in the details just entered without
            // touching bidderList/bidders/aiScore an earlier stage may have set.
            updateTender(draftTenderId, {
              ...detailsPatch(),
              status: 'draft',
              stage: 'Draft — Pending Export',
              // Explicit flag: the section board (and non-CE visibility) keys on
              // this, not on sectionAnswers, so merely opening an un-generated
              // tender can't make it look ready.
              sectionsGenerated: true,
              // A generated ITT is, by definition, past the PSF gate — keep the
              // flag set so the tender stays visible in every role's ITT picker.
              psfCompleted: true,
              // Read the live record so re-generating never blanks answers.
              sectionAnswers: tenders.find(t => t.id === draftTenderId)?.sectionAnswers || {},
              b1Category: tenders.find(t => t.id === draftTenderId)?.b1Category ?? null,
              ...(isDirectItt ? { strategyTemplateUploads: templateUploads } : {}),
            })
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

  // A brand-new direct ITT: "Save & Continue" creates it (no PSF, flagged
  // psfSkipped) and reopens it at /create-itt/:id, where its strategy templates
  // are uploaded before continuing to the sections.
  const createDirectDraft = () => {
    const maxNum = tenders.reduce((max, t) => Math.max(max, parseInt(String(t.id).split('-')[2]) || 0), 0)
    const newId = `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
    addTender({
      id: newId,
      ...detailsPatch(),
      status: 'draft',
      stage: 'Draft — Pending Export',
      created: new Date().toISOString().split('T')[0],
      bidders: 0,
      bidderList: [],
      aiScore: null,
      sectionsGenerated: false,
      sectionAnswers: {},
      b1Category: null,
      strategyTemplateUploads: {},
      // Started here deliberately without pre-qualification, so it never
      // passes through PSF Strategy. Without this it would fail the PSF gate
      // and become unreachable by every role.
      psfCompleted: true,
      psfSkipped: true,
    })
    navigate(`/create-itt/${newId}`, { replace: true, state: { ittSaved: true } })
  }

  // "Save & Continue" / "Save & Continue to Sections" on Project Details.
  const handleSaveAndContinue = () => {
    if (linkedTender) { navigate(existingTenderDestination(linkedTender)); return }
    if (upload.isExtracting) return
    setSubmitted(true)
    if (!isFormComplete) {
      if (missingTemplateCount > 0) setShowTemplateError(true)
      return
    }
    if (!existingTender) { createDirectDraft(); return }
    if (missingTemplateCount > 0) { setShowTemplateError(true); return }
    if (existingTender.sectionsGenerated === true) {
      // Already generated — save the details and go straight back to the sections.
      updateTender(existingTender.id, detailsPatch())
      setStep(2)
      return
    }
    draftSavedRef.current = false
    setGenStep(0)
    setStep(1)
  }

  // Hold the app-wide AI lock while the ITT is being generated.
  useAiLockWhile(isCreator && step === 1, 'Generating the ITT')
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
  // The person the Contract Initiating Form assigned to a section's owning
  // role — CE/HSE/ICV are picked once there (ContractStrategy.jsx) rather than
  // reassigned here, so "owned by" reads as a name instead of just the role.
  // Falls back to the generic role label for Contract Holder (no CIF field)
  // and for a legacy tender that predates the CIF assignment step.
  const ownerDisplay = ownerRoleId => {
    const field = ASSIGNEE_FIELD[ownerRoleId]
    const people = field ? (tenders.find(t => t.id === draftTenderId)?.[field] || []) : []
    return people.length ? people.map(p => p.name).join(', ') : (OWNER_LABEL[ownerRoleId] || ownerRoleId)
  }
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
  // Contract Holder: MAIN's searchable section picker rows, its read-only
  // copy, and the approved-section summary's "Edit this section" unlock.
  const pickerRows = [
    ...editableOptions.map(({ item, idx }) => ({
      idx, title: item.title, owner: CH_OWNER_LABEL[ownerOf(item.id)] || ownerOf(item.id),
      status: isSectionComplete(item)
        ? { label: 'Approved', tone: 'success' }
        : item.optional ? { label: 'Optional', tone: 'neutral' } : { label: 'Needs review', tone: 'warning' },
    })),
    ...viewOnlyOptions.map(({ item, idx }) => ({
      idx, title: item.title, owner: CH_OWNER_LABEL[ownerOf(item.id)] || ownerOf(item.id),
      status: { label: 'View only', tone: 'neutral' },
    })),
  ]
  const readOnlyNoteFor = (sectionId) => (isCreator
    ? `This section is owned by the ${CH_OWNER_LABEL[ownerOf(sectionId)] || ownerOf(sectionId)}. You can review it but not edit.`
    : `Read-only — owned by ${ownerDisplay(ownerOf(sectionId))}`)
  const [unlockedSectionId, setUnlockedSectionId] = useState(null)
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
    setUnlockedSectionId(null)
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

  // Re-entering details means the draft has to be written again on the next
  // generation pass, otherwise edits made here never reach the tender record.
  const goToProjectDetails = () => {
    draftSavedRef.current = false
    setGenStep(0)
    setStep(0)
  }

  // Contract Holder picker → blank direct-ITT form (and back).
  const startNewItt = () => {
    resetForm({ ...EMPTY_FORM })
    upload.resetUpload()
    setLinkedTenderId(null)
    setSearchParams({ new: '1' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const backToPicker = () => {
    resetForm({ ...EMPTY_FORM })
    upload.resetUpload()
    setLinkedTenderId(null)
    setSearchParams({}, { replace: true })
  }

  // Global Back unwinds this wizard inside-out: section -> major step -> route.
  useBackHandler(() => {
    if (showDraftPicker) return false
    if (step === 3) return false // export already advanced the tender — terminal
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
    if (isCreator && startNewParam && !tenderId) {
      backToPicker()
      return true
    }
    return false
  })

  const [downloadingZip, setDownloadingZip] = useState(false)
  const [zipError, setZipError] = useState(null)
  // The exported ITT has to actually leave the browser before the flow lets go of
  // it — View in Tender Tracking stays shut until the package is downloaded. Tracked
  // as the tender it was downloaded for: this page is not remounted between
  // tenders (see App.jsx's CreateIttRoute), so a plain boolean would stay latched
  // and let the next tender's export skip the download entirely.
  const [downloadedForTenderId, setDownloadedForTenderId] = useState(null)
  const packageDownloaded = !!draftTenderId && downloadedForTenderId === draftTenderId

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
      setDownloadedForTenderId(draftTenderId)
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


  if (psfBlocked) {
    return (
      <div className="space-y-5">
        <div className="olng-slide-up">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1e293b' }}>
            <ShieldAlert size={20} style={{ color: '#d97706' }} />
            PSF Strategy Required
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            This tender cannot start ITT creation yet.
          </p>
        </div>

        <Card className="p-5 olng-slide-up">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(217,119,6,0.12)' }}>
              <Info size={16} style={{ color: '#d97706' }} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono px-2 py-0.5 rounded" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>{tenderRef(existingTender)}</span>
                <Badge variant="draft">{existingTender.stage || 'Draft'}</Badge>
              </div>
              <p className="text-sm font-semibold mt-1" style={{ color: '#1e293b' }}>{existingTender.title || 'Untitled tender'}</p>
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
          <ChevronRight size={14} /> Back to Tender Tracking
        </Button>
      </div>
    )
  }

  if (showDraftPicker) {
    return (
      // h-full so the picker can fill the layout's parent container.
      <div className="h-full">
        <CreateIttPicker
          tenders={draftTenders}
          title={isIttReviewer ? 'ITT Review and Approve' : 'Create ITT'}
          description={
            isIttReviewer
              ? 'Select a tender to review and approve its ITT.'
              : undefined
          }
          onSelect={dt => navigate(`/create-itt/${dt.id}`)}
          onStartNew={isCreator ? startNewItt : undefined}
        />
      </div>
    )
  }

  // The tender the wizard is open on — from the URL, or the draft this
  // session just saved. A brand-new, unsaved draft has none.
  const headerTender = existingTender || (draftTenderId ? tenders.find(t => t.id === draftTenderId) : null)
  // The white wizard container is the HSE and LC (icv) review desk's look;
  // the Contract Holder and Contract Engineer keep the open, uncontained layout.
  const showWizardContainer = roleId === 'hse' || roleId === 'icv'

  return (
    // One white container for the whole wizard: the tender header band on top,
    // a divider, then the stepper and the step's content. No overflow-hidden —
    // dropdowns and the AI-edit popups inside must not be clipped.
    <section className={showWizardContainer
      ? 'divide-y divide-[#cce6f8] rounded-2xl border border-[#cce6f8] bg-white shadow-sm shadow-black/[0.03] dark:divide-slate-800 dark:border-slate-800 dark:bg-slate-900'
      : 'space-y-5'}>
      <WizardStatusBanner
        tenderTitle={headerTender?.title}
        statusText={step === 2
          ? 'Filling in section templates'
          : step === 1
            ? 'Preparing document templates...'
            : existingTender ? 'Project details and strategy templates' : 'Filling in project details'}
        reference={headerTender ? (tenderRef(headerTender) || headerTender.reference || '') : ''}
        details={tenderHeaderDetails(headerTender)}
        bare={!showWizardContainer}
      />
      <div className={showWizardContainer ? 'space-y-5 p-4 sm:p-6' : 'space-y-5'}>
      <IttWizardStepper current={step} />

      {/* Section-owner / exporter roles wait until the Contract Holder has generated the ITT */}
      {!isCreator && step < 2 && (
        <Card className="p-8 text-center olng-slide-up">
          <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.1)' }}>
            <Clock size={20} style={{ color: '#0089cf' }} />
          </div>
          <p className="text-sm font-semibold mt-3 text-slate-800 dark:text-slate-100">ITT is being prepared</p>
          <p className="text-xs text-slate-400 mt-1.5 max-w-md mx-auto leading-relaxed">
            The Contract Holder is still setting up this ITT. Your assigned sections will appear here for editing once the ITT has been generated.
          </p>
        </Card>
      )}

      {/* ── Step 0: Project Details (Contract Holder only) ── */}
      {step === 0 && isCreator && (
        <div className="space-y-4 olng-slide-up" style={{ animationDelay: '120ms' }}>
          {location.state?.ittSaved && existingTender && isDirectItt && !existingTender.sectionsGenerated && (
            <div role="status" className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <CheckCircle size={14} /> ITT saved. Upload the 8 strategy templates to continue.
            </div>
          )}

          <ProjectInformationCard
            form={form}
            errors={visibleErrors}
            setField={setField}
            departmentOptions={departmentOptions}
            upload={upload}
            titleSuggestions={titleSuggestions}
            onSelectTitleSuggestion={canSuggestTitles ? handleSelectTitleSuggestion : undefined}
            existingTenderNotice={existingTenderNotice}
          />

          {/* A tender that came through the PSF already has its CE/HSE/LC from
              the Contract Initiating Form — shown read-only. A direct ITT (or a
              PSF tender missing one of the three) assigns the team here. */}
          {showReadOnlyTeam ? (
            <AssignedTeamSelectCard namesByGroup={{ ce: teamNames('ce'), hse: teamNames('hse'), icv: teamNames('icv') }} />
          ) : (
            <SectionAssignmentsCard
              form={form}
              errors={visibleErrors}
              setField={setField}
              optionsByGroup={usersByGroup}
            />
          )}

          {existingTender?.bidderList?.length > 0 && (
            <QualifiedBiddersCard bidders={existingTender.bidderList} />
          )}

          {existingTender?.handoffDocuments && Object.keys(existingTender.handoffDocuments).length > 0 && (
            <InternalReferenceDocumentsCard documents={existingTender.handoffDocuments} onDownload={handleDownloadHandoffDoc} />
          )}

          {/* Direct ITT: the strategy templates are uploaded here, once the ITT
              has been saved. A PSF-sourced ITT already generated them. */}
          {existingTender && isDirectItt && (
            <StrategyTemplatesCard
              uploads={templateUploads}
              onUpload={handleTemplateUpload}
              onClear={removeTemplateUpload}
              showError={showTemplateError && missingTemplateCount > 0}
            />
          )}

          {!isDirectItt && (generatedTemplates.length > 0 || hasPreQual) && (
            <GeneratedTemplatesCard
              templates={generatedTemplates}
              preQual={hasPreQual ? { count: qualifiedBidders.length } : null}
              onExportTemplate={(template, rows) => exportTemplateExcel(template, rows, existingTender)}
              onExportPreQual={() => exportPreQualSummaryExcel(existingTender, qualifiedBidders)}
            />
          )}

          {existingTender ? (
            <Button
              variant="brand"
              onClick={handleSaveAndContinue}
              className="w-full justify-center py-3.5 text-[15px]"
              disabled={missingTemplateCount > 0 || isDescriptionTooLong || upload.isExtracting}
            >
              Save &amp; Continue to Sections
            </Button>
          ) : (
            <Button
              variant="brand"
              onClick={handleSaveAndContinue}
              className="w-full justify-center py-3.5 text-[15px]"
              disabled={linkedTender ? false : upload.isExtracting || !isFormComplete}
            >
              Save &amp; Continue <ArrowRight size={16} />
            </Button>
          )}

          {showFieldErrors ? (
            <p className="text-[11px] text-red-500 text-center flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Please fill in all required fields marked with *
            </p>
          ) : missingTemplateCount > 0 ? (
            <p className="text-[11px] text-red-500 text-center flex items-center justify-center gap-1">
              <AlertCircle size={11} /> Please upload the {missingTemplateCount} missing Strategy Template{missingTemplateCount === 1 ? '' : 's'} before continuing
            </p>
          ) : existingTender ? null : (
            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Saving creates the ITT. You will then upload the 8 strategy templates one by one.
            </p>
          )}
        </div>
      )}

      {/* ── Step 2: Fill your ITT sections (scoped dropdown) ── */}
      {step === 2 && (
        <div className="space-y-4 olng-slide-up">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold" style={{ color: '#1e293b' }}>
                Your ITT Sections
              </h3>
              <span className="rounded-full border border-[#0089cf]/25 bg-[#afd9f4] px-2.5 py-0.5 text-[11px] font-semibold text-[#0089cf]">
                {OWNER_LABEL[roleId] || 'Contract Engineer'}
              </span>
            </div>
            <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>
              <span className="font-semibold" style={{ color: '#1e293b' }}>{myCompletedCount}</span> of {myFlow.length} approved
            </span>
          </div>

          {flow.length === 0 ? (
            <Card className="p-6 text-center text-slate-400">
              <Layers size={26} className="mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No sections on this ITT.</p>
            </Card>
          ) : (
            <>
              {/* Section dropdown — searchable popover showing open section, status pills */}
              <IttSectionPicker rows={pickerRows} currentIdx={currentIndex} onChange={setMySectionIndex} />

              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#ffffff', color: '#1e293b', border: '1px solid rgba(0,137,207,0.15)' }}>
                    <Layers size={12} style={{ color: '#0089cf' }} />
                    {current?.title}
                  </div>
                  <span className="text-xs font-medium" style={{ color: '#94a3b8' }}>Section {currentIndex + 1} of {flow.length}</span>
                  {current && canEditCurrent && isSectionComplete(current) && (
                    <span className="rounded-full border border-[#a7f3d0] bg-[#ecfdf5] px-1.5 py-0.5 text-[10px] font-semibold text-[#059669]">Approved</span>
                  )}
                </div>
              </div>

              {/* Owner-attached finalised document — Section B1 & Section H only */}
              {current && canEditCurrent && SECTION_UPLOAD_LABELS[current.id] && (() => {
                const up = sectionUploads[current.id]
                const label = SECTION_UPLOAD_LABELS[current.id]
                return (
                  <Card className="p-4">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
                          <UploadCloud size={15} style={{ color: '#0089cf' }} />
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>Upload completed {label}</p>
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
                {current && canEditCurrent && isSectionComplete(current) && unlockedSectionId !== current.id ? (
                  <ApprovedSectionSummary title={current.title} onEdit={() => setUnlockedSectionId(current.id)} />
                ) : current && current.kind === 'b1-chooser' ? (
                  canEditCurrent ? (
                    <B1CategoryChooser
                      selected={b1Category}
                      onConfirm={(cat) => { handleB1Select(cat); approveAndAdvance() }}
                      onBack={goToPrevSection}
                    />
                  ) : (
                    <Card className="p-6">
                      <h3 className="font-semibold text-slate-800 dark:text-slate-100">Section B1 — General Conditions of Contract</h3>
                      {b1Category ? (
                        <div className="mt-3 rounded-xl p-4" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.05), rgba(236,244,252,0.6))', border: '1px solid rgba(0,137,207,0.2)' }}>
                          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{B1_CATEGORY_MAP[b1Category]?.label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{B1_CATEGORY_MAP[b1Category]?.sub}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mt-3">{ownerDisplay(ownerOf('sectionB1'))} has not selected a General Conditions tier yet.</p>
                      )}
                      <p className="mt-4 text-[11px] font-medium flex items-center gap-1.5" style={{ color: '#64748b' }}>
                        <Eye size={12} /> Read-only — owned by {ownerDisplay(ownerOf('sectionB1'))}
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
                    readOnlyNote={readOnlyNoteFor(current.id)}
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
                      /* The Contract Engineer is the recipient — it approves its
                         own sections rather than sending them to itself, and once
                         they are all approved the button is spent: Draft & Export
                         below takes over as soon as every other owner is done. */
                      lastLabel={isLastOwn
                        ? (isExporter || isCreator ? 'Review & Approve' : 'Approve & Send to Contract Engineer')
                        : undefined}
                      nextDisabled={isExporter && isLastOwn && isSectionComplete(current)}
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
                      readOnlyNote={readOnlyNoteFor(current.id)}
                    />
                  )
                ) : null}
              </ErrorBoundary>
            </>
          )}

          {/* Export / handoff — Contract Engineer drafts & exports once all approved */}
          <Card className="flex flex-wrap items-center justify-between gap-3 p-4 sm:flex-nowrap sm:p-5">
            {isExporter ? (
              <>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Draft &amp; Export ITT</p>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {allSectionsComplete ? 'Every owner has approved their required sections - proceed to export.' : `${requiredPending} required section(s) still awaiting owner approval.`}
                  </p>
                </div>
                <Button variant="brand" className="shrink-0 flex items-center gap-2" disabled={!allSectionsComplete} onClick={() => {
                  if (draftTenderId) advanceTender(draftTenderId)
                  setIttApproved(true)
                  setStep(3)
                }}>
                  Proceed to Export <ArrowRight size={16} />
                </Button>
              </>
            ) : (
              <div className="flex items-start gap-2.5">
                <Info size={15} style={{ color: '#0089cf' }} className="mt-0.5 shrink-0" />
                <p className="text-xs text-slate-500">
                  {myPendingCount > 0 ? `Review and approve your ${myPendingCount} remaining section(s). ` : 'Your sections are approved and sent to the Contract Engineer. '}The Contract Engineer drafts and exports the ITT once every owner has approved.
                </p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Step 1: AI Generation (Contract Holder only) ── */}
      {step === 1 && isCreator && (
        <div className="flex items-center justify-center py-10">
          <AiAnalysisLoader
            className="max-w-md"
            title="AI is Generating Your ITT"
            description="Building your document based on project requirements and compliance standards"
            progress={(genStep / generationTasks.length) * 100}
            steps={generationTasks.map((task, i) => ({
              id: task,
              label: task,
              status: i < genStep ? 'complete' : i === genStep ? 'active' : 'pending',
            }))}
          />
        </div>
      )}

      {/* ── Step 3: Export ITT ── */}
      {/* ── ITT Exported & Created — the tender is advanced and marked exported the
           moment "Draft & Export ITT" is clicked, so step 3 always lands here. ── */}
      {step === 3 && (
        <Card className="p-12 text-center olng-scale-in">
          <div className="olng-success-ring mx-auto mb-5">
            <CheckCircle size={32} style={{ color: '#0089cf' }} />
          </div>
          <Badge variant="success" className="mb-3">ITT Exported</Badge>
          <h2 className="text-xl font-bold mb-1 text-slate-800 dark:text-slate-100">ITT Exported & Created</h2>
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
            <Button variant="brand" disabled={!packageDownloaded} onClick={() => navigate('/tenders')}>
              <FileText size={15} /> View in Tender Tracking
            </Button>
          </div>
          {!packageDownloaded && (
            <p className="text-[11px] mt-3" style={{ color: '#94a3b8' }}>
              Download the ITT package to continue.
            </p>
          )}
        </Card>
      )}
      </div>
    </section>
  )
}
