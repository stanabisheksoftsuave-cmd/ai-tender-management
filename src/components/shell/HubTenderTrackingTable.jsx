import { Fragment, useState } from 'react'
import { ChevronDown, ClipboardCheck, Eye, FileText, Plus, Search, SearchX, Sparkles } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { tenderRef } from '../../utils/tenderRef'
import { HUB_TABS, filterHubTenders, hubStatusLabel, hubStatusTone, tabCount } from './hubData'

/*
 * Tender Tracking card on the Contract Strategy hub — main app's
 * TenderTrackingTable + TenderRowDetails: search, status tabs with counts,
 * the table, an expandable detail row and the empty state.
 */

const BADGE_CLASSES = {
  neutral: 'bg-slate-100 text-slate-500 border-slate-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  primary: 'bg-sky-50 text-sky-700 border-sky-200',
  info:    'bg-indigo-50 text-indigo-600 border-indigo-200',
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function StatusBadge({ tender }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${BADGE_CLASSES[hubStatusTone(tender)]}`}>
      {hubStatusLabel(tender)}
    </span>
  )
}

/** Expanded detail panel: description, meta and the stage actions. */
function TenderRowDetails({ tender, onNavigate }) {
  const id = encodeURIComponent(tender.id)
  return (
    <div className="space-y-3 bg-slate-50/60 px-5 py-4">
      {tender.description && (
        <p className="max-w-3xl text-xs leading-relaxed text-slate-500">{tender.description}</p>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-500">
        <span><span className="font-semibold text-slate-800">Created:</span> {tender.created || '—'}</span>
        <span><span className="font-semibold text-slate-800">Deadline:</span> {tender.deadline || '—'}</span>
        {tender.aiScore !== null && tender.aiScore !== undefined && (
          <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-semibold"
            style={{ background: '#EAF5FC', color: '#0089cf' }}>
            <Sparkles size={12} aria-hidden="true" />
            AI Score: {tender.aiScore}%
          </span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {/* View Detail opens this tender's own Contract Initiating Form. */}
        <Button type="button" variant="secondary" size="sm" className="border border-slate-300 bg-white"
          onClick={() => onNavigate(`/contract-strategy/${id}`)}>
          <Eye size={13} aria-hidden="true" /> View Detail
        </Button>
        {tender.status === 'draft' && (
          <Button type="button" size="sm" onClick={() => onNavigate(`/create-itt/${id}`)}>
            <FileText size={13} aria-hidden="true" /> Continue Review
          </Button>
        )}
        {tender.status === 'tech_eval' && (
          // The ITT Technical Evaluation of this tender — not the strategy's
          // Technical Evaluation Matrix step the main app's mock linked to.
          <Button type="button" size="sm" onClick={() => onNavigate(`/technical-eval/${id}`)}>
            <ClipboardCheck size={13} aria-hidden="true" /> Start Evaluation
          </Button>
        )}
      </div>
    </div>
  )
}

export default function HubTenderTrackingTable({ tenders, onNewCif, onNavigate }) {
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const toggleRow = (id) => setExpandedId(prev => (prev === id ? null : id))
  const filtered = filterHubTenders(tenders, activeTab, search)

  return (
    <Card className="fade-in" style={{ animationDelay: '160ms' }}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
        style={{ borderBottom: '1px solid var(--color-border)' }}>
        <h2 className="text-base font-bold text-slate-800">Tender Tracking</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by ID or title..."
              aria-label="Search by ID or title"
              className="h-9 w-56 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 sm:w-64"
            />
          </div>
          <Button type="button" size="sm" onClick={onNewCif}>
            <Plus size={13} aria-hidden="true" /> New ITT
          </Button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2 px-5 py-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
        {HUB_TABS.map(tab => {
          const isActive = tab.key === activeTab
          return (
            <button key={tab.key} type="button" aria-pressed={isActive}
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${isActive ? 'text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
              style={isActive ? { background: 'var(--color-primary)' } : undefined}>
              {tab.label}
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                {tabCount(tenders, tab)}
              </span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto">
        <table className="w-full min-w-[40rem]">
          <thead>
            <tr className="border-b border-slate-100">
              {['ID', 'Title', 'Stage', 'Budget', 'Deadline', 'Bidders'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">{h}</th>
              ))}
              <th className="px-4 py-3"><span className="sr-only">Toggle details</span></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(tender => {
              const isExpanded = expandedId === tender.id
              const ref = tenderRef(tender)
              return (
                <Fragment key={tender.id}>
                  <tr className={`cursor-pointer border-b border-slate-100 transition-colors hover:bg-slate-50 ${isExpanded ? 'bg-slate-50/60' : ''}`}
                    onClick={() => toggleRow(tender.id)}>
                    <td className="px-4 py-3">
                      <span className="whitespace-nowrap rounded border border-slate-200 bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-500">
                        {ref}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-semibold text-slate-800">{tender.title}</p>
                      <p className="text-xs text-slate-500">{tender.department}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge tender={tender} /></td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-800">{tender.budget}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{tender.deadline}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">{tender.bidders || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button type="button" aria-expanded={isExpanded}
                        aria-controls={`tender-details-${tender.id}`}
                        aria-label={isExpanded ? `Collapse details for ${ref}` : `Expand details for ${ref}`}
                        onClick={e => { e.stopPropagation(); toggleRow(tender.id) }}
                        className="cursor-pointer rounded-md p-1 text-slate-400 transition-colors hover:text-slate-800">
                        <ChevronDown size={16} aria-hidden="true"
                          className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={7} className="p-0">
                      <div id={`tender-details-${tender.id}`} inert={!isExpanded}
                        className="grid transition-[grid-template-rows] duration-300 ease-in-out"
                        style={{ gridTemplateRows: isExpanded ? '1fr' : '0fr' }}>
                        <div className="overflow-hidden">
                          <TenderRowDetails tender={tender} onNavigate={onNavigate} />
                        </div>
                      </div>
                    </td>
                  </tr>
                </Fragment>
              )
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 px-5 py-14 text-center">
            <span className="flex w-12 h-12 items-center justify-center rounded-full bg-slate-100">
              <SearchX size={22} className="text-slate-400" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-slate-800">No tenders found</p>
            <p className="text-xs text-slate-500">Try a different search or filter.</p>
          </div>
        )}
      </div>
    </Card>
  )
}
