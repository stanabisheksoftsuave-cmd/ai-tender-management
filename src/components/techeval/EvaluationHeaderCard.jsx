import { useRef } from 'react'
import { Bell, CalendarClock, Lock } from 'lucide-react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import { cn } from '../../utils/cn'

const TAB_ORDER = ['compliance', 'scoring']

/**
 * The evaluation header + tab strip — MAIN's `EvaluationHeaderCard`. The
 * Technical Scoring tab is locked (and says so) until no bidder is left
 * Partial Compliant; clicking it while locked explains why instead of
 * opening it (prototype bug §8.B.4 fixed).
 */
export function EvaluationHeaderCard({
  title, department, deadline, bidderCount, metricCount, mandatoryCount, optionalCount,
  notificationCount, activeTab, onTabChange, eligibleCount, scoringLocked, onLockedTabClick, children,
}) {
  const tabRefs = useRef({})

  const selectTab = (tab) => {
    if (tab === 'scoring' && scoringLocked) { onLockedTabClick(); return }
    onTabChange(tab)
  }

  const onKeyDown = (event, index) => {
    let next = null
    if (event.key === 'ArrowRight') next = (index + 1) % TAB_ORDER.length
    else if (event.key === 'ArrowLeft') next = (index - 1 + TAB_ORDER.length) % TAB_ORDER.length
    else if (event.key === 'Home') next = 0
    else if (event.key === 'End') next = TAB_ORDER.length - 1
    if (next === null) return
    event.preventDefault()
    const tab = TAB_ORDER[next]
    tabRefs.current[tab]?.focus()
    selectTab(tab)
  }

  const hasDeadline = deadline && String(deadline).trim() !== '' && deadline !== '—'

  return (
    <Card className="relative">
      <header className="flex flex-wrap items-start justify-between gap-4 px-4 py-5 sm:px-6">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-lg font-bold text-slate-800">{title}</h2>
            <Badge variant="tech_eval">Technical Evaluation</Badge>
          </div>
          {hasDeadline && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
              <CalendarClock size={13} /> Deadline: {deadline}
            </span>
          )}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
            <span className="font-semibold">{department}</span>
            <span aria-hidden="true">·</span>
            <span>{bidderCount} {bidderCount === 1 ? 'bidder' : 'bidders'}</span>
            <span aria-hidden="true">·</span>
            <span>{metricCount} compliance metrics ({mandatoryCount} mandatory + {optionalCount} optional)</span>
          </p>
        </div>
        {notificationCount > 0 && (
          <div className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
            <Bell size={13} />
            {notificationCount} Contract Engineer notification{notificationCount === 1 ? '' : 's'} sent
          </div>
        )}
      </header>

      <div role="tablist" aria-label="Technical evaluation stages" className="flex gap-1 overflow-x-auto border-t border-slate-100 px-3 sm:px-5">
        {TAB_ORDER.map((tab, index) => {
          const isActive = activeTab === tab
          const isLocked = tab === 'scoring' && scoringLocked
          return (
            <button
              key={tab}
              ref={(el) => { tabRefs.current[tab] = el }}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-disabled={isLocked}
              tabIndex={isActive ? 0 : -1}
              onClick={() => selectTab(tab)}
              onKeyDown={(event) => onKeyDown(event, index)}
              className={cn(
                'relative inline-flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap px-2.5 text-xs font-semibold transition-colors sm:px-3',
                isActive ? 'text-[var(--color-primary)]' : 'text-slate-500 hover:text-slate-800',
                isLocked && 'cursor-not-allowed opacity-70'
              )}
            >
              {tab === 'compliance' ? 'Compliance Review' : 'Technical Scoring'}
              {tab === 'compliance' && (
                <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums',
                  eligibleCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700')}>
                  {eligibleCount}/{bidderCount}<span className="hidden sm:inline"> eligible</span>
                </span>
              )}
              {isLocked && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
                  <Lock size={11} /> Locked
                </span>
              )}
              {isActive && <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-gradient-to-r from-[#0089cf] to-[#1b4c6f]" />}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className="space-y-4 rounded-b-2xl border-t border-slate-100 px-4 pb-4 pt-5 sm:px-6 sm:pb-6">
        {children}
      </div>
    </Card>
  )
}
