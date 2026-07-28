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

  // ── Management Review ─────────────────────────────────────────────────────
  {
    id: 'ITT-2025-013',
    title: 'Oman National Railway Signalling & Control System',
    department: 'Oman Rail',
    budget: 'OMR 2,770,000',
    status: 'mgmt_review',
    stage: 'Management Review',
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
    status: 'mgmt_review',
    stage: 'Management Review',
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
    status: 'mgmt_review',
    stage: 'Management Review',
    evalProgress: 'not_started',
    created: '2025-02-18',
    deadline: '2025-04-30',
    bidders: 3,
    aiScore: 90,
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
// that precedes the price comparison.
export const commercialComplianceDocs = [
  { id: 'cd1', name: 'Priced Schedule of Prices (Section E)', mandatory: true },
  { id: 'cd2', name: 'Tender Guarantee / Bid Bond',           mandatory: true },
  { id: 'cd3', name: 'Commercial Terms & Conditions Acceptance', mandatory: true },
  { id: 'cd4', name: 'Price Validity Confirmation (120 days)', mandatory: true },
  { id: 'cd5', name: 'Completed & Signed Form of Tender',      mandatory: true },
]

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
