import { useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { useDismissable } from '../../context/NavigationContext'

/**
 * Centred confirm modal for the Strategy Templates flow — MAIN's
 * `ConfirmDialog` (icon, title, description, Cancel / Confirm), drawn in this
 * app's sign-out-modal style. Escape, the backdrop and the header Back close it.
 */
export default function ConfirmDialog({
  isOpen,
  icon: Icon,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onClose,
}) {
  useDismissable(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = event => { if (event.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const isDanger = confirmVariant === 'danger'

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm px-4"
      onClick={() => { if (!isLoading) onClose() }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="strategy-confirm-title"
        aria-describedby="strategy-confirm-description"
        onClick={event => event.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 flex flex-col items-center text-center gap-4 olng-scale-in"
      >
        {Icon && (
          <span
            className={`flex w-14 h-14 shrink-0 items-center justify-center rounded-2xl ${isDanger ? 'bg-red-50 text-red-600' : 'bg-[#0089cf]/10 text-[#0089cf]'}`}
          >
            <Icon size={24} aria-hidden="true" />
          </span>
        )}
        <div className="space-y-1.5">
          <p id="strategy-confirm-title" className="text-lg font-bold text-slate-800">{title}</p>
          <p id="strategy-confirm-description" className="text-sm text-slate-500">{description}</p>
        </div>
        <div className="mt-1 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors disabled:opacity-60 ${isDanger ? 'bg-red-500 hover:bg-red-600' : 'bg-[#0089cf] hover:bg-[#1b4c6f]'}`}
          >
            {isLoading && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
