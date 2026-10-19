import { useState, useMemo } from 'react'
import { ChevronDown, RotateCcw, Search, Upload, X } from 'lucide-react'
import SearchableSelect from '../components/ui/SearchableSelect'
import DatePicker from '../components/ui/DatePicker'
import ListPagination from '../components/shell/ListPagination'
import { auditLogs } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useDismissable } from '../context/NavigationContext'
import { PAGE_FILL } from '../components/layout/pageFill'

/*
 * Audit logs — the main app's AuditLogPanel layout: one panel filling the
 * page container, filters along the top (search, action, role, date range,
 * reset, export), an entry count, a table whose rows scroll under a sticky
 * header, and rows-per-page pagination pinned at the bottom. Newest first.
 */

const NO_TENDER = 'This action is not related to a tender'
const hasTender = (t) => t != null && String(t).trim() !== '' && String(t).trim() !== '—'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// '2025-03-10 09:14:32' → '10 Mar 2025, 09:14'. Anything unparseable is shown as stored.
function formatTimestamp(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/.exec(String(value || ''))
  if (!m) return String(value || '')
  return `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}, ${m[4]}:${m[5]}`
}

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`

function downloadCsv(rows) {
  const header = ['Timestamp', 'User', 'Role', 'Action', 'Tender']
  const lines = [header, ...rows.map(r => [r.timestamp, r.user, r.role, r.action, hasTender(r.tender) ? r.tender : ''])]
  const blob = new Blob([lines.map(l => l.map(csvCell).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

const FIELD_LABEL = 'mb-1.5 block text-sm font-semibold text-slate-800'

export default function AuditLog() {
  const { itAdminLogs } = useAuth()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [exportOpen, setExportOpen] = useState(false)
  // The last export option picked — highlighted in the menu, as in the main app.
  const [exportMode, setExportMode] = useState(null)
  const [customOpen, setCustomOpen] = useState(false)
  const [customRange, setCustomRange] = useState({ from: '', to: '' })
  useDismissable(exportOpen, () => setExportOpen(false))
  useDismissable(customOpen, () => setCustomOpen(false))

  // Newest first, across the live IT Admin events and the seeded trail.
  const allLogs = useMemo(
    () => [...itAdminLogs, ...auditLogs].sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp))),
    [itAdminLogs]
  )

  // Actions are free text ("Created ITT", "Uploaded Bidder Proposals", …) —
  // the filter groups them by their leading verb, taken from the log itself.
  const actionOptions = useMemo(() => {
    const verbs = [...new Set(allLogs.map(l => String(l.action).split(' ')[0]))].sort()
    return [{ id: 'all', label: 'All actions' }, ...verbs.map(v => ({ id: v, label: v }))]
  }, [allLogs])

  const roleOptions = useMemo(() => {
    const roles = [...new Set(allLogs.map(l => l.role).filter(Boolean))].sort()
    return [{ id: 'all', label: 'All roles' }, ...roles.map(r => ({ id: r, label: r }))]
  }, [allLogs])

  const q = search.trim().toLowerCase()
  // Search, action and role — every export keeps these; only the dates differ.
  const matchesFilters = log =>
    (!q || [log.user, log.action, log.tender].some(f => String(f ?? '').toLowerCase().includes(q)))
    && (roleFilter === 'all' || log.role === roleFilter)
    && (actionFilter === 'all' || String(log.action).startsWith(actionFilter))
  const inRange = (log, from, to) => {
    const logDate = String(log.timestamp).split(' ')[0]
    return (!from || logDate >= from) && (!to || logDate <= to)
  }
  const filtered = allLogs.filter(log => matchesFilters(log) && inRange(log, fromDate, toDate))

  // The three Export menu options (main app's AuditExportMode):
  //  view   — the table's own date range, i.e. exactly what the table holds;
  //  all    — no dates at all;
  //  custom — the dialog's own From/To.
  const runExport = (mode) => {
    const rows = mode === 'view' ? filtered
      : mode === 'all' ? allLogs.filter(matchesFilters)
      : allLogs.filter(log => matchesFilters(log) && inRange(log, customRange.from, customRange.to))
    downloadCsv(rows)
  }
  const pickExport = (mode) => {
    setExportMode(mode)
    setExportOpen(false)
    if (mode === 'custom') {
      // Opened fresh every time, so a stale range is never exported by accident.
      setCustomRange({ from: '', to: '' })
      setCustomOpen(true)
      return
    }
    runExport(mode)
  }
  const customInverted = !!(customRange.from && customRange.to && customRange.from > customRange.to)
  const canDownloadCustom = !!(customRange.from || customRange.to) && !customInverted

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const canReset = !!(search || roleFilter !== 'all' || actionFilter !== 'all' || fromDate || toDate)
  const resetFilters = () => {
    setSearch(''); setRoleFilter('all'); setActionFilter('all'); setFromDate(''); setToDate(''); setPage(1)
  }
  const onFilter = (setter) => (v) => { setter(v); setPage(1) }

  const rangeLabel = fromDate || toDate
    ? `${fromDate ? formatTimestamp(`${fromDate} 00:00`).split(',')[0] : 'the start'} – ${toDate ? formatTimestamp(`${toDate} 00:00`).split(',')[0] : 'today'}`
    : null

  return (
    // Bleeds to the edges of the layout's parent container (cancelling its
    // p-5), so the filters, the table rules and the footer run full width.
    <div className={PAGE_FILL}>
      {/* ── Filters ── */}
      <div className="shrink-0 px-5 pt-4 pb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[14rem] flex-[2]">
            <label className={FIELD_LABEL} htmlFor="audit-search">Search</label>
            <div className="relative">
              <Search size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="audit-search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="User"
                className="h-9 w-full rounded-lg border border-[#cce6f8] bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              />
            </div>
          </div>
          <div className="min-w-[10rem] flex-1">
            <span className={FIELD_LABEL}>Action</span>
            <SearchableSelect value={actionFilter} onChange={onFilter(setActionFilter)} options={actionOptions}
              getValue={o => o.id} getLabel={o => o.label} searchable={false} ariaLabel="Filter by action" />
          </div>
          <div className="min-w-[10rem] flex-1">
            <span className={FIELD_LABEL}>Role</span>
            <SearchableSelect value={roleFilter} onChange={onFilter(setRoleFilter)} options={roleOptions}
              getValue={o => o.id} getLabel={o => o.label} searchable={false} ariaLabel="Filter by role" />
          </div>
          <div className="min-w-[10rem] flex-1">
            <span className={FIELD_LABEL}>From</span>
            <DatePicker value={fromDate} onChange={onFilter(setFromDate)} placeholder="Pick a date" maxKey={toDate || undefined} ariaLabel="From date" />
          </div>
          <div className="min-w-[10rem] flex-1">
            <span className={FIELD_LABEL}>To</span>
            <DatePicker value={toDate} onChange={onFilter(setToDate)} placeholder="Pick a date" minKey={fromDate || undefined} ariaLabel="To date" />
          </div>
          <button type="button" onClick={resetFilters} disabled={!canReset}
            aria-label="Reset filters" title="Reset filters"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#cce6f8] bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40">
            <RotateCcw size={15} />
          </button>
          <div className="relative shrink-0">
            <button type="button" onClick={() => setExportOpen(o => !o)}
              aria-haspopup="menu" aria-expanded={exportOpen}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#cce6f8] bg-white px-3.5 text-sm font-semibold text-slate-800 transition-colors hover:bg-slate-50">
              <Upload size={15} aria-hidden="true" /> Export <ChevronDown size={14} aria-hidden="true" />
            </button>
            {exportOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} aria-hidden="true" />
                <div role="menu" aria-label="Export audit log"
                  className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                  {[
                    { mode: 'view',   label: 'All entries in current date range', disabled: filtered.length === 0 },
                    { mode: 'all',    label: 'All matching entries' },
                    { mode: 'custom', label: 'Custom date range' },
                  ].map(opt => (
                    <button key={opt.mode} type="button" role="menuitemradio" aria-checked={exportMode === opt.mode}
                      disabled={opt.disabled}
                      onClick={() => pickExport(opt.mode)}
                      className={`block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        exportMode === opt.mode
                          ? 'bg-[#0089cf]/10 font-semibold text-[#0089cf]'
                          : 'text-slate-800 hover:bg-slate-50'}`}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Entry count ── */}
      <div className="flex shrink-0 flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-[#cce6f8] px-5 py-3">
        <span className="text-sm font-semibold text-slate-800 tabular-nums">
          {filtered.length.toLocaleString('en-US')} {filtered.length === 1 ? 'entry' : 'entries'}
          {rangeLabel ? ` · ${rangeLabel}` : ' · all dates'}
        </span>
        <span className="text-xs text-slate-500">
          {rangeLabel ? `Showing ${rangeLabel}.` : 'Showing every recorded action.'} Choose a date range to narrow the list.
        </span>
      </div>

      {/* ── Table ── */}
      <div className="min-h-0 flex-1 overflow-auto border-t border-[#cce6f8]">
        <table className="w-full min-w-[56rem] table-fixed">
          <colgroup>
            <col style={{ width: '16%' }} /><col style={{ width: '22%' }} /><col style={{ width: '16%' }} />
            <col style={{ width: '24%' }} /><col style={{ width: '22%' }} />
          </colgroup>
          <thead className="sticky top-0 z-[1] bg-slate-50">
            <tr className="border-b border-[#cce6f8]">
              {['Timestamp', 'User', 'Role', 'Action', 'Tender'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-14 text-center text-sm text-slate-500">
                  {canReset ? 'No entries match these filters.' : 'No audit entries recorded yet.'}
                </td>
              </tr>
            ) : pageRows.map(log => (
              <tr key={log.id} className="border-b border-[#cce6f8] transition-colors last:border-b-0 hover:bg-slate-50/60">
                <td className="px-4 py-3 text-xs text-slate-500 !font-sans tabular-nums">{formatTimestamp(log.timestamp)}</td>
                <td className="truncate px-4 py-3 text-sm font-semibold text-slate-800" title={log.user}>{log.user}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex max-w-full items-center whitespace-nowrap rounded-full border border-sky-300 bg-sky-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-sky-700">
                    <span className="truncate">{log.role}</span>
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-slate-800">{log.action}</td>
                <td className="px-4 py-3">
                  {hasTender(log.tender)
                    ? <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{log.tender}</span>
                    : <span className="text-sm text-slate-500">{NO_TENDER}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Custom export range dialog ── */}
      {customOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setCustomOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="audit-export-title"
            className="relative w-full max-w-md overflow-hidden rounded-2xl border border-[#cce6f8] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#cce6f8] px-5 py-4">
              <h2 id="audit-export-title" className="text-sm font-bold text-slate-800">Custom export range</h2>
              <button type="button" onClick={() => setCustomOpen(false)} aria-label="Close"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-3 px-5 py-4">
              <div className="min-w-0 flex-1">
                <span className={FIELD_LABEL}>From</span>
                <DatePicker value={customRange.from} onChange={v => setCustomRange(r => ({ ...r, from: v }))}
                  placeholder="Pick a date" maxKey={customRange.to || undefined} ariaLabel="Export from date" />
              </div>
              <div className="min-w-0 flex-1">
                <span className={FIELD_LABEL}>To</span>
                <DatePicker value={customRange.to} onChange={v => setCustomRange(r => ({ ...r, to: v }))}
                  placeholder="Pick a date" minKey={customRange.from || undefined} ariaLabel="Export to date" />
              </div>
              {customInverted && (
                <p className="w-full text-xs text-red-600">The From date must be on or before the To date.</p>
              )}
            </div>
            <div className="flex justify-end border-t border-[#cce6f8] px-5 py-3">
              <button type="button" disabled={!canDownloadCustom}
                onClick={() => { runExport('custom'); setCustomOpen(false) }}
                className="inline-flex h-9 items-center rounded-xl bg-[#0089cf] px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40">
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="shrink-0 border-t border-[#cce6f8] px-5 py-2.5">
          <ListPagination
            page={currentPage}
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
