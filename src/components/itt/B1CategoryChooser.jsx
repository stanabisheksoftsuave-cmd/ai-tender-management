import { useState } from 'react'
import { CheckCircle, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { B1_CATEGORY_MAP } from './b1Categories'

// `selected` reflects the already-confirmed category (if the user is revisiting this
// step); `pending` tracks the card the user has highlighted but not yet confirmed, so
// clicking a card doesn't immediately jump to the fill screen — only Continue does.
export default function B1CategoryChooser({ selected, onConfirm, onBack }) {
  const [pending, setPending] = useState(selected)

  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-semibold text-slate-800">Section B1 — General Conditions of Contract</h3>
          <p className="text-xs text-slate-400 mt-0.5">Choose the value / risk category that applies to this CONTRACT.</p>
        </div>
        <button onClick={onBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft size={12} /> Back
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {Object.entries(B1_CATEGORY_MAP).map(([key, cat]) => {
          const isSelected = pending === key
          return (
            <button
              key={key}
              onClick={() => setPending(key)}
              className={`text-left rounded-xl border-2 p-4 transition-all
                ${isSelected ? 'bg-blue-50 border-blue-300 ring-2 ring-offset-1 ring-blue-200' : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={`text-sm font-bold ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>{cat.label}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{cat.sub}</p>
                </div>
                {isSelected && <CheckCircle size={16} className="text-blue-600 shrink-0" />}
              </div>
              {cat.isStandIn && (
                <div className="mt-3 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-2 text-[10px] text-amber-700">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  Dedicated template not yet available — uses the nearest {cat.nearestTier} template as a stand-in.
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-end mt-5 pt-4 border-t border-slate-100">
        <Button onClick={() => onConfirm(pending)} disabled={!pending} className="flex items-center gap-2">
          Continue <ChevronRight size={15} />
        </Button>
      </div>
    </Card>
  )
}
