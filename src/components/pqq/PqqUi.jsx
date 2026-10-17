import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  AlertTriangle, CheckCircle2, CloudUpload, FileText, Info, Pencil, RotateCcw, Trash2, X, XCircle,
} from 'lucide-react'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import { useDismissable } from '../../context/NavigationContext'
import { cn } from '../../utils/cn'

/*
 * Small UI kit for the Pre-Qualification port: real modals instead of
 * window.prompt/confirm (prototype bug §8.A-9), MAIN's Alert tones, the
 * ReasonPopupLink, the drag-and-drop zone and the full-page AI blocker —
 * re-built in TARGET's visual language.
 */

const ALERT_TONES = {
  info:    { box: 'bg-blue-50 border-blue-200 text-blue-800', icon: Info },
  success: { box: 'bg-emerald-50 border-emerald-200 text-emerald-800', icon: CheckCircle2 },
  warning: { box: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle },
  danger:  { box: 'bg-red-50 border-red-200 text-red-700', icon: XCircle },
}

export function PqqAlert({ tone = 'info', title, children, className }) {
  const t = ALERT_TONES[tone] || ALERT_TONES.info
  const Icon = t.icon
  return (
    <div role={tone === 'danger' ? 'alert' : 'status'} className={cn('flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs leading-relaxed', t.box, className)}>
      <Icon size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div>{children}</div>
      </div>
    </div>
  )
}

const BTN_BASE = 'inline-flex items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed'
const BTN_VARIANTS = {
  primary: 'text-white px-4 py-2 bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-primary-dark)] hover:opacity-90 shadow-sm',
  outline: 'px-3 py-1.5 border border-[#0089cf]/25 text-[#0089cf] bg-white hover:bg-slate-50',
  secondary: 'px-3 py-1.5 border border-slate-200 text-slate-600 bg-white hover:bg-slate-50',
  danger: 'px-4 py-2 text-white bg-red-600 hover:bg-red-700 shadow-sm',
  ghost: 'px-2 py-1 text-slate-500 hover:text-slate-700 hover:bg-slate-50',
}

export function PqqButton({ variant = 'outline', className, type = 'button', children, ...props }) {
  return (
    <button type={type} className={cn(BTN_BASE, BTN_VARIANTS[variant] || BTN_VARIANTS.outline, className)} {...props}>
      {children}
    </button>
  )
}

export function PqqModal({ isOpen, onClose, title, description, icon: Icon, headerActions, footer, children, busy = false }) {
  const close = () => { if (!busy) onClose?.() }
  useDismissable(isOpen, close)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = e => { if (e.key === 'Escape') close() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!isOpen) return null
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4" onMouseDown={e => { if (e.target === e.currentTarget) close() }}>
      <div role="dialog" aria-modal="true" aria-label={title} className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-slate-200 overflow-hidden">
        <div className="flex items-start gap-3 px-5 pt-5 pb-3">
          {Icon && (
            <span className="flex w-9 h-9 shrink-0 items-center justify-center rounded-xl bg-[#0089cf]/10 text-[#0089cf]">
              <Icon size={17} aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-slate-800 break-words">{title}</h3>
            {description && <p className="mt-1 text-xs text-slate-500 leading-relaxed break-words">{description}</p>}
          </div>
          {headerActions}
          <button type="button" onClick={close} disabled={busy} aria-label="Close" className="text-slate-400 hover:text-slate-600 disabled:opacity-40">
            <X size={16} />
          </button>
        </div>
        {children && <div className="px-5 pb-3">{children}</div>}
        {footer && <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">{footer}</div>}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  isOpen, title, description, icon, confirmLabel = 'Confirm', confirmVariant = 'primary',
  onConfirm, onClose, isLoading = false, children,
}) {
  return (
    <PqqModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      icon={icon}
      busy={isLoading}
      footer={(
        <>
          <PqqButton variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</PqqButton>
          <PqqButton variant={confirmVariant} onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Working…' : confirmLabel}
          </PqqButton>
        </>
      )}
    >
      {children}
    </PqqModal>
  )
}

function ReasonTextarea({ id, label, hint, value, onChange, maxLength, limitMessage, inputRef, placeholder }) {
  const atLimit = maxLength !== undefined && value.length >= maxLength
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-medium text-slate-600">
        {label} <span className="text-red-500" aria-hidden="true">*</span>
      </label>
      <textarea
        id={id}
        ref={inputRef}
        rows={5}
        value={value}
        maxLength={maxLength}
        placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        aria-invalid={atLimit || undefined}
        className={cn('olng-input w-full text-sm border rounded-lg px-3 py-2 resize-y focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30',
          atLimit ? 'border-red-300' : 'border-slate-200')}
      />
      {atLimit && limitMessage
        ? <p className="mt-1 text-[11px] text-red-600">{limitMessage}</p>
        : hint && <p className="mt-1 text-[11px] text-slate-400">{hint}</p>}
    </div>
  )
}

// A reason is required — Save stays disabled on an empty/whitespace reason.
export function ReasonDialog({
  isOpen, title, description, reasonLabel, reasonHint, initialReason = '', confirmLabel = 'Save',
  maxLength, limitMessage, isLoading = false, onConfirm, onClose,
}) {
  const [reason, setReason] = useState(initialReason)
  const inputRef = useRef(null)
  useEffect(() => { if (isOpen) inputRef.current?.focus() }, [isOpen])
  return (
    <PqqModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      busy={isLoading}
      footer={(
        <>
          <PqqButton variant="secondary" onClick={onClose} disabled={isLoading}>Cancel</PqqButton>
          <PqqButton variant="primary" disabled={isLoading || !reason.trim()} onClick={() => onConfirm(reason.trim())}>
            {isLoading ? 'Saving…' : confirmLabel}
          </PqqButton>
        </>
      )}
    >
      <ReasonTextarea
        id="pqq-reason-dialog"
        label={reasonLabel}
        hint={reasonHint}
        value={reason}
        onChange={setReason}
        maxLength={maxLength}
        limitMessage={limitMessage}
        inputRef={inputRef}
      />
    </PqqModal>
  )
}

/*
 * MAIN's ReasonPopupLink: a "Reason" link that opens the reason read-only,
 * with an optional pencil to edit it in place and an optional Reset to AI.
 */
export function ReasonPopupLink({
  reason, subject, onReset, resetDisabled = false, onSaveEdit, editInitialReason = '',
  editDisabled = false, editMaxLength, editLimitMessage,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { if (isEditing) inputRef.current?.focus() }, [isEditing])

  const close = () => { setIsOpen(false); setIsEditing(false) }
  const save = () => {
    if (!onSaveEdit || !draft.trim()) return
    onSaveEdit(draft.trim())
    close()
  }

  return (
    <>
      <button
        type="button"
        aria-label={`View reason for ${subject}`}
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#0089cf] underline-offset-2 hover:underline"
      >
        <FileText size={11} aria-hidden="true" /> Reason
      </button>
      <PqqModal
        isOpen={isOpen}
        onClose={close}
        title="Reason"
        description={subject}
        headerActions={onSaveEdit && !isEditing ? (
          <button
            type="button"
            aria-label="Edit reason"
            title="Edit reason"
            disabled={editDisabled}
            onClick={() => { setDraft(editInitialReason); setIsEditing(true) }}
            className="inline-flex w-7 h-7 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
          >
            <Pencil size={14} aria-hidden="true" />
          </button>
        ) : null}
        footer={isEditing ? (
          <>
            <PqqButton variant="secondary" onClick={() => setIsEditing(false)}>Cancel</PqqButton>
            <PqqButton variant="primary" disabled={!draft.trim()} onClick={save}>Save</PqqButton>
          </>
        ) : (
          <>
            {onReset && (
              <PqqButton variant="secondary" disabled={resetDisabled} onClick={() => { onReset(); close() }}>
                <RotateCcw size={13} aria-hidden="true" /> Reset to AI
              </PqqButton>
            )}
            <PqqButton variant="primary" onClick={close}>OK</PqqButton>
          </>
        )}
      >
        {isEditing ? (
          <ReasonTextarea
            id="pqq-reason-edit"
            label="Reason for this mark"
            value={draft}
            onChange={setDraft}
            maxLength={editMaxLength}
            limitMessage={editLimitMessage}
            inputRef={inputRef}
          />
        ) : (
          <p className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 break-words whitespace-pre-wrap">
            {reason?.trim() || 'Not Submitted'}
          </p>
        )}
      </PqqModal>
    </>
  )
}

// Full-screen blocker while a whole-roster AI evaluation runs (MAIN's
// PqqEvaluationBlocker). The sidebar locks through useAiLockWhile alongside.
export function PqqEvaluationBlocker({ title, description, stepLabel, helperText, progress = 30, isComplete = false }) {
  return createPortal(
    <div role="status" className="fixed inset-0 z-[110] flex cursor-wait items-center justify-center bg-black/40 p-4">
      <AiAnalysisLoader
        className="max-w-sm"
        title={title}
        description={description}
        progress={isComplete ? 100 : progress}
        steps={[{ id: 'evaluate', label: stepLabel, status: isComplete ? 'complete' : 'active' }]}
        helperText={helperText}
      />
    </div>,
    document.body,
  )
}

export function FileDropZone({ id, label, title, hint, disabled = false, onChoose, multiple = true }) {
  const [isDragging, setIsDragging] = useState(false)
  const depth = useRef(0)
  return (
    <label
      htmlFor={id}
      onDragEnter={e => { e.preventDefault(); if (disabled) return; depth.current += 1; setIsDragging(true) }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = disabled ? 'none' : 'copy' }}
      onDragLeave={e => { e.preventDefault(); depth.current = Math.max(0, depth.current - 1); if (depth.current === 0) setIsDragging(false) }}
      onDrop={e => {
        e.preventDefault()
        depth.current = 0
        setIsDragging(false)
        if (disabled) return
        const files = Array.from(e.dataTransfer.files || [])
        if (files.length > 0) onChoose(multiple ? files : files.slice(0, 1))
      }}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors',
        disabled
          ? 'cursor-not-allowed border-slate-200 bg-slate-50 opacity-60'
          : isDragging
            ? 'cursor-copy border-[#0089cf] bg-[#0089cf]/10'
            : 'cursor-pointer border-slate-300 bg-slate-50/50 hover:border-[#0089cf]/60 hover:bg-[#0089cf]/5',
      )}
    >
      <span className={cn('mb-1 flex w-10 h-10 items-center justify-center rounded-full', isDragging ? 'bg-[#0089cf] text-white' : 'bg-[#0089cf]/10 text-[#0089cf]')} aria-hidden="true">
        <CloudUpload size={20} />
      </span>
      <span className="text-sm font-semibold text-slate-700">{isDragging ? 'Drop the files to add them' : title}</span>
      <span className="text-xs text-slate-400">or <span className="font-semibold text-[#0089cf]">click to browse</span></span>
      {hint && <span className="mt-1 text-[11px] text-slate-400">{hint}</span>}
      <input
        id={id}
        type="file"
        multiple={multiple}
        aria-label={label}
        className="sr-only"
        disabled={disabled}
        onChange={e => {
          const files = Array.from(e.currentTarget.files || [])
          if (files.length > 0) onChoose(files)
          e.currentTarget.value = ''
        }}
      />
    </label>
  )
}

export function DeleteIconButton({ label, disabled, onClick }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <Trash2 size={14} aria-hidden="true" />
    </button>
  )
}

// MAIN Badge tones on TARGET's pill styling.
const PILL_TONES = {
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  danger:  'bg-red-50 text-red-700 ring-red-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  info:    'bg-blue-50 text-blue-700 ring-blue-200',
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  primary: 'bg-[#0089cf]/10 text-[#1b4c6f] ring-[#0089cf]/25',
}

export function Pill({ tone = 'neutral', className, children }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 whitespace-nowrap', PILL_TONES[tone] || PILL_TONES.neutral, className)}>
      {children}
    </span>
  )
}

