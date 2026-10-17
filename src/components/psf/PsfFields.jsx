/*
 * The form primitives every PSF section is built from, plus the template's four
 * tables. Ported from the Next.js app's psf-fields.tsx / psf-tables.tsx.
 *
 * Kept together because consistency across ~20 sections is the whole point: a
 * section that hand-rolls its own label or border loses the shared read-only
 * treatment the submitted form depends on.
 */

import { useId } from 'react'
import { Sparkles } from 'lucide-react'
import Card from '../ui/Card'
import AiEditableTextarea from '../ui/AiEditableTextarea'
import DatePicker from '../ui/DatePicker'

const INPUT =
  'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none ' +
  'focus:border-[#0089cf]/50 focus:ring-2 focus:ring-[#0089cf]/20 ' +
  'read-only:bg-slate-50 read-only:text-slate-500 disabled:bg-slate-50 disabled:text-slate-500'

/** Shared cell styling, so the four tables cannot drift apart. */
const CELL =
  'w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-white text-slate-800 focus:outline-none ' +
  'focus:border-[#0089cf]/50 read-only:bg-slate-50 read-only:text-slate-500 disabled:bg-slate-50 disabled:text-slate-500'

const HEADER_CELL =
  'px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-slate-500'

/** A titled block, with the template's underlined section heading. */
export function PsfSection({ title, children, className = '' }) {
  return (
    <Card className={`p-4 sm:p-5 ${className}`}>
      <h3 className="mb-4 border-b border-slate-100 pb-2 text-sm font-bold uppercase tracking-wide text-slate-800">
        {title}
      </h3>
      {children}
    </Card>
  )
}

/** A smaller heading for a group inside a section. */
export function PsfSubHeading({ children }) {
  return (
    <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{children}</p>
  )
}

/** One editable single-line value with no AI popup — sources, references, plain figures. */
export function PsfField({ label, value, onChange, readOnly }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      <input
        value={value || ''}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={INPUT}
      />
    </label>
  )
}

/** Same control under the Next.js app's name for it. */
export function PsfPlainField(props) {
  return <PsfField {...props} />
}

/**
 * A header value carried over from the Contract Initiating Form (title, value,
 * cost code…) — shown, not edited.
 */
export function PsfReadOnlyField({ label, value }) {
  const labelId = useId()
  const text = String(value ?? '').trim()
  return (
    <div>
      <span id={labelId} className="mb-1 block text-[11px] font-semibold text-slate-600">{label}</span>
      <div
        role="group"
        aria-labelledby={labelId}
        className="flex min-h-[38px] items-center rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 break-words"
      >
        {text || '—'}
      </div>
    </div>
  )
}

/** A yyyy-mm-dd value picked from the shared calendar popover. */
export function PsfDateField({ label, value, onChange, readOnly, labelHidden = false, className = '' }) {
  return (
    <div>
      {!labelHidden && (
        <span className="mb-1 block text-[11px] font-medium text-slate-500">{label}</span>
      )}
      <DatePicker
        value={value || ''}
        onChange={v => onChange(v || '')}
        disabled={readOnly}
        ariaLabel={label}
        placeholder="Pick a date"
        className={className}
      />
    </div>
  )
}

/*
 * One of the template's red "AI to generate…" fields, rendered as drafted prose
 * with the select-to-edit popup. The badge is what tells a reviewer the text was
 * drafted rather than typed by the Contract Holder.
 */
export function PsfNarrative({ label, value, rows, onChange, readOnly }) {
  const labelId = useId()
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span id={labelId} className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</span>
        <span className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ color: '#0089cf', background: 'rgba(0,137,207,0.08)' }}>
          <Sparkles size={10} /> AI drafted
        </span>
      </div>
      {readOnly ? (
        <span
          aria-labelledby={labelId}
          className="block whitespace-pre-wrap rounded-lg px-3 py-2 text-sm text-slate-800"
          style={{ border: '1px solid rgba(0,137,207,0.1)', background: 'rgba(0,137,207,0.04)' }}
        >
          {value || '—'}
        </span>
      ) : (
        <AiEditableTextarea
          value={value || ''}
          rows={rows}
          onChange={onChange}
          className="w-full resize-y text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white leading-relaxed text-slate-800 focus:outline-none focus:border-[#0089cf]/50 focus:ring-2 focus:ring-[#0089cf]/20"
        />
      )}
    </div>
  )
}

/*
 * A free-text block the template leaves blank — no AI instruction against it,
 * so it gets no drafted content and no popup, just room to type.
 */
export function PsfNote({ label, value, onChange, readOnly, rows = 3 }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </span>
      <textarea
        value={value || ''}
        rows={rows}
        readOnly={readOnly}
        onChange={e => onChange(e.target.value)}
        className={`${INPUT} resize-y`}
      />
    </label>
  )
}

/** A tick-box group in the template's column count. */
export function PsfCheckboxGrid({ options = [], onToggle, readOnly, columns = 3 }) {
  const cols = columns === 1 ? '' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <div className={`grid grid-cols-1 gap-x-4 gap-y-1 ${cols}`}>
      {options.map(option => (
        <label
          key={option.id}
          className={`flex items-center gap-2 py-0.5 text-xs ${readOnly ? 'text-slate-500' : 'text-slate-700 cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={!!option.checked}
            disabled={readOnly}
            onChange={e => onToggle(option.id, e.target.checked)}
            className="h-3.5 w-3.5 accent-[#0089cf]"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

/** ATTACHMENTS — the template's numbered list of accompanying files. */
export function PsfAttachments({ attachments = [] }) {
  return (
    <PsfSection title="Attachments">
      {attachments.length === 0 ? (
        <p className="text-xs text-slate-400">
          No attachments yet - files added on the upload stage appear here.
        </p>
      ) : (
        <ol className="list-inside list-decimal space-y-1 text-sm text-slate-700">
          {attachments.map((name, i) => (
            // Index-keyed: the same file can legitimately be attached against
            // two rows, so the name alone is not unique.
            <li key={`${i}-${name}`} className="truncate">{name}</li>
          ))}
        </ol>
      )}
    </PsfSection>
  )
}

/*
 * One of the two HISTORY tables — label/value rows, not columns. Every label
 * carries the scope: the two tables share row names, and a duplicate accessible
 * name leaves a screen reader unable to say which contract a field belongs to.
 */
export function PsfHistoryTable({ scope, entry = {}, onChange, readOnly }) {
  const rows = [
    { key: 'awardDate', label: `Award date of ${scope} Contract` },
    { key: 'expiryDate', label: `Expiry date of ${scope} Contract` },
    { key: 'contractorName', label: `Contractor Name (${scope})` },
    { key: 'method', label: `Method of procuring ${scope} Contract` },
    { key: 'acv', label: `ACV (${scope})` },
    // `actualSpend` is on the previous contract only; the template omits it
    // from the existing one.
    ...(entry.actualSpend === undefined ? [] : [{ key: 'actualSpend', label: 'Actual Spend' }]),
  ]

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      {rows.map((row, i) => (
        <div
          key={row.key}
          className={`flex flex-col gap-1 p-3 sm:flex-row sm:items-center sm:gap-3 ${i > 0 ? 'border-t border-slate-100' : ''}`}
        >
          <span className="text-xs text-slate-500 sm:w-56 sm:shrink-0">{row.label}</span>
          <input
            aria-label={row.label}
            value={entry[row.key] || ''}
            readOnly={readOnly}
            onChange={e => onChange({ [row.key]: e.target.value })}
            className={CELL}
          />
        </div>
      ))}
    </div>
  )
}

/** TENDER PLAN — 21 milestones against planned and actual dates. */
export function PsfMilestoneTable({ milestones = [], onChange, readOnly }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border border-slate-200">
      {/* A min width so phones scroll the table instead of crushing its date pickers. */}
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className={HEADER_CELL}>Milestone</th>
            <th className={`${HEADER_CELL} w-48`}>Planned</th>
            <th className={`${HEADER_CELL} w-48`}>Actual</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map(m => (
            <tr key={m.id} className="border-b border-slate-100 last:border-b-0">
              <td className="px-3 py-2 text-[13px] text-slate-700">{m.label}</td>
              {['planned', 'actual'].map(field => (
                <td key={field} className="px-2 py-1.5">
                  <PsfDateField
                    labelHidden
                    label={`${field === 'planned' ? 'Planned' : 'Actual'} date for ${m.label}`}
                    value={m[field]}
                    readOnly={readOnly}
                    onChange={v => onChange(m.id, { [field]: v })}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** TENDERER LIST — bidder reference against its pre-qualification result. */
export function PsfTendererTable({ rows = [], onChange, readOnly }) {
  const columns = [
    { key: 'reference', label: 'Contractor / Supplier Reference' },
    { key: 'prequalResult', label: 'Pre-Qualification Result', width: 'w-44' },
    { key: 'justification', label: 'Result Justification' },
  ]
  return (
    <div className="relative overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className={`${HEADER_CELL} w-14`}>S/No.</th>
            {columns.map(c => (
              <th key={c.key} className={`${HEADER_CELL} ${c.width || ''}`}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
              <td className="px-2 py-1.5 text-xs text-slate-400">{i + 1}</td>
              {columns.map(c => (
                <td key={c.key} className="px-2 py-1.5">
                  <input
                    aria-label={`${c.label} ${i + 1}`}
                    value={row[c.key] || ''}
                    readOnly={readOnly}
                    onChange={e => onChange(row.id, { [c.key]: e.target.value })}
                    className={CELL}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/*
 * LC requirements. `yesno` rows answer Yes/No against a justification;
 * `percentage` rows carry a figure against a comment. The template runs both
 * under one numbered sequence, so they share one table.
 */
export function PsfIcvTable({ rows = [], onChange, readOnly }) {
  return (
    <div className="relative overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className={`${HEADER_CELL} w-10`}>#</th>
            <th className={HEADER_CELL}>Requirement</th>
            <th className={`${HEADER_CELL} w-28`}>Yes/No · %</th>
            <th className={HEADER_CELL}>Justification / Comments</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-slate-100 last:border-b-0">
              <td className="px-2 py-1.5 text-xs font-semibold text-slate-400 align-top">{row.ordinal}</td>
              <td className="px-2 py-1.5 text-xs text-slate-700 align-top">{row.requirement}</td>
              <td className="px-2 py-1.5 align-top">
                {row.kind === 'yesno' ? (
                  <select
                    aria-label={`${row.requirement} answer`}
                    value={row.answer || ''}
                    disabled={readOnly}
                    onChange={e => onChange(row.id, { answer: e.target.value })}
                    className={`${CELL} cursor-pointer disabled:cursor-not-allowed`}
                  >
                    <option value="">-</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : (
                  <input
                    inputMode="decimal"
                    aria-label={`${row.requirement} percentage`}
                    value={row.answer || ''}
                    placeholder="%"
                    readOnly={readOnly}
                    onChange={e => onChange(row.id, { answer: e.target.value })}
                    className={CELL}
                  />
                )}
              </td>
              <td className="px-2 py-1.5 align-top">
                <input
                  aria-label={`${row.requirement} comment`}
                  value={row.comment || ''}
                  readOnly={readOnly}
                  onChange={e => onChange(row.id, { comment: e.target.value })}
                  className={CELL}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
