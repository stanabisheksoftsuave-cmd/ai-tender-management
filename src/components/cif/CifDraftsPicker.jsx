import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Briefcase, Building2, CalendarClock, ChevronLeft, ChevronRight, FileText, Hash, Plus, Search,
} from 'lucide-react'
import Card from '../ui/Card'
import { useTenders } from '../../context/TenderContext'
import { DRAFTS_PAGE_SIZE } from './cifConstants'
import {
  draftProgressStage,
  formatDeadlineUtc,
  matchesDraftSearch,
  normalizeStage,
  routeForDraftProgress,
  selectCifDrafts,
} from './cifUtils'

function EmptyState({ icon: Icon, title, children }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl p-6 text-center sm:p-10" style={{ border: '1px dashed var(--color-border)' }}>
      <span className="flex w-10 h-10 items-center justify-center rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))', color: '#0089cf' }}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{title}</p>
      <p className="max-w-sm text-xs text-slate-500">{children}</p>
    </div>
  )
}

function MetaItem({ icon: Icon, children }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-xs text-slate-400 break-all">
      <Icon size={12} className="shrink-0" aria-hidden="true" />
      {children}
    </span>
  )
}

/**
 * `/contract-strategy` — the Contract Initiating Form drafts picker (MAIN
 * CifDraftsPickerPage + CifDraftsPicker): search, count pill, one card per
 * draft resuming at its saved progress stage, and "New CIF".
 */
export default function CifDraftsPicker() {
  const navigate = useNavigate()
  const { tenders } = useTenders()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const allDrafts = useMemo(() => selectCifDrafts(tenders), [tenders])
  const drafts = useMemo(() => allDrafts.filter(t => matchesDraftSearch(t, search)), [allDrafts, search])
  const totalPages = Math.max(1, Math.ceil(drafts.length / DRAFTS_PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = drafts.slice((currentPage - 1) * DRAFTS_PAGE_SIZE, currentPage * DRAFTS_PAGE_SIZE)
  const isSearching = search.trim() !== ''

  const openDraft = (tender) => {
    const { to, state } = routeForDraftProgress(tender)
    navigate(to, state ? { state } : undefined)
  }

  return (
    <div className="w-full olng-slide-up">
      <Card branded className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 pb-4" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <div className="min-w-0 flex-1 basis-72">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }} aria-hidden="true">
                <FileText size={16} style={{ color: '#0089cf' }} />
              </span>
              <h2 className="font-semibold text-sm" style={{ color: '#1e293b' }}>Contract Initiating Form</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1.5">Resume a draft you already started, or begin a new Contract Initiating Form.</p>
          </div>
          <div className="flex items-center gap-2 max-sm:w-full">
            <label className="relative flex-1 sm:w-64">
              <span className="sr-only">Search Contract Initiating Form drafts</span>
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                placeholder="Search by tender title"
                className="w-full pl-8 pr-3 py-2 text-xs focus:outline-none transition-all olng-input"
              />
            </label>
            <span className="shrink-0 rounded-full px-2.5 py-1 text-xs text-slate-500 tabular-nums" style={{ background: 'rgba(236,244,252,0.8)' }}>
              {drafts.length} {drafts.length === 1 ? 'tender' : 'tenders'}
            </span>
          </div>
        </div>

        {/* List */}
        <div className="py-4">
          {drafts.length === 0 && isSearching ? (
            <EmptyState icon={Search} title="No drafts match your search">
              Try a different cost code, title or department.
            </EmptyState>
          ) : drafts.length === 0 ? (
            <EmptyState icon={Briefcase} title="No CIF drafts available">
              You have no Contract Initiating Form drafts to resume right now. Start a new one to begin a tender.
            </EmptyState>
          ) : (
            <div className="space-y-1.5">
              {pageItems.map(draft => {
                const hasCostCode = Boolean(String(draft.costCode ?? '').trim())
                return (
                  <button
                    key={draft.id}
                    type="button"
                    onClick={() => openDraft(draft)}
                    className="group block w-full cursor-pointer rounded-xl text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30"
                  >
                    <div
                      className="rounded-xl px-3.5 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:bg-[rgba(0,137,207,0.04)]"
                      style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                    >
                      <div className="flex items-center justify-between gap-3 sm:gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                            <h3 className="max-w-full truncate text-sm font-semibold" style={{ color: '#1e293b' }}>
                              {draft.title || 'Untitled Contract Initiating Form'}
                            </h3>
                            <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-600 ring-1 ring-amber-200 animate-pulse motion-reduce:animate-none">
                              {normalizeStage(draftProgressStage(draft))}
                            </span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                            <MetaItem icon={Hash}>
                              {hasCostCode ? 'Cost Code' : 'Reference'}: {hasCostCode ? draft.costCode : draft.id}
                            </MetaItem>
                            {draft.deadline && (
                              <MetaItem icon={CalendarClock}>Deadline: {formatDeadlineUtc(draft.deadline)}</MetaItem>
                            )}
                            <MetaItem icon={Building2}>{draft.department || 'No department set'}</MetaItem>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {draft.budget && (
                            <div className="text-right">
                              <p className="text-[11px] text-slate-400">Budget</p>
                              <p className="text-sm font-semibold" style={{ color: '#1e293b' }}>{draft.budget}</p>
                            </div>
                          )}
                          <ChevronRight size={16} className="shrink-0 text-slate-300 transition-colors group-hover:text-[#0089cf]" aria-hidden="true" />
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer: pagination + New CIF */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4" style={{ borderTop: '1px solid var(--color-border)' }}>
          <div className="min-w-0 flex-1 max-sm:basis-full">
            {drafts.length > DRAFTS_PAGE_SIZE && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                  className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="tabular-nums">Page {currentPage} of {totalPages}</span>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                  className="p-1.5 rounded-lg disabled:opacity-40 hover:bg-slate-100"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={() => navigate('/contract-strategy/new')}
            title="Start New Contract Initiating Form"
            className="olng-btn-generate ml-auto flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-5 text-sm font-semibold text-white shadow-lg transition-transform duration-200 hover:-translate-y-0.5 max-sm:w-full max-sm:justify-center"
          >
            <Plus size={18} aria-hidden="true" className="shrink-0" />
            New CIF
          </button>
        </div>
      </Card>
    </div>
  )
}
