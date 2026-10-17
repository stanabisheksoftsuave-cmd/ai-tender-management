import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  EMPTY_VALUE_TEXT, capNumericValue, fieldTextLimit, formatConfidence, isMultilineField, isNumericField,
  numericFieldError, optionsWithCurrent,
} from '../../utils/strategyTemplates'
import { COMPUTED_BOX_CLASS } from './styles'

const INPUT_CLASS =
  'w-full min-h-[38px] rounded-[10px] border bg-white px-3 py-2 text-sm text-slate-800 shadow-[0_1px_3px_rgba(27,76,111,0.04)] transition-colors focus:border-[#0089cf] focus:ring-2 focus:ring-[#0089cf]/20 focus:outline-none disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

const BAND_DISPLAY = {
  high: { label: 'High confidence', className: 'bg-emerald-50 text-emerald-700 ring-emerald-200' },
  medium: { label: 'Medium confidence', className: 'bg-amber-50 text-amber-700 ring-amber-200' },
  low: { label: 'Low confidence', className: 'bg-red-50 text-red-700 ring-red-200' },
}

const PILL = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1'

/** The AI confidence indicator (MAIN ConfidenceBadge) — nothing for a row with no AI score. */
function ConfidenceBadge({ band, score }) {
  const display = band ? BAND_DISPLAY[band] : null
  if (!display) return null
  const percent = typeof score === 'number' ? formatConfidence(score) : null
  return (
    <span
      tabIndex={0}
      title={percent ? `AI confidence score: ${percent}` : 'AI confidence score unavailable'}
      className={`${PILL} ${display.className} focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0089cf]`}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-current" aria-hidden="true" />
      {display.label}{percent ? ` · ${percent}` : ''}
    </span>
  )
}

/**
 * One register row as a card (MAIN ArtefactRowFields): "{rowLabel} #n",
 * confidence / Imported / Incomplete badges, delete, and every field rendered
 * by MAIN's rules — select, computed (read-only), numeric (decimal text input
 * with a 13-digit integer cap), textarea for long answers, text otherwise.
 */
export default function ArtefactRowCard({
  row,
  index,
  fields,
  rowLabel,
  showValidationErrors,
  disabled = false,
  isFullWidth,
  renderComputedField,
  validateField,
  isFieldLocked,
  isFieldRequired,
  getFieldWarning,
  isRowIncomplete,
  fieldCurrency,
  onFieldChange,
  onRemove,
}) {
  const [touched, setTouched] = useState({})
  const touch = fieldId => setTouched(prev => (prev[fieldId] ? prev : { ...prev, [fieldId]: true }))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_1px_4px_rgba(27,76,111,0.08),0_4px_16px_rgba(27,76,111,0.12)] p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="min-w-0 text-[11px] font-bold tracking-wider break-words text-[#0089cf] uppercase">
          {rowLabel} #{index + 1}
        </h3>
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {row._source === 'imported'
            ? <span className={`${PILL} bg-slate-100 text-slate-600 ring-slate-200`}>Imported</span>
            : <ConfidenceBadge band={row._band} score={row._confidence} />}
          {isRowIncomplete?.(row) && <span className={`${PILL} bg-amber-50 text-amber-700 ring-amber-200`}>Incomplete</span>}
          <button
            type="button"
            aria-label={`Delete ${rowLabel} #${index + 1}`}
            title={`Delete ${rowLabel}`}
            disabled={disabled}
            onClick={() => onRemove(row._id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {fields.map(field => {
          const fieldId = `${row._id}-${field.id}`
          const isLocked = isFieldLocked?.(field) ?? false
          const isComputed = field.type === 'computed'
          const value = isComputed ? String(field.compute(row) ?? '') : String(row[field.id] ?? '')
          const isNumeric = !isComputed && field.type !== 'select' && isNumericField(field)
          const textLimit = isLocked || isComputed || field.type === 'select' || isNumeric ? undefined : fieldTextLimit(field)
          const limitMessage = textLimit !== undefined && value.length >= textLimit ? `Limit reached: ${textLimit} characters.` : undefined
          const required = (field.required || (isFieldRequired?.(field, row) ?? false)) && !isLocked && !isComputed
          const fieldError = !isLocked && !isComputed && (showValidationErrors || touched[field.id])
            ? (field.required && value.trim() === ''
              ? 'This field is required.'
              : (numericFieldError(field, value) ?? validateField?.(field, value)))
            : undefined
          const shownError = fieldError ?? limitMessage
          const warning = isLocked ? undefined : getFieldWarning?.(field, row)
          const describedBy = shownError ? `${fieldId}-error` : warning ? `${fieldId}-warning` : undefined
          const borderClass = shownError ? 'border-red-400' : 'border-slate-200'
          const currency = fieldCurrency?.(field)?.trim()

          let control
          if (isComputed) {
            control = renderComputedField
              ? renderComputedField(field, value, fieldId)
              : <div id={fieldId} className={COMPUTED_BOX_CLASS}>{value || EMPTY_VALUE_TEXT}</div>
          } else if (field.type === 'select') {
            control = (
              <select
                id={fieldId}
                value={value}
                disabled={disabled || isLocked}
                aria-invalid={fieldError ? true : undefined}
                aria-describedby={describedBy}
                onBlur={() => touch(field.id)}
                onChange={event => onFieldChange(row._id, field.id, event.target.value)}
                className={`${INPUT_CLASS} ${borderClass}`}
              >
                <option value="">Select...</option>
                {optionsWithCurrent(field.options || [], value).map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            )
          } else if (isNumeric) {
            control = (
              <div className="relative">
                {currency && (
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-semibold text-slate-400">
                    {currency}
                  </span>
                )}
                <input
                  id={fieldId}
                  type="text"
                  inputMode="decimal"
                  value={value}
                  placeholder={field.placeholder}
                  disabled={disabled || isLocked}
                  aria-invalid={fieldError ? true : undefined}
                  aria-describedby={describedBy}
                  onBlur={() => touch(field.id)}
                  onChange={event => onFieldChange(row._id, field.id, capNumericValue(event.target.value))}
                  className={`${INPUT_CLASS} ${borderClass} ${currency ? 'pl-12' : ''}`}
                />
              </div>
            )
          } else if (isMultilineField(field)) {
            control = (
              <textarea
                id={fieldId}
                value={value}
                rows={2}
                maxLength={textLimit}
                placeholder={isLocked ? undefined : field.placeholder}
                disabled={disabled || isLocked}
                aria-invalid={shownError ? true : undefined}
                aria-describedby={describedBy}
                onBlur={() => touch(field.id)}
                onChange={event => onFieldChange(row._id, field.id, event.target.value)}
                className={`${INPUT_CLASS} ${borderClass} h-auto resize-y break-words`}
              />
            )
          } else {
            control = (
              <input
                id={fieldId}
                value={isLocked && !value ? '' : value}
                maxLength={textLimit}
                placeholder={isLocked ? EMPTY_VALUE_TEXT : field.placeholder}
                disabled={disabled || isLocked}
                aria-invalid={shownError ? true : undefined}
                aria-describedby={describedBy}
                onBlur={() => touch(field.id)}
                onChange={event => onFieldChange(row._id, field.id, event.target.value)}
                className={`${INPUT_CLASS} ${borderClass} truncate`}
              />
            )
          }

          return (
            <div key={field.id} className={isFullWidth(field) ? 'md:col-span-2' : ''}>
              <label htmlFor={fieldId} className="mb-1.5 flex items-center gap-1 text-[11px] font-semibold text-slate-800">
                {field.label}
                {required && <span className="text-red-500" aria-hidden="true">*</span>}
              </label>
              {control}
              {shownError && (
                <p id={`${fieldId}-error`} className="mt-1 text-[11px] font-medium text-red-600">{shownError}</p>
              )}
              {!shownError && warning && (
                <p id={`${fieldId}-warning`} className="mt-1 text-[11px] font-medium text-amber-600">{warning}</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
