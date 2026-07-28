import { useState, useMemo } from 'react'
import {
  ChevronLeft, ChevronRight, ChevronDown, Plus, Pencil, Trash2,
  Layers, Wand2, X, Check, AlertTriangle, Link2,
} from 'lucide-react'
import Card from '../ui/Card'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import AiEditableField from '../ui/AiEditableField'
import { useDismissable } from '../../context/NavigationContext'
import {
  B2_DEVIATIONS, B2_DEVIATION_ORDER, newId, countSubclasses, countDeviations,
} from './b2Classes'

/*
 * Section B2 — Special Conditions of Contract.
 *
 * Classes on the left; picking one lists its sub-classes; picking a sub-class
 * opens its data on the right, where the clause text is select-to-edit-with-AI
 * like every other ITT section. Classes and sub-classes can be added, renamed
 * and deleted.
 */
export default function B2ClassEditor({
  section, classes, onChange, onNext, onSkip, onBack, readOnly = false, readOnlyNote,
}) {
  const [openClassId, setOpenClassId] = useState(classes[0]?.id ?? null)
  const [selected, setSelected] = useState(null)      // { classId, subId } | null
  const [editing, setEditing] = useState(null)        // { kind, classId, subId } | null
  const [confirmDelete, setConfirmDelete] = useState(null)

  useDismissable(!!confirmDelete, () => setConfirmDelete(null))

  const total = countSubclasses(classes)
  const deviations = countDeviations(classes)

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

  const patchSub = (classId, subId, patch) =>
    commit(classes.map(c => c.id !== classId ? c : {
      ...c, subclasses: c.subclasses.map(s => (s.id === subId ? { ...s, ...patch } : s)),
    }))

  const addClass = () => {
    const code = String(classes.length + 1)
    const cls = {
      id: newId('b2c'), code, title: 'New Clause Class',
      description: 'Describe what this family of special conditions covers.',
      subclasses: [],
    }
    commit([...classes, cls])
    setOpenClassId(cls.id)
    setSelected(null)
    setEditing({ kind: 'class', classId: cls.id })
  }

  const addSubclass = (classId) => {
    const cls = classes.find(c => c.id === classId)
    if (!cls) return
    const sub = {
      id: newId('b2s'),
      code: `${cls.code}.${cls.subclasses.length + 1}`,
      title: 'New Special Condition',
      b1Ref: '',
      deviation: 'amended',
      content: '',
    }
    commit(classes.map(c => (c.id === classId ? { ...c, subclasses: [...c.subclasses, sub] } : c)))
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
    commit(classes.map(c => c.id !== classId ? c : { ...c, subclasses: c.subclasses.filter(s => s.id !== subId) }))
    if (selected?.subId === subId) setSelected(null)
    setConfirmDelete(null)
  }

  const openClass = (classId) => {
    setOpenClassId(prev => (prev === classId ? null : classId))
    setSelected(null)
  }

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
          <strong>{total}</strong> special condition{total === 1 ? '' : 's'} ·{' '}
          <strong>{deviations}</strong> deviating from the B1 General Conditions.
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
            const devs = cls.subclasses.filter(s => s.deviation !== 'as_b1').length
            return (
              <div key={cls.id} style={{ borderBottom: '1px solid #eef6fc' }}>
                {/* Class row */}
                <div className={`group flex items-start gap-1.5 px-2.5 py-2 cursor-pointer transition-colors ${open ? 'bg-[rgba(0,137,207,0.06)]' : 'hover:bg-slate-50'}`}
                  onClick={() => openClass(cls.id)}>
                  {open ? <ChevronDown size={13} className="mt-0.5 shrink-0 text-slate-400" />
                        : <ChevronRight size={13} className="mt-0.5 shrink-0 text-slate-400" />}
                  <div className="min-w-0 flex-1">
                    <p className="text-[12px] font-semibold leading-tight truncate" style={{ color: '#1b4c6f' }}>
                      {cls.code}. {cls.title}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {cls.subclasses.length} sub-class{cls.subclasses.length === 1 ? '' : 'es'}
                      {devs > 0 && <span className="text-amber-600"> · {devs} deviating</span>}
                    </p>
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
                      const dev = B2_DEVIATIONS[sub.deviation] || B2_DEVIATIONS.amended
                      return (
                        <div key={sub.id}
                          onClick={() => { setSelected({ classId: cls.id, subId: sub.id }); setEditing(null) }}
                          className={`group flex items-center gap-1.5 pl-7 pr-2.5 py-1.5 cursor-pointer transition-colors border-l-2
                            ${active ? 'bg-white border-l-[#0089cf]' : 'border-l-transparent hover:bg-white/70'}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`text-[11.5px] leading-tight truncate ${active ? 'font-semibold' : ''}`} style={{ color: active ? '#0089cf' : '#475569' }}>
                              {sub.code} {sub.title}
                            </p>
                            <p className="text-[9.5px] text-slate-400 truncate">
                              {sub.b1Ref || 'No B1 reference'} · {dev.label}
                            </p>
                          </div>
                          <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${sub.deviation === 'as_b1' ? 'bg-slate-300' : sub.deviation === 'deleted' ? 'bg-red-400' : sub.deviation === 'added' ? 'bg-blue-400' : 'bg-amber-400'}`} />
                          {!readOnly && (
                            <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <IconBtn title="Rename sub-class" onClick={e => { e.stopPropagation(); setSelected({ classId: cls.id, subId: sub.id }); setEditing({ kind: 'sub', classId: cls.id, subId: sub.id }) }}><Pencil size={10} /></IconBtn>
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
                      <button onClick={() => addSubclass(cls.id)}
                        className="ml-7 mt-1 flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-white"
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
              onSave={patch => { patchClass(activeClass.id, patch); setEditing(null) }} />
          ) : editing?.kind === 'sub' && activeSub ? (
            <SubForm key={activeSub.id} sub={activeSub} onCancel={() => setEditing(null)}
              onSave={patch => { patchSub(activeClass.id, activeSub.id, patch); setEditing(null) }} />
          ) : activeSub ? (
            <SubDetail
              cls={activeClass} sub={activeSub} readOnly={readOnly}
              onEdit={() => setEditing({ kind: 'sub', classId: activeClass.id, subId: activeSub.id })}
              onDelete={() => setConfirmDelete({ kind: 'sub', classId: activeClass.id, subId: activeSub.id, label: `${activeSub.code} ${activeSub.title}` })}
              onContentChange={val => patchSub(activeClass.id, activeSub.id, { content: val })}
              onDeviationChange={val => patchSub(activeClass.id, activeSub.id, { deviation: val })}
              onBackToClass={() => setSelected(null)}
            />
          ) : (
            <ClassDetail
              cls={activeClass} readOnly={readOnly}
              onOpenSub={subId => setSelected({ classId: activeClass.id, subId })}
              onAddSub={() => addSubclass(activeClass.id)}
              onEdit={() => setEditing({ kind: 'class', classId: activeClass.id })}
            />
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="flex items-center justify-between mt-5 pt-4 gap-3 flex-wrap" style={{ borderTop: '1px solid rgba(0,137,207,0.1)' }}>
        <p className="text-[11px]" style={{ color: '#94a3b8' }}>
          {total} special condition{total === 1 ? '' : 's'} across {classes.length} class{classes.length === 1 ? '' : 'es'} · {deviations} deviating from B1
        </p>
        <div className="flex items-center gap-2">
          {readOnly ? (
            <span className="text-[11px] font-medium px-3 py-1.5 rounded-lg" style={{ color: '#64748b', background: 'rgba(100,116,139,0.08)', border: '1px solid rgba(100,116,139,0.15)' }}>
              {readOnlyNote || 'Read-only — owned by another role'}
            </span>
          ) : (
            <>
              {onSkip && (
                <Button variant="secondary" onClick={onSkip} className="flex items-center gap-1.5">
                  Skip (optional) <ChevronRight size={14} />
                </Button>
              )}
              <Button variant="brand" onClick={onNext} className="flex items-center gap-2">
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

// The class's own data: what it covers and the sub-classes inside it.
function ClassDetail({ cls, readOnly, onOpenSub, onAddSub, onEdit }) {
  return (
    <div className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Clause Class {cls.code}</p>
          <h4 className="text-base font-semibold mt-0.5" style={{ color: '#1b4c6f' }}>{cls.title}</h4>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{cls.description}</p>
        </div>
        {!readOnly && (
          <button onClick={onEdit}
            className="shrink-0 flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50"
            style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
            <Pencil size={11} /> Edit
          </button>
        )}
      </div>

      <div className="mt-4 pt-4" style={{ borderTop: '1px solid #eef6fc' }}>
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: '#1b4c6f' }}>
            Sub-classes ({cls.subclasses.length})
          </p>
          {!readOnly && (
            <button onClick={onAddSub}
              className="flex items-center gap-1 text-[10.5px] font-semibold px-2 py-1 rounded-lg transition-colors hover:bg-slate-50"
              style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.25)' }}>
              <Plus size={11} /> Add sub-class
            </button>
          )}
        </div>

        {cls.subclasses.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">
            No sub-classes yet.{!readOnly && ' Add one to draft a special condition under this class.'}
          </p>
        ) : (
          <div className="space-y-2">
            {cls.subclasses.map(sub => {
              const dev = B2_DEVIATIONS[sub.deviation] || B2_DEVIATIONS.amended
              return (
                <button key={sub.id} onClick={() => onOpenSub(sub.id)}
                  className="w-full text-left rounded-xl px-3 py-2.5 transition-colors hover:bg-slate-50"
                  style={{ border: '1px solid #e2eefb' }}>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[11px] font-mono font-bold" style={{ color: '#0089cf' }}>{sub.code}</span>
                    <span className="text-[12.5px] font-semibold text-slate-700">{sub.title}</span>
                    <Badge variant={dev.badge}>{dev.label}</Badge>
                    {sub.b1Ref && (
                      <span className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Link2 size={9} /> {sub.b1Ref}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                    {sub.content?.trim() || 'No clause text drafted yet.'}
                  </p>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

// A single special condition: its metadata and the AI-editable clause text.
function SubDetail({ cls, sub, readOnly, onEdit, onDelete, onContentChange, onDeviationChange, onBackToClass }) {
  const dev = B2_DEVIATIONS[sub.deviation] || B2_DEVIATIONS.amended
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
          </div>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge variant={dev.badge}>{dev.label}</Badge>
            {sub.b1Ref && (
              <span className="flex items-center gap-1 text-[10px] text-slate-400">
                <Link2 size={10} /> Acts on {sub.b1Ref}
              </span>
            )}
          </div>
          <p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed">{dev.hint}</p>
        </div>
        {!readOnly && (
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEdit} title="Edit details"
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

      {/* Deviation selector */}
      {!readOnly && (
        <div className="mt-4">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Deviation from B1</p>
          <div className="flex flex-wrap gap-1.5">
            {B2_DEVIATION_ORDER.map(k => {
              const on = sub.deviation === k
              return (
                <button key={k} onClick={() => onDeviationChange(k)}
                  className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-lg border transition-colors
                    ${on ? 'bg-[#0089cf] text-white border-[#0089cf]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                  {B2_DEVIATIONS[k].label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Clause text — select-to-edit-with-AI */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">Clause text</p>
          {!readOnly && (
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <Wand2 size={10} /> Select any text to edit it with AI
            </span>
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
            placeholder="Draft the special condition — how this clause amends, adds to or disapplies the B1 General Conditions…"
            className="w-full px-3 py-2.5 text-[12.5px] leading-6 rounded-lg resize-y focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30"
            style={{ border: '1px solid #cce6f8', color: '#334155' }}
          />
        )}
      </div>
    </div>
  )
}

/* ────────────────────────── Add / edit forms ────────────────────────── */

function ClassForm({ cls, onSave, onCancel }) {
  const [code, setCode] = useState(cls.code)
  const [title, setTitle] = useState(cls.title)
  const [description, setDescription] = useState(cls.description || '')
  return (
    <FormShell title="Edit clause class" onCancel={onCancel}
      onSave={() => onSave({ code: code.trim() || cls.code, title: title.trim() || cls.title, description: description.trim() })}
      canSave={!!title.trim()}>
      <Field label="Class number" value={code} onChange={setCode} placeholder="e.g. 3" width="w-28" />
      <Field label="Class title" value={title} onChange={setTitle} placeholder="e.g. Contract Price & Payment" />
      <Field label="What this class covers" value={description} onChange={setDescription} multiline
        placeholder="A short description shown when the class is opened…" />
    </FormShell>
  )
}

function SubForm({ sub, onSave, onCancel }) {
  const [code, setCode] = useState(sub.code)
  const [title, setTitle] = useState(sub.title)
  const [b1Ref, setB1Ref] = useState(sub.b1Ref || '')
  const [deviation, setDeviation] = useState(sub.deviation)
  return (
    <FormShell title="Edit sub-class" onCancel={onCancel}
      onSave={() => onSave({ code: code.trim() || sub.code, title: title.trim() || sub.title, b1Ref: b1Ref.trim(), deviation })}
      canSave={!!title.trim()}>
      <Field label="Clause number" value={code} onChange={setCode} placeholder="e.g. 3.2" width="w-32" />
      <Field label="Clause title" value={title} onChange={setTitle} placeholder="e.g. Invoicing Procedure" />
      <Field label="B1 clause it acts on" value={b1Ref} onChange={setB1Ref} placeholder="e.g. GCC 12.4 — leave blank for a wholly new clause" />
      <div>
        <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">Deviation from B1</label>
        <div className="flex flex-wrap gap-1.5">
          {B2_DEVIATION_ORDER.map(k => (
            <button key={k} onClick={() => setDeviation(k)}
              className={`text-[10.5px] font-semibold px-2.5 py-1 rounded-lg border transition-colors
                ${deviation === k ? 'bg-[#0089cf] text-white border-[#0089cf]' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
              {B2_DEVIATIONS[k].label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5">{B2_DEVIATIONS[deviation].hint}</p>
      </div>
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

function Field({ label, value, onChange, placeholder, multiline = false, width = 'w-full' }) {
  const cls = `${width} px-3 py-2 text-[12.5px] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0089cf]/30`
  const style = { border: '1px solid #cce6f8', color: '#334155' }
  return (
    <div>
      <label className="text-[10px] font-bold uppercase tracking-wide text-slate-400 block mb-1.5">{label}</label>
      {multiline
        ? <textarea value={value} onChange={e => onChange(e.target.value)} rows={3} placeholder={placeholder} className={`${cls} resize-y`} style={style} />
        : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={cls} style={style} />}
    </div>
  )
}

/* ────────────────────────── Small shared bits ────────────────────────── */

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
