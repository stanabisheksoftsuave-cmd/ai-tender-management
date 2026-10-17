import { ChevronLeft, ChevronRight } from 'lucide-react'
import SearchableSelect from '../ui/SearchableSelect'

/*
 * "Rows per page" + numbered pager — main app's ListPagination
 * (PageSizeSelect + Pagination). Client-side: the caller slices its rows.
 */
const PAGE_SIZES = [10, 20, 25, 50, 100]

function pageTokens(page, totalPages) {
  const must = new Set([1, page - 1, page, page + 1, totalPages])
  if (totalPages >= 2) { must.add(2); must.add(totalPages - 1) }
  const sorted = [...must].filter(v => v >= 1 && v <= totalPages).sort((a, b) => a - b)
  const tokens = []
  let gaps = 0
  sorted.forEach((v, i) => {
    if (i > 0 && v - sorted[i - 1] > 1) { tokens.push(gaps === 0 ? 'gap-start' : 'gap-end'); gaps += 1 }
    tokens.push(v)
  })
  return tokens
}

const CONTROL = 'inline-flex w-8 h-8 cursor-pointer items-center justify-center rounded-md text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40'

export default function ListPagination({ page, pageSize, total, onPageChange, onPageSizeChange }) {
  if (total === 0) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const current = Math.min(Math.max(page, 1), totalPages)
  const first = (current - 1) * pageSize + 1
  const last = Math.min(current * pageSize, total)

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-500">Rows per page</span>
        <div className="w-20">
          <SearchableSelect
            value={pageSize}
            onChange={v => onPageSizeChange(Number(v))}
            options={PAGE_SIZES}
            getValue={v => v}
            getLabel={v => String(v)}
            searchable={false}
            ariaLabel="Rows per page"
          />
        </div>
      </div>
      {totalPages > 1 && (
        <nav aria-label="Pagination"
          className="flex flex-wrap items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1.5">
          <span className="sr-only" aria-live="polite">
            {`Page ${current} of ${totalPages}, showing records ${first} to ${last} of ${total}.`}
          </span>
          <button type="button" aria-label="Previous page" disabled={current <= 1}
            onClick={() => onPageChange(current - 1)}
            className={`${CONTROL} text-slate-500 hover:bg-slate-100 hover:text-slate-800`}>
            <ChevronLeft size={16} aria-hidden="true" />
          </button>
          {pageTokens(current, totalPages).map(tok => (typeof tok === 'number' ? (
            <button key={tok} type="button" aria-label={`Go to page ${tok}`}
              aria-current={tok === current ? 'page' : undefined}
              onClick={() => onPageChange(tok)}
              className={`${CONTROL} tabular-nums ${tok === current ? 'text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
              style={tok === current ? { background: 'var(--color-primary)' } : undefined}>
              {tok}
            </button>
          ) : (
            <span key={tok} aria-hidden="true" className="px-1 text-xs text-slate-400">…</span>
          )))}
          <button type="button" aria-label="Next page" disabled={current >= totalPages}
            onClick={() => onPageChange(current + 1)}
            className={`${CONTROL} text-slate-500 hover:bg-slate-100 hover:text-slate-800`}>
            <ChevronRight size={16} aria-hidden="true" />
          </button>
        </nav>
      )}
    </div>
  )
}
