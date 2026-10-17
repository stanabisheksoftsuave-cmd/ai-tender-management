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
import Card from './Card'
import Badge from './Badge'
import { tenderRef } from '../../utils/tenderRef'

const statusVariant = {
  tech_eval:   'tech_eval',
  comm_eval:   'comm_eval',
  scm_gate1:   'scm_gate',
  scm_gate2:   'scm_gate',
  scm_gate3:   'scm_gate',
  upload:      'upload',
  award:       'award',
  prequal_stage1:      'prequal_stage1',
  prequal_stage2:      'prequal_stage2',
  prequal_stage3:      'prequal_stage3',
  prequal_stage4:      'prequal_stage4',
  prequal_final_review: 'prequal_final_review',
  prequal_rejected:    'prequal_rejected',
  legal_review:        'legal_review',
  contract_execution:  'contract_execution',
  active:              'active',
  contract_closure:    'contract_closure',
  closed:              'closed',
  parallel_eval:       'tech_eval',
}

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

  const IconComp = icon || <ClipboardList size={18} className="text-[var(--color-primary)] shrink-0" />

  return (
    <div className="space-y-4">
      {/* ── Main Worklist Card ── */}
      <Card className="p-5 sm:p-6 overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[var(--color-primary)] flex items-center justify-center shrink-0 mt-0.5">
              {IconComp}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {title}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {description}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-center">
            {/* Search Box */}
            <div className="relative min-w-[200px] sm:min-w-[240px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search tenders..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 focus:bg-white dark:focus:bg-slate-800"
              />
            </div>
            {/* Count Pill */}
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 whitespace-nowrap">
              {filtered.length} {filtered.length === 1 ? 'tender' : 'tenders'}
            </span>
          </div>
        </div>

        {/* Content Area */}
        <div className="pt-4">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-center">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
                <FileText size={22} />
              </div>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                {search.trim() ? 'No matching tenders found' : emptyText}
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 max-w-sm">
                {search.trim() ? 'Try adjusting your search criteria' : 'Awarded tenders ready for contract drafting will appear here automatically.'}
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {pagedItems.map(tender => (
                <div
                  key={tender.id}
                  onClick={() => navigate(`${basePath}/${tender.id}`)}
                  className="group block w-full p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/40 hover:bg-slate-50/80 dark:hover:bg-slate-800 hover:border-blue-300/60 dark:hover:border-blue-500/40 hover:shadow-sm transition-all cursor-pointer text-left"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Top row: Title and Badges */}
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-[var(--color-primary)] transition-colors truncate">
                          {tender.title}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60 uppercase">
                          {tender.stage || 'AWARD'}
                        </span>
                        {tender.evalProgress === 'in_progress' && (
                          <span className="text-[10px] font-medium text-amber-700 bg-amber-50 ring-1 ring-amber-200 px-2 py-0.5 rounded-full">
                            In Progress
                          </span>
                        )}
                        {isUnassigned?.(tender) && (
                          <span className="text-[10px] font-semibold text-violet-700 bg-violet-50 ring-1 ring-violet-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <UserPlus size={9} /> Unassigned
                          </span>
                        )}
                        {tender.correctionRequests?.some(r => r.resolved) && (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 ring-1 ring-amber-300 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <RefreshCw size={9} /> Docs Re-submitted
                          </span>
                        )}
                      </div>

                      {/* Meta items */}
                      <div className="flex items-center gap-x-4 gap-y-1.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1 font-mono">
                          <Hash size={12} className="text-slate-400 shrink-0" />
                          Cost Code: <strong className="font-semibold text-slate-700 dark:text-slate-300">{tender.costCode || tenderRef(tender) || 'N/A'}</strong>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="text-slate-400 shrink-0" />
                          Deadline: {formatDeadline(tender.deadline)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 size={12} className="text-slate-400 shrink-0" />
                          {tender.department || 'N/A'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={12} className="text-slate-400 shrink-0" />
                          {tender.bidders ?? 0} {(tender.bidders ?? 0) === 1 ? 'bidder' : 'bidders'}
                        </span>
                      </div>
                    </div>

                    {/* Right side: Budget & Chevron */}
                    <div className="flex items-center gap-4 shrink-0 pl-2">
                      <div className="text-right">
                        <p className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">Budget</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                          {tender.budget || '—'}
                        </p>
                      </div>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-[var(--color-primary)] group-hover:bg-blue-50 dark:group-hover:bg-slate-700 transition-all">
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer: Pagination */}
        {filtered.length > pageSize && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page</span>
              <select
                value={pageSize}
                onChange={e => { setPageSize(Number(e.target.value)); setPage(1) }}
                className="px-2 py-1 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span>
                Page {safePage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

