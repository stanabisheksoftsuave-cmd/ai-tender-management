// ── Tender Evaluation Profile — Sections A–G ───────────────────────────────
// The single, locked-at-issuance configuration every commercial evaluation
// agent reads from (framework §5). Rather than invent a second set of mock
// values, each section's defaults are seeded from the same constants
// CommercialEvaluation.jsx already evaluates against — this *is* those
// constants, surfaced as an editable-then-locked configuration screen instead
// of hardcoded defaults with no owner.
import {
  commercialComplianceDocs, commercialNormalization, commercialScenarioFamilies,
  commercialPafDefaults, omaniEligibleTypes, commercialNegotiationRules,
} from './mockData'

export const SUBMISSION_TREATMENTS = [
  'Mandatory',
  'Mandatory — with validity check',
  'Optional',
  'Not Applicable',
]

export const PREFERENCE_APPLICATION_METHODS = [
  { id: 'price_reduction',      label: 'Price reduction' },
  { id: 'evaluated_adjustment', label: 'Evaluated-price adjustment (PAF)' },
  { id: 'ranking_only',         label: 'Ranking-only preference' },
]

// A fresh, editable profile for a tender that has none yet — every field
// pre-filled from the framework's own sensible defaults / this codebase's
// existing constants, exactly as §1 of the sprint plan asks for.
export function defaultCommercialEvalProfile() {
  return {
    sectionA: {
      enableCommercialEval:  true,
      enableCompliance:      true,
      enableRisk:            true,
      enablePriceBenchmark:  true,
      enableSensitivity:     true,
    },
    sectionB: commercialComplianceDocs.map(d => ({
      id: d.id,
      group: d.group,
      name: d.name,
      treatment: d.mandatory ? 'Mandatory' : 'Optional',
    })),
    sectionC: {
      abnormallyLowPct:  commercialNormalization.abnormallyLowPct,
      abnormallyHighPct: commercialNormalization.abnormallyHighPct,
      outlierRatePct:    commercialNormalization.outlierRatePct,
    },
    sectionD: {
      families: commercialScenarioFamilies.map(f => ({ ...f, enabled: true })),
      userDefinedIndexEnabled: true,
    },
    sectionE: {
      enabled:         true,
      lccWeightingPct: commercialPafDefaults.lccWeightingPct,
      icvWeightingPct: commercialPafDefaults.icvWeightingPct,
      capPct:          commercialPafDefaults.capPct,
      basis:           commercialPafDefaults.basis,
    },
    sectionF: {
      enabled:            commercialPafDefaults.applyPreference,
      preferenceType:     omaniEligibleTypes[0],
      preferencePct:      commercialPafDefaults.omaniPreferencePct,
      applicationMethod:  'evaluated_adjustment',
    },
    sectionG: {
      enabled: true,
      categories: commercialNegotiationRules.map(r => ({ id: r.id, title: r.title, enabled: true })),
    },
  }
}
