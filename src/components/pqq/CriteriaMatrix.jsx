import { Fragment, useEffect, useRef, useState } from 'react'
import { Bot, Check, ChevronDown, FileDown, RotateCcw } from 'lucide-react'
import { useDismissable } from '../../context/NavigationContext'
import { cn } from '../../utils/cn'
import { ConfirmDialog, PqqAlert, PqqButton, Pill, ReasonDialog, ReasonPopupLink } from './PqqUi'
import {
  MARK_CHOICES, PQQ_LONG_TEXT_MAX_LENGTH, PQQ_TEXT_LIMIT_MESSAGE, isApplicable, markLabel, stage3Verdict, verdictTone,
} from './pqqModel'

const RESET_RATIONALE = 'Reset to the AI mark.'
const CONFIRM_RATIONALE = 'AI suggestion confirmed'

/*
 * MAIN's CriterionChoiceControl: a chip showing the current mark that opens a
 * small menu of the vocabulary (Pass / Fail).
 */
function MarkChoice({ value, selectLabel, menuLabel, disabled, onChoose }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef(null)
  useDismissable(open, () => setOpen(false))

  useEffect(() => {
    if (!open) return undefined
    const onDown = e => { if (!rootRef.current?.contains(e.target)) setOpen(false) }
    const onKey = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDown)
    window.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('keydown', onKey)
    }
  }, [open])

  const tone = value == null
    ? 'border-slate-200 bg-white text-slate-500 hover:border-[#0089cf]/40 hover:text-slate-700'
    : value === 'pass'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/70'
      : 'border-red-300 bg-red-50 text-red-700 hover:bg-red-100/70'

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`${selectLabel}: ${value ? markLabel(value) : 'not set'}. Change value`}
        onClick={() => setOpen(o => !o)}
        className={cn('inline-flex min-h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60', tone)}
      >
        <span className={cn('w-2 h-2 rounded-full', value == null ? 'bg-slate-300' : value === 'pass' ? 'bg-emerald-500' : 'bg-red-500')} aria-hidden="true" />
        {value ? markLabel(value) : 'Select'}
        <ChevronDown size={13} className="opacity-70" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute left-0 top-full z-30 mt-1.5 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
          <p className="px-2 pt-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 line-clamp-2">{menuLabel}</p>
          {MARK_CHOICES.map(choice => (
            <button
              key={choice}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); onChoose(choice) }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-xs font-medium hover:bg-slate-50"
            >
              <span className={cn('w-2 h-2 shrink-0 rounded-full', choice === 'pass' ? 'bg-emerald-500' : 'bg-red-500')} aria-hidden="true" />
              <span className="flex-1 text-slate-700">{markLabel(choice)}</span>
              {value === choice ? <Check size={13} className="shrink-0 text-[#0089cf]" aria-hidden="true" /> : null}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ReuploadBidderDocumentsButton({ bidder, disabled, onReplace, onError }) {
  const inputRef = useRef(null)
  const handleFile = (file) => {
    const docs = bidder.pqDocuments || []
    if (file.size > 512 * 1024 * 1024) { onError(`File ${file.name} exceeds the 512 MB limit.`); return }
    if (docs.length === 0) { onError('This bidder has no uploaded document to replace.'); return }
    let target = docs.length === 1 ? docs[0] : null
    if (!target) {
      const wanted = file.name.trim().toLowerCase()
      const hits = docs.filter(d => d.name.trim().toLowerCase() === wanted)
      if (hits.length === 1) target = hits[0]
    }
    if (!target) {
      onError(`${file.name} does not match the name of any uploaded document. Name the new file like the one it replaces.`)
      return
    }
    onReplace(target.id, file)
  }
  return (
    <>
      <PqqButton variant="outline" className="w-full bg-[#0089cf]/5" disabled={disabled} onClick={() => inputRef.current?.click()}>
        Reupload Bidder Documents
      </PqqButton>
      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        tabIndex={-1}
        aria-label="Replacement document"
        disabled={disabled}
        onChange={e => {
          const file = e.currentTarget.files?.[0]
          e.currentTarget.value = ''
          if (file) handleFile(file)
        }}
      />
    </>
  )
}

/*
 * Stage 3 criteria matrix (MAIN CriteriaMatrix): criteria rows grouped by
 * QHSE / Technical / Administrative, one column per bidder. The AI marks the
 * whole roster in one run; any override needs a reason; Reset restores the AI
 * mark and its reason.
 *
 * `sheets` and the `marksKey` family let the same grid serve read-only views.
 */
export function CriteriaMatrix({
  bidders, sheets, canEdit, isEvaluating, hasEverEvaluated, evidenceReadiness,
  recentlyReuploaded, isUploadInProgress, onEvaluateAll, onSaveMark, onReplaceDocument,
  onNotice, onExportReason,
}) {
  const [confirmEvaluate, setConfirmEvaluate] = useState(false)
  const [reasonDialog, setReasonDialog] = useState(null)

  const markOf = (bidder, sheetKey, c) => {
    const value = bidder.stage3?.[sheetKey]?.[c.id] ?? null
    const aiValue = bidder.stage3Ai?.[sheetKey]?.[c.id] ?? null
    const override = bidder.stage3Overrides?.[sheetKey]?.[c.id] || null
    const isOverridden = aiValue != null && value != null && value !== aiValue
    return {
      value,
      aiValue,
      isOverridden,
      overrideRationale: override && override.value === value ? override.rationale : null,
      aiRationale: bidder.stage3AiReasons?.[sheetKey]?.[c.id] ?? bidder.stage3Reasons?.[sheetKey]?.[c.id] ?? null,
    }
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-800">Criteria</h3>
        {canEdit ? (
          <PqqButton
            variant="outline"
            disabled={isEvaluating || evidenceReadiness !== 'ready' || isUploadInProgress}
            onClick={() => setConfirmEvaluate(true)}
          >
            <Bot size={14} aria-hidden="true" /> {isEvaluating ? 'Evaluating…' : 'Evaluate with AI'}
          </PqqButton>
        ) : null}
      </div>

      <ConfirmDialog
        isOpen={confirmEvaluate}
        icon={Bot}
        title="Run AI evaluation?"
        description="The AI will analyse every bidder's uploaded response documents against the pre-qualification criteria and mark the whole roster. This can take a few minutes."
        confirmLabel="Run evaluation"
        onConfirm={() => { setConfirmEvaluate(false); onEvaluateAll() }}
        onClose={() => setConfirmEvaluate(false)}
      />

      {canEdit && !isEvaluating && evidenceReadiness === 'missing' ? (
        <PqqAlert tone="info" className="mb-4">
          Every bidder still in review needs an uploaded response document before the AI can evaluate — one run marks
          the whole roster at once, so a bidder with nothing to cite would come back Fail. Upload their response, or mark
          them as Not Participating.
        </PqqAlert>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-max border-collapse text-left">
          <thead>
            <tr>
              <th scope="col" className="sticky left-0 z-10 min-w-56 border-b border-slate-200 bg-slate-50 p-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Criterion</th>
              {bidders.map(bidder => {
                const verdict = stage3Verdict(bidder)
                const meta = [bidder.country, bidder.category].filter(Boolean).join(' · ')
                return (
                  <th key={bidder.id} scope="col" className="min-w-52 border-b border-l border-slate-200 bg-slate-50 p-3 align-top">
                    <span className="flex flex-col gap-1.5">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide break-words text-slate-800">{bidder.name}</span>
                        <Pill tone={verdictTone(verdict)}>{verdict}</Pill>
                      </span>
                      {meta ? <span className="text-[11px] font-normal text-slate-400">{meta}</span> : null}
                      {verdict === 'fail' && !recentlyReuploaded?.has(String(bidder.id)) ? (
                        <span className="flex w-full flex-col gap-1.5">
                          {canEdit ? (
                            <ReuploadBidderDocumentsButton
                              bidder={bidder}
                              disabled={isEvaluating}
                              onError={msg => onNotice('danger', msg)}
                              onReplace={(docId, file) => onReplaceDocument(bidder.id, docId, file, 'matrix')}
                            />
                          ) : null}
                          <PqqButton
                            variant="secondary"
                            className="w-full"
                            aria-label={`Export Reason for ${bidder.name}`}
                            onClick={() => onExportReason(bidder)}
                          >
                            <FileDown size={13} aria-hidden="true" /> Export Reason
                          </PqqButton>
                        </span>
                      ) : null}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {sheets.map(sheet => (
              <Fragment key={sheet.key}>
                <tr>
                  <th scope="row" colSpan={bidders.length + 1} className="bg-slate-100 px-3 py-2 text-xs font-bold uppercase tracking-wide text-slate-700">
                    {sheet.label}
                  </th>
                </tr>
                {sheet.criteria.map(c => (
                  <tr key={`${sheet.key}-${c.id}`} className="border-b border-slate-100">
                    <th scope="row" className="sticky left-0 z-10 bg-white p-3 align-top">
                      <p className="text-xs font-medium text-slate-700">{c.item}</p>
                      <p className="mt-0.5 w-64 whitespace-normal text-[10px] font-normal text-slate-400">{c.detail}</p>
                    </th>
                    {bidders.map(bidder => {
                      if (!isApplicable(c, bidder)) {
                        return (
                          <td key={bidder.id} className="border-l border-slate-100 bg-slate-50/50 p-3 align-top text-sm">
                            <span className="text-slate-400">Not applicable</span>
                          </td>
                        )
                      }
                      const mark = markOf(bidder, sheet.key, c)
                      const showsReason = mark.value === 'fail'
                      const subject = `${c.item} for ${bidder.name}`
                      const reset = () => onSaveMark(bidder.id, sheet.key, c.id, mark.aiValue, RESET_RATIONALE)
                      if (!canEdit) {
                        return (
                          <td key={bidder.id} className="border-l border-slate-100 p-3 align-top text-sm">
                            <div className="flex flex-col items-start gap-1.5">
                              <span className={mark.value ? (mark.value === 'pass' ? 'font-semibold text-emerald-700' : 'font-semibold text-red-700') : 'text-slate-400'}>
                                {mark.value ? markLabel(mark.value) : 'Not yet evaluated'}
                              </span>
                              {showsReason ? (
                                <ReasonPopupLink subject={subject} reason={mark.overrideRationale?.trim() ? mark.overrideRationale : mark.aiRationale} />
                              ) : null}
                            </div>
                          </td>
                        )
                      }
                      return (
                        <td key={bidder.id} className="border-l border-slate-100 p-3 align-top text-sm">
                          <div className="flex flex-col items-start gap-1.5">
                            <MarkChoice
                              value={mark.value}
                              selectLabel={`Mark ${c.item} for ${bidder.name}`}
                              menuLabel={c.item}
                              disabled={isEvaluating || (mark.value === null && !hasEverEvaluated)}
                              onChoose={choice => {
                                if (choice === 'pass') {
                                  onSaveMark(bidder.id, sheet.key, c.id, choice, CONFIRM_RATIONALE)
                                  return
                                }
                                setReasonDialog({
                                  bidderId: bidder.id,
                                  bidderName: bidder.name,
                                  sheetKey: sheet.key,
                                  criterionId: c.id,
                                  criterionLabel: c.item,
                                  value: choice,
                                  initialReason: mark.value === choice ? (mark.overrideRationale ?? '') : '',
                                })
                              }}
                            />
                            {mark.value === null && !hasEverEvaluated ? (
                              <span className="text-[10px] text-slate-400">Not yet evaluated</span>
                            ) : mark.isOverridden && !showsReason ? (
                              <button
                                type="button"
                                aria-label={`Reset ${c.item} to AI for ${bidder.name}`}
                                disabled={isEvaluating || mark.aiValue === null}
                                onClick={reset}
                                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-slate-500 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                              >
                                <RotateCcw size={11} aria-hidden="true" /> Reset to AI
                              </button>
                            ) : !mark.isOverridden && mark.aiValue !== null ? (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                                <Bot size={11} aria-hidden="true" /> AI suggested
                              </span>
                            ) : null}
                            {showsReason ? (
                              <ReasonPopupLink
                                subject={subject}
                                reason={mark.overrideRationale?.trim() ? mark.overrideRationale : mark.aiRationale}
                                resetDisabled={isEvaluating || mark.aiValue === null}
                                editDisabled={isEvaluating}
                                editInitialReason={mark.overrideRationale ?? ''}
                                editMaxLength={PQQ_LONG_TEXT_MAX_LENGTH}
                                editLimitMessage={PQQ_TEXT_LIMIT_MESSAGE}
                                onSaveEdit={reason => onSaveMark(bidder.id, sheet.key, c.id, mark.value, reason)}
                                onReset={mark.isOverridden ? reset : undefined}
                              />
                            ) : null}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {reasonDialog ? (
        <ReasonDialog
          key={`${reasonDialog.bidderId}-${reasonDialog.criterionId}`}
          isOpen
          title={`Reason for marking "${reasonDialog.criterionLabel}" as ${markLabel(reasonDialog.value)}`}
          description={`This marks ${reasonDialog.bidderName}'s response as "${markLabel(reasonDialog.value)}" for this criterion.`}
          reasonLabel="Reason for this mark"
          reasonHint="Required — stored on the audit trail alongside the AI's own mark."
          initialReason={reasonDialog.initialReason}
          confirmLabel="Save mark"
          maxLength={PQQ_LONG_TEXT_MAX_LENGTH}
          limitMessage={PQQ_TEXT_LIMIT_MESSAGE}
          onConfirm={reason => {
            onSaveMark(reasonDialog.bidderId, reasonDialog.sheetKey, reasonDialog.criterionId, reasonDialog.value, reason)
            setReasonDialog(null)
          }}
          onClose={() => setReasonDialog(null)}
        />
      ) : null}
    </>
  )
}
