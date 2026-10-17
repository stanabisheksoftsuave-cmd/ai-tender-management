import { useState } from 'react'
import { ArrowLeft, ArrowRight, LayoutGrid, Lock } from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import { MANDATORY_TEMPLATE_IDS, STRATEGY_DOCUMENTS } from '../../utils/strategyTemplates'
import { YesNoToggle } from './YesNoToggle'

/**
 * Full-page "Select Required Templates" screen (MAIN TemplateSelectionScreen):
 * one Yes/No per strategy document, Technical Evaluation Matrix always
 * included. Yes/No only edits a local draft — nothing is saved until Continue.
 */
export default function TemplateSelectionScreen({ costCode, included, onBack, onContinue }) {
  const [edits, setEdits] = useState({})

  const isOn = id => MANDATORY_TEMPLATE_IDS.has(id) || (edits[id] ?? included.includes(id))

  const handleContinue = () => {
    const selected = STRATEGY_DOCUMENTS.map(d => d.id).filter(isOn)
    onContinue(selected)
  }

  return (
    <div className="flex items-center justify-center min-h-[70vh] w-full olng-fade-in">
      <Card branded className="w-full max-w-lg p-5 sm:p-7 olng-scale-in">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-[#e8f3fb] text-[#0089cf]">
            <LayoutGrid size={18} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-[15px] text-slate-800">Select Required Templates</h3>
            <p className="text-[11px] text-slate-400 break-words">
              {costCode ? `${costCode} - confirm which strategies to include` : 'Confirm which strategies to include'}
            </p>
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-3 mb-5">
          Choose <span className="font-semibold text-slate-800">Yes</span> to include a template in this tender&rsquo;s
          strategy, or <span className="font-semibold text-slate-800">No</span> to leave it out. You can change this
          later from <span className="font-semibold text-slate-800">Manage Templates</span>.
        </p>

        <div className="space-y-1.5 mb-6">
          {STRATEGY_DOCUMENTS.map(doc => {
            const Icon = doc.icon
            const isMandatory = MANDATORY_TEMPLATE_IDS.has(doc.id)
            return (
              <div
                key={doc.id}
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-[#0089cf]/10 bg-[rgba(236,244,252,0.5)]"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-[#0089cf]/10 text-[#0089cf]">
                    <Icon size={14} aria-hidden="true" />
                  </span>
                  <span className="text-[13px] font-semibold text-slate-800 truncate">{doc.label}</span>
                </div>
                {isMandatory ? (
                  <span
                    title="Always included - required for every tender"
                    className="flex shrink-0 items-center gap-1 rounded-full border border-[#0089cf]/30 bg-[#e8f3fb] px-2.5 py-1 text-[10px] font-semibold text-[#0089cf]"
                  >
                    <Lock size={10} aria-hidden="true" />
                    Always included
                  </span>
                ) : (
                  <YesNoToggle
                    label={doc.label}
                    value={isOn(doc.id)}
                    onChange={value => setEdits(prev => ({ ...prev, [doc.id]: value }))}
                  />
                )}
              </div>
            )
          })}
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onBack} className="flex items-center gap-2">
            <ArrowLeft size={14} aria-hidden="true" /> Back
          </Button>
          <Button type="button" variant="brand" onClick={handleContinue} className="flex items-center gap-2 py-3 px-6 text-[15px]">
            Continue <ArrowRight size={16} aria-hidden="true" />
          </Button>
        </div>
      </Card>
    </div>
  )
}
