/*
 * Procurement Strategy Form options. The PSF records how the work will be
 * contracted and taken to market, and which commercial drivers the strategy is
 * optimising for — the first two are single-choice, the drivers are a checklist.
 */
export const CONTRACTING_MODELS = [
  'Lump Sum Turnkey (LSTK)',
  'Engineering, Procurement, Construction (EPC)',
  'Time and Materials (T&M)',
  'Framework Agreement',
]

export const MARKET_APPROACHES = ['Open Tender', 'Restricted/Selected Tender', 'Single Source']

export const COMMERCIAL_DRIVERS = [
  { id: 'cost_optimization',     label: 'Cost Optimization',     defaultChecked: true  },
  { id: 'schedule_acceleration', label: 'Schedule Acceleration', defaultChecked: true  },
  { id: 'technology_transfer',   label: 'Technology Transfer',   defaultChecked: false },
  { id: 'risk_mitigation',       label: 'Risk Mitigation',       defaultChecked: true  },
  { id: 'local_content',         label: 'Local Content (ICV)',   defaultChecked: false },
]
