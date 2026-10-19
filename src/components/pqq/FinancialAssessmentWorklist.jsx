import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Undo2, Users, Wallet } from 'lucide-react'
import ListPagination from '../shell/ListPagination'
import { PREQUAL_STATUSES, STAGE_OWNER } from './pqqModel'
import { PAGE_FILL } from '../layout/pageFill'

/*
 * The Contract Engineer's PQQ Financial Assessment worklist — the main app's
 * `/pre-qualification/financial` page (FixedListCard + IconHeading +
 * PickerCard rows + ListPagination), on the local tenders.
 *
 * Lists every submitted Stage 3 run the Contract Engineer is involved in: the
 * ones awaiting the assessment, and the ones already returned to the Contract
 * Holder (still listed, flagged as needing no further action), exactly as the
 * main app does.
 */

const isAwaitingAssessment = t =>
  t.status === 'prequal_stage4' || (PREQUAL_STATUSES.includes(t.status) && STAGE_OWNER[t.status] === 'pof')

// Assessed and sent back, but the pre-qualification round is still open.
const isReturnedToHolder = t =>
  PREQUAL_STATUSES.includes(t.status) && t.status !== 'prequal_stage4'
  && Boolean(t.financialAssessmentCompletedAt || t.financialReturnedToHolderAt || t.returnedToHolder)

export default function FinancialAssessmentWorklist({ tenders }) {
  const navigate = useNavigate()
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const assignments = tenders.filter(t => isAwaitingAssessment(t) || isReturnedToHolder(t))
  const totalPages = Math.max(1, Math.ceil(assignments.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageItems = assignments.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    // The page IS the layout's parent container, like every worklist: it bleeds
    // to the container's edges and fills it — heading on top, rows scrolling,
    // pagination pinned below.
    <div className={PAGE_FILL}>
      {/* ── Header ── */}
      <div className="flex shrink-0 items-start justify-between gap-4 px-4 pt-4 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f3fb] text-[#0089cf]">
            <Wallet size={18} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-[#1b4c6f]">Financial Assessment</h2>
            <p className="mt-0.5 text-xs text-slate-500">Pre-qualification runs awaiting your financial assessment</p>
          </div>
        </div>
        <span className="shrink-0 rounded-full bg-[#ecf4fc] px-2.5 py-1 text-xs text-slate-500 tabular-nums">
          {assignments.length} {assignments.length === 1 ? 'assignment' : 'assignments'}
        </span>
      </div>

      {/* ── Rows ── */}
      <div role="region" aria-label="Financial assessment worklist" tabIndex={0}
        className="min-h-0 flex-1 overflow-y-auto border-t border-[#cce6f8] px-3 py-2.5 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#0089cf]">
        {assignments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-[#cce6f8] p-6 text-center sm:p-10">
            <span className="flex size-10 items-center justify-center rounded-xl bg-[#e8f3fb] text-[#0089cf]">
              <Wallet size={18} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-slate-800">No pre-qualifications awaiting your financial assessment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pageItems.map(item => {
              const bidders = (item.prequalBidders || []).filter(b => !b.droppedAt)
              const bidderCount = item.bidderCount ?? bidders.length
              const assessedCount = item.assessedCount ?? bidders.filter(b => b.stage4?.result).length
              return (
                <button key={item.id} type="button"
                  onClick={() => navigate(`/pre-qualification/${item.id}`)}
                  className="group block w-full rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30">
                  <div className="overflow-hidden rounded-xl border border-[#cce6f8] bg-white px-3.5 py-2 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#0089cf]/40 hover:bg-[#0089cf]/[0.06]">
                    <div className="flex items-center justify-between gap-3 sm:gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                          <h3 className="max-w-full truncate text-sm font-semibold text-slate-800">{item.title}</h3>
                          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sky-700 animate-pulse motion-reduce:animate-none">
                            Submitted
                          </span>
                        </div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                            <Users className="size-3 shrink-0" aria-hidden="true" />
                            {assessedCount} of {bidderCount} bidder{bidderCount === 1 ? '' : 's'} assessed
                          </span>
                          {isReturnedToHolder(item) && (
                            <span className="flex min-w-0 items-center gap-1 text-xs text-slate-500">
                              <Undo2 className="size-3 shrink-0" aria-hidden="true" />
                              Returned to the Contract Holder - no further action needed unless it comes back.
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-slate-400 transition-colors group-hover:text-[#0089cf]" aria-hidden="true" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {assignments.length > 0 && (
        <div className="shrink-0 border-t border-[#cce6f8] bg-white px-3 py-1.5">
          <ListPagination
            page={currentPage}
            pageSize={pageSize}
            total={assignments.length}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1) }}
          />
        </div>
      )}
    </div>
  )
}
