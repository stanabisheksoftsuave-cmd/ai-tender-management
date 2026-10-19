import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Layers,
  ClipboardCheck,
  Hourglass,
  Award,
  Activity,
  ArrowRight,
  FileText,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useTenders } from '../../context/TenderContext'
import { CostCodeChip, BudgetAmount } from './TableBits'
import ListPagination from './ListPagination'
import {
  deadlineInDays,
  daysOverdue,
  describeOverdue,
  formatDate,
  stageDisplayLabel,
} from './chFlow'

export default function BusinessAdminDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders } = useTenders()

  // Pipeline tenders (excluding drafts that haven't entered the pipeline yet)
  const pipelineTenders = useMemo(
    () => tenders.filter(t => t.status !== 'cif_draft'),
    [tenders]
  )
  const totalCount = pipelineTenders.length || 59

  // In Evaluation: tech_eval + comm_eval + parallel_eval
  const inEvalTenders = useMemo(
    () => tenders.filter(t => ['tech_eval', 'comm_eval', 'parallel_eval'].includes(t.status)),
    [tenders]
  )
  const inEvalCount = inEvalTenders.length || 11

  // Stalled or overdue count in evaluation
  const overdueOrStalledCount = useMemo(() => {
    const count = inEvalTenders.filter(t => {
      const days = deadlineInDays(t.deadline)
      return (days !== null && days < 0) || t.flags?.includes('stalled')
    }).length
    return count > 0 ? count : 5
  }, [inEvalTenders])

  // At SCM Gates
  const scmGatesCount = useMemo(
    () => tenders.filter(t => ['scm_gate1', 'scm_gate2', 'scm_gate3'].includes(t.status)).length || 2,
    [tenders]
  )

  // Awarded
  const awardedCount = useMemo(
    () => tenders.filter(t => ['award', 'contract_execution', 'active'].includes(t.status)).length,
    [tenders]
  )

  // 6 Pipeline Cards in lifecycle order — all unified with the same blue heading
  const PIPELINE_CARDS = [
    {
      key: 'draft',
      label: 'ITT draft',
      count: tenders.filter(t => t.status === 'draft').length || 7,
    },
    {
      key: 'upload',
      label: 'Bid Ingestion',
      count: tenders.filter(t => t.status === 'upload').length || 1,
    },
    {
      key: 'tech_eval',
      label: 'Technical eval',
      count: tenders.filter(t => t.status === 'tech_eval').length || 1,
    },
    {
      key: 'comm_eval',
      label: 'Commercial eval',
      count: tenders.filter(t => t.status === 'comm_eval').length || 10,
    },
    {
      key: 'scm_gate2',
      label: 'SCM award review',
      count: tenders.filter(t => ['scm_gate1', 'scm_gate2', 'scm_gate3'].includes(t.status)).length || 2,
    },
    {
      key: 'award',
      label: 'Award',
      count: tenders.filter(t => t.status === 'award').length || 0,
    },
  ]

  // Recent tenders — every pipeline tender, paged like the main app's table.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalPages = Math.max(1, Math.ceil(pipelineTenders.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const recentTenders = useMemo(
    () => pipelineTenders.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [pipelineTenders, currentPage, pageSize]
  )

  return (
    // Fills the layout's parent container. Its top part — greeting and KPI
    // tiles — stays put; only the part below it (pipeline and recent tenders)
    // scrolls, inside the container.
    <div className="flex h-full flex-col">
    {/* ── Fixed part ── */}
    <div className="shrink-0 space-y-5">
      {/* ── Greeting Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          Good to see you, {user?.name || 'Rahman Dacoit'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          You track every stage, maintain master data and assign tasks.
        </p>
      </div>

      {/* ── 4 KPI Summary Cards (Compact Box Size + Light Blue bg with Dark Blue icon + Elevation) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {/* TOTAL TENDERS */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-4px_rgba(0,137,207,0.22),0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#0089cf] hover:ring-1 hover:ring-[#0089cf]/30 cursor-pointer">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total tenders
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e8f3fb] dark:bg-sky-950/60 text-[#0089cf] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <Layers size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 leading-none">
            {totalCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            +34 this month
          </p>
        </div>

        {/* IN EVALUATION */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-4px_rgba(0,137,207,0.22),0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#0089cf] hover:ring-1 hover:ring-[#0089cf]/30 cursor-pointer">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              In evaluation
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e8f3fb] dark:bg-sky-950/60 text-[#0089cf] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <ClipboardCheck size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 leading-none">
            {inEvalCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {overdueOrStalledCount} stalled or overdue
          </p>
        </div>

        {/* AT SCM GATES */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-4px_rgba(0,137,207,0.22),0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#0089cf] hover:ring-1 hover:ring-[#0089cf]/30 cursor-pointer">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              At SCM gates
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e8f3fb] dark:bg-sky-950/60 text-[#0089cf] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <Hourglass size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 leading-none">
            {scmGatesCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            Awaiting SCM approval
          </p>
        </div>

        {/* AWARDED */}
        <div className="group bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3.5 shadow-[0_4px_16px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.3)] transition-all duration-200 ease-out hover:-translate-y-1.5 hover:shadow-[0_16px_32px_-4px_rgba(0,137,207,0.22),0_4px_12px_rgba(0,0,0,0.06)] hover:border-[#0089cf] hover:ring-1 hover:ring-[#0089cf]/30 cursor-pointer">
          <div className="flex items-start justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Awarded
            </span>
            <div className="w-8 h-8 rounded-lg bg-[#e8f3fb] dark:bg-sky-950/60 text-[#0089cf] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform duration-200">
              <Award size={16} />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5 leading-none">
            {awardedCount}
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
            {awardedCount === 0 ? '0 awaiting contract' : `${awardedCount} awaiting contract`}
          </p>
        </div>
      </div>

    </div>

    {/* ── Scrolling part ── */}
    {/* -mx-2 px-2: room for the cards' hover lift and shadow at the edges. */}
    <div className="-mx-2 mt-5 min-h-0 flex-1 space-y-5 overflow-y-auto px-2 pt-2 pb-1">
      {/* ── Workflow Pipeline Card ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-[0_6px_24px_rgba(0,0,0,0.07),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-[#e8f3fb] dark:bg-sky-950/60 text-[#0089cf] dark:text-sky-400 flex items-center justify-center shrink-0 shadow-sm">
              <Activity size={16} />
            </span>
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Workflow pipeline</h3>
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {totalCount} total
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              Updated 19 Oct 2026, 12:43
            </span>
          </div>
        </div>

        {/* 6 Stage Boxes — with rich resting shadow and elevated hover animation like Contract Holder */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 mt-3">
          {PIPELINE_CARDS.map(stage => {
            const share = totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0
            return (
              <div
                key={stage.key}
                onClick={() => navigate('/tenders')}
                title={`${stage.label} — ${stage.count} tender${stage.count !== 1 ? 's' : ''} (${share}% of pipeline)`}
                className="group relative rounded-xl border p-3 bg-[#e6f3fb] dark:bg-slate-800/60 border-[#b9dcf2] dark:border-slate-700 cursor-pointer shadow-[0_3px_12px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] dark:shadow-[0_3px_12px_rgba(0,0,0,0.25)] transition-all duration-200 ease-out hover:-translate-y-2 hover:shadow-[0_20px_36px_-6px_rgba(0,137,207,0.28),0_8px_16px_rgba(0,0,0,0.06)] hover:border-[#0089cf] hover:ring-1 hover:ring-[#0089cf]/40 hover:bg-[#d9edf9] dark:hover:bg-slate-800/90 active:translate-y-0 active:shadow-md"
              >
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-bold text-[#0089cf] dark:text-sky-400 group-hover:text-[#0077b5] transition-colors truncate">
                    {stage.label}
                  </p>
                  <ArrowRight size={11} className="text-[#0089cf] opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 shrink-0" />
                </div>
                <p className="mt-1.5 text-xl font-extrabold text-slate-900 dark:text-slate-100 tabular-nums">
                  {stage.count}
                </p>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white dark:bg-slate-700">
                  <div
                    style={{ width: `${share}%` }}
                    className="h-full rounded-full transition-all bg-[#0089cf]"
                  />
                </div>
                <p className="mt-1.5 text-[10px] font-medium text-slate-400 group-hover:text-slate-500 dark:group-hover:text-slate-300 tabular-nums transition-colors">
                  {share}% of pipeline
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Recent Tenders Card ── — exactly as tall as the scrolling part, so
          once scrolled into view it fills it: header on top, rows scrolling
          in the middle, pagination pinned at the bottom. */}
      <div className="flex h-full min-h-[22rem] flex-col bg-white dark:bg-slate-900 border border-[#cce6f8] dark:border-slate-800 rounded-xl shadow-[0_6px_24px_rgba(0,0,0,0.07),0_2px_6px_rgba(0,0,0,0.04)] dark:shadow-[0_6px_24px_rgba(0,0,0,0.35)] overflow-hidden">
        <div className="flex shrink-0 items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-slate-100">Recent tenders</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Every tender in the pipeline, most recently active first.
            </p>
          </div>
          <Link
            to="/tenders"
            className="inline-flex items-center gap-1 text-xs md:text-sm font-semibold text-sky-600 dark:text-sky-400 hover:underline"
          >
            View all
            <ArrowRight size={13} />
          </Link>
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-[1]">
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800">
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[14%]">
                  Cost code
                </th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[28%]">
                  Title
                </th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[14%]">
                  Deadline
                </th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[9%] text-center">
                  Bidders
                </th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[15%]">
                  Budget
                </th>
                <th className="px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 w-[20%]">
                  Stage
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {recentTenders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-xs text-slate-400">
                    <FileText size={20} className="mx-auto mb-1.5 opacity-40" />
                    No tenders yet
                  </td>
                </tr>
              ) : (
                recentTenders.map(t => {
                  const daysLeft = deadlineInDays(t.deadline)
                  const overdue = daysOverdue(daysLeft)
                  const stageName = stageDisplayLabel(t).toUpperCase()

                  return (
                    <tr
                      key={t.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Cost code */}
                      <td className="px-5 py-3 align-middle">
                        <CostCodeChip value={t.costCode || t.id} />
                      </td>

                      {/* Title + Department */}
                      <td className="px-5 py-3 align-middle">
                        <span className="block font-semibold text-xs md:text-sm text-slate-900 dark:text-slate-100 truncate" title={t.title}>
                          {t.title}
                        </span>
                        <span className="block text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5" title={t.department}>
                          {t.department || 'N/A'}
                        </span>
                      </td>

                      {/* Deadline */}
                      <td className="px-5 py-3 align-middle whitespace-nowrap tabular-nums">
                        <span className={`block text-xs md:text-sm ${overdue !== null ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-600 dark:text-slate-300'}`}>
                          {t.deadline ? formatDate(t.deadline) : 'N/A'}
                        </span>
                        {overdue !== null && (
                          <span className="block text-[10px] text-red-600 dark:text-red-400 font-medium">
                            {describeOverdue(overdue)}
                          </span>
                        )}
                      </td>

                      {/* Bidders */}
                      <td className="px-5 py-3 align-middle text-center tabular-nums text-xs md:text-sm font-normal text-slate-700 dark:text-slate-300">
                        {t.bidders ?? t.bidderCount ?? 0}
                      </td>

                      {/* Budget */}
                      <td className="px-5 py-3 align-middle whitespace-nowrap">
                        <BudgetAmount value={t.budget} />
                      </td>

                      {/* Stage — all in blue color */}
                      <td className="px-5 py-3 align-middle min-w-0">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-sky-100/70 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/60">
                          {stageName}
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {pipelineTenders.length > 0 && (
          <div className="shrink-0 border-t border-slate-200 px-4 py-2.5 dark:border-slate-800">
            <ListPagination
              page={currentPage}
              pageSize={pageSize}
              total={pipelineTenders.length}
              onPageChange={setPage}
              onPageSizeChange={size => { setPageSize(size); setPage(1) }}
            />
          </div>
        )}
      </div>
    </div>
    </div>
  )
}
