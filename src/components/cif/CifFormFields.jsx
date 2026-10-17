import { Briefcase, Building2, Calendar, Clock, DollarSign, Hash } from 'lucide-react'
import SearchableSelect from '../ui/SearchableSelect'
import DatePicker from '../ui/DatePicker'
import FieldErrorText from './FieldErrorText'
import TitleSuggestions from './TitleSuggestions'
import {
  BUDGET_HINT,
  CURRENCIES,
  MAX_CIF_TITLE_LENGTH,
  MAX_COST_CODE_LENGTH,
  MAX_SCOPE_OVERVIEW_LENGTH,
  MONTH_OPTIONS,
  PLACEHOLDERS,
  REQUIRED_FIELD_LABELS,
  TENDER_TYPES,
  YEAR_OPTIONS,
} from './cifConstants'
import { durationLabel, formatBudget, sanitizeCostCode } from './cifUtils'

const toOptions = list => list.map(v => ({ value: v, label: v }))
const TENDER_TYPE_OPTIONS = toOptions(TENDER_TYPES)
const CURRENCY_OPTIONS = toOptions(CURRENCIES)
const YEAR_SELECT_OPTIONS = YEAR_OPTIONS.map(v => ({ value: v, label: durationLabel(v, 'Year') }))
const MONTH_SELECT_OPTIONS = MONTH_OPTIONS.map(v => ({ value: v, label: durationLabel(v, 'Month') }))

const LABEL_CLASS = 'text-xs font-semibold mb-2 flex items-center gap-1'
const LABEL_STYLE = { color: '#1e293b' }
const SELECT_BUTTON_CLASS = 'px-3.5 py-2.5'

function Required() {
  return <span className="font-secondary" style={{ color: '#0089cf' }}>*</span>
}

function inputClass(hasError) {
  return `w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${hasError ? 'olng-input--error' : ''}`
}

/**
 * The Contract Initiating Form project-details grid (MAIN CifFormFields):
 * Project Title (with existing-tender suggestions on a new CIF), Tender Type,
 * Department / Entity, Estimated Budget + currency, Cost Code, Submission
 * Deadline, Contract Duration (years + months) and Scope Overview.
 */
export default function CifFormFields({
  form,
  onUpdate,
  departmentOptions,
  fieldError,
  minDeadline,
  titleSuggestions = [],
  onSelectTitleSuggestion,
  existingTenderNotice,
}) {
  const titleError = fieldError('title')
  const budgetError = fieldError('budget')
  const costCodeError = fieldError('costCode')
  const deadlineError = fieldError('deadline')
  const durationError = fieldError('durationYears') || fieldError('durationMonths')
  const descriptionError = fieldError('description')

  const titleInput = (combobox = {}) => (
    <input
      id="cif-title"
      aria-invalid={Boolean(titleError)}
      aria-describedby={titleError ? 'cif-title-error' : undefined}
      value={form.title}
      onChange={e => onUpdate({ title: e.target.value.trimStart() })}
      maxLength={MAX_CIF_TITLE_LENGTH}
      placeholder={PLACEHOLDERS.title}
      className={inputClass(Boolean(titleError))}
      {...combobox}
    />
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Project Title — full width */}
      <div className="md:col-span-2">
        <label htmlFor="cif-title" className={LABEL_CLASS} style={LABEL_STYLE}>
          {REQUIRED_FIELD_LABELS.title} <Required />
        </label>
        {onSelectTitleSuggestion ? (
          <TitleSuggestions query={form.title} suggestions={titleSuggestions} onSelect={onSelectTitleSuggestion}>
            {titleInput}
          </TitleSuggestions>
        ) : titleInput()}
        {existingTenderNotice && (
          <p role="status" className="mt-1.5 text-xs font-medium" style={{ color: '#0089cf' }}>
            {existingTenderNotice}
          </p>
        )}
        <FieldErrorText id="cif-title-error" message={titleError} />
      </div>

      {/* Tender Type */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>
          <Briefcase size={12} style={{ color: '#0089cf' }} aria-hidden="true" />
          {REQUIRED_FIELD_LABELS.tenderType} <Required />
        </label>
        <SearchableSelect
          ariaLabel={REQUIRED_FIELD_LABELS.tenderType}
          value={form.tenderType || null}
          onChange={v => onUpdate({ tenderType: v || '' })}
          options={TENDER_TYPE_OPTIONS}
          placeholder="Select tender type…"
          error={Boolean(fieldError('tenderType'))}
          buttonClassName={SELECT_BUTTON_CLASS}
        />
        <FieldErrorText message={fieldError('tenderType')} />
      </div>

      {/* Department / Entity */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>
          <Building2 size={12} style={{ color: '#0089cf' }} aria-hidden="true" />
          {REQUIRED_FIELD_LABELS.department} <Required />
        </label>
        <SearchableSelect
          ariaLabel={REQUIRED_FIELD_LABELS.department}
          value={form.department || null}
          onChange={v => onUpdate({ department: v || '' })}
          options={departmentOptions}
          placeholder="Select department…"
          searchPlaceholder="Search departments…"
          error={Boolean(fieldError('department'))}
          buttonClassName={SELECT_BUTTON_CLASS}
        />
        <FieldErrorText message={fieldError('department')} />
      </div>

      {/* Estimated Budget */}
      <div>
        <label htmlFor="cif-budget" className={LABEL_CLASS} style={LABEL_STYLE}>
          <DollarSign size={12} style={{ color: '#0089cf' }} aria-hidden="true" />
          {REQUIRED_FIELD_LABELS.budget} <Required />
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            ariaLabel="Currency"
            searchable={false}
            value={form.currency}
            onChange={v => onUpdate({ currency: v || form.currency })}
            options={CURRENCY_OPTIONS}
            className="w-28 shrink-0"
            buttonClassName={`${SELECT_BUTTON_CLASS} font-semibold`}
          />
          <input
            id="cif-budget"
            aria-invalid={Boolean(budgetError)}
            aria-describedby={budgetError ? 'cif-budget-error' : undefined}
            value={form.budget}
            onChange={e => onUpdate({ budget: formatBudget(e.target.value) })}
            placeholder={PLACEHOLDERS.budget}
            inputMode="numeric"
            className={`flex-1 min-w-0 ${inputClass(Boolean(budgetError))}`}
          />
        </div>
        <FieldErrorText id="cif-budget-error" message={budgetError} />
        {!budgetError && <p className="mt-1.5 text-[11px] text-slate-400">{BUDGET_HINT}</p>}
      </div>

      {/* Cost Code */}
      <div>
        <label htmlFor="cif-cost-code" className={LABEL_CLASS} style={LABEL_STYLE}>
          <Hash size={12} style={{ color: '#0089cf' }} aria-hidden="true" />
          {REQUIRED_FIELD_LABELS.costCode} <Required />
        </label>
        <input
          id="cif-cost-code"
          aria-invalid={Boolean(costCodeError)}
          aria-describedby={costCodeError ? 'cif-cost-code-error' : undefined}
          value={form.costCode}
          maxLength={MAX_COST_CODE_LENGTH}
          onChange={e => onUpdate({ costCode: sanitizeCostCode(e.target.value) })}
          placeholder={PLACEHOLDERS.costCode}
          className={inputClass(Boolean(costCodeError))}
        />
        <FieldErrorText id="cif-cost-code-error" message={costCodeError} />
      </div>

      {/* Submission Deadline */}
      <div>
        <label htmlFor="cif-deadline" className={LABEL_CLASS} style={LABEL_STYLE}>
          <Calendar size={12} style={{ color: '#0089cf' }} aria-hidden="true" />
          {REQUIRED_FIELD_LABELS.deadline} <Required />
        </label>
        <DatePicker
          id="cif-deadline"
          ariaLabel={REQUIRED_FIELD_LABELS.deadline}
          value={form.deadline}
          minKey={minDeadline}
          onChange={key => onUpdate({ deadline: key || '' })}
          placeholder="Pick a date"
          error={Boolean(deadlineError)}
          className="w-full"
        />
        <FieldErrorText id="cif-deadline-error" message={deadlineError} />
      </div>

      {/* Contract Duration */}
      <div>
        <label className={LABEL_CLASS} style={LABEL_STYLE}>
          <Clock size={12} style={{ color: '#0089cf' }} aria-hidden="true" />
          {REQUIRED_FIELD_LABELS.duration} <Required />
        </label>
        <div className="flex gap-2">
          <SearchableSelect
            ariaLabel="Duration - years"
            searchable={false}
            value={form.durationYears === '' ? null : form.durationYears}
            // Picking one half defaults the other to 0 the first time, never
            // overwriting a value the user already chose.
            onChange={v => onUpdate({
              durationYears: v ?? '',
              ...(form.durationMonths === '' ? { durationMonths: '0' } : {}),
            })}
            options={YEAR_SELECT_OPTIONS}
            placeholder="Years"
            error={Boolean(fieldError('durationYears'))}
            className="flex-1 min-w-0"
            buttonClassName={SELECT_BUTTON_CLASS}
          />
          <SearchableSelect
            ariaLabel="Duration - months"
            searchable={false}
            value={form.durationMonths === '' ? null : form.durationMonths}
            onChange={v => onUpdate({
              durationMonths: v ?? '',
              ...(form.durationYears === '' ? { durationYears: '0' } : {}),
            })}
            options={MONTH_SELECT_OPTIONS}
            placeholder="Months"
            error={Boolean(fieldError('durationMonths'))}
            className="flex-1 min-w-0"
            buttonClassName={SELECT_BUTTON_CLASS}
          />
        </div>
        <FieldErrorText message={durationError} />
      </div>

      {/* Scope Overview — full width */}
      <div className="md:col-span-2">
        <label htmlFor="cif-description" className={LABEL_CLASS} style={LABEL_STYLE}>
          {REQUIRED_FIELD_LABELS.description} <Required />
        </label>
        <textarea
          id="cif-description"
          rows={4}
          aria-invalid={Boolean(descriptionError)}
          aria-describedby={descriptionError ? 'cif-description-error' : undefined}
          value={form.description}
          onChange={e => onUpdate({ description: e.target.value.trimStart() })}
          maxLength={MAX_SCOPE_OVERVIEW_LENGTH}
          placeholder={PLACEHOLDERS.description}
          className={`${inputClass(Boolean(descriptionError))} resize-none`}
        />
        <div className="flex items-start justify-between gap-3">
          <FieldErrorText id="cif-description-error" message={descriptionError} />
          <p className="ml-auto mt-1.5 shrink-0 text-[11px] text-slate-400 tabular-nums">
            {form.description.length.toLocaleString()} / {MAX_SCOPE_OVERVIEW_LENGTH.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}
