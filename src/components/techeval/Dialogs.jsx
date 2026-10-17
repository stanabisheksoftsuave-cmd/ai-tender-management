import { useEffect, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import { useDismissable } from '../../context/NavigationContext'
import { cn } from '../../utils/cn'

/**
 * Centred modal shell — backdrop click, Escape and the shared Back button all
 * close it. Shared by the confirm / reason dialogs and the evaluation modals.
 */
export function ModalShell({ isOpen, onClose, labelledBy, className, children }) {
  useDismissable(isOpen, onClose)
  const latestClose = useRef(onClose)
  useEffect(() => { latestClose.current = onClose })
  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (event) => { if (event.key === 'Escape') latestClose.current?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen])

  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(event) => event.stopPropagation()}
        className={cn('flex max-h-[85vh] w-full flex-col rounded-2xl bg-white shadow-2xl', className)}
      >
        {children}
      </div>
    </div>
  )
}

/** "Action? [Cancel] [Confirm]" — MAIN's `ConfirmDialog`. */
export function ConfirmDialog({ isOpen, icon: Icon, title, description, confirmLabel = 'Confirm', isLoading = false, onConfirm, onClose }) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} labelledBy="techeval-confirm-title" className="max-w-md">
      <div className="space-y-3 px-5 py-5">
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
              <Icon size={18} />
            </span>
          )}
          <div className="min-w-0">
            <h3 id="techeval-confirm-title" className="text-sm font-bold text-slate-800">{title}</h3>
            {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
        <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={isLoading}>Cancel</Button>
        <Button type="button" variant="brand" size="sm" onClick={onConfirm} disabled={isLoading}>{confirmLabel}</Button>
      </div>
    </ModalShell>
  )
}

/**
 * "Action? [required reason] [Cancel] [Confirm]" — MAIN's `ReasonDialog`.
 * Non-empty (trimmed) is the only rule; Confirm stays disabled until then.
 * Mounted fresh per target (callers key it), so the reason never carries over.
 */
export function ReasonDialog({ isOpen, title, description, reasonLabel = 'Reason', reasonHint, confirmLabel = 'Confirm', onConfirm, onClose }) {
  const [reason, setReason] = useState('')
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} labelledBy="techeval-reason-title" className="max-w-md">
      <div className="space-y-4 px-5 py-5">
        <div>
          <h3 id="techeval-reason-title" className="text-sm font-bold text-slate-800">{title}</h3>
          {description && <p className="mt-1 text-xs leading-relaxed text-slate-500">{description}</p>}
        </div>
        <label className="block">
          <span className="mb-1 block text-xs font-semibold text-slate-700">{reasonLabel}</span>
          <textarea
            rows={3}
            autoFocus
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="olng-input w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
          {reasonHint && <span className="mt-1 block text-[11px] text-slate-400">{reasonHint}</span>}
        </label>
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3.5">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="danger" size="sm" disabled={reason.trim() === ''} onClick={() => onConfirm(reason.trim())}>
          {confirmLabel}
        </Button>
      </div>
    </ModalShell>
  )
}

const TOAST_TONE = {
  success: { cls: 'border-emerald-200 bg-emerald-50 text-emerald-800', Icon: CheckCircle2 },
  warning: { cls: 'border-amber-200 bg-amber-50 text-amber-800', Icon: AlertTriangle },
  danger:  { cls: 'border-red-200 bg-red-50 text-red-800', Icon: XCircle },
  info:    { cls: 'border-blue-200 bg-blue-50 text-blue-800', Icon: Info },
}

/** Bottom-right toast stack — the flow owns the list (`{ id, tone, message }`). */
export function ToastStack({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex w-full max-w-sm flex-col gap-2">
      {toasts.map(t => {
        const { cls, Icon } = TOAST_TONE[t.tone] || TOAST_TONE.info
        return (
          <div key={t.id} role="status" className={cn('pointer-events-auto flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-xs shadow-lg', cls)}>
            <Icon size={15} className="mt-0.5 shrink-0" />
            <p className="flex-1 leading-relaxed">{t.message}</p>
            <button type="button" aria-label="Dismiss" onClick={() => onDismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
              <X size={13} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
