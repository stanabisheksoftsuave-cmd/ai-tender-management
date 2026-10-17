import { useState } from 'react'
import { Building2, CalendarClock, ChevronLeft, ChevronRight, Hash, Inbox, Plus, Search, ShieldAlert, X } from 'lucide-react'
import Card from '../../ui/Card'

/*
 * Create ITT — the Contract Holder's tender picker (MAIN's TenderPicker):
 * "From PSF Strategy" / "Direct ITT (No PSF)" tabs with counts, a search box,
 * one card per ITT-ready tender, and the "New ITT" button that opens a blank
 * direct-ITT form.
 */

const STATUS_CONFIG = {
  exported:        { label: 'EXPORTED',    cls: 'bg-[#ecfdf5] text-[#047857] ring-1 ring-[#a7f3d0]' },
  completed:       { label: 'COMPLETED',   cls: 'bg-[#ecfdf5] text-[#047857] ring-1 ring-[#a7f3d0]' },
  draft:           { label: 'DRAFT',       cls: 'bg-[#fffbeb] text-[#b45309] ring-1 ring-[#fde68a]' },
  in_progress:     { label: 'IN PROGRESS', cls: 'bg-[#ecfeff] text-[#0e7490] ring-1 ring-[#a5f3fc]' },
  awaiting_review: { label: 'AWAITING REVIEW', cls: 'bg-[#fffbeb] text-[#b45309] ring-1 ring-[#fde68a]' },
  on_hold:         { label: 'ON HOLD',     cls: 'bg-[#fffbeb] text-[#b45309] ring-1 ring-[#fde68a]' },
  cancelled:       { label: 'CANCELLED',   cls: 'bg-[#f1f5f9] text-[#64748b] ring-1 ring-[#e2e8f0]' },
}

const matches = (needle, ...values) => {
  const q = needle.trim().toLowerCase()
  if (!q) return true
  return values.some(v => String(v || '').toLowerCase().includes(q))
}

function PickerEmptyState({ icon, title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center sm:p-10">
      <div className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center shrink-0" style={{ background: 'rgba(0,137,207,0.1)', color: '#0089cf' }}>
        {icon}
      </div>
      <p className="text-sm font-semibold mt-1 text-slate-800 dark:text-slate-100">{title}</p>
      {children ? <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">{children}</p> : null}
    </div>
  )
}

function TenderPickerCard({ tender, onSelect }) {
  const normalizedStatus = (tender.status || '').toLowerCase().replace(/[\s-]+/g, '_')
  const statusKey = STATUS_CONFIG[normalizedStatus]
    ? normalizedStatus
    : (tender.sectionsGenerated ? 'in_progress' : 'draft')
  const status = STATUS_CONFIG[statusKey] || { label: String(tender.status || 'DRAFT').toUpperCase(), cls: 'bg-[#fffbeb] text-[#b45309] ring-1 ring-[#fde68a]' }

  return (
    <button
      type="button"
      onClick={() => onSelect(tender)}
      className="group block w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30"
    >
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all duration-200 group-hover:border-[#0089cf]/40 group-hover:bg-[#0089cf]/[0.02]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
              {tender.title || 'Untitled tender'}
            </h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${status.cls}`}>
              {status.label}
            </span>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            {(tender.costCode || tender.reference || tender.id) ? (
              <span className="inline-flex items-center gap-1 font-mono">
                <Hash size={12} className="shrink-0" />
                <span>{tender.costCode || tender.reference || tender.id}</span>
              </span>
            ) : null}
            {tender.deadline ? (
              <span className="inline-flex items-center gap-1">
                <CalendarClock size={12} className="shrink-0" />
                <span>Deadline {tender.deadline}</span>
              </span>
            ) : null}
            {tender.department ? (
              <span className="inline-flex items-center gap-1">
                <Building2 size={12} className="shrink-0" />
                <span>{tender.department}</span>
              </span>
            ) : null}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <ChevronRight size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-[#0089cf]" />
        </div>
      </div>
    </button>
  )
}

export default function CreateIttPicker({
  tenders = [],
  onSelect,
  onStartNew,
  title = 'Create ITT',
  description,
}) {
  const [search, setSearch] = useState('')
  const [requestedTab, setRequestedTab] = useState(null)
  const [pageSize, setPageSize] = useState(10)
  const [pages, setPages] = useState({ psf: 1, direct: 1 })

  const hasAny = tenders.length > 0
  const isSearching = search.trim() !== ''
  const matching = tenders.filter(t => matches(search, t.title, t.costCode, t.id, t.department))
  const isAfterPsf = t => Boolean(t.psfCompleted) && !t.psfSkipped
  const afterPsf = matching.filter(isAfterPsf)
  const direct = matching.filter(t => !isAfterPsf(t))
  const activeTab = requestedTab ?? (afterPsf.length === 0 && direct.length > 0 ? 'direct' : 'psf')
  const list = activeTab === 'psf' ? afterPsf : direct
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize))
  const page = Math.min(pages[activeTab] || 1, totalPages)
  const pageItems = list.slice((page - 1) * pageSize, page * pageSize)
  const setPage = (p) => setPages(prev => ({ ...prev, [activeTab]: p }))

  const onSearch = (value) => {
    setSearch(value)
    setPages({ psf: 1, direct: 1 })
  }

  return (
    <Card className="olng-slide-up overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <div className="px-5 pt-5 pb-1">
        <div className="flex items-start gap-3">
          <span
            className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[#0089cf]"
            style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}
          >
            <Inbox size={20} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              {description ? description : (
                <>
                  Select a tender that has completed <strong>PSF Strategy</strong> to continue its ITT, or start a brand-new one from scratch.
                </>
              )}
            </p>
          </div>
        </div>

        {hasAny && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-x-4 border-b border-slate-200 dark:border-slate-800">
            <div role="tablist" aria-label="ITT source" className="flex min-w-0 items-center gap-6">
              {['psf', 'direct'].map(tab => {
                const isActive = activeTab === tab
                const count = tab === 'psf' ? afterPsf.length : direct.length
                return (
                  <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setRequestedTab(tab)}
                    className={`relative inline-flex items-center gap-2 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${
                      isActive ? 'text-[#0089cf]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {tab === 'psf' ? 'From PSF Strategy' : 'Direct ITT (No PSF)'}
                    <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-sans text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                      {count} {count === 1 ? 'tender' : 'tenders'}
                    </span>
                    {isActive && (
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 -bottom-px h-0.5 rounded-full"
                        style={{ background: 'linear-gradient(90deg, #1b4c6f, #0089cf)' }}
                      />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="relative py-2 max-sm:basis-full w-64">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Search by tender title"
                aria-label="Search ITT tenders"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-7 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#0089cf] focus:outline-none"
              />
              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => onSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        {!hasAny ? (
          <PickerEmptyState icon={<ShieldAlert size={18} aria-hidden="true" />} title="No tenders ready for ITT creation">
            A tender must complete the <strong>PSF Strategy</strong> (Procurement Submission Form) step before its ITT can be created.
            Finish Strategy Templates and submit the PSF for a tender, then it will appear here.
          </PickerEmptyState>
        ) : pageItems.length > 0 ? (
          <div role="tabpanel" className="space-y-1.5">
            {pageItems.map(t => <TenderPickerCard key={t.id} tender={t} onSelect={onSelect} />)}
          </div>
        ) : isSearching ? (
          <PickerEmptyState icon={<Search size={18} aria-hidden="true" />} title="No tenders match your search">
            Try a different cost code, title or department, or check the other tab.
          </PickerEmptyState>
        ) : (
          <PickerEmptyState icon={<Inbox size={18} aria-hidden="true" />} title="No tenders here yet">
            {activeTab === 'psf' ? 'No tender has completed PSF Strategy yet.' : 'No ITT has been started directly without PSF.'}
          </PickerEmptyState>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 px-5 py-2.5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Rows per page</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value))
                setPages(prev => ({ ...prev, [activeTab]: 1 }))
              }}
              className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-200 focus:border-[#0089cf] focus:outline-none cursor-pointer"
            >
              {[10, 20, 30, 40, 50].map(sz => (
                <option key={sz} value={sz}>{sz}</option>
              ))}
            </select>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} />
              </button>
              <span>Page {page} of {totalPages}</span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
        {onStartNew ? (
          <button
            type="button"
            onClick={onStartNew}
            title="Start New ITT"
            aria-label="Start New ITT"
            className="flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 cursor-pointer max-sm:w-full max-sm:justify-center"
            style={{ background: 'linear-gradient(135deg, #1b4c6f 0%, #0089cf 100%)' }}
          >
            <Plus size={16} aria-hidden="true" className="shrink-0" />
            New ITT
          </button>
        ) : null}
      </div>
    </Card>
  )
}

