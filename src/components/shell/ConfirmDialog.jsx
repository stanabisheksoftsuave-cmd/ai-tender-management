import { createPortal } from 'react-dom'
import { useDismissable } from '../../context/NavigationContext'

/*
 * Small confirm dialog in the app's modal style (same shell as the Sign Out
 * confirmation). Registered with useDismissable so the header Back closes it.
 *
 *   <ConfirmDialog isOpen title="…" description="…" icon={Sparkles}
 *     confirmLabel="Open form" onConfirm={…} onClose={…} />
 */
export default function ConfirmDialog({
  isOpen,
  title,
  description,
  icon: Icon,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose,
}) {
  useDismissable(isOpen, onClose)
  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={onClose}>
      <div role="alertdialog" aria-modal="true" aria-label={title}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col items-center text-center gap-4">
        {Icon && (
          <span className="flex w-14 h-14 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(0,137,207,0.10)', color: '#0089cf' }}>
            <Icon size={24} aria-hidden="true" />
          </span>
        )}
        <div className="space-y-1">
          <p className="text-lg font-bold text-slate-800">{title}</p>
          {description && <p className="text-sm text-slate-500">{description}</p>}
        </div>
        <div className="mt-1 flex items-center gap-3">
          <button type="button" onClick={onClose}
            className="px-6 py-2 rounded-full text-sm font-semibold border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
            {cancelLabel}
          </button>
          <button type="button" onClick={onConfirm} autoFocus
            className="px-6 py-2 rounded-full text-sm font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: '#0089cf' }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
