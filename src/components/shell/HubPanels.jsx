import { ArrowRight, FileText, Zap } from 'lucide-react'
import Card from '../ui/Card'
import { getAiSystemStatus } from './hubData'

/* Contract Strategy hub panels — main app's HeroPanel, StatCard (hub variant)
 * and AiSystemStatusCard. */

/** Headline banner with the "Start New Strategy" call to action. */
export function HeroPanel({ onStartStrategy }) {
  return (
    <section className="fade-in relative overflow-hidden rounded-2xl p-5 shadow-lg sm:p-8"
      style={{ background: 'linear-gradient(135deg, #1b4c6f 0%, #0b6a9e 55%, #0089cf 100%)' }}>
      <div aria-hidden="true" className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full blur-3xl"
        style={{ background: 'rgba(0,137,207,0.35)' }} />

      <div className="relative z-10">
        <div className="mb-3 flex items-center gap-2">
          <span className="flex w-8 h-8 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
            <FileText size={16} className="text-white" aria-hidden="true" />
          </span>
          <span className="text-xs font-bold uppercase tracking-widest text-white/70">Contract Holder</span>
        </div>
        <h2 className="mb-2 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
          Contract Strategy Management
        </h2>
        <p className="mb-6 max-w-xl text-sm text-white/70">
          Manage your contract strategy workflows, evaluate risks, create estimates, and
          generate ITT documents automatically.
        </p>
        <button type="button" onClick={onStartStrategy}
          className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold transition-colors hover:bg-slate-100 active:scale-[0.97]"
          style={{ color: '#0089cf' }}>
          Start New Strategy
          <ArrowRight size={16} aria-hidden="true" />
        </button>
      </div>
    </section>
  )
}

const TONES = {
  primary: { bg: '#EAF5FC', fg: '#0089cf' },
  warning: { bg: '#FFFBEB', fg: '#D97706' },
  success: { bg: '#ECFDF5', fg: '#059669' },
  info:    { bg: '#EEF2FF', fg: '#4F46E5' },
}

export function HubStatCard({ label, value, hint, icon: Icon, tone = 'primary' }) {
  const t = TONES[tone] || TONES.primary
  return (
    <Card className="fade-in p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="text-2xl font-semibold tabular-nums text-slate-800">{value}</p>
          {hint && <p className="text-xs text-slate-500">{hint}</p>}
        </div>
        <span className="inline-flex w-9 h-9 shrink-0 items-center justify-center rounded-lg"
          style={{ background: t.bg, color: t.fg }}>
          <Icon size={16} aria-hidden="true" />
        </span>
      </div>
    </Card>
  )
}

const BAR_COLORS = { primary: '#0089cf', warning: '#F59E0B', success: '#10B981', info: '#6366F1' }

/** "AI System Status" — engine online/load state derived live from the board. */
export function AiSystemStatusCard({ tenders }) {
  const engines = getAiSystemStatus(tenders)
  return (
    <Card className="fade-in p-5" style={{ animationDelay: '80ms' }}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex w-8 h-8 items-center justify-center rounded-lg" style={{ background: '#EAF5FC' }}>
            <Zap size={15} style={{ color: '#0089cf' }} aria-hidden="true" />
          </span>
          <h2 className="text-base font-bold text-slate-800">AI System Status</h2>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-600">
          <span className="w-1.5 h-1.5 animate-pulse rounded-full bg-emerald-500" aria-hidden="true" />
          {engines.filter(e => e.online).length} of {engines.length} engines online
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {engines.map(engine => (
          <div key={engine.label}
            className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition-colors hover:border-slate-300">
            <div className="mb-2.5 flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-slate-800">{engine.label}</span>
              <span className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${engine.online ? 'text-emerald-600' : 'text-slate-400'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${engine.online ? 'animate-pulse bg-emerald-500' : 'bg-slate-300'}`} aria-hidden="true" />
                {engine.online ? 'Online' : 'Standby'}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${engine.load}%`, background: BAR_COLORS[engine.tone] }} />
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">{engine.load}% load</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
