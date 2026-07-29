import { createPortal } from 'react-dom'
import Card from '../ui/Card'
import ErrorBoundary from '../ErrorBoundary'
import SectionFillStep from '../itt/SectionFillStep'
import B2ClassEditor from '../itt/B2ClassEditor'
import { cloneB2Classes } from '../itt/b2Classes'

const FileText = p => (
  <svg width={p.size || 16} height={p.size || 16} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={p.className}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

/*
 * The contract's own document: the ITT section templates it was drafted against,
 * rendered by the very components the ITT section route uses. Contract Drafting
 * opens it to review and approve; Contract Management opens it read-only as the
 * record of what was issued — one path, so the two can never drift.
 *
 * Portalled to <body>: the pages render inside <main>, whose fade-in animation
 * gives it a stacking context, so a modal left in place would paint below the
 * fixed header (z-50) and sidebar (z-40) whatever z-index it is given.
 */
export default function SectionTemplateModal({
  tender, section, sections, onSectionChange,
  title = 'ITT Template Review', readOnly = false, readOnlyNote,
  headerAction, onClose,
  onAnswersChange, onProseChange, onB2Change,
}) {
  if (!section) return null

  // B2 shares its clause classes with ITT creation via the tender itself; a
  // tender whose B2 was never opened falls back to the same seed the ITT uses.
  const b2Classes = tender?.sectionB2Classes || cloneB2Classes()

  return createPortal(
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      {/* Scrolled internally, so the title and the header actions stay put
          however long the template runs. */}
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <Card className="flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-3 p-4 border-b border-slate-100 shrink-0">
            <div className="min-w-0">
              <h3 className="font-semibold text-slate-800">{title}</h3>
              <p className="text-xs text-slate-400 truncate">{section.title} · {tender?.id}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {sections?.length > 1 && onSectionChange && (
                <select
                  value={section.id}
                  onChange={e => onSectionChange(e.target.value)}
                  aria-label="Contract section"
                  className="max-w-[14rem] px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
                >
                  {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
              )}
              {headerAction}
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400">✕</button>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 bg-slate-50/60">
            <ErrorBoundary>
              {section.kind === 'b1-chooser' ? (
                /* B1's template is whichever General Conditions tier the ITT
                   picked — without that choice there is nothing to show. */
                <Card className="p-8 text-center">
                  <FileText size={26} className="mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-medium text-slate-600">No General Conditions tier was selected on this ITT.</p>
                  <p className="text-xs text-slate-400 mt-1">Section B1's template is chosen during ITT creation.</p>
                </Card>
              ) : section.id === 'sectionB2' ? (
                /* B2 is authored as clause classes → sub-classes rather than as
                   template fields, exactly as in the ITT route. */
                <B2ClassEditor
                  key={section.id}
                  section={section}
                  classes={b2Classes}
                  onChange={onB2Change || (() => {})}
                  readOnly={readOnly}
                  readOnlyNote={readOnlyNote}
                  onNext={onClose}
                  onBack={onClose}
                />
              ) : (
                <SectionFillStep
                  key={section.id}
                  section={section}
                  answers={tender?.sectionAnswers?.[section.id]}
                  proseEdits={tender?.sectionProse?.[section.id] || {}}
                  onAnswersChange={onAnswersChange || (() => {})}
                  onProseChange={onProseChange}
                  onNext={onClose}
                  onBack={onClose}
                  isFirst={false}
                  isLast={false}
                  nextLabel="Save & Close"
                  readOnly={readOnly}
                  readOnlyNote={readOnlyNote}
                  // Sized so the section card fits the panel without a second
                  // scrollbar appearing outside the document itself.
                  bodyMaxHeight="max(200px, calc(100vh - 32rem))"
                />
              )}
            </ErrorBoundary>
          </div>
        </Card>
      </div>
    </div>,
    document.body,
  )
}
