import { useState } from 'react'
import { createPortal } from 'react-dom'
import { MoreVertical } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDismissable } from '../../context/NavigationContext'
import { splitFormattedBudget } from './chFlow'

/* Small table cells shared by the CH dashboard, the strategy hub and Tender
 * Tracking — main app's CostCodeChip, BudgetAmount, AttentionPill, TenderRowMenu. */

export function CostCodeChip({ value, fallback = 'N/A' }) {
  return value ? (
    <span title={value}
      className="inline-block max-w-full truncate rounded-md bg-slate-100 px-2 py-0.5 align-middle font-mono text-xs font-normal text-slate-500">
      {value}
    </span>
  ) : (
    <span className="text-xs font-normal text-slate-400">{fallback}</span>
  )
}

/** 'OMR 923,000' → small uppercase currency + bold amount; raw text otherwise. */
export function BudgetAmount({ value, fallback = 'N/A' }) {
  const split = splitFormattedBudget(value)
  if (!split) {
    return value
      ? <span className="font-semibold text-slate-700">{value}</span>
      : <span className="text-slate-400">{fallback}</span>
  }
  return (
    <span className="whitespace-nowrap font-semibold text-slate-800">
      <span className="mr-1 text-[10px] font-medium uppercase tracking-wide text-slate-400">{split.currency}</span>
      {split.amount}
    </span>
  )
}

export function AttentionPill({ label }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-red-600 ring-1 ring-red-200 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" aria-hidden="true" />
      {label}
    </span>
  )
}

/**
 * Row "⋮" menu: the next action (when present and the route is open to the
 * role), then "View in Tenders". The menu is portalled and fixed-positioned
 * under its button so a scrolling table wrapper can never clip it.
 */
const MENU_WIDTH = 192

export function TenderRowMenu({ title, action, canOpen = true }) {
  const navigate = useNavigate()
  const [anchor, setAnchor] = useState(null)
  const open = anchor !== null
  const close = () => setAnchor(null)
  useDismissable(open, close)
  const label = `Actions for ${title}`
  const go = (href) => { close(); navigate(href) }

  const toggle = (event) => {
    if (open) { close(); return }
    const rect = event.currentTarget.getBoundingClientRect()
    // Open upwards when there is no room below for the two items.
    const up = window.innerHeight - rect.bottom < 120
    setAnchor({
      left: Math.max(8, rect.right - MENU_WIDTH),
      top: up ? undefined : rect.bottom + 4,
      bottom: up ? window.innerHeight - rect.top + 4 : undefined,
    })
  }

  return (
    <div className="relative inline-block text-left">
      <button type="button" aria-label={label} aria-haspopup="menu" aria-expanded={open}
        onClick={toggle}
        className={`inline-flex w-8 h-8 items-center justify-center rounded-lg transition-colors hover:bg-slate-100 hover:text-slate-800 ${open ? 'bg-slate-100 text-slate-800' : 'text-slate-400'}`}>
        <MoreVertical size={16} aria-hidden="true" />
      </button>
      {open && createPortal(
        <>
          <div className="fixed inset-0 z-[60]" onClick={close} aria-hidden="true" />
          <div role="menu" aria-label={label}
            className="fixed z-[61] rounded-xl border border-slate-200 bg-white py-1.5 shadow-lg"
            style={{ width: MENU_WIDTH, left: anchor.left, top: anchor.top, bottom: anchor.bottom }}>
            {action && canOpen && (
              <button type="button" role="menuitem" onClick={() => go(action.href)}
                className="block w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">
                {action.label}
              </button>
            )}
            <button type="button" role="menuitem" onClick={() => go('/tenders')}
              className="block w-full px-3.5 py-2.5 text-left text-xs font-medium text-slate-700 hover:bg-slate-50">
              View in Tenders
            </button>
          </div>
        </>,
        document.body,
      )}
    </div>
  )
}
