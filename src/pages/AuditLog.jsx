import { useState } from 'react'
import { Search, Download, Filter, ChevronDown } from 'lucide-react'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { auditLogs } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'

const roleColors = {
  'Contract Engineer': 'bg-blue-100 text-blue-700',
  'Technical Evaluator': 'bg-green-100 text-green-700',
  'Commercial Evaluator': 'bg-amber-100 text-amber-700',
  'Legal Reviewer': 'bg-purple-100 text-purple-700',
  'Management Reviewer': 'bg-teal-100 text-teal-700',
  'Contractor Engineer': 'bg-amber-100 text-amber-800',
  'System': 'bg-violet-100 text-violet-700',
  'IT Admin': 'bg-red-100 text-red-700',
}

const ROLE_FILTERS = ['all', 'it admin', 'system', 'procurement', 'evaluator', 'reviewer']

export default function AuditLog() {
  const { itAdminLogs } = useAuth()
  const { lang, t } = useLanguage()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')

  const allLogs = [...itAdminLogs, ...auditLogs]

  const filtered = allLogs.filter(log => {
    const matchSearch = log.user.toLowerCase().includes(search.toLowerCase()) ||
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      String(log.tender).toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || log.role.toLowerCase().includes(filter)
    return matchSearch && matchFilter
  })

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={t('audit.search')}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          />
        </div>
        <div className="relative">
          <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            aria-label={t('audit.role')}
            className="appearance-none pl-9 pr-8 py-2 text-sm rounded-lg border border-slate-200 bg-white capitalize focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
          >
            {ROLE_FILTERS.map(f => (
              <option key={f} value={f} className="capitalize">{f === 'all' ? 'All roles' : f}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        <Button variant="secondary" size="sm" className="ml-auto">
          <Download size={13} /> {t('common.exportCsv')}
        </Button>
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
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[log.role] || 'bg-slate-100 text-slate-600'}`}>
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
