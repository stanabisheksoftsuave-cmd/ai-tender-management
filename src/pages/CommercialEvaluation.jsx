import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
const Svg = ({ size=16, sw=1.6, style, className='', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const BarChart3     = p => <Svg {...p}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></Svg>
const CheckCircle   = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const TrendingDown  = p => <Svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></Svg>
const Save          = p => <Svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></Svg>
const Send          = p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
const Pencil        = p => <Svg {...p}><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></Svg>
const Plus          = p => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></Svg>
const Trash2        = p => <Svg {...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></Svg>
const X             = p => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>
const AlertTriangle = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const ArrowLeft     = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>
const ShieldOff     = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const Download      = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
const Clock         = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { commercialCriteria as defaultCriteria, bidders, tenders } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'

const getCompliance = (score) => {
  if (score >= 2) return { variant: 'compliant',        label: 'Compliant' }
  if (score >= 1) return { variant: 'partial_compliant', label: 'Partially Compliant' }
  return                  { variant: 'non_compliant',    label: 'Non-Compliant' }
}

const bidTotals = {
  1: 828000,
  2: 762000,
  3: 882000,
  4: 712000,
}

export default function CommercialEvaluation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders, advanceTender, submitParallelEval } = useTenders()

  // All hooks must be called before any conditional returns
  const [criteria, setCriteria] = useState(defaultCriteria)
  const [scores, setScores] = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [activeTab, setActiveTab] = useState('scoring')
  const [showEditor, setShowEditor] = useState(false)
  const [draft, setDraft] = useState([])

  const tender = tenders.find(t => t.id === tenderId)
  const tenderBidders = Array.isArray(tender?.bidderList)
    ? tender.bidderList
    : (tender?.bidders > 0 ? bidders.slice(0, tender.bidders) : bidders)

  if (user?.role?.id !== 'comm_eval') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldOff size={22} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
          <p className="text-xs text-slate-400 mt-1">Commercial Evaluation is only accessible to Commercial Evaluators.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={13} /> Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!tenderId) {
    const assignedTenders = tenders.filter(
      t => t.assignedCommEval?.id === user?.id && (
        t.status === 'comm_eval' ||
        (t.status === 'parallel_eval' && t.commSide === 'evaluating')
      )
    )
    return (
      <TenderSelectList
        tenders={assignedTenders}
        status="comm_eval"
        basePath="/commercial-eval"
        title="Commercial Evaluation"
        description="Select a tender to begin or continue commercial evaluation"
        emptyText="No tenders assigned to you for commercial evaluation"
      />
    )
  }

  if (!tender || tender.assignedCommEval?.id !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <p className="text-sm">{!tender ? 'Tender not found.' : 'This tender is not assigned to you.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={13} /> Back to Dashboard
        </Button>
      </div>
    )
  }

  const openEditor = () => {
    setDraft(criteria.map(c => ({ ...c })))
    setShowEditor(true)
  }

  const draftTotal = draft.reduce((s, c) => s + Number(c.weight || 0), 0)

  const updateDraft = (idx, field, val) => {
    setDraft(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  const addCriterion = () => {
    const nextId = Math.max(0, ...draft.map(c => c.id)) + 1
    setDraft(prev => [...prev, { id: nextId, criterion: '', weight: 0, maxScore: 3 }])
  }

  const removeCriterion = (idx) => {
    setDraft(prev => prev.filter((_, i) => i !== idx))
  }

  const saveDraft = () => {
    if (draftTotal !== 100) return
    const clean = draft.filter(c => c.criterion.trim() !== '')
    setCriteria(clean)
    setShowEditor(false)
  }

  const setScore = (bidderId, criterionId, value) => {
    const num = value === '' ? '' : Math.min(3, Math.max(0, Number(value)))
    setScores(prev => ({ ...prev, [`${bidderId}-${criterionId}`]: num }))
  }

  const totalFor = (bidderId) => {
    return criteria.reduce((sum, c) => {
      const s = scores[`${bidderId}-${c.id}`]
      return sum + ((s === '' || s === undefined ? 0 : Number(s)) * c.weight / 100)
    }, 0)
  }

  const hasScores = (bidderId) => criteria.some(c => scores[`${bidderId}-${c.id}`] !== undefined)

  const allScored = tenderBidders.every(b =>
    criteria.every(c => { const v = scores[`${b.id}-${c.id}`]; return v !== undefined && v !== '' })
  )

  const missingScoresCount = tenderBidders.reduce((acc, b) =>
    acc + criteria.filter(c => { const v = scores[`${b.id}-${c.id}`]; return v === undefined || v === '' }).length, 0
  )

  const lowestBid = Math.min(...tenderBidders.map(b => bidTotals[b.id] ?? 0))

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <button onClick={() => navigate('/dashboard')} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="evaluation">Commercial Evaluation</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{tender.department} · Deadline: {tender.deadline} · Manually score {tenderBidders.length} bidders across {criteria.length} commercial criteria</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
            <BarChart3 size={13} className="text-slate-400" />
            Manual scoring
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[{ id: 'scoring', label: 'Scoring' }, { id: 'compliance', label: 'Compliance Overview' }].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'compliance' && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle size={15} className="text-[var(--color-primary)]" />
            <h3 className="font-semibold text-slate-800 text-sm">Bidder-wise Compliance — Commercial</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-52">Criterion</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 w-16">Weight</th>
                  {tenderBidders.map(b => (
                    <th key={b.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 min-w-36">
                      {b.name.split(' ')[0]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {criteria.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{c.criterion}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.weight}%</span>
                    </td>
                    {tenderBidders.map(b => {
                      const raw = scores[`${b.id}-${c.id}`]
                      const val = raw === undefined || raw === '' ? null : Number(raw)
                      const compliance = val !== null ? getCompliance(val) : null
                      return (
                        <td key={b.id} className="px-3 py-3 text-center">
                          {val !== null ? (
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-sm font-semibold text-slate-600">{val}</span>
                              <Badge variant={compliance.variant}>{compliance.label}</Badge>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300">—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Overall Compliance</td>
                  {tenderBidders.map(b => {
                    const scored = hasScores(b.id)
                    const total = totalFor(b.id)
                    const compliance = getCompliance(total)
                    return (
                      <td key={b.id} className="px-3 py-3 text-center">
                        {scored ? (
                          <>
                            <span className="text-base font-bold block mb-1 text-slate-700">{total.toFixed(1)}</span>
                            <Badge variant={compliance.variant}>{compliance.label}</Badge>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300">No scores yet</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'scoring' && (<>

      {/* Price comparison */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {tenderBidders.map(b => {
          const totalBid = bidTotals[b.id] ?? 0
          const isLowest = totalBid === lowestBid
          const scored = hasScores(b.id)
          return (
            <Card key={b.id} className={`p-4 ${isLowest ? 'ring-2 ring-blue-400' : ''}`}>
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-slate-600">{b.name.split(' ')[0]}</p>
                {isLowest && <Badge variant="success"><TrendingDown size={10} /> Lowest</Badge>}
              </div>
              <p className="text-xl font-bold text-slate-800">OMR {(totalBid / 1000).toFixed(0)}K</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{b.country}</p>
              <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full rounded-full bg-[var(--color-primary)]"
                  style={{ width: `${lowestBid > 0 ? (lowestBid / totalBid) * 100 : 0}%` }} />
              </div>
              {scored ? (
                <>
                  <div className="mt-2 text-lg font-bold text-[var(--color-primary)]">{totalFor(b.id).toFixed(1)}</div>
                  <div className="mt-1.5">
                    <Badge variant={getCompliance(totalFor(b.id)).variant}>{getCompliance(totalFor(b.id)).label}</Badge>
                  </div>
                </>
              ) : (
                <p className="mt-2 text-[11px] text-slate-400">Score to see total</p>
              )}
            </Card>
          )
        })}
      </div>

      {/* Scoring table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Evaluation Criteria</p>
          <button
            onClick={openEditor}
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 px-2.5 py-1.5 rounded-lg transition-colors"
          >
            <Pencil size={12} /> Edit Criteria
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-52">Criterion</th>
                <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 w-16">Weight</th>
                {tenderBidders.map(b => (
                  <th key={b.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 min-w-32">
                    {b.name.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {criteria.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-700">{c.criterion}</td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.weight}%</span>
                  </td>
                  {tenderBidders.map(b => {
                    const key = `${b.id}-${c.id}`
                    const val = scores[key]
                    const hasVal = val !== undefined && val !== ''
                    const compliance = hasVal ? getCompliance(Number(val)) : null
                    return (
                      <td key={b.id} className="px-3 py-3 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <input
                            type="number"
                            min={0}
                            max={3}
                            step={1}
                            value={val ?? ''}
                            placeholder="—"
                            onChange={e => setScore(b.id, c.id, e.target.value)}
                            className="w-16 text-center text-sm font-semibold rounded-lg border border-slate-200 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 placeholder:text-slate-300"
                          />
                          {hasVal && compliance && (
                            <Badge variant={compliance.variant} className="text-[9px] px-1.5 py-0">{compliance.label}</Badge>
                          )}
                        </div>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-200">
                <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Weighted Total</td>
                {tenderBidders.map(b => {
                  const scored = hasScores(b.id)
                  const score = totalFor(b.id)
                  const compliance = getCompliance(score)
                  return (
                    <td key={b.id} className="px-3 py-3 text-center">
                      {scored ? (
                        <>
                          <span className={`text-base font-bold block mb-1 ${score >= 2 ? 'text-green-600' : score >= 1 ? 'text-amber-600' : 'text-red-500'}`}>
                            {score.toFixed(1)}
                          </span>
                          <Badge variant={compliance.variant}>{compliance.label}</Badge>
                        </>
                      ) : (
                        <span className="text-xs text-slate-300">—</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>

      {!submitted ? (
        <>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" size="sm"><Save size={13} /> Save Draft</Button>
            <Button size="sm" onClick={() => {
              if (!allScored) { setSubmitError(`${missingScoresCount} score${missingScoresCount > 1 ? 's' : ''} missing — all criteria must be scored before submitting.`); return }
              setSubmitError('')
              if (tender.evaluationMode === 'parallel') submitParallelEval(tenderId, 'comm')
              else advanceTender(tenderId)
              setSubmitted(true)
            }}><Send size={13} /> Submit & Export Report</Button>
          </div>
          {submitError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle size={12} /> {submitError}
            </div>
          )}
        </>
      ) : (
        <Card className="p-5 space-y-3">
          <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
            <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-emerald-800">Commercial Evaluation Submitted</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Download the evaluation report and hand it to the <strong>Contract Engineer</strong> for upload to unlock Management Review.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <Clock size={13} className="shrink-0" />
            <span>Tender is now <strong className="mx-1">Awaiting Contract Engineer Upload</strong> — the Contract Engineer must upload this report to advance to Management Review.</span>
          </div>
          <Button className="w-full justify-center" onClick={() => {
            const a = document.createElement('a')
            a.href = '#'
            a.download = `Comm-Eval-Report-${tenderId}.pdf`
            a.click()
          }}>
            <Download size={14} /> Download Commercial Evaluation Report
          </Button>
        </Card>
      )}
      </>)}

      {/* ── Criteria Editor Modal ── */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 fade-in">
          <Card className="w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
              <div>
                <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-2">
                  <Pencil size={14} className="text-[var(--color-primary)]" />
                  Edit Commercial Criteria
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Weights must total exactly 100%</p>
              </div>
              <button onClick={() => setShowEditor(false)} className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400">
                <X size={15} />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-5 py-4 space-y-2">
              {draft.map((c, idx) => (
                <div key={c.id} className="flex items-center gap-2">
                  <input
                    value={c.criterion}
                    onChange={e => updateDraft(idx, 'criterion', e.target.value)}
                    placeholder="Criterion name"
                    className="flex-1 px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                  />
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={c.weight}
                      onChange={e => updateDraft(idx, 'weight', Number(e.target.value))}
                      className="w-16 text-center px-2 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  <button
                    onClick={() => removeCriterion(idx)}
                    disabled={draft.length <= 1}
                    className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors disabled:opacity-30"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}

              <button
                onClick={addCriterion}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 hover:border-[var(--color-primary)]/40 hover:text-[var(--color-primary)] transition-colors mt-1"
              >
                <Plus size={12} /> Add Criterion
              </button>
            </div>

            <div className="px-5 pb-5 shrink-0 border-t border-slate-100 pt-4 space-y-3">
              <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium
                ${draftTotal === 100 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                <span className="flex items-center gap-1.5">
                  {draftTotal !== 100 && <AlertTriangle size={12} />}
                  Total weight
                </span>
                <span className="font-bold">{draftTotal}% {draftTotal === 100 ? '✓' : `— need ${100 - draftTotal}% more`}</span>
              </div>

              <div className="flex gap-2">
                <Button variant="secondary" className="flex-1 justify-center" onClick={() => setShowEditor(false)}>Cancel</Button>
                <Button className="flex-1 justify-center" onClick={saveDraft} disabled={draftTotal !== 100}>
                  <Save size={13} /> Save Criteria
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
