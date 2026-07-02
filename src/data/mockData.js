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
]

export const bidders = [
  { id: 1, name: 'TechSolutions Ltd',   country: 'Oman',         techScore: 88, commScore: 82, totalBid: 'OMR 828,000',  recommended: true },
  { id: 2, name: 'InfraCore Systems',   country: 'UAE',          techScore: 84, commScore: 91, totalBid: 'OMR 762,000',  recommended: false },
  { id: 3, name: 'CloudNexus Corp',     country: 'India',        techScore: 79, commScore: 85, totalBid: 'OMR 882,000',  recommended: false },
  { id: 4, name: 'DataVault Solutions', country: 'Saudi Arabia', techScore: 72, commScore: 78, totalBid: 'OMR 712,000',  recommended: false },
]

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
