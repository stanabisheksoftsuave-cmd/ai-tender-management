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
    assignedTechEval: { id: 3, name: 'Sarah Chen' },
    assignedCommEval: { id: 4, name: 'Mark Davis' },
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
    assignedTechEval: { id: 3, name: 'Sarah Chen' },
    assignedCommEval: { id: 4, name: 'Mark Davis' },
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
    assignedTechEval: { id: 3, name: 'Sarah Chen' },
    assignedCommEval: { id: 4, name: 'Mark Davis' },
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
    assignedTechEval: { id: 3, name: 'Sarah Chen' },
    assignedCommEval: { id: 4, name: 'Mark Davis' },
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
    assignedTechEval: { id: 3, name: 'Sarah Chen' },
    assignedCommEval: { id: 4, name: 'Mark Davis' },
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
    assignedTechEval: { id: 3, name: 'Sarah Chen' },
    assignedCommEval: { id: 4, name: 'Mark Davis' },
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
  {
    id: 'ITT-2025-004',
    title: 'Government WAN & Core Network Infrastructure Upgrade',
    department: 'Information Technology Authority (ITA)',
    budget: 'OMR 365,000',
    status: 'draft',
    stage: 'Pending Approval',
    description: 'Complete overhaul of the government-wide area network infrastructure including replacement of legacy switches, implementation of SD-WAN across all ministries, and upgrade to 10 Gbps backbone connectivity for all government entities in the Muscat Governorate.',
    duration: '18 months',
    created: '2025-03-18',
    deadline: '2025-05-01',
    bidders: 0,
    aiScore: null,
  },
  {
    id: 'ITT-2025-005',
    title: 'e-Nafid HR & Payroll Digital Transformation',
    department: 'Ministry of Labour',
    budget: 'OMR 277,000',
    status: 'upload',
    stage: 'Awaiting Ingestion',
    created: '2025-03-05',
    deadline: '2025-04-20',
    bidders: 4,
    aiScore: null,
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
  {
    id: 'ITT-2025-020',
    title: 'Buraimi Border Crossing Security Systems Upgrade',
    tenderType: 'Works',
    department: 'Royal Oman Police',
    status: 'prequal_stage3',
    stage: 'Pre-Qualification — Response Review',
    created: '2025-04-01',
    bidders: 0,
    aiScore: null,
    sowFileName: 'Buraimi-Border-Security-SOW.pdf',
    workCategory: 'Electrical & Instrumentation',
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
      },
      {
        id: 104, name: 'DataVault Solutions', country: 'Saudi Arabia', category: 'IT & Communications', isLocal: false,
        responseUploaded: false,
        stage3: { qhse: {}, technical: {}, administrative: {} },
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
  { id: 't5', item: 'Quality Management System', detail: 'Valid ISO 9001 (or equivalent) certification covering the scope of work.' },
]

export const ADMINISTRATIVE_CRITERIA = [
  { id: 'a1', item: 'Completed & Signed PQQ', detail: 'PQQ document fully completed and signed by an authorised representative.' },
  { id: 'a2', item: 'Supplier Registration Form', detail: 'Filled template of the Supplier Registration Form.' },
  { id: 'a3', item: 'Commercial Registration Certificate', detail: "Valid Commercial Registration Certificate." },
  { id: 'a4', item: 'MOL Omanisation / Green Card', detail: 'Local suppliers only — Not Applicable for foreign companies.', localOnly: true },
  { id: 'a5', item: 'JSRS Registration Certificate', detail: 'Valid JSRS registration certificate.' },
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

export const technicalCriteria = [
  { id: 1, criterion: 'Technical Approach & Methodology',   weight: 25, maxScore: 3 },
  { id: 2, criterion: 'Team Qualifications & Experience',   weight: 20, maxScore: 3 },
  { id: 3, criterion: 'Implementation Timeline',            weight: 15, maxScore: 3 },
  { id: 4, criterion: 'Technology Stack & Innovation',      weight: 20, maxScore: 3 },
  { id: 5, criterion: 'Risk Management Plan',               weight: 10, maxScore: 3 },
  { id: 6, criterion: 'After-Sales Support & SLA',          weight: 10, maxScore: 3 },
]

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
    title: '1. Scope of Work',
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
