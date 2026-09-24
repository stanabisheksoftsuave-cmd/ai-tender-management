import { useState } from 'react'
import Card from '../ui/Card'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import SearchableSelect from '../ui/SearchableSelect'
import { openHtmlDoc, deliverableDoc, esc } from '../../utils/docGen'
import { computeChangeImpact } from '../../utils/awardPackage'

// ── Inline SVG icons (matching the rest of the app) ──────────────────────────
const Svg = ({ size = 16, sw = 1.6, style, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const CheckCircle = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></Svg>
const XCircle      = p => <Svg {...p}><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></Svg>
const GitBranch    = p => <Svg {...p}><line x1="6" y1="3" x2="6" y2="15" /><circle cx="18" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path d="M18 9a9 9 0 0 1-9 9" /></Svg>
const FileText     = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></Svg>
const Plus         = p => <Svg {...p}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></Svg>
const TrendingUp   = p => <Svg {...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></Svg>
const TrendingDown = p => <Svg {...p}><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></Svg>
const Minus        = p => <Svg {...p}><line x1="5" y1="12" x2="19" y2="12" /></Svg>
const Download     = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Svg>

const TRIGGERS = [
  { id: 'initial',       label: 'Initial' },
  { id: 'clarification', label: 'After Clarification' },
  { id: 'negotiation',   label: 'After Negotiation' },
  { id: 'other',         label: 'Other' },
]

const H5_DELIVERABLES = [
  { key: 'executive',      title: 'Executive Recommendation Summary' },
  { key: 'evalReport',     title: 'Commercial Evaluation Report' },
  { key: 'deviationReg',   title: 'Commercial Deviation Register' },
  { key: 'clarificationReg', title: 'Clarification Register' },
  { key: 'negotiationOut', title: 'Negotiation Outcome Report' },
  { key: 'riskReg',        title: 'Risk Register' },
  { key: 'sensitivityRep', title: 'Sensitivity Analysis Report' },
  { key: 'endorsement',    title: 'Endorsement Paper' },
  { key: 'tenderBoard',    title: 'Tender Board Presentation Pack' },
]

function GateRow({ label, ok }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      {ok
        ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
        : <XCircle size={14} className="text-slate-300 shrink-0" />}
      <span className={`text-xs ${ok ? 'text-slate-700' : 'text-slate-400'}`}>{label}</span>
    </div>
  )
}

/**
 * The H.3/H.4/H.5 award-package surface — Draft Award Recommendation
 * versioning with Change Impact Analysis (H.3), the completion gate
 * checklist (H.4), and the nine generated deliverables (H.5). Shared by both
 * the generic nine-step flow and the priced-scenario flow's own award step,
 * so it takes its inputs as plain props rather than reading page state.
 */
export default function AwardPackagePanel({
  tender, tenderId, updateTender, tenderTitle,
  gates, ranking, excluded = [], recommendedBidder, fmtMoney,
  deviations = [], exceptions = [], risks = [], clarifications = [],
  negotiationSavings = null, sensitivity = null, note = '',
}) {
  const [trigger, setTrigger] = useState('initial')
  const history = tender?.commercialDarHistory || []

  const snapshot = () => ranking.map(r => ({ id: r.id, name: r.name, evaluated: r.evaluated }))

  const generateDraft = () => {
    const prev = history[history.length - 1]
    const entry = {
      no: history.length + 1,
      at: new Date().toISOString(),
      trigger,
      status: 'Draft',
      ranking: snapshot(),
      excluded: excluded.map(b => ({ id: b.id, name: b.name })),
      recommendedBidderId: recommendedBidder?.id ?? null,
      changeImpact: computeChangeImpact(prev?.ranking, snapshot(), fmtMoney),
    }
    updateTender(tenderId, { commercialDarHistory: [...history, entry] })
  }

  const gatesOk = gates.every(g => g.ok)
  const openClarificationCount = clarifications.filter(c => c.status !== 'closed').length

  const buildDoc = (key) => {
    const rankingRows = ranking.map((r, i) => `<tr><td>#${i + 1}</td><td>${esc(r.name)}</td><td style="text-align:right">${esc(fmtMoney(r.evaluated))}</td></tr>`).join('')
    const rankingTable = `<table style="width:100%;border-collapse:collapse;font-size:13px" cellpadding="6">
      <thead><tr style="text-align:left;color:#64748b"><th>Rank</th><th>Bidder</th><th style="text-align:right">Evaluated</th></tr></thead>
      <tbody>${rankingRows}</tbody></table>`
    const meta = [
      { label: 'Recommended', value: recommendedBidder?.name || '—' },
      { label: 'H.4 Gates', value: gatesOk ? 'All closed' : 'Outstanding items remain' },
      { label: 'Draft Award Recommendations', value: String(history.length) },
    ]
    switch (key) {
      case 'executive':
        return deliverableDoc({
          title: 'Executive Recommendation Summary', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [{ heading: 'Recommendation', bodyHtml: `<p>${esc(recommendedBidder?.name || 'No recommendation recorded yet')} is recommended for award.${note ? ` Evaluator's note: “${esc(note)}”` : ''}</p>${rankingTable}` }],
        })
      case 'evalReport':
        return deliverableDoc({
          title: 'Commercial Evaluation Report', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [
            { heading: 'Consolidated Ranking', bodyHtml: rankingTable },
            { heading: 'Excluded Bidders', bodyHtml: excluded.length ? `<ul>${excluded.map(b => `<li>${esc(b.name)}</li>`).join('')}</ul>` : '<p>None.</p>' },
          ],
        })
      case 'deviationReg':
        return deliverableDoc({
          title: 'Commercial Deviation Register', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [{ heading: 'Deviations & Exceptions', bodyHtml: (deviations.length + exceptions.length) ? `<ul>${[...deviations, ...exceptions].map(d => `<li><b>${esc(d.bidderName)}</b> — ${esc(d.item)}${d.note ? `: ${esc(d.note)}` : ''}</li>`).join('')}</ul>` : '<p>No deviations or exceptions recorded.</p>' }],
        })
      case 'clarificationReg':
        return deliverableDoc({
          title: 'Clarification Register', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [{ heading: `Clarifications (${clarifications.length}, ${openClarificationCount} open)`, bodyHtml: clarifications.length ? `<ul>${clarifications.map(c => `<li><b>${esc(c.ref)}</b> — ${esc(c.bidderName)} · ${esc(c.subject)} · ${esc(c.status)}</li>`).join('')}</ul>` : '<p>No clarifications were raised.</p>' }],
        })
      case 'negotiationOut':
        return deliverableDoc({
          title: 'Negotiation Outcome Report', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [{ heading: 'Outcome', bodyHtml: negotiationSavings != null ? `<p>Indicative savings identified: <b>${esc(fmtMoney(negotiationSavings))}</b>.</p>` : '<p>Negotiation was not applicable to this tender.</p>' }],
        })
      case 'riskReg':
        return deliverableDoc({
          title: 'Risk Register', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [{ heading: `Commercial Risks (${risks.length})`, bodyHtml: risks.length ? `<ul>${risks.map(k => `<li><b>${esc(k.bidderName || '')}</b> — ${esc(k.risk)} (${esc(k.rating)}, ${esc(k.impact)}): ${esc(k.detail || '')} <i>Mitigation: ${esc(k.mitigation || '—')}</i></li>`).join('')}</ul>` : '<p>No material risks recorded.</p>' }],
        })
      case 'sensitivityRep':
        return deliverableDoc({
          title: 'Sensitivity Analysis Report', kicker: 'H.5 · Commercial Evaluation', tenderId, tenderTitle, meta,
          sections: [{ heading: 'Ranking Stability', bodyHtml: sensitivity ? `<p>Stability: <b>${esc(sensitivity.label)}</b> — the top-ranked bidder held across ${esc(sensitivity.heldPct)}% of tested scenarios.${sensitivity.flips ? ` ${esc(sensitivity.flips)} scenario(s) flipped the leader.` : ''}</p>` : '<p>Sensitivity analysis was not applicable to this tender.</p>' }],
        })
      case 'endorsement':
        return deliverableDoc({
          title: 'Endorsement Paper', kicker: 'H.5 · H.6 Closing Statement', tenderId, tenderTitle, meta,
          sections: [{ heading: 'Closing Statement to the Endorsing Body', bodyHtml: `<p>The commercial evaluation of ${esc(tenderTitle || tenderId)} is complete. ${gatesOk ? 'All H.4 completion gates are closed and the ranking is ready for endorsement.' : 'Outstanding H.4 gate items remain — see the completion checklist before endorsement.'}</p>${rankingTable}` }],
        })
      case 'tenderBoard':
        return deliverableDoc({
          title: 'Tender Board Presentation Pack', kicker: 'H.5 · For the Endorsing Body / Tender Board', tenderId, tenderTitle, meta,
          sections: [
            { heading: 'Recommendation', bodyHtml: `<p>${esc(recommendedBidder?.name || '—')}</p>` },
            { heading: 'Ranking', bodyHtml: rankingTable },
            { heading: 'Draft Award Recommendation History', bodyHtml: history.length ? `<ul>${history.map(h => `<li>DAR-${String(h.no).padStart(2, '0')} — ${esc(h.trigger)} — ${new Date(h.at).toLocaleString('en-GB')}</li>`).join('')}</ul>` : '<p>No drafts generated yet.</p>' },
          ],
        })
      default:
        return null
    }
  }

  const openDeliverable = (key) => {
    const doc = buildDoc(key)
    if (doc) openHtmlDoc(doc.title, doc.content)
  }

  return (
    <>
      {/* H.4 — completion gates */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">H.4 — Completion Gates</h3>
          <Badge variant={gatesOk ? 'compliant' : 'warning'}>{gatesOk ? 'All closed' : 'Outstanding'}</Badge>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {gates.map(g => <GateRow key={g.key} label={g.label} ok={g.ok} />)}
        </div>
      </Card>

      {/* H.3 — Draft Award Recommendation lifecycle */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-[var(--color-primary)]" />
            <h3 className="text-sm font-semibold text-slate-800">Draft Award Recommendations</h3>
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 160 }}>
              <SearchableSelect
                value={trigger} onChange={v => setTrigger(v)}
                options={TRIGGERS}
                getValue={t => t.id} getLabel={t => t.label}
                searchable={false}
                ariaLabel="Draft trigger"
              />
            </div>
            <Button size="sm" variant="secondary" onClick={generateDraft}><Plus size={12} /> Generate Draft</Button>
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          {history.length === 0 ? (
            <p className="px-4 py-4 text-xs text-slate-400">No drafts generated yet — each draft is a stored, version-controlled snapshot of the ranking at that point, with a machine-computed Change Impact Analysis against the one before it.</p>
          ) : (
            [...history].reverse().map(h => (
              <div key={h.no} className="px-4 py-3.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)]">DAR-{String(h.no).padStart(2, '0')}</span>
                  <Badge variant={h.status === 'Final' ? 'compliant' : 'draft'}>{h.status}</Badge>
                  <span className="text-[11px] text-slate-400">{TRIGGERS.find(t => t.id === h.trigger)?.label || h.trigger}</span>
                  <span className="text-[11px] text-slate-400">· {new Date(h.at).toLocaleString('en-GB')}</span>
                </div>
                {h.changeImpact ? (
                  <div className="mt-2 space-y-1">
                    {h.changeImpact.map(c => (
                      <div key={c.id} className="flex items-center gap-2 text-[11px]">
                        {c.prevRank == null ? <Minus size={11} className="text-slate-300 shrink-0" />
                          : c.rank < c.prevRank ? <TrendingUp size={11} className="text-emerald-500 shrink-0" />
                          : c.rank > c.prevRank ? <TrendingDown size={11} className="text-red-500 shrink-0" />
                          : <Minus size={11} className="text-slate-300 shrink-0" />}
                        <span className="font-semibold text-slate-600">#{c.rank} {c.name}</span>
                        <span className="text-slate-400">{c.reason}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1.5 text-[11px] text-slate-400">Initial draft — nothing to compare against.</p>
                )}
              </div>
            ))
          )}
        </div>
      </Card>

      {/* H.5 — deliverables */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
          <FileText size={14} className="text-[var(--color-primary)]" />
          <h3 className="text-sm font-semibold text-slate-800">H.5 — Evaluation Deliverables</h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          {H5_DELIVERABLES.map(d => (
            <button key={d.key} onClick={() => openDeliverable(d.key)}
              className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border border-slate-200 text-xs text-slate-600 hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] bg-white transition-colors text-left">
              {d.title}
              <Download size={12} className="shrink-0" />
            </button>
          ))}
        </div>
      </Card>
    </>
  )
}
