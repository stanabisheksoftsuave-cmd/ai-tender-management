import { useEffect, useRef, useState } from 'react'
import { ArrowRight, Sparkles, Upload } from 'lucide-react'
import AiAnalysisLoader from '../ui/AiAnalysisLoader'
import SectionFillStep from '../itt/SectionFillStep'
import { useAiLockWhile } from '../../hooks/useAiLockWhile'
import { buildFilledDocxBlob, parseDocxTemplate } from '../../utils/docxTemplate'
import { exportBiddersListXlsx } from '../../utils/pqqExports'
import { tenderRef } from '../../utils/tenderRef'
import { ShellFooter } from './PrequalShell'
import { PqqAlert, PqqButton, Pill } from './PqqUi'
import { PQQ_QUICK_PROMPTS, PQQ_SECTION, generateQuestionnaireAnswers, prefillQuestionnaireProse } from './pqqModel'

const EMPTY_Q = { answers: null, sources: null, proseEdits: {}, generatedAt: null, exportedAt: null }
const GENERATE_STEPS = [
  'Reading the Statement of Work...',
  'Drafting the questionnaire fields...',
  'Generating questionnaire...',
]

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

/*
 * Stage 2 — Questionnaire (MAIN Stage2Questionnaire). The PQQ docx is filled
 * through TARGET's SectionFillStep; "Generate with AI" drafts every field
 * (each tagged with its source: 'system' when read off the tender, 'ai' when
 * drafted, 'user' once edited), answers persist on the tender
 * (tender.pqQuestionnaire), and "Continue to Response Review" unlocks only once
 * the current questionnaire has been exported — any later edit re-locks it.
 */
export function Stage2Questionnaire({ tender, patch, getLatest, onContinue, onBack }) {
  const q = { ...EMPTY_Q, ...(tender.pqQuestionnaire || {}) }
  const [fields, setFields] = useState(null)
  const [texts, setTexts] = useState([])
  const [templateError, setTemplateError] = useState(null)
  const [generatingStep, setGeneratingStep] = useState(null) // index into GENERATE_STEPS
  const [nonce, setNonce] = useState(0)
  const [pendingExport, setPendingExport] = useState(null)
  const [exportError, setExportError] = useState(null)
  const autoRan = useRef(false)

  const isGenerating = generatingStep !== null
  useAiLockWhile(isGenerating, 'Generating Pre-Qualification Questionnaire')

  useEffect(() => {
    let cancelled = false
    parseDocxTemplate(PQQ_SECTION.docxUrl)
      .then(model => { if (!cancelled) { setFields(model.fields); setTexts(model.texts || []) } })
      .catch(err => { if (!cancelled) setTemplateError(err?.message || 'Failed to load the questionnaire.') })
    return () => { cancelled = true }
  }, [])

  const generate = () => {
    if (!fields || isGenerating) return
    setGeneratingStep(0)
    const tick = (i) => {
      if (i < GENERATE_STEPS.length) {
        setGeneratingStep(i)
        setTimeout(() => tick(i + 1), 900)
        return
      }
      patch(t => {
        const { answers, sources } = generateQuestionnaireAnswers(fields, t)
        const cur = { ...EMPTY_Q, ...(t.pqQuestionnaire || {}) }
        // Tender number/title placeholders in the prose arrive filled (MAIN);
        // anything the user already rewrote in the prose wins.
        const proseEdits = { ...prefillQuestionnaireProse(texts, t), ...(cur.proseEdits || {}) }
        return { pqQuestionnaire: { ...cur, answers, sources, proseEdits, generatedAt: new Date().toISOString(), exportedAt: null } }
      })
      setNonce(n => n + 1)
      setGeneratingStep(null)
    }
    tick(0)
  }

  // MAIN auto-generates once when every field is still empty.
  useEffect(() => {
    if (autoRan.current || !fields || fields.length === 0) return
    if (Array.isArray(tender.pqQuestionnaire?.answers)) return
    autoRan.current = true
    const t = setTimeout(generate, 0)
    return () => clearTimeout(t)
    // `generate` reads fresh state through patch; running once is the point.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields])

  const hasGenerated = Array.isArray(q.answers) && q.answers.length > 0

  const onAnswersChange = (_, values) => {
    patch(t => {
      const cur = { ...EMPTY_Q, ...(t.pqQuestionnaire || {}) }
      const prev = cur.answers || []
      const changed = values.some((v, i) => v !== prev[i])
      if (!changed) return null
      const sources = values.map((v, i) => (v !== prev[i] ? 'user' : (cur.sources?.[i] ?? 'empty')))
      return { pqQuestionnaire: { ...cur, answers: values, sources, exportedAt: null } }
    })
  }

  const onProseChange = (_, edits) => {
    patch(t => ({ pqQuestionnaire: { ...EMPTY_Q, ...(t.pqQuestionnaire || {}), proseEdits: edits, exportedAt: null } }))
  }

  const exportQuestionnaire = async () => {
    setExportError(null)
    setPendingExport('questionnaire')
    try {
      // SectionFillStep flushes its answers through onAnswersChange right
      // before calling this, so read them back off the patched tender.
      const latest = { ...EMPTY_Q, ...(getLatest()?.pqQuestionnaire || {}) }
      const blob = await buildFilledDocxBlob(PQQ_SECTION.docxUrl, latest.answers || [], latest.proseEdits || {})
      downloadBlob(blob, `PQQ - ${tenderRef(tender)}.docx`)
      patch(t => ({ pqQuestionnaire: { ...EMPTY_Q, ...(t.pqQuestionnaire || {}), exportedAt: new Date().toISOString() } }))
    } catch (err) {
      setExportError(`Could not download the questionnaire. ${err?.message || ''}`.trim())
    } finally {
      setPendingExport(null)
    }
  }

  const exportBidderList = () => {
    setExportError(null)
    setPendingExport('bidders')
    try {
      exportBiddersListXlsx(tender)
    } catch (err) {
      setExportError(`Could not download the bidder list. ${err?.message || ''}`.trim())
    } finally {
      setPendingExport(null)
    }
  }

  const shortlisted = (tender.prequalBidders || []).filter(b => !b.droppedAt)
  const isExported = hasGenerated && Boolean(q.exportedAt)

  return (
    <>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b px-4 py-4 sm:px-6" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="shrink-0 text-[13px] font-bold uppercase tracking-wider text-slate-800">Shortlisted Bidders:</h2>
        {shortlisted.length === 0 ? (
          <p className="text-sm text-slate-400">No bidders on the confirmed shortlist.</p>
        ) : (
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {shortlisted.map(b => (
              <Pill key={b.id} tone="primary" className="normal-case tracking-normal text-[11px] font-semibold">{b.name}</Pill>
            ))}
          </div>
        )}
        <PqqButton
          variant="outline"
          className="ml-auto shrink-0"
          disabled={isGenerating || pendingExport === 'bidders' || shortlisted.length === 0}
          onClick={exportBidderList}
        >
          <Upload size={13} aria-hidden="true" /> Export Bidders List (.xlsx)
        </PqqButton>
      </div>

      <div className="space-y-5 px-4 pt-5 pb-6 sm:px-6">
        {isExported ? (
          <PqqAlert tone="success">
            Questionnaire generated and downloaded — ready to distribute. Continue to Stage 3 to send it to the shortlisted bidders.
          </PqqAlert>
        ) : null}
        {exportError ? <PqqAlert tone="danger">{exportError}</PqqAlert> : null}
        {templateError ? (
          <PqqAlert tone="danger" title="Could not load the questionnaire template">{templateError}</PqqAlert>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-slate-500">
            {hasGenerated
              ? 'AI-drafted from this tender\'s Statement of Work — review every field, then Export.'
              : 'Generate the questionnaire from the Statement of Work to get started.'}
          </p>
          <PqqButton variant="primary" disabled={!fields || isGenerating} onClick={generate}>
            <Sparkles size={14} aria-hidden="true" />
            {isGenerating ? 'Generating questionnaire...' : hasGenerated ? 'Regenerate with AI' : 'Generate with AI'}
          </PqqButton>
        </div>

        {isGenerating && !hasGenerated ? (
          <AiAnalysisLoader
            title="Generating Pre-Qualification Questionnaire"
            description="AI is drafting the questionnaire from this tender's Statement of Work..."
            progress={Math.round(((generatingStep + 1) / (GENERATE_STEPS.length + 1)) * 100)}
            steps={GENERATE_STEPS.map((label, i) => ({
              id: String(i),
              label,
              status: i < generatingStep ? 'complete' : i === generatingStep ? 'active' : 'pending',
            }))}
          />
        ) : (
          <SectionFillStep
            key={`pqq-${nonce}`}
            section={PQQ_SECTION}
            answers={q.answers}
            onAnswersChange={onAnswersChange}
            proseEdits={q.proseEdits || {}}
            onProseChange={onProseChange}
            quickPrompts={PQQ_QUICK_PROMPTS}
            onNext={exportQuestionnaire}
            onBack={onBack}
            isLast
            lastLabel={pendingExport === 'questionnaire' ? 'Exporting…' : 'Export'}
            nextDisabled={isGenerating || pendingExport !== null}
            readOnly={isGenerating}
            readOnlyNote="Generating questionnaire..."
            standInNotice={isGenerating ? (
              <div className="mb-3"><PqqAlert tone="info">Regenerating the questionnaire with AI…</PqqAlert></div>
            ) : null}
          />
        )}
      </div>

      <ShellFooter>
        {!isExported ? (
          <p className="text-xs text-slate-400">Export the questionnaire to continue.</p>
        ) : null}
        <PqqButton variant="primary" disabled={isGenerating || !isExported} onClick={onContinue}>
          Continue to Response Review <ArrowRight size={14} aria-hidden="true" />
        </PqqButton>
      </ShellFooter>
    </>
  )
}
