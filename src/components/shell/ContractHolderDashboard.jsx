import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2, ClipboardCheck, FileText, Inbox, Plus, Search } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import SearchableSelect from '../ui/SearchableSelect'
import { useAuth } from '../../context/AuthContext'
import { useTenders } from '../../context/TenderContext'
import { useAccess } from '../../utils/permissions'
import { tenderRef } from '../../utils/tenderRef'
import { useDebouncedValue } from './useDebouncedValue'
import ListPagination from './ListPagination'
import { AttentionPill, BudgetAmount, CostCodeChip, TenderRowMenu } from './TableBits'
import {
  ALL_FILTER,
  URGENT_FILTER,
  buildAttentionOptions,
  chNextAction,
  chNextActionLink,
  daysOverdue,
  deadlineInDays,
  describeOverdue,
  formatDate,
  isUrgent,
  stageDisplayLabel,
} from './chFlow'

/*
 * Contract Holder dashboard — main app's ContractHolderDashboard +
 * ContractHolderTenderList + AttentionTenderCard/AttentionTable, driven by
 * the local tenders instead of GET /dashboard/contract-holder.
 *
 *   "Awaiting you" / the attention table = tenders whose next action belongs
 *   to the Contract Holder (chNextAction).
 *   "Urgent" = one of those whose deadline is overdue or ≤ 7 days away.
 */

const COMPLETED_STATUSES = ['active', 'contract_closure', 'closed']
const EVALUATION_STATUSES = ['tech_eval', 'comm_eval', 'parallel_eval']
const NOT_ACTIVE_STATUSES = ['cif_draft', 'prequal_rejected', ...COMPLETED_STATUSES]

const COLUMNS = [
  { label: 'Cost code', width: '13%' },
  { label: 'Title',     width: '24%' },
  { label: 'Deadline',  width: '13%' },
  { label: 'Bidders',   width: '8%' },
  { label: 'Budget',    width: '14%' },
  { label: 'Stage',     width: '20%' },
  { label: 'Actions',   width: '8%', right: true },
]

function StatCard({ label, value, icon: Icon }) {
  return (
    <Card className="p-3">
      <div className="flex items-start gap-3">
        <span className="inline-flex w-8 h-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
          <Icon size={16} aria-hidden="true" />
        </span>
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-800">{value}</p>
        </div>
      </div>
    </Card>
  )
}

function AttentionRow({ row, canOpen }) {
  const overdue = daysOverdue(row.daysLeft)
  const { tender } = row
  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
      <td className="px-4 py-1.5"
        style={{ borderLeft: `3px solid ${row.urgent ? '#EF4444' : 'transparent'}` }}>
        <CostCodeChip value={tender.costCode} />
      </td>
      <td className="px-4 py-1.5">
        <span className="block truncate text-sm font-medium text-slate-800" title={tender.title}>{tender.title}</span>
        {tender.department && (
          <span className="block truncate text-xs text-slate-400" title={tender.department}>{tender.department}</span>
        )}
      </td>
      <td className="px-4 py-1.5 text-sm tabular-nums">
        <span className={`block truncate ${overdue !== null ? 'font-medium text-red-600' : 'text-slate-500'}`}>
          {tender.deadline ? formatDate(tender.deadline) : 'N/A'}
        </span>
        {overdue !== null && (
          <span className="block truncate text-xs text-red-600">{describeOverdue(overdue)}</span>
        )}
      </td>
      <td className="px-4 py-1.5 text-sm tabular-nums">
        <span className={(tender.bidders || 0) > 0 ? 'font-semibold text-slate-800' : 'text-slate-400'}>
          {tender.bidders || 0}
        </span>
      </td>
      <td className="px-4 py-1.5 text-sm whitespace-nowrap tabular-nums">
        <BudgetAmount value={tender.budget} />
      </td>
      <td className="px-4 py-1.5 min-w-0">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="inline-flex max-w-full items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-blue-700 ring-1 ring-blue-200">
            <span title={row.stageLabel} className="block min-w-0 truncate">{row.stageLabel}</span>
          </span>
          {row.urgent && <AttentionPill label="Urgent" />}
        </div>
      </td>
      <td className="px-4 py-1.5 text-right">
        <TenderRowMenu title={tender.title} action={row.action} canOpen={canOpen} />
      </td>
    </tr>
  )
}

export default function ContractHolderDashboard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders } = useTenders()
  const { can } = useAccess()

  const [searchInput, setSearchInput] = useState('')
  const [filter, setFilter] = useState(ALL_FILTER)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const search = useDebouncedValue(searchInput.trim().toLowerCase())

  // Every tender waiting on the Contract Holder, with its next action.
  const rows = useMemo(() => tenders
    .map(tender => {
      const nextAction = chNextAction(tender)
      if (!nextAction) return null
      const daysLeft = deadlineInDays(tender.deadline)
      return {
        tender,
        nextAction,
        action: chNextActionLink(tender, nextAction),
        daysLeft,
        urgent: isUrgent(daysLeft),
        stageLabel: stageDisplayLabel(tender),
      }
    })
    .filter(Boolean)
    // Urgent first, then soonest deadline.
    .sort((a, b) => (Number(b.urgent) - Number(a.urgent))
      || ((a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))),
  [tenders])

  const kpis = useMemo(() => ({
    activeTenders: tenders.filter(t => !NOT_ACTIVE_STATUSES.includes(t.status)).length,
    awaitingYou: rows.length,
    inEvaluation: tenders.filter(t => EVALUATION_STATUSES.includes(t.status)).length,
    completed: tenders.filter(t => COMPLETED_STATUSES.includes(t.status)).length,
  }), [tenders, rows])
  const urgentCount = rows.filter(r => r.urgent).length

  const filterOptions = useMemo(() => buildAttentionOptions(rows), [rows])
  const activeOption = filterOptions.find(o => o.value === filter)

  const filtered = rows.filter(r => {
    if (filter === URGENT_FILTER && !r.urgent) return false
    // A group whose last row just moved on falls back to "All".
    if (activeOption?.actionTypes && !activeOption.actionTypes.includes(r.nextAction)) return false
    if (!search) return true
    return [r.tender.costCode, r.tender.title, r.tender.id, r.tender.department, tenderRef(r.tender)]
      .some(f => String(f ?? '').toLowerCase().includes(search))
  })
  const isFiltered = search !== '' || filter !== ALL_FILTER
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const canCreateCif = can('/contract-strategy')
  const canCreateItt = can('/create-itt')

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-800">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Welcome back, {user?.name}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {urgentCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
              {urgentCount} urgent {urgentCount === 1 ? 'item' : 'items'}
            </span>
          )}
          {canCreateCif && (
            <Button type="button" variant="brand" onClick={() => navigate('/contract-strategy/new')}>
              <Plus size={16} aria-hidden="true" /> New CIF
            </Button>
          )}
          {canCreateItt && (
            <Button type="button" variant="secondary" className="border border-slate-200 bg-white"
              onClick={() => navigate('/create-itt?new=1')}>
              <Plus size={16} aria-hidden="true" /> New ITT
            </Button>
          )}
        </div>
      </div>

      {/* ── KPIs ── */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard label="Active tenders" value={kpis.activeTenders} icon={FileText} />
        <StatCard label="Awaiting you"   value={kpis.awaitingYou}   icon={Inbox} />
        <StatCard label="In evaluation"  value={kpis.inEvaluation}  icon={ClipboardCheck} />
        <StatCard label="Completed"      value={kpis.completed}     icon={CheckCircle2} />
      </div>

      {/* ── Needs your attention ── */}
      <Card className="flex min-h-64 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-base font-semibold text-slate-800">
            Needs your attention{' '}
            <span className="ml-1.5 font-normal tabular-nums text-slate-400">({kpis.awaitingYou})</span>
          </h3>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <div className="relative w-full sm:min-w-56 sm:flex-1 sm:max-w-sm">
                <Search size={16} aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={e => { setSearchInput(e.target.value); setPage(1) }}
                  placeholder="Search code, title..."
                  aria-label="Search tenders"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                />
              </div>
              <div className="w-full sm:w-52 sm:shrink-0">
                <SearchableSelect
                  value={filter}
                  onChange={v => { setFilter(v); setPage(1) }}
                  options={filterOptions}
                  getValue={o => o.value}
                  getLabel={o => `${o.label} (${o.count})`}
                  searchable={false}
                  ariaLabel="Filter tenders"
                />
              </div>
            </div>
            <Link to="/tenders"
              className="inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-semibold hover:underline"
              style={{ color: 'var(--color-primary)' }}>
              View all <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-x-auto">
          {pageRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
              <span className="flex w-12 h-12 items-center justify-center rounded-full bg-slate-100">
                <FileText size={22} className="text-slate-400" aria-hidden="true" />
              </span>
              <p className="text-sm font-semibold text-slate-800">
                {isFiltered ? 'No matching tenders' : 'Nothing needs your action'}
              </p>
              <p className="text-xs text-slate-500">
                {isFiltered ? 'Try a different search or filter.' : 'Tenders waiting on you will appear here.'}
              </p>
            </div>
          ) : (
            <table className="w-full min-w-[56rem] table-fixed">
              <colgroup>
                {COLUMNS.map(c => <col key={c.label} style={{ width: c.width }} />)}
              </colgroup>
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-100">
                  {COLUMNS.map(c => (
                    <th key={c.label}
                      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500 ${c.right ? 'text-right' : 'text-left'}`}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pageRows.map(row => (
                  <AttentionRow
                    key={row.tender.id}
                    row={row}
                    canOpen={!!row.action && can(row.action.href.split('?')[0])}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="shrink-0 px-4 py-3" style={{ borderTop: '1px solid var(--color-border)' }}>
          <ListPagination
            page={currentPage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={size => { setPageSize(size); setPage(1) }}
          />
        </div>
      </Card>
    </div>
  )
}
