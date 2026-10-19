import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight,
  Building2,
  Calendar,
  Users,
  FileText,
  ClipboardList,
  Hash,
  Search,
  RefreshCw,
  UserPlus
} from 'lucide-react'
import ListPagination from '../shell/ListPagination'
import { tenderRef } from '../../utils/tenderRef'
import { PAGE_FILL } from '../layout/pageFill'


const formatDeadline = (value) => {
  if (!value) return 'N/A'
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  const date = dateOnly
    ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

/**
 * Modern Picker / Worklist Queue matching tender-management-frontend FixedListCard.
 */
export default function TenderSelectList({
  tenders = [],
  status = 'award',
  basePath = '/contract',
  title = 'Contract Drafting',
  description = 'Select an awarded tender to begin contract drafting',
  emptyText = 'No tenders pending contract drafting',
  isUnassigned,
  icon,
}) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pageSize, setPageSize] = useState(10)
  const [page, setPage] = useState(1)

  const allowed = Array.isArray(status) ? status : [status]
  const statusFiltered = useMemo(() => {
    return tenders.filter(t => allowed.includes(t.status))
  }, [tenders, allowed])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return statusFiltered
    return statusFiltered.filter(t => {
      const ref = tenderRef(t).toLowerCase()
      const titleStr = (t.title || '').toLowerCase()
      const dept = (t.department || '').toLowerCase()
      const costCode = (t.costCode || '').toLowerCase()
      return ref.includes(q) || titleStr.includes(q) || dept.includes(q) || costCode.includes(q)
    })
  }, [statusFiltered, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const safePage = Math.min(page, totalPages)
  const pagedItems = useMemo(() => {
    const start = (safePage - 1) * pageSize
    return filtered.slice(start, start + pageSize)
  }, [filtered, safePage, pageSize])

  const IconComp = icon || <ClipboardList size={18} className="shrink-0" />

  return (
    // The page IS the layout's parent container (main app's FixedListCard):
    // it bleeds to the container's edges (cancelling its p-5) and fills it —
    // heading on top, rows scrolling in the middle, pagination pinned below.
    <div className={PAGE_FILL}>
      {/* ── Heading: icon, title, description · search and count ── */}
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex w-10 h-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fb] text-[#0089cf] dark:bg-sky-950/60">
            {IconComp}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#1b4c6f] dark:text-slate-100">{title}</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-56 sm:w-64">
            <Search size={14} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search by tender title"
              aria-label="Search by tender title"
              className="h-9 w-full rounded-lg border border-[#cce6f8] bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
            />
          </div>
          <span className="shrink-0 rounded-full bg-[#ecf4fc] px-2.5 py-1 text-xs text-slate-500 tabular-nums dark:bg-slate-800 dark:text-slate-300">
            {filtered.length} {filtered.length === 1 ? 'tender' : 'tenders'}
          </span>
        </div>
      </div>

      {/* ── Rows ── */}
      <div role="region" aria-label={`${title} worklist`} tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto border-t border-[#cce6f8] px-3 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0089cf] dark:border-slate-800">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#cce6f8] p-6 text-center sm:p-10 dark:border-slate-800">
            <span className="flex w-10 h-10 items-center justify-center rounded-xl bg-[#e8f3fb] text-[#0089cf] dark:bg-sky-950/60">
              <FileText size={18} />
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              {search.trim() ? 'No matching tenders found' : emptyText}
            </p>
            {search.trim() && <p className="text-xs text-slate-500">Try a different search.</p>}
          </div>
        ) : (
          <div className="space-y-1.5">
            {pagedItems.map(tender => (
              <button
                key={tender.id}
                type="button"
                onClick={() => navigate(`${basePath}/${tender.id}`)}
                className="group block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30"
              >
                <div className="overflow-hidden rounded-xl border border-[#cce6f8] bg-white px-3.5 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0089cf]/40 hover:bg-[#0089cf]/[0.06] dark:border-slate-800 dark:bg-slate-800/40">
                  <div className="flex items-center justify-between gap-3 sm:gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                        <h3 className="max-w-full truncate text-sm font-semibold text-slate-800 dark:text-slate-100">{tender.title}</h3>
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-600 dark:border-sky-800/60 dark:bg-sky-900/30 dark:text-sky-300">
                          {tender.stage || 'Award'}
                        </span>
                        {tender.evalProgress === 'in_progress' && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-amber-200">In Progress</span>
                        )}
                        {isUnassigned?.(tender) && (
                          <span className="flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
                            <UserPlus size={9} /> Unassigned
                          </span>
                        )}
                        {tender.correctionRequests?.some(r => r.resolved) && (
                          <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-300">
                            <RefreshCw size={9} /> Docs Re-submitted
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex min-w-0 items-center gap-1">
                          <Hash size={12} className="shrink-0" aria-hidden="true" />
                          Cost Code: {tender.costCode || tenderRef(tender) || 'N/A'}
                        </span>
                        <span className="flex min-w-0 items-center gap-1">
                          <Calendar size={12} className="shrink-0" aria-hidden="true" />
                          Deadline: {formatDeadline(tender.deadline)}
                        </span>
                        <span className="flex min-w-0 items-center gap-1">
                          <Building2 size={12} className="shrink-0" aria-hidden="true" />
                          {tender.department || 'N/A'}
                        </span>
                        <span className="flex min-w-0 items-center gap-1">
                          <Users size={12} className="shrink-0" aria-hidden="true" />
                          {tender.bidders ?? 0} {(tender.bidders ?? 0) === 1 ? 'bidder' : 'bidders'}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-[11px] text-slate-500">Budget</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{tender.budget || '—'}</p>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-slate-400 transition-colors group-hover:text-[#0089cf]" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="shrink-0 border-t border-[#cce6f8] px-3 py-1.5 dark:border-slate-800">
          <ListPagination
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1) }}
          />
        </div>
      )}
    </div>
  )
}
