import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Calendar, ChevronLeft, ChevronRight, ClipboardList, FileText, Hash,
  RefreshCw, RotateCcw, Search, UserPlus, Users,
} from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import ListPagination from '../shell/ListPagination'
import { useAuth } from '../../context/AuthContext'
import { useTenders } from '../../context/TenderContext'
import { canEvaluate, isUnassignedSide } from '../../utils/evalAssignment'
import { isOpenForTech, scmReturnFor } from './model'

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
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div className="flex min-w-0 flex-1 basis-72 items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
            <ClipboardList size={18} />
          </span>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-800">{LIST_TITLE}</h2>
            <p className="mt-0.5 text-xs text-slate-400">{LIST_DESCRIPTION}</p>
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
                placeholder="Search…"
                className="olng-input w-48 rounded-lg border border-slate-200 py-1.5 pl-8 pr-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              />
            </label>
          )}
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
            {filtered.length} tender{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <div className="p-4">
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
          <ul className="space-y-2">
            {pageItems.map(tender => {
              const returned = scmReturnFor(tender)
              return (
                <li key={tender.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/technical-eval/${tender.id}`)}
                    className="group block w-full rounded-xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-[var(--color-primary)]/30 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2">
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
                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
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
                          <p className="text-sm font-bold text-slate-800">{tender.budget}</p>
                          <p className="text-[10px] text-slate-400">Budget</p>
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
        <div className="shrink-0 border-t border-slate-100 px-4 py-3">
          <ListPagination
            page={current}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1) }}
          />
        </div>
      )}
    </Card>
  )
}
