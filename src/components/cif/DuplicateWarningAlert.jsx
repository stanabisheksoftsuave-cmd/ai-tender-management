import { AlertTriangle, XCircle } from 'lucide-react'

/**
 * MAIN's duplicate-CIF alert: "Cost code already in use" (danger) when another
 * tender carries the same cost code, "Possible duplicate CIF" (warning) when
 * the title + department match an existing tender. Dismissible.
 */
export default function DuplicateWarningAlert({ warning, onDismiss, className = '' }) {
  if (!warning) return null
  const danger = warning.costCodeMatch
  const Icon = danger ? XCircle : AlertTriangle
  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl px-4 py-3 text-xs olng-slide-up ${className}`}
      style={danger
        ? { background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', color: '#b91c1c' }
        : { background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)', color: '#b45309' }}
    >
      <Icon size={16} className="shrink-0 mt-0.5" aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-[13px]">
          {danger ? 'Cost code already in use' : 'Possible duplicate CIF'}
        </p>
        <div className="mt-0.5 flex items-center justify-between gap-3">
          <span className="min-w-0 break-words">{warning.message}</span>
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 cursor-pointer text-xs font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  )
}
