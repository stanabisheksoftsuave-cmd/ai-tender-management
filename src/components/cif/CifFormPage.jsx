import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Sparkles, Target } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import { useTenders } from '../../context/TenderContext'
import { useAuth } from '../../context/AuthContext'
import { useBackHandler } from '../../context/NavigationContext'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import CifFormFields from './CifFormFields'
import CifAssignTeamCard from './CifAssignTeamCard'
import DuplicateWarningAlert from './DuplicateWarningAlert'
import {
  DEPARTMENTS,
  DURATION_FIELDS,
  REQUIRED_FIELD_LABELS,
  REQUIRED_FIELDS,
  SOW_GENERATION_DURATION_MS,
  SOW_GENERATION_HELPER_TEXT,
  SOW_GENERATION_STEPS,
  SOW_GENERATION_TICK_MS,
  SOW_HANDOFF_MS,
  BUDGET_DECIMAL_MESSAGE,
  BUDGET_TOO_LONG_MESSAGE,
  COST_CODE_TOO_LONG_MESSAGE,
  TITLE_SUGGESTION_LIMIT,
  ZERO_BUDGET_MESSAGE,
  ZERO_DURATION_MESSAGE,
} from './cifConstants'
import {
  assignmentsFromTender,
  buildSowBasis,
  buildTenderPayload,
  exceedsMaxBudgetIntegerDigits,
  exceedsMaxCostCodeLength,
  existingTenderDestination,
  existingTenderStatusLabel,
  findDuplicateWarning,
  generateSowContent,
  isTeamComplete,
  isZeroBudget,
  isZeroDuration,
  nextTenderId,
  tenderToCifForm,
  titleSuggestionsFor,
  todayKey,
} from './cifUtils'

const ALL_FIELDS_FLAGGED = Object.fromEntries(REQUIRED_FIELDS.map(key => [key, true]))
const DEPARTMENT_OPTIONS = DEPARTMENTS.map(d => ({ value: d, label: d }))

const hasSow = tender => Array.isArray(tender?.sowDocument?.sections) && tender.sowDocument.sections.length > 0
const normalizeTitle = value => String(value ?? '').trim().toLowerCase()

/**
 * `/contract-strategy/new` and `/contract-strategy/:tenderId` — the Contract
 * Initiating Form (MAIN CifFormPage + CifFormView). Saving happens on
 * "Generate SOW with AI": the tender is created (`cif_draft`) or updated, the
 * mock SOW is drafted behind the shared AI loader, and the page hands off to
 * `/contract-strategy/:id/sow`. An unchanged form whose SOW already exists
 * goes straight to it instead of regenerating over any edits.
 */
export default function CifFormPage({ tenderId, autoGenerate = false }) {
  const navigate = useNavigate()
  const { users } = useAuth()
  const { tenders, addTender, updateTender } = useTenders()

  const isNew = tenderId === 'new'
  const existingTender = isNew ? null : tenders.find(t => t.id === tenderId) || null

  const [form, setForm] = useState(() => tenderToCifForm(existingTender))
  const [assignments, setAssignments] = useState(() => assignmentsFromTender(existingTender))
  const [errors, setErrors] = useState({})
  const [duplicateWarning, setDuplicateWarning] = useState(null)
  const [selectedSuggestionId, setSelectedSuggestionId] = useState(null)
  const [viewState, setViewState] = useState('form') // 'form' | 'generating' | 'generated'
  const [completedSteps, setCompletedSteps] = useState(0)
  const [minDeadline] = useState(todayKey)

  const generatingRef = useRef(false)
  const timersRef = useRef([])
  const autoStartedRef = useRef(false)

  const updateForm = patch => setForm(prev => ({ ...prev, ...patch }))
  const updateAssignments = patch => setAssignments(prev => ({ ...prev, ...patch }))

  // An id that does not resolve has nothing to resume — back to the picker.
  const missingTender = !isNew && !existingTender
  useEffect(() => {
    if (missingTender && !generatingRef.current) navigate('/contract-strategy', { replace: true })
  }, [missingTender, navigate])

  useEffect(() => () => timersRef.current.forEach(clearTimeout), [])

  const rosters = useMemo(() => {
    const active = roleId => (users || []).filter(u => u.roleId === roleId && u.status === 'active')
    return { contractEngineers: active('pof'), hseOfficers: active('hse'), icvOfficers: active('icv') }
  }, [users])

  // A department saved before the current list keeps a selectable option.
  const departmentOptions = useMemo(() => (
    !form.department || DEPARTMENTS.includes(form.department)
      ? DEPARTMENT_OPTIONS
      : [...DEPARTMENT_OPTIONS, { value: form.department, label: form.department }]
  ), [form.department])

  // ── Title suggestions (new CIF only) ──
  const titleSuggestions = useMemo(
    () => (isNew ? titleSuggestionsFor(tenders, form.title, TITLE_SUGGESTION_LIMIT) : []),
    [isNew, tenders, form.title],
  )
  const selectedTender = selectedSuggestionId ? tenders.find(t => t.id === selectedSuggestionId) : null
  const linkedTender = selectedTender && normalizeTitle(form.title) === normalizeTitle(selectedTender.title)
    ? selectedTender
    : null
  const existingTenderNotice = linkedTender
    ? `This tender already exists (${existingTenderStatusLabel(linkedTender)}${linkedTender.stage ? `, ${linkedTender.stage}` : ''}). The button below takes you to its current step instead of creating a duplicate.`
    : undefined

  const handleSelectTitleSuggestion = (id) => {
    const tender = tenders.find(t => t.id === id)
    if (!tender) return
    setSelectedSuggestionId(id)
    setForm(tenderToCifForm(tender))
    setAssignments(assignmentsFromTender(tender))
  }

  // ── Validation (MAIN CifFormPage) ──
  const zeroDuration = isZeroDuration(form)
  const hasZeroDuration = zeroDuration && form.durationYears.trim() !== '' && form.durationMonths.trim() !== ''
  const hasDecimalBudget = form.budget.includes('.')
  const hasOversizedBudget = exceedsMaxBudgetIntegerDigits(form.budget)
  const hasZeroBudgetValue = isZeroBudget(form.budget)
  const hasOversizedCostCode = exceedsMaxCostCodeLength(form.costCode)
  const hasIncompleteTeam = !isTeamComplete(assignments, rosters)
  const hasMissingRequired = REQUIRED_FIELDS.some(key => form[key].trim() === '')
    || zeroDuration
    || hasDecimalBudget
    || hasOversizedBudget
    || hasZeroBudgetValue
    || hasOversizedCostCode
    || hasIncompleteTeam
  const showValidationBanner = Object.values(errors).some(Boolean) && hasMissingRequired

  const fieldError = (key) => {
    // Live: actively wrong input is flagged the moment it happens.
    if (key === 'budget' && hasOversizedBudget) return BUDGET_TOO_LONG_MESSAGE
    if (key === 'budget' && hasDecimalBudget) return BUDGET_DECIMAL_MESSAGE
    if (key === 'budget' && hasZeroBudgetValue) return ZERO_BUDGET_MESSAGE
    if (key === 'costCode' && hasOversizedCostCode) return COST_CODE_TOO_LONG_MESSAGE
    if (DURATION_FIELDS.includes(key) && hasZeroDuration) return ZERO_DURATION_MESSAGE
    // "Required" errors only after a blocked attempt.
    if (!errors[key]) return undefined
    const isUnset = form[key].trim() === '' || (DURATION_FIELDS.includes(key) && zeroDuration)
    return isUnset ? `${REQUIRED_FIELD_LABELS[key]} is required` : undefined
  }

  const later = (fn, ms) => { timersRef.current.push(setTimeout(fn, ms)) }

  const handleGenerate = ({ auto = false } = {}) => {
    if (linkedTender) {
      navigate(existingTenderDestination(linkedTender))
      return
    }
    if (generatingRef.current) return

    // A resumed draft that already has its SOW opens it straight away.
    if (auto && existingTender && hasSow(existingTender)) {
      navigate(`/contract-strategy/${existingTender.id}/sow`, { replace: true })
      return
    }
    if (hasMissingRequired) {
      setErrors(ALL_FIELDS_FLAGGED)
      return
    }

    const basis = buildSowBasis(form, assignments)
    if (existingTender && existingTender.sowBasis === basis && hasSow(existingTender)) {
      navigate(`/contract-strategy/${existingTender.id}/sow`, auto ? { replace: true } : undefined)
      return
    }

    generatingRef.current = true
    setDuplicateWarning(null)
    const payload = buildTenderPayload(form, assignments, rosters)
    let id
    let warning = null
    if (existingTender) {
      id = existingTender.id
      const stamp = !existingTender.cifProgressStage && existingTender.status === 'cif_draft'
        ? { cifProgressStage: 'cif_creation' }
        : {}
      updateTender(id, { ...payload, ...stamp })
    } else {
      id = nextTenderId(tenders)
      warning = findDuplicateWarning(tenders, form, null)
      addTender({
        id,
        ...payload,
        status: 'cif_draft',
        stage: 'Contract Initiating Form',
        cifProgressStage: 'cif_creation',
        created: todayKey(),
        bidders: 0,
        bidderList: [],
        aiScore: null,
      })
      setDuplicateWarning(warning)
    }

    setCompletedSteps(0)
    setViewState('generating')
    const snapshot = form
    later(() => {
      const sow = generateSowContent(snapshot, snapshot.costCode.trim())
      updateTender(id, { sowDocument: sow, sowBasis: basis })
      setViewState('generated')
      later(() => {
        generatingRef.current = false
        navigate(`/contract-strategy/${id}/sow`, {
          replace: isNew || auto,
          state: warning ? { duplicateWarning: warning } : undefined,
        })
      }, SOW_HANDOFF_MS)
    }, SOW_GENERATION_DURATION_MS)
  }

  // MAIN `requestAutoGenerate`: a draft resumed from the picker at CIF
  // creation runs Generate on arrival. Deferred a tick so it never sets state
  // synchronously inside the effect.
  const existingId = existingTender?.id
  useEffect(() => {
    if (!autoGenerate || autoStartedRef.current || !existingId) return undefined
    // The flag is set when the timer fires, not here: StrictMode's mount →
    // cleanup → remount would otherwise cancel the run and block the retry.
    const timer = setTimeout(() => {
      autoStartedRef.current = true
      handleGenerate({ auto: true })
    }, 0)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, existingId])

  // Decorative step ticker — holds on the last step until the document lands.
  useEffect(() => {
    if (viewState !== 'generating' || completedSteps >= SOW_GENERATION_STEPS.length - 1) return undefined
    const timer = setTimeout(() => setCompletedSteps(c => c + 1), SOW_GENERATION_TICK_MS)
    return () => clearTimeout(timer)
  }, [viewState, completedSteps])

  const isBusy = viewState !== 'form'
  useAiLockWhile(isBusy, 'Generating the Statement of Work')
  // Generation is not cancellable: Back is swallowed until the hand-off.
  useBackHandler(() => isBusy, [isBusy])

  if (missingTender && viewState === 'form') return null

  if (isBusy) {
    const total = SOW_GENERATION_STEPS.length
    const isComplete = viewState === 'generated'
    const effective = isComplete ? total : Math.min(completedSteps, total - 1)
    const steps = SOW_GENERATION_STEPS.map((label, index) => ({
      id: String(index),
      label,
      status: index < effective ? 'complete' : index === effective ? 'active' : 'pending',
    }))
    return (
      <div className="pb-12 flex flex-col items-center gap-4 pt-10">
        <AiAnalysisLoader
          title="AI is Generating Your SOW"
          description="Building the Statement of Work document from your contract details and compliance standards"
          steps={steps}
          progress={isComplete ? 100 : (effective / total) * 100}
          helperText={SOW_GENERATION_HELPER_TEXT}
          className="w-full max-w-md"
        />
      </div>
    )
  }

  const costCode = form.costCode.trim()

  return (
    <div className="pb-6 w-full">
      {/* Header Card */}
      <Card className="p-4 sm:p-5 mb-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm olng-slide-up">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
            <Target size={16} style={{ color: '#0089cf' }} aria-hidden="true" />
          </div>
          <h2 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
            {costCode ? `Contract Strategy - ${costCode}` : 'New Contract Strategy'}
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Define the contract details for this tender. AI will generate a Statement of Work document from your inputs before proceeding to Pre-Qualification.
        </p>
      </Card>

      <DuplicateWarningAlert warning={duplicateWarning} onDismiss={() => setDuplicateWarning(null)} className="mb-5" />

      {/* Contract Initiating Form */}
      <Card className="p-4 sm:p-6 space-y-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm olng-slide-up" style={{ animationDelay: '60ms' }}>
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 shrink-0 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }} aria-hidden="true">
            <FileText size={16} style={{ color: '#0089cf' }} />
          </span>
          <h3 className="font-semibold text-[15px]" style={{ color: '#1e293b' }}>Contract Initiating Form</h3>
        </div>
        <CifFormFields
          form={form}
          onUpdate={updateForm}
          departmentOptions={departmentOptions}
          fieldError={fieldError}
          minDeadline={minDeadline}
          titleSuggestions={titleSuggestions}
          onSelectTitleSuggestion={isNew ? handleSelectTitleSuggestion : undefined}
          existingTenderNotice={existingTenderNotice}
        />
      </Card>

      <CifAssignTeamCard
        assignments={assignments}
        onChange={updateAssignments}
        rosters={rosters}
        showError={showValidationBanner}
      />

      {/* Generate SOW */}
      <div className="mt-4 olng-slide-up" style={{ animationDelay: '120ms' }}>
        <Button
          type="button"
          variant="brand"
          onClick={() => handleGenerate()}
          disabled={!linkedTender && hasMissingRequired}
          className="w-full justify-center py-3 px-6 text-[15px]"
        >
          <Sparkles size={16} aria-hidden="true" />
          Generate SOW with AI
        </Button>
      </div>

      {!showValidationBanner && (
        <p className="text-[11px] text-slate-400 text-center leading-relaxed mt-2">
          AI will generate a detailed Statement of Work document based on your contract details.
        </p>
      )}
    </div>
  )
}
