import { useState, useRef, useEffect, useLayoutEffect, useMemo, useCallback, useId } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, Check } from 'lucide-react'
import { useDismissable } from '../../context/NavigationContext'

/*
 * One searchable dropdown for every unbounded people/bidder list (ERP bidder
 * registries and evaluator pools run to hundreds of rows, so a bare <select>
 * is unusable). Trigger + filterable listbox, keyboard driven, and registered
 * with useDismissable so the global Back button closes the panel first.
 *
 *   <SearchableSelect
 *     value={selectedId}
 *     onChange={id => setSelectedId(id)}
 *     options={bidders}
 *     getValue={b => b.id}
 *     getLabel={b => b.name}
 *     getSubLabel={b => `${b.country} · ${b.category}`}
 *   />
 *
 * `theme` lets a dark modal (UserManagement) override the light default
 * without forking the component.
 *
 * The panel is portalled to <body> and positioned fixed: several call sites sit
 * inside modal shells with `overflow-hidden`, which would otherwise clip it.
 */

const str = v => (v === null || v === undefined ? '' : String(v))

export default function SearchableSelect({
  value,
  onChange,
  options = [],
  getValue = o => (o && o.value !== undefined ? o.value : o?.id),
  getLabel = o => (o && o.label !== undefined ? o.label : o?.name),
  getSubLabel,
  placeholder = 'Select…',
  searchPlaceholder = 'Search…',
  emptyText = 'No matches found',
  clearable = false,
  multiple = false,   // value becomes an array; clicking toggles and keeps the panel open
  disabled = false,
  error = false,
  className = '',
  buttonClassName = '',
  style,
  theme,
  ariaLabel,
  id,
}) {
  const [open, setOpen]   = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  const [pos, setPos] = useState(null)

  const rootRef  = useRef(null)
  const panelRef = useRef(null)
  const inputRef = useRef(null)
  const listRef  = useRef(null)
  const reactId  = useId()
  const listId   = `${id || 'sel'}-${reactId}`

  const close = useCallback(() => { setOpen(false); setQuery('') }, [])
  useDismissable(open, close)

  // Highlight is seeded here rather than in an effect so opening does not cost a
  // second render pass.
  const openPanel = () => {
    const idx = options.findIndex(o => str(getValue(o)) === str(value))
    setActive(idx >= 0 ? idx : 0)
    setQuery('')
    setOpen(true)
  }

  const entries = useMemo(() => options.map((o, i) => ({
    option: o,
    key: str(getValue(o)) || `i${i}`,
    val: getValue(o),
    label: str(getLabel(o)),
    sub: getSubLabel ? str(getSubLabel(o)) : '',
  })), [options, getValue, getLabel, getSubLabel])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter(e => e.label.toLowerCase().includes(q) || e.sub.toLowerCase().includes(q))
  }, [entries, query])

  const selected = entries.find(e => str(e.val) === str(value))

  // Multi-select support: `value` is an array of selected values.
  const valueArr = multiple ? (Array.isArray(value) ? value : []) : []
  const isSelected = val => multiple
    ? valueArr.some(v => str(v) === str(val))
    : str(val) === str(value)
  const hasSelection = multiple ? valueArr.length > 0 : !!selected
  const triggerLabel = multiple
    ? (valueArr.length === 0
        ? placeholder
        : valueArr.length <= 2
          ? entries.filter(e => isSelected(e.val)).map(e => e.label).join(', ')
          : `${valueArr.length} selected`)
    : (selected ? selected.label : placeholder)

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

  const place = useCallback(() => {
    const el = rootRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const below = window.innerHeight - r.bottom - 12
    const above = r.top - 12
    const up = below < 200 && above > below
    setPos({
      left: r.left,
      width: r.width,
      top: up ? undefined : r.bottom + 4,
      bottom: up ? window.innerHeight - r.top + 4 : undefined,
      maxHeight: Math.max(160, Math.min(320, up ? above : below)),
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

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  useEffect(() => {
    if (!open || !listRef.current) return
    const el = listRef.current.querySelector(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [active, open])

  const pick = entry => {
    if (multiple) {
      if (!entry) { onChange?.([], null); return }
      const exists = valueArr.some(v => str(v) === str(entry.val))
      const next = exists ? valueArr.filter(v => str(v) !== str(entry.val)) : [...valueArr, entry.val]
      onChange?.(next, entry.option)
      return // keep the panel open so several can be picked
    }
    onChange?.(entry ? entry.val : '', entry ? entry.option : null)
    close()
  }

  const onKeyDown = e => {
    if (e.key === 'Escape')      { e.preventDefault(); close(); return }
    if (e.key === 'ArrowDown')   { e.preventDefault(); setActive(a => Math.min(a + 1, filtered.length - 1)); return }
    if (e.key === 'ArrowUp')     { e.preventDefault(); setActive(a => Math.max(a - 1, 0)); return }
    if (e.key === 'Enter')       { e.preventDefault(); if (filtered[active]) pick(filtered[active]); return }
    if (e.key === 'Tab')         close()
  }

  const onTriggerKeyDown = e => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openPanel() }
  }

  const t = theme || {}
  const themed = !!theme

  const triggerStyle = themed
    ? {
        background: t.inputBg || '#fff',
        color: hasSelection ? (t.text || '#0F172A') : (t.sub || '#94A3B8'),
        border: `1.5px solid ${error ? '#F87171' : (t.border || '#E2E8F0')}`,
        ...style,
      }
    : style

  const panelStyle = themed
    ? { background: t.surface || '#fff', border: `1px solid ${t.border || '#E2E8F0'}`, boxShadow: '0 10px 40px rgba(0,0,0,0.18)' }
    : { boxShadow: '0 10px 40px rgba(0,0,0,0.12)' }

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => (open ? close() : openPanel())}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={ariaLabel || placeholder}
        className={`w-full flex items-center justify-between gap-2 text-sm rounded-lg px-3 py-2 text-left transition-colors
          focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:opacity-60 disabled:cursor-not-allowed
          ${themed ? '' : `bg-white border ${error ? 'border-red-300' : 'border-slate-200'} ${hasSelection ? 'text-slate-700' : 'text-slate-400'}`}
          ${buttonClassName}`}
        style={triggerStyle}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown size={14} className={`shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && pos && createPortal(
        <div
          ref={panelRef}
          className={`fixed z-[100] rounded-xl overflow-hidden flex flex-col ${themed ? '' : 'bg-white border border-slate-200'}`}
          style={{ ...panelStyle, left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
        >
          <div className={`flex items-center gap-2 px-2.5 py-2 shrink-0 ${themed ? '' : 'border-b border-slate-100 bg-slate-50/60'}`}
            style={themed ? { borderBottom: `1px solid ${t.border || '#E2E8F0'}` } : undefined}>
            <Search size={13} className="shrink-0 opacity-50" style={themed ? { color: t.sub } : { color: '#94A3B8' }} />
            <input
              ref={inputRef}
              value={query}
              onChange={e => { setQuery(e.target.value); setActive(0) }}
              onKeyDown={onKeyDown}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              aria-controls={listId}
              className={`w-full text-xs bg-transparent focus:outline-none ${themed ? '' : 'text-slate-700 placeholder:text-slate-400'}`}
              style={themed ? { color: t.text } : undefined}
            />
          </div>

          <ul ref={listRef} id={listId} role="listbox" aria-label={ariaLabel || placeholder}
            className="flex-1 min-h-0 overflow-y-auto py-1">
            {clearable && !query.trim() && (
              <li>
                <button type="button" role="option" aria-selected={!hasSelection}
                  onClick={() => pick(null)}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${themed ? '' : 'text-slate-400 hover:bg-slate-50'}`}
                  style={themed ? { color: t.sub } : undefined}>
                  {placeholder}
                </button>
              </li>
            )}
            {filtered.length === 0 ? (
              <li className={`px-3 py-4 text-center text-xs ${themed ? '' : 'text-slate-400'}`} style={themed ? { color: t.sub } : undefined}>
                {emptyText}
              </li>
            ) : filtered.map((e, i) => {
              const isSel = isSelected(e.val)
              const isActive = i === active
              return (
                <li key={e.key}>
                  <button
                    type="button"
                    role="option"
                    data-idx={i}
                    aria-selected={!!isSel}
                    onMouseEnter={() => setActive(i)}
                    onClick={() => pick(e)}
                    className={`w-full flex items-center gap-2 text-left px-3 py-2 transition-colors
                      ${themed ? '' : isActive ? 'bg-slate-50' : ''}`}
                    style={themed ? { background: isActive ? (t.hoverBg || 'rgba(255,255,255,0.06)') : 'transparent' } : undefined}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${themed ? '' : 'text-slate-700'}`}
                        style={themed ? { color: t.text } : undefined}>{e.label}</p>
                      {e.sub && (
                        <p className={`text-[10px] truncate ${themed ? '' : 'text-slate-400'}`}
                          style={themed ? { color: t.sub } : undefined}>{e.sub}</p>
                      )}
                    </div>
                    {isSel && <Check size={13} className="shrink-0" style={{ color: 'var(--color-primary)' }} />}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>,
        document.body
      )}
    </div>
  )
}
