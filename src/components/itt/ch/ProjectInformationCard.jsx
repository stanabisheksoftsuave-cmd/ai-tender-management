import { useId, useState } from 'react'
import { AlertCircle, Briefcase, Clock, DollarSign, FileText, Hash, UploadCloud, X } from 'lucide-react'
import Card from '../../ui/Card'
import AiEditableTextarea from '../../ui/AiEditableTextarea'
import DatePicker from '../../ui/DatePicker'
import {
  CATEGORIES, CURRENCIES, YEAR_OPTIONS, MONTH_OPTIONS,
  TITLE_MAX_LENGTH, TITLE_MAX_MESSAGE, DESCRIPTION_MAX_LENGTH, DESCRIPTION_MAX_MESSAGE,
  DOCUMENT_MAX_MESSAGE, COST_CODE_MAX_LENGTH, TITLE_SUGGESTION_MIN_QUERY_LENGTH,
  formatBudget, isDescriptionOverLimit, isoToday,
} from './createIttForm'

/*
 * "Project Information" card — MAIN's ProjectInformationCard: title (with
 * existing-tender suggestions), tender type, department, currency + budget,
 * cost code, submission deadline, contract duration and the type-or-upload
 * project description.
 */

const inputCls = (err) => `w-full px-3.5 py-2.5 text-sm focus:outline-none transition-all olng-input ${err ? 'olng-input--error' : ''}`

function FieldLabel({ htmlFor, icon, required, right, children }) {
  const content = (
    <>
      {icon ? <span style={{ color: '#0089cf' }} aria-hidden="true">{icon}</span> : null}
      {children}
      {required ? <span className="font-secondary text-red-500" aria-hidden="true">*</span> : null}
    </>
  )
  const cls = 'flex items-center gap-1 text-xs font-semibold'
  return (
    <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
      {htmlFor
        ? <label htmlFor={htmlFor} className={cls} style={{ color: '#1e293b' }}>{content}</label>
        : <span className={cls} style={{ color: '#1e293b' }}>{content}</span>}
      {right}
    </div>
  )
}

function FieldError({ message, id }) {
  if (!message) return null
  return (
    <p id={id} className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1 break-words">
      <AlertCircle size={10} className="shrink-0" />{message}
    </p>
  )
}

function NativeSelect({ value, onChange, options, placeholder, ariaLabel, error, disabled, className = '' }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`${inputCls(error)} ${className}`}
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map(o => {
        const v = typeof o === 'string' ? o : o.value
        const l = typeof o === 'string' ? o : o.label
        return <option key={v} value={v}>{l}</option>
      })}
    </select>
  )
}

function DescModeToggle({ value, onChange, disabledReasons }) {
  const modes = [{ id: 'type', icon: FileText, label: 'Type' }, { id: 'upload', icon: UploadCloud, label: 'Upload File' }]
  return (
    <div className="flex gap-0.5 rounded-lg p-0.5" style={{ background: 'rgba(0,137,207,0.06)', border: '1px solid rgba(0,137,207,0.1)' }}>
      {modes.map(m => {
        const active = value === m.id
        const reason = disabledReasons[m.id]
        return (
          <button
            key={m.id}
            type="button"
            aria-pressed={active}
            disabled={reason !== undefined}
            title={reason}
            onClick={() => onChange(m.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50"
            style={active ? { background: '#fff', color: '#1e293b', boxShadow: '0 1px 3px rgba(27,76,111,0.1)' } : { color: '#94a3b8' }}
          >
            <m.icon size={11} /> {m.label}
          </button>
        )
      })}
    </div>
  )
}

function DescriptionUploadField({ uploadedFileName, uploadedFileSize, isDragOver, isExtracting, error, onDragOver, onDragLeave, onDrop, onFileChosen, onRemoveFile, disabled }) {
  return (
    <div>
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`olng-dropzone flex cursor-pointer flex-col items-center justify-center gap-2 px-4 py-7 text-center transition-colors ${isDragOver ? 'olng-dropzone--active' : ''} ${error && !isDragOver ? 'olng-input--error' : ''}`}
      >
        <UploadCloud size={24} style={{ color: isDragOver ? '#0089cf' : '#94a3b8' }} aria-hidden="true" />
        <span className="max-w-full text-sm font-medium break-words" style={{ color: '#1e293b' }}>
          {uploadedFileName
            ? `${uploadedFileName}${uploadedFileSize ? ` · ${uploadedFileSize}` : ''}`
            : isDragOver ? 'Drop file here' : 'Click or drag a file to upload'}
        </span>
        <span className="text-xs text-slate-400">
          {uploadedFileName ? 'Replace file' : 'PDF, DOC, DOCX or TXT - scope is read from the document'}
        </span>
        {isExtracting ? <span className="text-xs" style={{ color: '#0089cf' }}>Extracting text…</span> : null}
        <input
          type="file"
          aria-label="Upload description file"
          className="sr-only"
          accept=".pdf,.doc,.docx,.txt"
          disabled={disabled}
          onChange={e => { onFileChosen(e.target.files?.[0]); e.target.value = '' }}
        />
      </label>
      {uploadedFileName ? (
        <button type="button" onClick={onRemoveFile} className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-slate-400 hover:text-red-500">
          <X size={12} aria-hidden="true" /> Remove file
        </button>
      ) : null}
      <FieldError message={error} />
    </div>
  )
}

/* Title input with a list of existing tenders whose title matches (MAIN's TitleSuggestions). */
function TitleInput({ value, onChange, error, hint, disabled, suggestions, onSelectSuggestion }) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const visible = !!onSelectSuggestion && open && value.trim().length >= TITLE_SUGGESTION_MIN_QUERY_LENGTH && suggestions.length > 0
  const pick = (id) => { setOpen(false); setActive(-1); onSelectSuggestion(id) }
  const onKeyDown = (e) => {
    if (!onSelectSuggestion) return
    if (e.key === 'Escape') { setOpen(false); setActive(-1); return }
    if (e.key === 'Tab') return
    if (e.key === 'Enter') {
      if (!visible || active < 0) return
      e.preventDefault(); pick(suggestions[active].id); return
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (!visible) { setOpen(true); return }
      e.preventDefault()
      const step = e.key === 'ArrowDown' ? 1 : -1
      setActive(cur => { const n = cur + step; if (n < 0) return suggestions.length - 1; return n >= suggestions.length ? 0 : n })
      return
    }
    setOpen(true); setActive(-1)
  }
  return (
    <div className="relative">
      <input
        id="itt-project-title"
        placeholder="e.g. Enterprise Cloud Infrastructure Upgrade"
        maxLength={TITLE_MAX_LENGTH}
        value={value}
        disabled={disabled}
        aria-required="true"
        autoComplete="off"
        role={onSelectSuggestion ? 'combobox' : undefined}
        aria-expanded={onSelectSuggestion ? visible : undefined}
        aria-controls={onSelectSuggestion ? listId : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => { setOpen(false); setActive(-1) }}
        onKeyDown={onKeyDown}
        onChange={e => onChange(e.target.value)}
        className={inputCls(error)}
      />
      {visible && (
        <ul id={listId} role="listbox" aria-label="Existing tenders with a matching title"
          className="absolute top-full left-0 right-0 z-20 mt-1 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
          {suggestions.map((s, i) => (
            <li
              key={s.id}
              role="option"
              aria-selected={i === active}
              onMouseDown={e => e.preventDefault()}
              onClick={() => pick(s.id)}
              className={`flex cursor-pointer flex-col gap-0.5 px-3.5 py-2 text-sm ${i === active ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="truncate font-medium" style={{ color: '#1e293b' }}>{s.title}</span>
                {s.status ? <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ background: 'rgba(0,137,207,0.08)', color: '#0089cf' }}>{s.status}</span> : null}
              </span>
              {s.detail ? <span className="truncate text-xs text-slate-400">{s.detail}</span> : null}
            </li>
          ))}
        </ul>
      )}
      {error ? <FieldError message={error} /> : hint ? <p className="text-[11px] text-slate-400 mt-1.5">{hint}</p> : null}
    </div>
  )
}

export default function ProjectInformationCard({
  form, errors, setField, departmentOptions, upload, readOnly = false,
  titleSuggestions = [], onSelectTitleSuggestion, existingTenderNotice,
}) {
  const titleHint = form.title.length >= TITLE_MAX_LENGTH ? TITLE_MAX_MESSAGE : undefined
  const descriptionAtLimit = (form.description || '').length >= DESCRIPTION_MAX_LENGTH
  const descriptionError = errors.description ?? (descriptionAtLimit ? DESCRIPTION_MAX_MESSAGE : undefined)
  const hasTypedText = form.descMode !== 'upload' && (form.description || '').trim() !== ''
  const hasUploadedFile = form.descMode === 'upload' && form.uploadedFileName !== ''
  const disabledReasons = {
    ...(hasTypedText ? { upload: 'Clear the typed description to upload a file instead' } : {}),
    ...(hasUploadedFile ? { type: 'Remove the uploaded file to type instead' } : {}),
  }
  const uploadError = errors.uploadedFileName ?? (form.uploadedFileName && isDescriptionOverLimit(form.description) ? DOCUMENT_MAX_MESSAGE : undefined)

  const setYears = (v) => { setField('durationYears', v); if (form.durationMonths === '') setField('durationMonths', '0') }
  const setMonths = (v) => { setField('durationMonths', v); if (form.durationYears === '') setField('durationYears', '0') }

  return (
    <Card branded className="p-6">
      <h2 className="font-semibold mb-5 flex items-center gap-2.5" style={{ color: '#1e293b', fontSize: '15px' }}>
        <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
          <FileText size={16} style={{ color: '#0089cf' }} />
        </span>
        Project Information
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Project Title */}
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="itt-project-title" required>Project Title</FieldLabel>
          <TitleInput
            value={form.title}
            onChange={v => setField('title', v)}
            error={errors.title}
            hint={titleHint}
            disabled={readOnly}
            suggestions={titleSuggestions}
            onSelectSuggestion={onSelectTitleSuggestion}
          />
          {existingTenderNotice ? (
            <p role="status" className="mt-1.5 text-xs font-medium" style={{ color: '#0089cf' }}>{existingTenderNotice}</p>
          ) : null}
        </div>

        {/* Tender Type */}
        <div>
          <FieldLabel icon={<Briefcase size={12} />} required>Tender Type</FieldLabel>
          <NativeSelect
            value={form.category}
            onChange={v => setField('category', v)}
            options={form.category && !CATEGORIES.includes(form.category) ? [form.category, ...CATEGORIES] : CATEGORIES}
            placeholder="Select tender type…"
            ariaLabel="Tender Type"
            error={errors.category}
            disabled={readOnly}
          />
          <FieldError message={errors.category} />
        </div>

        {/* Department / Entity */}
        <div>
          <FieldLabel required>Department / Entity</FieldLabel>
          <NativeSelect
            value={form.department}
            onChange={v => setField('department', v)}
            options={departmentOptions}
            placeholder="Select department…"
            ariaLabel="Department / Entity"
            error={errors.department}
            disabled={readOnly}
          />
          <FieldError message={errors.department} />
        </div>

        {/* Estimated Budget — currency + amount */}
        <div>
          <FieldLabel htmlFor="itt-estimated-budget" icon={<DollarSign size={12} />} required>Estimated Budget</FieldLabel>
          <div className="flex gap-2">
            <NativeSelect
              value={form.currency}
              onChange={v => setField('currency', v)}
              options={CURRENCIES}
              ariaLabel="Currency"
              error={errors.currency}
              disabled={readOnly}
              className="!w-28 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <input
                id="itt-estimated-budget"
                inputMode="numeric"
                placeholder="e.g. 500000"
                aria-required="true"
                value={form.budget}
                disabled={readOnly}
                onChange={e => setField('budget', formatBudget(e.target.value))}
                className={inputCls(errors.budget)}
              />
            </div>
          </div>
          {errors.budget
            ? <FieldError message={errors.budget} />
            : <p className="text-[11px] text-slate-400 mt-1.5">Whole numbers only, up to 14 digits.</p>}
        </div>

        {/* Cost Code */}
        <div>
          <FieldLabel htmlFor="itt-cost-code" icon={<Hash size={12} />} required>Cost Code</FieldLabel>
          <input
            id="itt-cost-code"
            maxLength={COST_CODE_MAX_LENGTH}
            placeholder="e.g. CC-2025-001"
            aria-required="true"
            value={form.costCode}
            disabled={readOnly}
            onChange={e => setField('costCode', e.target.value)}
            className={inputCls(errors.costCode)}
          />
          <FieldError message={errors.costCode} />
        </div>

        {/* Submission Deadline */}
        <div>
          <FieldLabel htmlFor="itt-submission-deadline" required>Submission Deadline</FieldLabel>
          <DatePicker
            id="itt-submission-deadline"
            value={form.deadline}
            onChange={v => setField('deadline', v || '')}
            minKey={isoToday()}
            error={!!errors.deadline}
            disabled={readOnly}
            ariaLabel="Submission Deadline"
          />
          <FieldError message={errors.deadline} />
        </div>

        {/* Contract Duration */}
        <div>
          <FieldLabel icon={<Clock size={12} />} required>Contract Duration</FieldLabel>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <NativeSelect value={form.durationYears} onChange={setYears} options={YEAR_OPTIONS} placeholder="Years"
                ariaLabel="Contract Duration (years)" error={errors.durationYears} disabled={readOnly} />
              <FieldError message={errors.durationYears} />
            </div>
            <div className="min-w-0 flex-1">
              <NativeSelect value={form.durationMonths} onChange={setMonths} options={MONTH_OPTIONS} placeholder="Months"
                ariaLabel="Contract Duration (months)" error={errors.durationMonths} disabled={readOnly} />
              <FieldError message={errors.durationMonths} />
            </div>
          </div>
        </div>

        {/* Project Description / Key Requirements */}
        <div className="sm:col-span-2">
          <FieldLabel required right={
            <DescModeToggle value={form.descMode} onChange={upload.setDescMode} disabledReasons={disabledReasons} />
          }>
            Project Description / Key Requirements
          </FieldLabel>

          {form.descMode === 'upload' ? (
            <DescriptionUploadField
              uploadedFileName={form.uploadedFileName}
              uploadedFileSize={upload.uploadedFileSize}
              isDragOver={upload.isDragOver}
              isExtracting={upload.isExtracting}
              error={uploadError}
              onDragOver={upload.onDragOver}
              onDragLeave={upload.onDragLeave}
              onDrop={upload.onDrop}
              onFileChosen={upload.onFileChosen}
              onRemoveFile={upload.onRemoveFile}
              disabled={readOnly}
            />
          ) : (
            <div>
              <AiEditableTextarea
                rows={4}
                placeholder="Describe the project scope, objectives, and key requirements..."
                value={form.description}
                disabled={readOnly}
                onChange={val => setField('description', String(val ?? '').slice(0, DESCRIPTION_MAX_LENGTH))}
                className={`${inputCls(descriptionError)} resize-none`}
              />
              <div className="mt-1 flex items-start justify-between gap-3">
                <FieldError message={descriptionError} />
                <p className="ml-auto shrink-0 text-[11px] text-slate-400 tabular-nums">
                  {(form.description || '').length.toLocaleString()} / {DESCRIPTION_MAX_LENGTH.toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  )
}
