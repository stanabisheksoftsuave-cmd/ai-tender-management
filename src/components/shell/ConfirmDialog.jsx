import { createPortal } from 'react-dom'
import { AlertTriangle, X } from 'lucide-react'
import { useDismissable } from '../../context/NavigationContext'

/*
 * Generic "Action? [Cancel] [Confirm]" dialog — a port of the main app's
 * ConfirmDialog (ui/ConfirmDialog.tsx on its Modal with hideHeaderChrome), with
 * the same values:
 *   backdrop  black at 60%, panel centred, max-w-sm
 *   panel     rounded-xl, #cce6f8 border, white, shadow-lg, close ✕ top-right
 *   badge     56px rounded-2xl, primary-soft #afd9f4 with a primary #0089cf icon
 *             (a caution glyph unless the caller passes its own icon)
 *   text      bold 18px #1e293b title, 14px #64748b description, centred
 *   buttons   pill Cancel (outline) and pill confirm — the brand gradient
 *             button (`olng-btn-generate`), or solid red for `danger`
 * Registered with useDismissable so the header Back closes it.
 *
 *   <ConfirmDialog isOpen title="…" description="…" icon={Sparkles}
 *     confirmLabel="Open form" onConfirm={…} onClose={…} />
 */
const BUTTON = 'inline-flex h-10 cursor-pointer items-center justify-center whitespace-nowrap rounded-full px-6 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/50 focus-visible:ring-offset-2'

const CONFIRM_TONES = {
  primary: 'olng-btn-generate text-white active:scale-[0.97]',
  danger: 'bg-[#dc2626] text-white hover:opacity-90',
}

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  icon: Icon = AlertTriangle,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  onConfirm,
  onClose,
}) {
  useDismissable(isOpen, onClose)
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6"
      onClick={onClose}>
      <div role="alertdialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()}
        className="relative my-auto flex w-full max-w-sm flex-col rounded-xl border border-[#cce6f8] bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900">
        <button type="button" onClick={onClose} aria-label="Close"
          className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:text-[#1e293b] dark:hover:bg-slate-800 dark:hover:text-slate-100">
          <X size={16} aria-hidden="true" />
        </button>

        <div className="px-4 py-4 sm:px-5">
          <div className="flex flex-col items-center gap-4 py-2 text-center">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#afd9f4] text-[#0089cf]" aria-hidden="true">
              <Icon size={24} />
            </span>
            <div className="space-y-1.5">
              <h2 className="text-lg font-bold text-[#1e293b] dark:text-slate-100">{title}</h2>
              {description && <p className="text-sm text-[#64748b]">{description}</p>}
            </div>

            <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
              <button type="button" onClick={onClose}
                className={`${BUTTON} border border-[#cce6f8] bg-transparent text-[#1e293b] hover:border-[#94a3b8] hover:bg-[#f8fafc] dark:border-slate-600 dark:text-slate-100 dark:hover:bg-slate-800`}>
                {cancelLabel}
              </button>
              <button type="button" onClick={onConfirm} autoFocus
                className={`${BUTTON} ${CONFIRM_TONES[confirmVariant] || CONFIRM_TONES.primary}`}>
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  )
}
