/*
 * Commercial Evaluation — the three real evaluation shapes OLNG runs.
 *
 * Commercial evaluation is NOT one shape. The client's own workbooks show three
 * structurally different evaluations, and each one needs different panels:
 *
 *   competitive-complex — multi-schedule Section E tree, fixed vs non-fixed
 *                         split, CE normalization register, market/condition/
 *                         efficiency adjustment factors, L1/L2 ranking.
 *   competitive-simple  — two schedules, CE uplifted by a flat market increase,
 *                         straight line-item comparison, L1/L2 ranking.
 *   single-source       — ONE bidder, so there is no L1/L2 ranking at all. The
 *                         comparison axis is negotiation rounds over time, plus
 *                         external rate benchmarking and a scope-merge option.
 *
 * A tender declares its shape with `evaluationType` and points at the priced
 * dataset with `commercialScenarioId`. Tenders with neither keep the original
 * generic nine-step flow.
 *
 * Figures are the client's own. Where a workbook redacted a figure as `xxxxx`
 * the stated totals in the notes are used as the anchor and the line detail is
 * derived so every subtotal adds up to the published number.
 */

export const EVALUATION_TYPES = {
  'competitive-complex': {
    id: 'competitive-complex',
    label: 'Competitive — Complex',
    short: 'Competitive · Complex',
    badge: 'comm_eval',
    ranked: true,
    hint: 'Multi-schedule call-off with fixed and non-fixed scope, adjustment factors and an L1/L2 ranking.',
  },
  'competitive-simple': {
    id: 'competitive-simple',
    label: 'Competitive — Simple',
    short: 'Competitive · Simple',
    badge: 'comm_eval',
    ranked: true,
    hint: 'Line-item schedule of material and services compared against an escalated company estimate.',
  },
  'single-source': {
    id: 'single-source',
    label: 'Single Source',
    short: 'Single Source',
    badge: 'warning',
    ranked: false,
    hint: 'One bidder — no L1/L2 ranking. Value is tested through negotiation rounds and external rate benchmarks.',
  },
}

/* ── Non-numeric bid cell states ──────────────────────────────────────────
 * A priced cell legitimately carries text instead of a figure. These states
 * must render distinctly and must never be counted as zero in a total: a line
 * the bidder did not price is excluded from the total, not valued at nil.     */
export const BID_STATES = {
  included:   { id: 'included',   label: 'Included',                      abbr: 'Incl.',      tone: 'blue',   hint: 'Priced within another line — no separate charge.' },
  not_quoted: { id: 'not_quoted', label: 'Not quoted — client to provide', abbr: 'Not quoted', tone: 'slate',  hint: 'Bidder did not price this line; OLNG will provide the resource.' },
  deviation:  { id: 'deviation',  label: 'Deviation',                     abbr: 'Deviation',  tone: 'amber',  hint: 'Departs from the tender basis — raised as a commercial deviation.' },
  descoped:   { id: 'descoped',   label: 'De-scoped',                     abbr: 'De-scoped',  tone: 'red',    hint: 'Removed from the evaluation — sourced separately at lower cost.' },
}

/** Numeric amount of a priced cell, or null when the cell is a non-numeric state. */
export const bidAmount = (cell) => (typeof cell === 'number' ? cell : null)
/** The state record of a non-numeric cell, or null when the cell is priced. */
export const bidState = (cell) => (typeof cell === 'number' || cell == null ? null : BID_STATES[cell] || null)

/* ── Currency formatting ────────────────────────────────────────────────── */
export function ceFormat(currency) {
  const code = currency || 'OMR'
  const money = (n, dp = 0) => n == null ? '—'
    : `${code} ${Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp })}`
  return {
    code,
    money,
    money2: (n) => money(n, 2),
    rate:   (n, dp = 3) => n == null ? '—' : Number(n).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp }),
    pct:    (n, dp = 1) => n == null ? '—' : `${n > 0 ? '+' : ''}${Number(n).toFixed(dp)}%`,
  }
}

/* ── Step definitions per evaluation type ───────────────────────────────────
 * Same shape as `commercialSteps` in mockData so the page's step runner,
 * indicator and audit trail work unchanged.                                  */
const STEP_EXTRACTION = {
  no: 1, id: 'extraction', name: 'Commercial Data Extraction', short: 'Data Extraction',
  purpose: 'Convert bidder submissions into structured, machine-readable commercial data with full evidence references.',
  steps: [
    'Opening bidder commercial submissions…',
    'Parsing priced schedules & unit rates…',
    'Extracting payment, warranty & delivery commitments…',
    'Extracting bonds, insurance & escalation clauses…',
    'Capturing LC / ICV commitments & evidence references…',
  ],
}
const STEP_COMPLIANCE = {
  no: 2, id: 'compliance', name: 'Commercial Compliance', short: 'Compliance',
  purpose: 'Clear the mandatory submission gate and record every deviation and exception against the ITT commercial conditions.',
  steps: [
    'Checking mandatory submissions for presence & validity…',
    'Reading commercial terms against the ITT conditions…',
    'Classifying each condition compliant / deviation / exception…',
    'Determining responsiveness per bidder…',
  ],
}
const STEP_RISK = {
  no: 3, id: 'risk', name: 'Commercial Risk Assessment', short: 'Risk',
  purpose: 'Surface the commercial exposure carried by each offer, as advice to the recommendation — never as an automatic rejection.',
  steps: [
    'Scanning payment, cash-flow & security positions…',
    'Testing escalation, currency & warranty exposure…',
    'Rating each finding and drafting mitigations…',
  ],
}
const STEP_CLARIFICATION = {
  no: 8, id: 'clarification', name: 'Clarification Management', short: 'Clarifications',
  purpose: 'Raise, issue and close every commercial clarification arising from the preceding steps.',
  steps: [
    'Collecting open findings from every step…',
    'Drafting clarification requests per bidder…',
    'Building the closure tracker…',
  ],
}

const STEPS_COMPETITIVE = [
  STEP_EXTRACTION, STEP_COMPLIANCE, STEP_RISK,
  {
    no: 4, id: 'ceNormalization', name: 'CE Adjustment & Normalization', short: 'CE Normalization',
    purpose: 'Restate the approved Company Estimate onto the basis every bidder is evaluated against, and record the delta.',
    steps: [
      'Reading the approved Company Estimate…',
      'Applying the agreed scope adjustments…',
      'Applying the market, condition & efficiency assumptions…',
      'Reconciling approved to normalized Company Estimate…',
    ],
  },
  {
    no: 5, id: 'priced', name: 'Priced Comparison', short: 'Priced Comparison',
    purpose: 'Compare every schedule of the Company Estimate against each proposal and identify L1 and L2.',
    steps: [
      'Loading the priced schedules…',
      'Comparing each line against the Company Estimate…',
      'Rolling up to schedule and grand totals…',
      'Ranking the field on evaluated total…',
    ],
  },
  {
    no: 6, id: 'sensitivityCases', name: 'Sensitivity Analysis', short: 'Sensitivity',
    purpose: 'Stress the evaluation against the agreed cases and confirm whether the outcome changes.',
    steps: [
      'Building each sensitivity case…',
      'Re-running the evaluation per case…',
      'Comparing the outcome against the base case…',
    ],
  },
  {
    no: 7, id: 'optimization', name: 'Optimization & Negotiation Opportunity', short: 'Optimization',
    purpose: 'Identify the line items where L1 sits materially above the Company Estimate and are worth negotiating before signature.',
    steps: [
      'Ranking every schedule by variance to the Company Estimate…',
      'Weighting by share of contract value…',
      'Drafting the negotiation target list…',
    ],
  },
  STEP_CLARIFICATION,
  {
    no: 9, id: 'tbAward', name: 'Tender Board Submission', short: 'Award & TB Note',
    purpose: 'Consolidate the structured note blocks and the award recommendation for the Tender Board.',
    steps: [
      'Consolidating the evaluation note blocks…',
      'Testing the tender-specific commercial model criteria…',
      'Drafting the award recommendation…',
    ],
  },
]

const STEPS_SINGLE_SOURCE = [
  STEP_EXTRACTION, STEP_COMPLIANCE, STEP_RISK,
  {
    no: 4, id: 'ceNormalization', name: 'CE Optimization & Re-baselining', short: 'CE Optimization',
    purpose: 'Re-baseline the approved Company Estimate onto the revised execution window and record what was de-scoped.',
    steps: [
      'Reading the TB-approved Company Estimate…',
      'Applying the revised shutdown duration…',
      'Recording the de-scoped items and their reasoning…',
      'Reconciling approved to optimized Company Estimate…',
    ],
  },
  {
    no: 5, id: 'rounds', name: 'Negotiation Rounds', short: 'Negotiation Rounds',
    purpose: 'Compare the single offer against the optimized Company Estimate across each round of negotiation.',
    steps: [
      'Loading the initial priced offer…',
      'Loading the 1st revised submission…',
      'Loading the 2nd revised submission…',
      'Computing the movement against the Company Estimate…',
    ],
  },
  {
    no: 6, id: 'benchmarkRates', name: 'Rate Benchmarking & Sensitivity', short: 'Benchmarking',
    purpose: 'With no second bidder, test the offer against external rate sources and prior contracts instead of a ranking.',
    steps: [
      'Converting external rate sources to the tender currency…',
      'Benchmarking each priced line against the sources…',
      'Running the sensitivity cases…',
    ],
  },
  {
    no: 7, id: 'scopeMerge', name: 'Scope Merge Option', short: 'Scope Merge',
    purpose: 'Model the combined scope option and the volume-leverage discount obtained against it.',
    steps: [
      'Building the combined-scope Company Estimate…',
      'Applying the bidder’s combined-scope offer…',
      'Comparing the merged option against the single scope…',
    ],
  },
  STEP_CLARIFICATION,
  {
    no: 9, id: 'tbAward', name: 'Tender Board Submission', short: 'Award & TB Note',
    purpose: 'Consolidate the structured note blocks and the award recommendation for the Tender Board.',
    steps: [
      'Consolidating the evaluation note blocks…',
      'Testing the tender-specific commercial model criteria…',
      'Drafting the award recommendation…',
    ],
  },
]

export const ceStepsFor = (type) => type === 'single-source' ? STEPS_SINGLE_SOURCE : STEPS_COMPETITIVE

/* ═══════════════════════════════════════════════════════════════════════════
 * SCENARIO 1 — Competitive, COMPLEX
 * Turnaround / shutdown call-off, 6 years + 1-year option, OMR.
 * Bidders B2 / B4 / B6 (bidder numbers, not ranks).
 * ═══════════════════════════════════════════════════════════════════════════ */

const EX1_ROLLUP = [
  { ref: '3.1', label: 'Mobilisation and Demobilisation', group: 'fixed',
    ce: 56012.61, bids: { B2: 2240.50, B4: 64414.50, B6: 77857.53 } },
  { ref: '3.2', label: 'Site Management fee', group: 'fixed',
    ce: 1620720.00, bids: { B2: 1815206.40, B4: 2787638.40, B6: 2593152.00 } },
  { ref: '3.3', label: 'Lump Sum Prices for Fixed Work (PM Turnaround Packages for Events)', group: 'fixed', children: [
    { ref: '3.3.1', label: 'T3 (HGPI) 2025', ce: 417946.06, bids: { B2: 443022.82, B4: 911122.41, B6: 425469.09 } },
    { ref: '3.3.2', label: 'T2 (HGPI) 2025', ce: 562099.18, bids: { B2: 528373.23, B4: 1101714.39, B6: 729042.64 } },
    { ref: '3.3.3', label: 'T1 (HGPI) 2026', ce: 615862.71, bids: { B2: 541959.18, B4: 1157821.89, B6: 818481.54 } },
    { ref: '3.3.4', label: 'T3 (MI) 2029',   ce: 612697.84, bids: { B2: 563682.01, B4: 1249903.59, B6: 868192.84 } },
    { ref: '3.3.5', label: 'T2 (MI) 2030',   ce: 428420.46, bids: { B2: 466978.30, B4: 985367.06,  B6: 439130.97 } },
    { ref: '3.3.6', label: 'T1 (MI) 2030',   ce: 450969.55, bids: { B2: 469008.33, B4: 1001152.40, B6: 478478.69 } },
  ] },
  { ref: '3.4', label: 'Call-Off Requirements', group: 'nonfixed', children: [
    { ref: '3.4.1', label: 'NDT', ce: 22890.78, bids: { B2: 27011.12, B4: 35480.71, B6: 32413.34 } },
    { ref: '3.4.2', label: 'Mechanical', children: [
      { ref: '3.4.2.1', label: 'Structural Steel', ce: 317643.51, bids: { B2: 572557.29, B4: 807191.54, B6: 955319.64 } },
      { ref: '3.4.2.2', label: 'Valves',           ce: 101065.44, bids: { B2: 159683.40, B4: 207184.15, B6: 517455.05 } },
    ] },
    { ref: '3.4.3', label: 'Electrical and Instrument', children: [
      { ref: '3.4.3.1', label: 'PM Instrument work', ce: 52834.68, bids: { B2: 132086.70, B4: 148993.80, B6: 215301.32 } },
      { ref: '3.4.3.2', label: 'PM Electrical work', ce: 0, bids: { B2: 0, B4: 0, B6: 0 }, removed: true,
        removedNote: 'Removed from the Company Estimate and from every bidder evaluation — the scope will be carried out by OLNG staff with support of call-off manpower.' },
    ] },
    { ref: '3.4.4', label: 'Insulation and Painting', children: [
      { ref: '3.4.4.1', label: 'Insulation', ce: 361927.73,  bids: { B2: 412597.61,  B4: 582703.65,  B6: 495117.13 } },
      { ref: '3.4.4.2', label: 'Painting',   ce: 1047288.00, bids: { B2: 1675660.80, B4: 2052684.48, B6: 2061062.78 } },
    ] },
    { ref: '3.4.5', label: 'General Work', children: [
      { ref: '3.4.5.1', label: 'Contractor area services', ce: 554536.00,  bids: { B2: 820713.28,  B4: 1552700.80, B6: 2010747.54 } },
      { ref: '3.4.5.2', label: 'Scaffold Rental',          ce: 1000000.00, bids: { B2: 1250000.00, B4: 2400000.00, B6: 1800000.00 } },
    ] },
    { ref: '3.4.6', label: 'Static Equipment', children: [
      { ref: '3.4.6.1', label: 'Spade', ce: 171933.24, bids: { B2: 187407.23, B4: 287128.51, B6: 209930.49 } },
      { ref: '3.4.6.2', label: 'Blind', ce: 35547.46,  bids: { B2: 50477.39,  B4: 81759.16,  B6: 89863.98 } },
    ] },
    { ref: '3.4.7', label: 'Relief Valves', ce: 15057.96,   bids: { B2: 33127.51,   B4: 54208.66,   B6: 179882.39 } },
    { ref: '3.4.8', label: 'Scaffold',      ce: 1352174.78, bids: { B2: 2339262.37, B4: 3380436.95, B6: 5450616.54 } },
  ] },
  { ref: '3.5', label: 'Adhoc Manpower', group: 'nonfixed',
    ce: 10208448.15, bids: { B2: 9800110.22, B4: 20314811.82, B6: 10586160.73 } },
  { ref: '3.6', label: 'Equipment hire', group: 'nonfixed',
    ce: 6214631.32,  bids: { B2: 5655314.50, B4: 14293652.04, B6: 6898240.77 } },
  { ref: '3.7', label: 'Percentage Mark-up', group: 'markup',
    ce: 1600000.00,  bids: { B2: 1600000.00, B4: 1600000.00, B6: 1600000.00 },
    note: 'Assumed on the 1,504,000 OMR procurement basis at the ≥ 2,500 material and ≥ 40,000 third-party thresholds (0.07 : 1 historical ratio).' },
]

const scenarioComplex = {
  id: 'ce-ex1',
  type: 'competitive-complex',
  tenderId: 'ITT-2025-021',
  tenderRef: 'TA-24-2201',
  title: 'Turnaround & Shutdown Services Call-Off Contract',
  currency: 'OMR',
  ceLabel: 'Normalized Company Estimate',
  duration: '6 years, with the option of a 1-year extension',
  basis: 'Call-off contract with estimated quantities taken from the Company Estimate demand.',
  bidders: [
    { code: 'B2', id: 201, name: 'Bidder B2', country: 'Oman' },
    { code: 'B4', id: 204, name: 'Bidder B4', country: 'Oman' },
    { code: 'B6', id: 206, name: 'Bidder B6', country: 'UAE' },
  ],
  rollup: EX1_ROLLUP,
  fixedGroups: [
    { key: 'fixed',    label: 'Fixed Scope',     hint: 'Tables 3.1, 3.2 and 3.3 — mobilisation, site management and the turnaround event packages.' },
    { key: 'nonfixed', label: 'Non-Fixed Scope', hint: 'Tables 3.4, 3.5 and 3.6 — the call-off unit-rate schedules.' },
    { key: 'markup',   label: 'Percentage Mark-up', hint: 'Table 3.7 — procurement and third-party service mark-up, priced on a common assumed basis.' },
  ],
  rateDimensions: [
    { id: 'shift',  label: 'Price per Shift (Day/Night)' },
    { id: 'ot',     label: 'Overtime / Hour' },
    { id: 'standby',label: 'Standby / Hour' },
    { id: 'mob',    label: 'Mobilisation' },
    { id: 'demob',  label: 'Demobilisation' },
  ],
  // Worked example of the five priced dimensions carried by a single unit-rate
  // line, straight out of table 3.4.1.1 of the workbook.
  rateDimensionSample: {
    tableRef: '3.4.1.1', tableLabel: 'NDT Technicians (shift working hours)',
    rows: [
      { ref: '3.4.1.1.1', label: 'NDE Technician (Multi-skilled)',
        dims: { shift: { qty: 125, ce: 46.816 }, ot: { qty: 10, ce: 7.200 }, standby: { qty: 10, ce: 6.200 }, mob: { qty: 21, ce: 58.240 }, demob: { qty: 21, ce: 58.240 } } },
      { ref: '3.4.1.1.2', label: 'NDE Supervisor / Controller (Level II)',
        dims: { shift: { qty: 39, ce: 58.520 }, ot: { qty: 10, ce: 9.200 }, standby: { qty: 10, ce: 8.200 }, mob: { qty: 7, ce: 58.240 }, demob: { qty: 7, ce: 58.240 } } },
      { ref: '3.4.1.1.3', label: 'MT/PT Technician (Level II)',
        dims: { shift: { qty: 28, ce: 58.520 }, ot: { qty: 10, ce: 5.200 }, standby: { qty: 10, ce: 4.200 }, mob: { qty: 5, ce: 58.240 }, demob: { qty: 5, ce: 58.240 } } },
      { ref: '3.4.1.1.4', label: 'US Technician — Flaw Detection (Level III)',
        dims: { shift: { qty: 12, ce: 58.520 }, ot: { qty: 10, ce: 15.500 }, standby: { qty: 10, ce: 13.500 }, mob: { qty: 2, ce: 58.240 }, demob: { qty: 2, ce: 58.240 } } },
      { ref: '3.4.1.1.7', label: 'PMI Technician (competency based)',
        dims: { shift: { qty: 12, ce: 58.520 }, ot: { qty: 10, ce: 20.500 }, standby: { qty: 10, ce: 17.500 }, mob: { qty: 2, ce: 58.240 }, demob: { qty: 2, ce: 58.240 } } },
      { ref: '3.4.1.1.8', label: 'Technical Assistant (competency based)',
        dims: { shift: { qty: 39, ce: 58.520 }, ot: { qty: 10, ce: 5.200 }, standby: { qty: 10, ce: 42.000 }, mob: { qty: 7, ce: 58.240 }, demob: { qty: 7, ce: 58.240 } } },
    ],
    note: 'Overtime and standby rates are capped in Section E — an optimization opportunity for NDT and Adhoc Manpower.',
  },
  normalization: {
    approved:  27278491.92,
    corrected: 27507686.31,
    normalized: 27820707.46,
    withEscalation: 27944286.00,
    approvedLabel:   'Signed / approved Company Estimate',
    correctedLabel:  'After correction, normalization & efficiency factor',
    normalizedLabel: 'Normalized Company Estimate — the evaluation basis',
    escalationLabel: 'Total including market escalation',
    diffFromApproved: 665794.08,
    items: [
      { ref: '3.4.3.2', title: 'PM Electrical Work — removed', effect: 'remove',
        detail: 'Adjusted and removed from the Company Estimate and from every bidder evaluation. It was clarified that the scope will be carried out by OLNG staff with support of call-off manpower.' },
      { ref: '3.4.8', title: 'Scaffold erection & dismantle quantities — normalized', effect: 'normalize',
        detail: 'Erect and dismantle quantities restated so every bidder is evaluated on the same demand.' },
      { ref: '3.5', title: 'Adhoc Manpower mobilisation & demobilisation quantities — normalized', effect: 'normalize',
        detail: 'Mob / de-mob quantities restated onto the agreed call-off demand.' },
      { ref: '3.8', title: 'Market Adjustment — assumption applied', effect: 'assume',
        detail: 'Omitted from the Company Estimate. An assumption was applied from the approved escalation percentages (see table 3.8 back-up).' },
      { ref: '3.10', title: 'Efficiency Factor — assumption applied', effect: 'assume',
        detail: 'Omitted from the Company Estimate. An assumption was applied per the agreed logic, which also moves the estimate for tables 3.4.6, 3.4.7 and 3.4.8.' },
    ],
  },
  marketAdjustment: {
    ref: '3.8', title: 'Adjustment for Market Alignment',
    note: 'A per-year add / deduct percentage applied on top of the total, producing a distinct "Total including Market Adjustment" line. 2031 applies only in the event of a contract extension.',
    years: [
      { year: '2026', label: '1st January 2026' },
      { year: '2027', label: '1st January 2027' },
      { year: '2028', label: '1st January 2028' },
      { year: '2029', label: '1st January 2029' },
      { year: '2030', label: '1st January 2030' },
      { year: '2031', label: '1st January 2031 (extension)' },
    ],
    ce:  [0, 0, 0, 3.00, 6.00, 9.00],
    bids: {
      B2: [0, 2.50, 2.50, 5.00, 7.50, 10.00],
      B4: [3.00, 5.00, 7.00, 9.00, 11.00, 13.00],
      B6: [2.00, 4.04, 6.12, 8.24, 10.41, 12.62],
    },
  },
  conditionFactor: {
    ref: '3.9', title: 'Condition Factor',
    excludedFromAcv: true,
    note: 'A constant percentage given to all bidders, hence not required in the ACV.',
    rows: [
      { ref: '3.9.1', condition: 'Work at height: over 6 m, not exceeding 12 m', factor: 1.03 },
      { ref: '3.9.2', condition: 'Work at height: over 12 m, not exceeding 18 m', factor: 1.05 },
      { ref: '3.9.3', condition: 'Work at height: over 18 m, not exceeding 24 m', factor: 1.08 },
      { ref: '3.9.4', condition: 'Work at height: over 24 m', factor: 1.10 },
      { ref: '3.9.5', condition: 'Work in confined space', factor: 1.10 },
      { ref: '3.9.6', condition: 'Work under breathing apparatus, life jacket or heat-resistant clothing (not FRC)', factor: 1.15 },
    ],
  },
  efficiencyFactor: {
    ref: '3.10', title: 'Efficiency Factor',
    note: 'A per-year productivity multiplier applied to tables 3.4.6, 3.4.7 and 3.4.8 only.',
    bidderNotes: {
      B2: 'Assumption of logical implementation of B2’s table 3.10 submission, where the tenderer offered a 0.5% yearly discount.',
      B4: 'No efficiency offered — a flat 1.00 across the whole term.',
      B6: 'Efficiency offered on the static-equipment and relief-valve activities only; scaffold held flat.',
    },
    years: ['2025', '2026', '2027', '2028', '2029', '2030', '2031'],
    activities: [
      { ref: '3.10.2', tableRef: '3.4.6.1.1', activity: 'Isolate & de-isolate pipework (Spade)',
        ce: [1.00, 1.00, 0.97, 0.97, 0.95, 0.92, 0.92],
        bids: { B2: [1.00, 0.95, 0.95, 0.90, 0.90, 0.85, 0.80], B4: [1, 1, 1, 1, 1, 1, 1], B6: [1.00, 1.00, 1.00, 1.00, 0.99, 0.99, 0.98] },
        b6Yearly: 47067.83, b6Total: 281465.65 },
      { ref: '3.10.3', tableRef: '3.4.6.2.1', activity: 'Isolate & de-isolate pipework (Spectacle Blind)',
        ce: [1.00, 1.00, 0.97, 0.97, 0.95, 0.92, 0.92],
        bids: { B2: [1.00, 0.95, 0.95, 0.90, 0.90, 0.85, 0.80], B4: [1, 1, 1, 1, 1, 1, 1], B6: [1.00, 1.00, 1.00, 1.00, 0.99, 0.99, 0.98] },
        b6Yearly: 20951.26, b6Total: 125288.51 },
      { ref: '3.10.5', tableRef: '3.4.7.1', activity: 'Relief Valve',
        ce: [1.00, 1.00, 0.97, 0.97, 0.95, 0.92, 0.92],
        bids: { B2: [1.00, 0.95, 0.95, 0.90, 0.90, 0.85, 0.80], B4: [1, 1, 1, 1, 1, 1, 1], B6: [1.00, 1.00, 1.00, 1.00, 0.99, 0.99, 0.98] },
        b6Yearly: 5394.73, b6Total: 32260.46 },
      { ref: '3.10.6', tableRef: '3.4.8.1', activity: 'Scaffold — Erect',
        ce: [1.00, 1.00, 0.97, 0.97, 0.95, 0.92, 0.92],
        bids: { B2: [1.00, 0.95, 0.95, 0.90, 0.90, 0.85, 0.80], B4: [1, 1, 1, 1, 1, 1, 1], B6: [1, 1, 1, 1, 1, 1, 1] },
        b6Yearly: 636214.28, b6Total: 3817285.66 },
      { ref: '3.10.7', tableRef: '3.4.8.2', activity: 'Scaffold — Dismantle',
        ce: [1.00, 1.00, 0.97, 0.97, 0.95, 0.92, 0.92],
        bids: { B2: [1.00, 0.95, 0.95, 0.90, 0.90, 0.85, 0.80], B4: [1, 1, 1, 1, 1, 1, 1], B6: [1, 1, 1, 1, 1, 1, 1] },
        b6Yearly: 272640.34, b6Total: 1635842.01 },
    ],
  },
  spendMix: [
    { label: 'Manpower', pct: 36.7, ref: '3.5' },
    { label: 'Equipment', pct: 22.3, ref: '3.6' },
    { label: 'Event packages', pct: 11.0, ref: '3.3' },
  ],
  sensitivityCases: [
    { no: 1, title: 'Remove table 3.4.3.2 PM Electrical Work from the total evaluation',
      basis: 'The scope was clarified as executed by Oman LNG staff with support of Adhoc Manpower.',
      result: 'B2 remains L1 at +6% against the Company Estimate. B4 is +105% against CE, +93% against B2 and +45% against B6.',
      changed: false },
    { no: 2, title: 'B4 missing rates set to the highest rate of all bidders including the Company Estimate in the same category',
      basis: 'Tests the effect of B4’s unpriced lines at the most adverse rate available.',
      result: 'No change in outcome — the result is the same as the commercial evaluation.',
      changed: false },
    { no: 3, title: 'B4 missing rates set to the lowest rate of all bidders including the Company Estimate in the same category',
      basis: 'Tests the effect of B4’s unpriced lines at the most favourable rate available.',
      result: 'No change in outcome — the result is the same as the commercial evaluation.',
      changed: false },
    { no: 4, title: 'Evaluate the TA event package only, removing the full non-fixed call-off scope',
      basis: 'Isolates the fixed turnaround packages from the call-off unit-rate demand.',
      result: 'L1 is B2 at +5% against the Company Estimate.',
      changed: false },
    { no: 5, title: 'Increase demand of certain non-fixed items by 10%',
      basis: 'Compares the lowest bid against the Company Estimate on the lines where L1 submitted higher rates.',
      result: 'If estimated quantities go 10% above the approved Company Estimate, B2 is still L1 at +7% against CE, and the difference between L1 and L2 is 32%.',
      changed: false },
  ],
  optimizationTargets: [
    { ref: '3.2',     gapPct: 43,  remark: 'Around 600K OMR (30%) of table 3.2 goes to other management cost — negotiate the senior planning position.' },
    { ref: '3.3',     gapPct: 26,  remark: 'B2’s lump-sum cost on the electrical items in every event is crucially high against the Company Estimate.' },
    { ref: '3.4.1',   gapPct: 20,  remark: 'Demand estimated is low for 6 years — opportunity to negotiate overtime and standby, both capped in Section E.' },
    { ref: '3.4.2.2', gapPct: 224, remark: 'Demand estimated is low for 6 years but possible to negotiate.' },
    { ref: '3.4.3.1', gapPct: 63,  remark: 'Critical — however prices are competitive and close to each other for all bidders (market price).' },
    { ref: '3.4.4.1', gapPct: 20,  remark: 'Overall competitive prices from all bidders; B2 has offset its quote on some items.' },
    { ref: '3.4.4.2', gapPct: 23,  remark: 'Critical — Company Estimate rates are under-estimated and all bidders quote close to each other. Core activity in SD, where most spend falls.', critical: true },
    { ref: '3.4.5.1', gapPct: 145, remark: 'Critical — tent supply including mobilisation and demobilisation is the area of concern.', critical: true },
    { ref: '3.4.6.1', gapPct: 12,  remark: 'To discuss with the Contract Holder — demand is low but likely to be used in every shutdown.' },
    { ref: '3.4.6.2', gapPct: 78,  remark: 'To discuss with the Contract Holder — demand is low but likely to be used in every shutdown.' },
    { ref: '3.4.7',   gapPct: 443, remark: 'To discuss with the Contract Holder — demand is low but likely to be used in every shutdown.' },
    { ref: '3.4.8',   gapPct: 133, remark: 'Huge cost on habitat services (non fire-retardant material) — more than 1,400,000 OMR. B2 is +1317% on the habitat item alone.', critical: true },
    { ref: '3.5',     gapPct: 8,   remark: 'B2 is below the Company Estimate here — protect this position in negotiation.' },
    { ref: '3.6',     gapPct: 22,  remark: 'B2 is below the Company Estimate here — protect this position in negotiation.' },
  ],
  notes: {
    background: 'Competitive sourcing strategy — eleven (11) bidders who passed the pre-qualification stage were invited to the tender. Only eight (8) submitted a proposal; three (3) regretted, citing workload and joining a JV on another bidder’s behalf. The technical evaluation qualified only three (3) of the eight. The detailed Company Estimate was based on the previous contract rates with a 12% market escalation consideration. The commercial evaluation was performed on the basis of a call-off contract duration of six (6) years with estimated quantities per the Company Estimate.',
    ceAdjustment: 'Table 3.4.3.2 PM Electrical Work was adjusted and removed from all evaluation, as it was clarified this scope will be carried out by OLNG staff with support of call-off manpower. Table 3.4.8 scaffold erection and dismantle quantities and table 3.5 Adhoc Manpower mobilisation and demobilisation quantities were normalized. Table 3.8 Market Adjustment was omitted from the Company Estimate, and an assumption was made based on the approved escalation percentages. Table 3.10 Efficiency Factor was omitted from the Company Estimate, and an assumption was made per the agreed logic, which also affects tables 3.4.6, 3.4.7 and 3.4.8. Total normalized Company Estimate is 27,820,707.46 OMR against the signed approved Company Estimate of 27,278,491.92 OMR — an increase of 542,215.54 OMR.',
    evaluation: 'Normalized Company Estimate 27,820,707.46 OMR. B2 is the lowest bid (L1) at 29,546,480.19 OMR, +6% against the Company Estimate. B6 is the second lowest (L2) at 39,531,917.00 OMR, +42% against the Company Estimate. B4 is 57,058,070.91 OMR, +105% against the Company Estimate, +93% against B2 and +44% against B6. The difference between L1 and L2 is 34%.',
    clarifications: 'Commercial clarifications were issued to all tenderers to ensure compliance and no deviation to the tender requirements, including the basis of their offer submission. Bidders were also approached to explain their assumptions and build-ups for the significant variance elements, which are used in the optimization opportunities and the negotiation approach. All responses are closed and agreed to be as per OLNG tender terms and conditions.',
    sensitivity: 'Sensitivity analysis was carried out across five (5) cases with no change in the result. A separate worksheet records each case.',
    optimization: 'For both the fixed and the call-off scope, items have been identified to be optimized and negotiated with L1 to improve those prices before contract sign-off. Negotiate with B2 on table 3.4.4.2 Painting, table 3.4.5.1 Contractor area services and table 3.4.8 Scaffolding, as these are the core activities in shutdown where the ACV is impacted. A further cost optimization opportunity exists in the overtime and standby rates, which are capped in Section E for NDT and Adhoc Manpower.',
  },
  commercialModel: [
    { criterion: 'Prevent awarding both the TA and the GMS contracts to the same awardee', applicable: false,
      reason: 'Not applicable in this case — the L1 for each contract is a different bidder.' },
    { criterion: 'Maximise significant technical capability difference within a reasonable commercial boundary', applicable: false,
      reason: 'Not applicable in this case — the gap between L1 and L2 is approximately 34%, which does not meet the commercial limit of a 3% difference.' },
  ],
  award: {
    awardeeCode: 'B2', awardeeName: 'Bidder B2',
    duration: '6 years, with the option of a 1-year extension',
    value: 29546480.19, valueLabel: 'Contract value over the 6-year duration',
    acv: 4924413.37, acvLabel: 'ACV (annual contract value)',
    text: 'Tender Board is kindly requested to endorse the award of the contract to Bidder B2 for 6 years (with the option of a one-year extension) at the ACV stated for the 6 years’ duration.',
    conditions: [
      'Identified items to be optimised and negotiated accordingly before contract sign-off.',
      'Any subsequent impact on the ACV to be updated to EB subsequently.',
      'Award to B2 after the negotiation position is achieved.',
    ],
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SCENARIO 2 — Competitive, SIMPLE
 * Print / branding / media call-off, 3 years, OMR. Bidders C1 / C2.
 * The Company Estimate is the previous contract uplifted by a flat 6% market
 * increase; the comparison is a straight line-item roll-up over two schedules.
 * ═══════════════════════════════════════════════════════════════════════════ */

// [no, description, size, uom, qty, ceUnit(with 6% market increase), C1 unit, C2 unit]
const EX2_MATERIAL = [
  [1,  'Rospa size poster designing photo quality and print', '50×76 cm', 'Pc', 15, 19.08, 18.695, 70.112],
  [2,  'Roll-up stand designing & printing', '200×80 cm', 'Pc', 10, 37.1, 31.670, 120.202],
  [3,  'Banner designing & printing with eyelet', '250×100 cm', 'Pc', 100, 26.5, 28.472, 106.015],
  [4,  'Helmet sticker, four-colour printing, weatherproof', '5×5 cm', 'Set', 2000, 0.53, 0.503, 1.890],
  [5,  'Printing hand book 200gsm paper, four-colour, 14 pages', '29×21 cm', 'Pc', 500, 0.53, 0.436, 1.659],
  [6,  'Printing & designing newsletter, four-colour, both sides', 'A4', 'Pc', 103, 1.06, 1.105, 4.125],
  [7,  'HSE event coupon printing book for draw — 50 pcs', '13×16 cm', 'Pc', 200, 5.3, 4.859, 18.324],
  [8,  'Printing & designing site safety board with wooden frame', '200×150 cm', 'Pc', 30, 42.4, 33.519, 128.160],
  [9,  'Banner with wooden frame and eyelet, weatherproof', '130×230 cm', 'Pc', 150, 42.4, 42.880, 160.410],
  [10, 'Banner for installation on top of the booth', '200×30 cm', 'Pc', 80, 10.6, 9.383, 35.495],
  [11, 'Multi-colour leaflet, both sides, 4 folding, including designing', 'A4', 'Pc', 99, 0.477, 0.362, 1.390],
  [12, 'Sign board reflective sticker, road-sign type, aluminium 4 mm', '180×120 cm', 'Pc', 10, 84.8, 83.087, 311.605],
  [13, 'Display charts printed on photo paper with 10 mm foam board, laminated', 'A0', 'Pc', 3, 42.4, 36.193, 137.374],
  [14, 'Lifesaving rule cards — PVC material, both sides printed', 'ID card', 'Pc', 6000, 0.954, 1.025, 3.817],
  [15, 'Banner designing & printing', '150×300 cm', 'Pc', 250, 42.4, 40.206, 151.195],
  [16, 'Booklet, 130 pages, with lamination binding 200gsm', '13×21 cm', 'Pc', 500, 6.36, 5.228, 19.915],
  [17, 'Vehicle pass sticker, multi-colour reverse printing with numbering', '5×5 cm', 'Pc', 100, 1.007, 1.050, 3.920],
  [18, 'Posters on 250gsm photo paper, laminated, fixed on 10 mm foam board', '80×60 cm', 'Pc', 70, 26.5, 24.293, 91.618],
  [19, 'Printing only of banner', '250×100 cm', 'Pc', 49, 24.38, 19.274, 73.692],
  [20, 'Printing only of poster, 250gsm high quality with lamination', '80×60 cm', 'Pc', 70, 15.9, 16.080, 60.154],
  [21, 'Designing and printing of water-bottle sticker', '20×5 cm', 'Pc', 250, 0.106, 0.094, 0.355],
  [22, 'Printing and designing inspection tag, non-treble with twine', '12×6 cm', 'Pc', 1399, 0.53, 0.402, 1.545],
  [23, 'Printing and designing inspection tag, weatherproof PVC material', '12×6 cm', 'Pc', 350, 0.742, 0.727, 2.726],
  [24, 'Reputed brand polo T-shirt 250gsm, logo & statement embroidered', 'XS–XXL', 'Pc', 1500, 3.71, 3.167, 12.020],
  [25, 'Reputed brand round-neck T-shirt, logo & statement screen printed', 'XS–XXL', 'Pc', 1500, 1.272, 1.366, 5.089],
  [26, 'Reputed brand baseball cap, logo & statement embroidered', 'Adjustable', 'Pc', 1500, 2.12, 2.010, 7.560],
  [27, 'Printing only of poster 250gsm, laminated, 10 mm cappa board', '100×70 cm', 'Pc', 200, 24.38, 20.043, 76.342],
  [28, 'Memento plaque, crystal, design & printing with wooden box', '21×17 cm', 'Pc', 50, 26.5, 27.636, 103.135],
  [29, 'Memento plaque, crystal, design & printing with wooden box', '14×10 cm', 'Pc', 20, 6.36, 5.830, 21.988],
  [30, 'Memento plaque, wooden design & printing in aluminium with wooden box', '25×18 cm', 'Pc', 10, 26.5, 20.949, 80.100],
  [31, 'Memento plaque, wooden design & printing in aluminium with wooden box', '23×18 cm', 'Pc', 30, 10.6, 10.721, 40.102],
  [32, 'Designing & printing photo with wooden frame', '30×21 cm', 'Pc', 50, 5.3, 4.691, 17.748],
  [33, 'Designing & printing photo with wooden frame', '30×40 cm', 'Pc', 13, 10.6, 8.045, 30.888],
  [34, 'Acrylic glass frame without photo', '30×40 cm', 'Pc', 25, 8.48, 8.309, 31.161],
  [35, 'Printed A3 photo in acrylic glass frame', '30×40 cm', 'Pc', 23, 13.78, 11.763, 44.646],
  [36, 'Design & printing photo with 3D lamination', '30×21 cm', 'Pc', 15, 4.24, 4.556, 16.962],
  [37, 'Frame, inner double mount board, with designed & printed photo', '48×35 cm', 'Pc', 30, 24.38, 23.119, 86.938],
  [38, 'Mactac grey-back sticker printing, UV & matt lamination finish', '42 cm dia', 'Pc', 15, 1.59, 1.307, 4.978],
  [39, 'Mactac grey-back sticker printing, UV & matt lamination finish', '100×15 cm', 'Pc', 10, 1.06, 1.105, 4.125],
  [40, 'Reflective jacket, good quality with label', 'XS–XXL', 'Pc', 150, 2.65, 2.430, 9.162],
  [41, 'Wooden cube box with basement', '55×55 cm', 'Pc', 10, 127.2, 100.526, 384.301],
  [42, 'Design & print on tea paper cups', '7.7×5×7.2 cm', 'CTN', 200, 5.83, 5.897, 22.056],
  [43, 'Information sign board', '45×30 cm', 'Pc', 50, 5.3, 4.691, 17.748],
  [44, 'SD HSE sign boards', '115×90 cm', 'Pc', 100, 31.8, 24.136, 92.665],
  [45, 'A0 size printing — plant plot foam printing', 'A0', 'Pc', 15, 26.5, 25.965, 97.377],
  [46, 'Vehicle pass sticker', '10×7.5 cm', 'Pc', 2000, 0.848, 0.724, 2.747],
  [47, 'Event TV rental service', '43 or 50 inch', 'Day', 50, 10.6, 11.389, 42.406],
  [48, 'Canvas print', '80×60 cm', 'Pc', 20, 31.8, 30.155, 113.397],
  [49, 'Acrylic board', '80×60 cm', 'Pc', 10, 31.8, 26.142, 99.575],
  [50, 'Event certificate with frame', 'A4', 'Pc', 50, 5.3, 5.527, 20.627],
  [51, 'Event memento (crystal shield)', 'M', 'Pc', 50, 53, 48.586, 183.235],
  [52, 'Pocket booklet', 'S', 'Pc', 500, 4.24, 3.351, 12.816],
  [53, 'A4 booklet, less than 100 pages', 'A4', 'Pc', 25, 8.48, 8.576, 32.082],
  [54, 'LFI booklet', 'S', 'Pc', 800, 7.42, 6.568, 24.847],
]
const EX2_SERVICES = [
  [55, 'Exhibition stall installation and decoration (fabrication, supply, LED, TV, installation and removal with counter, chair and background stickers)', 'Per m²', 'm²', 30, 26.5, 20.113, 77.221],
  [56, 'Video documentary production + editing', 'Final product 10–15 min', 'No', 6, 424, 415.435, 1558.025],
  [57, 'Event photography', 'Per visit', 'hour', 25, 42.4, 36.193, 137.374],
  [58, 'Videography for the event with editing', 'Per visit', 'hour', 40, 106, 113.889, 424.059],
]
const ex2Item = ([no, description, size, uom, qty, ceUnit, c1, c2]) => ({
  no, description, size, uom, qty, ceUnit, bids: { C1: c1, C2: c2 },
})

const scenarioSimple = {
  id: 'ce-ex2',
  type: 'competitive-simple',
  tenderId: 'ITT-2025-022',
  tenderRef: 'CS-24-1180',
  title: 'Printing, Branding & Media Services Call-Off Contract',
  currency: 'OMR',
  ceLabel: 'Company Estimate (with 6% market increase)',
  duration: '3 years',
  basis: 'Call-off contract duration with estimated quantities as per the Company Estimate.',
  marketIncreasePct: 6,
  bidders: [
    { code: 'C1', id: 301, name: 'Bidder C1', country: 'Oman' },
    { code: 'C2', id: 302, name: 'Bidder C2', country: 'Oman' },
  ],
  schedules: [
    { id: 1, name: 'Material', subtotalLabel: 'Total estimated cost of material for 3 years', items: EX2_MATERIAL.map(ex2Item) },
    { id: 2, name: 'Services', subtotalLabel: 'Total estimated cost for services for 3 years', items: EX2_SERVICES.map(ex2Item) },
  ],
  grandTotalLabel: 'Grand total — materials + services for 3 years',
  normalization: {
    approved: 84060.55,
    normalized: 89104.18,
    approvedLabel: 'Previous contract basis',
    normalizedLabel: 'Company Estimate with 6% market escalation — the evaluation basis',
    items: [
      { ref: '—', title: 'Flat 6% market escalation applied to every line', effect: 'assume',
        detail: 'The Company Estimate is based on the previous contract with a market escalation of 6%. The uplift is baked into the estimated unit price before any comparison is made.' },
      { ref: '—', title: 'Call-off quantities held at the Company Estimate demand', effect: 'normalize',
        detail: 'The commercial evaluation was performed on the basis of a call-off contract duration with estimated quantities as per the Company Estimate.' },
    ],
  },
  sensitivityCases: [
    { no: 1, title: 'Material schedule only, services removed', basis: 'Isolates the 54 material lines, which carry the bulk of the call-off demand.',
      result: 'C1 remains L1 — the material schedule alone is 7.8% below the Company Estimate.', changed: false },
    { no: 2, title: 'Services schedule only, material removed', basis: 'Isolates the four service lines (exhibition stall, documentary, photography, videography).',
      result: 'C1 remains L1 — the services schedule alone is 1.0% below the Company Estimate.', changed: false },
    { no: 3, title: 'Call-off demand increased by 10% on the ten highest-value lines', basis: 'Tests whether the ranking survives a demand shift towards the high-value lines.',
      result: 'No change in outcome — C1 stays L1 and C2 stays materially above the Company Estimate.', changed: false },
  ],
  optimizationTargets: [
    { ref: '3', gapPct: 7, remark: 'Banner 250×100 cm — C1 is above the estimate on the single highest-volume banner line. Negotiate a volume rate at 100 pcs.' },
    { ref: '14', gapPct: 7, remark: 'Lifesaving rule cards at 6,000 pcs — the largest single quantity in the schedule; a small unit movement is worth material value.' },
    { ref: '25', gapPct: 7, remark: 'Round-neck T-shirt at 1,500 pcs — C1 is above the estimate; bundle with the polo T-shirt line for a combined rate.' },
    { ref: '58', gapPct: 7, remark: 'Videography with editing at 40 hours — the single largest service line and the only one above the estimate.' },
    { ref: '47', gapPct: 7, remark: 'Event TV rental service — priced above the estimate; consider a call-off day rate with a minimum-hire commitment.' },
  ],
  notes: {
    background: 'Competitive sourcing strategy — an Expression of Interest was shared with 45 suppliers. Approximately nine (9) bidders expressed interest and were invited to participate. Of these, four (4) submitted proposals, two (2) formally declined, one (1) missed the submission deadline and two (2) did not respond. Follow-up emails and phone calls were made to all invited bidders to encourage timely submission, without success. The technical evaluation qualified only two (2) of the four. Of the two disqualified, one did not submit its full proposal and the requested samples despite the extensions and follow-ups issued by OLNG; the second was disqualified for a lack of experience in graphic design, a crucial area the Contract Holder confirmed was a significant issue under the existing contract.',
    ceAdjustment: 'The Company Estimate is based on the previous contract with a market escalation of 6%. The commercial evaluation was performed on the basis of a call-off contract duration with estimated quantities as per the Company Estimate.',
    evaluation: 'Based on the submitted rates by all bidders: C1 is L1 at 7% lower than the Company Estimate, whereas C2 is 250% higher than the Company Estimate.',
    clarifications: 'Commercial clarifications were issued to both qualified bidders to confirm the basis of their offer, the validity of their rates over the three-year call-off and their acceptance of the OLNG payment terms. All responses are closed.',
    sensitivity: 'Sensitivity analysis was carried out over three cases — material only, services only and a 10% demand increase on the highest-value lines. The outcome is unchanged in every case.',
    optimization: 'A small number of lines sit above the Company Estimate even for L1 — the high-volume banner, the lifesaving rule cards, the round-neck T-shirt and the two event media services. These are to be negotiated with C1 before contract sign-off.',
  },
  commercialModel: [
    { criterion: 'Prevent awarding both the printing and the media production scope to the same awardee', applicable: false,
      reason: 'Not applicable — only two bidders qualified technically and both schedules were tendered as a single call-off.' },
    { criterion: 'Maximise significant technical capability difference within a reasonable commercial boundary', applicable: false,
      reason: 'Not applicable — the gap between L1 and L2 is far beyond the 3% commercial limit.' },
  ],
  award: {
    awardeeCode: 'C1', awardeeName: 'Bidder C1',
    duration: '3 years',
    value: 82786.50, valueLabel: 'Contract value over the 3-year call-off',
    acv: 82786.50, acvLabel: 'ACV as submitted to the Tender Board',
    text: 'Based on the commercial evaluation outcome, it is recommended to award the contract to C1 with an ACV value of 82,786.50 OMR.',
    conditions: [
      'Rates to be held firm for the full three-year call-off duration.',
      'Named lines above the Company Estimate to be negotiated before contract sign-off.',
    ],
  },
}

/* ═══════════════════════════════════════════════════════════════════════════
 * SCENARIO 3 — SINGLE SOURCE
 * TM-24-1345 "Thermal Spray Cladding services", USD, ONE bidder.
 * There is no L1/L2 ranking. The axis of comparison is the negotiation rounds:
 * initial offer (+1% vs CE) → 1st revision (-1%) → 2nd revision (-4%).
 * ═══════════════════════════════════════════════════════════════════════════ */

const EX3_ROUNDS = [
  { id: 'r1', label: 'Initial offer',       short: 'Initial',   sublabel: 'Original submission' },
  { id: 'r2', label: 'Revised offer — 1st round', short: '1st revision', sublabel: 'After the first negotiation round (held over Teams)' },
  { id: 'r3', label: 'Revised offer — 2nd round', short: '2nd revision', sublabel: 'After the second negotiation round' },
]

const scenarioSingleSource = {
  id: 'ce-ex3',
  type: 'single-source',
  tenderId: 'ITT-2025-023',
  tenderRef: 'TM-24-1345',
  title: 'Thermal Spray Cladding Services — Train 3 Shutdown',
  currency: 'USD',
  ceLabel: 'Optimized Company Estimate',
  duration: '7-day shutdown window (revised from 14 days)',
  basis: 'Single source tender — technical and commercial evaluation conducted in parallel.',
  bidder: { code: 'SOS', id: 401, name: 'Integrated Global Services (Single Source)', country: 'United States' },
  bidders: [{ code: 'SOS', id: 401, name: 'Integrated Global Services (Single Source)', country: 'United States' }],
  rounds: EX3_ROUNDS,
  roundResultPct: { r1: 1, r2: -1, r3: -4 },
  schedules: [
    {
      id: 1, name: 'Schedule 1 — Mobilisation and Demobilisation',
      items: [
        { ref: '1.1', description: 'Mobilization / site establishment / demobilization for repair of failed thermal spray coating',
          uom: 'Lump sum', qty: 1, ceUnit: 305582.30, bids: { r1: 308529.00, r2: 308529.00, r3: 308529.00 } },
      ],
    },
    {
      id: 2, name: 'Schedule 2 — Re-Generation Columns by Thermal Sprayed Cladding on internal surface area',
      items: [
        { ref: '2.1', description: 'Failed thermal spray coating removal in repair areas of Column 1C-1102',
          uom: 'm²', qty: 55, ceUnit: 1450, bids: { r1: 1610, r2: 1610, r3: 1520 } },
        { ref: '2.2', description: 'IGS HVTS application in repair areas of Column 1C-1102 on the shell',
          uom: 'm²', qty: 45, ceUnit: 6180, bids: { r1: 6940, r2: 6620, r3: 6180 } },
        { ref: '2.3', description: 'IGS HVTS application in repair areas of Column 1C-1102 on tray support rings & brackets',
          uom: 'm²', qty: 15, ceUnit: 5640, bids: { r1: 6120, r2: 6120, r3: 6120 } },
        { ref: '2.4', description: 'Stand-by rate beyond CONTRACTOR control',
          uom: 'Per shift hour', qty: 4, ceUnit: 1180, bids: { r1: 1340, r2: 1340, r3: 1340 } },
      ],
    },
    {
      id: 3, name: 'Schedule 3 — Supply of Rental Equipment and Manpower Services',
      partialDescope: true,
      items: [
        { ref: '3.1', description: 'Mob / de-mob cost (one-time) — 2× 850 CFM oil-free compressed air (9 bar / 130 psi, 20 °F outlet dew point), includes 1 back-up unit',
          uom: 'Lump sum', qty: 1, ceUnit: 68400, bids: { r1: 83736.62, r2: 82619.98, r3: 81580.01 } },
        { ref: '3.2', description: '2× 850 CFM oil-free compressed air (9 bar / 130 psi, 20 °F outlet dew point), includes 1 back-up unit',
          uom: 'Day', qty: 7, ceUnit: 9850, bids: { r1: 10850, r2: 10300, r3: 9850 } },
        { ref: '3.3', description: 'Mob / de-mob cost (one-time) — 2× dryer for compressor (to provide dry air)',
          uom: 'Lump sum', qty: 1, ceUnit: 18200, bids: { r1: 'included', r2: 'included', r3: 'included' } },
        { ref: '3.4', description: '2× dryer for compressor (to provide dry air)',
          uom: 'Day', qty: 7, ceUnit: 2450, bids: { r1: 2780, r2: 2780, r3: 2780 } },
        { ref: '3.5', description: 'Mob / de-mob cost (one-time) — 1× generator 150 KVA, electrical hook-ups for IGS cladding units & ancillary equipment (4 hook-ups, 60 Hz @ 380/480 V 3ph), includes 1 back-up unit',
          uom: 'Lump sum', qty: 1, ceUnit: 15600, bids: { r1: 'included', r2: 'included', r3: 'included' } },
        { ref: '3.6', description: '1× generator 150 KVA, electrical hook-ups for IGS cladding units & ancillary equipment, includes 1 back-up unit',
          uom: 'Day', qty: 7, ceUnit: 3180, bids: { r1: 3640, r2: 3640, r3: 3420 } },
        { ref: '3.7', description: 'Mob / de-mob cost (one-time) — vacuum equipment with operators to remove spent abrasives (6 t capacity, air remover, 3000 CFM suction at 500 mm WC, non-collapsible hoses)',
          uom: 'Lump sum', qty: 1, ceUnit: null, descoped: true,
          bids: { r1: 'descoped', r2: 'descoped', r3: 'descoped' } },
        { ref: '3.8', description: 'Vacuum equipment with operators to remove spent abrasives (6 t capacity, air remover, 3000 CFM suction at 500 mm WC, non-collapsible hoses)',
          uom: 'Per shift', qty: 14, ceUnit: null, descoped: true, deviation: true,
          bids: { r1: 'descoped', r2: 'descoped', r3: 'descoped' } },
        { ref: '3.9', description: 'Mob / de-mob cost (one-time) — air conditioning unit 100 kW with operator',
          uom: 'Lump sum', qty: 1, ceUnit: 21400, bids: { r1: 23900, r2: 23900, r3: 22600 } },
        { ref: '3.10', description: 'Air conditioning unit 100 kW with operator',
          uom: 'Day', qty: 7, ceUnit: 4260, bids: { r1: 4980, r2: 4720, r3: 4720 } },
        { ref: '3.11', description: '2 nos operators for compressor / generator / drier',
          uom: 'Per shift', qty: 14, ceUnit: 1240, bids: { r1: 'included', r2: 'included', r3: 'included' } },
        { ref: '3.12', description: '2 nos fire watcher',
          uom: 'Per shift', qty: 14, ceUnit: 980, bids: { r1: 'not_quoted', r2: 'not_quoted', r3: 'not_quoted' } },
        { ref: '3.13', description: '2 nos confined space attendants',
          uom: 'Per shift', qty: 14, ceUnit: 980, bids: { r1: 'not_quoted', r2: 'not_quoted', r3: 'not_quoted' } },
        { ref: '3.14', description: 'Contractor representative for auxiliary rental equipment site coordination',
          uom: 'Day', qty: 0, ceUnit: 0, deviation: true, bids: { r1: 'deviation', r2: 'deviation', r3: 'deviation' } },
      ],
    },
  ],
  ceOptimization: {
    approved: 1169417.00,
    approvedLabel: 'TB-approved Company Estimate — 14 days',
    optimized: 1059332.30,
    optimizedLabel: 'Optimized Company Estimate — 7 days, including partial de-scope',
    reference: 'Previous contract MPC-22-943 for similar work, used as the benchmark for the negotiation optimization opportunity and the sensitivity analysis.',
    items: [
      { ref: '—', title: 'Shutdown window cut from 14 days to 7 days', effect: 'normalize',
        detail: 'A shutdown time constraint revised the number of days from 14 to 7, so the Company Estimate was re-optimized on the shorter window.' },
      { ref: '3.7 / 3.8', title: 'Vacuum-truck equipment hire — de-scoped', effect: 'remove',
        detail: 'A deviation from the tender was found on Schedule 3: the equipment hire cost for the vacuum truck was unrealistic and can be sourced from alternatives at lower cost. The item was de-scoped from the evaluation.' },
      { ref: '3.12 / 3.13', title: 'Fire watchers and confined space attendants — client provided', effect: 'assume',
        detail: 'Not quoted by the bidder; OLNG will provide the resource. The Company Estimate retains the cost, so the lines are neutral to the comparison and are not valued at nil.' },
    ],
  },
  benchmark: {
    title: 'Benchmark for Train 3 and Train 2 cost',
    note: 'With a single source there is no second bid to rank against, so each priced line is tested against external rate sources converted from OMR to USD, and against the previous similar contract MPC-22-943.',
    sources: [
      { id: 'ogms', label: 'OGMS rate', hint: 'Converted OMR → USD' },
      { id: 'ta',   label: 'TA rate',   hint: 'Converted OMR → USD' },
      { id: 'cr',   label: 'CR rate',   hint: 'Converted OMR → USD' },
    ],
    priorContract: 'MPC-22-943',
    rows: [
      { ref: '3.7', description: 'Mob / de-mob cost (one-time) — vacuum equipment with operators to remove spent abrasives',
        uom: 'Lump sum for 2 trains', qty: 2, sosUnit: 24450, rates: { ogms: 3120.00, ta: 3480.00, cr: 4010.00 } },
      { ref: '3.8', description: 'Vacuum equipment with operators to remove spent abrasives',
        uom: 'Weekly (2 trains, 2 weeks = 14 days)', qty: 2, sosUnit: 68105, rates: { ogms: 6776.07, ta: 7180.40, cr: 8025.60 } },
    ],
    conclusion: 'On the worked line, the bidder’s 68,105 USD weekly rate for two trains (136,210 USD) sits 90% above the OGMS benchmark of 6,776.07 USD (13,552.15 USD). This is the deviation that drove the de-scope of the vacuum-truck equipment from the evaluation.',
  },
  scopeMerge: {
    title: 'Option — Scope merging Train 3 and Train 2',
    endorsedOn: '2 February 2025',
    background: 'While collecting demands for 2025 it was noticed that the same service will be required again for the Train-2 September 2025 shutdown. It was recommended to combine both scopes to obtain volume-leverage discounts, and the Tender Board endorsed the strategy amendment for scope merging on 2 February 2025. The option of merging the scope was carried into the second round of negotiation and produced a further discount.',
    rows: [
      { id: 1, name: 'Schedule 1 — Mobilization and Demobilization',       ceSingle: 305582.30, ceMerged: 611164.60, bidSingle: 308529.00, bidMerged: 612755.98 },
      { id: 2, name: 'Schedule 2 — Re-Generation Columns by Thermal Sprayed Cladding', ceSingle: 447170.00, ceMerged: 894340.00, bidSingle: 458860.00, bidMerged: 917720.00 },
      { id: 3, name: 'Schedule 3 — Supply of Rental Equipment and Manpower Services (partial de-scope)', ceSingle: 306580.00, ceMerged: 613160.00, bidSingle: 249570.01, bidMerged: 499140.02 },
    ],
    ceTotal: 2118664.60,
    bidTotal: 2029616.00,
    resultPct: -4,
    conclusion: 'The merged offer holds the second-round rates across both trains and adds a shared-mobilisation credit of 4,302.02 USD. Overall the bidder is 4% below the Company Estimate for both scopes.',
  },
  sensitivityCases: [
    { no: 1, title: 'Reinstate the de-scoped vacuum-truck equipment (3.7 & 3.8) at the submitted rate',
      basis: 'Tests the effect of accepting the deviation rather than sourcing the equipment separately.',
      result: 'The offer moves from 4% below the Company Estimate to materially above it — the de-scope is confirmed as the correct treatment.',
      changed: true },
    { no: 2, title: 'Price the two "not quoted — client to provide" lines (3.12 & 3.13) at the Company Estimate rate',
      basis: 'Tests whether the fire watchers and confined-space attendants change the comparison if the bidder had priced them.',
      result: 'No change in outcome — the offer remains below the optimized Company Estimate.',
      changed: false },
    { no: 3, title: 'Revert the shutdown window from 7 days back to 14 days',
      basis: 'Tests the offer against the original TB-approved Company Estimate of 1,169,417 USD for 14 days.',
      result: 'No change in outcome — the second-round offer remains below the approved Company Estimate.',
      changed: false },
    { no: 4, title: 'Evaluate the single Train-3 scope only, without the scope-merge option',
      basis: 'Tests whether the recommendation depends on the Train-2 merge.',
      result: 'No change in outcome — the second-round single-scope offer is already 4% below the optimized Company Estimate.',
      changed: false },
  ],
  notes: {
    background: 'This is a single source tender where the technical and commercial evaluation were conducted in parallel. The TB-approved Company Estimate was 1,169,417 USD for 14 days. The CE reference amount is based on the previous contract MPC-22-943 of similar work, and is used as the benchmark for the negotiation optimization opportunity and the sensitivity analysis.',
    ceAdjustment: 'Due to a shutdown time constraint the number of days was revised to 7, so the Company Estimate was optimized accordingly. A deviation from the tender was found on Schedule 3: the equipment hire cost for the vacuum truck was found to be unrealistic and can be sourced from alternatives at lower cost, so the item was de-scoped from the evaluation. The optimized total Company Estimate value is 1,059,332.30 USD for 7 days including the partial de-scope.',
    evaluation: 'Overall, the bidder’s initial submission offer was 1% higher than the Company Estimate. Commercial negotiation was conducted through Teams and resulted in a 1st revised submission 1% lower than the Company Estimate. A second round of negotiation resulted in a 2nd revised submission 4% lower than the Company Estimate. There is no L1 / L2 ranking — this is a single source tender, so value is demonstrated through the negotiation rounds and external rate benchmarking.',
    clarifications: 'Commercial clarifications were issued to the bidder covering the basis of the offer, the treatment of the lines marked "included", the lines not quoted where OLNG will provide the resource, and the vacuum-truck equipment deviation on Schedule 3. All responses are closed.',
    sensitivity: 'Sensitivity analysis was carried out over four cases covering the de-scoped equipment, the client-provided lines, the original 14-day window and the single-scope option. Only reinstating the de-scoped vacuum-truck equipment changes the outcome, which confirms the de-scope treatment.',
    optimization: 'While collecting demands for 2025 it was noticed that the same service will be required again for the Train-2 September 2025 shutdown. It is recommended to combine both scopes to obtain volume-leverage discounts; the Tender Board endorsed the strategy amendment for scope merging on 2 February 2025. The option of merging the scope was considered and produced a further discount from the bidder on the second submission.',
  },
  commercialModel: [
    { criterion: 'Competitive tension between two or more qualified bidders', applicable: false,
      reason: 'Not applicable — this is a single source tender. Value is evidenced through negotiation rounds and external rate benchmarking instead.' },
    { criterion: 'Volume leverage across combined shutdown scopes', applicable: true,
      reason: 'Applicable — the Train-2 and Train-3 scopes were merged with TB endorsement on 2 February 2025 and produced a further discount on the second submission.' },
  ],
  award: {
    awardeeCode: 'SOS', awardeeName: 'Integrated Global Services (Single Source)',
    duration: 'Train-3 and Train-2 shutdown scopes combined',
    value: 2029616.00, valueLabel: 'Total contract value with scope merging (Tr-2 & Tr-3)',
    acv: 2029616.00, acvLabel: 'ACV as submitted to the Tender Board',
    text: 'Tender Board is kindly requested to endorse the award of the contract "TM-24-1345: Thermal Spray Cladding services" to the bidder with scope merging for Tr-2 & Tr-3, of total ACV of $2,029,616.00.',
    conditions: [
      'Award is on the 2nd revised submission rates carried across both trains.',
      'Vacuum-truck equipment remains de-scoped and will be sourced separately at lower cost.',
      'Fire watchers and confined-space attendants to be provided by OLNG as reflected in the offer.',
    ],
  },
}

export const ceScenarios = [scenarioComplex, scenarioSimple, scenarioSingleSource]

const BY_ID = Object.fromEntries(ceScenarios.map(s => [s.id, s]))

/** The priced dataset behind a tender, or null when the tender uses the generic flow. */
export function ceScenarioFor(tender) {
  if (!tender) return null
  if (tender.commercialScenarioId) return BY_ID[tender.commercialScenarioId] || null
  return null
}

/** The declared evaluation shape of a tender. */
export function evaluationTypeOf(tender) {
  return tender?.evaluationType || ceScenarioFor(tender)?.type || null
}

/* ── Roll-up maths (competitive-complex tree) ─────────────────────────────── */
export function nodeCe(node) {
  return node.children ? node.children.reduce((s, c) => s + nodeCe(c), 0) : (node.ce || 0)
}
export function nodeBid(node, code) {
  return node.children ? node.children.reduce((s, c) => s + nodeBid(c, code), 0) : (node.bids?.[code] || 0)
}
/** Flatten the tree to rows carrying their depth, for table rendering. */
export function flattenRollup(nodes, depth = 0, out = []) {
  nodes.forEach(n => {
    out.push({ ...n, depth, isGroup: !!n.children })
    if (n.children) flattenRollup(n.children, depth + 1, out)
  })
  return out
}
/** Locate a node anywhere in the tree by its Section E reference. */
export function findNode(nodes, ref) {
  for (const n of nodes) {
    if (n.ref === ref) return n
    if (n.children) { const hit = findNode(n.children, ref); if (hit) return hit }
  }
  return null
}

const pctOf = (v, base) => (base ? ((v - base) / base) * 100 : null)

/* ── Totals ───────────────────────────────────────────────────────────────
 * Every roll-up is derived from the line data, so a schedule subtotal, a
 * fixed/non-fixed split and the grand total can never drift apart.           */

export function complexTotals(scenario) {
  const codes = scenario.bidders.map(b => b.code)
  const ce = scenario.rollup.reduce((s, n) => s + nodeCe(n), 0)
  const bids = Object.fromEntries(codes.map(c => [c, scenario.rollup.reduce((s, n) => s + nodeBid(n, c), 0)]))
  const groups = Object.fromEntries(scenario.fixedGroups.map(g => {
    const nodes = scenario.rollup.filter(n => n.group === g.key)
    return [g.key, {
      ce: nodes.reduce((s, n) => s + nodeCe(n), 0),
      bids: Object.fromEntries(codes.map(c => [c, nodes.reduce((s, n) => s + nodeBid(n, c), 0)])),
    }]
  }))
  const ranked = codes.map(c => ({ code: c, total: bids[c], pct: pctOf(bids[c], ce) }))
    .sort((a, b) => a.total - b.total)
  const [l1, l2] = ranked
  return {
    ce, bids, groups, ranked, l1, l2,
    gapPct: l1 && l2 ? pctOf(l2.total, l1.total) : null,
  }
}

export function simpleTotals(scenario) {
  const codes = scenario.bidders.map(b => b.code)
  const lineTotal = (it, code) => it.qty * (code ? (it.bids[code] ?? 0) : it.ceUnit)
  const schedules = scenario.schedules.map(sc => ({
    id: sc.id, name: sc.name, subtotalLabel: sc.subtotalLabel,
    ce: sc.items.reduce((s, it) => s + lineTotal(it), 0),
    bids: Object.fromEntries(codes.map(c => [c, sc.items.reduce((s, it) => s + lineTotal(it, c), 0)])),
  }))
  const ce = schedules.reduce((s, x) => s + x.ce, 0)
  const bids = Object.fromEntries(codes.map(c => [c, schedules.reduce((s, x) => s + x.bids[c], 0)]))
  const ranked = codes.map(c => ({ code: c, total: bids[c], pct: pctOf(bids[c], ce) }))
    .sort((a, b) => a.total - b.total)
  const [l1, l2] = ranked
  return { ce, bids, schedules, ranked, l1, l2, gapPct: l1 && l2 ? pctOf(l2.total, l1.total) : null, lineTotal }
}

export function singleSourceTotals(scenario) {
  const roundIds = scenario.rounds.map(r => r.id)
  // Non-numeric cells (`included`, `not quoted`, `deviation`, `de-scoped`) are
  // excluded from the total — they are NOT valued at zero.
  const lineCe  = (it) => (it.ceUnit == null ? null : it.qty * it.ceUnit)
  const lineBid = (it, rid) => {
    const amt = bidAmount(it.bids?.[rid])
    return amt == null ? null : amt * it.qty
  }
  const schedules = scenario.schedules.map(sc => ({
    id: sc.id, name: sc.name, partialDescope: sc.partialDescope,
    ce: sc.items.reduce((s, it) => s + (lineCe(it) || 0), 0),
    rounds: Object.fromEntries(roundIds.map(r => [r, sc.items.reduce((s, it) => s + (lineBid(it, r) || 0), 0)])),
  }))
  const ce = schedules.reduce((s, x) => s + x.ce, 0)
  const rounds = Object.fromEntries(roundIds.map(r => {
    const total = schedules.reduce((s, x) => s + x.rounds[r], 0)
    return [r, { total, pct: pctOf(total, ce) }]
  }))
  const last = roundIds[roundIds.length - 1]
  return { ce, schedules, rounds, final: rounds[last], finalRoundId: last, lineCe, lineBid }
}

/**
 * One shape-agnostic summary the page uses for its header, its audit trail and
 * the recommendation it hands to the SCM award gate.
 */
export function ceSummary(scenario) {
  if (!scenario) return null
  if (scenario.type === 'single-source') {
    const t = singleSourceTotals(scenario)
    return {
      type: scenario.type, ranked: false, ceTotal: t.ce,
      awardCode: scenario.bidder.code, awardName: scenario.bidder.name,
      awardTotal: scenario.award.value, awardPct: t.final.pct,
      totals: t,
    }
  }
  const t = scenario.type === 'competitive-complex' ? complexTotals(scenario) : simpleTotals(scenario)
  const winner = scenario.bidders.find(b => b.code === scenario.award.awardeeCode) || scenario.bidders[0]
  return {
    type: scenario.type, ranked: true, ceTotal: t.ce,
    awardCode: winner.code, awardName: winner.name,
    awardTotal: t.bids[winner.code], awardPct: pctOf(t.bids[winner.code], t.ce),
    totals: t,
  }
}
