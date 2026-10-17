import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { useDismissable } from '../../context/NavigationContext'

/** Small confirm modal (MAIN ui/ConfirmDialog) — Back, Esc and the backdrop cancel. */
export default function CifConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  onConfirm,
  onClose,
}) {
  useDismissable(isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  if (!isOpen) return null
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={onClose}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="cif-confirm-title" className="w-full max-w-sm olng-scale-in" onClick={e => e.stopPropagation()}>
        <Card branded className="p-5">
          <div className="flex items-start gap-3">
            <span
              className="w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
              style={{ background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(0,137,207,0.1)', color: danger ? '#dc2626' : '#0089cf' }}
              aria-hidden="true"
            >
              <AlertTriangle size={16} />
            </span>
            <div className="min-w-0">
              <h3 id="cif-confirm-title" className="text-sm font-semibold" style={{ color: '#1e293b' }}>{title}</h3>
              {description && <p className="mt-1 text-xs text-slate-500">{description}</p>}
            </div>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} className="text-xs py-1.5 px-3">{cancelLabel}</Button>
            <Button type="button" variant={danger ? 'danger' : 'brand'} onClick={onConfirm} className="text-xs py-1.5 px-3">
              {confirmLabel}
            </Button>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  )
}
