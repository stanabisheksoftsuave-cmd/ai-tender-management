import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, Search, X } from 'lucide-react'
import { tenderRef } from '../../utils/tenderRef'
import { cifStageOf } from './chFlow'

/*
 * "Select Tender" popup beside the sidebar — main app's TenderPickerPopup.
 * Opened when a Contract Strategy sub-item is clicked with no tender in the
 * URL. Lists the strategy drafts (past CIF creation, PSF not yet submitted),
 * optionally narrowed to one CIF progress stage (PSF Strategy passes 'psf'),
 * with a client-side search over title / cost code / department / id.
 */

const POPUP_VIEWPORT_MARGIN = 16
const POPUP_WIDTH = 320
const SIDEBAR_ANCHOR_LEFT = 228

const DEFAULT_EMPTY =
  'No tenders yet. Complete a Contract Initiating Form first — its tender will then appear here.'

const normalizeStage = (value) => (value ? value.split('_').join(' ') : '—')

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled])'

export default function TenderPickerPopup({
  itemLabel,
  top: anchorTop,
  tenders,
  stageFilter,
  emptyStateMessage,
  isRtl = false,
  onChoose,
  onOpenInitiatingForm,
  onClose,
}) {
  const panelRef = useRef(null)
  const [search, setSearch] = useState('')
  const [top, setTop] = useState(Math.max(POPUP_VIEWPORT_MARGIN, anchorTop - 16))

  const stageFiltered = useMemo(
    () => (stageFilter ? tenders.filter(t => cifStageOf(t) === stageFilter) : tenders),
    [tenders, stageFilter],
  )
  const drafts = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return stageFiltered
    return stageFiltered.filter(t =>
      [t.title, t.costCode, t.department, t.id].some(f => String(f ?? '').toLowerCase().includes(q)))
  }, [stageFiltered, search])
  const hasStageMatches = stageFiltered.length > 0

  // Keep the panel inside the viewport: pull it up when it would overflow.
  useLayoutEffect(() => {
    const recompute = () => {
      const panel = panelRef.current
      if (!panel) return
      const desiredTop = Math.max(POPUP_VIEWPORT_MARGIN, anchorTop - 16)
      const overflow = desiredTop + panel.getBoundingClientRect().height - (window.innerHeight - POPUP_VIEWPORT_MARGIN)
      setTop(overflow > 0 ? Math.max(POPUP_VIEWPORT_MARGIN, desiredTop - overflow) : desiredTop)
    }
    recompute()
    window.addEventListener('resize', recompute)
    return () => window.removeEventListener('resize', recompute)
  }, [anchorTop, drafts.length])

  // Focus moves into the dialog; Escape closes it; Tab stays inside it.
  const latestClose = useRef(onClose)
  useEffect(() => { latestClose.current = onClose })
  useEffect(() => {
    const trigger = document.activeElement
    panelRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        trigger?.focus?.()
        latestClose.current()
        return
      }
      if (event.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const focusable = Array.from(panel.querySelectorAll(FOCUSABLE))
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (!first || !last) { event.preventDefault(); panel.focus(); return }
      const active = document.activeElement
      const outside = !panel.contains(active)
      if (event.shiftKey && (active === first || outside)) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && (active === last || outside)) { event.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [])

  const sideStyle = isRtl
    ? { right: SIDEBAR_ANCHOR_LEFT }
    : { left: `min(${SIDEBAR_ANCHOR_LEFT}px, max(${POPUP_VIEWPORT_MARGIN}px, calc(100vw - ${POPUP_WIDTH + POPUP_VIEWPORT_MARGIN}px)))` }

  return createPortal(
    <>
      <div className="fixed inset-0 z-[90]" style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Select tender for ${itemLabel}`}
        tabIndex={-1}
        className="fixed z-[100] flex w-[320px] max-w-[calc(100vw-2rem)] max-h-[70vh] flex-col overflow-hidden rounded-2xl fade-in focus:outline-none"
        style={{
          top,
          ...sideStyle,
          background: '#1b4c6f',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 18px 40px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">Select Tender</p>
              <p className="mt-1 truncate text-xs font-semibold text-white">{itemLabel}</p>
            </div>
            <button type="button" onClick={onClose} aria-label="Close tender picker"
              className="shrink-0 cursor-pointer rounded-md px-1.5 py-1 text-sm leading-none text-white/55 transition-colors hover:bg-white/5">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Search */}
        {hasStageMatches && (
          <div className="px-3 py-2.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.10)' }}>
            <div className="relative">
              <Search size={12} aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-2.5 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tenders…"
                aria-label="Search tenders"
                className="w-full rounded-lg border border-white/10 bg-white/5 py-1.5 pr-2.5 pl-7 text-[11px] text-white placeholder:text-white/35 focus:border-[#0089cf]/60 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto p-2 space-y-1">
          {!hasStageMatches ? (
            <div className="px-3 py-5 text-center">
              <p className="text-[11px] leading-relaxed text-white/55">{emptyStateMessage || DEFAULT_EMPTY}</p>
              {!stageFilter && (
                <button type="button" onClick={onOpenInitiatingForm}
                  className="mt-3 w-full cursor-pointer rounded-lg px-3 py-2 text-[11px] font-semibold text-white transition-colors hover:opacity-90"
                  style={{ background: '#0089cf' }}>
                  Contract Initiating Form
                </button>
              )}
            </div>
          ) : drafts.length === 0 ? (
            <div className="px-3 py-5 text-center">
              <p className="text-[11px] leading-relaxed text-white/55">No tenders match &ldquo;{search}&rdquo;.</p>
            </div>
          ) : drafts.map(tender => (
            <button
              key={tender.id}
              type="button"
              onClick={() => onChoose(tender.id)}
              className="w-full cursor-pointer rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-start transition-all hover:bg-white/[0.12]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold tracking-wide" style={{ color: '#38bdf8' }}>
                  {tenderRef(tender) || String(tender.id).slice(0, 8)}
                </span>
                <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-300">
                  {normalizeStage(cifStageOf(tender))}
                </span>
              </div>
              <p className="mt-1 text-[11px] font-medium leading-snug text-white">{tender.title || 'Untitled'}</p>
              {(tender.department || tender.budget) && (
                <p className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-white/45">
                  {tender.department && (
                    <>
                      <Briefcase size={9} className="shrink-0" aria-hidden="true" />
                      <span className="min-w-0 truncate">{tender.department}</span>
                    </>
                  )}
                  {tender.budget && (
                    <span className="shrink-0 whitespace-nowrap">{`${tender.department ? '· ' : ''}${tender.budget}`}</span>
                  )}
                </p>
              )}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body,
  )
}
