/*
 * Commercial Evaluation — the panels that make the client's three real
 * evaluation shapes renderable.
 *
 * Which panels appear is driven entirely by the tender's `evaluationType`:
 *   competitive-complex → Section E roll-up tree, fixed vs non-fixed split,
 *                         CE normalization register, adjustment factor tables
 *   competitive-simple  → two-schedule line-item comparison against a CE that
 *                         already carries the market increase
 *   single-source       → NO ranking, NO L1/L2, NO multi-bidder comparison.
 *                         Negotiation rounds, external rate benchmarks and the
 *                         scope-merge option take their place.
 */
import { Fragment, useState } from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import {
  AiStrip, PanelHead, Chip, VarPct, StateTag, StatTile, NoteBlock,
  IcScale, IcLayers, IcActivity, IcTarget, IcGauge, IcHandshake,
  IcAward, IcFile, IcGlobe, IcMerge, IcRefresh, IcAlert, IcInfo, IcCheck, IcX,
  IcMinus, IcSlash,
} from './CePrimitives'
import {
  bidAmount, bidState, ceFormat, nodeCe, nodeBid, flattenRollup, findNode,
  complexTotals, simpleTotals, singleSourceTotals,
} from '../../data/ceScenarios'

const pctOf = (v, base) => (base ? ((v - base) / base) * 100 : null)

/* Tabs in the same visual language as the benchmarking step. */
function TabBar({ tabs, value, onChange }) {
  return (
    <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5 flex-wrap">
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors
            ${value === t.id ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
              : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
          {t.label}
        </button>
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * STEP 4 — CE Adjustment & Normalization (competitive)
 * ═══════════════════════════════════════════════════════════════════════════ */

const EFFECT_META = {
  remove:    { label: 'Removed',   tone: 'red',   Icon: IcSlash },
  normalize: { label: 'Normalized', tone: 'blue',  Icon: IcRefresh },
  assume:    { label: 'Assumption', tone: 'amber', Icon: IcInfo },
}

export function CeNormalizationPanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const n = scenario.normalization
  const isComplex = scenario.type === 'competitive-complex'
  const [tab, setTab] = useState('register')
  const delta = n.normalized - n.approved

  const tabs = [{ id: 'register', label: 'Normalization Register' }]
  if (isComplex) tabs.push(
    { id: 'market', label: '3.8 Market Adjustment' },
    { id: 'condition', label: '3.9 Condition Factor' },
    { id: 'efficiency', label: '3.10 Efficiency Factor' },
  )

  return (
    <>
      <AiStrip>
        <strong>AI normalization complete.</strong> {n.items.length} adjustment{n.items.length !== 1 ? 's' : ''} applied to the approved Company Estimate.
        Approved {fmt.money2(n.approved)} → normalized <strong>{fmt.money2(n.normalized)}</strong>{' '}
        ({delta >= 0 ? '+' : '−'}{fmt.money2(Math.abs(delta))}). Every bidder is evaluated against the normalized figure.
      </AiStrip>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={n.approvedLabel} value={fmt.money2(n.approved)} sub="As signed and approved" />
        {n.corrected != null && (
          <StatTile label={n.correctedLabel} value={fmt.money2(n.corrected)} sub="After correction & efficiency factor" />
        )}
        <StatTile label={n.normalizedLabel} value={fmt.money2(n.normalized)} tone="primary" ring
          sub={`${delta >= 0 ? 'Increase' : 'Decrease'} of ${fmt.money2(Math.abs(delta))} against the approved estimate`} />
        {n.withEscalation != null && (
          <StatTile label={n.escalationLabel} value={fmt.money2(n.withEscalation)}
            sub={n.diffFromApproved != null ? `${fmt.money2(n.diffFromApproved)} above the approved estimate` : null} />
        )}
      </div>

      <Card className="overflow-hidden">
        <TabBar tabs={tabs} value={tab} onChange={setTab} />

        {tab === 'register' && (
          <div className="divide-y divide-slate-50">
            {n.items.map((it, i) => {
              const meta = EFFECT_META[it.effect] || EFFECT_META.normalize
              const Icon = meta.Icon
              return (
                <div key={i} className="px-4 py-3 flex items-start gap-3">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Icon size={12} className="text-slate-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      {it.ref !== '—' && <span className="text-[10px] font-mono font-bold text-[var(--color-primary)]">{it.ref}</span>}
                      <span className="text-[12px] font-semibold text-slate-700">{it.title}</span>
                      <Chip tone={meta.tone}>{meta.label}</Chip>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{it.detail}</p>
                  </div>
                </div>
              )
            })}
            <div className="px-4 py-3 bg-[var(--color-primary)]/5 flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-slate-700 uppercase">Approved → Normalized</span>
              <span className="text-[12px] text-slate-600">
                {fmt.money2(n.approved)} → <strong className="text-[var(--color-primary)]">{fmt.money2(n.normalized)}</strong>
                <span className="ml-2 text-slate-400">({delta >= 0 ? '+' : '−'}{fmt.money2(Math.abs(delta))})</span>
              </span>
            </div>
          </div>
        )}

        {tab === 'market'    && <MarketAdjustmentTable scenario={scenario} />}
        {tab === 'condition' && <ConditionFactorTable scenario={scenario} />}
        {tab === 'efficiency'&& <EfficiencyFactorTable scenario={scenario} />}
      </Card>
    </>
  )
}

function MarketAdjustmentTable({ scenario }) {
  const m = scenario.marketAdjustment
  const codes = scenario.bidders.map(b => b.code)
  return (
    <>
      <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">{m.note}</p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="text-left px-4 py-2.5 text-xs font-semibold min-w-64">{m.ref} · {m.title}</th>
              <th className="text-right px-3 py-2.5 text-xs font-semibold bg-slate-100/60">Company Estimate</th>
              {codes.map(c => <th key={c} className="text-right px-3 py-2.5 text-xs font-semibold">{c}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {m.years.map((y, i) => (
              <tr key={y.year} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 text-slate-700">
                  <span className="text-[10px] font-mono text-slate-400 mr-2">3.8.{i + 1}</span>{y.label} — add / deduct
                </td>
                <td className="px-3 py-2.5 text-right bg-slate-50/40 font-medium text-slate-700">{m.ce[i].toFixed(2)}%</td>
                {codes.map(c => (
                  <td key={c} className="px-3 py-2.5 text-right text-slate-600">{m.bids[c][i].toFixed(2)}%</td>
                ))}
              </tr>
            ))}
            <tr className="bg-slate-50 border-t-2 border-slate-200 font-semibold text-slate-700">
              <td className="px-4 py-2.5 text-[11px] uppercase">Cumulative escalation by the final year</td>
              <td className="px-3 py-2.5 text-right bg-slate-100/50">{m.ce[m.ce.length - 1].toFixed(2)}%</td>
              {codes.map(c => <td key={c} className="px-3 py-2.5 text-right">{m.bids[c][m.bids[c].length - 1].toFixed(2)}%</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function ConditionFactorTable({ scenario }) {
  const c = scenario.conditionFactor
  return (
    <>
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-start gap-2 bg-amber-50/50">
        <IcInfo size={13} className="text-amber-500 shrink-0 mt-0.5" />
        <span className="text-[11px] text-amber-800 leading-relaxed">
          <strong>Excluded from the ACV.</strong> {c.note}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="text-left px-4 py-2.5 text-xs font-semibold">S/N</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-80">Condition</th>
              <th className="text-right px-4 py-2.5 text-xs font-semibold">Factor (multiplier)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {c.rows.map(r => (
              <tr key={r.ref} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500">{r.ref}</td>
                <td className="px-3 py-2.5 text-slate-700">{r.condition}</td>
                <td className="px-4 py-2.5 text-right font-semibold text-slate-800">{r.factor.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

function EfficiencyFactorTable({ scenario }) {
  const e = scenario.efficiencyFactor
  const fmt = ceFormat(scenario.currency)
  const codes = scenario.bidders.map(b => b.code)
  const [who, setWho] = useState('ce')
  const series = (a) => who === 'ce' ? a.ce : a.bids[who]
  return (
    <>
      <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">{e.note}</p>
      <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-1.5 flex-wrap">
        {[{ id: 'ce', label: 'Company Estimate' }, ...codes.map(c => ({ id: c, label: c }))].map(t => (
          <button key={t.id} onClick={() => setWho(t.id)}
            className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors
              ${who === t.id ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
            {t.label}
          </button>
        ))}
        {who !== 'ce' && e.bidderNotes?.[who] && (
          <span className="text-[10px] text-slate-400 ml-1">{e.bidderNotes[who]}</span>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th className="text-left px-4 py-2.5 text-xs font-semibold">S/N</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold">Table ref.</th>
              <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-64">Activity</th>
              {e.years.map((y, i) => (
                <th key={y} className={`text-right px-2.5 py-2.5 text-xs font-semibold ${i === e.years.length - 1 ? 'border-l border-slate-200' : ''}`}>
                  {y}{i === e.years.length - 1 && <span className="block text-[9px] font-normal text-slate-400">extension</span>}
                </th>
              ))}
              {who === 'B6' && <th className="text-right px-4 py-2.5 text-xs font-semibold">Total {fmt.code}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {e.activities.map(a => (
              <tr key={a.ref} className="hover:bg-slate-50/50">
                <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500">{a.ref}</td>
                <td className="px-3 py-2.5 text-[11px] font-mono text-slate-400">{a.tableRef}</td>
                <td className="px-3 py-2.5 text-slate-700">{a.activity}</td>
                {series(a).map((v, i) => (
                  <td key={i} className={`px-2.5 py-2.5 text-right ${i === e.years.length - 1 ? 'border-l border-slate-100' : ''} ${v < 1 ? 'text-emerald-600 font-semibold' : 'text-slate-500'}`}>
                    {v.toFixed(2)}
                  </td>
                ))}
                {who === 'B6' && <td className="px-4 py-2.5 text-right text-slate-700 font-medium">{fmt.money2(a.b6Total)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * STEP 5 — Priced comparison (competitive-complex)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function ComplexPricedPanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const codes = scenario.bidders.map(b => b.code)
  const t = complexTotals(scenario)
  const [tab, setTab] = useState('rollup')
  const rows = flattenRollup(scenario.rollup)
  const rank = Object.fromEntries(t.ranked.map((r, i) => [r.code, i]))

  return (
    <>
      <AiStrip>
        <strong>AI priced comparison complete.</strong> {rows.filter(r => !r.isGroup).length} Section E lines rolled up against the {scenario.ceLabel.toLowerCase()} of {fmt.money2(t.ce)}.
        <strong> {t.l1.code}</strong> is L1 at {fmt.money2(t.l1.total)} ({fmt.pct(t.l1.pct)}), <strong>{t.l2.code}</strong> is L2 at {fmt.money2(t.l2.total)} ({fmt.pct(t.l2.pct)}).
        The difference between L1 and L2 is {t.gapPct.toFixed(0)}%.
      </AiStrip>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={scenario.ceLabel} value={fmt.money2(t.ce)} sub={scenario.basis} />
        {t.ranked.map((r, i) => (
          <StatTile key={r.code} ring={i === 0}
            label={<>{r.code}{i === 0 ? ' · L1' : i === 1 ? ' · L2' : ''}</>}
            value={fmt.money2(r.total)}
            tone={i === 0 ? 'green' : r.pct >= 100 ? 'red' : 'amber'}
            sub={`${r.pct > 0 ? '+' : ''}${r.pct.toFixed(0)}% against the Company Estimate`} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <TabBar value={tab} onChange={setTab} tabs={[
          { id: 'rollup', label: 'Section E Roll-Up' },
          { id: 'split', label: 'Fixed vs Non-Fixed' },
          { id: 'rates', label: 'Rate Dimensions' },
        ]} />

        {tab === 'rollup' && (
          <>
            <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">
              %age = proposal against the Company Estimate · L1 diff to L2 = the second-lowest proposal against the lowest, per schedule.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-72">Section E table</th>
                    <th rowSpan={2} className="text-right px-2.5 py-2 font-semibold border-l border-slate-200 bg-slate-100/60 min-w-32">Company Estimate</th>
                    {codes.map(c => (
                      <th key={c} colSpan={2} className="text-center px-2.5 py-1.5 font-semibold border-l border-slate-200 min-w-36">{c}</th>
                    ))}
                    <th rowSpan={2} className="text-right px-3 py-2 font-semibold border-l border-slate-200 min-w-28">L1 diff to L2</th>
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                    {codes.map(c => (
                      <Fragment key={c}>
                        <th className="text-right px-2.5 py-1.5 border-l border-slate-200">Total</th>
                        <th className="text-right px-2.5 py-1.5">%age</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map(r => {
                    const ce = nodeCe(r)
                    const vals = codes.map(c => ({ code: c, v: nodeBid(r, c) }))
                    const sorted = [...vals].filter(x => x.v > 0).sort((a, b) => a.v - b.v)
                    const gap = sorted.length > 1 ? pctOf(sorted[1].v, sorted[0].v) : null
                    const pad = { paddingLeft: 12 + r.depth * 16 }
                    return (
                      <tr key={r.ref}
                        className={`border-b border-slate-50 hover:bg-slate-50/40
                          ${r.isGroup ? 'bg-[var(--color-primary)]/5 font-semibold' : ''} ${r.removed ? 'opacity-60' : ''}`}>
                        <td className={`py-2 pr-3 sticky left-0 ${r.isGroup ? 'bg-[var(--color-primary)]/5' : 'bg-white'}`} style={pad}>
                          <span className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-mono text-slate-400">{r.ref}</span>
                            <span className={`${r.isGroup ? 'text-[var(--color-primary)]' : 'text-slate-700'} ${r.removed ? 'line-through' : ''}`}>{r.label}</span>
                            {r.removed && <Chip tone="red">Removed by normalization</Chip>}
                          </span>
                          {r.removedNote && <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{r.removedNote}</p>}
                          {r.note && <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{r.note}</p>}
                        </td>
                        <td className="px-2.5 py-2 text-right border-l border-slate-100 bg-slate-50/40 text-slate-700">{fmt.money2(ce)}</td>
                        {vals.map(x => (
                          <Fragment key={x.code}>
                            <td className={`px-2.5 py-2 text-right border-l border-slate-100 ${rank[x.code] === 0 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                              {fmt.money2(x.v)}
                            </td>
                            <td className="px-2.5 py-2 text-right"><VarPct value={ce ? pctOf(x.v, ce) : null} /></td>
                          </Fragment>
                        ))}
                        <td className="px-3 py-2 text-right border-l border-slate-100">
                          {gap == null ? <span className="text-slate-300">—</span>
                            : <span className="font-semibold text-slate-600">{gap.toFixed(0)}%</span>}
                        </td>
                      </tr>
                    )
                  })}
                  <tr className="bg-[var(--color-primary)]/10 border-t-2 border-[var(--color-primary)]/30 font-bold text-slate-800">
                    <td className="px-3 py-3 uppercase text-xs sticky left-0 bg-[#e6f3fb]">Total</td>
                    <td className="px-2.5 py-3 text-right border-l border-slate-200">{fmt.money2(t.ce)}</td>
                    {codes.map(c => (
                      <Fragment key={c}>
                        <td className="px-2.5 py-3 text-right border-l border-slate-200">{fmt.money2(t.bids[c])}</td>
                        <td className="px-2.5 py-3 text-right"><VarPct value={pctOf(t.bids[c], t.ce)} /></td>
                      </Fragment>
                    ))}
                    <td className="px-3 py-3 text-right border-l border-slate-200">{t.gapPct.toFixed(0)}%</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 flex flex-wrap items-center gap-2">
              <Chip tone="green">{t.l1.code} · L1 {fmt.money2(t.l1.total)}</Chip>
              <Chip tone="amber">{t.l2.code} · L2 {fmt.money2(t.l2.total)}</Chip>
              <span className="text-[10px] text-slate-400">
                {scenario.conditionFactor?.excludedFromAcv && '3.9 Condition Factor is excluded from the ACV — a constant percentage given to all bidders. '}
                3.10 Efficiency Factor is adjusted inside tables 3.4.6, 3.4.7 and 3.4.8.
              </span>
            </div>
          </>
        )}

        {tab === 'split' && (
          <div className="p-4 space-y-4">
            {scenario.fixedGroups.map(g => {
              const grp = t.groups[g.key]
              return (
                <div key={g.key} className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="px-3 py-2.5 bg-slate-50 border-b border-slate-100">
                    <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">{g.label}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{g.hint}</p>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-slate-100">
                    <div className="px-3 py-3">
                      <p className="text-[10px] text-slate-400 uppercase font-semibold">Company Estimate</p>
                      <p className="text-[13px] font-bold text-slate-800 mt-0.5">{fmt.money2(grp.ce)}</p>
                      <p className="text-[10px] text-slate-400">{grp.ce && t.ce ? ((grp.ce / t.ce) * 100).toFixed(1) : '0'}% of the estimate</p>
                    </div>
                    {codes.map(c => (
                      <div key={c} className="px-3 py-3">
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{c}</p>
                        <p className="text-[13px] font-bold text-slate-800 mt-0.5">{fmt.money2(grp.bids[c])}</p>
                        <p className="text-[10px]"><VarPct value={pctOf(grp.bids[c], grp.ce)} /> against the estimate</p>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {scenario.spendMix && (
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <PanelHead icon={IcGauge} title="Where the Company Estimate sits" hint="Share of the normalized estimate" />
                <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {scenario.spendMix.map(s => (
                    <div key={s.label}>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-semibold text-slate-600">{s.label} <span className="font-mono text-slate-400">{s.ref}</span></span>
                        <span className="font-bold text-slate-700">{s.pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <span className="block h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${s.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'rates' && <RateDimensionTable scenario={scenario} />}
      </Card>
    </>
  )
}

/**
 * A single unit-rate line in a call-off schedule carries FIVE priced
 * dimensions, each with its own quantity and rate. Flattening them into one
 * "unit rate" would lose the negotiation levers (overtime and standby are
 * capped in Section E), so they are shown side by side.
 */
function RateDimensionTable({ scenario }) {
  const s = scenario.rateDimensionSample
  const dims = scenario.rateDimensions
  const fmt = ceFormat(scenario.currency)
  if (!s) return null
  return (
    <>
      <p className="px-4 py-2 text-[10px] text-slate-400 border-b border-slate-100">
        Table {s.tableRef} · {s.tableLabel} — each unit-rate line carries five priced dimensions. {s.note}
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-64">Line</th>
              {dims.map(d => (
                <th key={d.id} colSpan={3} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">{d.label}</th>
              ))}
            </tr>
            <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
              {dims.map(d => (
                <Fragment key={d.id}>
                  <th className="text-right px-2 py-1.5 border-l border-slate-200">Qty</th>
                  <th className="text-right px-2 py-1.5">Rate</th>
                  <th className="text-right px-2 py-1.5">Total</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {s.rows.map(r => (
              <tr key={r.ref} className="hover:bg-slate-50/40">
                <td className="px-3 py-2 sticky left-0 bg-white">
                  <span className="text-[10px] font-mono text-slate-400 mr-2">{r.ref}</span>
                  <span className="text-slate-700">{r.label}</span>
                </td>
                {dims.map(d => {
                  const c = r.dims[d.id]
                  return (
                    <Fragment key={d.id}>
                      <td className="px-2 py-2 text-right border-l border-slate-100 text-slate-500">{c.qty}</td>
                      <td className="px-2 py-2 text-right text-slate-600">{fmt.rate(c.ce)}</td>
                      <td className="px-2 py-2 text-right text-slate-700 font-medium">{fmt.rate(c.qty * c.ce)}</td>
                    </Fragment>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * STEP 5 — Priced comparison (competitive-simple)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function SimplePricedPanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const codes = scenario.bidders.map(b => b.code)
  const t = simpleTotals(scenario)
  const rank = Object.fromEntries(t.ranked.map((r, i) => [r.code, i]))
  const lineCount = scenario.schedules.reduce((s, sc) => s + sc.items.length, 0)

  return (
    <>
      <AiStrip>
        <strong>AI priced comparison complete.</strong> {lineCount} lines across {scenario.schedules.length} schedules compared against the Company Estimate of {fmt.money2(t.ce)},
        which already carries the {scenario.marketIncreasePct}% market increase. <strong>{t.l1.code}</strong> is L1 at {fmt.pct(t.l1.pct)} and <strong>{t.l2.code}</strong> is {fmt.pct(t.l2.pct)} against the Company Estimate.
      </AiStrip>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile label={scenario.ceLabel} value={fmt.money2(t.ce)} sub={scenario.basis} />
        {t.ranked.map((r, i) => (
          <StatTile key={r.code} ring={i === 0} label={<>{r.code}{i === 0 ? ' · L1' : ' · L2'}</>}
            value={fmt.money2(r.total)} tone={i === 0 ? 'green' : r.pct >= 100 ? 'red' : 'amber'}
            sub={`${r.pct > 0 ? '+' : ''}${r.pct.toFixed(0)}% against the Company Estimate`} />
        ))}
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcScale} title="Schedule Roll-Up"
          hint={`${scenario.schedules.length} schedules · ${lineCount} priced lines`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="text-left px-4 py-2.5 text-xs font-semibold">Schedule</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-52">Description</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold bg-slate-100/60">Company Estimate</th>
                {codes.map(c => (
                  <th key={c} colSpan={2} className="text-center px-3 py-2.5 text-xs font-semibold border-l border-slate-200">Bidder {c} proposal</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {t.schedules.map(sc => (
                <tr key={sc.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500">{sc.id}</td>
                  <td className="px-3 py-2.5 text-slate-700 font-medium">{sc.name}</td>
                  <td className="px-3 py-2.5 text-right bg-slate-50/40 text-slate-700">{fmt.money2(sc.ce)}</td>
                  {codes.map(c => (
                    <Fragment key={c}>
                      <td className={`px-3 py-2.5 text-right border-l border-slate-100 ${rank[c] === 0 ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>{fmt.money2(sc.bids[c])}</td>
                      <td className="px-3 py-2.5 text-right"><VarPct value={pctOf(sc.bids[c], sc.ce)} /></td>
                    </Fragment>
                  ))}
                </tr>
              ))}
              <tr className="bg-[var(--color-primary)]/10 border-t-2 border-[var(--color-primary)]/30 font-bold text-slate-800">
                <td colSpan={2} className="px-4 py-3 uppercase text-xs">{scenario.grandTotalLabel}</td>
                <td className="px-3 py-3 text-right">{fmt.money2(t.ce)}</td>
                {codes.map(c => (
                  <Fragment key={c}>
                    <td className="px-3 py-3 text-right border-l border-slate-200">{fmt.money2(t.bids[c])}</td>
                    <td className="px-3 py-3 text-right"><VarPct value={pctOf(t.bids[c], t.ce)} /></td>
                  </Fragment>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {scenario.schedules.map(sc => {
        const roll = t.schedules.find(x => x.id === sc.id)
        return (
          <Card key={sc.id} className="overflow-hidden">
            <PanelHead icon={IcLayers} title={`${sc.id} · ${sc.name}`} hint={`${sc.items.length} lines`} />
            <div className="overflow-x-auto">
              <table className="w-full text-[12px] border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-72">Item</th>
                    <th rowSpan={2} className="text-center px-2 py-2 font-semibold">UOM</th>
                    <th rowSpan={2} className="text-right px-2 py-2 font-semibold">Qty</th>
                    <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200 bg-slate-100/60">Company Estimate</th>
                    {codes.map(c => <th key={c} colSpan={3} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">{c}</th>)}
                  </tr>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                    <th className="text-right px-2 py-1.5 border-l border-slate-200 bg-slate-100/60">Unit +{scenario.marketIncreasePct}%</th>
                    <th className="text-right px-2 py-1.5 bg-slate-100/60">Total</th>
                    {codes.map(c => (
                      <Fragment key={c}>
                        <th className="text-right px-2 py-1.5 border-l border-slate-200">Unit</th>
                        <th className="text-right px-2 py-1.5">Total</th>
                        <th className="text-right px-2 py-1.5">%age</th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sc.items.map(it => {
                    const ceT = it.qty * it.ceUnit
                    return (
                      <tr key={it.no} className="border-b border-slate-50 hover:bg-slate-50/40">
                        <td className="px-3 py-2 sticky left-0 bg-white">
                          <span className="font-medium text-slate-700">{it.no}. {it.description}</span>
                          <span className="block text-[10px] text-slate-400">{it.size}</span>
                        </td>
                        <td className="px-2 py-2 text-center text-slate-500">{it.uom}</td>
                        <td className="px-2 py-2 text-right text-slate-500">{it.qty.toLocaleString()}</td>
                        <td className="px-2 py-2 text-right border-l border-slate-100 bg-slate-50/40 text-slate-600">{fmt.rate(it.ceUnit)}</td>
                        <td className="px-2 py-2 text-right bg-slate-50/40 font-medium text-slate-700">{fmt.money2(ceT)}</td>
                        {codes.map(c => {
                          const u = it.bids[c]
                          const bt = it.qty * u
                          return (
                            <Fragment key={c}>
                              <td className="px-2 py-2 text-right border-l border-slate-100 text-slate-600">{fmt.rate(u)}</td>
                              <td className="px-2 py-2 text-right text-slate-700">{fmt.money2(bt)}</td>
                              <td className="px-2 py-2 text-right"><VarPct value={pctOf(bt, ceT)} /></td>
                            </Fragment>
                          )
                        })}
                      </tr>
                    )
                  })}
                  <tr className="bg-slate-50 border-y border-slate-200 font-semibold text-slate-700">
                    <td colSpan={3} className="px-3 py-2 text-[11px] uppercase">{sc.subtotalLabel}</td>
                    <td className="border-l border-slate-200 bg-slate-100/50" />
                    <td className="px-2 py-2 text-right bg-slate-100/50">{fmt.money2(roll.ce)}</td>
                    {codes.map(c => (
                      <Fragment key={c}>
                        <td className="border-l border-slate-200" />
                        <td className="px-2 py-2 text-right">{fmt.money2(roll.bids[c])}</td>
                        <td className="px-2 py-2 text-right"><VarPct value={pctOf(roll.bids[c], roll.ce)} /></td>
                      </Fragment>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )
      })}
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Sensitivity cases (all three shapes)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function SensitivityCasesPanel({ scenario }) {
  const cases = scenario.sensitivityCases || []
  const changed = cases.filter(c => c.changed)
  return (
    <>
      <AiStrip>
        <strong>AI sensitivity analysis complete.</strong> {cases.length} case{cases.length !== 1 ? 's' : ''} modelled.{' '}
        {changed.length === 0
          ? 'The outcome is unchanged in every case.'
          : `${changed.length} case${changed.length !== 1 ? 's change' : ' changes'} the outcome — see the flagged row${changed.length !== 1 ? 's' : ''} below.`}
      </AiStrip>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatTile label="Cases modelled" value={cases.length} />
        <StatTile label="Outcome unchanged" value={cases.length - changed.length} tone="green" />
        <StatTile label="Outcome changed" value={changed.length} tone={changed.length ? 'amber' : 'slate'} />
        <StatTile label="Verdict" value={changed.length === 0 ? 'Stable' : 'Review'} tone={changed.length === 0 ? 'green' : 'amber'}
          sub={changed.length === 0 ? 'The recommendation holds under every case.' : 'At least one case moves the recommendation.'} />
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcActivity} title="Sensitivity Analysis Cases" hint="Each case, its basis and whether the outcome moved" />
        <div className="divide-y divide-slate-50">
          {cases.map(c => (
            <div key={c.no} className={`px-4 py-3 ${c.changed ? 'bg-amber-50/50' : ''}`}>
              <div className="flex items-start gap-3">
                <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold
                  ${c.changed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-600'}`}>{c.no}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[12px] font-semibold text-slate-700">{c.title}</span>
                    {c.changed
                      ? <Badge variant="warning"><IcAlert size={10} /> Outcome changed</Badge>
                      : <Badge variant="compliant"><IcCheck size={10} /> No change in outcome</Badge>}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{c.basis}</p>
                  <p className="text-[11px] text-slate-600 mt-1.5 leading-relaxed border-l-2 border-slate-200 pl-2">{c.result}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Optimization / negotiation targets (competitive)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function OptimizationPanel({ scenario, picked, onToggle }) {
  const fmt = ceFormat(scenario.currency)
  const codes = scenario.bidders.map(b => b.code)
  const isComplex = scenario.type === 'competitive-complex'
  const t = isComplex ? complexTotals(scenario) : simpleTotals(scenario)
  const l1 = t.l1.code

  // Each named target is looked up in the live priced data so the percentages
  // in the negotiation list can never drift from the roll-up.
  const targets = (scenario.optimizationTargets || []).map(target => {
    let ce = null, bids = {}
    if (isComplex) {
      const node = findNode(scenario.rollup, target.ref)
      if (node) { ce = nodeCe(node); codes.forEach(c => { bids[c] = nodeBid(node, c) }) }
      return { ...target, label: node?.label || target.ref, ce, bids, l1Pct: ce ? pctOf(bids[l1], ce) : null }
    }
    const item = scenario.schedules.flatMap(s => s.items).find(i => String(i.no) === String(target.ref))
    if (item) { ce = item.qty * item.ceUnit; codes.forEach(c => { bids[c] = item.qty * item.bids[c] }) }
    return { ...target, label: item?.description || target.ref, ce, bids, l1Pct: ce ? pctOf(bids[l1], ce) : null }
  }).sort((a, b) => (b.ce || 0) - (a.ce || 0))

  const above = targets.filter(x => (x.l1Pct ?? 0) > 0)
  const pickedTargets = targets.filter(x => picked[x.ref])
  const exposure = pickedTargets.reduce((s, x) => s + Math.max(0, (x.bids[l1] || 0) - (x.ce || 0)), 0)

  return (
    <>
      <AiStrip>
        <strong>AI optimization scan complete.</strong> {targets.length} schedule{targets.length !== 1 ? 's' : ''} reviewed against the Company Estimate.
        {' '}{above.length} sit above the estimate for {l1} (L1) and are worth negotiating before contract sign-off.
      </AiStrip>

      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-xl">
        <IcHandshake size={14} className="text-violet-600 shrink-0 mt-0.5" />
        <span className="text-xs text-violet-800 leading-relaxed">{scenario.notes.optimization}</span>
      </div>

      {pickedTargets.length > 0 && (
        <Card className="p-4 border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Selected negotiation mandate</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt.money2(exposure)}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            total exposure above the Company Estimate across {pickedTargets.length} selected item{pickedTargets.length !== 1 ? 's' : ''} — the value on the table with {l1}.
          </p>
        </Card>
      )}

      <Card className="overflow-hidden">
        <PanelHead icon={IcTarget} title="Optimization / Negotiation Opportunity"
          hint={`Ranked by Company Estimate value · L1 is ${l1}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="text-left px-4 py-2.5 text-xs font-semibold">Ref</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-56">Description</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold">Co. Est total</th>
                {codes.map(c => <th key={c} className="text-right px-2.5 py-2.5 text-xs font-semibold">{c} vs CE</th>)}
                <th className="text-right px-2.5 py-2.5 text-xs font-semibold">L1 diff to L2</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-72">Remarks</th>
                <th className="text-center px-3 py-2.5 text-xs font-semibold min-w-24">Pursue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {targets.map(x => {
                const on = !!picked[x.ref]
                return (
                  <tr key={x.ref} className={`hover:bg-slate-50/50 align-top ${on ? 'bg-emerald-50/40' : x.critical ? 'bg-red-50/30' : ''}`}>
                    <td className="px-4 py-2.5 text-[11px] font-mono text-slate-500">{x.ref}</td>
                    <td className="px-3 py-2.5 text-slate-700">
                      {x.label}
                      {x.critical && <Chip tone="red" className="ml-2">Critical</Chip>}
                    </td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{fmt.money2(x.ce)}</td>
                    {codes.map(c => (
                      <td key={c} className="px-2.5 py-2.5 text-right">
                        <VarPct value={x.ce ? pctOf(x.bids[c], x.ce) : null} />
                      </td>
                    ))}
                    <td className="px-2.5 py-2.5 text-right font-semibold text-slate-600">{x.gapPct}%</td>
                    <td className="px-3 py-2.5 text-[11px] text-slate-500 leading-relaxed">{x.remark}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => onToggle(x.ref)}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors
                          ${on ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>
                        {on ? <><IcCheck size={11} /> Selected</> : 'Select'}
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SINGLE SOURCE — step 4: CE optimization & re-baselining
 * ═══════════════════════════════════════════════════════════════════════════ */

export function CeOptimizationPanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const o = scenario.ceOptimization
  const t = singleSourceTotals(scenario)
  const saving = o.approved - o.optimized
  return (
    <>
      <AiStrip>
        <strong>AI Company Estimate optimization complete.</strong> The TB-approved estimate of {fmt.money2(o.approved)} for 14 days was
        re-baselined to <strong>{fmt.money2(o.optimized)}</strong> for 7 days including a partial de-scope — a reduction of {fmt.money2(saving)}.
        This optimized figure is the only basis the offer is compared against.
      </AiStrip>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatTile label={o.approvedLabel} value={fmt.money2(o.approved)} sub="As endorsed by the Tender Board" />
        <StatTile label="Re-baselining reduction" value={`− ${fmt.money2(saving)}`} tone="green"
          sub={`${((saving / o.approved) * 100).toFixed(1)}% off the approved estimate`} />
        <StatTile label={o.optimizedLabel} value={fmt.money2(o.optimized)} tone="primary" ring
          sub={`Derived from the priced schedules — ${fmt.money2(t.ce)}`} />
      </div>

      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <IcInfo size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <span className="text-xs text-slate-600 leading-relaxed">
          <strong>Reference basis.</strong> {o.reference}
        </span>
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcRefresh} title="CE Optimization & De-Scope Register" hint={`${o.items.length} adjustments`} />
        <div className="divide-y divide-slate-50">
          {o.items.map((it, i) => {
            const meta = EFFECT_META[it.effect] || EFFECT_META.normalize
            const Icon = meta.Icon
            return (
              <div key={i} className="px-4 py-3 flex items-start gap-3">
                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                  <Icon size={12} className="text-slate-500" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {it.ref !== '—' && <span className="text-[10px] font-mono font-bold text-[var(--color-primary)]">{it.ref}</span>}
                    <span className="text-[12px] font-semibold text-slate-700">{it.title}</span>
                    <Chip tone={meta.tone}>{meta.label}</Chip>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{it.detail}</p>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SINGLE SOURCE — step 5: negotiation rounds
 * There is deliberately no ranking, no L1/L2 and no bidder-vs-bidder table
 * here: with one bidder the axis of comparison is time, not competitors.
 * ═══════════════════════════════════════════════════════════════════════════ */

export function NegotiationRoundsPanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const t = singleSourceTotals(scenario)
  const rounds = scenario.rounds
  const first = t.rounds[rounds[0].id]
  const barMax = Math.max(t.ce, ...rounds.map(r => t.rounds[r.id].total))
  const [open, setOpen] = useState(scenario.schedules.map(s => s.id))
  const toggle = (id) => setOpen(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])

  return (
    <>
      <AiStrip>
        <strong>AI negotiation round comparison complete.</strong> Single source — there is no L1 / L2 ranking.
        The offer moved from {fmt.pct(first.pct, 0)} against the Company Estimate at the initial submission
        to <strong>{fmt.pct(t.final.pct, 0)}</strong> after {rounds.length - 1} rounds of negotiation.
      </AiStrip>

      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl">
        <IcInfo size={14} className="text-amber-600 shrink-0 mt-0.5" />
        <span className="text-xs text-amber-800 leading-relaxed">
          <strong>Single source evaluation.</strong> {scenario.bidder.name} is the only bidder, so no ranking, no L1 / L2 designation and no
          multi-bidder price comparison applies. Value is evidenced through the negotiation rounds below and the external rate benchmarking in the next step.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label={scenario.ceLabel} value={fmt.money2(t.ce)} sub={scenario.duration} />
        {rounds.map((r, i) => {
          const v = t.rounds[r.id]
          return (
            <StatTile key={r.id} label={r.label} value={fmt.money2(v.total)}
              ring={i === rounds.length - 1}
              tone={v.pct <= 0 ? 'green' : 'amber'}
              sub={`${v.pct > 0 ? '+' : ''}${v.pct.toFixed(0)}% against the Company Estimate · ${r.sublabel}`} />
          )
        })}
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcHandshake} title="Negotiation Progression" hint="Movement of the offer across the rounds" />
        <div className="p-4 space-y-2">
          {rounds.map((r, i) => {
            const v = t.rounds[r.id]
            const prev = i > 0 ? t.rounds[rounds[i - 1].id] : null
            const move = prev ? v.total - prev.total : null
            return (
              <div key={r.id} className="flex items-center gap-3 flex-wrap">
                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-[10px] font-bold text-slate-500">{i + 1}</span>
                <div className="min-w-40">
                  <p className="text-[12px] font-semibold text-slate-700">{r.label}</p>
                  <p className="text-[10px] text-slate-400">{r.sublabel}</p>
                </div>
                <div className="flex-1 min-w-32 h-2 rounded-full bg-slate-100 overflow-hidden">
                  <span className={`block h-full rounded-full ${v.pct <= 0 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                    style={{ width: `${Math.min(100, (v.total / barMax) * 100)}%` }} />
                </div>
                <span className="text-[12px] font-semibold text-slate-700 w-32 text-right">{fmt.money2(v.total)}</span>
                <span className="w-16 text-right"><VarPct value={v.pct} /></span>
                <span className="w-32 text-right text-[11px] text-slate-400">
                  {move == null ? 'baseline offer' : `${move <= 0 ? '−' : '+'}${fmt.money2(Math.abs(move))} on the round`}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      {scenario.schedules.map(sc => {
        const roll = t.schedules.find(x => x.id === sc.id)
        const isOpen = open.includes(sc.id)
        return (
          <Card key={sc.id} className="overflow-hidden">
            <PanelHead icon={IcLayers} title={sc.name}
              hint={`${sc.items.length} lines${sc.partialDescope ? ' · partial de-scope' : ''}`}
              action={
                <button onClick={() => toggle(sc.id)} className="text-[11px] font-semibold text-slate-500 hover:text-slate-700">
                  {isOpen ? 'Hide lines' : 'Show lines'}
                </button>
              } />
            {isOpen && (
              <div className="overflow-x-auto">
                <table className="w-full text-[12px] border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                      <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-72">S/N &amp; description</th>
                      <th rowSpan={2} className="text-center px-2 py-2 font-semibold">UOM</th>
                      <th rowSpan={2} className="text-right px-2 py-2 font-semibold">Qty</th>
                      <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200 bg-slate-100/60">{scenario.ceLabel}</th>
                      {rounds.map(r => (
                        <th key={r.id} colSpan={3} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">{r.label}</th>
                      ))}
                    </tr>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                      <th className="text-right px-2 py-1.5 border-l border-slate-200 bg-slate-100/60">Unit</th>
                      <th className="text-right px-2 py-1.5 bg-slate-100/60">Total</th>
                      {rounds.map(r => (
                        <Fragment key={r.id}>
                          <th className="text-right px-2 py-1.5 border-l border-slate-200">Unit</th>
                          <th className="text-right px-2 py-1.5">Total</th>
                          <th className="text-right px-2 py-1.5">% vs CE</th>
                        </Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sc.items.map(it => {
                      const ceT = t.lineCe(it)
                      return (
                        <tr key={it.ref} className={`border-b border-slate-50 hover:bg-slate-50/40 ${it.descoped ? 'opacity-70 bg-red-50/30' : ''}`}>
                          <td className="px-3 py-2 sticky left-0 bg-white align-top">
                            <span className="text-[10px] font-mono text-slate-400 mr-2">{it.ref}</span>
                            <span className={`text-slate-700 ${it.descoped ? 'line-through' : ''}`}>{it.description}</span>
                            <span className="ml-2 inline-flex gap-1">
                              {it.descoped && <Chip tone="red">De-scoped</Chip>}
                              {it.deviation && <Chip tone="amber">Deviation</Chip>}
                            </span>
                          </td>
                          <td className="px-2 py-2 text-center text-slate-500 align-top">{it.uom}</td>
                          <td className="px-2 py-2 text-right text-slate-500 align-top">{it.qty}</td>
                          <td className="px-2 py-2 text-right border-l border-slate-100 bg-slate-50/40 text-slate-600 align-top">
                            {it.ceUnit == null ? <span className="text-slate-300">—</span> : fmt.rate(it.ceUnit, 2)}
                          </td>
                          <td className="px-2 py-2 text-right bg-slate-50/40 font-medium text-slate-700 align-top">
                            {ceT == null ? <span className="text-slate-300">—</span> : fmt.money2(ceT)}
                          </td>
                          {rounds.map(r => {
                            const cell = it.bids[r.id]
                            const amt = bidAmount(cell)
                            const st = bidState(cell)
                            const bt = t.lineBid(it, r.id)
                            return (
                              <Fragment key={r.id}>
                                <td className="px-2 py-2 text-right border-l border-slate-100 text-slate-600 align-top">
                                  {amt == null ? <StateTag state={st} compact /> : fmt.rate(amt, 2)}
                                </td>
                                <td className="px-2 py-2 text-right text-slate-700 align-top">
                                  {bt == null ? <span className="text-slate-300">n/a</span> : fmt.money2(bt)}
                                </td>
                                <td className="px-2 py-2 text-right align-top">
                                  {bt == null || !ceT ? <span className="text-slate-300">—</span> : <VarPct value={pctOf(bt, ceT)} />}
                                </td>
                              </Fragment>
                            )
                          })}
                        </tr>
                      )
                    })}
                    <tr className="bg-slate-50 border-y border-slate-200 font-semibold text-slate-700">
                      <td colSpan={3} className="px-3 py-2 text-[11px] uppercase">Schedule total</td>
                      <td className="border-l border-slate-200 bg-slate-100/50" />
                      <td className="px-2 py-2 text-right bg-slate-100/50">{fmt.money2(roll.ce)}</td>
                      {rounds.map(r => (
                        <Fragment key={r.id}>
                          <td className="border-l border-slate-200" />
                          <td className="px-2 py-2 text-right">{fmt.money2(roll.rounds[r.id])}</td>
                          <td className="px-2 py-2 text-right"><VarPct value={pctOf(roll.rounds[r.id], roll.ce)} /></td>
                        </Fragment>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        )
      })}

      <Card className="overflow-hidden">
        <PanelHead icon={IcInfo} title="Non-Numeric Bid States" hint="How each state is treated in the totals" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          {['included', 'not_quoted', 'deviation', 'descoped'].map(k => {
            const st = bidState(k)
            return (
              <div key={k} className="px-4 py-3">
                <StateTag state={st} />
                <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{st.hint}</p>
                <p className="text-[10px] text-slate-400 mt-1">Excluded from the total — not valued at nil.</p>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SINGLE SOURCE — step 6: external rate benchmarking (+ sensitivity)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function BenchmarkPanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const b = scenario.benchmark
  return (
    <>
      <AiStrip>
        <strong>AI benchmarking complete.</strong> With no second bidder to rank against, {b.rows.length} priced line{b.rows.length !== 1 ? 's were' : ' was'} tested
        against {b.sources.length} external rate sources converted to {fmt.code}, plus the previous similar contract {b.priorContract}.
      </AiStrip>

      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
        <IcGlobe size={14} className="text-slate-400 shrink-0 mt-0.5" />
        <span className="text-xs text-slate-600 leading-relaxed">{b.note}</span>
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcScale} title={b.title} hint={`Prior contract reference ${b.priorContract}`} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th rowSpan={2} className="text-left px-3 py-2 font-semibold sticky left-0 bg-slate-50 min-w-72">S/N &amp; description</th>
                <th rowSpan={2} className="text-left px-2 py-2 font-semibold min-w-32">UOM</th>
                <th rowSpan={2} className="text-right px-2 py-2 font-semibold">Qty</th>
                <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200 bg-slate-100/60">Bidder (SOS)</th>
                {b.sources.map(s => (
                  <th key={s.id} colSpan={3} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">
                    {s.label}<span className="block text-[9px] font-normal text-slate-400">{s.hint}</span>
                  </th>
                ))}
              </tr>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                <th className="text-right px-2 py-1.5 border-l border-slate-200 bg-slate-100/60">Unit</th>
                <th className="text-right px-2 py-1.5 bg-slate-100/60">Total</th>
                {b.sources.map(s => (
                  <Fragment key={s.id}>
                    <th className="text-right px-2 py-1.5 border-l border-slate-200">Unit</th>
                    <th className="text-right px-2 py-1.5">Total</th>
                    <th className="text-right px-2 py-1.5">% vs SOS</th>
                  </Fragment>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {b.rows.map(r => {
                const sosTotal = r.sosUnit * r.qty
                return (
                  <tr key={r.ref} className="hover:bg-slate-50/40">
                    <td className="px-3 py-2.5 sticky left-0 bg-white align-top">
                      <span className="text-[10px] font-mono text-slate-400 mr-2">{r.ref}</span>
                      <span className="text-slate-700">{r.description}</span>
                    </td>
                    <td className="px-2 py-2.5 text-slate-500 align-top">{r.uom}</td>
                    <td className="px-2 py-2.5 text-right text-slate-500 align-top">{r.qty}</td>
                    <td className="px-2 py-2.5 text-right border-l border-slate-100 bg-slate-50/40 text-slate-600 align-top">{fmt.rate(r.sosUnit, 2)}</td>
                    <td className="px-2 py-2.5 text-right bg-slate-50/40 font-medium text-slate-700 align-top">{fmt.money2(sosTotal)}</td>
                    {b.sources.map(s => {
                      const u = r.rates[s.id]
                      const total = u * r.qty
                      return (
                        <Fragment key={s.id}>
                          <td className="px-2 py-2.5 text-right border-l border-slate-100 text-slate-600 align-top">{fmt.rate(u, 2)}</td>
                          <td className="px-2 py-2.5 text-right text-slate-700 align-top">{fmt.money2(total)}</td>
                          <td className="px-2 py-2.5 text-right align-top"><VarPct value={pctOf(total, sosTotal)} /></td>
                        </Fragment>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-amber-50/60 flex items-start gap-2">
          <IcAlert size={13} className="text-amber-600 shrink-0 mt-0.5" />
          <span className="text-[11px] text-amber-800 leading-relaxed">{b.conclusion}</span>
        </div>
      </Card>

      <SensitivityCasesPanel scenario={scenario} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SINGLE SOURCE — step 7: scope merge option
 * ═══════════════════════════════════════════════════════════════════════════ */

export function ScopeMergePanel({ scenario }) {
  const fmt = ceFormat(scenario.currency)
  const m = scenario.scopeMerge
  const t = singleSourceTotals(scenario)
  const ceMerged = m.rows.reduce((s, r) => s + r.ceMerged, 0)
  const bidMerged = m.rows.reduce((s, r) => s + r.bidMerged, 0)
  const singleSaving = (t.final.total * 2) - bidMerged

  return (
    <>
      <AiStrip>
        <strong>AI scope-merge modelling complete.</strong> Combining the Train-3 and Train-2 scopes puts the Company Estimate at {fmt.money2(ceMerged)}
        {' '}against a bidder total of <strong>{fmt.money2(bidMerged)}</strong> — {fmt.pct(pctOf(bidMerged, ceMerged), 0)} against the Company Estimate.
      </AiStrip>

      <div className="flex items-start gap-2.5 px-4 py-2.5 bg-violet-50 border border-violet-200 rounded-xl">
        <IcMerge size={14} className="text-violet-600 shrink-0 mt-0.5" />
        <span className="text-xs text-violet-800 leading-relaxed">
          <strong>TB endorsed the strategy amendment on {m.endorsedOn}.</strong> {m.background}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatTile label="CE — single scope (Tr-3)" value={fmt.money2(t.ce)} sub={scenario.duration} />
        <StatTile label="CE — merged scope (Tr-2 & Tr-3)" value={fmt.money2(ceMerged)} sub="Two shutdown windows" />
        <StatTile label="Bidder — merged scope" value={fmt.money2(bidMerged)} tone="green" ring
          sub={`${pctOf(bidMerged, ceMerged).toFixed(0)}% against the Company Estimate`} />
        <StatTile label="Volume-leverage credit" value={`− ${fmt.money2(singleSaving)}`} tone="green"
          sub="Against simply doubling the 2nd-round single-scope offer" />
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcMerge} title={m.title} hint="Company Estimate and bidder rates restated for two trains" />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px] border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th rowSpan={2} className="text-left px-3 py-2 font-semibold min-w-72">S/N &amp; description</th>
                <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200 bg-slate-100/60">{scenario.ceLabel}</th>
                <th colSpan={2} className="text-center px-2 py-1.5 font-semibold border-l border-slate-200">Bidder rate ({fmt.code})</th>
                <th rowSpan={2} className="text-right px-3 py-2 font-semibold border-l border-slate-200">% against CE</th>
              </tr>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wide">
                <th className="text-right px-2 py-1.5 border-l border-slate-200 bg-slate-100/60">CE revised</th>
                <th className="text-right px-2 py-1.5 bg-slate-100/60">CE revised for 2 trains</th>
                <th className="text-right px-2 py-1.5 border-l border-slate-200">Bidder</th>
                <th className="text-right px-2 py-1.5">Bidder revised for 2 trains</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {m.rows.map(r => (
                <tr key={r.id} className="hover:bg-slate-50/40">
                  <td className="px-3 py-2.5">
                    <span className="text-[10px] font-mono text-slate-400 mr-2">{r.id}</span>
                    <span className="text-slate-700">{r.name}</span>
                  </td>
                  <td className="px-2 py-2.5 text-right border-l border-slate-100 bg-slate-50/40 text-slate-600">{fmt.money2(r.ceSingle)}</td>
                  <td className="px-2 py-2.5 text-right bg-slate-50/40 font-medium text-slate-700">{fmt.money2(r.ceMerged)}</td>
                  <td className="px-2 py-2.5 text-right border-l border-slate-100 text-slate-600">{fmt.money2(r.bidSingle)}</td>
                  <td className="px-2 py-2.5 text-right text-slate-700">{fmt.money2(r.bidMerged)}</td>
                  <td className="px-3 py-2.5 text-right border-l border-slate-100"><VarPct value={pctOf(r.bidMerged, r.ceMerged)} /></td>
                </tr>
              ))}
              <tr className="bg-[var(--color-primary)]/10 border-t-2 border-[var(--color-primary)]/30 font-bold text-slate-800">
                <td className="px-3 py-3 uppercase text-xs">Total</td>
                <td className="px-2 py-3 text-right border-l border-slate-200">{fmt.money2(t.ce)}</td>
                <td className="px-2 py-3 text-right">{fmt.money2(ceMerged)}</td>
                <td className="px-2 py-3 text-right border-l border-slate-200">{fmt.money2(t.final.total)}</td>
                <td className="px-2 py-3 text-right">{fmt.money2(bidMerged)}</td>
                <td className="px-3 py-3 text-right border-l border-slate-200"><VarPct value={pctOf(bidMerged, ceMerged)} /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-start gap-2">
          <IcInfo size={13} className="text-slate-400 shrink-0 mt-0.5" />
          <span className="text-[11px] text-slate-600 leading-relaxed">{m.conclusion}</span>
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
 * STEP 9 — Tender Board submission (all three shapes)
 * ═══════════════════════════════════════════════════════════════════════════ */

export function TenderBoardPanel({ scenario, summary, note, onNote }) {
  const fmt = ceFormat(scenario.currency)
  const a = scenario.award
  const n = scenario.notes
  const ranked = summary.ranked

  return (
    <>
      <AiStrip>
        <strong>AI consolidation complete.</strong> The structured note blocks, the tender-specific commercial model criteria and the award
        recommendation are assembled for the Tender Board submission.
      </AiStrip>

      <Card className="p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50/70 to-white">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0"><IcAward size={20} className="text-emerald-600" /></div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-slate-800">Award recommendation — <span className="text-emerald-700">{a.awardeeName}</span></p>
              <Badge variant={ranked ? 'success' : 'warning'}>{ranked ? 'L1 · lowest evaluated total' : 'Single source'}</Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{a.text}</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-emerald-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div><p className="text-[10px] uppercase font-semibold text-slate-400">Awardee</p><p className="text-[13px] font-bold text-slate-800">{a.awardeeName}</p></div>
          <div><p className="text-[10px] uppercase font-semibold text-slate-400">Duration</p><p className="text-[13px] font-bold text-slate-800">{a.duration}</p></div>
          <div><p className="text-[10px] uppercase font-semibold text-slate-400">{a.valueLabel}</p><p className="text-[13px] font-bold text-slate-800">{fmt.money2(a.value)}</p></div>
          <div><p className="text-[10px] uppercase font-semibold text-slate-400">{a.acvLabel}</p><p className="text-[13px] font-bold text-[var(--color-primary)]">{fmt.money2(a.acv)}</p></div>
        </div>
        {a.conditions?.length > 0 && (
          <ul className="mt-3 pt-3 border-t border-emerald-100 space-y-1">
            {a.conditions.map((c, i) => (
              <li key={i} className="text-[11px] text-slate-600 flex items-start gap-1.5">
                <IcCheck size={11} className="text-emerald-500 shrink-0 mt-0.5" /> {c}
              </li>
            ))}
          </ul>
        )}
        <textarea value={note} onChange={e => onNote(e.target.value)} rows={2}
          placeholder="Optional note to Supply Chain on this recommendation…"
          className="mt-3 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 resize-none" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <NoteBlock letter="A" title="Background" tone="primary">{n.background}</NoteBlock>
        <NoteBlock letter="B" title="CE Adjustment & Normalization" tone="primary">{n.ceAdjustment}</NoteBlock>
        <NoteBlock letter="C" title="Evaluation & Result" tone="primary">{n.evaluation}</NoteBlock>
        <NoteBlock letter="D" title="Commercial Clarifications" tone="primary">{n.clarifications}</NoteBlock>
        <NoteBlock letter="E" title="Sensitivity Analysis" tone="primary">{n.sensitivity}</NoteBlock>
        <NoteBlock letter="F" title="Optimization / Negotiation Opportunity" tone="primary">{n.optimization}</NoteBlock>
      </div>

      <Card className="overflow-hidden">
        <PanelHead icon={IcFile} title="G · Tender-Specific Commercial Model"
          hint="TB-endorsed criteria, each marked applicable or not applicable with the reason" />
        <div className="divide-y divide-slate-50">
          {scenario.commercialModel.map((c, i) => (
            <div key={i} className="px-4 py-3 flex items-start gap-3">
              <span className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0
                ${c.applicable ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                {c.applicable ? <IcCheck size={12} /> : <IcX size={12} />}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[12px] font-semibold text-slate-700">{String.fromCharCode(97 + i)}) {c.criterion}</span>
                  <Badge variant={c.applicable ? 'compliant' : 'closed'}>{c.applicable ? 'Applicable' : 'Not applicable'}</Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{c.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="overflow-hidden">
        <PanelHead icon={IcAward} title={ranked ? 'H · Evaluated Total Ranking' : 'H · Negotiated Position'}
          hint={ranked ? 'Lowest evaluated total wins — L1 / L2' : 'Single source — movement against the optimized Company Estimate'} />
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="text-left px-4 py-2.5 text-xs font-semibold">{ranked ? 'Rank' : 'Round'}</th>
                <th className="text-left px-3 py-2.5 text-xs font-semibold min-w-52">{ranked ? 'Bidder' : 'Submission'}</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold">{scenario.ceLabel}</th>
                <th className="text-right px-3 py-2.5 text-xs font-semibold">Evaluated total</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold">% against CE</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {ranked
                ? summary.totals.ranked.map((r, i) => (
                    <tr key={r.code} className={i === 0 ? 'bg-emerald-50/50' : ''}>
                      <td className="px-4 py-2.5 text-[12px] font-bold text-slate-500">
                        {i === 0 ? 'L1' : i === 1 ? 'L2' : `#${i + 1}`}
                      </td>
                      <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-700">
                        {scenario.bidders.find(b => b.code === r.code)?.name || r.code}
                        {r.code === a.awardeeCode && <Badge variant="success" className="ml-2">Recommended</Badge>}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-500">{fmt.money2(summary.totals.ce)}</td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmt.money2(r.total)}</td>
                      <td className="px-4 py-2.5 text-right"><VarPct value={r.pct} /></td>
                    </tr>
                  ))
                : scenario.rounds.map((r, i) => {
                    const v = summary.totals.rounds[r.id]
                    const last = i === scenario.rounds.length - 1
                    return (
                      <tr key={r.id} className={last ? 'bg-emerald-50/50' : ''}>
                        <td className="px-4 py-2.5 text-[12px] font-bold text-slate-500">{i + 1}</td>
                        <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-700">
                          {r.label}
                          {last && <Badge variant="success" className="ml-2">Recommended</Badge>}
                        </td>
                        <td className="px-3 py-2.5 text-right text-slate-500">{fmt.money2(summary.totals.ce)}</td>
                        <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmt.money2(v.total)}</td>
                        <td className="px-4 py-2.5 text-right"><VarPct value={v.pct} /></td>
                      </tr>
                    )
                  })}
              {!ranked && scenario.scopeMerge && (
                <tr className="bg-violet-50/50">
                  <td className="px-4 py-2.5 text-[12px] font-bold text-slate-500">＋</td>
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-700">
                    Scope merge option (Tr-2 &amp; Tr-3)
                    <Badge variant="success" className="ml-2">Awarded basis</Badge>
                  </td>
                  <td className="px-3 py-2.5 text-right text-slate-500">{fmt.money2(scenario.scopeMerge.ceTotal)}</td>
                  <td className="px-3 py-2.5 text-right font-bold text-slate-800">{fmt.money2(scenario.scopeMerge.bidTotal)}</td>
                  <td className="px-4 py-2.5 text-right"><VarPct value={pctOf(scenario.scopeMerge.bidTotal, scenario.scopeMerge.ceTotal)} /></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* Small header badge used by the page to declare the evaluation shape. */
export function EvaluationTypeBadge({ meta }) {
  if (!meta) return null
  return (
    <span title={meta.hint}
      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap
        ${meta.ranked ? 'bg-violet-50 text-violet-700 ring-1 ring-violet-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'}`}>
      {meta.ranked ? <IcScale size={10} /> : <IcMinus size={10} />} {meta.short}
    </span>
  )
}
