import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, RotateCcw } from 'lucide-react'
import { STATUS_CFG, STATUS_ORDER } from './model'
import { cn } from '../../utils/cn'

/**
 * The bidder's compliance chip + "Administrative status" menu — MAIN's
 * `StatusPicker`. Picking a status hands off to the caller's "Set compliance
 * status" reason dialog; "Reset to auto-derived" clears an override.
 */
export function StatusPicker({ bidderName, status, disabled, hasOverride, onSelect, onReset }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  const current = STATUS_CFG[status]

  useEffect(() => {
    if (!open) return undefined
    const onDown = (event) => { if (!rootRef.current?.contains(event.target)) setOpen(false) }
    const onKey = (event) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Compliance status for ${bidderName}: ${current.label}. Change status`}
        onClick={() => setOpen(o => !o)}
        className={cn('inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', current.chip)}
      >
        <span className={cn('h-2 w-2 rounded-full', current.dot)} aria-hidden="true" />
        {current.label}
        <ChevronDown size={13} className={cn('opacity-70 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-30 mt-1.5 w-64 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Administrative status</p>
          {STATUS_ORDER.map(key => {
            const option = STATUS_CFG[key]
            return (
              <button
                key={key}
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onSelect(key) }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium hover:bg-slate-50"
              >
                <span className={cn('h-2 w-2 shrink-0 rounded-full', option.dot)} aria-hidden="true" />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="text-slate-800">{option.label}</span>
                  <span className="text-[11px] font-normal text-slate-400">{option.hint}</span>
                </span>
                {status === key && <Check size={13} className="shrink-0 text-[var(--color-primary)]" />}
              </button>
            )
          })}
          {hasOverride && (
            <>
              <div className="my-1 border-t border-slate-100" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { setOpen(false); onReset() }}
                className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium text-slate-600 hover:bg-slate-50"
              >
                <RotateCcw size={13} className="text-slate-400" /> Reset to auto-derived
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
