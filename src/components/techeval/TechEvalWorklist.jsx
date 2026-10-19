import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Calendar, ChevronRight, ClipboardList, FileText, Hash,
  RefreshCw, RotateCcw, Search, UserPlus, Users,
} from 'lucide-react'
import Badge from '../ui/Badge'
import ListPagination from '../shell/ListPagination'
import { useAuth } from '../../context/AuthContext'
import { useTenders } from '../../context/TenderContext'
import { canEvaluate, isUnassignedSide } from '../../utils/evalAssignment'
import { isOpenForTech, scmReturnFor } from './model'
import { PAGE_FILL } from '../layout/pageFill'

const LIST_TITLE = 'Technical Evaluation'
const LIST_DESCRIPTION = 'Select a tender to begin compliance evaluation'

const matches = (query, ...fields) => {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return fields.some(f => String(f || '').toLowerCase().includes(q))
}

/**
 * The technical-evaluation worklist — MAIN's `IttTechnicalEvaluationWorklist`
 * + `TenderSelectList`: every tender open for technical evaluation that this
 * user may evaluate (assignment-aware `canEvaluate`), including those Supply
 * Chain returned at the technical gate (or the award gate, targeted at the
 * technical side) for revision — flagged "Returned by SCM".
 */
export function TechEvalWorklist() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders } = useTenders()
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // Supply Chain returns land a tender back on tech_eval (or parallel_eval with
  // the technical side re-opened), so `isOpenForTech` already covers them; the
  // return itself is read off `scmDecisions` for the chip.
  const board = tenders.filter(t => canEvaluate(t, 'tech', user) && isOpenForTech(t))
  const filtered = board.filter(t => matches(searchInput, t.title, t.costCode, t.department))
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const current = Math.min(page, totalPages)
  const pageItems = filtered.slice((current - 1) * pageSize, current * pageSize)

  return (
    // The page IS the layout's parent container, like every worklist: it bleeds
    // to the container's edges and fills it — heading on top, rows scrolling,
    // pagination pinned below.
    <div className={PAGE_FILL}>
      <div className="flex shrink-0 flex-wrap items-start justify-between gap-3 px-4 pt-4 pb-3">
        <div className="flex min-w-0 flex-1 basis-72 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fb] text-[#0089cf]">
            <ClipboardList size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#1b4c6f]">{LIST_TITLE}</h2>
            <p className="mt-0.5 text-xs text-slate-500">{LIST_DESCRIPTION}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {board.length > 0 && (
            <label className="relative">
              <span className="sr-only">Search {LIST_TITLE}</span>
              <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchInput}
                onChange={(e) => { setSearchInput(e.target.value); setPage(1) }}
                placeholder="Search by tender title"
                className="h-9 w-56 rounded-lg border border-[#cce6f8] bg-white pl-8 pr-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:w-64"
              />
            </label>
          )}
          <span className="rounded-full bg-[#ecf4fc] px-2.5 py-1 text-xs text-slate-500 tabular-nums">
            {filtered.length} tender{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div role="region" aria-label={`${LIST_TITLE} worklist`} tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto border-t border-[#cce6f8] px-3 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0089cf]">
        {filtered.length === 0 && board.length > 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14 text-slate-400">
            <Search size={28} />
            <p className="text-sm font-medium text-slate-600">No tenders match your search</p>
            <p className="text-xs">Try a different cost code, title or department.</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
            <FileText size={32} />
            <p className="text-sm font-medium">No tenders awaiting technical evaluation</p>
          </div>
        ) : (
          <ul className="space-y-1.5">
            {pageItems.map(tender => {
              const returned = scmReturnFor(tender)
              return (
                <li key={tender.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/technical-eval/${tender.id}`)}
                    className="group block w-full rounded-xl border border-[#cce6f8] bg-white px-3.5 py-2 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0089cf]/40 hover:bg-[#0089cf]/[0.06]"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="truncate text-sm font-semibold text-slate-800">{tender.title}</h3>
                          <Badge variant="tech_eval">{tender.status === 'parallel_eval' ? 'Parallel Evaluation' : 'Technical Evaluation'}</Badge>
                          {tender.evalProgress === 'in_progress' && (
                            <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 ring-1 ring-amber-200">In Progress</span>
                          )}
                          {tender.evalProgress === 'not_started' && (
                            <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">Not Started</span>
                          )}
                          {returned && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-300">
                              <RotateCcw size={8} /> Returned by SCM
                            </span>
                          )}
                          {isUnassignedSide(tender, 'tech') && (
                            <span className="flex items-center gap-1 rounded-full bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-200">
                              <UserPlus size={8} /> Unassigned
                            </span>
                          )}
                          {tender.correctionRequests?.some(r => r.resolved && !r.reExtracted) && (
                            <span className="flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 ring-1 ring-amber-300">
                              <RefreshCw size={8} /> Docs Re-submitted
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Hash size={11} /> Cost Code: {tender.costCode?.trim() || 'N/A'}</span>
                          <span className="flex items-center gap-1"><Calendar size={11} /> {tender.deadline || 'N/A'}</span>
                          <span className="flex items-center gap-1"><Building2 size={11} /> {tender.department}</span>
                          {tender.bidders > 0 && (
                            <span className="flex items-center gap-1"><Users size={11} /> {tender.bidders} {tender.bidders === 1 ? 'bidder' : 'bidders'}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <div className="text-right">
                          <p className="text-[11px] text-slate-500">Budget</p>
                          <p className="text-sm font-bold text-slate-800">{tender.budget}</p>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 transition-colors group-hover:text-[var(--color-primary)]" />
                      </div>
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="shrink-0 border-t border-[#cce6f8] px-3 py-1.5">
          <ListPagination
            page={current}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          />
        </div>
      )}
    </div>
  )
}
