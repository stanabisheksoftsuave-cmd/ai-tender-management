import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import SearchableSelect from '../components/ui/SearchableSelect'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useNavigation } from '../context/NavigationContext'
import { useHomePath } from '../utils/permissions'
import { tenderRef } from '../utils/tenderRef'
import {
  defaultCommercialEvalProfile, SUBMISSION_TREATMENTS, PREFERENCE_APPLICATION_METHODS,
} from '../data/commercialEvalProfile'
import { omaniEligibleTypes } from '../data/mockData'

// ── Inline SVG icons (matching the rest of the app) ──────────────────────────
const Svg = ({ size = 16, sw = 1.6, style, className = '', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const ArrowLeft   = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></Svg>
const ShieldOff   = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18" /><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38" /><line x1="1" y1="1" x2="23" y2="23" /></Svg>
const Lock        = p => <Svg {...p}><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></Svg>
const Save         = p => <Svg {...p}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></Svg>
const SlidersHorizontal = p => <Svg {...p}><line x1="21" y1="4" x2="14" y2="4" /><line x1="10" y1="4" x2="3" y2="4" /><line x1="21" y1="12" x2="12" y2="12" /><line x1="8" y1="12" x2="3" y2="12" /><line x1="21" y1="20" x2="16" y2="20" /><line x1="12" y1="20" x2="3" y2="20" /><line x1="14" y1="2" x2="14" y2="6" /><line x1="8" y1="10" x2="8" y2="14" /><line x1="16" y1="18" x2="16" y2="22" /></Svg>

const inputCls = 'mt-1 w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 disabled:bg-slate-50 disabled:text-slate-400'
const toggleRow = 'flex items-center gap-2.5 py-1.5 cursor-pointer'

function SectionCard({ letter, title, hint, children }) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
        <span className="w-7 h-7 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">{letter}</span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
          {hint && <p className="text-[11px] text-slate-400 mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="p-4 space-y-3">{children}</div>
    </Card>
  )
}

function Toggle({ checked, onChange, label, disabled }) {
  return (
    <label className={toggleRow}>
      <input type="checkbox" checked={checked} disabled={disabled}
        onChange={e => onChange(e.target.checked)} className="accent-[var(--color-primary)]" />
      <span className="text-xs text-slate-700">{label}</span>
    </label>
  )
}

export default function TenderEvaluationProfile() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { goBack } = useNavigation()
  const { user } = useAuth()
  const home = useHomePath()
  const { tenders, updateTender } = useTenders()

  const tender = tenders.find(t => t.id === tenderId)
  const locked = tender?.commercialEvalProfileLocked === true

  const [profile, setProfile] = useState(() => tender?.commercialEvalProfile || defaultCommercialEvalProfile())
  const [saved, setSaved] = useState(false)

  // ── Role gate — the profile is the Contract Engineer's, same as the rest
  // of the commercial-evaluation setup work. ──
  if (user?.role?.id !== 'pof') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldOff size={22} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
          <p className="text-xs text-slate-400 mt-1">The Tender Evaluation Profile is only accessible to the Contract Engineer.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
          <ArrowLeft size={13} /> Back to Home
        </Button>
      </div>
    )
  }

  if (!tenderId) {
    // Linear tenders only reach this list once Technical Evaluation is done and
    // SCM Gate 1 has released commercial (scm_gate1 / comm_eval). Parallel
    // tenders run technical and commercial (profile → commercial) side by side,
    // so `parallel_eval` is eligible from the start of that concurrent phase —
    // not gated on the technical side finishing.
    const eligible = tenders.filter(t => [
      'scm_gate1', 'comm_eval', 'parallel_eval',
    ].includes(t.status))
    return (
      <TenderSelectList
        tenders={eligible}
        status={['scm_gate1', 'comm_eval', 'parallel_eval']}
        basePath="/commercial-eval-profile"
        title="Tender Evaluation Profile"
        description="Configure Sections A–G once per tender. Locking issues the profile — every commercial evaluation agent reads from it from that point on."
        emptyText="No tenders available to configure — technical evaluation must be complete first"
      />
    )
  }

  if (!tender) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <p className="text-sm">Tender not found.</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
          <ArrowLeft size={13} /> Back to Home
        </Button>
      </div>
    )
  }

  const set = (section, patch) => setProfile(prev => ({ ...prev, [section]: { ...prev[section], ...patch } }))
  const setSectionBRow = (id, patch) => setProfile(prev => ({
    ...prev,
    sectionB: prev.sectionB.map(row => row.id === id ? { ...row, ...patch } : row),
  }))

  const saveDraft = () => { updateTender(tenderId, { commercialEvalProfile: profile }); setSaved(true); setTimeout(() => setSaved(false), 2200) }
  const lockProfile = () => updateTender(tenderId, {
    commercialEvalProfile: profile,
    commercialEvalProfileLocked: true,
    commercialEvalProfileLockedBy: user?.name || 'Contract Engineer',
    commercialEvalProfileLockedAt: new Date().toISOString(),
  })

  const dis = locked

  return (
    <div className="space-y-5">
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={goBack} className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Back
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tenderRef(tender)}</span>
              {locked ? <Badge variant="compliant"><Lock size={10} /> Locked</Badge> : <Badge variant="draft">Draft — editable</Badge>}
            </div>
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-[var(--color-primary)]" />
              <h3 className="font-semibold text-slate-800">Tender Evaluation Profile</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{tender.title}</p>
          </div>
        </div>
        {locked && (
          <div className="mt-3 flex items-start gap-2.5 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <Lock size={14} className="text-amber-600 shrink-0 mt-0.5" />
            <span className="text-xs text-amber-800 leading-relaxed">
              Locked at issuance by <strong>{tender.commercialEvalProfileLockedBy}</strong> on {new Date(tender.commercialEvalProfileLockedAt).toLocaleString('en-GB')}.
              Every commercial evaluation agent below reads its configuration from this profile — it is read-only from here on.
            </span>
          </div>
        )}
      </Card>

      {/* Section A — feature toggles */}
      <SectionCard letter="A" title="Feature Toggles" hint="Which agents run for this tender">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          <Toggle checked={profile.sectionA.enableCommercialEval} disabled={dis} label="Enable Commercial Evaluation"
            onChange={v => set('sectionA', { enableCommercialEval: v })} />
          <Toggle checked={profile.sectionA.enableCompliance} disabled={dis} label="Enable Compliance Check"
            onChange={v => set('sectionA', { enableCompliance: v })} />
          <Toggle checked={profile.sectionA.enableRisk} disabled={dis} label="Enable Risk Assessment"
            onChange={v => set('sectionA', { enableRisk: v })} />
          <Toggle checked={profile.sectionA.enablePriceBenchmark} disabled={dis} label="Enable Price Benchmarking"
            onChange={v => set('sectionA', { enablePriceBenchmark: v })} />
          <Toggle checked={profile.sectionA.enableSensitivity} disabled={dis} label="Enable Sensitivity Analysis"
            onChange={v => set('sectionA', { enableSensitivity: v })} />
        </div>
      </SectionCard>

      {/* Section B — mandatory submission requirements */}
      <SectionCard letter="B" title="Mandatory Submission Requirements" hint="Per-item treatment — add or drop requirements per tender">
        <div className="overflow-x-auto -mx-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <th className="text-left px-4 py-2 text-xs font-semibold">Group</th>
                <th className="text-left px-3 py-2 text-xs font-semibold">Requirement</th>
                <th className="text-left px-3 py-2 text-xs font-semibold min-w-52">Treatment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {profile.sectionB.map(row => (
                <tr key={row.id}>
                  <td className="px-4 py-2 text-[11px] text-slate-400">{row.group}</td>
                  <td className="px-3 py-2 text-xs text-slate-700">{row.name}</td>
                  <td className="px-3 py-2">
                    <SearchableSelect
                      value={row.treatment} disabled={dis}
                      onChange={v => setSectionBRow(row.id, { treatment: v })}
                      options={SUBMISSION_TREATMENTS}
                      getValue={t => t} getLabel={t => t}
                      searchable={false}
                      ariaLabel={`Treatment for ${row.name}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* Section C — price-benchmark thresholds */}
      <SectionCard letter="C" title="Price-Benchmark Thresholds" hint="Variance-from-estimate and outlier thresholds, per tender">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Abnormally Low %</label>
            <input type="number" value={profile.sectionC.abnormallyLowPct} disabled={dis} className={inputCls}
              onChange={e => set('sectionC', { abnormallyLowPct: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Abnormally High %</label>
            <input type="number" value={profile.sectionC.abnormallyHighPct} disabled={dis} className={inputCls}
              onChange={e => set('sectionC', { abnormallyHighPct: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Line-Item Outlier %</label>
            <input type="number" value={profile.sectionC.outlierRatePct} disabled={dis} className={inputCls}
              onChange={e => set('sectionC', { outlierRatePct: Number(e.target.value) || 0 })} />
          </div>
        </div>
      </SectionCard>

      {/* Section D — sensitivity dimensions */}
      <SectionCard letter="D" title="Sensitivity-Analysis Dimensions" hint="Which stress-test dimensions run for this tender">
        <div className="space-y-1.5">
          {profile.sectionD.families.map(f => (
            <label key={f.family} className={toggleRow}>
              <input type="checkbox" checked={f.enabled} disabled={dis} className="accent-[var(--color-primary)]"
                onChange={e => setProfile(prev => ({
                  ...prev,
                  sectionD: { ...prev.sectionD, families: prev.sectionD.families.map(x => x.family === f.family ? { ...x, enabled: e.target.checked } : x) },
                }))} />
              <span className="text-xs text-slate-700">{f.family}</span>
              <span className="text-[11px] text-slate-400">{f.range}</span>
            </label>
          ))}
          <Toggle checked={profile.sectionD.userDefinedIndexEnabled} disabled={dis} label="Allow a user-defined index adjustment"
            onChange={v => set('sectionD', { userDefinedIndexEnabled: v })} />
        </div>
      </SectionCard>

      {/* Section E — LC / ICV / PAF */}
      <SectionCard letter="E" title="LC / ICV / PAF" hint="Local Content, ICV and the Price Adjustment Factor — the single source of truth for evaluation adjustments">
        <Toggle checked={profile.sectionE.enabled} disabled={dis} label="Enable LC / ICV / PAF adjustment"
          onChange={v => set('sectionE', { enabled: v })} />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500">LCC Weighting %</label>
            <input type="number" value={profile.sectionE.lccWeightingPct} disabled={dis || !profile.sectionE.enabled} className={inputCls}
              onChange={e => set('sectionE', { lccWeightingPct: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">ICV Weighting %</label>
            <input type="number" value={profile.sectionE.icvWeightingPct} disabled={dis || !profile.sectionE.enabled} className={inputCls}
              onChange={e => set('sectionE', { icvWeightingPct: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Total PAF Cap %</label>
            <input type="number" value={profile.sectionE.capPct} disabled={dis || !profile.sectionE.enabled} className={inputCls}
              onChange={e => set('sectionE', { capPct: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">PAF Basis</label>
            <SearchableSelect
              value={profile.sectionE.basis} disabled={dis || !profile.sectionE.enabled}
              onChange={v => set('sectionE', { basis: v })}
              options={[{ id: 'normalized', label: 'Normalized price' }, { id: 'submitted', label: 'Submitted bid price' }]}
              getValue={o => o.id} getLabel={o => o.label}
              searchable={false}
              ariaLabel="PAF basis"
              className="mt-1"
            />
          </div>
        </div>
      </SectionCard>

      {/* Section F — Omani Preference */}
      <SectionCard letter="F" title="Omani Preference" hint="Preference type, percentage and how it is applied">
        <Toggle checked={profile.sectionF.enabled} disabled={dis} label="Enable Omani Preference"
          onChange={v => set('sectionF', { enabled: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Preference Type</label>
            <SearchableSelect
              value={profile.sectionF.preferenceType} disabled={dis || !profile.sectionF.enabled}
              onChange={v => set('sectionF', { preferenceType: v })}
              options={[...omaniEligibleTypes, 'Social Enterprise']}
              getValue={t => t} getLabel={t => t}
              searchable={false}
              ariaLabel="Omani preference type"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Preference %</label>
            <input type="number" value={profile.sectionF.preferencePct} disabled={dis || !profile.sectionF.enabled} className={inputCls}
              onChange={e => set('sectionF', { preferencePct: Number(e.target.value) || 0 })} />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-slate-500">Application Method</label>
            <SearchableSelect
              value={profile.sectionF.applicationMethod} disabled={dis || !profile.sectionF.enabled}
              onChange={v => set('sectionF', { applicationMethod: v })}
              options={PREFERENCE_APPLICATION_METHODS}
              getValue={m => m.id} getLabel={m => m.label}
              searchable={false}
              ariaLabel="Preference application method"
              className="mt-1"
            />
          </div>
        </div>
      </SectionCard>

      {/* Section G — Negotiation module */}
      <SectionCard letter="G" title="Negotiation Module" hint="Enabled only when the tendering strategy permits commercial negotiations">
        <Toggle checked={profile.sectionG.enabled} disabled={dis} label="Enable Negotiation Module"
          onChange={v => set('sectionG', { enabled: v })} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
          {profile.sectionG.categories.map(c => (
            <Toggle key={c.id} checked={c.enabled} disabled={dis || !profile.sectionG.enabled} label={c.title}
              onChange={v => setProfile(prev => ({
                ...prev,
                sectionG: { ...prev.sectionG, categories: prev.sectionG.categories.map(x => x.id === c.id ? { ...x, enabled: v } : x) },
              }))} />
          ))}
        </div>
      </SectionCard>

      {!locked && (
        <Card className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-800">Lock the profile to issue the tender</h3>
              <p className="text-xs text-slate-400 mt-0.5">Once locked, Sections A–G become read-only and every commercial evaluation agent reads from this configuration.</p>
              {saved && <p className="text-xs text-emerald-600 mt-1">Draft saved.</p>}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" onClick={saveDraft}><Save size={13} /> Save Draft</Button>
              <Button size="sm" onClick={lockProfile}><Lock size={13} /> Lock &amp; Issue</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
