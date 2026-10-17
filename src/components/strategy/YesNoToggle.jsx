const BASE = 'rounded-md border text-[11px] font-semibold transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-50'
const OFF = 'bg-white text-slate-400 border-slate-200 hover:text-slate-700'
const YES_ON = 'bg-[rgba(16,185,129,0.1)] text-[#059669] border-[rgba(16,185,129,0.3)]'
const NO_ON = 'bg-[rgba(239,68,68,0.1)] text-[#dc2626] border-[rgba(239,68,68,0.3)]'

/** The compact Yes / No pair used on the selection screen and Manage Templates. */
export function YesNoToggle({ label, value, onChange, disabled = false, compact = false }) {
  const pad = compact ? 'px-2.5 py-1' : 'px-3 py-1'
  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        aria-label={`Include ${label}`}
        aria-pressed={value}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`${BASE} ${pad} ${value ? YES_ON : OFF}`}
      >
        Yes
      </button>
      <button
        type="button"
        aria-label={`Exclude ${label}`}
        aria-pressed={!value}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`${BASE} ${pad} ${!value ? NO_ON : OFF}`}
      >
        No
      </button>
    </div>
  )
}
