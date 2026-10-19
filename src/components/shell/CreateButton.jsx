import { Plus } from 'lucide-react'

/*
 * The "New CIF" / "New ITT" create actions — one component so the Dashboard
 * and Tender Tracking always draw them at the same size and weight.
 *
 * The two are equal-priority actions, so the buttons themselves are identical
 * (white, light border, dark label). Only the small + tile carries a colour —
 * brand navy for CIF, brand blue for ITT — enough to tell them apart without
 * either one reading as the "main" button.
 */
const ICON_TONES = {
  navy: 'bg-[#1b4c6f]',
  blue: 'bg-[#0089cf]',
}

export default function CreateButton({ tone = 'blue', onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 min-w-[8rem] cursor-pointer items-center justify-center gap-2.5 rounded-xl border border-slate-200 bg-white pl-2.5 pr-4 text-sm font-semibold text-slate-800 shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-[#0089cf]/50 hover:shadow-md active:translate-y-0 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0089cf]/30 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
    >
      <span className={`flex w-6 h-6 shrink-0 items-center justify-center rounded-lg text-white ${ICON_TONES[tone]}`} aria-hidden="true">
        <Plus size={14} strokeWidth={2.5} />
      </span>
      {children}
    </button>
  )
}
