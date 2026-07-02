import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Card from '../components/ui/Card'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import TenderSelectList from '../components/ui/TenderSelectList'
import { bidders as seedBidders, technicalCriteria as defaultTechCriteria } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'

const Svg = ({ size=16, sw=1.6, style, className='', children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round"
    style={style} className={className}>{children}</svg>
)
const CheckCircle    = p => <Svg {...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></Svg>
const XCircle        = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></Svg>
const ChevronDown    = p => <Svg {...p}><polyline points="6 9 12 15 18 9"/></Svg>
const ChevronUp      = p => <Svg {...p}><polyline points="18 15 12 9 6 15"/></Svg>
const FileText       = p => <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></Svg>
const Bell           = p => <Svg {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></Svg>
const X              = p => <Svg {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></Svg>
const ArrowLeft      = p => <Svg {...p}><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></Svg>
const ShieldOff      = p => <Svg {...p}><path d="M19.69 14a6.9 6.9 0 0 0 .31-2V5l-8-3-3.16 1.18"/><path d="M4.73 4.73L4 5v7c0 6 8 10 8 10a20.29 20.29 0 0 0 5.62-4.38"/><line x1="1" y1="1" x2="23" y2="23"/></Svg>
const Eye            = p => <Svg {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></Svg>
const Send           = p => <Svg {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></Svg>
const AlertTriangle  = p => <Svg {...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></Svg>
const Bot            = p => <Svg {...p}><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/><line x1="8" y1="16" x2="8.01" y2="16"/><line x1="16" y1="16" x2="16.01" y2="16"/></Svg>
const ClipboardCheck = p => <Svg {...p}><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></Svg>
const Hash           = p => <Svg {...p}><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></Svg>
const Calendar       = p => <Svg {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></Svg>
const RotateCcw      = p => <Svg {...p}><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.1"/></Svg>
const Zap            = p => <Svg {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></Svg>
const Users          = p => <Svg {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></Svg>
const Shield         = p => <Svg {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></Svg>
const ScanSearch     = p => <Svg {...p}><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/><path d="M18.5 18.5l2.5 2.5"/></Svg>
const BarChart3      = p => <Svg {...p}><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></Svg>
const Download       = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></Svg>
const Clock          = p => <Svg {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></Svg>
const Upload         = p => <Svg {...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></Svg>

// ── Evaluation Metric Definitions ────────────────────────────────────────────

const MANDATORY = [
  { id: 'm1', name: 'Company Registration Certificate',    docRef: 'CRC-2025-001',   docType: 'Legal Document' },
  { id: 'm2', name: 'ISO 9001:2015 Quality Certification', docRef: 'ISO-QC-847',     docType: 'Certification' },
  { id: 'm3', name: 'Audited Financial Statements (3 Yr)', docRef: 'FIN-STMT-22-24', docType: 'Financial Document' },
  { id: 'm4', name: 'Bid Bond / Bank Guarantee',           docRef: 'BG-MUSCAT-2025', docType: 'Financial Guarantee' },
  { id: 'm5', name: 'Technical Proposal Document',         docRef: 'TECH-PROP-001',  docType: 'Technical Document' },
]

const OPTIONAL = [
  { id: 'o1', name: 'ISO 27001 Information Security Cert', docRef: 'ISO-IS-2239',    docType: 'Certification' },
  { id: 'o2', name: 'NITA Cybersecurity Compliance Cert',  docRef: 'NITA-CC-449',    docType: 'Regulatory Cert' },
  { id: 'o3', name: 'Local Partner Agreement (ICV ≥30%)',  docRef: 'ICV-AGRMT-2025', docType: 'Partnership Agreement' },
  { id: 'o4', name: 'Environmental & Sustainability Rpt',  docRef: 'ESR-2024-ANN',   docType: 'Compliance Report' },
  { id: 'o5', name: 'After-Sales SLA Declaration',         docRef: 'SLA-DECL-2025',  docType: 'Service Agreement' },
]

// ── Seed compliance state keyed by bidder ID ─────────────────────────────────
// Bidder 1 (TechSolutions Ltd)  → Compliant
// Bidder 2 (InfraCore Systems)  → Partial Compliant (missing o2, o4)
// Bidder 3 (CloudNexus Corp)    → Non-Compliant    (missing m2, m4)
// Bidder 4 (DataVault Solutions)→ Partial Compliant (missing o3, o5)

const SEED = {
  1: {
    mandatory: { m1: true, m2: true, m3: true, m4: true, m5: true },
    optional:  { o1: true, o2: true, o3: true, o4: true, o5: true },
  },
  2: {
    mandatory: { m1: true, m2: true, m3: true, m4: true, m5: true },
    optional:  { o1: true, o2: false, o3: true, o4: false, o5: true },
  },
  3: {
    mandatory: { m1: true, m2: false, m3: true, m4: false, m5: true },
    optional:  { o1: true, o2: false, o3: false, o4: true, o5: true },
  },
  4: {
    mandatory: { m1: true, m2: true, m3: true, m4: true, m5: true },
    optional:  { o1: true, o2: true, o3: false, o4: true, o5: false },
  },
}

const FULLY_COMPLIANT = {
  mandatory: Object.fromEntries(MANDATORY.map(m => [m.id, true])),
  optional:  Object.fromEntries(OPTIONAL.map(o => [o.id, true])),
}

// ── Pure helpers ─────────────────────────────────────────────────────────────

function deriveStatus(comp) {
  if (MANDATORY.some(m => !comp.mandatory[m.id])) return 'non_compliant'
  if (OPTIONAL.some(o => !comp.optional[o.id]))   return 'partial_compliant'
  return 'compliant'
}

function getMissing(comp) {
  return {
    mandatory: MANDATORY.filter(m => !comp.mandatory[m.id]),
    optional:  OPTIONAL.filter(o => !comp.optional[o.id]),
  }
}

function buildJustification(bidderName, comp) {
  const status = deriveStatus(comp)
  const { mandatory: mm, optional: mo } = getMissing(comp)
  if (status === 'compliant') {
    return `${bidderName} is fully Compliant. All 5 mandatory parameters and all 5 optional criteria have been submitted and verified. No corrective action is required.`
  }
  if (status === 'partial_compliant') {
    const names = mo.map(x => `"${x.name}"`).join(', ')
    return `${bidderName} is Partially Compliant. All 5 critical mandatory parameters are present, however ${mo.length} optional ${mo.length === 1 ? 'criterion is' : 'criteria are'} missing: ${names}. A correction request may be issued to the vendor portal.`
  }
  const names = mm.map(x => `"${x.name}"`).join(', ')
  return `${bidderName} is Non-Compliant. ${mm.length} mandatory ${mm.length === 1 ? 'document is' : 'documents are'} absent: ${names}. This bidder cannot advance without resolving these critical gaps.`
}

const STATUS_CFG = {
  compliant:         { label: 'Compliant',         badgeVariant: 'compliant',         justBg: 'bg-emerald-50', justBorder: 'border-emerald-200', justText: 'text-emerald-700', dot: 'bg-emerald-500' },
  partial_compliant: { label: 'Partial Compliant', badgeVariant: 'partial_compliant', justBg: 'bg-amber-50',   justBorder: 'border-amber-200',   justText: 'text-amber-700',   dot: 'bg-amber-500' },
  non_compliant:     { label: 'Non-Compliant',     badgeVariant: 'non_compliant',     justBg: 'bg-red-50',     justBorder: 'border-red-200',     justText: 'text-red-700',     dot: 'bg-red-500' },
}

// ── Mock document content for Source Proof modal ─────────────────────────────

const DOC_CONTENT = {
  m1: (name) => `SULTANATE OF OMAN — MINISTRY OF COMMERCE\n\nCOMPANY REGISTRATION CERTIFICATE\nCertificate No: CRC-2025-001\nIssue Date: 15 January 2025 · Valid Until: 14 January 2026\n\nThis certifies that ${name} is duly registered under the\nCommercial Companies Law (Royal Decree No. 4/1974) and\nauthorised to conduct business in the Sultanate of Oman.\n\nRegistration Category: IT Services & Solutions\nCR Number: 1-234567\nCapital: OMR 2,500,000`,

  m2: (name) => `QUALITY MANAGEMENT SYSTEM CERTIFICATE\nISO 9001:2015 — Certificate Ref: ISO-QC-847\n\nThis certifies that ${name}\nhas established and maintains a Quality Management System\nfulfilling the requirements of ISO 9001:2015.\n\nScope: Design, Development, Implementation and Support\n       of IT Infrastructure Solutions\n\nIssued by: Bureau Veritas Certification\nIssue Date: 01 March 2024 · Expiry: 28 February 2027\nSurveillance Audits: Annual`,

  m3: (name) => `AUDITED FINANCIAL STATEMENTS — Ref: FIN-STMT-22-24\nPrepared by: Ernst & Young Muscat\n\n${name} — Key Financial Metrics\n\nFY 2022: Revenue OMR 8.4M  · Net Profit OMR 1.1M · Assets OMR 12.9M\nFY 2023: Revenue OMR 10.2M · Net Profit OMR 1.5M · Assets OMR 15.3M\nFY 2024: Revenue OMR 12.8M · Net Profit OMR 1.9M · Assets OMR 18.8M\n\nAuditor's Opinion: Unqualified (Clean)\nGoing Concern: No material uncertainty noted`,

  m4: (name) => `BANK GUARANTEE — Ref: BG-MUSCAT-2025\nDate: 10 March 2025 · Bank of Muscat SAOG\n\nTo: Information Technology Authority (ITA)\n\nWe irrevocably undertake to pay a sum not exceeding:\nOMR 46,150 (5% of bid value OMR 923,000)\n\nSubmitted by: ${name} for ITT-2025-001\nValid Until: 15 July 2025\nGuarantee Number: BOM-BG-2025-04471`,

  m5: (name) => `TECHNICAL PROPOSAL DOCUMENT — Ref: TECH-PROP-001\nTender: ITT-2025-001 · Submitted by: ${name}\n\n1. EXECUTIVE SUMMARY\n   Hybrid cloud migration leveraging AWS GovCloud and\n   Azure Government with on-premise sovereign data controls.\n\n2. IMPLEMENTATION PHASES\n   Phase 1 (M1–3):  Assessment & Architecture Design\n   Phase 2 (M4–9):  Core Infrastructure Migration\n   Phase 3 (M10–15): Legacy Workload Migration\n   Phase 4 (M16–18): Optimisation & Handover\n\n3. KEY COMMITMENTS\n   · 99.97% uptime SLA guarantee\n   · Zero-trust network (NIST SP 800-207)\n   · ISO 27001 compliant data handling`,

  o1: (name) => `ISO/IEC 27001:2022 — INFORMATION SECURITY MANAGEMENT\nCertificate Ref: ISO-IS-2239\n\n${name} has demonstrated conformity with ISO/IEC 27001:2022.\n\nScope: Information Security Management for IT Infrastructure\n       Operations and Cloud Services\n\nIssued by: SGS United Kingdom Ltd\nIssue Date: 14 June 2024 · Expiry: 13 June 2027\nAccreditation Body: UKAS`,

  o2: (name) => `NITA CYBERSECURITY COMPLIANCE CERTIFICATE\nRef: NITA-CC-449\n\nNational Information Technology Authority (NITA)\nSultanate of Oman\n\nThis certifies that ${name} has been assessed and found\ncompliant with:\n  · NITA Cybersecurity Framework v2.0\n  · Oman National CERT Requirements\n\nAssessment Date: 20 February 2025\nValid Until: 19 February 2026 · Tier: 3 — Advanced`,

  o3: (name) => `IN-COUNTRY VALUE AGREEMENT — Ref: ICV-AGRMT-2025\n\nBetween: ${name} (Prime Contractor)\nAnd:     Omani Tech Solutions LLC (Local Partner)\n\nICV Commitment: 35% of total contract value\n\nBreakdown:\n  · Omani Employees:   18% of headcount\n  · Local Procurement: 22% of materials\n  · Skills Transfer:   3 Omani engineers to be trained\n\nSigned: 5 March 2025\nICV Programme Registration: ICV-2025-04419`,

  o4: (name) => `ENVIRONMENTAL & SUSTAINABILITY REPORT 2024\nRef: ESR-2024-ANN · ${name}\n\nCarbon Footprint:\n  Scope 1+2 Emissions: 284 tCO₂e (FY2024) · -12% vs 2023\n  Target 2025: -20% vs 2022 baseline\n\nEnergy:\n  Renewable Energy Usage: 41%\n  Data Centre PUE: 1.45\n\nWaste:\n  E-Waste Recycled: 98% · Office to Landfill: <3%\n\nISO 14001:2015 Certified — Expiry: June 2026`,

  o5: (name) => `AFTER-SALES SLA DECLARATION — Ref: SLA-DECL-2025\nProvider: ${name} · Client: Government of Oman (ITA)\n\nSUPPORT TIERS:\n  P1 — Critical (System Down)\n       Response: 15 min · Resolution: 4 hr · 24/7/365\n\n  P2 — High (Major Feature Impaired)\n       Response: 1 hr  · Resolution: 8 hr\n\n  P3 — Medium\n       Response: 4 hr  · Resolution: 24 hr\n\nAnnual SLA Review: Yes\nPenalty Regime: Applicable per GTPL regulations`,
}

// ── Source Proof Modal ────────────────────────────────────────────────────────

function SourceProofModal({ metric, bidderName, onClose }) {
  const content = DOC_CONTENT[metric.id]
    ? DOC_CONTENT[metric.id](bidderName)
    : `Document Ref: ${metric.docRef}\nType: ${metric.docType}\n\n[Content extracted and verified by AI compliance engine]`

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText size={14} className="text-[var(--color-primary)]" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--color-primary)]">Source Proof Document</span>
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">{metric.name}</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[11px] font-mono text-slate-400">{metric.docRef}</span>
              <span className="text-[11px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">{metric.docType}</span>
              <span className="text-[11px] text-slate-400">· {bidderName}</span>
            </div>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-slate-100 text-slate-400 transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        {/* AI strip */}
        <div className="px-6 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Bot size={12} className="text-blue-500 shrink-0" />
          <span className="text-[11px] text-blue-700 font-medium">
            AI Verified — Extracted on 2025-04-01 · Confidence Score: 97.4% · No discrepancies detected
          </span>
        </div>

        {/* Document body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 font-mono text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            {content}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">Parsed as part of automated compliance review · Read-only</span>
          <button onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium rounded-lg transition-colors">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Metric row (used in accordion) ───────────────────────────────────────────

function MetricRow({ metric, present, kind, onViewProof }) {
  const kindCfg = {
    mandatory: { missBg: 'bg-red-50', missIcon: 'text-red-500', missBadge: 'bg-red-100 text-red-600' },
    optional:  { missBg: 'bg-amber-50/60', missIcon: 'text-amber-500', missBadge: 'bg-amber-100 text-amber-600' },
  }[kind]

  return (
    <div className={`flex items-center justify-between gap-2 p-2.5 rounded-lg
      ${present ? 'bg-emerald-50/60' : kindCfg.missBg}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        {present
          ? <CheckCircle size={14} className="text-emerald-500 shrink-0" />
          : <XCircle size={14} className={`${kindCfg.missIcon} shrink-0`} />}
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-700 leading-tight truncate">{metric.name}</p>
          <p className="text-[10px] font-mono text-slate-400">{metric.docRef}</p>
        </div>
      </div>
      {present ? (
        <button onClick={onViewProof}
          className="flex items-center gap-1 text-[10px] font-semibold text-[var(--color-primary)] hover:underline shrink-0 ml-1">
          <Eye size={10} /> View Proof
        </button>
      ) : (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ml-1 ${kindCfg.missBadge}`}>
          Missing
        </span>
      )}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TechnicalEvaluation() {
  const { tenderId } = useParams()
  const navigate   = useNavigate()
  const { user }   = useAuth()
  const { tenders, advanceTender, updateTender } = useTenders()

  const [expandedBidder,   setExpandedBidder]   = useState(null)
  const [notifications,    setNotifications]    = useState([])
  const [proofModal,       setProofModal]       = useState(null)
  const [compliance,       setCompliance]       = useState(SEED)
  const [submitted,        setSubmitted]        = useState(false)
  const [statusOverrides,  setStatusOverrides]  = useState({})
  const [statusDropdown,   setStatusDropdown]   = useState(null)
  const [evalNotes,  setEvalNotes]  = useState({}) // { [bidderId]: [{ text, ts }] }
  const [noteInput,  setNoteInput]  = useState({}) // { [bidderId]: string }
  const [started,          setStarted]          = useState(false)
  const [aiLoading,        setAiLoading]        = useState(false)
  const [aiStep,           setAiStep]           = useState(0)
  const [showSubmit,       setShowSubmit]       = useState(false)
  const [reExtracting,     setReExtracting]     = useState(false)
  const [reExtractStep,    setReExtractStep]    = useState(0)
  const [reEvalState,      setReEvalState]      = useState({}) // { [bidderId]: { step, done } }
  const [activeTab,        setActiveTab]        = useState('compliance') // 'compliance' | 'scoring'
  const [techScores,       setTechScores]       = useState({})
  const [techCriteria]                          = useState(defaultTechCriteria)
  const [aiScored,    setAiScored]    = useState(false)
  const [aiScoring,   setAiScoring]   = useState(false)
  const [aiScoreStep, setAiScoreStep] = useState(0)
  const [aiModified,  setAiModified]  = useState({})
  const eligibleBiddersRef            = useRef([])

  const AI_STEPS = [
    'Parsing bidder submission bundles…',
    'Extracting mandatory compliance documents…',
    'Cross-referencing ITT requirements…',
    'Running entity recognition on legal clauses…',
    'Mapping optional criteria against submissions…',
    'Generating compliance matrix…',
    'AI evaluation complete — results ready',
  ]

  const RE_EXTRACT_STEPS = [
    'Receiving re-uploaded documents from Contract Engineer…',
    'Parsing corrected compliance documents…',
    'Re-validating against ITT requirements…',
    'Re-evaluating compliance status for updated bidders…',
    'Updating compliance matrix — new statuses applied',
  ]

  const RE_EVAL_STEPS = [
    'Scanning re-uploaded documents…',
    'Verifying compliance against ITT requirements…',
    'Cross-referencing corrected submissions…',
    'Updating compliance matrix…',
    'Re-evaluation complete',
  ]

  const tender = tenders.find(t => t.id === tenderId)

  // Derived values needed before hooks (avoids temporal dead zone with allFinalized)
  const tenderBidders   = Array.isArray(tender?.bidderList)
    ? tender.bidderList
    : (tender?.bidders > 0 ? seedBidders.slice(0, tender.bidders) : seedBidders)
  const pendingIds      = new Set((tender?.correctionRequests || []).filter(r => !r.resolved).map(r => r.bidderId))
  const resolvedIds     = new Set((tender?.correctionRequests || []).filter(r =>  r.resolved).map(r => r.bidderId))
  const extractedIds    = new Set(tender?.extractedBidderIds || [])
  const displayBidders  = tenderBidders.filter(b => !pendingIds.has(b.id))
  // Resolved-by-POF bidders that haven't been re-extracted yet in TenderContext
  const pendingReExtract = tenderBidders.filter(b => resolvedIds.has(b.id) && !extractedIds.has(b.id))
  const allFinalized    = started && displayBidders.length > 0 && pendingIds.size === 0 &&
    displayBidders.every(b => {
      const s = statusOverrides[b.id] ?? deriveStatus(compliance[b.id] ?? FULLY_COMPLIANT)
      return s === 'compliant' || s === 'non_compliant'
    })

  // AI loading — on complete persist all bidder IDs as extracted
  useEffect(() => {
    if (!aiLoading) return
    if (aiStep >= AI_STEPS.length - 1) {
      const timer = setTimeout(() => {
        setAiLoading(false)
        setStarted(true)
        updateTender(tenderId, { extractedBidderIds: tenderBidders.map(b => b.id) })
      }, 700)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setAiStep(s => s + 1), 520)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiLoading, aiStep])

  // On tender mount: skip landing+AI if all bidders already extracted; trigger re-extraction for new re-uploads
  useEffect(() => {
    if (!tender) return
    if (tender.status === 'tech_eval' && tender.evalProgress !== 'in_progress') {
      updateTender(tenderId, { evalProgress: 'in_progress' })
    }
    const allBidders = Array.isArray(tender.bidderList)
      ? tender.bidderList
      : (tender.bidders > 0 ? seedBidders.slice(0, tender.bidders) : seedBidders)
    const extracted   = new Set(tender.extractedBidderIds || [])
    const allExtracted = allBidders.length > 0 && allBidders.every(b => extracted.has(b.id))
    const needsReExtract = allBidders.some(b =>
      (tender.correctionRequests || []).some(r => r.bidderId === b.id && r.resolved) && !extracted.has(b.id)
    )
    if (needsReExtract) {
      setReExtractStep(0); setReExtracting(true)
    } else if (allExtracted) {
      setStarted(true) // All already extracted → skip landing and AI loading
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tender?.id])

  // Catch POF re-upload resolves while evaluator has the page open
  useEffect(() => {
    if (started || reExtracting || pendingReExtract.length === 0) return
    setReExtractStep(0); setReExtracting(true)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingReExtract.length])

  // When compliance is fully finalized, move straight to scoring — skip the submit overlay
  useEffect(() => {
    if (!allFinalized) { setShowSubmit(false); return }
    setActiveTab('scoring')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFinalized])

  // Re-extraction progress — on complete: re-evaluate compliance for re-submitted bidders,
  // persist extracted IDs, clear status overrides for those bidders, go to submit page
  useEffect(() => {
    if (!reExtracting) return
    if (reExtractStep >= RE_EXTRACT_STEPS.length - 1) {
      const timer = setTimeout(() => {
        // Re-evaluate compliance: mark the previously-missing docs as now present
        // (the evaluator notified POF of exactly these docs, POF re-uploaded them)
        setCompliance(prev => {
          const updated = { ...prev }
          for (const b of pendingReExtract) {
            const req = (tender?.correctionRequests || []).find(r => r.bidderId === b.id && r.resolved)
            if (!req) continue
            const base = updated[b.id] ?? FULLY_COMPLIANT
            const newMandatory = { ...base.mandatory }
            const newOptional  = { ...base.optional }
            for (const doc of (req.missingDocs || [])) {
              if (doc.kind === 'mandatory') newMandatory[doc.id] = true
              else if (doc.kind === 'optional')  newOptional[doc.id]  = true
            }
            updated[b.id] = { mandatory: newMandatory, optional: newOptional }
          }
          return updated
        })
        // Clear any manual overrides for re-submitted bidders so re-derived status shows
        setStatusOverrides(prev => {
          const next = { ...prev }
          pendingReExtract.forEach(b => { delete next[b.id] })
          return next
        })
        setReExtracting(false)
        setStarted(true)
        setActiveTab('scoring') // re-upload done → go straight to scoring, skip submit screen
        const merged = [...new Set([...(tender?.extractedBidderIds || []), ...pendingReExtract.map(b => b.id)])]
        updateTender(tenderId, { extractedBidderIds: merged })
      }, 800)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setReExtractStep(s => s + 1), 600)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reExtracting, reExtractStep])

  // Auto-start AI scoring when scoring tab opens
  useEffect(() => {
    if (activeTab !== 'scoring' || aiScored || aiScoring) return
    const t = setTimeout(() => { setAiScoreStep(0); setAiScoring(true) }, 300)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Step through animation; on completion apply scores from ref (avoids stale closure on eligibleBidders)
  useEffect(() => {
    if (!aiScoring) return
    if (aiScoreStep >= techCriteria.length + 2) {
      const result = {}
      eligibleBiddersRef.current.forEach(bidder => {
        techCriteria.forEach(c => {
          const base = ((bidder.techScore ?? 75) / 100) * 3
          const seed = (Number(bidder.id) * 17 + Number(c.id) * 7) % 10
          const variation = (seed - 5) * 0.12
          result[`${bidder.id}-${c.id}`] = Math.min(3, Math.max(0, Math.round(base + variation)))
        })
      })
      setTechScores(result)
      setAiScoring(false)
      setAiScored(true)
      return
    }
    const t = setTimeout(() => setAiScoreStep(s => s + 1), 380)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiScoring, aiScoreStep])

  // ── Role gate ──
  if (user?.role?.id !== 'tech_eval') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
          <ShieldOff size={22} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
          <p className="text-xs text-slate-400 mt-1">Technical Evaluation is only accessible to Technical Evaluators.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={13} /> Back to Dashboard
        </Button>
      </div>
    )
  }

  if (!tenderId) {
    const assignedTenders = tenders.filter(
      t => t.status === 'tech_eval' && t.assignedTechEval?.id === user?.id
    )
    return (
      <TenderSelectList
        tenders={assignedTenders}
        status="tech_eval"
        basePath="/technical-eval"
        title="Technical Evaluation"
        description="Select a tender to begin compliance evaluation"
        emptyText="No tenders assigned to you for technical evaluation"
      />
    )
  }

  if (!tender || tender.assignedTechEval?.id !== user?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
        <p className="text-sm">{!tender ? 'Tender not found.' : 'This tender is not assigned to you.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={13} /> Back to Dashboard
        </Button>
      </div>
    )
  }

  // ── Re-extraction screen (second pass — only for re-uploaded bidders) ──
  if (reExtracting) {
    const resubmittedBidders = tenderBidders.filter(b => resolvedIds.has(b.id))
    const reProgress = Math.round(((reExtractStep + 1) / RE_EXTRACT_STEPS.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}>
          <Bot size={36} className="text-white animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800 mb-1">Re-Extracting Updated Documents</h2>
          <p className="text-sm text-slate-500">
            Processing re-uploaded documents for {resubmittedBidders.length} bidder{resubmittedBidders.length !== 1 ? 's' : ''}
          </p>
          {resubmittedBidders.length > 0 && (
            <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
              {resubmittedBidders.map(b => (
                <span key={b.id} className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {b.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Re-processing…</span>
            <span>{reProgress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${reProgress}%`, background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)' }} />
          </div>
          <div className="space-y-1.5 pt-2">
            {RE_EXTRACT_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300
                ${i < reExtractStep ? 'text-blue-600' : i === reExtractStep ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}>
                <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 transition-all
                  ${i < reExtractStep ? 'bg-blue-500' : i === reExtractStep ? 'bg-slate-800 animate-pulse' : 'bg-slate-200'}`}>
                  {i < reExtractStep
                    ? <CheckCircle size={10} className="text-white" />
                    : <span className="text-white text-[8px] font-bold">{i + 1}</span>}
                </div>
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── AI Loading screen ──
  if (aiLoading) {
    const progress = Math.round(((aiStep + 1) / AI_STEPS.length) * 100)
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 px-4">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-xl"
          style={{ background: 'linear-gradient(135deg, #1D4ED8, #3B82F6)', boxShadow: '0 8px 32px rgba(37,99,235,0.35)' }}>
          <Bot size={36} className="text-white animate-pulse" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-800 mb-1">AI Compliance Engine Running</h2>
          <p className="text-sm text-slate-500">Analysing {displayBidders.length} bidder submissions against 10 compliance metrics</p>
        </div>
        <div className="w-full max-w-md space-y-3">
          <div className="flex justify-between text-xs text-slate-500 font-medium">
            <span>Processing…</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}%`, background: 'linear-gradient(90deg, #1D4ED8, #3B82F6)' }} />
          </div>
          <div className="space-y-1.5 pt-2">
            {AI_STEPS.map((step, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs transition-all duration-300
                ${i < aiStep ? 'text-blue-600' : i === aiStep ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}>
                {i < aiStep
                  ? <CheckCircle size={12} className="shrink-0 text-blue-500" />
                  : i === aiStep
                    ? <span className="w-3 h-3 rounded-full bg-blue-500 animate-pulse shrink-0" />
                    : <span className="w-3 h-3 rounded-full bg-slate-200 shrink-0" />}
                {step}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Pre-start landing screen ──
  if (!started) {
    return (
      <div className="space-y-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/dashboard')}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
            <ArrowLeft size={12} /> Dashboard
          </button>
          <span className="text-slate-300">/</span>
          <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
        </div>

        <Card className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg"
              style={{ background: 'linear-gradient(135deg, #1D4ED8 0%, #3B82F6 100%)', boxShadow: '0 8px 32px rgba(37,99,235,0.3)' }}>
              <ScanSearch size={36} className="text-white" />
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">{tender.title}</h2>
            <p className="text-sm text-slate-500 mt-1">{tender.department} · Deadline: {tender.deadline}</p>
            <Badge variant="tech_eval" className="mt-2 inline-flex">Technical Evaluation</Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-sm mx-auto">
            {[
              { icon: Users,     label: 'Bidders',          value: displayBidders.length },
              { icon: Shield,    label: 'Mandatory Checks',  value: MANDATORY.length },
              { icon: ClipboardCheck, label: 'Optional Checks', value: OPTIONAL.length },
            ].map(s => (
              <div key={s.label} className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-4 text-center">
                <s.icon size={16} className="text-[var(--color-primary)] mx-auto mb-1.5" />
                <div className="text-xl font-bold text-slate-800">{s.value}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <Bot size={13} className="text-blue-600" />
              <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">AI Compliance Engine</span>
            </div>
            <p className="text-xs text-blue-700 leading-relaxed">
              Clicking Start will trigger the AI to parse all bidder submissions, extract compliance documents, and build the evaluation matrix. This takes approximately 3–5 seconds.
            </p>
          </div>

          <Button
            onClick={() => { setAiStep(0); setAiLoading(true) }}
            className="mx-auto px-8 py-3 text-sm font-semibold"
          >
            <Zap size={15} /> Start Evaluation
          </Button>
        </Card>
      </div>
    )
  }

  const getEffectiveStatus = (bidderId, comp) =>
    statusOverrides[bidderId] ?? deriveStatus(comp)

  // Compliance stat counts
  const statCounts = displayBidders.reduce((acc, b) => {
    const s = getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT)
    acc[s] = (acc[s] || 0) + 1
    return acc
  }, {})

  const setTechScore = (bidderId, criterionId, value) => {
    const num = value === '' ? '' : Math.min(3, Math.max(0, Number(value)))
    setTechScores(prev => ({ ...prev, [`${bidderId}-${criterionId}`]: num }))
  }
  const techTotalFor = bidderId =>
    techCriteria.reduce((sum, c) => {
      const s = techScores[`${bidderId}-${c.id}`]
      return sum + ((s === '' || s === undefined ? 0 : Number(s)) * c.weight / 100)
    }, 0)
  const hasTechScores = bidderId => techCriteria.some(c => techScores[`${bidderId}-${c.id}`] !== undefined)
  const eligibleBidders = displayBidders.filter(b =>
    getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT) !== 'non_compliant'
  )
  eligibleBiddersRef.current = eligibleBidders // keep ref fresh for the AI scoring effect
  const allTechScored = eligibleBidders.length > 0 && eligibleBidders.every(b =>
    techCriteria.every(c => { const v = techScores[`${b.id}-${c.id}`]; return v !== undefined && v !== '' })
  )
  const getScoreCompliance = score => {
    if (score >= 2) return { variant: 'compliant',         label: 'Compliant' }
    if (score >= 1) return { variant: 'partial_compliant', label: 'Partial' }
    return             { variant: 'non_compliant',     label: 'Non-Compliant' }
  }

  const handleNotifyPOF = (bidder) => {
    if (notifications.some(n => n.bidder.id === bidder.id)) return
    const now = new Date()
    const notifiedAt = now.toLocaleString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
    const comp = compliance[bidder.id] ?? FULLY_COMPLIANT
    const { mandatory: mm, optional: mo } = getMissing(comp)
    const missingDocs = [
      ...mm.map(m => ({ ...m, kind: 'mandatory' })),
      ...mo.map(o => ({ ...o, kind: 'optional' })),
    ]
    setNotifications(prev => [...prev, { bidder, comp, notifiedAt }])
    // Persist to TenderContext so Contract Engineer can see it in BidderUpload
    const existing = tender.correctionRequests || []
    updateTender(tenderId, {
      correctionRequests: [
        ...existing.filter(r => r.bidderId !== bidder.id),
        { bidderId: bidder.id, bidderName: bidder.name, missingDocs, notifiedAt, resolved: false, evaluatorName: user?.name || 'Technical Evaluator' },
      ],
    })
  }

  const startReEval = (bidderId) => {
    setReEvalState(prev => ({ ...prev, [bidderId]: { step: 0, done: false } }))
    let step = 0
    const advance = () => {
      step++
      if (step < RE_EVAL_STEPS.length) {
        setReEvalState(prev => ({ ...prev, [bidderId]: { step, done: false } }))
        setTimeout(advance, 700)
      } else {
        setReEvalState(prev => ({ ...prev, [bidderId]: { step: RE_EVAL_STEPS.length - 1, done: true } }))
        setCompliance(prev => ({ ...prev, [bidderId]: FULLY_COMPLIANT }))
      }
    }
    setTimeout(advance, 700)
  }

  const openBidderDocument = (bidder) => {
    const comp = compliance[bidder.id] ?? FULLY_COMPLIANT
    const submissionId = `SUB-2025-00${40 + bidder.id}`
    const submissionDate = `2025-04-0${bidder.id}`

    const mandatoryRows = MANDATORY.map(m => {
      const present = comp.mandatory[m.id] !== false
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">${m.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:11px">${m.docRef}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:700;color:${present ? '#059669' : '#dc2626'}">${present ? '✓ Submitted' : '✗ Missing'}</td>
      </tr>`
    }).join('')

    const optionalRows = OPTIONAL.map(o => {
      const present = comp.optional[o.id] !== false
      return `<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9">${o.name}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:11px">${o.docRef}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #f1f5f9;font-weight:600;color:${present ? '#059669' : '#d97706'}">${present ? '✓ Submitted' : '— Not submitted'}</td>
      </tr>`
    }).join('')

    const mandatoryCount = MANDATORY.filter(m => comp.mandatory[m.id] !== false).length
    const optionalCount  = OPTIONAL.filter(o => comp.optional[o.id] !== false).length
    const statusLabel = mandatoryCount < 5 ? 'Non-Compliant' : optionalCount === 5 ? 'Compliant' : 'Partial Compliant'
    const statusColor = mandatoryCount < 5 ? '#dc2626' : optionalCount === 5 ? '#059669' : '#d97706'
    const statusBg    = mandatoryCount < 5 ? '#fee2e2' : optionalCount === 5 ? '#d1fae5' : '#fef3c7'

    const submittedDocs = MANDATORY.filter(m => comp.mandatory[m.id] !== false).map(m => `
      <div style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f1f5f9">
        <div style="width:36px;height:36px;border-radius:8px;background:#dbeafe;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:18px">📄</div>
        <div>
          <div style="font-size:12px;font-weight:600;color:#1e293b">${m.name}</div>
          <div style="font-size:10px;color:#94a3b8;margin-top:2px">${m.docRef} · ${m.docType}</div>
        </div>
      </div>`).join('')

    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${bidder.name} — Bidder Proposal</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px;color:#1e293b}
    table{width:100%;border-collapse:collapse;font-size:12px}
    th{text-align:left;padding:10px 12px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0}
    @media print{.no-print{display:none}body{background:white;padding:0}.page{box-shadow:none;border-radius:0}}
  </style>
</head>
<body>
  <div class="page" style="max-width:860px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
    <div style="background:linear-gradient(135deg,#1e3a8a,#2563eb);color:white;padding:40px 48px">
      <div style="display:flex;align-items:center;gap:14px;margin-bottom:20px">
        <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;font-weight:700;flex-shrink:0">${bidder.name[0]}</div>
        <div>
          <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px">Bidder Proposal Document</div>
          <div style="font-size:22px;font-weight:700">${bidder.name}</div>
        </div>
        <div style="margin-left:auto;background:${statusBg};color:${statusColor};border:1px solid ${statusColor}33;border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700">${statusLabel}</div>
      </div>
      <div style="display:flex;gap:32px;flex-wrap:wrap">
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Submission ID</div><div style="font-size:13px;font-weight:600">${submissionId}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Country</div><div style="font-size:13px;font-weight:600">${bidder.country}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Submission Date</div><div style="font-size:13px;font-weight:600">${submissionDate}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Tender</div><div style="font-size:13px;font-weight:600">ITT-2025-001</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Mandatory Docs</div><div style="font-size:13px;font-weight:600">${mandatoryCount}/5</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Optional Docs</div><div style="font-size:13px;font-weight:600">${optionalCount}/5</div></div>
      </div>
    </div>
    <div style="padding:40px 48px">
      <div style="margin-bottom:32px">
        <div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Mandatory Compliance Documents</div>
        <table><thead><tr><th>Document</th><th>Reference</th><th>Status</th></tr></thead><tbody>${mandatoryRows}</tbody></table>
      </div>
      <div style="margin-bottom:32px">
        <div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Optional Documents</div>
        <table><thead><tr><th>Document</th><th>Reference</th><th>Status</th></tr></thead><tbody>${optionalRows}</tbody></table>
      </div>
      <div style="margin-bottom:32px">
        <div style="font-size:12px;font-weight:700;color:#1e3a8a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Submitted Documents</div>
        <div style="background:#f8fafc;border-radius:10px;padding:16px 20px">${submittedDocs}</div>
      </div>
    </div>
  </div>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:24px;right:24px;background:#2563eb;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(37,99,235,.4)">⬇ Print / Save as PDF</button>
</body>
</html>`)
    win.document.close()
  }

  // ── Submit Evaluation page ──
  if (showSubmit && started) {
    const compliantList    = displayBidders.filter(b => getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT) === 'compliant')
    const nonCompliantList = displayBidders.filter(b => getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT) === 'non_compliant')
    const partialList      = displayBidders.filter(b => getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT) === 'partial_compliant')
    const canSubmit        = allFinalized // no partial, no pending

    return (
      <div className="space-y-5">
        {/* Back to evaluation */}
        <button onClick={() => setShowSubmit(false)}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors">
          <ArrowLeft size={14} /> Back to Compliance Review
        </button>

        {/* Header */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-6 flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center">
            <ClipboardCheck size={28} style={{ color: 'var(--color-primary)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">Evaluation Ready to Submit</h2>
            <p className="text-sm text-slate-600 mt-1 max-w-md">
              All {displayBidders.length} bidders have been evaluated. Review the summary below and submit to proceed to Commercial Evaluation.
            </p>
          </div>
          <div className="flex items-center gap-4 mt-1">
            {[
              { label: 'Compliant',     count: compliantList.length,    color: 'text-emerald-700 bg-emerald-100' },
              { label: 'Non-Compliant', count: nonCompliantList.length, color: 'text-red-700 bg-red-100' },
              { label: 'Pending',       count: partialList.length + pendingIds.size, color: 'text-amber-700 bg-amber-100' },
            ].map(s => (
              <div key={s.label} className={`flex flex-col items-center px-4 py-2 rounded-xl ${s.color}`}>
                <span className="text-xl font-bold">{s.count}</span>
                <span className="text-[11px] font-medium">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bidder summary */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center gap-2">
            <Users size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-700">Bidder Evaluation Summary</span>
          </div>
          <div className="divide-y divide-slate-100">
            {displayBidders.map(b => {
              const s = getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT)
              const cfg = STATUS_CFG[s]
              const { mandatory: mm, optional: mo } = getMissing(compliance[b.id] ?? FULLY_COMPLIANT)
              return (
                <div key={b.id} className="flex items-center justify-between px-5 py-3.5 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-xs flex items-center justify-center shrink-0">
                      {b.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                      <p className="text-[11px] text-slate-400">{b.country}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {(mm.length > 0 || mo.length > 0) && (
                      <span className="text-[11px] text-slate-500">{mm.length} mandatory · {mo.length} optional missing</span>
                    )}
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${cfg.justBg} ${cfg.justText} border ${cfg.justBorder}`}>
                      {cfg.label}
                    </span>
                  </div>
                </div>
              )
            })}
            {/* Bidders still pending POF re-upload */}
            {[...pendingIds].map(bid => {
              const b = tenderBidders.find(x => x.id === bid)
              if (!b) return null
              return (
                <div key={bid} className="flex items-center justify-between px-5 py-3.5 gap-4 bg-amber-50/60">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 font-bold text-xs flex items-center justify-center shrink-0">
                      {b.name?.[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{b.name}</p>
                      <p className="text-[11px] text-amber-600">Awaiting Contract Engineer re-upload</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                    Pending Re-upload
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Submit / warning */}
        {!canSubmit && (
          <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <AlertTriangle size={14} className="text-amber-500 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-700">
              Submit is disabled until all bidders are fully evaluated (Compliant or Non-Compliant).
              Resolve Partial Compliant statuses or pending re-uploads first.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            disabled={!canSubmit}
            onClick={() => { advanceTender(tenderId); navigate('/dashboard') }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all
              ${canSubmit
                ? 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-md shadow-blue-200'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
            <ClipboardCheck size={15} />
            Submit Technical Evaluation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5" onClick={() => statusDropdown && setStatusDropdown(null)}>
      {/* ── Source Proof Modal ── */}
      {proofModal && (
        <SourceProofModal
          metric={proofModal.metric}
          bidderName={proofModal.bidderName}
          onClose={() => setProofModal(null)}
        />
      )}

      {/* ── Page Header ── */}
      <Card className="p-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <button onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors">
                <ArrowLeft size={12} /> Dashboard
              </button>
              <span className="text-slate-300">/</span>
              <span className="text-xs font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">{tender.id}</span>
              <Badge variant="evaluation">Technical Evaluation</Badge>
            </div>
            <h3 className="font-semibold text-slate-800">{tender.title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {tender.department} · Deadline: {tender.deadline} · {displayBidders.length} bidders · 10 compliance metrics (5 mandatory + 5 optional)
            </p>
          </div>

          {/* Notification count */}
          {notifications.length > 0 && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-2 rounded-xl shrink-0">
              <Bell size={13} className="text-amber-500" />
              <span className="text-xs font-semibold text-amber-700">
                {notifications.length} Contract Engineer notification{notifications.length !== 1 ? 's' : ''} sent
              </span>
            </div>
          )}
        </div>
      </Card>

      {/* ── Tab Navigation ── */}
      <div className="flex gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        {[
          { id: 'compliance', label: 'Compliance Review' },
          { id: 'scoring',    label: 'Technical Scoring' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${activeTab === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'compliance' && (<>
      {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: 'Total Bidders',    value: displayBidders.length,              border: 'border-slate-200',  bg: 'bg-white',        text: 'text-slate-700' },
              { label: 'Compliant',        value: statCounts.compliant         || 0, border: 'border-emerald-200', bg: 'bg-emerald-50',  text: 'text-emerald-700' },
              { label: 'Partial Compliant',value: statCounts.partial_compliant || 0, border: 'border-amber-200',  bg: 'bg-amber-50',    text: 'text-amber-700' },
              { label: 'Non-Compliant',    value: statCounts.non_compliant     || 0, border: 'border-red-200',    bg: 'bg-red-50',      text: 'text-red-700' },
            ].map(s => (
              <div key={s.label} className={`rounded-2xl border ${s.border} ${s.bg} px-4 py-3 text-center`}>
                <div className={`text-2xl font-bold ${s.text}`}>{s.value}</div>
                <div className="text-xs text-slate-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Bidder accordion */}
          <div className="space-y-2.5">
            {displayBidders.map(bidder => {
              const comp       = compliance[bidder.id] ?? FULLY_COMPLIANT
              const status     = getEffectiveStatus(bidder.id, comp)
              const cfg        = STATUS_CFG[status]
              const { mandatory: mm, optional: mo } = getMissing(comp)
              const isOpen     = expandedBidder === bidder.id
              const isNotified = notifications.some(n => n.bidder.id === bidder.id)
              const canNotify  = status !== 'compliant'
              const isDropOpen = statusDropdown === bidder.id

              const mandatoryCount = MANDATORY.filter(m => comp.mandatory[m.id]).length
              const optionalCount  = OPTIONAL.filter(o => comp.optional[o.id]).length
              const submissionId   = `SUB-2025-00${40 + bidder.id}`
              const submissionDate = `2025-04-0${bidder.id}`

              return (
                <Card key={bidder.id}
                  className={`overflow-hidden transition-shadow ${isOpen ? 'shadow-md ring-2 ring-[var(--color-primary)]/15' : ''}`}>

                  {/* ── Row header (always visible) ── */}
                  <button
                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-slate-50/60 transition-colors"
                    onClick={() => setExpandedBidder(isOpen ? null : bidder.id)}>

                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 text-[var(--color-primary)] font-bold text-sm flex items-center justify-center shrink-0">
                      {bidder.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-800 text-sm">{bidder.name}</span>
                        <span className="text-xs text-slate-400">{bidder.country}</span>
                        {resolvedIds.has(bidder.id) && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 ring-1 ring-amber-300 flex items-center gap-1">
                            ↩ Docs Re-submitted — Review Updated
                          </span>
                        )}
                        {extractedIds.has(bidder.id) && (
                          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 flex items-center gap-1">
                            <Bot size={8} /> AI Extracted
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Hash size={10} /> {submissionId}
                        </span>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Calendar size={10} /> {submissionDate}
                        </span>
                      </div>
                    </div>

                    {/* Metric counts */}
                    <div className="hidden md:flex items-center gap-5 mr-2">
                      <div className="text-center">
                        <div className={`text-xs font-bold ${mandatoryCount === 5 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {mandatoryCount}/5
                        </div>
                        <div className="text-[10px] text-slate-400">Mandatory</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-xs font-bold ${optionalCount === 5 ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {optionalCount}/5
                        </div>
                        <div className="text-[10px] text-slate-400">Optional</div>
                      </div>
                    </div>

                    {/* Status dropdown + chevron */}
                    <div className="flex items-center gap-2 shrink-0">
                      {/* View Document button */}
                      <div onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => openBidderDocument(bidder)}
                          className="flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600 bg-white transition-colors">
                          <FileText size={10} /> View Doc
                        </button>
                      </div>
                      {/* Clickable status badge — opens status picker */}
                      <div className="relative" onClick={e => e.stopPropagation()}>
                        <button
                          onClick={() => setStatusDropdown(isDropOpen ? null : bidder.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all
                            ${cfg.badgeVariant === 'compliant'         ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100' : ''}
                            ${cfg.badgeVariant === 'partial_compliant' ? 'bg-amber-50  border-amber-200  text-amber-700  hover:bg-amber-100'  : ''}
                            ${cfg.badgeVariant === 'non_compliant'     ? 'bg-red-50    border-red-200    text-red-700    hover:bg-red-100'    : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                          <ChevronDown size={10} className={`transition-transform ${isDropOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isDropOpen && (
                          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-20 py-1 overflow-hidden">
                            {Object.entries(STATUS_CFG).map(([key, scfg]) => (
                              <button key={key}
                                onClick={() => {
                                  setStatusOverrides(prev => ({ ...prev, [bidder.id]: key }))
                                  setStatusDropdown(null)
                                }}
                                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-left transition-colors
                                  ${status === key ? 'bg-slate-50' : 'hover:bg-slate-50'}`}>
                                <span className={`w-2 h-2 rounded-full ${scfg.dot} shrink-0`} />
                                <span className="flex-1">{scfg.label}</span>
                                {status === key && <CheckCircle size={11} className="text-[var(--color-primary)] shrink-0" />}
                              </button>
                            ))}
                            {statusOverrides[bidder.id] && (
                              <>
                                <div className="mx-3 my-1 border-t border-slate-100" />
                                <button
                                  onClick={() => {
                                    setStatusOverrides(prev => { const n = { ...prev }; delete n[bidder.id]; return n })
                                    setStatusDropdown(null)
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors">
                                  <RotateCcw size={10} /> Reset to auto-derived
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      {isOpen
                        ? <ChevronUp size={15} className="text-slate-400" />
                        : <ChevronDown size={15} className="text-slate-400" />}
                    </div>
                  </button>

                  {/* ── Expanded content ── */}
                  {isOpen && (
                    <div className="border-t border-slate-100">

                      {/* AI Re-evaluation section for re-submitted docs */}
                      {resolvedIds.has(bidder.id) && (
                        <div className="px-5 py-3.5 border-b border-slate-100">
                          {reEvalState[bidder.id]?.done ? (
                            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                              <CheckCircle size={13} className="shrink-0" />
                              AI Re-evaluation complete — compliance matrix updated with re-submitted documents
                            </div>
                          ) : reEvalState[bidder.id]?.step >= 0 ? (
                            <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <Bot size={13} className="text-violet-600 animate-pulse shrink-0" />
                                <span className="text-xs font-bold text-violet-700">AI Re-evaluation in progress…</span>
                              </div>
                              <div className="space-y-1.5">
                                {RE_EVAL_STEPS.map((step, i) => (
                                  <div key={i} className={`flex items-center gap-2 text-xs transition-colors
                                    ${i < reEvalState[bidder.id].step ? 'text-emerald-600' :
                                      i === reEvalState[bidder.id].step ? 'text-violet-700 font-semibold' : 'text-slate-300'}`}>
                                    {i < reEvalState[bidder.id].step
                                      ? <CheckCircle size={10} className="shrink-0" />
                                      : <span className={`w-2 h-2 rounded-full shrink-0 ${i === reEvalState[bidder.id].step ? 'bg-violet-500 animate-pulse' : 'bg-slate-200'}`} />}
                                    {step}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 gap-4">
                              <div className="flex items-center gap-2.5">
                                <Bot size={14} className="text-amber-600 shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-amber-800">Re-submitted documents detected</p>
                                  <p className="text-[10px] text-amber-600 mt-0.5">Run AI re-evaluation to update compliance status with new uploads</p>
                                </div>
                              </div>
                              <button
                                onClick={() => startReEval(bidder.id)}
                                className="flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shrink-0">
                                <Bot size={12} /> Re-evaluate
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Justification banner */}
                      <div className={`px-5 py-3.5 border-b ${cfg.justBg} ${cfg.justBorder}`}>
                        <div className="flex items-start gap-2.5">
                          {status === 'compliant'
                            ? <CheckCircle size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                            : status === 'partial_compliant'
                              ? <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                              : <XCircle size={14} className="text-red-600 mt-0.5 shrink-0" />}
                          <div className="flex-1">
                            <p className={`text-xs leading-relaxed ${cfg.justText}`}>
                              {buildJustification(bidder.name, comp)}
                            </p>
                            {statusOverrides[bidder.id] && (
                              <p className="text-[10px] mt-1.5 font-semibold text-slate-500 flex items-center gap-1">
                                <RotateCcw size={9} /> Status manually set by evaluator · overrides AI-derived result
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Checklist grid */}
                      <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
                        {/* Mandatory */}
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-400" />
                            Mandatory Criteria (5)
                          </h4>
                          <div className="space-y-1.5">
                            {MANDATORY.map(metric => (
                              <MetricRow
                                key={metric.id}
                                metric={metric}
                                present={!!comp.mandatory[metric.id]}
                                kind="mandatory"
                                onViewProof={() => setProofModal({ metric, bidderName: bidder.name })}
                              />
                            ))}
                          </div>
                        </div>

                        {/* Optional */}
                        <div>
                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-400" />
                            Optional Criteria (5)
                          </h4>
                          <div className="space-y-1.5">
                            {OPTIONAL.map(metric => (
                              <MetricRow
                                key={metric.id}
                                metric={metric}
                                present={!!comp.optional[metric.id]}
                                kind="optional"
                                onViewProof={() => setProofModal({ metric, bidderName: bidder.name })}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action footer — only for non-compliant/partial */}
                      {canNotify && (
                        <div className="px-5 pb-5">
                          <div className={`flex items-center justify-between rounded-xl px-4 py-3 border
                            ${isNotified ? 'bg-slate-50 border-slate-200' : 'bg-amber-50 border-amber-200'}`}>
                            <div className="flex items-center gap-2 text-xs">
                              {isNotified
                                ? <><CheckCircle size={12} className="text-emerald-500" /><span className="text-slate-500">Correction request sent to Contract Engineer. Awaiting re-upload.</span></>
                                : <><AlertTriangle size={12} className="text-amber-500" /><span className="text-amber-700">{mm.length + mo.length} document{mm.length + mo.length !== 1 ? 's' : ''} require vendor attention.</span></>}
                            </div>
                            <button
                              disabled={isNotified}
                              onClick={() => handleNotifyPOF(bidder)}
                              className={`flex items-center gap-1.5 text-xs font-semibold px-4 py-2 rounded-lg transition-all shrink-0
                                ${isNotified
                                  ? 'bg-slate-200 text-slate-400 cursor-default'
                                  : 'bg-amber-500 hover:bg-amber-600 text-white'}`}>
                              {isNotified
                                ? <><RotateCcw size={11} /> Notified</>
                                : <><Bell size={11} /> Notify Contract Engineer to Re-upload</>}
                            </button>
                          </div>
                        </div>
                      )}
                      {/* ── Evaluator Notes / Chat ── */}
                      <div className="px-5 pb-5">
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
                            <Bot size={12} style={{ color: 'var(--color-primary)' }} />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Evaluator Notes</span>
                          </div>
                          {/* Previous notes */}
                          {(evalNotes[bidder.id] || []).length > 0 && (
                            <div className="px-4 py-3 space-y-2 max-h-40 overflow-y-auto">
                              {(evalNotes[bidder.id] || []).map((note, i) => (
                                <div key={i} className="bg-[var(--color-primary)]/8 rounded-xl px-3 py-2">
                                  <p className="text-xs text-slate-700 leading-relaxed">{note.text}</p>
                                  <p className="text-[10px] text-slate-400 mt-1">{user?.name} · {note.ts}</p>
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Input */}
                          <div className="px-4 py-3 flex items-end gap-2">
                            <textarea
                              rows={2}
                              value={noteInput[bidder.id] || ''}
                              onChange={e => setNoteInput(prev => ({ ...prev, [bidder.id]: e.target.value }))}
                              placeholder="Write your evaluation notes, suggestions, or re-upload requirements…"
                              className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 text-slate-700 placeholder-slate-400"
                            />
                            <button
                              disabled={!noteInput[bidder.id]?.trim()}
                              onClick={() => {
                                const text = noteInput[bidder.id]?.trim()
                                if (!text) return
                                const ts = new Date().toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                                setEvalNotes(prev => ({ ...prev, [bidder.id]: [...(prev[bidder.id] || []), { text, ts }] }))
                                setNoteInput(prev => ({ ...prev, [bidder.id]: '' }))
                              }}
                              className={`flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-lg transition-all shrink-0
                                ${noteInput[bidder.id]?.trim()
                                  ? 'bg-[var(--color-primary)] text-white hover:opacity-90'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            >
                              <Send size={11} /> Submit
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Compliance complete — proceed to scoring */}
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Compliance Review</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {allFinalized
                    ? 'All compliance statuses finalised. Proceed to Technical Scoring.'
                    : 'Resolve all Partial Compliant statuses before proceeding.'}
                </p>
              </div>
              <button
                disabled={!allFinalized}
                onClick={() => setActiveTab('scoring')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all
                  ${allFinalized
                    ? 'bg-[var(--color-primary)] text-white hover:opacity-90 shadow-md'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                Technical Scoring →
              </button>
            </div>
            {!allFinalized && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={12} />
                All bidders must be <strong className="mx-1">Compliant</strong> or <strong className="mx-1">Non-Compliant</strong> before proceeding to scoring.
              </div>
            )}
          </Card>
      </>)}

      {activeTab === 'scoring' && (<>
        {!aiScored && !aiScoring && (
          <div className="flex items-center gap-2.5 px-4 py-3 bg-blue-50 border border-blue-200 rounded-xl animate-pulse">
            <Bot size={14} className="text-blue-500" />
            <span className="text-xs text-blue-700 font-medium">AI is initialising technical scoring…</span>
          </div>
        )}
        {aiScoring && (() => {
          const steps = ['Preparing analysis of bidder submissions…', ...techCriteria.map(c => `Evaluating: ${c.criterion}…`), 'Compiling weighted scores…']
          return (
            <Card className="overflow-hidden border border-blue-100">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3 flex items-center gap-2">
                <Bot size={14} className="text-white" />
                <p className="text-xs font-semibold text-white">AI Technical Scoring in Progress…</p>
                <div className="ml-auto w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              </div>
              <div className="p-4 space-y-2">
                {steps.map((step, i) => (
                  <div key={i} className={`flex items-center gap-2.5 py-0.5 transition-all ${i > aiScoreStep ? 'opacity-20' : 'opacity-100'}`}>
                    {i < aiScoreStep
                      ? <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      : i === aiScoreStep
                        ? <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin shrink-0" />
                        : <div className="w-3.5 h-3.5 rounded-full border border-slate-200 shrink-0" />
                    }
                    <span className={`text-xs ${i < aiScoreStep ? 'text-slate-400 line-through' : i === aiScoreStep ? 'text-slate-800 font-semibold' : 'text-slate-300'}`}>{step}</span>
                  </div>
                ))}
              </div>
            </Card>
          )
        })()}
        {aiScored && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-xl">
            <Bot size={14} className="text-blue-600 shrink-0" />
            <span className="text-xs text-blue-800"><strong>AI-generated scores applied.</strong> Review and adjust individual scores below if needed before submitting.</span>
            <button onClick={() => { setAiScored(false); setAiModified({}); setTechScores({}) }}
              className="ml-auto shrink-0 text-[10px] font-semibold text-blue-600 hover:text-blue-800 underline whitespace-nowrap">
              Re-analyse
            </button>
          </div>
        )}
        {/* Technical Scoring Table */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Technical Evaluation Criteria</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Score 0–3 per criterion · 0 Unacceptable · 1 Marginal · 2 Acceptable · 3 Excellent</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <BarChart3 size={12} /> Weighted scoring
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 min-w-52">Criterion</th>
                  <th className="text-center px-3 py-3 text-xs font-semibold text-slate-500 w-16">Weight</th>
                  {displayBidders.map(b => {
                    const bStatus = getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT)
                    return (
                      <th key={b.id} className="text-center px-3 py-3 text-xs font-semibold text-slate-500 min-w-32">
                        <div>{b.name.split(' ')[0]}</div>
                        {bStatus === 'non_compliant' && (
                          <span className="block text-[9px] font-medium text-red-400 mt-0.5">Eliminated</span>
                        )}
                      </th>
                    )
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {techCriteria.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{c.criterion}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{c.weight}%</span>
                    </td>
                    {displayBidders.map(b => {
                      const scoreKey = `${b.id}-${c.id}`
                      const val = techScores[scoreKey]
                      const hasVal = val !== undefined && val !== ''
                      const scoreComp = hasVal ? getScoreCompliance(Number(val)) : null
                      const bStatus = getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT)
                      return (
                        <td key={b.id} className="px-3 py-3 text-center">
                          {bStatus === 'non_compliant' ? (
                            <span className="text-xs text-slate-200">—</span>
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              <div className="relative">
                                <input
                                  type="number" min={0} max={3} step={1}
                                  value={val ?? ''}
                                  placeholder="—"
                                  onChange={e => {
                                    setTechScore(b.id, c.id, e.target.value)
                                    if (aiScored) setAiModified(prev => ({ ...prev, [scoreKey]: true }))
                                  }}
                                  className={`w-16 text-center text-sm font-semibold rounded-lg py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 placeholder:text-slate-300 ${
                                    aiScored && !aiModified[scoreKey] && hasVal
                                      ? 'border-2 border-blue-300 bg-blue-50/40'
                                      : 'border border-slate-200'
                                  }`}
                                />
                                {aiScored && !aiModified[scoreKey] && hasVal && (
                                  <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center text-white">
                                    <Bot size={8} />
                                  </div>
                                )}
                              </div>
                              {aiScored && aiModified[scoreKey] && (
                                <span className="text-[9px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-full">Modified</span>
                              )}
                              {hasVal && scoreComp && (
                                <Badge variant={scoreComp.variant} className="text-[9px] px-1.5 py-0">{scoreComp.label}</Badge>
                              )}
                            </div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-200">
                  <td colSpan={2} className="px-4 py-3 text-xs font-bold text-slate-600 uppercase">Weighted Total</td>
                  {displayBidders.map(b => {
                    const scored = hasTechScores(b.id)
                    const score = techTotalFor(b.id)
                    const scoreComp = getScoreCompliance(score)
                    const bStatus = getEffectiveStatus(b.id, compliance[b.id] ?? FULLY_COMPLIANT)
                    return (
                      <td key={b.id} className="px-3 py-3 text-center">
                        {bStatus === 'non_compliant' ? (
                          <span className="text-xs text-slate-400 italic">Eliminated</span>
                        ) : scored ? (
                          <>
                            <span className={`text-base font-bold block mb-1 ${score >= 2 ? 'text-green-600' : score >= 1 ? 'text-amber-600' : 'text-red-500'}`}>
                              {score.toFixed(2)}
                            </span>
                            <Badge variant={scoreComp.variant}>{scoreComp.label}</Badge>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300">—</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>

        {/* Submit / Export */}
        {!submitted ? (
          <Card className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Finalise Technical Evaluation</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {allTechScored
                    ? 'All criteria scored. Submit to generate the evaluation report.'
                    : `Score all ${eligibleBidders.length} eligible bidder${eligibleBidders.length !== 1 ? 's' : ''} across all ${techCriteria.length} criteria.`}
                </p>
              </div>
              <Button size="sm" disabled={!allTechScored}
                onClick={() => { advanceTender(tenderId); setSubmitted(true) }}>
                <Send size={13} /> Submit & Export Report
              </Button>
            </div>
            {!allTechScored && (
              <div className="mt-3 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle size={12} />
                Score all {eligibleBidders.length} eligible bidder{eligibleBidders.length !== 1 ? 's' : ''} across all {techCriteria.length} criteria before submitting.
              </div>
            )}
          </Card>
        ) : (
          <Card className="p-5 space-y-3">
            <div className="flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
              <CheckCircle size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">Technical Evaluation Submitted</p>
                <p className="text-xs text-emerald-700 mt-0.5">
                  Download the evaluation report and hand it to the <strong>Contract Engineer</strong> for upload to unlock Commercial Evaluation.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-orange-700 bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
              <Clock size={13} className="shrink-0" />
              <span>Tender is now <strong className="mx-1">Awaiting Contract Engineer Upload</strong> — the Contract Engineer must upload this report to advance to Commercial Evaluation.</span>
            </div>
            <Button className="w-full justify-center" onClick={() => {
              const win = window.open('', '_blank')
              if (!win) return
              const rows = eligibleBidders.map(b => {
                const total = techTotalFor(b)
                const sc = getScoreCompliance(total)
                const cols = techCriteria.map(c => {
                  const v = techScores[`${b.id}-${c.id}`]
                  return `<td style="text-align:center;padding:8px 10px;border-bottom:1px solid #f1f5f9">${v ?? '—'}</td>`
                }).join('')
                return `<tr>
                  <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;font-weight:600">${b.name}</td>
                  <td style="padding:8px 12px;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:11px">${b.country}</td>
                  ${cols}
                  <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:700;color:${total>=2?'#059669':total>=1?'#d97706':'#dc2626'}">${total.toFixed(2)}</td>
                  <td style="text-align:center;padding:8px 10px;border-bottom:1px solid #f1f5f9;font-weight:600;font-size:11px;color:${sc.variant==='compliant'?'#059669':sc.variant==='partial_compliant'?'#d97706':'#dc2626'}">${sc.label}</td>
                </tr>`
              }).join('')
              const criterionHeaders = techCriteria.map(c =>
                `<th style="text-align:center;padding:8px 10px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">${c.criterion}<br><span style="font-size:9px;color:#94a3b8">${c.weight}%</span></th>`
              ).join('')
              win.document.write(`<!DOCTYPE html>
<html lang="en"><head>
  <meta charset="UTF-8">
  <title>Tech-Eval-Report-${tenderId}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Segoe UI',Arial,sans-serif;background:#f1f5f9;padding:32px;color:#1e293b}table{width:100%;border-collapse:collapse;font-size:12px}@media print{.no-print{display:none}body{background:white;padding:0}.page{box-shadow:none;border-radius:0}}</style>
</head><body>
  <div class="page" style="max-width:960px;margin:0 auto;background:white;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.10)">
    <div style="background:linear-gradient(135deg,#1b4c6f,#0089cf);color:white;padding:40px 48px">
      <div style="font-size:10px;opacity:.7;text-transform:uppercase;letter-spacing:1px;margin-bottom:6px">Technical Evaluation Report</div>
      <div style="font-size:22px;font-weight:700;margin-bottom:4px">${tender.title}</div>
      <div style="font-size:13px;opacity:.8">${tender.id} · ${tender.department} · Generated ${new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})}</div>
      <div style="display:flex;gap:24px;margin-top:20px;flex-wrap:wrap">
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Total Bidders</div><div style="font-size:16px;font-weight:700">${displayBidders.length}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Eligible</div><div style="font-size:16px;font-weight:700">${eligibleBidders.length}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Criteria</div><div style="font-size:16px;font-weight:700">${techCriteria.length}</div></div>
        <div><div style="font-size:10px;opacity:.6;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px">Evaluator</div><div style="font-size:16px;font-weight:700">${user?.name || 'Technical Evaluator'}</div></div>
      </div>
    </div>
    <div style="padding:40px 48px">
      <div style="font-size:12px;font-weight:700;color:#1b4c6f;text-transform:uppercase;letter-spacing:.5px;margin-bottom:14px;padding-bottom:8px;border-bottom:2px solid #e2e8f0">Technical Scoring Matrix</div>
      <div style="overflow-x:auto">
        <table>
          <thead><tr>
            <th style="text-align:left;padding:8px 12px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Bidder</th>
            <th style="text-align:left;padding:8px 12px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Country</th>
            ${criterionHeaders}
            <th style="text-align:center;padding:8px 10px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Weighted Total</th>
            <th style="text-align:center;padding:8px 10px;background:#f8fafc;color:#475569;font-size:10px;text-transform:uppercase;letter-spacing:.5px;border-bottom:2px solid #e2e8f0">Result</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>
  </div>
  <button class="no-print" onclick="window.print()" style="position:fixed;bottom:24px;right:24px;background:#0089cf;color:white;border:none;padding:12px 20px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;box-shadow:0 4px 12px rgba(0,137,207,.4)">⬇ Print / Save as PDF</button>
</body></html>`)
              win.document.close()
            }}>
              <Download size={14} /> Download Technical Evaluation Report
            </Button>
          </Card>
        )}
      </>)}
    </div>
  )
}
