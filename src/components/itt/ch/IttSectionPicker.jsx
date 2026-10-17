import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Search, X } from 'lucide-react'
import Card from '../../ui/Card'
import { useDismissable } from '../../../context/NavigationContext'

/*
 * "Select Section" (MAIN's IttSectionPicker): a select box showing the open
 * section; opening it shows a search box and every section of the ITT — the
 * signed-in role's own sections first, everyone else's after — each with its
 * owner and a status pill (Approved / Optional / Needs review / View only).
 * Arrow keys move through the rows, Enter chooses, Escape / outside click /
 * global Back close it.
 *
 * rows: [{ idx, title, owner, status: { label, tone } }]
 */

const PILL = {
  success: { pill: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  warning: { pill: 'bg-amber-50 text-amber-700', dot: 'bg-amber-500' },
  neutral: { pill: 'bg-slate-100 text-slate-500', dot: 'bg-slate-400' },
}

export default function IttSectionPicker({ rows, currentIdx, onChange }) {
  const listId = useId()
  const rootRef = useRef(null)
  const searchRef = useRef(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)

  const current = rows.find(r => r.idx === currentIdx) || null
  const needle = query.trim().toLowerCase()
  const visible = needle
    ? rows.filter(r => [r.title, r.owner, r.status.label].some(v => v.toLowerCase().includes(needle)))
    : rows
  const lastIndex = visible.length - 1
  const clamped = Math.min(activeIndex, Math.max(lastIndex, 0))
  const optionId = (idx) => `${listId}-${idx}`
  const activeRow = visible[clamped]
  const activeId = activeRow ? optionId(activeRow.idx) : undefined

  const close = () => { setOpen(false); setQuery('') }
  useDismissable(open, close)

  useEffect(() => { if (open) searchRef.current?.focus() }, [open])
  useEffect(() => {
    if (!open || !activeId) return
    document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [open, activeId])
  useEffect(() => {
    if (!open) return undefined
    const onDown = e => { if (!rootRef.current?.contains(e.target)) { setOpen(false); setQuery('') } }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const toggle = () => {
    if (open) { close(); return }
    setActiveIndex(Math.max(rows.findIndex(r => r.idx === currentIdx), 0))
    setOpen(true)
  }
  const choose = (idx) => { onChange(idx); close() }

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(clamped >= lastIndex ? 0 : clamped + 1) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(clamped <= 0 ? Math.max(lastIndex, 0) : clamped - 1) }
    else if (e.key === 'Home') { e.preventDefault(); setActiveIndex(0) }
    else if (e.key === 'End') { e.preventDefault(); setActiveIndex(Math.max(lastIndex, 0)) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeRow) choose(activeRow.idx) }
    else if (e.key === 'Escape') { e.preventDefault(); close() }
  }

  return (
    <Card branded className="p-4 relative z-20" style={{ overflow: 'visible' }}>
      <p className="mb-2 text-xs font-semibold" style={{ color: '#1e293b' }}>Select Section</p>
      <div ref={rootRef} className="relative">
        <button
          type="button"
          aria-label="Select Section"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={toggle}
          className="flex h-10 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3 text-left text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30"
          style={{ borderColor: 'rgba(0,137,207,0.2)', color: '#1e293b' }}
        >
          <span className="min-w-0 flex-1 truncate" title={current?.title}>{current?.title ?? 'Select a section'}</span>
          <ChevronDown size={16} className={`mr-1 shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full mt-1 rounded-2xl border border-slate-200 bg-white p-2.5 shadow-xl z-30">
            <div className="relative">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={activeId}
                aria-label="Search sections"
                value={query}
                onChange={e => { setQuery(e.target.value.trimStart()); setActiveIndex(0) }}
                onKeyDown={onKeyDown}
                placeholder="Search sections…"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-9 text-sm focus:outline-none focus:border-[#0089cf] focus:ring-2 focus:ring-[#0089cf]/20"
                style={{ color: '#1e293b' }}
              />
              {query && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => { setQuery(''); setActiveIndex(0); searchRef.current?.focus() }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex w-5 h-5 items-center justify-center rounded-full text-slate-400 hover:text-slate-700"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              )}
            </div>

            <p aria-live="polite" className="mt-2 px-1.5 py-1.5 text-xs text-slate-400">
              <span className="font-semibold" style={{ color: '#0089cf' }}>{visible.length}</span>{' '}
              {visible.length === 1 ? 'section' : 'sections'}{needle ? ' found' : ''}
            </p>

            <div className="max-h-60 overflow-y-auto">
              {visible.length === 0 ? (
                <p role="status" className="py-8 text-center text-sm text-slate-400">No sections match your search.</p>
              ) : (
                <div id={listId} role="listbox" aria-label="Sections" className="divide-y divide-slate-100">
                  {visible.map((row, i) => {
                    const selected = row.idx === currentIdx
                    const active = i === clamped
                    const pill = PILL[row.status.tone] || PILL.neutral
                    return (
                      <div
                        key={row.idx}
                        id={optionId(row.idx)}
                        role="option"
                        aria-selected={selected}
                        onClick={() => choose(row.idx)}
                        onMouseMove={() => setActiveIndex(i)}
                        className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors"
                        style={{ background: active || selected ? 'rgba(0,137,207,0.08)' : undefined }}
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold" style={{ color: selected ? '#0089cf' : '#1e293b' }}>{row.title}</span>
                          <span className="block truncate text-xs text-slate-400">Owner: {row.owner}</span>
                        </span>
                        <span className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${pill.pill}`}>
                          <span aria-hidden="true" className={`w-1.5 h-1.5 rounded-full ${pill.dot}`} />
                          {row.status.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
