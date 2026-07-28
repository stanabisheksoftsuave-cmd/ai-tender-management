import { Wand2 } from 'lucide-react'
import AiEditableField from './AiEditableField'

/*
 * A textarea with select-to-edit-with-AI, plus the "Select any text to edit it
 * with AI" hint underneath. Drop-in wherever a plain long-text field lives (PSF
 * background, ITT description, strategy templates, …).
 *
 * The selection/popup behaviour lives in AiEditableField, which every
 * select-to-edit surface shares — including the ITT section templates.
 */
export default function AiEditableTextarea({
  value,
  onChange,
  disabled = false,
  rows = 5,
  placeholder,
  className = '',
}) {
  return (
    <div className="relative">
      <AiEditableField
        as="textarea"
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        placeholder={placeholder}
        className={className}
      />
      {!disabled && (
        <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
          <Wand2 size={10} /> Select any text to edit it with AI
        </p>
      )}
    </div>
  )
}
