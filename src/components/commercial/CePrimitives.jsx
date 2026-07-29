/*
 * Shared visual atoms for the Commercial Evaluation screens.
 *
 * Extracted from CommercialEvaluation.jsx so the scenario panels speak exactly
 * the same visual language as the generic nine-step flow — same inline-SVG icon
 * pattern, same card/table chrome, same OLNG primary colour.
 */

export const Svg = ({ size = 16, sw = 1.6, style, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)

export const IcBot           = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>
export const IcCheck         = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
export const IcX             = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Svg>
export const IcMinus         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></Svg>
export const IcUp            = p => <Svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></Svg>
export const IcDown          = p => <Svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Svg>
export const IcAlert         = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
export const IcInfo          = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></Svg>
export const IcScale         = p => <Svg {...p}><path d="M12 3v18"/><path d="M5 7h14"/><path d="M8 21h8"/><path d="M5 7l-3 7h6z"/><path d="M19 7l-3 7h6z"/></Svg>
export const IcLayers        = p => <Svg {...p}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></Svg>
export const IcActivity      = p => <Svg {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></Svg>
export const IcTarget        = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></Svg>
export const IcCalendar      = p => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>
export const IcGauge         = p => <Svg {...p}><path d="M12 14l4-4"/><path d="M3.34 19a10 10 0 1 1 17.32 0"/></Svg>
export const IcHandshake     = p => <Svg {...p}><path d="M11 17l2 2a1 1 0 0 0 1.4 0l3.6-3.6"/><path d="M3 11l3.6-3.6a2 2 0 0 1 2.8 0L12 10l2.6-2.6a2 2 0 0 1 2.8 0L21 11"/><path d="M3 11v3l4 4"/><path d="M21 11v3l-4 4"/></Svg>
export const IcAward         = p => <Svg {...p}><circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></Svg>
export const IcFile          = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Svg>
export const IcGlobe         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></Svg>
export const IcMerge         = p => <Svg {...p}><path d="M6 21V9a3 3 0 0 1 3-3h6"/><polyline points="12 3 15 6 12 9"/><path d="M18 21v-6"/></Svg>
export const IcRefresh       = p => <Svg {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></Svg>
export const IcSlash         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></Svg>

/* ── Layout atoms ───────────────────────────────────────────────────────── */

export function AiStrip({ children }) {
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
      <IcBot size={14} className="text-blue-600 shrink-0 mt-0.5" />
      <span className="text-xs text-blue-800 leading-relaxed">{children}</span>
    </div>
  )
}

export function PanelHead({ icon: Icon, title, hint, action }) {
  return (
    <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2 flex-wrap">
      {Icon && <Icon size={15} className="text-[var(--color-primary)]" />}
      <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
      {hint && <span className="text-[10px] text-slate-400">{hint}</span>}
      {action && <div className="ml-auto">{action}</div>}
    </div>
  )
}

const CHIP_TONES = {
  red:     'bg-red-50 text-red-600 border-red-200',
  amber:   'bg-amber-50 text-amber-700 border-amber-200',
  green:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  blue:    'bg-blue-50 text-blue-700 border-blue-200',
  slate:   'bg-slate-50 text-slate-500 border-slate-200',
  violet:  'bg-violet-50 text-violet-700 border-violet-200',
}

export function Chip({ tone = 'green', children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${CHIP_TONES[tone] || CHIP_TONES.slate} ${className}`}>
      {children}
    </span>
  )
}

/** A signed variance percentage — below the estimate reads green, above reads amber. */
export function VarPct({ value, dp = 0, className = '' }) {
  if (value == null || !Number.isFinite(value)) return <span className={`text-slate-300 ${className}`}>—</span>
  const tone = value <= 0 ? 'text-emerald-600' : value >= 100 ? 'text-red-600' : 'text-amber-600'
  return <span className={`font-semibold ${tone} ${className}`}>{value > 0 ? '+' : ''}{value.toFixed(dp)}%</span>
}

/**
 * A non-numeric priced cell. `included`, `not quoted — client to provide`,
 * `deviation` and `de-scoped` are real submission states, not zero, so they
 * render as their own tag and are excluded from every total.
 */
export function StateTag({ state, compact = false }) {
  if (!state) return null
  return (
    <span title={state.hint}
      className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border whitespace-nowrap ${CHIP_TONES[state.tone] || CHIP_TONES.slate}`}>
      {state.id === 'descoped' ? <IcSlash size={9} />
        : state.id === 'deviation' ? <IcAlert size={9} />
        : state.id === 'included' ? <IcCheck size={9} />
        : <IcMinus size={9} />}
      {compact ? state.abbr : state.label}
    </span>
  )
}

export function StatTile({ label, value, sub, tone = 'slate', ring = false }) {
  const valueTone = tone === 'green' ? 'text-emerald-700'
    : tone === 'amber' ? 'text-amber-700'
    : tone === 'red' ? 'text-red-600'
    : tone === 'primary' ? 'text-[var(--color-primary)]'
    : 'text-slate-800'
  return (
    <div className={`rounded-xl border p-4 bg-white ${ring ? 'border-emerald-300 ring-1 ring-emerald-200' : 'border-slate-200'}`}>
      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <p className={`text-lg font-bold mt-1 ${valueTone}`}>{value}</p>
      {sub && <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sub}</p>}
    </div>
  )
}

/** One lettered block of the Tender Board note (Background, Result, …). */
export function NoteBlock({ letter, title, children, tone = 'slate' }) {
  const head = tone === 'primary' ? 'bg-[var(--color-primary)] text-white' : 'bg-slate-100 text-slate-500'
  return (
    <div className="rounded-xl border border-slate-200 overflow-hidden bg-white">
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2">
        <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${head}`}>{letter}</span>
        <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="px-4 py-3 text-[12px] text-slate-600 leading-relaxed">{children}</div>
    </div>
  )
}
