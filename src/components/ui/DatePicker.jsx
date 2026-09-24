import { useState, useRef, useCallback, useLayoutEffect, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { useDismissable } from '../../context/NavigationContext'

/*
 * Lightweight month-grid date picker (shadcn-style trigger + popover calendar),
 * dependency-free — no date-fns/react-day-picker, just native Date. Value and
 * onChange both work in plain 'yyyy-mm-dd' strings, the shape every filter and
 * form field in this app already stores dates in.
 *
 *   <DatePicker value={from} onChange={setFrom} placeholder="From" />
 */

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const pad = n => String(n).padStart(2, '0')
const toKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const fromKey = key => {
  if (!key) return null
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return null
  return new Date(y, m - 1, d)
}
const fmt = key => {
  const d = fromKey(key)
  if (!d) return ''
  return `${pad(d.getMonth() + 1)}/${pad(d.getDate())}/${d.getFullYear()}`
}

export default function DatePicker({
  value,             // 'yyyy-mm-dd' or ''
  onChange,          // (key: 'yyyy-mm-dd' | '') => void
  placeholder = 'Pick a date',
  minKey,            // 'yyyy-mm-dd' — disables days before this
  maxKey,            // 'yyyy-mm-dd' — disables days after this
  clearable = true,
  disabled = false,
  error = false,
  className = '',
  ariaLabel,
  id,
}) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const [viewDate, setViewDate] = useState(() => fromKey(value) || new Date())

  const rootRef = useRef(null)
  const panelRef = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useDismissable(open, close)

  const openPanel = () => {
    setViewDate(fromKey(value) || new Date())
    setOpen(true)
  }

  const place = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const up = below < 320 && above > below
    setPos({
      left: r.left,
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
    })
  }, [])

  useLayoutEffect(() => { if (open) place() }, [open, place])

  useEffect(() => {
    if (!open) return
    const onMove = () => place()
    window.addEventListener('scroll', onMove, true)
    window.addEventListener('resize', onMove)
    return () => {
      window.removeEventListener('scroll', onMove, true)
      window.removeEventListener('resize', onMove)
    }
  }, [open, place])

  useEffect(() => {
    if (!open) return
    const onDown = e => {
      if (rootRef.current?.contains(e.target)) return
      if (panelRef.current?.contains(e.target)) return
      close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, close])

  const pick = key => {
    const isDisabled = (minKey && key < minKey) || (maxKey && key > maxKey)
    if (isDisabled) return
    onChange?.(key)
    close()
  }

  const shiftMonth = delta => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + delta, 1))

  // ── Build the 6x7 day grid, leading/trailing days from adjacent months included ──
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay() // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startOffset)
  const days = Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i)
    return d
  })

  const todayKey = toKey(new Date())

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel || placeholder}
        className={`w-full flex items-center gap-2 text-sm rounded-lg px-3 py-2 text-left transition-colors bg-white border
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:opacity-60 disabled:cursor-not-allowed
          ${error ? 'border-red-300' : 'border-slate-200'}`}
      >
        <CalendarIcon size={14} className="shrink-0 text-slate-400" />
        <span className={`flex-1 truncate ${value ? 'text-slate-700' : 'text-slate-400'}`}>
          {value ? fmt(value) : placeholder}
        </span>
      </button>

      {open && pos && createPortal(
        <div ref={panelRef}
          role="dialog"
          className="fixed z-[100] w-64 rounded-xl overflow-hidden bg-white border border-slate-200 p-3"
          style={{ left: pos.left, top: pos.top, bottom: pos.bottom, boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }}>

          {/* Month header */}
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={() => shiftMonth(-1)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-semibold text-slate-700">{MONTHS[month]} {year}</span>
            <button type="button" onClick={() => shiftMonth(1)}
              className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-100 transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Weekday row */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map(w => (
              <span key={w} className="text-[10px] font-semibold text-slate-400 text-center py-1">{w}</span>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {days.map(d => {
              const key = toKey(d)
              const inMonth = d.getMonth() === month
              const isSelected = key === value
              const isToday = key === todayKey
              const isDisabled = (minKey && key < minKey) || (maxKey && key > maxKey)
              return (
                <button
                  key={key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => pick(key)}
                  className={`h-7 w-7 rounded-md text-xs flex items-center justify-center transition-colors mx-auto
                    ${isSelected ? 'text-white font-semibold' : isDisabled ? 'text-slate-200 cursor-not-allowed' : inMonth ? 'text-slate-700 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-50'}
                    ${isToday && !isSelected ? 'ring-1 ring-[var(--color-primary)]/50' : ''}`}
                  style={isSelected ? { background: 'var(--color-primary)' } : undefined}
                >
                  {d.getDate()}
                </button>
              )
            })}
          </div>

          {clearable && value && (
            <button type="button" onClick={() => { onChange?.(''); close() }}
              className="mt-2 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5 rounded-md hover:bg-slate-50 transition-colors">
              Clear
            </button>
          )}
        </div>,
        document.body
      )}
    </div>
  )
}
