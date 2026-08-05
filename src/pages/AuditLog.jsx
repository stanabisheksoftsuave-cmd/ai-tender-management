import { useState } from 'react'
import { Search, Download, Filter, CheckCircle } from 'lucide-react'
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
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: t('audit.totalEvents'), value: '1,284', sub: t('common.allTime') },
          { label: t('audit.today'),       value: '47',    sub: t('common.last24h') },
          { label: t('audit.activeUsers'), value: '12',    sub: t('common.thisWeek') },
          { label: t('audit.aiActions'),   value: '203',   sub: t('common.thisMonth') },
        ].map(s => (
          <Card key={s.label} className="p-3">
            <p className="text-xs text-slate-400">{s.label}</p>
            <p className="text-xl font-bold text-slate-800 mt-1">{s.value}</p>
            <p className="text-[10px] text-slate-400">{s.sub}</p>
          </Card>
        ))}
      </div>

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
        <div className="flex gap-2">
          {['all', 'it admin', 'system', 'procurement', 'evaluator', 'reviewer'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border capitalize transition-colors
                ${filter === f ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
            >
              {f}
            </button>
          ))}
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
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.ip')}</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('audit.status')}</th>
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
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono text-slate-400">{log.ip}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-xs text-green-600">
                      <CheckCircle size={11} /> {log.status}
                    </span>
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
