import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Building2, CalendarClock, ChevronLeft, ChevronRight, FileText, Hash, Plus, Search,
} from 'lucide-react'
import { useTenders } from '../../context/TenderContext'
import {
  draftProgressStage,
  formatDeadlineUtc,
  matchesDraftSearch,
  normalizeStage,
  routeForDraftProgress,
  selectCifDrafts,
} from './cifUtils'

function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl p-6 text-center sm:p-10" style={{ border: '1px dashed var(--color-border)' }}>
      <span className="flex w-10 h-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))', color: '#0089cf' }}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{title}</p>
      <p className="max-w-sm text-xs text-slate-500">{children}</p>
    </div>
  )
}

function MetaItem({ icon: Icon, children }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-xs text-slate-400 break-all">
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

/**
 * `/contract-strategy` — the Contract Initiating Form drafts picker (MAIN
 * CifDraftsPickerPage + CifDraftsPicker): search, count pill, one card per
 * draft resuming at its saved progress stage, and "New CIF".
 */
export default function CifDraftsPicker() {
  const navigate = useNavigate()
  const { tenders } = useTenders()
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const allDrafts = useMemo(() => selectCifDrafts(tenders), [tenders])
  const drafts = useMemo(() => allDrafts.filter(t => matchesDraftSearch(t, search)), [allDrafts, search])
  const totalPages = Math.max(1, Math.ceil(drafts.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = drafts.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const isSearching = search.trim() !== ''

  const openDraft = (tender) => {
    const { to, state } = routeForDraftProgress(tender)
    navigate(to, state ? { state } : undefined)
  }

  return (
    // The page IS the layout's parent container, like every worklist: it bleeds
    // to the container's edges and fills it — heading on top, rows scrolling,
    // footer pinned below.
    <div className="-m-5 flex h-[calc(100%+2.5rem)] flex-col olng-slide-up">
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Header */}
        <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3 border-b border-[#cce6f8] dark:border-slate-800">
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex items-center gap-3">
              <span
                className="flex size-10 shrink-0 items-center justify-center rounded-xl text-[#0089cf]"
                style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}
                aria-hidden="true"
              >
                <FileText size={18} />
              </span>
              <div>
                <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Contract Initiating Form</h2>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Resume a draft you already started, or begin a new Contract Initiating Form.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 max-sm:w-full">
            <div className="relative w-64 max-sm:w-full">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by tender title"
                aria-label="Search Contract Initiating Form drafts"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:border-[#0089cf] focus:outline-none"
              />
            </div>
            <span className="shrink-0 rounded-full bg-slate-100 dark:bg-slate-800 px-2.5 py-1 font-sans text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {drafts.length} {drafts.length === 1 ? 'tender' : 'tenders'}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2.5">
          {drafts.length === 0 && isSearching ? (
            <EmptyState icon={Search} title="No drafts match your search">
              Try a different cost code, title or department.
            </EmptyState>
          ) : drafts.length === 0 ? (
            <EmptyState icon={Briefcase} title="No CIF drafts available">
              You have no Contract Initiating Form drafts to resume right now. Start a new one to begin a tender.
            </EmptyState>
          ) : (
            <div className="space-y-1.5">
              {pageItems.map(draft => {
                const hasCostCode = Boolean(String(draft.costCode ?? '').trim())
                return (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => openDraft(draft)}
                    className="group block w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30"
                  >
                    <div className="flex items-center justify-between gap-3 sm:gap-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 py-3 transition-all duration-200 group-hover:border-[#0089cf]/40 group-hover:bg-[#0089cf]/[0.02]">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="max-w-full truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {draft.title || 'Untitled Contract Initiating Form'}
                          </h3>
                          <span className="shrink-0 rounded-full bg-[#fffbeb] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#b45309] ring-1 ring-[#fde68a]">
                            {normalizeStage(draftProgressStage(draft))}
                          </span>
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <MetaItem icon={Hash}>
                            {hasCostCode ? 'Cost Code' : 'Reference'}: {hasCostCode ? draft.costCode : draft.id}
                          </MetaItem>
                          {draft.deadline && (
                            <MetaItem icon={CalendarClock}>Deadline: {formatDeadlineUtc(draft.deadline)}</MetaItem>
                          )}
                          <MetaItem icon={Building2}>{draft.department || 'No department set'}</MetaItem>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-4">
                        {draft.budget && (
                          <div className="text-right">
                            <p className="text-[11px] text-slate-400">Budget</p>
                            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{draft.budget}</p>
                          </div>
                        )}
                        <ChevronRight size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-[#0089cf]" aria-hidden="true" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: rows per page + pagination + New CIF */}
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#cce6f8] dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Rows per page</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
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
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="tabular-nums">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="p-1 rounded hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-40"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/contract-strategy/new')}
            title="Start New Contract Initiating Form"
            className="flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-md transition-all hover:opacity-95 max-sm:w-full max-sm:justify-center"
            style={{ background: 'linear-gradient(135deg, #1b4c6f 0%, #0089cf 100%)' }}
          >
            <Plus size={16} aria-hidden="true" className="shrink-0" />
            New CIF
          </button>
        </div>
      </div>
    </div>
  )
}
