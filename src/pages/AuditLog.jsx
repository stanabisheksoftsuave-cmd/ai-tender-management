import { useState, useMemo } from 'react'
import { Search, Download, RotateCcw } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import SearchableSelect from '../components/ui/SearchableSelect'
import DatePicker from '../components/ui/DatePicker'
import { auditLogs } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const ROLE_FILTERS = ['all', 'it admin', 'system', 'procurement', 'evaluator', 'reviewer']
const ROLE_FILTER_OPTIONS = ROLE_FILTERS.map(f => ({ id: f, label: f === 'all' ? 'All roles' : f.replace(/\b\w/g, c => c.toUpperCase()) }))

export default function AuditLog() {
  const { itAdminLogs } = useAuth()
  const { lang, t } = useLanguage()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const allLogs = [...itAdminLogs, ...auditLogs]

  // Actions are free-text ("Created ITT", "Uploaded Bidder Proposals", …) — the
  // filter groups them by their leading verb, derived from whatever is
  // actually in the log rather than a fixed taxonomy that might not match it.
  const actionOptions = useMemo(() => {
    const verbs = [...new Set(allLogs.map(l => l.action.split(' ')[0]))].sort()
    return [{ id: 'all', label: 'All actions' }, ...verbs.map(v => ({ id: v, label: v }))]
  }, [allLogs])

  const filtered = allLogs.filter(log => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      String(log.tender).toLowerCase().includes(search.toLowerCase())
    const matchRole = filter === 'all' || log.role.toLowerCase().includes(filter)
    const matchAction = actionFilter === 'all' || log.action.startsWith(actionFilter)
    const logDate = String(log.timestamp).split(' ')[0]
    const matchFrom = !fromDate || logDate >= fromDate
    const matchTo = !toDate || logDate <= toDate
    return matchSearch && matchRole && matchAction && matchFrom && matchTo
  })

  const canReset = !!(search || filter !== 'all' || actionFilter !== 'all' || fromDate || toDate)
  const resetFilters = () => {
    setSearch(''); setFilter('all'); setActionFilter('all'); setFromDate(''); setToDate('')
  }

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('audit.search')}</label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Actor, target or tender"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">Action</label>
            <SearchableSelect
              value={actionFilter}
              onChange={v => setActionFilter(v)}
              options={actionOptions}
              getValue={o => o.id}
              getLabel={o => o.label}
              searchable={false}
              ariaLabel="Filter by action"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">{t('audit.role')}</label>
            <SearchableSelect
              value={filter}
              onChange={v => setFilter(v)}
              options={ROLE_FILTER_OPTIONS}
              getValue={o => o.id}
              getLabel={o => o.label}
              searchable={false}
              ariaLabel={t('audit.role')}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">From</label>
            <DatePicker value={fromDate} onChange={setFromDate} placeholder="Pick a date" maxKey={toDate || undefined} ariaLabel="From date" />
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1.5">To</label>
            <DatePicker value={toDate} onChange={setToDate} placeholder="Pick a date" minKey={fromDate || undefined} ariaLabel="To date" />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={resetFilters} disabled={!canReset}>
            <RotateCcw size={13} /> Reset filters
          </Button>
          <Button variant="secondary" size="sm">
            <Download size={13} /> {t('common.exportCsv')}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.timestamp')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.user')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.role')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.action')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.tender')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/50 text-sm">
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-500">{log.timestamp}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-slate-700">{log.user}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold whitespace-nowrap bg-sky-50 text-sky-600 border border-sky-200">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{log.action}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{log.tender}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">{t('common.showing')} {filtered.length} {t('common.of')} {allLogs.length} {t('common.records')}</span>
          <div className="flex gap-1">
            {[1, 2, 3, '...', 24].map(p => (
              <button key={p} className={`w-7 h-7 rounded text-xs ${p === 1 ? 'bg-[var(--color-primary)] text-white' : 'text-slate-500 hover:bg-slate-100'}`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
