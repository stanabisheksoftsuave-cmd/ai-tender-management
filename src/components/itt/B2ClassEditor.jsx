import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Layers, Wand2, X, Check, AlertTriangle, Link2, Upload, Sparkles, Loader2,
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import AiEditableField from '../ui/AiEditableField'
import { useDismissable } from '../../context/NavigationContext'
import {
  newId, newSubclass, countSubclasses, sourceRefLabel, draftB2Clause,
  classStatus, classesPendingApproval, b2ClassDocument,
  B2_ACTION_TYPES, B2_ACTION_OBJECTS, B2_EVIDENCE_SOURCES,
  ADD_NEW_CLAUSE, ADD_NEW_SUBCLAUSE,
  B1_CLAUSE_CATALOGUE, b1ClauseTitle, b1SubclauseOptions, b1SubclauseTitle,
} from './b2Classes'

/*
 * Section B2 — Special Conditions of Contract.
 *
 * Classes on the left; picking one lists its sub-classes; picking a sub-class
 * opens its data on the right. A sub-class is one row of the client's B2
 * template: the source clause it acts on (B-G), the action taken (H-I), the
 * evidence (J), the instruction to the AI (K) and the generated clause text
 * (L), which stays select-to-edit-with-AI like every other ITT section.
 *
 * Each class carries its own draft -> generated -> approved status. Where
 * "Save & Continue" approves the whole section (nextApproves), it stays locked
 * until every class has been generated and approved.
 */
export default function B2ClassEditor({
  section, classes, onChange, onNext, onSkip, onBack, readOnly = false, readOnlyNote,
  nextApproves = false,
}) {
  const [openClassId, setOpenClassId] = useState(classes[0]?.id ?? null)
  const [selected, setSelected] = useState(null)      // { classId, subId } | null
  const [editing, setEditing] = useState(null)        // { kind, classId, subId } | null
  const [confirmDelete, setConfirmDelete] = useState(null)

  useDismissable(!!confirmDelete, () => setConfirmDelete(null))

  const total = countSubclasses(classes)

  const activeClass = useMemo(
    () => classes.find(c => c.id === (selected?.classId ?? openClassId)) ?? null,
    [classes, selected, openClassId],
  )
  const activeSub = useMemo(
    () => (selected ? activeClass?.subclasses.find(s => s.id === selected.subId) ?? null : null),
    [activeClass, selected],
  )

  /* ── Mutations ── */
  const commit = (next) => { if (!readOnly) onChange(next) }

  const patchClass = (classId, patch) =>
    commit(classes.map(c => (c.id === classId ? { ...c, ...patch } : c)))

  // Any change to a class or its sub-classes invalidates the template that was
  // generated — and any approval of it. Every content mutation goes through
  // here so an approval can never outlive the text it approved.
  const touchClass = (classId, patch) => patchClass(classId, { ...patch, status: 'draft' })

  const patchSub = (classId, subId, patch) =>
    commit(classes.map(c => c.id !== classId ? c : {
      ...c, status: 'draft',
      subclasses: c.subclasses.map(s => (s.id === subId ? { ...s, ...patch } : s)),
    }))

  const addClass = () => {
    // Classes are numbered after the B1 clause they act on (1, 40, …), so the
    // number is picked from the B1 catalogue, never invented for the engineer.
    const cls = {
      id: newId('b2c'), code: '', title: 'New Clause Class',
      description: 'Describe what this family of special conditions covers.',
      subclasses: [], status: 'draft',
    }
    commit([...classes, cls])
    setOpenClassId(cls.id)
    setSelected(null)
    setEditing({ kind: 'class', classId: cls.id })
  }

  const addSubclass = (classId) => {
    const cls = classes.find(c => c.id === classId)
    if (!cls || !cls.code) return   // sub-class numbering hangs off the class number
    // The class code *is* the B1 clause the family acts on, so seed columns B/C
    // from it — the engineer only has to pick the sub-clause level below.
    const sub = newSubclass(`${cls.code}.${cls.subclasses.length + 1}`, {
      sourceClauseNo: b1ClauseTitle(cls.code) ? cls.code : '',
      sourceClauseTitle: b1ClauseTitle(cls.code),
    })
    commit(classes.map(c => (c.id === classId ? { ...c, status: 'draft', subclasses: [...c.subclasses, sub] } : c)))
    setOpenClassId(classId)
    setSelected({ classId, subId: sub.id })
    setEditing({ kind: 'sub', classId, subId: sub.id })
  }

  const deleteClass = (classId) => {
    commit(classes.filter(c => c.id !== classId))
    if (selected?.classId === classId) setSelected(null)
    if (openClassId === classId) setOpenClassId(null)
    setConfirmDelete(null)
  }

  const deleteSubclass = (classId, subId) => {
    commit(classes.map(c => c.id !== classId ? c
      : { ...c, status: 'draft', subclasses: c.subclasses.filter(s => s.id !== subId) }))
    if (selected?.subId === subId) setSelected(null)
    setConfirmDelete(null)
  }

  /*
   * Class-level draft: the same mock engine as the per-sub-class button, run
   * over every sub-class carrying a drafting instruction (column K). Rows with
   * no instruction are reported back as skipped rather than silently ignored.
   */
  const generateClass = (classId) => {
    const cls = classes.find(c => c.id === classId)
    if (!cls || readOnly) return { drafted: 0, skipped: [], generated: false }
    const skipped = []
    let drafted = 0
    const subclasses = cls.subclasses.map(s => {
      if (!(s.instruction || '').trim()) { skipped.push(s.code || s.title); return s }
      drafted += 1
      return { ...s, content: draftB2Clause(s) }
    })
    // Hand-written clause text counts as a template too; only a class with no
    // text at all stays in draft, since there would be nothing to review.
    const generated = subclasses.some(s => (s.content || '').trim())
    commit(classes.map(c => (c.id === classId
      ? { ...c, subclasses, status: generated ? 'generated' : 'draft' }
      : c)))
    return { drafted, skipped, generated }
  }

  const openClass = (classId) => {
    setOpenClassId(prev => (prev === classId ? null : classId))
    setSelected(null)
  }

  /*
   * Approving a class walks straight on to the next one still awaiting approval
   * (wrapping past the end), so "review & approve → next template" is one motion
   * instead of a hunt in the left list. When the last class is approved nothing
   * moves — the footer's Save & Continue unlocks and becomes the next action.
   */
  const approveClass = (classId) => {
    const next = classes.map(c => (c.id === classId ? { ...c, status: 'approved' } : c))
    commit(next)
    const i = next.findIndex(c => c.id === classId)
    const following = [...next.slice(i + 1), ...next.slice(0, i)]
    const pendingNext = following.find(c => classStatus(c) !== 'approved')
    if (pendingNext) { setOpenClassId(pendingNext.id); setSelected(null) }
  }

  // Section-level gate: nothing may be approved until every class is approved.
  const pending = classesPendingApproval(classes)
  const blocked = nextApproves && pending.length > 0

  return (
    <Card branded accent className="p-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
            <Layers size={16} style={{ color: '#0089cf' }} />
          </div>
          <h3 className="font-semibold" style={{ color: '#1b4c6f' }}>{section.title}</h3>
          {section.optional && <Chip>Optional</Chip>}
          {readOnly && <Chip>Read only</Chip>}
        </div>
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-50"
          style={{ color: '#0089cf' }}>
          <ChevronLeft size={13} /> Back
        </button>
      </div>

      {/* ── Summary strip ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 px-3.5 py-2.5 rounded-xl"
        style={{ background: 'rgba(0,137,207,0.04)', border: '1px solid rgba(0,137,207,0.15)' }}>
        <p className="text-[11px] leading-relaxed" style={{ color: '#1b4c6f' }}>
          <strong>{classes.length}</strong> clause class{classes.length === 1 ? '' : 'es'} ·{' '}
          <strong>{total}</strong> special condition{total === 1 ? '' : 's'} amending the B1 General Conditions.
          {' '}Pick a class to list its sub-classes, then a sub-class to open its clause text.
        </p>
        {!readOnly && (
          <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
            <Wand2 size={10} /> Select any text in the clause to edit it with AI
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-4">
        {/* ══════════ LEFT — class list ══════════ */}
        <div className="rounded-xl bg-white overflow-hidden lg:max-h-[58vh] lg:overflow-y-auto" style={{ border: '1px solid #cce6f8' }}>
          <div className="px-3 py-2.5 flex items-center justify-between sticky top-0 bg-white z-10" style={{ borderBottom: '1px solid #cce6f8' }}>
            <span className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#1b4c6f' }}>Clause Classes</span>
            {!readOnly && (
              <button onClick={addClass} title="Add a clause class"
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50"
                style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
                <Plus size={11} /> Class
              </button>
            )}
          </div>

          {classes.length === 0 && (
            <p className="px-3 py-8 text-center text-[11px] text-slate-400">
              No clause classes yet.{!readOnly && ' Add one to start drafting the special conditions.'}
            </p>
          )}

          {classes.map(cls => {
            const open = openClassId === cls.id
            return (
              <div key={cls.id} style={{ borderBottom: '1px solid #eef6fc' }}>
                {/* Class row */}
                <div className={`group flex items-start gap-1.5 px-2.5 py-2 cursor-pointer transition-colors ${open ? 'bg-[rgba(0,137,207,0.06)]' : 'hover:bg-slate-50'}`}
                  onClick={() => openClass(cls.id)}>
                  {open ? <ChevronDown size={13} className="mt-0.5 shrink-0 text-slate-400" />
                        : <ChevronRight size={13} className="mt-0.5 shrink-0 text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: '#1b4c6f' }}>
                      {cls.code ? `${cls.code}. ` : ''}{cls.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                      <StatusBadge cls={cls} />
                      <span className="text-[10px] text-slate-400 truncate">
                        {cls.subclasses.length} sub-class{cls.subclasses.length === 1 ? '' : 'es'}
                      </span>
                    </div>
                  </div>
                  {!readOnly && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                      <IconBtn title="Rename class" onClick={e => { e.stopPropagation(); setOpenClassId(cls.id); setSelected(null); setEditing({ kind: 'class', classId: cls.id }) }}><Pencil size={11} /></IconBtn>
                      <IconBtn title="Delete class" danger onClick={e => { e.stopPropagation(); setConfirmDelete({ kind: 'class', classId: cls.id, label: `${cls.code}. ${cls.title}` }) }}><Trash2 size={11} /></IconBtn>
                    </div>
                  )}
                </div>

                {/* Sub-class list */}
                {open && (
                  <div className="pb-1.5" style={{ background: 'rgba(236,244,252,0.35)' }}>
                    {cls.subclasses.map(sub => {
                      const active = selected?.subId === sub.id
                      return (
                        <div key={sub.id}
                          onClick={() => { setSelected({ classId: cls.id, subId: sub.id }); setEditing(null) }}
                          className={`group flex items-center gap-1.5 pl-7 pr-2.5 py-1.5 cursor-pointer transition-colors border-l-2
                            ${active ? 'bg-white border-l-[#0089cf]' : 'border-l-transparent hover:bg-white/70'}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11.5px] leading-tight truncate ${active ? 'font-semibold' : ''}`} style={{ color: active ? '#0089cf' : '#475569' }}>
                              {sub.code} {sub.title}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                              <ActionBadge action={sub.actionType} />
                              <span className="text-[9.5px] text-slate-400 truncate">
                                {sourceRefLabel(sub) || 'No source clause'}
                              </span>
                            </div>
                          </div>
                          {!readOnly && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <IconBtn title="Edit drafting row" onClick={e => { e.stopPropagation(); setSelected({ classId: cls.id, subId: sub.id }); setEditing({ kind: 'sub', classId: cls.id, subId: sub.id }) }}><Pencil size={10} /></IconBtn>
                              <IconBtn title="Delete sub-class" danger onClick={e => { e.stopPropagation(); setConfirmDelete({ kind: 'sub', classId: cls.id, subId: sub.id, label: `${sub.code} ${sub.title}` }) }}><Trash2 size={10} /></IconBtn>
                            </div>
                          )}
                        </div>
                      )
                    })}
                    {cls.subclasses.length === 0 && (
                      <p className="pl-7 pr-2.5 py-2 text-[10.5px] text-slate-400">No sub-classes in this class yet.</p>
                    )}
                    {!readOnly && (
                      <button onClick={() => addSubclass(cls.id)} disabled={!cls.code}
                        title={cls.code ? 'Add a sub-class' : 'Pick a clause number for this class first'}
                        className="ml-7 mt-1 flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent"
                        style={{ color: '#0089cf' }}>
                        <Plus size={11} /> Add sub-class
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* ══════════ RIGHT — the data ══════════ */}
        <div className="rounded-xl bg-white lg:max-h-[58vh] lg:overflow-y-auto" style={{ border: '1px solid #cce6f8' }}>
          {!activeClass ? (
            <Empty icon={Layers} title="Select a clause class"
              body="Pick a class on the left to see the special conditions it contains." />
          ) : editing?.kind === 'class' ? (
            /* keyed so switching between classes remounts the form with fresh values */
            <ClassForm key={activeClass.id} cls={activeClass} onCancel={() => setEditing(null)}
              takenCodes={classes.filter(c => c.id !== activeClass.id).map(c => c.code).filter(Boolean)}
              onSave={patch => { touchClass(activeClass.id, patch); setEditing(null) }} />
          ) : editing?.kind === 'sub' && activeSub ? (
            <SubForm key={activeSub.id} sub={activeSub} onCancel={() => setEditing(null)}
              onSave={patch => { patchSub(activeClass.id, activeSub.id, patch); setEditing(null) }} />
          ) : activeSub ? (
            <SubDetail
              cls={activeClass} sub={activeSub} readOnly={readOnly}
              onEdit={() => setEditing({ kind: 'sub', classId: activeClass.id, subId: activeSub.id })}
              onDelete={() => setConfirmDelete({ kind: 'sub', classId: activeClass.id, subId: activeSub.id, label: `${activeSub.code} ${activeSub.title}` })}
              onContentChange={val => patchSub(activeClass.id, activeSub.id, { content: val })}
              onBackToClass={() => setSelected(null)}
            />
          ) : (
            /* keyed so the generate/review state never carries across classes */
            <ClassDetail
              key={activeClass.id} cls={activeClass} readOnly={readOnly}
              onOpenSub={subId => setSelected({ classId: activeClass.id, subId })}
              onAddSub={() => addSubclass(activeClass.id)}
              onEdit={() => setEditing({ kind: 'class', classId: activeClass.id })}
              onDelete={() => setConfirmDelete({ kind: 'class', classId: activeClass.id, label: `${activeClass.code ? `${activeClass.code}. ` : ''}${activeClass.title}` })}
              onGenerate={() => generateClass(activeClass.id)}
              onApprove={() => approveClass(activeClass.id)}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-5 pt-4 gap-3 flex-wrap" style={{ borderTop: '1px solid rgba(0,137,207,0.1)' }}>
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          {total} special condition{total === 1 ? '' : 's'} across {classes.length} class{classes.length === 1 ? '' : 'es'}
        </p>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          {readOnly ? (
            <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg" style={{ color: '#64748b', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)' }}>
              {readOnlyNote || 'Read-only — owned by another role'}
            </span>
          ) : (
            <>
              {blocked && (
                <span className="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
                  style={{ color: '#b45309', background: 'rgba(245,158,11,0.10)', border: '1px solid rgba(245,158,11,0.30)' }}>
                  <AlertTriangle size={12} />
                  {pending.length} class{pending.length === 1 ? '' : 'es'} still to generate &amp; approve
                  <span className="hidden md:inline text-[10.5px] font-normal">
                    ({pending.map(c => c.code || c.title).join(', ')})
                  </span>
                </span>
              )}
              {nextApproves && !blocked && classes.length > 0 && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg"
                  style={{ color: '#047857', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
                  <Check size={12} /> Every clause class approved
                </span>
              )}
              {onSkip && (
                <Button variant="secondary" onClick={onSkip} className="flex items-center gap-1.5">
                  Skip (optional) <ChevronRight size={14} />
                </Button>
              )}
              <Button variant="brand" onClick={onNext} disabled={blocked} className="flex items-center gap-2"
                title={blocked ? 'Every clause class must be generated and approved first' : undefined}>
                Save &amp; Continue <ChevronRight size={15} />
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Delete confirmation ── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 px-4" onClick={() => setConfirmDelete(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #eef6fc' }}>
              <AlertTriangle size={15} className="text-red-500" />
              <p className="text-sm font-semibold text-slate-800">
                Delete {confirmDelete.kind === 'class' ? 'clause class' : 'sub-class'}?
              </p>
            </div>
            <div className="px-4 py-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                <strong className="text-slate-700">{confirmDelete.label}</strong> will be removed from Section B2
                {confirmDelete.kind === 'class' ? ', along with every sub-class it contains' : ''}. This cannot be undone.
              </p>
            </div>
            <div className="px-4 py-3 flex items-center justify-end gap-2" style={{ borderTop: '1px solid #eef6fc' }}>
              <button onClick={() => setConfirmDelete(null)} className="text-xs font-medium text-slate-500 px-3 py-1.5 hover:text-slate-700">Cancel</button>
              <button
                onClick={() => confirmDelete.kind === 'class'
                  ? deleteClass(confirmDelete.classId)
                  : deleteSubclass(confirmDelete.classId, confirmDelete.subId)}
                className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 transition-colors">
                <Trash2 size={12} /> Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}

/* ────────────────────────── Right-hand panels ────────────────────────── */

/*
 * The class's own data plus its template. The template is rendered as the actual
 * Section B2 document — clause numbering, titles and the full drafted clause
 * text — laid out like every other ITT section (SectionFillStep), not as a
 * status card with a truncated preview. It is built from b2ClassDocument(), the
 * same derivation renderB2Text() exports from.
 */
function ClassDetail({ cls, readOnly, onOpenSub, onAddSub, onEdit, onDelete, onGenerate, onApprove }) {
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState(null)      // last generate run: { drafted, skipped, generated }

  const status = classStatus(cls)
  const empty = cls.subclasses.length === 0
  const doc = b2ClassDocument(cls)

  // Mock AI draft — same delayed-callback idiom as the per-sub-class button.
  const generate = () => {
    if (empty || busy) return
    setBusy(true)
    setTimeout(() => {
      setResult(onGenerate())
      setBusy(false)
    }, 700)
  }

  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Clause Class{cls.code ? ` ${cls.code}` : ''}
            </p>
            <StatusBadge cls={cls} />
          </div>
          <h4 className="text-base font-semibold mt-0.5" style={{ color: '#1b4c6f' }}>{cls.title}</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{cls.description}</p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit}
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50"
              style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
              <Pencil size={11} /> Edit
            </button>
            <button onClick={onDelete} title="Delete clause class"
              className="flex items-center justify-center w-[26px] h-[26px] rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}>
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* ── Template lifecycle strip: generate → review the document → approve ── */}
      <div className="mt-4 rounded-xl px-3.5 py-2.5 flex items-start justify-between gap-3 flex-wrap"
        style={status === 'approved'
          ? { background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.28)' }
          : { background: 'rgba(0,137,207,0.04)', border: '1px solid rgba(0,137,207,0.2)' }}>
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: status === 'approved' ? '#047857' : '#1b4c6f' }}>
            Clause template
          </p>
          <p className="text-[11px] leading-relaxed mt-1" style={{ color: status === 'approved' ? '#047857' : '#475569' }}>
            {empty
              ? 'Nothing to generate — this class has no sub-classes. Add one, or delete the class; an empty class blocks Section B2 from being approved.'
              : readOnly
                ? 'The Section B2 document for this clause class.'
                : status === 'draft'
                  ? 'Generate the clause text for every sub-class, then read the document below and approve it. Section B2 cannot be approved until this class is approved.'
                  : status === 'generated'
                    ? 'Read the drafted document below and approve it to clear this class — you will be taken straight to the next class.'
                    : 'Template reviewed and approved. Editing this class or any of its sub-classes will return it to draft.'}
          </p>
          {/* Skipped rows are reported, never silently dropped. */}
          {result && !busy && (
            <p className="text-[10.5px] mt-1.5 leading-relaxed" style={{ color: result.skipped.length ? '#b45309' : '#047857' }}>
              {result.drafted} sub-class{result.drafted === 1 ? '' : 'es'} drafted
              {result.skipped.length > 0 && ` · skipped ${result.skipped.join(', ')} — no drafting instruction`}
              {!result.generated && ' · nothing to read yet — add a drafting instruction or write the clause text'}
            </p>
          )}
        </div>
        {!readOnly && !empty && (
          <button onClick={generate} disabled={busy}
            title={status === 'draft' ? 'Draft every sub-class from its instruction' : 'Re-draft — this withdraws the current approval'}
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white disabled:opacity-40 shrink-0"
            style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
            {busy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            {busy ? 'Generating…' : status === 'draft' ? 'Generate Template' : 'Regenerate'}
          </button>
        )}
      </div>

      {/* ── The Section B2 document itself ── */}
      {empty ? (
        <div className="mt-4 rounded-xl px-6 py-10 text-center bg-white" style={{ border: '1px solid #cce6f8' }}>
          <p className="text-xs text-slate-400">
            No sub-classes yet.{!readOnly && ' Add one to draft a special condition under this class.'}
          </p>
          {!readOnly && (
            <button onClick={onAddSub} disabled={!cls.code}
              title={cls.code ? 'Add a sub-class' : 'Pick a clause number for this class first'}
              className="mx-auto mt-3 flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
              style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
              <Plus size={11} /> Add the first sub-class
            </button>
          )}
        </div>
      ) : (
        <div className="mt-4 rounded-xl bg-white" style={{ border: '1px solid #cce6f8' }}>
          <div className="px-5 py-5 sm:px-7 text-[13px] leading-6 text-slate-700">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Section B2 — Special Conditions of Contract
            </p>
            <p className="font-semibold tracking-wide text-[14px] mt-1" style={{ color: '#1b4c6f' }}>
              {doc.heading}
            </p>

            {doc.entries.map((entry, i) => (
              <div key={entry.id} className={i === 0 ? 'mt-5' : 'mt-5 pt-5'}
                style={i === 0 ? undefined : { borderTop: '1px solid #eef6fc' }}>
                <div className="group flex items-start justify-between gap-2">
                  <p className="font-semibold" style={{ color: '#1b4c6f' }}>{entry.heading}</p>
                  {!readOnly && (
                    <button onClick={() => onOpenSub(entry.id)} title="Open this drafting row"
                      className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:bg-slate-50"
                      style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
                      <Pencil size={10} /> Open
                    </button>
                  )}
                </div>
                {entry.tags && (
                  <p className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                    <Link2 size={9} className="shrink-0" /> {entry.tags}
                  </p>
                )}
                {entry.text
                  ? <p className="whitespace-pre-wrap mt-2">{entry.text}</p>
                  : <p className="mt-2 text-[12px] italic text-slate-400">No clause text drafted for this sub-class yet.</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Document actions ── */}
      {!readOnly && (
        <div className="mt-4 pt-4 flex items-center justify-between gap-2 flex-wrap" style={{ borderTop: '1px solid #eef6fc' }}>
          <button onClick={onAddSub} disabled={!cls.code}
            title={cls.code ? 'Add a sub-class' : 'Pick a clause number for this class first'}
            className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
            style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
            <Plus size={11} /> Add sub-class
          </button>
          {status === 'generated' && (
            <button onClick={onApprove}
              className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg transition-opacity hover:opacity-90"
              style={{ background: '#0089cf' }}>
              <Check size={12} /> Approve &amp; Next Template
            </button>
          )}
          {status === 'approved' && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-lg"
              style={{ color: '#047857', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)' }}>
              <Check size={12} /> Approved
            </span>
          )}
        </div>
      )}
    </div>
  )
}

// A single drafting row: the spreadsheet metadata plus the AI-editable clause text.
function SubDetail({ cls, sub, readOnly, onEdit, onDelete, onContentChange, onBackToClass }) {
  const [genBusy, setGenBusy] = useState(false)
  const canGenerate = !!sub.instruction?.trim()

  // Mock AI draft — same delayed-callback idiom the select-to-edit popup uses.
  const generate = () => {
    if (!canGenerate) return
    setGenBusy(true)
    setTimeout(() => { onContentChange(draftB2Clause(sub)); setGenBusy(false) }, 700)
  }

  const subLevels = [sub.sourceLevel1, sub.sourceLevel2, sub.sourceLevel3].filter(Boolean).join(' › ')

  return (
    <div className="p-5">
      <button onClick={onBackToClass}
        className="flex items-center gap-1 text-[10.5px] font-semibold mb-3 transition-colors hover:underline underline-offset-2"
        style={{ color: '#0089cf' }}>
        <ChevronLeft size={11} /> {cls.code}. {cls.title}
      </button>

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-mono font-bold" style={{ color: '#0089cf' }}>{sub.code}</span>
            <h4 className="text-base font-semibold" style={{ color: '#1b4c6f' }}>{sub.title}</h4>
            <ActionBadge action={sub.actionType} />
          </div>
          {sourceRefLabel(sub) && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400 mt-1.5">
              <Link2 size={10} /> Acts on {sourceRefLabel(sub)}
            </span>
          )}
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} title="Edit drafting row"
              className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50"
              style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
              <Pencil size={11} /> Edit
            </button>
            <button onClick={onDelete} title="Delete sub-class"
              className="flex items-center justify-center w-[26px] h-[26px] rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              style={{ border: '1px solid #e2e8f0' }}>
              <Trash2 size={11} />
            </button>
          </div>
        )}
      </div>

      {/* Columns B-K of the drafting row */}
      <div className="mt-4 rounded-xl px-3.5 py-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5"
        style={{ background: 'rgba(236,244,252,0.5)', border: '1px solid #e2eefb' }}>
        <Meta label="Source clause" value={sub.sourceClauseNo && `${sub.sourceClauseNo} — ${sub.sourceClauseTitle || '—'}`} />
        <Meta label="Source sub-clause" value={subLevels && `${subLevels}${sub.sourceSubclauseTitle ? ` — ${sub.sourceSubclauseTitle}` : ''}`} />
        <Meta label="Type of action" value={sub.actionType && actionLabel(sub.actionType)} />
        <Meta label="Action object" value={sub.actionObject} />
        <Meta label="Source / evidence" value={sub.evidenceSource} />
        <Meta label="Evidence document" value={sub.evidenceFile} />
        <div className="sm:col-span-2">
          <Meta label="Drafting instruction to AI" value={sub.instruction} />
        </div>
      </div>

      {/* Generated clause text — select-to-edit-with-AI */}
      <div className="mt-4">
        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Generated clause / sub-clause text</p>
          {!readOnly && (
            <div className="flex items-center gap-2">
              <span className="hidden sm:flex items-center gap-1 text-[10px] text-slate-400">
                <Wand2 size={10} /> Select any text to edit it with AI
              </span>
              <button onClick={generate} disabled={!canGenerate || genBusy}
                title={canGenerate ? 'Draft this clause from the instruction' : 'Add a drafting instruction first'}
                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent"
                style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
                {genBusy ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                {genBusy ? 'Drafting…' : 'Generate with AI'}
              </button>
            </div>
          )}
        </div>
        {readOnly ? (
          <div className="whitespace-pre-wrap text-[12.5px] leading-6 text-slate-700 rounded-lg px-3 py-2.5"
            style={{ background: 'rgba(236,244,252,0.5)', border: '1px solid #e2eefb' }}>
            {sub.content?.trim() || '— No clause text drafted.'}
          </div>
        ) : (
          <AiEditableField
            as="textarea"
            value={sub.content}
            onChange={onContentChange}
            rows={12}
            placeholder="Draft the special condition — or write a drafting instruction above and press Generate with AI…"
            className="w-full px-3 py-2.5 text-[12.5px] leading-6 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30"
            style={{ border: '1px solid #cce6f8', color: '#334155' }}
          />
        )}
      </div>
    </div>
  )
}

/* ────────────────────────── Add / edit forms ────────────────────────── */

/*
 * The class number is the B1 clause the family acts on, so it is picked from
 * the same catalogue as the sub-class rows rather than typed. Numbers already
 * used by another class are dropped from the list — two class 40s would collide
 * on sub-class numbering and on export.
 */
function ClassForm({ cls, takenCodes = [], onSave, onCancel }) {
  const inCatalogue = (no) => B1_CLAUSE_CATALOGUE.some(c => c.no === no)
  const [code, setCode] = useState(cls.code || '')
  const [customCode, setCustomCode] = useState(() => !!cls.code && !inCatalogue(cls.code))
  const [title, setTitle] = useState(cls.title || '')
  const [description, setDescription] = useState(cls.description || '')

  const taken = new Set(takenCodes)
  const options = B1_CLAUSE_CATALOGUE
    .filter(c => !taken.has(c.no))
    .map(c => ({ value: c.no, label: `${c.no} — ${c.title}` }))

  const pickCode = (value) => {
    if (value === ADD_NEW_CLAUSE) { setCustomCode(true); setCode(''); return }
    setCustomCode(false)
    setCode(value)
    // Column C of the sheet — the title is linked from the clause no., but the
    // engineer can still reword it, so this is a starting point, not a lock.
    const linked = b1ClauseTitle(value)
    if (linked) setTitle(linked)
  }

  const trimmed = code.trim()
  const duplicate = !!trimmed && taken.has(trimmed)

  return (
    <FormShell title="Edit clause class" onCancel={onCancel}
      onSave={() => onSave({ code: trimmed, title: title.trim() || cls.title, description: description.trim() })}
      canSave={!!trimmed && !duplicate && !!title.trim()}>
      {customCode ? (
        <Field label="Class number (new)" value={code} onChange={setCode} placeholder="e.g. 42" width="w-40"
          hint={duplicate ? 'Another class already uses this number.' : 'Not in the B1 catalogue — type the clause number.'} />
      ) : (
        <Select label="Class number" value={code} onChange={pickCode} options={options}
          extra={ADD_NEW_CLAUSE} placeholder="Select the B1 clause this class amends" />
      )}
      <Field label="Class title" value={title} onChange={setTitle} placeholder="e.g. Contract Price & Payment"
        hint={!customCode && !!trimmed ? 'Linked from the class number — edit it if the class covers something narrower.' : undefined} />
      <Field label="What this class covers" value={description} onChange={setDescription} multiline
        placeholder="A short description shown when the class is opened…" />
    </FormShell>
  )
}

/*
 * The full B2 drafting row (columns A-K). Columns C and G auto-link from the
 * numbers chosen in B and D/E/F; picking "Add New …" swaps the drop list for a
 * free-text number, because the catalogue cannot cover every General
 * Conditions tier.
 */
function SubForm({ sub, onSave, onCancel }) {
  const [f, setF] = useState(() => ({ ...sub }))
  const set = (patch) => setF(prev => ({ ...prev, ...patch }))

  const inCatalogue = (no) => B1_CLAUSE_CATALOGUE.some(c => c.no === no)
  const [customClause, setCustomClause] = useState(() => !!sub.sourceClauseNo && !inCatalogue(sub.sourceClauseNo))
  const [customLvl, setCustomLvl] = useState(() => ({
    1: !!sub.sourceLevel1 && !b1SubclauseOptions(sub.sourceClauseNo, null, null, 1).some(o => o.no === sub.sourceLevel1),
    2: !!sub.sourceLevel2 && !b1SubclauseOptions(sub.sourceClauseNo, sub.sourceLevel1, null, 2).some(o => o.no === sub.sourceLevel2),
    3: !!sub.sourceLevel3 && !b1SubclauseOptions(sub.sourceClauseNo, sub.sourceLevel1, sub.sourceLevel2, 3).some(o => o.no === sub.sourceLevel3),
  }))

  const clearLevels = { sourceLevel1: '', sourceLevel2: '', sourceLevel3: '', sourceSubclauseTitle: '' }

  const pickClause = (value) => {
    if (value === ADD_NEW_CLAUSE) {
      setCustomClause(true)
      setCustomLvl({ 1: false, 2: false, 3: false })
      set({ sourceClauseNo: '', sourceClauseTitle: '', ...clearLevels })
      return
    }
    setCustomClause(false)
    setCustomLvl({ 1: false, 2: false, 3: false })
    set({ sourceClauseNo: value, sourceClauseTitle: b1ClauseTitle(value), ...clearLevels })
  }

  // Selecting a level clears the deeper ones — their options hang off it.
  const pickLevel = (level, value) => {
    const key = `sourceLevel${level}`
    const deeper = level === 1 ? { sourceLevel2: '', sourceLevel3: '' } : level === 2 ? { sourceLevel3: '' } : {}
    if (value === ADD_NEW_SUBCLAUSE) {
      setCustomLvl(prev => ({ ...prev, [level]: true }))
      set({ [key]: '', ...deeper, sourceSubclauseTitle: '' })
      return
    }
    setCustomLvl(prev => ({ ...prev, [level]: false }))
    const next = { ...f, [key]: value, ...deeper }
    set({
      [key]: value, ...deeper,
      sourceSubclauseTitle: b1SubclauseTitle(next.sourceClauseNo, next.sourceLevel1, next.sourceLevel2, next.sourceLevel3),
    })
  }

  const lvl1 = b1SubclauseOptions(f.sourceClauseNo, null, null, 1)
  const lvl2 = b1SubclauseOptions(f.sourceClauseNo, f.sourceLevel1, null, 2)
  const lvl3 = b1SubclauseOptions(f.sourceClauseNo, f.sourceLevel1, f.sourceLevel2, 3)
  const clauseTitleAuto = !customClause && !!f.sourceClauseNo
  const subTitleAuto = !!f.sourceLevel1 && !customLvl[1] && !customLvl[2] && !customLvl[3]

  return (
    <FormShell title="Edit drafting row" onCancel={onCancel}
      onSave={() => onSave({
        ...f,
        code: f.code.trim() || sub.code,
        title: f.title.trim() || sub.title,
        instruction: (f.instruction || '').trim(),
      })}
      canSave={!!f.title.trim()}>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Target B2 clause no." value={f.code} onChange={v => set({ code: v })} placeholder="e.g. 40.1" />
        <Field label="Clause title" value={f.title} onChange={v => set({ title: v })} placeholder="e.g. Delay in Mobilization" />
      </div>

      {/* Columns B-C */}
      <div className="grid grid-cols-2 gap-3">
        {customClause ? (
          <Field label="Source clause no. (new)" value={f.sourceClauseNo}
            onChange={v => set({ sourceClauseNo: v })} placeholder="e.g. 42" />
        ) : (
          <Select label="Source clause no." value={f.sourceClauseNo} onChange={pickClause}
            options={B1_CLAUSE_CATALOGUE.map(c => ({ value: c.no, label: `${c.no} — ${c.title}` }))}
            extra={ADD_NEW_CLAUSE} placeholder="Select a B1 clause" />
        )}
        <Field label="Source clause title" value={f.sourceClauseTitle}
          onChange={v => set({ sourceClauseTitle: v })} readOnly={clauseTitleAuto}
          hint={clauseTitleAuto ? 'Auto-linked from the clause no.' : undefined}
          placeholder="Title of the source clause" />
      </div>

      {/* Columns D-F — one merged "Source Sub-clause" group, three optional levels */}
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">
          Source sub-clause <span className="font-medium normal-case tracking-normal text-slate-300">(optional — level 1 to 3)</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3].map(level => {
            const opts = level === 1 ? lvl1 : level === 2 ? lvl2 : lvl3
            const value = f[`sourceLevel${level}`]
            const parentPicked = level === 1 ? !!f.sourceClauseNo : !!f[`sourceLevel${level - 1}`]
            return customLvl[level] ? (
              <Field key={level} label={`Level ${level} (new)`} value={value}
                onChange={v => set({ [`sourceLevel${level}`]: v })} placeholder="e.g. 40.5" />
            ) : (
              <Select key={level} label={`Level ${level}`} value={value}
                onChange={v => pickLevel(level, v)} disabled={!parentPicked}
                options={opts.map(o => ({ value: o.no, label: `${o.no} — ${o.title}` }))}
                extra={parentPicked ? ADD_NEW_SUBCLAUSE : null} placeholder="—" />
            )
          })}
        </div>
      </div>

      {/* Column G */}
      <Field label="Source sub-clause title" value={f.sourceSubclauseTitle}
        onChange={v => set({ sourceSubclauseTitle: v })} readOnly={subTitleAuto}
        hint={subTitleAuto ? 'Auto-linked from the sub-clause no.' : undefined}
        placeholder="Title of the source sub-clause" />

      {/* Columns H-I */}
      <div className="grid grid-cols-2 gap-3">
        <Select label="Type of action" value={f.actionType} onChange={v => set({ actionType: v })}
          options={B2_ACTION_TYPES.map(a => ({ value: a, label: actionLabel(a) }))} placeholder="Select an action" />
        <Select label="Action object" value={f.actionObject} onChange={v => set({ actionObject: v })}
          options={B2_ACTION_OBJECTS.map(o => ({ value: o, label: o }))} placeholder="Select an object" />
      </div>

      {/* Column J — controlled list plus the evidence document itself */}
      <div>
        <Select label="Source / evidence for drafting" value={f.evidenceSource}
          onChange={v => set({ evidenceSource: v })}
          options={B2_EVIDENCE_SOURCES.map(o => ({ value: o, label: o }))} placeholder="Select an evidence source" />
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {/* No upload backend — only the chosen file's name is kept on the row. */}
          <label className="inline-flex">
            <input type="file" className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg"
              onChange={e => { const file = e.target.files?.[0]; if (file) set({ evidenceFile: file.name }); e.target.value = '' }} />
            <span className="inline-flex items-center gap-1 cursor-pointer text-[10.5px] font-semibold px-2.5 py-1 rounded-lg transition-colors hover:bg-slate-50"
              style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
              <Upload size={11} /> {f.evidenceFile ? 'Replace document' : 'Upload evidence'}
            </span>
          </label>
          {f.evidenceFile && (
            <span className="inline-flex items-center gap-1.5 text-[10.5px] text-slate-500 px-2 py-1 rounded-lg"
              style={{ background: 'rgba(236,244,252,0.7)', border: '1px solid #e2eefb' }}>
              {f.evidenceFile}
              <button onClick={() => set({ evidenceFile: '' })} className="text-slate-400 hover:text-red-500" title="Remove document">
                <X size={10} />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Column K */}
      <Field label="Drafting instruction to AI" value={f.instruction} onChange={v => set({ instruction: v })} multiline
        hint="What the AI should draft — the generated clause text is produced from this and the evidence above."
        placeholder="e.g. Replace the sub-clause with a 1% per day liquidated damages rate capped at 10% of the CALL-OFF VALUE…" />
    </FormShell>
  )
}

function FormShell({ title, children, onSave, onCancel, canSave }) {
  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold" style={{ color: '#1b4c6f' }}>{title}</h4>
        <button onClick={onCancel} className="text-slate-400 hover:text-slate-600"><X size={15} /></button>
      </div>
      <div className="space-y-3.5">{children}</div>
      <div className="flex items-center justify-end gap-2 mt-5 pt-4" style={{ borderTop: '1px solid #eef6fc' }}>
        <button onClick={onCancel} className="text-xs font-medium text-slate-500 px-3 py-1.5 hover:text-slate-700">Cancel</button>
        <button onClick={onSave} disabled={!canSave}
          className="flex items-center gap-1.5 text-xs font-semibold text-white px-3.5 py-1.5 rounded-lg disabled:opacity-40 transition-opacity"
          style={{ background: '#0089cf' }}>
          <Check size={12} /> Save
        </button>
      </div>
    </div>
  )
}

function Field({ label, value, onChange, placeholder, multiline = false, width = 'w-full', readOnly = false, hint }) {
  const cls = `${width} px-3 py-2 text-[12.5px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30`
  const style = { border: '1px solid #cce6f8', color: '#334155', ...(readOnly ? { background: 'rgba(236,244,252,0.6)', color: '#64748b' } : null) }
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value || ''} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} readOnly={readOnly} className={`${cls} resize-y`} style={style} />
        : <input value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} readOnly={readOnly} className={cls} style={style} />}
      {hint && <p className="text-[9.5px] text-slate-400 mt-1">{hint}</p>}
    </div>
  )
}

function Select({ label, value, onChange, options, extra, placeholder, disabled = false }) {
  return (
    <div className="min-w-0">
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
      <select value={value || ''} onChange={e => onChange(e.target.value)} disabled={disabled}
        className="w-full px-2.5 py-2 text-[12.5px] rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30 disabled:opacity-50"
        style={{ border: '1px solid #cce6f8', color: value ? '#334155' : '#94a3b8' }}>
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        {extra && <option value={extra}>+ {extra}</option>}
      </select>
    </div>
  )
}

/* ────────────────────────── Small shared bits ────────────────────────── */

const ACTION_STYLE = {
  ADD:                { bg: 'rgba(16,185,129,0.10)', fg: '#047857', bd: 'rgba(16,185,129,0.25)' },
  AMEND:              { bg: 'rgba(245,158,11,0.12)', fg: '#b45309', bd: 'rgba(245,158,11,0.30)' },
  DELETE:             { bg: 'rgba(239,68,68,0.10)',  fg: '#b91c1c', bd: 'rgba(239,68,68,0.25)' },
  DELETE_AND_REPLACE: { bg: 'rgba(139,92,246,0.10)', fg: '#6d28d9', bd: 'rgba(139,92,246,0.25)' },
  RENUMBER:           { bg: 'rgba(0,137,207,0.10)',  fg: '#0b6a9c', bd: 'rgba(0,137,207,0.25)' },
}

// The sheet's DELETE_AND_REPLACE is too wide for a badge; everything else reads as-is.
const actionLabel = (action) => (action === 'DELETE_AND_REPLACE' ? 'DELETE & REPLACE' : action)

function ActionBadge({ action }) {
  if (!action) return null
  const s = ACTION_STYLE[action] || ACTION_STYLE.AMEND
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap"
      style={{ color: s.fg, background: s.bg, border: `1px solid ${s.bd}` }}>
      {actionLabel(action)}
    </span>
  )
}

const STATUS_STYLE = {
  draft:     { label: 'Draft',     bg: 'rgba(100,116,139,0.10)', fg: '#475569', bd: 'rgba(100,116,139,0.25)' },
  generated: { label: 'Generated', bg: 'rgba(0,137,207,0.10)',   fg: '#0b6a9c', bd: 'rgba(0,137,207,0.28)' },
  approved:  { label: 'Approved',  bg: 'rgba(16,185,129,0.10)',  fg: '#047857', bd: 'rgba(16,185,129,0.28)' },
  empty:     { label: 'Empty',     bg: 'rgba(245,158,11,0.12)',  fg: '#b45309', bd: 'rgba(245,158,11,0.30)' },
}

// A class with no sub-classes has nothing to generate, so it reads as "Empty"
// rather than "Draft" — the action it needs is different.
function StatusBadge({ cls }) {
  const status = classStatus(cls)
  const s = STATUS_STYLE[status === 'approved' || cls.subclasses.length ? status : 'empty']
  return (
    <span className="text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded shrink-0 whitespace-nowrap"
      style={{ color: s.fg, background: s.bg, border: `1px solid ${s.bd}` }}>
      {s.label}
    </span>
  )
}

function Meta({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="text-[11.5px] leading-relaxed text-slate-600 break-words">{value || '—'}</p>
    </div>
  )
}

function Chip({ children }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
      style={{ color: '#64748b', background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.2)' }}>
      {children}
    </span>
  )
}

function IconBtn({ children, onClick, title, danger = false }) {
  return (
    <button onClick={onClick} title={title}
      className={`flex items-center justify-center w-5 h-5 rounded transition-colors ${danger ? 'text-slate-400 hover:text-red-500 hover:bg-red-50' : 'text-slate-400 hover:text-[#0089cf] hover:bg-white'}`}>
      {children}
    </button>
  )
}

function Empty({ icon: Icon, title, body }) {
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-16">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.08)' }}>
        <Icon size={20} style={{ color: '#0089cf' }} />
      </div>
      <p className="text-sm font-semibold mt-3" style={{ color: '#1b4c6f' }}>{title}</p>
      <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">{body}</p>
    </div>
  )
}
