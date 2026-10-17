import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle, Plus, Sparkles, Undo2 } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import { useBackHandler } from '../../context/NavigationContext'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { tenderRef } from '../../utils/tenderRef'
import {
  EMPTY_VALUE_TEXT, PASSING_SCORE_RANGE_MESSAGE, SCORE_ZERO_FIELD_ID, SCORE_ZERO_WARNING, TEM_ID,
  artefactRegisterGenerationSteps, collectInvalidFields, emptyRow, formatAmount, generateAiRows, isMultilineField,
  isNumericField, isScoreZeroMissing, isScoreZeroRequired, isUnsetMustGate, isValidPassingScore, normaliseRows,
  overallRiskLevel, parseDecimal, preserveLockedNegotiationRows, riskLevelTextClass, temWeightings, validateTemField,
} from '../../utils/strategyTemplates'
import ArtefactRowCard from './ArtefactRowCard'
import ConfirmDialog from './ConfirmDialog'
import { COMPUTED_BOX_CLASS } from './styles'

const TICK_MS = 550
const HOLD_MS = 700

const fieldText = field => `${field.id} ${field.label}`
const UNIT_PRICE_PATTERN = /unit[\s_]*price/i
const TOTAL_PRICE_PATTERN = /total[\s_]*price/i

/** MAIN's per-page layout choice for which fields span the whole row. */
const FULL_WIDTH_RULES = {
  'company-estimate': f => f.type === 'text' && !isNumericField(f) && !/\b(uom|unit of measure)\b/i.test(fieldText(f)),
  'contract-risk': f => f.type === 'text' && isMultilineField(f),
  icv: f => f.type === 'text' && !isNumericField(f),
  'technical-eval-matrix': f => f.type === 'text',
  'hse-risk': f => f.type === 'text' && isMultilineField(f),
  'negotiation-strategy': f => f.type !== 'select',
}

const RISK_LEVEL_FIELD = { 'contract-risk': 'riskRating', 'hse-risk': 'riskLevel' }

const isLockedField = field => field.locked === true

/** Pluralised row label for the regenerate prompt (RegenerateRowsDialog). */
const pluralise = (label, count) => (count === 1 ? label.toLowerCase() : `${label.toLowerCase()}s`)

function OverallRiskPill({ label, value }) {
  return (
    <div className="flex items-center gap-2 py-1.5 sm:px-3">
      <span className="text-xs font-semibold text-slate-400">{label}</span>
      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border border-slate-300 bg-slate-50 ${riskLevelTextClass(value)}`}>
        {value || EMPTY_VALUE_TEXT}
      </span>
    </div>
  )
}

function WarningAlert({ title, children, action }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800" role="alert">
      <AlertTriangle size={15} className="shrink-0 mt-px text-amber-500" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="break-words">{children}</div>
        {action}
      </div>
    </div>
  )
}

/**
 * One strategy template's register (MAIN's shared artefact-page pattern —
 * CompanyEstimatePage, ContractRiskPage, IcvPage, TechnicalEvaluationPage,
 * HseRiskPage, NegotiationPage): AI generation with a cancellable loader that
 * holds the app-wide AI lock, row cards, Regenerate / Add / Cancel / Submit,
 * discard-on-cancel back to the rows the page opened with, and the
 * per-template extras (grand total, overall risk, TEM thresholds).
 *
 * Rows autosave as a draft (`tender.templateDrafts[id]`); Submit writes them to
 * the template's dataKey and stamps `templateMeta[id]`.
 */
export default function TemplateRegister({ template, tender, tenderId, autogen, navigate, updateTender }) {
  const isTem = template.id === TEM_ID
  const hasSow = Boolean(tender.sowDocument)
  const hubHref = `/strategy-templates/${tenderId}`

  const [rows, setRows] = useState(() =>
    normaliseRows(tender.templateDrafts?.[template.id] ?? tender[template.dataKey], template.id))
  // The rows the page opened with — "Discard changes" goes back to these.
  const [snapshot] = useState(rows)
  // Auto-generate only right after "Open form" (autogen=1) on an empty register.
  const [gen, setGen] = useState(() => (
    autogen && rows.length === 0 && hasSow ? { phase: 'running', step: 0, previousRows: null } : null
  ))
  const [attempts, setAttempts] = useState(0)
  const [isRegenerateOpen, setIsRegenerateOpen] = useState(false)
  const [isDiscardOpen, setIsDiscardOpen] = useState(false)
  const [passingScoreDraft, setPassingScoreDraft] = useState(() => (
    tender.temPassingScore === undefined || tender.temPassingScore === null ? '' : String(tender.temPassingScore)
  ))
  const [passingScoreError, setPassingScoreError] = useState(null)
  const [passingScoreSaved, setPassingScoreSaved] = useState(false)

  const isGenerating = gen !== null
  const steps = artefactRegisterGenerationSteps(template.rowLabel)
  useAiLockWhile(isGenerating, `Generating ${template.rowLabel}s with AI`)

  // Latest tender for timers (drafts are merged into whatever is stored now).
  const latestTender = useRef(tender)
  useEffect(() => { latestTender.current = tender })
  const isClosing = useRef(false)

  // ── Decorative generation narration, then the AI rows land ──
  useEffect(() => {
    if (!gen) return undefined
    if (gen.phase === 'running') {
      const timer = setTimeout(() => {
        setGen(current => {
          if (!current || current.phase !== 'running') return current
          return current.step < steps.length - 1 ? { ...current, step: current.step + 1 } : { ...current, phase: 'complete' }
        })
      }, TICK_MS)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      const fresh = generateAiRows(template.id, latestTender.current)
      const previous = gen.previousRows || []
      setRows(template.id === 'negotiation-strategy' ? preserveLockedNegotiationRows(previous, fresh) : fresh)
      setGen(null)
    }, HOLD_MS)
    return () => clearTimeout(timer)
  }, [gen, steps.length, template.id])

  // ── Autosave the rows as a draft (MAIN's debounced row save) ──
  const lastPersisted = useRef(JSON.stringify(rows))
  useEffect(() => {
    if (isGenerating) return undefined
    const serial = JSON.stringify(rows)
    if (serial === lastPersisted.current) return undefined
    const timer = setTimeout(() => {
      if (isClosing.current) return
      lastPersisted.current = serial
      const drafts = latestTender.current?.templateDrafts || {}
      updateTender(tenderId, { templateDrafts: { ...drafts, [template.id]: rows } })
    }, 500)
    return () => clearTimeout(timer)
  }, [rows, isGenerating, tenderId, template.id, updateTender])

  // ── Validation (use-register-validation) ──
  const extraRule = isTem ? validateTemField : undefined
  const invalid = collectInvalidFields(rows, template.fields, { extraRule, isFieldLocked: isLockedField })
  const isPassingScoreValid = isValidPassingScore(passingScoreDraft.trim())
  const extraInvalidCount = isTem && !isPassingScoreValid ? 1 : 0
  const canSubmit = rows.length > 0 && invalid.size + extraInvalidCount === 0
  const showValidationErrors = attempts > 0

  useEffect(() => {
    if (attempts === 0) return
    document.querySelector('[aria-invalid="true"]')?.focus()
  }, [attempts])

  const savedPassingScore = tender.temPassingScore === undefined || tender.temPassingScore === null ? '' : String(tender.temPassingScore)
  const isPassingScoreDirty = isTem && passingScoreDraft.trim() !== savedPassingScore
  const hasChanges = JSON.stringify(rows) !== JSON.stringify(snapshot) || isPassingScoreDirty

  // ── Actions ──
  const startGeneration = (replace = false) => {
    if (!hasSow || isGenerating) return
    setGen({ phase: 'running', step: 0, previousRows: replace ? rows : null })
  }

  const cancelGeneration = () => setGen(null)

  const updateField = (rowId, fieldId, value) => {
    setRows(prev => prev.map(row => (row._id === rowId ? { ...row, [fieldId]: value } : row)))
  }

  const removeRow = rowId => setRows(prev => prev.filter(row => row._id !== rowId))

  const addRow = () => {
    if (invalid.size > 0) {
      setAttempts(prev => prev + 1)
      return
    }
    setAttempts(0)
    setRows(prev => [...prev, emptyRow(template)])
  }

  const leaveToHub = () => {
    isClosing.current = true
    navigate(hubHref)
  }

  const confirmDiscard = () => {
    setIsDiscardOpen(false)
    const drafts = { ...(latestTender.current?.templateDrafts || {}) }
    const submitted = normaliseRows(latestTender.current?.[template.dataKey], template.id)
    if (JSON.stringify(snapshot) === JSON.stringify(submitted)) delete drafts[template.id]
    else drafts[template.id] = snapshot
    updateTender(tenderId, { templateDrafts: drafts })
    leaveToHub()
  }

  const handleCancel = () => {
    cancelGeneration()
    if (hasChanges) {
      setIsDiscardOpen(true)
      return
    }
    leaveToHub()
  }

  useBackHandler(() => {
    if (!hasChanges) return false
    cancelGeneration()
    setIsDiscardOpen(true)
    return true
  })

  const savePassingScore = () => {
    const value = passingScoreDraft.trim()
    setPassingScoreSaved(false)
    if (!isValidPassingScore(value)) {
      setPassingScoreError(PASSING_SCORE_RANGE_MESSAGE)
      return false
    }
    setPassingScoreError(null)
    updateTender(tenderId, { temPassingScore: Number(value) })
    setPassingScoreDraft(String(Number(value)))
    setPassingScoreSaved(true)
    return true
  }

  const weightings = isTem ? temWeightings(rows) : null

  const handleSubmit = () => {
    if (!canSubmit) {
      setAttempts(prev => prev + 1)
      if (isTem && !isPassingScoreValid) setPassingScoreError(PASSING_SCORE_RANGE_MESSAGE)
      return
    }
    const latest = latestTender.current || tender
    const drafts = { ...(latest.templateDrafts || {}) }
    delete drafts[template.id]
    const changes = {
      [template.dataKey]: rows,
      templateDrafts: drafts,
      templateMeta: {
        ...(latest.templateMeta || {}),
        [template.id]: { aiGenerated: rows.some(row => row._source === 'ai'), submittedAt: new Date().toISOString() },
      },
    }
    if (isTem) {
      changes.temPassingScore = Number(passingScoreDraft.trim())
      changes.temSectionWeightings = weightings.sections
    }
    updateTender(tenderId, changes)
    leaveToHub()
  }

  // ── Per-template extras ──
  const currency = String(tender.currency || '').trim()
  const fieldCurrency = template.id === 'company-estimate'
    ? field => (UNIT_PRICE_PATTERN.test(fieldText(field)) ? currency : null)
    : undefined

  const renderComputedField = (field, value, fieldId) => {
    if (template.id === 'company-estimate' && TOTAL_PRICE_PATTERN.test(fieldText(field))) {
      return (
        <div id={fieldId} className={`${COMPUTED_BOX_CLASS} gap-2`}>
          <span className="text-xs font-semibold text-slate-400">{currency || EMPTY_VALUE_TEXT}</span>
          <span>{value || EMPTY_VALUE_TEXT}</span>
        </div>
      )
    }
    if (RISK_LEVEL_FIELD[template.id] === field.id) {
      return <div id={fieldId} className={`${COMPUTED_BOX_CLASS} ${riskLevelTextClass(value)}`}>{value || EMPTY_VALUE_TEXT}</div>
    }
    if (isTem) {
      const needsMinScore = field.id === 'gate' && isUnsetMustGate(value)
      return (
        <div
          id={fieldId}
          className={`flex min-h-[38px] w-full items-center rounded-lg border border-dashed px-3 text-sm ${needsMinScore ? 'border-amber-300 bg-amber-50 font-semibold text-amber-700' : 'border-slate-300 bg-slate-50 text-slate-500'}`}
        >
          {value || EMPTY_VALUE_TEXT}
        </div>
      )
    }
    return <div id={fieldId} className={COMPUTED_BOX_CLASS}>{value || EMPTY_VALUE_TEXT}</div>
  }

  const lineTotals = template.id === 'company-estimate'
    ? rows
      .map(row => [parseDecimal(row.quantity), parseDecimal(row.unitRate)])
      .filter(([quantity, unitPrice]) => quantity !== null && unitPrice !== null)
      .map(([quantity, unitPrice]) => quantity * unitPrice)
    : []
  const grandTotal = lineTotals.length > 0 ? formatAmount(lineTotals.reduce((sum, value) => sum + value, 0)) : ''

  const riskField = RISK_LEVEL_FIELD[template.id]
  const overallRisk = riskField
    ? overallRiskLevel(rows.map(row => template.fields.find(f => f.id === riskField).compute(row)))
    : ''

  const totalWeighting = weightings?.total
  const weightingTotalsCorrectly = totalWeighting === 100
  const mustsMissingMin = isTem && rows.some(row => row.criteriaType === 'Must' && !String(row.minScore ?? '').trim())
  const wantsMissingScoreZero = isTem
    ? rows.map((row, index) => ({ row, position: index + 1 })).filter(({ row }) => isScoreZeroMissing(row))
    : []

  let headerActions = null
  if (riskField) headerActions = <OverallRiskPill label="Overall Risk" value={overallRisk} />
  if (isTem) {
    headerActions = (
      <div className="flex items-center gap-2 py-1.5 sm:px-3">
        <span className="text-xs font-semibold text-slate-400">Total Weighting</span>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${weightingTotalsCorrectly ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-amber-300 bg-amber-50 text-amber-700'}`}>
          {totalWeighting === null || totalWeighting === undefined ? EMPTY_VALUE_TEXT : formatAmount(totalWeighting)}
        </span>
      </div>
    )
  }

  const Icon = template.icon
  const completedSteps = gen ? (gen.phase === 'complete' ? steps.length : gen.step) : 0
  const loaderSteps = steps.map((label, index) => ({
    id: String(index),
    label,
    status: index < completedSteps ? 'complete' : index === completedSteps ? 'active' : 'pending',
  }))
  const busy = isGenerating

  return (
    <div className="space-y-5 w-full pb-4">
      {/* Header card (MAIN TemplateHeaderCard) */}
      <Card className="p-4 olng-slide-up">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0089cf]/12 to-[#0089cf]/3 text-[#0089cf]">
              <Icon size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-[15px] font-bold text-slate-800">{template.title}</h2>
              <p className="text-[11px] text-slate-400 sm:truncate">{template.description}</p>
            </div>
          </div>
          {headerActions && <div className="flex shrink-0 items-center gap-2">{headerActions}</div>}
        </div>
        {template.id === 'contract-risk' && (
          <div className="mt-4 border-t border-slate-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-semibold text-slate-400">Contract Title</span>
              <p className="text-sm text-slate-800 break-words">{tender.title || EMPTY_VALUE_TEXT}</p>
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400">Contract Number</span>
              <p className="text-sm text-slate-800 break-words">{tenderRef(tender) || EMPTY_VALUE_TEXT}</p>
            </div>
          </div>
        )}
      </Card>

      {!hasSow && !isGenerating && (
        <WarningAlert
          action={(
            <button
              type="button"
              onClick={() => navigate(`/contract-strategy/${tenderId}`)}
              className="mt-1.5 text-xs font-bold text-amber-700 hover:underline"
            >
              Go to the Statement of Work step
            </button>
          )}
        >
          No SOW is available to generate from - generate one on the Contract Strategy screen first.
        </WarningAlert>
      )}

      {isGenerating ? (
        <div className="flex justify-center py-10">
          <AiAnalysisLoader
            className="max-w-md"
            title={`Generating ${template.rowLabel}s with AI`}
            description="AI is building the template data based on your contract details..."
            steps={loaderSteps}
            progress={(completedSteps / steps.length) * 100}
          />
        </div>
      ) : (
        <div className="space-y-5">
          {isTem && (
            <Card className="p-4 sm:p-6 space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-800">Scoring thresholds</h3>
                <p className="mt-1 text-xs text-slate-500">
                  The overall minimum passing weighted score, and the weighting each Part contributes. The ITT cannot be issued until the passing score is set.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[180px] flex-1">
                  <div className="mb-1.5 flex items-center gap-1">
                    <label htmlFor="tem-passing-score" className="block text-xs font-semibold text-slate-500">
                      Overall minimum passing score (%)
                    </label>
                    <span className="text-red-500" aria-hidden="true">*</span>
                  </div>
                  <p id="tem-passing-score-hint" className="mb-1.5 text-xs text-slate-400">Percentage of the maximum weighted total</p>
                  <input
                    id="tem-passing-score"
                    type="text"
                    inputMode="numeric"
                    maxLength={3}
                    value={passingScoreDraft}
                    aria-required="true"
                    aria-invalid={passingScoreError !== null || (passingScoreDraft.trim() !== '' && !isPassingScoreValid)}
                    aria-describedby={passingScoreError ? 'tem-passing-score-hint tem-passing-score-error' : 'tem-passing-score-hint'}
                    onChange={event => {
                      const next = event.target.value
                      if (!/^\d*$/.test(next)) return
                      setPassingScoreDraft(next.slice(0, 3))
                      setPassingScoreError(null)
                      setPassingScoreSaved(false)
                    }}
                    className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm transition-colors focus:border-[#0089cf] focus:ring-2 focus:ring-[#0089cf]/20 focus:outline-none"
                  />
                </div>
                <Button type="button" variant="secondary" onClick={savePassingScore} disabled={!isPassingScoreValid}>
                  Save passing score
                </Button>
                {passingScoreSaved && <span className="pb-2.5 text-xs font-semibold text-emerald-600">Saved</span>}
              </div>
              {(passingScoreError || (passingScoreDraft.trim() !== '' && !isPassingScoreValid)) && (
                <p id="tem-passing-score-error" className="text-xs font-semibold text-red-600">
                  {passingScoreError || PASSING_SCORE_RANGE_MESSAGE}
                </p>
              )}
              {Object.keys(weightings.sections).length > 0 && (
                <div className="space-y-1.5 border-t border-dashed border-slate-300 pt-4">
                  {Object.entries(weightings.sections).map(([part, weight]) => (
                    <div key={part} className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-slate-500">{part}</span>
                      <span className="shrink-0 font-semibold text-slate-800">{formatAmount(weight)}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between gap-3 border-t border-slate-200 pt-1.5 text-xs">
                    <span className="font-semibold text-slate-800">Total</span>
                    <span className={`font-bold ${weightingTotalsCorrectly ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {totalWeighting === null ? EMPTY_VALUE_TEXT : formatAmount(totalWeighting)}
                    </span>
                  </div>
                  {!weightingTotalsCorrectly && (
                    <p className="text-[11px] font-medium text-amber-600">The Part weightings should total 100.</p>
                  )}
                </div>
              )}
            </Card>
          )}

          {isTem && mustsMissingMin && (
            <WarningAlert title="A Must criterion has no minimum score">
              Every criterion marked <span className="font-semibold">Must</span> needs a minimum score before the ITT can be
              issued. The highlighted <span className="font-semibold">Gate</span> below marks each one.
            </WarningAlert>
          )}

          {isTem && wantsMissingScoreZero.length > 0 && (
            <WarningAlert title="A Want criterion has no Score 0 description">
              Every criterion marked <span className="font-semibold">Want</span> needs a Score 0 description before the ITT
              can be issued. You can still save and submit this matrix. Add one to:
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {wantsMissingScoreZero.map(({ row, position }) => (
                  <li key={row._id}>
                    {template.rowLabel} #{position}
                    {String(row.criterion ?? '').trim() ? ` - ${String(row.criterion).trim()}` : ''}
                  </li>
                ))}
              </ul>
            </WarningAlert>
          )}

          {rows.length > 0 ? (
            <div className="flex justify-end">
              <Button
                type="button"
                variant="brand"
                size="sm"
                disabled={!hasSow}
                onClick={() => setIsRegenerateOpen(true)}
                className="flex items-center gap-1.5"
              >
                <Sparkles size={14} aria-hidden="true" /> Regenerate with AI
              </Button>
            </div>
          ) : (
            <Card className="p-8 flex flex-col items-center text-center gap-3" style={{ borderStyle: 'dashed' }}>
              <span className="flex w-12 h-12 items-center justify-center rounded-full bg-[#0089cf]/10 text-[#0089cf]">
                <Sparkles size={22} aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-semibold text-slate-800">No {template.rowLabel.toLowerCase()}s yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Let AI pre-fill this template from the contract details, or add a {template.rowLabel.toLowerCase()} yourself.
                </p>
              </div>
              <Button
                type="button"
                variant="brand"
                disabled={!hasSow}
                onClick={() => startGeneration(false)}
                className="flex items-center gap-1.5"
              >
                <Sparkles size={14} aria-hidden="true" /> Generate with AI
              </Button>
            </Card>
          )}

          {rows.map((row, index) => (
            <ArtefactRowCard
              key={row._id}
              row={row}
              index={index}
              fields={template.fields}
              rowLabel={template.rowLabel}
              showValidationErrors={showValidationErrors}
              isFullWidth={FULL_WIDTH_RULES[template.id]}
              renderComputedField={renderComputedField}
              validateField={extraRule}
              isFieldLocked={isLockedField}
              isFieldRequired={isTem ? (field, r) => field.id === SCORE_ZERO_FIELD_ID && isScoreZeroRequired(r) : undefined}
              getFieldWarning={isTem ? (field, r) => (field.id === SCORE_ZERO_FIELD_ID && isScoreZeroMissing(r) ? SCORE_ZERO_WARNING : undefined) : undefined}
              isRowIncomplete={isTem ? isScoreZeroMissing : undefined}
              fieldCurrency={fieldCurrency}
              onFieldChange={updateField}
              onRemove={removeRow}
            />
          ))}

          {template.id === 'company-estimate' && rows.length > 0 && (
            <div className="rounded-xl bg-slate-50 border-y border-slate-200 py-4 px-4 sm:py-6 sm:px-6 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="text-base sm:text-lg font-bold text-slate-800">GRAND TOTAL</div>
              <div className="flex min-w-0 items-baseline gap-2 text-xl sm:text-2xl font-extrabold text-slate-800 tabular-nums break-all">
                {grandTotal && currency && <span className="text-base font-semibold text-slate-400">{currency}</span>}
                <span>{grandTotal || EMPTY_VALUE_TEXT}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {!busy ? (
          <Button type="button" variant="secondary" onClick={addRow} className="flex items-center gap-1.5">
            <Plus size={14} aria-hidden="true" /> Add {template.rowLabel}
          </Button>
        ) : <span />}
        <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
          <Button
            type="button"
            variant="brand"
            onClick={handleSubmit}
            disabled={busy || rows.length === 0}
            aria-describedby={!canSubmit ? 'template-submit-hint' : undefined}
            className="flex items-center gap-1.5"
          >
            <CheckCircle size={14} aria-hidden="true" /> Submit Template
          </Button>
        </div>
      </div>
      {!canSubmit && (
        <p id="template-submit-hint" className={showValidationErrors ? 'text-right text-[11px] font-medium text-red-600' : 'sr-only'}>
          {rows.length > 0 ? 'Fill in every required field before submitting.' : 'Nothing to submit yet.'}
        </p>
      )}

      <ConfirmDialog
        isOpen={isDiscardOpen}
        icon={Undo2}
        title="Discard your changes?"
        description="Your changes to this template will be discarded and it will go back to how it was when you opened it. This cannot be undone."
        confirmLabel="Discard changes"
        cancelLabel="Keep Editing"
        confirmVariant="danger"
        onConfirm={confirmDiscard}
        onClose={() => setIsDiscardOpen(false)}
      />
      <ConfirmDialog
        isOpen={isRegenerateOpen}
        icon={Sparkles}
        title="Regenerate this template?"
        description={`AI will generate this template again and replace the ${rows.length} ${pluralise(template.rowLabel, rows.length)} currently in this template, including any edits you made. Is that okay?`}
        confirmLabel="Regenerate"
        cancelLabel="Keep current"
        onConfirm={() => {
          setIsRegenerateOpen(false)
          startGeneration(true)
        }}
        onClose={() => setIsRegenerateOpen(false)}
      />
    </div>
  )
}
