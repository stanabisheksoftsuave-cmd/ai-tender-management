import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, CheckCircle2, ClipboardCheck, Clock, FileText, Inbox, Search, Timer, Trophy, Undo2,
} from 'lucide-react'
import Card from '../ui/Card'
import SearchableSelect from '../ui/SearchableSelect'
import { useAuth } from '../../context/AuthContext'
import { useTenders } from '../../context/TenderContext'
import { useAccess } from '../../utils/permissions'
import { tenderRef } from '../../utils/tenderRef'
import { useDebouncedValue } from './useDebouncedValue'
import ListPagination from './ListPagination'
import { AttentionRow, StatCard } from './ContractHolderDashboard'
import {
  ALL_FILTER,
  URGENT_FILTER,
  deadlineInDays,
  isUrgent,
  stageDisplayLabel,
} from './chFlow'

/*
 * Supply Chain dashboard — main app's SupplyChainDashboard +
 * SupplyChainTenderList, driven by the local tenders instead of
 * GET /dashboard/supply-chain.
 *
 *   "Awaiting approval" / the attention table = tenders sitting at one of the
 *   three SCM gates (scm_gate1/2/3).
 *   "Returned" = tenders the SCM sent back that have not come round to a gate yet.
 *   "Approved, last 30 days" = gate approvals recorded in scmDecisions.
 *   "Average decision time" needs the moment a tender reached its gate, which
 *   nothing records yet — so it shows "-", the main app's no-data value.
 */

// Gate → the main app's next-action type, filter group and review route.
const GATES = {
  scm_gate1: { filter: 'technical_review', label: 'Technical review', action: 'Technical Review', route: '/scm-tech-review' },
  scm_gate2: { filter: 'award_review',     label: 'Award review',     action: 'Award Review',     route: '/scm-award-review' },
  scm_gate3: { filter: 'contract_review',  label: 'Contract review',  action: 'Contract Review',  route: '/scm-contract-review' },
}
const GATE_STATUSES = Object.keys(GATES)

const DAY_MS = 24 * 60 * 60 * 1000
const RECENT_WINDOW_DAYS = 30

const COLUMNS = [
  { label: 'Cost code', width: '13%' },
  { label: 'Title',     width: '24%' },
  { label: 'Deadline',  width: '13%' },
  { label: 'Bidders',   width: '8%' },
  { label: 'Budget',    width: '14%' },
  { label: 'Stage',     width: '20%' },
  { label: 'Actions',   width: '8%', right: true },
]

/** The tender's most recent SCM decision across all three gates, if any. */
function latestDecision(tender) {
  return Object.values(tender.scmDecisions || {})
    .filter(d => d?.at)
    .sort((a, b) => new Date(b.at) - new Date(a.at))[0] || null
}

/** Gate approvals recorded in the last 30 days, across every tender and gate. */
function countRecentApprovals(tenders, now = new Date()) {
  const since = now.getTime() - RECENT_WINDOW_DAYS * DAY_MS
  return tenders.reduce((sum, t) => sum + Object.values(t.scmDecisions || {})
    .filter(d => d?.decision === 'approved' && d.at && new Date(d.at).getTime() >= since).length, 0)
}

export default function SupplyChainDashboard() {
  const { user } = useAuth()
  const { tenders } = useTenders()
  const { can } = useAccess()

  const [searchInput, setSearchInput] = useState('')
  const [filter, setFilter] = useState(ALL_FILTER)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const search = useDebouncedValue(searchInput.trim().toLowerCase())

  // Every tender waiting at an SCM gate, with the review it needs.
  const rows = useMemo(() => tenders
    .filter(t => GATE_STATUSES.includes(t.status))
    .map(tender => {
      const gate = GATES[tender.status]
      const daysLeft = deadlineInDays(tender.deadline)
      return {
        tender,
        gate: tender.status,
        action: { label: gate.action, href: `${gate.route}/${encodeURIComponent(tender.id)}` },
        daysLeft,
        urgent: isUrgent(daysLeft),
        stageLabel: stageDisplayLabel(tender),
      }
    })
    // Urgent first, then soonest deadline.
    .sort((a, b) => (Number(b.urgent) - Number(a.urgent))
      || ((a.daysLeft ?? Infinity) - (b.daysLeft ?? Infinity))),
  [tenders])

  const kpis = useMemo(() => {
    const byGate = gate => rows.filter(r => r.gate === gate).length
    return {
      awaiting: rows.length,
      technicalReview: byGate('scm_gate1'),
      awardReview: byGate('scm_gate2'),
      contractReview: byGate('scm_gate3'),
      overdue: rows.filter(r => r.daysLeft !== null && r.daysLeft < 0).length,
      returned: tenders.filter(t => !GATE_STATUSES.includes(t.status)
        && latestDecision(t)?.decision === 'returned').length,
      approvedRecently: countRecentApprovals(tenders),
    }
  }, [tenders, rows])
  const urgentCount = rows.filter(r => r.urgent).length

  // All / Urgent, then one entry per gate — listed even at zero, as in the main app.
  const filterOptions = useMemo(() => [
    { value: ALL_FILTER, label: 'All', count: rows.length },
    { value: URGENT_FILTER, label: 'Urgent', count: urgentCount },
    ...GATE_STATUSES.map(gate => ({
      value: GATES[gate].filter,
      label: GATES[gate].label,
      count: rows.filter(r => r.gate === gate).length,
      gate,
    })),
  ], [rows, urgentCount])
  const activeOption = filterOptions.find(o => o.value === filter)

  const filtered = rows.filter(r => {
    if (filter === URGENT_FILTER && !r.urgent) return false
    if (activeOption?.gate && r.gate !== activeOption.gate) return false
    if (!search) return true
    return [r.tender.costCode, r.tender.title, r.tender.id, r.tender.department, tenderRef(r.tender)]
      .some(f => String(f ?? '').toLowerCase().includes(search))
  })
  const isFiltered = search !== '' || filter !== ALL_FILTER
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6">
      {/* ── Page header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-slate-800">Dashboard Overview</h2>
          <p className="text-sm text-slate-500">Welcome back, {user?.name}</p>
        </div>
        {urgentCount > 0 && (
          <span className="inline-flex items-center self-start rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 ring-1 ring-red-200">
            {urgentCount} urgent {urgentCount === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>

      {/* ── KPIs ── */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 min-[20rem]:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Awaiting approval" value={kpis.awaiting}        icon={Inbox} />
          <StatCard label="Technical review"  value={kpis.technicalReview} icon={ClipboardCheck} />
          <StatCard label="Award review"      value={kpis.awardReview}     icon={Trophy} />
          <StatCard label="Contract review"   value={kpis.contractReview}  icon={FileText} />
        </div>
        <div className="grid grid-cols-1 gap-3 min-[20rem]:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Overdue"                value={kpis.overdue}          icon={Clock} />
          <StatCard label="Returned"               value={kpis.returned}         icon={Undo2} />
          <StatCard label="Approved, last 30 days" value={kpis.approvedRecently} icon={CheckCircle2} />
          <StatCard label="Average decision time"  value="-"                     icon={Timer} />
        </div>
      </div>

      {/* ── Needs your attention ── */}
      <Card className="flex min-h-64 min-w-0 flex-1 flex-col">
        <div className="flex shrink-0 flex-wrap items-center gap-3 px-5 py-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="text-base font-semibold text-slate-800">
            Needs your attention{' '}
            <span className="ml-1.5 font-normal tabular-nums text-slate-400">({kpis.awaiting})</span>
          </h3>
          <div className="flex min-w-0 flex-1 flex-wrap items-center justify-end gap-3">
            <div className="flex flex-1 flex-wrap items-center justify-end gap-2">
              <div className="relative w-full sm:min-w-56 sm:flex-1">
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
                {isFiltered ? 'No matching tenders' : 'Nothing awaiting your approval'}
              </p>
              <p className="text-xs text-slate-500">
                {isFiltered ? 'Try a different search or filter.' : 'Tenders reaching an SCM gate will appear here.'}
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
                    canOpen={can(row.action.href.split('?')[0])}
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
