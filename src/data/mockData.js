export const tenders = [
  // ── Technical Evaluation ──────────────────────────────────────────────────
  {
    id: 'ITT-2025-001',
    title: 'Cloud Infrastructure Upgrade — Government National Data Centre',
    department: 'Information Technology Authority (ITA)',
    budget: 'OMR 923,000',
    status: 'tech_eval',
    stage: 'Technical Evaluation',
    evalProgress: 'in_progress',
    created: '2025-03-10',
    deadline: '2025-04-15',
    bidders: 4,
    aiScore: 96,
    assignedTechEval: { id: 8, name: 'Fatima Al-Ali' },
    assignedCommEval: { id: 2, name: 'John Smith' },
  },
  {
    id: 'ITT-2025-007',
    title: 'Muscat Smart City IoT Sensors & Connectivity Platform',
    department: 'Muscat Municipality',
    budget: 'OMR 577,000',
    status: 'tech_eval',
    stage: 'Technical Evaluation',
    evalProgress: 'not_started',
    created: '2025-03-22',
    deadline: '2025-05-10',
    bidders: 3,
    aiScore: 89,
    assignedTechEval: { id: 8, name: 'Fatima Al-Ali' },
    assignedCommEval: { id: 2, name: 'John Smith' },
  },
  {
    id: 'ITT-2025-008',
    title: 'National Data Centre Modernisation & Virtualisation',
    department: 'Information Technology Authority (ITA)',
    budget: 'OMR 808,000',
    status: 'tech_eval',
    stage: 'Technical Evaluation',
    evalProgress: 'not_started',
    created: '2025-03-28',
    deadline: '2025-05-20',
    bidders: 4,
    aiScore: 94,
    assignedTechEval: { id: 8, name: 'Fatima Al-Ali' },
    assignedCommEval: { id: 2, name: 'John Smith' },
  },

  // ── Commercial Evaluation ─────────────────────────────────────────────────
  {
    id: 'ITT-2025-006',
    title: 'Muscat Expressway Bridge Rehabilitation — Phase 3',
    department: 'Ministry of Transport, Communications & IT',
    budget: 'OMR 1,539,000',
    status: 'comm_eval',
    stage: 'Commercial Evaluation',
    evalProgress: 'in_progress',
    created: '2025-02-28',
    deadline: '2025-04-01',
    bidders: 3,
    aiScore: 91,
    assignedTechEval: { id: 8, name: 'Fatima Al-Ali' },
    assignedCommEval: { id: 2, name: 'John Smith' },
  },
  {
    id: 'ITT-2025-009',
    title: 'Government Vehicle Fleet Management & Tracking System',
    department: 'Ministry of Transport, Communications & IT',
    budget: 'OMR 462,000',
    status: 'comm_eval',
    stage: 'Commercial Evaluation',
    evalProgress: 'not_started',
    created: '2025-02-15',
    deadline: '2025-04-25',
    bidders: 3,
    aiScore: 87,
    assignedTechEval: { id: 8, name: 'Fatima Al-Ali' },
    assignedCommEval: { id: 2, name: 'John Smith' },
  },
  {
    id: 'ITT-2025-010',
    title: 'Ministry of Health Integrated Information System',
    department: 'Ministry of Health',
    budget: 'OMR 1,347,000',
    status: 'comm_eval',
    stage: 'Commercial Evaluation',
    evalProgress: 'not_started',
    created: '2025-03-01',
    deadline: '2025-05-15',
    bidders: 4,
    aiScore: 92,
    assignedTechEval: { id: 8, name: 'Fatima Al-Ali' },
    assignedCommEval: { id: 2, name: 'John Smith' },
  },

  // ── SCM approval gates (one tender parked at each gate) ───────────────────
  {
    id: 'ITT-2025-013',
    title: 'Oman National Railway Signalling & Control System',
    department: 'Oman Rail',
    budget: 'OMR 2,770,000',
    status: 'scm_gate1',
    stage: 'SCM Review — Technical',
    evalProgress: 'in_progress',
    created: '2025-01-10',
    deadline: '2025-03-25',
    bidders: 4,
    aiScore: 93,
  },
  {
    id: 'ITT-2025-014',
    title: 'Al Ghubrah Desalination Plant SCADA Upgrade',
    department: 'Oman Electricity Transmission Company',
    budget: 'OMR 1,731,000',
    status: 'scm_gate2',
    stage: 'SCM Review — Commercial & Award',
    evalProgress: 'not_started',
    created: '2025-01-28',
    deadline: '2025-04-05',
    bidders: 3,
    aiScore: 86,
  },
  {
    id: 'ITT-2025-015',
    title: 'Civil Defence Integrated Emergency Response Platform',
    department: 'Civil Defence & Ambulance Authority',
    budget: 'OMR 693,000',
    status: 'scm_gate3',
    stage: 'SCM Review — Contract Draft',
    evalProgress: 'not_started',
    created: '2025-02-18',
    deadline: '2025-04-30',
    bidders: 3,
    aiScore: 90,
    // Already through gate 2 — the award decision is recorded, so gate 3 can
    // show exactly what approving will issue.
    mgmtWinnerId: 1,
    mgmtRemarks: 'Strongest technical response and within budget envelope.',
    contractDraftReady: true,
  },

  // ── Other Stages ───────────────────────────────────────────────────────────
  {
    id: 'ITT-2025-003',
    title: 'Government Integrated ERP System Implementation (Oracle Fusion)',
    department: 'Ministry of Finance',
    budget: 'OMR 1,231,000',
    status: 'award',
    stage: 'Award Recommended',
    created: '2025-01-15',
    deadline: '2025-03-20',
    bidders: 4,
    aiScore: 88,
  },

  // ── Post-Award Phases ──────────────────────────────────────────────────────
  {
    id: 'ITT-2025-016',
    title: 'Salalah Port Container Terminal Automation',
    department: 'Ministry of Transport, Communications & IT',
    budget: 'OMR 1,120,000',
    status: 'legal_review',
    stage: 'Legal Review',
    created: '2024-12-05',
    deadline: '2025-02-10',
    bidders: 4,
    aiScore: 90,
  },
  {
    id: 'ITT-2025-017',
    title: 'Duqm Refinery Fire Safety Systems Upgrade',
    department: 'Oman Electricity Transmission Company',
    budget: 'OMR 640,000',
    status: 'contract_execution',
    stage: 'Contract Execution',
    created: '2024-11-20',
    deadline: '2025-01-15',
    bidders: 3,
    aiScore: 92,
  },
  {
    id: 'ITT-2025-018',
    title: 'Nizwa Regional Hospital Medical Equipment Supply',
    department: 'Ministry of Health',
    budget: 'OMR 845,000',
    status: 'active',
    stage: 'Contract Active',
    created: '2024-09-10',
    deadline: '2024-11-05',
    bidders: 3,
    aiScore: 88,
    contractStartDate: '2024-11-20',
    kpiTracking: true,
    deliveryProgress: 62,
    paymentMilestones: [
      { id: 1, label: 'Mobilisation Advance', amount: 'OMR 84,500', due: '2024-12-01', status: 'paid' },
      { id: 2, label: 'Equipment Delivery — Phase 1', amount: 'OMR 253,500', due: '2025-02-01', status: 'paid' },
      { id: 3, label: 'Equipment Delivery — Phase 2', amount: 'OMR 253,500', due: '2025-05-01', status: 'pending' },
      { id: 4, label: 'Final Acceptance & Retention', amount: 'OMR 253,500', due: '2025-08-01', status: 'upcoming' },
    ],
    issues: [
      { id: 1, label: 'Minor delay in customs clearance for imaging units', severity: 'low', status: 'resolved' },
      { id: 2, label: 'Calibration certificate pending for lab analysers', severity: 'medium', status: 'open' },
    ],
    periodicReviews: [
      { id: 1, date: '2025-01-15', reviewer: 'John Smith', note: 'Delivery on track, quality checks passed for Phase 1 equipment.' },
    ],
  },
  {
    id: 'ITT-2025-019',
    title: 'Sohar Industrial Estate Fibre Backbone Rollout',
    department: 'Information Technology Authority (ITA)',
    budget: 'OMR 398,000',
    status: 'contract_closure',
    stage: 'Closure In Progress',
    created: '2024-06-01',
    deadline: '2024-08-01',
    bidders: 3,
    aiScore: 85,
    contractStartDate: '2024-08-15',
    kpiTracking: true,
    deliveryProgress: 100,
  },
  // A generated ITT (sectionsGenerated) — appears in the ITT Draft picker for the
  // Contract Engineer / HSE / ICV so they can open and fill their own sections
  // straight from the sidebar, not only via a dashboard/Tender Tracking link.
  {
    id: 'ITT-2025-011',
    title: 'Sur Port Cargo Terminal — Crane & Handling Equipment',
    tenderType: 'Goods',
    department: 'Ministry of Transport, Communications & IT',
    status: 'draft',
    stage: 'Draft — Pending Export',
    psfCompleted: true,
    psfCompletedAt: '2026-07-01',
    sectionsGenerated: true,
    b1Category: 'medium-value',
    sectionAnswers: {},
    sectionApproved: {},
    selectedTemplates: ['company-estimate', 'contract-risk', 'icv', 'technical-eval-matrix', 'hse-risk', 'negotiation-strategy'],
    created: '2025-04-05',
    deadline: '2025-07-30',
    budget: 'OMR 640,000',
    bidders: 0,
    aiScore: null,
    description: 'Supply, delivery and commissioning of quayside cargo-handling cranes and associated equipment for the Sur Port cargo terminal.',
    assignedContractEngineers: [{ id: 2, name: 'John Smith' }],
    assignedContractEngineer: { id: 2, name: 'John Smith' },
  },
  {
    id: 'ITT-2025-020',
    title: 'Buraimi Border Crossing Security Systems Upgrade',
    tenderType: 'Works',
    department: 'Royal Oman Police',
    status: 'draft',
    stage: 'Draft — Pending Export',
    psfCompleted: true,
    psfCompletedAt: '2026-06-20',
    selectedTemplates: ['company-estimate', 'contract-risk', 'icv', 'technical-eval-matrix', 'hse-risk', 'negotiation-strategy'],
    created: '2025-04-01',
    deadline: '2025-06-15',
    budget: 'OMR 1,245,000',
    bidders: 2,
    aiScore: null,
    sowFileName: 'Buraimi-Border-Security-SOW.pdf',
    workCategory: 'Electrical & Instrumentation',
    description: 'Upgrade of border crossing security systems including surveillance, access control, and communication infrastructure.',
    bidderList: [
      { id: 102, name: 'InfraCore Systems', country: 'UAE' },
      { id: 107, name: 'Al Amana Fire & Safety', country: 'Oman' },
    ],
    handoffDocuments: {
      icv: 'ICV-Plan.xlsx',
      companyEstimate: 'Internal-Company-Estimate.xlsx',
      riskAssessment: 'Contract-Risk-Assessment.xlsx',
    },
    prequalBidders: [
      {
        id: 102, name: 'InfraCore Systems', country: 'UAE', category: 'Electrical & Instrumentation', isLocal: false,
        responseUploaded: true,
        stage3: {
          qhse: { q1: 'pass', q2: 'pass', q3: 'pass' },
          technical: { t1: 'pass', t2: 'pass', t3: 'pass', t4: 'pass', t5: 'pass' },
          administrative: { a1: 'pass', a2: 'pass', a3: 'pass', a5: 'pass' },
        },
        stage3Ai: {
          qhse: { q1: 'pass', q2: 'pass', q3: 'pass' },
          technical: { t1: 'pass', t2: 'pass', t3: 'pass', t4: 'pass', t5: 'pass' },
          administrative: { a1: 'pass', a2: 'pass', a3: 'pass', a5: 'pass' },
        },
        stage4: { result: 'PASS' },
      },
      {
        id: 107, name: 'Al Amana Fire & Safety', country: 'Oman', category: 'Fire & Safety Systems', isLocal: true,
        responseUploaded: true,
        stage3: {
          qhse: { q1: 'pass', q2: 'fail', q3: 'pass' },
          technical: { t1: 'pass', t2: 'pass', t3: 'pass', t4: 'pass', t5: 'pass' },
          administrative: { a1: 'pass', a2: 'pass', a3: 'pass', a4: 'pass', a5: 'pass' },
        },
        stage3Ai: {
          qhse: { q1: 'pass', q2: 'fail', q3: 'pass' },
          technical: { t1: 'pass', t2: 'pass', t3: 'pass', t4: 'pass', t5: 'pass' },
          administrative: { a1: 'pass', a2: 'pass', a3: 'pass', a4: 'pass', a5: 'pass' },
        },
        stage4: { result: 'PASS' },
      },
      {
        id: 104, name: 'DataVault Solutions', country: 'Saudi Arabia', category: 'IT & Communications', isLocal: false,
        responseUploaded: false,
        stage3: { qhse: {}, technical: {}, administrative: {} },
        droppedAt: 'stage1',
      },
    ],
  },
]

export const bidders = [
  { id: 1, name: 'TechSolutions Ltd',   country: 'Oman',         techScore: 88, commScore: 82, totalBid: 'OMR 828,000',  recommended: true },
  { id: 2, name: 'InfraCore Systems',   country: 'UAE',          techScore: 84, commScore: 91, totalBid: 'OMR 762,000',  recommended: false },
  { id: 3, name: 'CloudNexus Corp',     country: 'India',        techScore: 79, commScore: 85, totalBid: 'OMR 882,000',  recommended: false },
  { id: 4, name: 'DataVault Solutions', country: 'Saudi Arabia', techScore: 72, commScore: 78, totalBid: 'OMR 712,000',  recommended: false },
]

// ── Commercial Evaluation (Competitive – simple) ───────────────────────────
// Line-item Company Estimate (Bill of Quantities), modelled on the client's
// "Commercial Evaluation – Example 2 (Competitive – simple)" workbook: a priced
// schedule split into Material & Services. `estUnit` is the base unit rate; the
// estimate applies a 6% market increase on top. The evaluator compares each
// bidder's submitted unit rates against this estimate.
export const COMMERCIAL_MARKET_INCREASE = 0.06
export const commercialEstimate = [
  { id: 'm1',  section: 'Material', no: 1,  description: 'Rospa poster — photo-quality design & print', size: '50×76 cm',   uom: 'Pc',  qty: 15,   estUnit: 18.0 },
  { id: 'm2',  section: 'Material', no: 2,  description: 'Roll-up stand — design & print',               size: '200×80 cm',  uom: 'Pc',  qty: 10,   estUnit: 35.0 },
  { id: 'm3',  section: 'Material', no: 3,  description: 'Banner — design & print with eyelets',         size: '250×100 cm', uom: 'Pc',  qty: 100,  estUnit: 25.0 },
  { id: 'm4',  section: 'Material', no: 4,  description: 'Helmet sticker — 4-colour, weatherproof',      size: '5×5 cm',     uom: 'Set', qty: 2000, estUnit: 0.5  },
  { id: 'm5',  section: 'Material', no: 5,  description: 'Hand book — 200gsm, 4-colour, 14 pages',       size: '29×21 cm',   uom: 'Pc',  qty: 500,  estUnit: 0.5  },
  { id: 'm6',  section: 'Material', no: 6,  description: 'Newsletter — design & 4-colour print',         size: 'A4',         uom: 'Pc',  qty: 103,  estUnit: 1.0  },
  { id: 'm7',  section: 'Material', no: 7,  description: 'Site safety board with wooden frame',          size: '200×150 cm', uom: 'Pc',  qty: 30,   estUnit: 40.0 },
  { id: 'm8',  section: 'Material', no: 8,  description: 'Lifesaving rule cards — PVC, both sides',      size: 'ID card',    uom: 'Pc',  qty: 6000, estUnit: 0.9  },
  { id: 'm9',  section: 'Material', no: 9,  description: 'Reflective jacket — good quality with label',  size: 'Assorted',   uom: 'Pc',  qty: 150,  estUnit: 2.5  },
  { id: 'm10', section: 'Material', no: 10, description: 'HSE sign boards',                              size: '115×90 cm',  uom: 'Pc',  qty: 100,  estUnit: 30.0 },
  { id: 's1',  section: 'Services', no: 11, description: 'Exhibition stall installation & decoration',   size: 'Per m²',     uom: 'm²',  qty: 30,   estUnit: 25.0 },
  { id: 's2',  section: 'Services', no: 12, description: 'Video documentary production + editing',       size: '10–15 min',  uom: 'No',  qty: 6,    estUnit: 400.0 },
  { id: 's3',  section: 'Services', no: 13, description: 'Event photography',                            size: 'Per visit',  uom: 'hour', qty: 25,   estUnit: 40.0 },
]

// Each bidder's overall pricing posture vs the estimate. Per-item rates are
// derived from this factor with a small deterministic per-item variation, so
// bidders land at different grand totals (the lowest compliant one is
// recommended). Bidder 2 is the keenest among the first three; bidder 4 the
// keenest of all four.
export const commercialBidFactors = { 1: 1.03, 2: 0.91, 3: 1.10, 4: 0.86 }

// Mandatory commercial documents each bidder must submit — the compliance gate
// (step 2, part A) that precedes any evaluation of price. `localOnly` rows are
// N/A for foreign bidders; `conditional` rows are N/A when the tender does not
// call for them.
export const commercialComplianceDocs = [
  { id: 'cd5', group: 'Tender Submission',        name: 'Completed & Signed Form of Tender',      mandatory: true },
  { id: 'cd6', group: 'Tender Submission',        name: 'Signed Tender Documents',                mandatory: true },
  { id: 'cd1', group: 'Tender Submission',        name: 'Priced Schedule of Prices (Section E)',  mandatory: true },
  { id: 'cd4', group: 'Tender Submission',        name: 'Price Validity Confirmation (120 days)', mandatory: true },
  { id: 'cd3', group: 'Tender Submission',        name: 'Commercial Terms & Conditions Acceptance', mandatory: true },
  { id: 'cd7',  group: 'Registration & Statutory', name: 'OPAL Registration',                     mandatory: true },
  { id: 'cd8',  group: 'Registration & Statutory', name: 'JSRS Registration',                     mandatory: true },
  { id: 'cd9',  group: 'Registration & Statutory', name: 'Commercial Registration (CR)',          mandatory: true },
  { id: 'cd10', group: 'Registration & Statutory', name: 'Tax Certificate',                       mandatory: true },
  { id: 'cd11', group: 'Registration & Statutory', name: 'MoL Omanization Certificate',           mandatory: true, localOnly: true },
  { id: 'cd12', group: 'Authority & Security',     name: 'Power of Attorney / Signatory Authority', mandatory: true },
  { id: 'cd2',  group: 'Authority & Security',     name: 'Tender Guarantee / Bid Bond',           mandatory: true, conditional: true },
  { id: 'cd13', group: 'Authority & Security',     name: 'Insurance Certificate',                 mandatory: true },
]

export const commercialComplianceGroups = ['Tender Submission', 'Registration & Statutory', 'Authority & Security']

// ── Commercial Evaluation — the nine evaluation steps ──────────────────────
// The commercial evaluation runs as nine sequential AI passes. Award
// Recommendation is always last and only unlocks once every preceding step is
// complete.
//
// Sequencing note: Sensitivity Analysis (step 5) runs BEFORE the preference
// mechanisms (step 6) so two questions can be answered independently —
// (1) who has the best offer on pure commercial merit, and (2) how the ranking
// moves once Local Content, ICV, PAF and Omani Preference are applied.
export const commercialSteps = [
  {
    no: 1, id: 'extraction',
    name: 'Commercial Data Extraction', short: 'Data Extraction',
    purpose: 'Convert bidder submissions into structured, machine-readable commercial data with full evidence references.',
    steps: [
      'Opening bidder commercial submissions…',
      'Parsing priced schedules & unit rates…',
      'Extracting payment, warranty & delivery commitments…',
      'Extracting bonds, insurance & escalation clauses…',
      'Capturing LC / ICV commitments & evidence references…',
    ],
  },
  {
    no: 2, id: 'compliance', name: 'Commercial Compliance', short: 'Compliance',
    purpose: 'Verify compliance against mandatory tender requirements and ITT conditions before any evaluation of price.',
    steps: [
      'Opening bidder commercial documents…',
      'Checking mandatory submission documents…',
      'Validating registrations & statutory certificates…',
      'Reviewing commercial terms against ITT conditions…',
      'Classifying bidder responsiveness…',
    ],
  },
  {
    no: 3, id: 'risk', name: 'Commercial Risk', short: 'Risk',
    purpose: 'Assess commercial and contractual risk exposure. Findings are recommendations only — never automatic rejections.',
    steps: [
      'Screening cash-flow & advance payment exposure…',
      'Testing cost certainty & escalation exposure…',
      'Checking delivery security & liability cover…',
      'Rating and ranking the risk register…',
    ],
  },
  {
    no: 4, id: 'benchmark', name: 'Price Normalization & Benchmarking', short: 'Normalization',
    purpose: 'Establish the true commercial position through an apples-to-apples comparison against the company estimate and historical awards.',
    steps: [
      'Comparing unit rates against the company estimate…',
      'Rolling up section & grand totals…',
      'Normalizing bidder pricing structures…',
      'Benchmarking against historical awarded contracts…',
      'Screening abnormal bids & line-item outliers…',
    ],
  },
  {
    no: 5, id: 'sensitivity', name: 'Sensitivity Analysis', short: 'Sensitivity',
    purpose: 'Stress-test the commercial ranking under pure market and commercial assumptions, before any policy-driven adjustment is applied.',
    steps: [
      'Modelling escalation scenarios (+2% / +5% / +10%)…',
      'Modelling quantity variation (−20% … +20%)…',
      'Modelling currency movement (±5% / ±10%)…',
      'Discounting payment terms to NPV…',
      'Testing ranking stability across all scenarios…',
    ],
  },
  {
    no: 6, id: 'preference', optional: true, name: 'LC + ICV + PAF + Omani Preference', short: 'LC / ICV / PAF',
    purpose: 'Apply all strategic value and localization preference mechanisms. The single source of truth for evaluation adjustments, configurable per tender.',
    steps: [
      'Reading LC scores & ICV retained values…',
      'Calculating LCC and ICV adjustment factors…',
      'Applying the Price Adjustment Factor (PAF)…',
      'Applying Omani Company preference…',
      'Re-ranking on evaluated price…',
    ],
  },
  {
    no: 7, id: 'negotiation', optional: true, name: 'Negotiation Strategy', short: 'Negotiation',
    purpose: 'Identify value-improvement opportunities. Activated only when the tendering strategy permits commercial negotiations.',
    steps: [
      'Scanning priced schedules for negotiable elements…',
      'Testing escalation & payment-term positions…',
      'Quantifying indicative savings…',
      'Drafting the negotiation position…',
    ],
  },
  {
    no: 8, id: 'clarification', name: 'Clarification Management', short: 'Clarifications',
    purpose: 'Draft and track bidder clarification requests and responses until closure.',
    steps: [
      'Collecting open findings from the preceding steps…',
      'Drafting clarification requests per bidder…',
      'Building the clarification register…',
      'Opening the closure tracker…',
    ],
  },
  {
    no: 9, id: 'award', name: 'Award Recommendation', short: 'Award',
    purpose: 'Consolidate the outputs of every preceding step into an auditable recommendation package for the Endorsing Body.',
    steps: [
      'Consolidating outputs from every preceding step…',
      'Verifying every mandatory gate is closed…',
      'Assembling the evaluated price ranking…',
      'Drafting the recommendation package…',
    ],
  },
]

// ── Step 1 — the commercial data points extracted from each submission ────
export const commercialExtractionFields = [
  { id: 'pricing',    label: 'Pricing Schedule' },
  { id: 'discount',   label: 'Discounts' },
  { id: 'payment',    label: 'Payment Terms' },
  { id: 'warranty',   label: 'Warranty Commitment' },
  { id: 'delivery',   label: 'Delivery Schedule' },
  { id: 'bond',       label: 'Performance Bond' },
  { id: 'insurance',  label: 'Insurance Requirements' },
  { id: 'escalation', label: 'Escalation Clause' },
  { id: 'lc',         label: 'Local Content (LC) Commitment' },
  { id: 'icv',        label: 'ICV Commitment' },
]

// ── Step 2 (part B) — commercial conditions reviewed against the ITT ──────
export const commercialReviewItems = [
  { id: 'cr1', name: 'Payment Terms',                 requirement: '60 days from certified invoice · no advance payment' },
  { id: 'cr2', name: 'Warranty / Defects Liability',  requirement: '24 months from acceptance' },
  { id: 'cr3', name: 'Insurance',                     requirement: 'CAR + Workmen’s Comp + Third Party · min OMR 2,000,000' },
  { id: 'cr4', name: 'Performance Bond',              requirement: '10% of contract value, valid to DLP expiry' },
  { id: 'cr5', name: 'Delivery Schedule',             requirement: 'Completion within 24 weeks of Notice to Proceed' },
  { id: 'cr6', name: 'Escalation',                    requirement: 'Fixed price, or CPI-linked capped at 3% p.a.' },
  { id: 'cr7', name: 'Liquidated Damages',            requirement: '0.5% per week of delay, capped at 10%' },
  { id: 'cr8', name: 'Limitation of Liability',       requirement: 'Not less than 100% of contract value' },
]

// Responsiveness is driven by the mandatory submission matrix alone. Commercial
// deviations and exceptions never reject a bidder on their own — they make the
// bidder conditionally responsive, pending clarification.
export const commercialResponsiveness = {
  responsive:    { label: 'Responsive',               badge: 'compliant',         hint: 'All mandatory requirements met, no commercial deviations.' },
  conditional:   { label: 'Conditionally Responsive', badge: 'partial_compliant', hint: 'Mandatory requirements met, but deviations / exceptions need clarification.' },
  nonResponsive: { label: 'Non-Responsive',           badge: 'non_compliant',     hint: 'A mandatory submission requirement failed — excluded from the price comparison.' },
}

// ── Step 3 — commercial risk rules (advisory, never a rejection) ──────────
export const commercialRiskRules = [
  { id: 'rk1', risk: 'Advance payment requested',              impact: 'Cash-flow exposure', rating: 'High',
    applies: p => p.advancePct > 0,
    detail:  p => `${(p.advancePct * 100).toFixed(0)}% of the contract value requested up front, ahead of any delivery milestone.`,
    mitigation: 'Require an advance payment guarantee for 100% of the advance, or negotiate the advance out entirely.' },
  { id: 'rk2', risk: 'Unlimited / uncapped escalation',        impact: 'Cost certainty', rating: 'High',
    applies: p => p.escalationCapPct == null,
    detail:  p => `Escalation is open-ended over ~${(p.escalationExposure * 100).toFixed(0)}% of the priced scope, with no annual ceiling.`,
    mitigation: 'Cap escalation at 3% p.a. against a published index, or convert to a fixed-price basis.' },
  { id: 'rk3', risk: 'No performance bond',                    impact: 'Delivery security', rating: 'Medium',
    applies: p => !p.performanceBondPct,
    detail:  () => 'No performance security offered — OLNG carries the full non-performance exposure.',
    mitigation: 'Make a 10% unconditional performance bond a condition of award.' },
  { id: 'rk4', risk: 'Performance bond below requirement',     impact: 'Delivery security', rating: 'Medium',
    applies: p => p.performanceBondPct > 0 && p.performanceBondPct < 10,
    detail:  p => `Bond offered at ${p.performanceBondPct}% against the 10% ITT requirement.`,
    mitigation: 'Require the bond to be topped up to 10% before contract signature.' },
  { id: 'rk5', risk: 'Uninsured personnel',                    impact: 'Liability', rating: 'Medium',
    applies: p => !p.personnelInsured,
    detail:  () => 'No Workmen’s Compensation / personnel cover evidenced in the submission.',
    mitigation: 'Obtain certificates of cover for all site personnel before mobilisation.' },
  { id: 'rk6', risk: 'Long delivery period',                   impact: 'Schedule', rating: 'Medium',
    applies: p => p.deliveryWeeks > 24,
    detail:  p => `${p.deliveryWeeks} weeks offered against the 24-week ITT completion requirement.`,
    mitigation: 'Negotiate the programme back to 24 weeks, or price the schedule impact into the comparison.' },
  { id: 'rk7', risk: 'Liability capped below contract value',  impact: 'Recovery', rating: 'Medium',
    applies: p => p.lolPct < 100,
    detail:  p => `Liability capped at ${p.lolPct}% of contract value against the 100% ITT minimum.`,
    mitigation: 'Restore the cap to 100% of contract value, or accept with a documented risk waiver.' },
  { id: 'rk8', risk: 'Foreign currency exposure',              impact: 'Cost certainty', rating: 'Low',
    applies: p => p.fxShare > 0.5,
    detail:  p => `${(p.fxShare * 100).toFixed(0)}% of the price is denominated in ${p.currency}.`,
    mitigation: 'Fix the exchange rate at contract date, or require the bid to be re-denominated in OMR.' },
]

// ── Step 4 — normalization parameters & the historical benchmark ──────────
export const commercialNormalization = {
  financingRatePa:      0.06,  // cost of money used to price advances / payment terms
  standardPaymentDays:  60,
  standardWarrantyMths: 24,
  standardBondPct:      10,
  warrantyCostPerMonth: 0.004, // % of price per month of warranty shortfall
  bondRiskFactor:       0.25,  // % of price per point of bond shortfall
  uncappedEscalationPa: 0.04,  // assumed escalation where the clause is uncapped
  abnormallyLowPct:    -15,
  abnormallyHighPct:    20,
  outlierRatePct:       25,    // line-item rate deviation from the mean that flags an outlier
}

// Held as a ratio of the company estimate so the benchmark stays in scale
// whatever the tender size.
export const commercialHistoricalAwards = [
  { ref: 'C-2023-118', title: 'Expressway Bridge Rehabilitation — Phase 1', year: 2023, ratio: 0.88, basis: 'Unit Rate' },
  { ref: 'C-2024-042', title: 'Expressway Bridge Rehabilitation — Phase 2', year: 2024, ratio: 0.97, basis: 'Unit Rate' },
  { ref: 'C-2024-137', title: 'Highway Structures Maintenance Framework',   year: 2024, ratio: 1.04, basis: 'Framework' },
]

// ── Step 5 — sensitivity scenarios ────────────────────────────────────────
export const commercialScenarios = [
  { id: 'base',   family: 'Base Case',     label: 'Base Case',              range: 'Normalized price' },
  { id: 'esc2',   family: 'Escalation',    label: 'Escalation +2%',         range: '+2%',     esc: 0.02 },
  { id: 'esc5',   family: 'Escalation',    label: 'Escalation +5%',         range: '+5%',     esc: 0.05 },
  { id: 'esc10',  family: 'Escalation',    label: 'Escalation +10%',        range: '+10%',    esc: 0.10 },
  { id: 'qtyM20', family: 'Quantity',      label: 'Quantity −20%',          range: '−20%',    qty: -0.20 },
  { id: 'qtyM10', family: 'Quantity',      label: 'Quantity −10%',          range: '−10%',    qty: -0.10 },
  { id: 'qtyP10', family: 'Quantity',      label: 'Quantity +10%',          range: '+10%',    qty:  0.10 },
  { id: 'qtyP20', family: 'Quantity',      label: 'Quantity +20%',          range: '+20%',    qty:  0.20 },
  { id: 'fxM10',  family: 'Currency',      label: 'Currency −10%',          range: '−10%',    fx: -0.10 },
  { id: 'fxM5',   family: 'Currency',      label: 'Currency −5%',           range: '−5%',     fx: -0.05 },
  { id: 'fxP5',   family: 'Currency',      label: 'Currency +5%',           range: '+5%',     fx:  0.05 },
  { id: 'fxP10',  family: 'Currency',      label: 'Currency +10%',          range: '+10%',    fx:  0.10 },
  { id: 'npvAdv', family: 'Payment Terms', label: 'As bid (advance / NPV)', range: 'As bid',  npvDays: null },
  { id: 'npv30',  family: 'Payment Terms', label: 'Payment 30 days (NPV)',  range: '30 days', npvDays: 30 },
  { id: 'npv60',  family: 'Payment Terms', label: 'Payment 60 days (NPV)',  range: '60 days', npvDays: 60 },
  { id: 'npv90',  family: 'Payment Terms', label: 'Payment 90 days (NPV)',  range: '90 days', npvDays: 90 },
]

export const commercialScenarioFamilies = [
  { family: 'Escalation impact',      range: '+2% / +5% / +10%' },
  { family: 'Quantity variation',     range: '−20% / −10% / Base / +10% / +20%' },
  { family: 'Currency movement',      range: 'USD / EUR / GBP  ±5% / ±10%' },
  { family: 'Payment terms (NPV)',    range: 'Advance vs 30 / 60 / 90 days' },
  { family: 'Index-based adjustment', range: 'User defined' },
]

export const commercialStability = {
  stable:   { label: 'Stable Recommendation', badge: 'compliant',         hint: 'The preferred bidder holds first place across effectively every scenario.' },
  moderate: { label: 'Moderately Sensitive',  badge: 'partial_compliant', hint: 'The preferred bidder changes under some scenarios — review before award.' },
  high:     { label: 'Highly Sensitive',      badge: 'non_compliant',     hint: 'The ranking is unstable — the recommendation depends heavily on the assumptions used.' },
}

// ── Step 6 — PAF / preference configuration ───────────────────────────────
export const commercialPafDefaults = {
  lccWeightingPct:    5,   // LCC Adjustment Factor = LC Score          x LCC Weighting %
  icvWeightingPct:    5,   // ICV Adjustment Factor = ICV Retained Value x ICV Weighting %
  capPct:            10,   // ceiling on the Total LC Adjustment
  omaniPreferencePct: 10,  // Omani Company / SME / Omani JV preference
  applyPreference:  true,
  basis: 'normalized',     // 'normalized' (price normalization output) | 'submitted'
}

export const COMMERCIAL_PAF_NOTE =
  'PAF-adjusted prices are evaluation prices only. The contract shall be awarded at the original submitted bid price. This mechanism rewards higher local content without altering the actual contract cost.'

export const omaniEligibleTypes = ['Omani Company', 'Omani SME', 'Omani JV']

// ── Step 7 — negotiation opportunities ────────────────────────────────────
export const COMMERCIAL_MOBILISATION_BENCHMARK = 0.03

export const commercialNegotiationRules = [
  { id: 'ng1', title: 'Reduce mobilization fee', unit: 'one-off',
    applies: p => p.mobilisationPct > COMMERCIAL_MOBILISATION_BENCHMARK,
    basis:   p => `Mobilization priced at ${(p.mobilisationPct * 100).toFixed(1)}% of the bid against a ${(COMMERCIAL_MOBILISATION_BENCHMARK * 100).toFixed(0)}% benchmark.`,
    savings: (p, price) => price * (p.mobilisationPct - COMMERCIAL_MOBILISATION_BENCHMARK) },
  { id: 'ng2', title: 'Cap annual escalation', unit: 'per year',
    applies: p => p.escalationCapPct == null || p.escalationCapPct > 3,
    basis:   p => p.escalationCapPct == null
      ? 'Escalation is uncapped — capping at 3% p.a. removes the open-ended exposure.'
      : `Escalation capped at ${p.escalationCapPct}% p.a.; bringing it to the 3% ITT standard.`,
    savings: (p, price) => price * p.escalationExposure * (((p.escalationCapPct ?? 6) - 3) / 100) },
  { id: 'ng3', title: 'Align payment terms to OLNG standard', unit: 'financing cost',
    applies: p => p.advancePct > 0 || p.paymentDays < 60,
    basis:   p => p.advancePct > 0
      ? `${(p.advancePct * 100).toFixed(0)}% advance requested; moving to 60-day terms removes the financing cost.`
      : `${p.paymentDays}-day terms offered; moving to the 60-day standard releases working capital.`,
    savings: (p, price) => price * (p.advancePct * 0.03 + Math.max(0, (60 - p.paymentDays) / 365) * 0.06) },
  { id: 'ng4', title: 'Convert conditional discount to an unconditional rebate', unit: 'one-off',
    applies: p => p.discountPct > 0 && !p.discountApplied,
    basis:   p => `${(p.discountPct * 100).toFixed(1)}% discount is conditional and could not be taken into the evaluation — making it unconditional secures it.`,
    savings: (p, price) => price * p.discountPct * 0.5 },
  { id: 'ng5', title: 'Extend warranty to the 24-month standard', unit: 'risk avoided',
    applies: p => p.warrantyMonths < 24,
    basis:   p => `${p.warrantyMonths}-month warranty offered — closing the ${24 - p.warrantyMonths}-month gap removes a post-award cost.`,
    savings: (p, price) => price * (24 - p.warrantyMonths) * 0.004 },
]

// ── Step 8 — clarification register ───────────────────────────────────────
// The platform hosts no bidder-facing portal, so a clarification is exported as
// a document, issued outside the system, and the bidder's reply comes back as an
// uploaded file.
export const commercialClarificationStatuses = {
  draft:     { label: 'Draft',      badge: 'draft' },
  exported:  { label: 'Exported',   badge: 'info' },
  responded: { label: 'Response Uploaded', badge: 'warning' },
  closed:    { label: 'Closed',     badge: 'compliant' },
}

// Summary recorded against an uploaded response, so a clarification can be
// walked through to closure without transcribing the document by hand.
export const commercialClarificationReplies = {
  submission: 'Bidder has re-submitted the missing document. Reviewed and accepted.',
  deviation:  'Bidder confirms withdrawal of the deviation and acceptance of the ITT condition without price change.',
  exception:  'Bidder maintains the exception but has offered a compensating commercial concession. Referred to the Contract Engineer.',
  pricing:    'Bidder confirms the rate is correct as submitted and has provided the supporting build-up.',
}

// ── Bidder commercial profiles ─────────────────────────────────────────────
// Positional profiles (the first bidder in the list gets profile 0, and so on)
// so any tender's bidder list produces a complete, deterministic commercial
// data set. These stand in for what step 1 would read from real submissions.
const cev = (doc, page, quote) => ({ doc, page, quote })

export const commercialProfiles = [
  {
    key: 'p0', entityType: 'Omani Company',
    advancePct: 0, paymentDays: 60,
    discountPct: 0.025, discountApplied: true, discountText: '2.5% on order value above OMR 500,000',
    warrantyMonths: 24, deliveryWeeks: 22, performanceBondPct: 10,
    personnelInsured: true, insuranceText: 'CAR + Workmen’s Comp + Third Party — OMR 2,000,000',
    escalationCapPct: 3, escalationExposure: 0.45,
    ldText: '0.5% per week, capped at 10%', lolPct: 100,
    currency: 'OMR', fxShare: 0, mobilisationPct: 0.055,
    lcScorePct: 80, icvRetainedPct: 70,
    submissionFails: [],
    review: {
      cr1: { status: 'compliant' }, cr2: { status: 'compliant' }, cr3: { status: 'compliant' }, cr4: { status: 'compliant' },
      cr5: { status: 'compliant' }, cr6: { status: 'compliant' }, cr7: { status: 'compliant' }, cr8: { status: 'compliant' },
    },
    evidence: {
      pricing:    cev('Schedule of Prices (Section E)', 4, 'Grand total carried forward from Sections E1 and E2; all rates in OMR, firm for the validity period.'),
      discount:   cev('Commercial Proposal', 11, 'A discount of 2.5% shall apply to the order value in excess of OMR 500,000.'),
      payment:    cev('Commercial Proposal', 12, 'Payment within 60 days of receipt of a certified invoice. No advance payment is required.'),
      warranty:   cev('Commercial Proposal', 14, 'Defects liability period of 24 months from the date of acceptance.'),
      delivery:   cev('Programme of Works', 3, 'Completion within 22 weeks of the Notice to Proceed.'),
      bond:       cev('Form of Tender', 2, 'Performance bond of 10% of the contract value, valid until expiry of the defects liability period.'),
      insurance:  cev('Insurance Certificate', 1, 'Contractor All Risks, Workmen’s Compensation and Third Party cover, limit OMR 2,000,000.'),
      escalation: cev('Commercial Proposal', 15, 'Escalation linked to the published CPI and capped at 3% per annum.'),
      lc:         cev('Local Content Plan', 2, 'Committed local content of 80% measured under the OLNG LC methodology.'),
      icv:        cev('ICV Certificate', 1, 'Certified ICV retained value of 70% for the current certification year.'),
    },
  },
  {
    key: 'p1', entityType: 'International',
    advancePct: 0, paymentDays: 45,
    discountPct: 0, discountApplied: false, discountText: 'None offered',
    warrantyMonths: 18, deliveryWeeks: 20, performanceBondPct: 10,
    personnelInsured: true, insuranceText: 'CAR + Workmen’s Comp — USD 4,000,000',
    escalationCapPct: 5, escalationExposure: 0.60,
    ldText: '0.5% per week, capped at 10%', lolPct: 100,
    currency: 'USD', fxShare: 0.55, mobilisationPct: 0.072,
    lcScorePct: 60, icvRetainedPct: 50,
    submissionFails: [],
    review: {
      cr1: { status: 'deviation', note: '45-day payment terms offered against the 60-day ITT standard.' },
      cr2: { status: 'deviation', note: '18-month warranty offered against the 24-month requirement.' },
      cr3: { status: 'compliant' }, cr4: { status: 'compliant' }, cr5: { status: 'compliant' },
      cr6: { status: 'deviation', note: 'Escalation capped at 5% p.a. against the 3% ITT ceiling.' },
      cr7: { status: 'compliant' }, cr8: { status: 'compliant' },
    },
    evidence: {
      pricing:    cev('Schedule of Prices (Section E)', 5, 'Rates submitted in USD and converted at the tender-date reference rate; totals carried to the summary page.'),
      discount:   cev('Commercial Proposal', 9, 'No unconditional discount is offered against the submitted schedule of prices.'),
      payment:    cev('Commercial Proposal', 10, 'Payment terms of 45 days net from invoice date.'),
      warranty:   cev('Commercial Proposal', 13, 'Warranty period of 18 months from delivery.'),
      delivery:   cev('Programme of Works', 2, 'Completion within 20 weeks of the Notice to Proceed.'),
      bond:       cev('Form of Tender', 2, 'Performance guarantee of 10% of contract value from a first-class bank.'),
      insurance:  cev('Insurance Certificate', 1, 'Contractor All Risks and Workmen’s Compensation, limit USD 4,000,000.'),
      escalation: cev('Commercial Proposal', 16, 'Annual escalation applied to labour and plant elements, capped at 5% per annum.'),
      lc:         cev('Local Content Plan', 3, 'Local content commitment of 60% through Omani subcontracting and local hire.'),
      icv:        cev('ICV Certificate', 1, 'ICV retained value certified at 50%.'),
    },
  },
  {
    key: 'p2', entityType: 'International',
    advancePct: 0.30, paymentDays: 30,
    discountPct: 0.015, discountApplied: false, discountText: '1.5% for payment within 15 days (outside OLNG terms — not applied)',
    warrantyMonths: 24, deliveryWeeks: 30, performanceBondPct: 5,
    personnelInsured: false, insuranceText: 'CAR only — USD 1,500,000 (no Workmen’s Comp evidenced)',
    escalationCapPct: null, escalationExposure: 0.65,
    ldText: '0.25% per week, capped at 5%', lolPct: 50,
    currency: 'USD', fxShare: 0.70, mobilisationPct: 0.061,
    lcScorePct: 35, icvRetainedPct: 25,
    submissionFails: [],
    review: {
      cr1: { status: 'deviation', note: '30% advance payment requested and 30-day terms sought.' },
      cr2: { status: 'compliant' },
      cr3: { status: 'deviation', note: 'No Workmen’s Compensation cover evidenced; CAR limit below the OMR 2,000,000 minimum.' },
      cr4: { status: 'deviation', note: 'Performance bond offered at 5% against the 10% requirement.' },
      cr5: { status: 'deviation', note: '30-week programme against the 24-week ITT completion requirement.' },
      cr6: { status: 'exception', note: 'Escalation clause is open-ended with no annual ceiling — a material exception to the ITT.' },
      cr7: { status: 'deviation', note: 'LD rate of 0.25%/week capped at 5%, below the ITT position.' },
      cr8: { status: 'exception', note: 'Liability capped at 50% of contract value against the 100% ITT minimum.' },
    },
    evidence: {
      pricing:    cev('Schedule of Prices (Section E)', 6, 'Priced schedule submitted in USD with provisional sums carried at the tendered rates.'),
      discount:   cev('Commercial Proposal', 8, 'A 1.5% early settlement discount applies where payment is made within 15 days.'),
      payment:    cev('Commercial Proposal', 9, '30% advance payment on contract signature, balance at 30 days from invoice.'),
      warranty:   cev('Commercial Proposal', 12, 'Warranty of 24 months from the date of practical completion.'),
      delivery:   cev('Programme of Works', 4, 'Completion within 30 weeks of the Notice to Proceed.'),
      bond:       cev('Form of Tender', 3, 'Performance bond of 5% of the contract value.'),
      insurance:  cev('Insurance Certificate', 1, 'Contractor All Risks limit USD 1,500,000. No Workmen’s Compensation certificate attached.'),
      escalation: cev('Commercial Proposal', 17, 'Rates subject to escalation in line with actual cost movement; no ceiling stated.'),
      lc:         cev('Local Content Plan', 1, 'Local content commitment of 35%, primarily through local procurement.'),
      icv:        cev('ICV Certificate', 1, 'ICV retained value certified at 25%.'),
    },
  },
  {
    key: 'p3', entityType: 'International',
    advancePct: 0.25, paymentDays: 90,
    discountPct: 0, discountApplied: false, discountText: 'None offered',
    warrantyMonths: 12, deliveryWeeks: 26, performanceBondPct: 0,
    personnelInsured: false, insuranceText: 'Not evidenced',
    escalationCapPct: null, escalationExposure: 0.55,
    ldText: 'Not accepted', lolPct: 30,
    currency: 'USD', fxShare: 0.60, mobilisationPct: 0.028,
    lcScorePct: 20, icvRetainedPct: 15,
    submissionFails: ['cd2', 'cd13'],
    review: {
      cr1: { status: 'deviation', note: '25% advance requested with 90-day terms thereafter.' },
      cr2: { status: 'exception', note: '12-month warranty only — half the ITT requirement.' },
      cr3: { status: 'exception', note: 'No insurance certificates submitted.' },
      cr4: { status: 'exception', note: 'No performance bond offered.' },
      cr5: { status: 'deviation', note: '26-week programme against the 24-week requirement.' },
      cr6: { status: 'exception', note: 'Escalation uncapped.' },
      cr7: { status: 'exception', note: 'Liquidated damages not accepted.' },
      cr8: { status: 'exception', note: 'Liability capped at 30% of contract value.' },
    },
    evidence: {
      pricing:    cev('Schedule of Prices (Section E)', 3, 'Priced schedule submitted with several rates carried as lump sums rather than unit rates.'),
      discount:   cev('Commercial Proposal', 7, 'No discount offered.'),
      payment:    cev('Commercial Proposal', 8, '25% advance on award; remaining payments at 90 days from invoice.'),
      warranty:   cev('Commercial Proposal', 10, 'Warranty limited to 12 months from delivery.'),
      delivery:   cev('Programme of Works', 2, 'Completion within 26 weeks of the Notice to Proceed.'),
      bond:       cev('Form of Tender', 2, 'No performance bond is offered against this tender.'),
      insurance:  cev('Commercial Proposal', 20, 'Insurance certificates to be provided post-award.'),
      escalation: cev('Commercial Proposal', 14, 'Prices subject to review in the event of market movement.'),
      lc:         cev('Local Content Plan', 1, 'Local content commitment of 20%.'),
      icv:        cev('ICV Certificate', 1, 'ICV retained value certified at 15%.'),
    },
  },
]

export const commercialProfileFor = (index) => commercialProfiles[index % commercialProfiles.length]

// ── Pre-Qualification: ERP bidder master registry ──────────────────────────
// Shaped after the real "Supplier Registration Template - Tendering Phase" —
// this stands in for the client's ERP bidder database that Stage 1 filters
// down from, via a Work Category match against the uploaded SOW.
export const WORK_CATEGORIES = [
  'Mechanical & Piping Works',
  'Fire & Safety Systems',
  'Marine & Civil Works',
  'Electrical & Instrumentation',
  'IT & Communications',
]

export const erpBidders = [
  { id: 101, name: 'TechSolutions Ltd',       country: 'Oman',         isLocal: true,  category: 'IT & Communications',           regNo: 'CR-1044921', jsrsNo: 'JSRS-2291', molCardNo: 'MOL-88213', yearEstablished: 2011, natureOfBusiness: 'IT systems integration & managed services', contactName: 'Ahmed Al-Balushi', contactEmail: 'a.balushi@techsolutions.om' },
  { id: 102, name: 'InfraCore Systems',       country: 'UAE',          isLocal: false, category: 'Electrical & Instrumentation',  regNo: 'CR-770234',  jsrsNo: null,         molCardNo: null,        yearEstablished: 2008, natureOfBusiness: 'Electrical & instrumentation contracting',    contactName: 'Rania Haddad',    contactEmail: 'r.haddad@infracore.ae' },
  { id: 103, name: 'CloudNexus Corp',         country: 'India',        isLocal: false, category: 'IT & Communications',           regNo: 'CR-559812',  jsrsNo: null,         molCardNo: null,        yearEstablished: 2015, natureOfBusiness: 'Cloud infrastructure & networking',           contactName: 'Vikram Rao',      contactEmail: 'v.rao@cloudnexus.in' },
  { id: 104, name: 'DataVault Solutions',     country: 'Saudi Arabia', isLocal: false, category: 'IT & Communications',           regNo: 'CR-334120',  jsrsNo: null,         molCardNo: null,        yearEstablished: 2013, natureOfBusiness: 'Data centre & storage solutions',             contactName: 'Faisal Al-Otaibi', contactEmail: 'f.otaibi@datavault.sa' },
  { id: 105, name: 'Gulf Energy Services',    country: 'Oman',         isLocal: true,  category: 'Mechanical & Piping Works',     regNo: 'CR-990117',  jsrsNo: 'JSRS-3312', molCardNo: 'MOL-55127', yearEstablished: 2002, natureOfBusiness: 'Mechanical, piping & rotating equipment services', contactName: 'Salim Al-Harthy', contactEmail: 's.harthy@gulfenergy.om' },
  { id: 106, name: 'Meridian Contracting',    country: 'Qatar',        isLocal: false, category: 'Marine & Civil Works',          regNo: 'CR-118820',  jsrsNo: null,         molCardNo: null,        yearEstablished: 2005, natureOfBusiness: 'Marine & civil construction',                 contactName: 'Youssef Nassar',  contactEmail: 'y.nassar@meridian.qa' },
  { id: 107, name: 'Al Amana Fire & Safety',  country: 'Oman',         isLocal: true,  category: 'Fire & Safety Systems',         regNo: 'CR-664519',  jsrsNo: 'JSRS-4470', molCardNo: 'MOL-91002', yearEstablished: 2009, natureOfBusiness: 'Fire detection, suppression & HSE systems',   contactName: 'Mariam Al-Rawahi', contactEmail: 'm.rawahi@alamana.om' },
  { id: 108, name: 'Barka Marine Works',      country: 'Oman',         isLocal: true,  category: 'Marine & Civil Works',          regNo: 'CR-227741',  jsrsNo: 'JSRS-2005', molCardNo: 'MOL-40218', yearEstablished: 1998, natureOfBusiness: 'Marine construction & dredging',              contactName: 'Khalid Al-Maskari', contactEmail: 'k.maskari@barkamarine.om' },
  { id: 109, name: 'Sohar Piping Industries', country: 'Oman',         isLocal: true,  category: 'Mechanical & Piping Works',     regNo: 'CR-813365',  jsrsNo: 'JSRS-5118', molCardNo: 'MOL-67440', yearEstablished: 2006, natureOfBusiness: 'Pipe fabrication, spooling & mechanical erection', contactName: 'Nasser Al-Hinai',  contactEmail: 'n.hinai@soharpiping.om' },
  { id: 110, name: 'Muscat Power Systems',    country: 'Oman',         isLocal: true,  category: 'Electrical & Instrumentation',  regNo: 'CR-451208',  jsrsNo: 'JSRS-6023', molCardNo: 'MOL-73115', yearEstablished: 2012, natureOfBusiness: 'LV/HV electrical works & instrumentation loop testing', contactName: 'Huda Al-Kindi',   contactEmail: 'h.kindi@muscatpower.om' },
  { id: 111, name: 'Falcon Safety Equipment', country: 'UAE',          isLocal: false, category: 'Fire & Safety Systems',         regNo: 'CR-905613',  jsrsNo: null,        molCardNo: null,        yearEstablished: 2010, natureOfBusiness: 'Fire suppression equipment supply & maintenance', contactName: 'Omar Sheikh',      contactEmail: 'o.sheikh@falconsafety.ae' },
  { id: 112, name: 'Nizwa Tech Networks',     country: 'Oman',         isLocal: true,  category: 'IT & Communications',           regNo: 'CR-378904',  jsrsNo: 'JSRS-7742', molCardNo: 'MOL-51996', yearEstablished: 2016, natureOfBusiness: 'Industrial networking & telecom infrastructure', contactName: 'Zahra Al-Saadi',   contactEmail: 'z.saadi@nizwatech.om' },
]

// ── Stage 4 handoff documents — tender-level internal company documents
export const HANDOFF_DOCS = [
  { key: 'icv',             label: 'ICV Plan' },
  { key: 'companyEstimate', label: 'Company Estimate' },
  { key: 'riskAssessment',  label: 'Contract Risk Assessment' },
]

// ── Stage 3 evaluation criteria — modelled on the real "Pre-Qualification
// Evaluation Results Template" (QHSE / Technical / Administrative sheets).
// A Fail on ANY criterion in a sheet fails that sheet; a Fail on ANY sheet
// fails the bidder's overall Stage 3 result (mirrors the template's own note).
export const QHSE_CRITERIA = [
  { id: 'q1', item: 'HSE Policy', detail: "Signed, dated HSE policy document and project organisation chart with HSE roles identified." },
  { id: 'q2', item: 'HSE Training', detail: 'Training matrix for this project plus sample HSE training records for proposed staff.' },
  { id: 'q3', item: 'Safety Records', detail: 'HSE performance records for the last 5 years and 2 sample incident investigation/closeout reports.' },
]

export const TECHNICAL_CRITERIA_PQ = [
  { id: 't1', item: 'Previous Experience', detail: 'References of similar previous works carried out by the bidder.' },
  { id: 't2', item: 'Compliance to Technical Specifications', detail: 'Any deviation or qualification against the required manpower/materials/systems specification.' },
  { id: 't3', item: 'Equipment & Facilities', detail: 'Adequacy of the list of equipment and facilities proposed for the work.' },
  { id: 't4', item: 'Professional/Trade Certification', detail: 'Availability of any applicable trade certification required for the work.' },
  { id: 't5', item: 'Quality Management System', detail: 'Valid ISO 9001 (or equivalent) certification covering the statement of work.' },
]

export const ADMINISTRATIVE_CRITERIA = [
  { id: 'a1', item: 'Completed & Signed PQQ', detail: 'PQQ document fully completed and signed by an authorised representative.' },
  { id: 'a2', item: 'Supplier Registration Form', detail: 'Filled template of the Supplier Registration Form.' },
  { id: 'a3', item: 'Commercial Registration Certificate', detail: "Valid Commercial Registration Certificate." },
  { id: 'a4', item: 'MOL Omanisation / Green Card', detail: 'Local suppliers only — Not Applicable for foreign companies.', localOnly: true },
  { id: 'a5', item: 'JSRS Registration Certificate', detail: 'Valid JSRS registration certificate.' },
]

// Stage 4 financial-assessment criteria, derived from the three factors of the
// original assessment (statement submitted, audit opinion, Z-score zone) so the
// Contract Engineer marks them Pass/Fail per bidder, just like Stage 3.
export const FINANCIAL_CRITERIA = [
  { id: 'f1', item: 'Audited Financial Statement', detail: 'Audited financial statements for the most recent financial year have been submitted.' },
  { id: 'f2', item: 'Acceptable Audit Opinion', detail: 'External audit opinion is Unqualified or Qualified — not Adverse or Disclaimer.' },
  { id: 'f3', item: 'Solvency (Z-Score Zone)', detail: 'Altman Z-Score places the bidder in the Green or Amber solvency zone, not Red.' },
]

// ── Stage 4 — simplified financial assessment rule, directionally matching
// the real Z-score-based "Pre-Qualification Financial Assessment" workbook
// (full 250-row lookup table not ported; canned recommendation text is
// lifted near-verbatim from the template for the cases we do cover).
export const FINANCIAL_RECOMMENDATIONS = {
  not_submitted: 'NO AUDITED FINANCIAL STATEMENT WAS SUBMITTED — THE COMPANY’S FINANCIAL STANDING CANNOT BE ASSESSED.',
  misstated: 'FINANCIAL STATEMENT IS MISSTATED OR MISREPRESENTED. HENCE, THE OUTCOME OF THE Z-SCORE CANNOT BE TRUSTED.',
  green: 'THE COMPANY IS FINANCIALLY IN THE GREEN ZONE AND IS UNLIKELY TO FILE FOR BANKRUPTCY.',
  amber: 'THE COMPANY IS FINANCIALLY IN THE AMBER ZONE WITH A CHANCE TO FILE FOR BANKRUPTCY. FURTHER FINANCIAL CHECK IS RECOMMENDED IF THE CONTRACT VALUE IS HIGH.',
  red: 'THE COMPANY IS FINANCIALLY IN THE RED ZONE WITH A HIGH PROBABILITY TO FILE FOR BANKRUPTCY.',
}

export function assessFinancials({ statementSubmitted, auditOpinion, zZone }) {
  if (!statementSubmitted) return { result: 'FAIL', recommendation: FINANCIAL_RECOMMENDATIONS.not_submitted }
  if (auditOpinion === 'Adverse Opinion' || auditOpinion === 'Disclaimer Opinion') {
    return { result: 'FAIL', recommendation: FINANCIAL_RECOMMENDATIONS.misstated }
  }
  if (zZone === 'Red') return { result: 'FAIL', recommendation: FINANCIAL_RECOMMENDATIONS.red }
  if (zZone === 'Amber') return { result: 'PASS', recommendation: FINANCIAL_RECOMMENDATIONS.amber }
  return { result: 'PASS', recommendation: FINANCIAL_RECOMMENDATIONS.green }
}

export const auditLogs = [
  { id: 1,  user: 'John Smith',  role: 'Contract Engineer',  action: 'Created ITT',                                    tender: 'ITT-2025-001', timestamp: '2025-03-10 09:14:32', ip: '10.1.0.10', status: 'success' },
  { id: 2,  user: 'AI System',   role: 'System',               action: 'Generated ITT Document',                          tender: 'ITT-2025-001', timestamp: '2025-03-10 09:15:45', ip: '10.0.0.1',  status: 'success' },
  { id: 3,  user: 'John Smith',  role: 'Contract Engineer',  action: 'Exported ITT Document for External Review',       tender: 'ITT-2025-001', timestamp: '2025-03-10 10:32:11', ip: '10.1.0.10', status: 'success' },
  { id: 4,  user: 'John Smith',  role: 'Contract Engineer',  action: 'Uploaded Finalized ITT Document',                 tender: 'ITT-2025-001', timestamp: '2025-03-11 08:55:00', ip: '10.1.0.10', status: 'success' },
  { id: 5,  user: 'John Smith',  role: 'Contract Engineer',  action: 'Uploaded Bidder Proposals',                       tender: 'ITT-2025-001', timestamp: '2025-03-25 14:10:22', ip: '10.1.0.10', status: 'success' },
  { id: 6,  user: 'AI System',   role: 'System',               action: 'Extracted Proposal Data',                         tender: 'ITT-2025-001', timestamp: '2025-03-25 14:12:05', ip: '10.0.0.1',  status: 'success' },
  { id: 7,  user: 'Admin User',  role: 'Administrator',        action: 'Assigned Technical Evaluation — Sarah Chen',      tender: 'ITT-2025-001', timestamp: '2025-03-26 09:00:00', ip: '10.1.0.1',  status: 'success' },
  { id: 8,  user: 'Sarah Chen',  role: 'Technical Evaluator',  action: 'Submitted Technical Evaluation',                  tender: 'ITT-2025-001', timestamp: '2025-04-02 16:45:33', ip: '10.1.0.22', status: 'success' },
  { id: 9,  user: 'John Smith',  role: 'Contract Engineer',  action: 'Exported Technical Evaluation Report',            tender: 'ITT-2025-001', timestamp: '2025-04-02 17:10:00', ip: '10.1.0.10', status: 'success' },
  { id: 10, user: 'John Smith',  role: 'Contract Engineer',  action: 'Uploaded Finalized Technical Evaluation Report',  tender: 'ITT-2025-001', timestamp: '2025-04-03 08:30:00', ip: '10.1.0.10', status: 'success' },
  { id: 11, user: 'Mark Davis',  role: 'Commercial Evaluator', action: 'Submitted Commercial Evaluation',                 tender: 'ITT-2025-001', timestamp: '2025-04-04 11:20:14', ip: '10.1.0.31', status: 'success' },
  { id: 12, user: 'John Smith',  role: 'Contract Engineer',  action: 'Exported Commercial Evaluation Report',           tender: 'ITT-2025-001', timestamp: '2025-04-04 12:00:00', ip: '10.1.0.10', status: 'success' },
  { id: 13, user: 'John Smith',  role: 'Contract Engineer',  action: 'Uploaded Finalized Commercial Evaluation Report', tender: 'ITT-2025-001', timestamp: '2025-04-05 09:00:00', ip: '10.1.0.10', status: 'success' },
  { id: 14, user: 'Robert Lee',  role: 'Management Reviewer',  action: 'Submitted Award Recommendation — TechSolutions Ltd', tender: 'ITT-2025-001', timestamp: '2025-04-06 14:30:20', ip: '10.1.0.52', status: 'success' },
  { id: 15, user: 'John Smith',  role: 'Contract Engineer',  action: 'Created Contract for Awarded Bidder',             tender: 'ITT-2025-001', timestamp: '2025-04-07 09:15:00', ip: '10.1.0.10', status: 'success' },
]

// Technical Evaluation Model — mirrors "Appendix I — Technical Evaluation Model
// Template". Each criterion is scored 0–3 against its scoring bands; its weighted
// contribution is (score / 3) × weight. Weights sum to 100 (Part 1 = 25, Part 2
// = 60, Part 3 = 15), so a straight-3 across the board totals 100. Musts carry a
// minimum raw score that must be met; Wants do not. A bidder passes when every
// Must clears its minimum AND the weighted total meets the overall passing score.
export const TECHNICAL_OVERALL_PASS = 70 // % — Contract-Holder-set minimum passing weighted score

export const technicalEvalParts = [
  {
    id: 'part1', title: 'Part 1 — QHSE', sectionWeight: 25,
    criteria: [
      { id: 'p1m1', type: 'Must', criterion: 'Contractor HSE Capability Assessment', detail: 'Response to the HSE Capability Assessment questionnaire; overall result taken from the detailed questionnaire.', weight: 20, maxScore: 3, minScore: 2, isHse: true,
        bands: ['No information provided', 'Red Banded', 'Amber Banded', 'Green Banded'] },
      { id: 'p1w1', type: 'Want', criterion: 'ISO Certification', detail: 'Or other appropriate / equivalent certification.', weight: 5, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Working on system', 'Non-certified system in place', 'Valid certification in operation'] },
    ],
  },
  {
    id: 'part2', title: 'Part 2 — Contract-Specific', sectionWeight: 60,
    criteria: [
      { id: 'p2m1', type: 'Must', criterion: 'Methodology Statement', detail: 'Manner and sequence of carrying out the required Work / Services.', weight: 10, maxScore: 3, minScore: 2,
        bands: ['No information provided', 'Shows lack of understanding of Work', 'Shows a competent understanding of Work', 'Shows a detailed understanding of Work'] },
      { id: 'p2m2', type: 'Must', criterion: 'Omanisation Plan', detail: 'Compliance with Labour Law and contract requirements; targets and staff development / training plan.', weight: 15, maxScore: 3, minScore: 2,
        bands: ['No information provided', 'Complies with Labour Law', 'Proposed an alternate equivalent plan', 'Meets or exceeds requirements'] },
      { id: 'p2w1', type: 'Want', criterion: 'Compliance to Technical Specifications', detail: 'Any deviation or qualification submitted in relation to the Work.', weight: 5, maxScore: 3, minScore: null,
        bands: ['No information / non-compliant specification', 'Proposes an unknown alternate', 'Proposed an acceptable alternate equivalent', 'Meets or exceeds requirements'] },
      { id: 'p2w2', type: 'Want', criterion: 'Professional / Trade Certification', detail: 'Any applicable certification required (e.g. MOH certificate for catering staff).', weight: 10, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Includes outdated certification', 'Includes up-to-date related certification', 'Includes up-to-date specific certification'] },
      { id: 'p2w3', type: 'Want', criterion: 'Contract Programme / Work Plan', detail: 'How the Contractor plans to execute the work with available resources and meet the deadline.', weight: 5, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Optimistic for identified resources', 'Reasonable for identified resources', 'Detailed with back-up plans'] },
      { id: 'p2w4', type: 'Want', criterion: 'Additional Criterion (CH-defined)', detail: 'To be identified by the Contract Holder.', weight: 5, maxScore: 3, minScore: null,
        bands: ['No Info', 'Basic', 'Satisfactory', 'Comprehensive'] },
      { id: 'p2w5', type: 'Want', criterion: 'Additional Criterion (CH-defined)', detail: 'To be identified by the Contract Holder.', weight: 10, maxScore: 3, minScore: null,
        bands: ['No Info', 'Basic', 'Satisfactory', 'Comprehensive'] },
    ],
  },
  {
    id: 'part3', title: 'Part 3 — Contract-Generic', sectionWeight: 15,
    criteria: [
      { id: 'p3m1', type: 'Must', criterion: 'Work Procedures and Instructions', detail: 'Adequacy of information detailing the standards to be maintained.', weight: 2, maxScore: 3, minScore: 2,
        bands: ['No information provided', 'Shows lack of understanding of Work', 'Shows a competent understanding of Work', 'Shows a detailed understanding of Work'] },
      { id: 'p3m2', type: 'Must', criterion: 'Equipment and Facilities', detail: 'Adequacy of equipment list, maintenance facilities, backup resources, evidence of ownership / hire.', weight: 3, maxScore: 3, minScore: 2,
        bands: ['No information provided', 'Includes sub-standard equipment', 'Meets requirements', 'Provides in excess of anticipated needs'] },
      { id: 'p3w1', type: 'Want', criterion: 'Proposed Organisational Structure', detail: 'Decision-making process, roles & responsibilities, management competency.', weight: 2, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Simple outline', 'Meets requirements', 'Clear, concise and detailed'] },
      { id: 'p3w2', type: 'Want', criterion: 'Suitability of Personnel Nominated', detail: 'Adequacy and number of staff, qualifications and relevant experience of key personnel.', weight: 3, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Minimum requirement personnel', 'Competent personnel', 'Excellent / highly qualified personnel'] },
      { id: 'p3w3', type: 'Want', criterion: 'Suitability of Project / Contract Manager', detail: 'Qualification and relevant experience to manage and execute the job effectively.', weight: 1, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Minimum requirement personnel', 'Competent personnel', 'Excellent / highly qualified personnel'] },
      { id: 'p3w4', type: 'Want', criterion: 'Proposed Subcontractors', detail: 'Elements of work carried out by others, and evidence of subcontractor ability.', weight: 2, maxScore: 3, minScore: null,
        bands: ['No information provided', 'Name only', 'Name and previous projects', 'Name, projects and references'] },
      { id: 'p3w5', type: 'Want', criterion: 'Additional Criterion (CH-defined)', detail: 'To be identified by the Contract Holder.', weight: 1, maxScore: 3, minScore: null,
        bands: ['No Info', 'Basic', 'Satisfactory', 'Comprehensive'] },
      { id: 'p3w6', type: 'Want', criterion: 'Additional Criterion (CH-defined)', detail: 'To be identified by the Contract Holder.', weight: 1, maxScore: 3, minScore: null,
        bands: ['No Info', 'Basic', 'Satisfactory', 'Comprehensive'] },
    ],
  },
]

// Flat list (with part + partTitle) for score-map keying and iteration.
export const technicalCriteria = technicalEvalParts.flatMap(p =>
  p.criteria.map(c => ({ ...c, part: p.id, partTitle: p.title })))

export const commercialCriteria = [
  { id: 1, criterion: 'Total Bid Price',               weight: 40, maxScore: 3 },
  { id: 2, criterion: 'Payment Terms',                 weight: 15, maxScore: 3 },
  { id: 3, criterion: 'Warranty & Maintenance Cost',   weight: 20, maxScore: 3 },
  { id: 4, criterion: 'In-country Value (ICV)',        weight: 15, maxScore: 3 },
  { id: 5, criterion: 'Financial Stability',           weight: 10, maxScore: 3 },
]

export const contractTemplates = [
  {
    id: 1,
    name: 'Standard Government Contract',
    type: 'Fixed-Price',
    pages: 42,
    description: 'Comprehensive fixed-price contract aligned with the Oman Government Tenders & Procurement Law. Includes milestone schedule, payment terms, and SLA definitions.',
    tags: ['Fixed-Price', 'Milestone-Based', 'GTPL Compliant'],
    recommended: true,
  },
  {
    id: 2,
    name: 'Time & Materials Agreement',
    type: 'T&M',
    pages: 36,
    description: 'Flexible contract structure for evolving-scope projects. Includes rate cards, monthly reporting, and expenditure cap provisions under Ministry of Finance guidelines.',
    tags: ['T&M', 'Flexible', 'Monthly-Billing'],
    recommended: false,
  },
  {
    id: 3,
    name: 'Framework Service Agreement',
    type: 'Framework',
    pages: 28,
    description: 'Multi-call-off framework agreement allowing future task orders under the same contract umbrella, reducing procurement lead time for repeat services.',
    tags: ['Framework', 'Multi-Call-Off', 'Long-Term'],
    recommended: false,
  },
]

export const ittSections = [
  {
    id: 'scope',
    title: '1. Statement of Work',
    content: `The Contractor shall provide a comprehensive Cloud Infrastructure Upgrade for the Government National Data Centre, encompassing the design, procurement, installation, configuration, testing, commissioning, and maintenance of cloud infrastructure components as detailed in this Invitation to Tender.

The scope includes, but is not limited to:
• Migration of existing on-premise workloads to a hybrid cloud environment compliant with ITA standards
• Implementation of a zero-trust network architecture in line with NITA security guidelines
• Deployment of containerised application platforms (Kubernetes)
• Establishment of a 24/7 cloud operations monitoring centre
• Staff training and knowledge transfer to Omani technical personnel`,
  },
  {
    id: 'requirements',
    title: '2. Technical Requirements',
    content: `2.1 Infrastructure Requirements
The solution must achieve a minimum uptime SLA of 99.95% for all Tier-1 services. Redundancy must be implemented at every layer including compute, storage, and network.

2.2 Security Requirements
All data must be encrypted at rest (AES-256) and in transit (TLS 1.3+). The Contractor must comply with ISO 27001 and provide evidence of certification not older than 12 months. The solution must also comply with NITA Cybersecurity Framework v2.

2.3 Performance Requirements
System response time must not exceed 200ms at the 95th percentile under peak load conditions defined as 150% of current baseline.

2.4 In-Country Value (ICV)
Bidders must demonstrate a minimum ICV contribution of 30% as per Oman's In-Country Value Programme requirements.`,
  },
  {
    id: 'evaluation',
    title: '3. Evaluation Criteria',
    content: `Proposals will be evaluated on a Quality/Price ratio of 60/40 in accordance with the Government Tenders & Procurement Law (Royal Decree No. 36/2008).

Technical Evaluation (60%):
• Technical Approach & Methodology – 25%
• Team Qualifications & Experience – 20%
• Implementation Timeline – 15%

Commercial Evaluation (40%):
• Total Bid Price – 40%
• Payment Terms – 15%
• Warranty & Maintenance Cost – 20%
• In-Country Value (ICV) Compliance – 5%`,
  },
]
