import { Bot, User, X, XCircle } from 'lucide-react'
import { ModalShell } from './Dialogs'
import { evidenceLines, formatPassMark, formatPercent, scoreNarrative } from './model'
import { cn } from '../../utils/cn'

const LABEL = 'mb-1 text-[10px] font-bold uppercase tracking-wide text-slate-400'
const PANEL = 'grid grid-cols-2 gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs'

const fallbackEvidence = (bidderName, criterion) => [
  `${bidderName} — Technical Proposal, response to “${criterion}”`,
  'Method Statement / supporting annexes cross-referenced against the ITT scope',
  'AI extraction index entry for the corresponding proposal section',
]

/**
 * AI Score Justification / Score Justification — Overridden / AI Fail
 * Reasoning — MAIN's `ScoreRationaleModal`.
 *
 *   { kind: 'score', bidderName, criterion, criterionType, score, weight, band, minScore, evidence, isOverridden, overrideReason }
 *   { kind: 'fail', bidderName, total, passingScore, fails: [{ criterion, score, minScore, band }] }
 */
export function ScoreRationaleModal({ rationale, onClose }) {
  const r = rationale
  const belowMin = r?.kind === 'score' && r.criterionType === 'Must' && r.minScore != null && r.score < r.minScore
  const scoreChip = r?.kind !== 'score' ? ''
    : belowMin ? 'bg-red-100 text-red-700'
      : r.score >= 3 ? 'bg-emerald-100 text-emerald-700'
        : r.score >= 2 ? 'bg-blue-100 text-blue-700'
          : r.score >= 1 ? 'bg-amber-100 text-amber-700'
            : 'bg-red-100 text-red-700'

  return (
    <ModalShell isOpen={!!r} onClose={onClose} labelledBy="score-rationale-title" className="max-w-lg">
      {r && (
        <>
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-5">
            <div className="flex min-w-0 items-center gap-2">
              {r.kind === 'score' && r.isOverridden
                ? <User size={16} className="text-[var(--color-primary)]" />
                : <Bot size={16} className="text-[var(--color-primary)]" />}
              <h3 id="score-rationale-title" className="text-sm font-bold text-slate-800">
                {r.kind === 'score'
                  ? (r.isOverridden ? 'Score Justification — Overridden' : 'AI Score Justification')
                  : 'AI Fail Reasoning'}
              </h3>
            </div>
            <button type="button" onClick={onClose} aria-label="Close"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100">
              <X size={15} />
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto px-4 py-4 sm:px-5">
            <div>
              <p className="break-words text-sm font-semibold text-slate-800">{r.bidderName}</p>
              {r.kind === 'score' && <p className="text-xs text-slate-500">{r.criterion}</p>}
            </div>

            {r.kind === 'score' ? (
              <>
                <div className={PANEL}>
                  <div className="text-slate-500">Type: <span className="font-semibold text-slate-700">{r.criterionType}</span></div>
                  <div className="text-slate-500">Weight: <span className="font-semibold text-slate-700">{r.weight}%</span></div>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    Awarded: <span className={cn('rounded-full px-2 py-0.5 font-bold', scoreChip)}>{r.score} / 3</span>
                  </div>
                  {r.minScore != null && (
                    <div className="text-slate-500">
                      Min required: <span className="font-semibold text-slate-700">{r.minScore}</span>
                      {belowMin && <span className="ml-1 text-[10px] font-bold text-red-600">below min</span>}
                    </div>
                  )}
                </div>

                {r.isOverridden && (
                  <div className="rounded-lg border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5 p-3">
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[var(--color-primary)]">
                      <User size={12} /> Evaluator&apos;s Reason for Override
                    </p>
                    <p className="text-sm leading-relaxed text-slate-800">{r.overrideReason || 'No reason was recorded for this override.'}</p>
                  </div>
                )}

                <div>
                  <p className={LABEL}>Scoring Band</p>
                  <p className="rounded border-l-2 border-[var(--color-primary)] bg-blue-50/60 px-3 py-2 text-sm text-slate-700">
                    {r.band || 'Band description not available for this score.'}
                  </p>
                </div>

                <div>
                  <p className={LABEL}>
                    {r.isOverridden ? (r.evidence ? "AI's Original Justification" : 'Summary of Final Score') : 'AI Justification'}
                  </p>
                  <p className="text-sm leading-relaxed text-slate-700">{r.evidence ? r.evidence.rationale : scoreNarrative(r.score)}</p>
                  {belowMin && (
                    <p className="mt-2 text-xs text-red-600">
                      This is a <b>Must</b> criterion scored below the minimum threshold — on its own, sufficient to fail the bidder at the technical stage.
                    </p>
                  )}
                </div>

                <div>
                  <p className={LABEL}>Evidence Reviewed</p>
                  <ul className="list-disc space-y-1 pl-4 text-xs text-slate-600">
                    {(r.evidence ? evidenceLines(r.evidence) : fallbackEvidence(r.bidderName, r.criterion)).map(entry => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <>
                <div className={PANEL}>
                  <div className="flex items-center gap-1.5 text-slate-500">
                    Result: <span className="rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-700">FAIL</span>
                  </div>
                  <div className="text-slate-500">Pass mark: <span className="font-semibold text-slate-700">{formatPassMark(r.passingScore)}</span></div>
                  <div className="col-span-2 text-slate-500">Weighted total: <span className="font-semibold text-slate-700">{formatPercent(r.total)}</span></div>
                </div>

                <div>
                  <p className={LABEL}>Why this bidder did not pass</p>
                  {r.fails.length > 0 ? (
                    <ul className="space-y-1.5 text-sm text-slate-700">
                      {r.fails.map((fail, index) => (
                        <li key={`${fail.criterion}-${index}`} className="flex items-start gap-2">
                          <XCircle size={13} className="mt-0.5 shrink-0 text-red-500" />
                          <span><b>{fail.criterion}</b> — scored {fail.score} / 3, minimum required {fail.minScore}.{fail.band ? ` ${fail.band}` : ''}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-700">
                      All mandatory (Must) criteria met their minimum, but the overall weighted score of <b>{formatPercent(r.total)}</b> is below the
                      required pass mark of <b>{formatPassMark(r.passingScore)}</b>.
                    </p>
                  )}
                </div>

                <div>
                  <p className={LABEL}>AI Summary</p>
                  <p className="text-sm leading-relaxed text-slate-700">
                    Based on the recorded scores, {r.bidderName} does not satisfy the technical qualification criteria for this tender and is not
                    carried forward to the commercial stage.{r.fails.length > 0 ? ' The mandatory shortfalls listed above are decisive.' : ''}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 px-4 py-4 sm:px-5">
            <button type="button" onClick={onClose}
              className="rounded-xl bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90">
              Close
            </button>
          </div>
        </>
      )}
    </ModalShell>
  )
}
