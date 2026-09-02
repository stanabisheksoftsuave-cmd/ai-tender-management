/*
 * The form primitives every PSF section is built from, plus the template's four
 * tables.
 *
 * Kept together because consistency across ~20 sections is the whole point: a
 * section that hand-rolls its own label or border loses the shared read-only
 * treatment the submitted form depends on.
 */

import { Sparkles } from 'lucide-react'
import Card from '../ui/Card'
import AiEditableTextarea from '../ui/AiEditableTextarea'

const INPUT =
  'w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none ' +
  'focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:bg-slate-50 disabled:text-slate-500'

/** Shared cell styling, so the four tables cannot drift apart. */
const CELL =
  'w-full text-xs border border-slate-200 rounded px-1.5 py-1 bg-white focus:outline-none ' +
  'focus:border-[var(--color-primary)]/50 disabled:bg-slate-50 disabled:text-slate-500'

const HEADER_CELL =
  'px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wide text-slate-500'

/** A titled block, with the template's underlined section heading. */
export function PsfSection({ title, children }) {
  return (
    <Card className="p-5">
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

/** One editable single-line value. */
export function PsfField({ label, value, onChange, readOnly }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-medium text-slate-600">{label}</span>
      <input
        value={value || ''}
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
        className={INPUT}
      />
    </label>
  )
}

/*
 * One of the template's red "AI to generate…" fields, rendered as drafted prose
 * with the select-to-edit popup. The badge is what tells a reviewer the text was
 * drafted rather than typed by the Contract Holder.
 */
export function PsfNarrative({ label, value, rows, onChange, readOnly }) {
  return (
    <div>
      <div className="mb-1.5 flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">{label}</span>
        <span className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary)]/8 px-1.5 py-0.5 rounded-full">
          <Sparkles size={9} /> AI drafted
        </span>
      </div>
      <AiEditableTextarea
        value={value || ''}
        rows={rows}
        disabled={readOnly}
        onChange={onChange}
        className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:bg-slate-50 disabled:text-slate-500"
      />
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
        disabled={readOnly}
        onChange={e => onChange(e.target.value)}
        className={`${INPUT} resize-y`}
      />
    </label>
  )
}

/** A tick-box group in the template's column count. */
export function PsfCheckboxGrid({ options, onToggle, readOnly, columns = 3 }) {
  const cols = columns === 1 ? '' : columns === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'
  return (
    <div className={`grid grid-cols-1 gap-x-4 gap-y-1 ${cols}`}>
      {options.map(option => (
        <label
          key={option.id}
          className={`flex items-center gap-2 text-xs ${readOnly ? 'text-slate-500' : 'text-slate-700 cursor-pointer'}`}
        >
          <input
            type="checkbox"
            checked={option.checked}
            disabled={readOnly}
            onChange={e => onToggle(option.id, e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          {option.label}
        </label>
      ))}
    </div>
  )
}

/*
 * One of the two HISTORY tables — label/value rows, not columns. Every label
 * carries the scope: the two tables share row names, and a duplicate accessible
 * name leaves a screen reader unable to say which contract a field belongs to.
 */
export function PsfHistoryTable({ scope, entry, onChange, readOnly }) {
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
          className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 px-3 py-2 ${i > 0 ? 'border-t border-slate-100' : ''}`}
        >
          <span className="text-[11px] text-slate-500 sm:w-1/2 shrink-0">{row.label}</span>
          <input
            aria-label={row.label}
            value={entry[row.key] || ''}
            disabled={readOnly}
            onChange={e => onChange({ [row.key]: e.target.value })}
            className={CELL}
          />
        </div>
      ))}
    </div>
  )
}

/** TENDER PLAN — 21 milestones against planned and actual dates. */
export function PsfMilestoneTable({ milestones, onChange, readOnly }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[520px] border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className={HEADER_CELL}>Milestone</th>
            <th className={`${HEADER_CELL} w-40`}>Planned</th>
            <th className={`${HEADER_CELL} w-40`}>Actual</th>
          </tr>
        </thead>
        <tbody>
          {milestones.map(m => (
            <tr key={m.id} className="border-b border-slate-50 last:border-b-0">
              <td className="px-2 py-1.5 text-xs text-slate-700">{m.label}</td>
              {['planned', 'actual'].map(field => (
                <td key={field} className="px-2 py-1.5">
                  <input
                    type="date"
                    aria-label={`${m.label} — ${field}`}
                    value={m[field] || ''}
                    // A date input needs `disabled`: browsers do not reliably
                    // honour `readOnly` on one, so the native picker could still
                    // change a submitted form's value.
                    disabled={readOnly}
                    onChange={e => onChange(m.id, { [field]: e.target.value })}
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

/** TENDERER LIST — bidder reference against its pre-qualification result. */
export function PsfTendererTable({ rows, onChange, readOnly }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[620px] border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className={`${HEADER_CELL} w-12`}>S/No.</th>
            <th className={HEADER_CELL}>Contractor / Supplier Reference</th>
            <th className={`${HEADER_CELL} w-40`}>Pre-Qualification Result</th>
            <th className={HEADER_CELL}>Result Justification</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={row.id} className="border-b border-slate-50 last:border-b-0">
              <td className="px-2 py-1.5 text-xs text-slate-400">{i + 1}</td>
              {['reference', 'prequalResult', 'justification'].map(field => (
                <td key={field} className="px-2 py-1.5">
                  <input
                    aria-label={`Tenderer ${i + 1} — ${field}`}
                    value={row[field] || ''}
                    disabled={readOnly}
                    onChange={e => onChange(row.id, { [field]: e.target.value })}
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
 * ICV requirements. `yesno` rows answer Yes/No against a justification;
 * `percentage` rows carry a figure against a comment. The template runs both
 * under one numbered sequence, so they share one table.
 */
export function PsfIcvTable({ rows, onChange, readOnly }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[680px] border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className={`${HEADER_CELL} w-10`}>#</th>
            <th className={HEADER_CELL}>Requirement</th>
            <th className={`${HEADER_CELL} w-32`}>Yes/No · %</th>
            <th className={HEADER_CELL}>Justification / Comments</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-slate-50 last:border-b-0">
              <td className="px-2 py-1.5 text-xs font-semibold text-slate-400 align-top">{row.ordinal}</td>
              <td className="px-2 py-1.5 text-xs text-slate-700 align-top">{row.requirement}</td>
              <td className="px-2 py-1.5 align-top">
                {row.kind === 'yesno' ? (
                  <select
                    aria-label={`${row.requirement} — answer`}
                    value={row.answer || ''}
                    disabled={readOnly}
                    onChange={e => onChange(row.id, { answer: e.target.value })}
                    className={CELL}
                  >
                    <option value="">—</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : (
                  <input
                    aria-label={`${row.requirement} — percentage`}
                    value={row.answer || ''}
                    placeholder="%"
                    disabled={readOnly}
                    onChange={e => onChange(row.id, { answer: e.target.value })}
                    className={CELL}
                  />
                )}
              </td>
              <td className="px-2 py-1.5 align-top">
                <input
                  aria-label={`${row.requirement} — comment`}
                  value={row.comment || ''}
                  disabled={readOnly}
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
