import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import {
  FileText, ShieldAlert, DollarSign, BarChart2, CheckSquare,
  ArrowRight, ArrowLeft, Layout, CheckCircle, X, Plus, Trash2,
  ChevronRight, AlertTriangle, Users, Download, Bot,
  Sparkles, Edit3, ChevronDown, FileSpreadsheet, ExternalLink, ClipboardList
} from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import AiEditableTextarea from '../components/ui/AiEditableTextarea'
import AiAnalysisLoader from '../components/ui/AiAnalysisLoader'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { exportTemplateExcel, exportPreQualSummaryExcel } from '../utils/exportExcel'
import { tenderRef } from '../utils/tenderRef'

/* ─── Form field definitions for each template ─── */

const COMPANY_ESTIMATE_FIELDS = [
  { id: 'itemDescription', label: 'Item / Service Description', type: 'text', placeholder: 'e.g. Supply of Gas Turbine Filters', span: 2 },
  { id: 'quantity', label: 'Quantity', type: 'number', placeholder: 'e.g. 10' },
  { id: 'unit', label: 'Unit of Measure', type: 'select', options: ['Each', 'Lot', 'Set', 'Meter', 'Kg', 'Hours', 'Days', 'Lump Sum'] },
  { id: 'unitRate', label: 'Estimated Unit Rate', type: 'number', placeholder: 'e.g. 5000' },
  { id: 'totalEstimate', label: 'Total Estimate', type: 'computed', compute: (row) => ((row.quantity || 0) * (row.unitRate || 0)).toLocaleString('en-US') },
  { id: 'contingency', label: 'Contingency %', type: 'number', placeholder: 'e.g. 10' },
  { id: 'remarks', label: 'Remarks / Assumptions', type: 'text', placeholder: 'Any assumptions or notes', span: 2 },
]

const CONTRACT_RISK_FIELDS = [
  { id: 'riskCategory', label: 'Risk Category', type: 'select', options: ['Commercial', 'Operational', 'Financial', 'Legal', 'Schedule', 'QHSSE', 'Technical', 'Reputational'] },
  { id: 'riskDescription', label: 'Risk Description', type: 'text', placeholder: 'Describe the identified risk', span: 2 },
  { id: 'likelihood', label: 'Likelihood', type: 'select', options: ['Very Low', 'Low', 'Medium', 'High', 'Very High'] },
  { id: 'impact', label: 'Impact', type: 'select', options: ['Negligible', 'Minor', 'Moderate', 'Major', 'Critical'] },
  { id: 'riskRating', label: 'Risk Rating', type: 'computed', compute: (row) => {
    const l = ['Very Low','Low','Medium','High','Very High'].indexOf(row.likelihood)+1
    const i = ['Negligible','Minor','Moderate','Major','Critical'].indexOf(row.impact)+1
    const score = l * i
    if (score <= 4) return 'Low'
    if (score <= 9) return 'Medium'
    if (score <= 16) return 'High'
    return 'Critical'
  }},
  { id: 'mitigation', label: 'Mitigation / Control Measure', type: 'text', placeholder: 'How to mitigate this risk', span: 2 },
  { id: 'owner', label: 'Risk Owner', type: 'text', placeholder: 'e.g. Contract Holder' },
]

// Categories follow Section H — In Country Value Requirements, part B.3
// ("Instructions to prepare ICV Plan").
const ICV_FIELDS = [
  { id: 'icvCategory', label: 'ICV Category', type: 'select', options: [
    'Investment in Fixed Assets in Oman',
    'Omanisation in the Workforce',
    'Local Sourcing of Goods',
    'Local Sourcing of Subcontracted Services',
  ]},
  { id: 'description', label: 'Description / Commitment', type: 'text', placeholder: 'e.g. Local fabrication of spool pieces at Sohar facility', span: 2 },
  { id: 'plannedSpend', label: 'Planned Contract Spend', type: 'number', placeholder: 'e.g. 500000' },
  { id: 'icvSpend', label: 'In-Country Spend', type: 'number', placeholder: 'e.g. 350000' },
  { id: 'icvPercent', label: 'ICV %', type: 'computed', compute: (row) => {
    if (!row.plannedSpend || !row.icvSpend) return '—'
    return ((row.icvSpend / row.plannedSpend) * 100).toFixed(1) + '%'
  }},
  { id: 'targetPercent', label: 'Target ICV %', type: 'number', placeholder: 'e.g. 40' },
  { id: 'icvStatus', label: 'Against Target', type: 'computed', compute: (row) => {
    if (!row.plannedSpend || !row.icvSpend || !row.targetPercent) return '—'
    const actual = (row.icvSpend / row.plannedSpend) * 100
    const diff = actual - Number(row.targetPercent)
    if (diff >= 0) return `Meets target (+${diff.toFixed(1)}%)`
    return `Below target (${diff.toFixed(1)}%)`
  }},
  { id: 'omaniHeadcount', label: 'Omani Headcount Committed', type: 'number', placeholder: 'e.g. 12' },
  { id: 'evidence', label: 'Evidence / Verification Basis', type: 'text', placeholder: 'e.g. Certificate of Omani origin, MOL records', span: 2 },
]

// Mirrors "Appendix I — Technical Evaluation Model Template": criteria grouped
// into three parts, each a Must or a Want, weighted, with a 0–3 scoring band.
// Musts carry a minimum score; Wants do not.
const TECHNICAL_EVAL_MATRIX_FIELDS = [
  { id: 'part', label: 'Part', type: 'select', options: [
    'Part 1: QHSE',
    'Part 2: Contract-Specific',
    'Part 3: Contract-Generic',
  ]},
  { id: 'criteriaType', label: 'Must / Want', type: 'select', options: ['Must', 'Want'] },
  { id: 'criterion', label: 'Criterion', type: 'text', placeholder: 'e.g. Methodology Statement — manner and sequence of executing the Work', span: 2 },
  { id: 'weight', label: 'Weight', type: 'number', placeholder: 'e.g. 10' },
  { id: 'minScore', label: 'Min. Score (Musts only)', type: 'number', placeholder: 'e.g. 2' },
  { id: 'band1', label: 'Score 1 — Description', type: 'text', placeholder: 'e.g. Submission shows lack of understanding of Work', span: 2 },
  { id: 'band2', label: 'Score 2 — Description', type: 'text', placeholder: 'e.g. Submission shows a competent understanding of Work', span: 2 },
  { id: 'band3', label: 'Score 3 — Description', type: 'text', placeholder: 'e.g. Submission shows a detailed understanding of Work', span: 2 },
  { id: 'maxWeighted', label: 'Max Weighted Score', type: 'computed', compute: (row) => {
    if (!row.weight) return '—'
    return (Number(row.weight) * 3).toString()
  }},
  { id: 'gate', label: 'Gate', type: 'computed', compute: (row) => {
    if (row.criteriaType === 'Must') return row.minScore ? `Must — min ${row.minScore}` : 'Must — set min score'
    if (row.criteriaType === 'Want') return 'Want — no minimum'
    return '—'
  }},
]

const HSE_RISK_FIELDS = [
  { id: 'hazard', label: 'Hazard Identification', type: 'text', placeholder: 'Describe the hazard', span: 2 },
  { id: 'activity', label: 'Associated Activity', type: 'text', placeholder: 'e.g. Welding at Height' },
  { id: 'consequence', label: 'Potential Consequence', type: 'select', options: ['Near Miss', 'First Aid', 'Medical Treatment', 'Lost Time Injury', 'Permanent Disability', 'Fatality'] },
  { id: 'existingControls', label: 'Existing Controls', type: 'text', placeholder: 'Current safety measures', span: 2 },
  { id: 'residualLikelihood', label: 'Residual Likelihood', type: 'select', options: ['Rare', 'Unlikely', 'Possible', 'Likely', 'Almost Certain'] },
  { id: 'residualSeverity', label: 'Residual Severity', type: 'select', options: ['Insignificant', 'Minor', 'Moderate', 'Major', 'Catastrophic'] },
  { id: 'residualRisk', label: 'Residual Risk Level', type: 'computed', compute: (row) => {
    const l = ['Rare','Unlikely','Possible','Likely','Almost Certain'].indexOf(row.residualLikelihood)+1
    const s = ['Insignificant','Minor','Moderate','Major','Catastrophic'].indexOf(row.residualSeverity)+1
    const score = l * s
    if (score <= 4) return 'Low'
    if (score <= 9) return 'Medium'
    if (score <= 16) return 'High'
    return 'Extreme'
  }},
  { id: 'additionalControls', label: 'Additional Controls Required', type: 'text', placeholder: 'Extra measures to reduce risk', span: 2 },
]

const NEGOTIATION_STRATEGY_FIELDS = [
  { id: 'theme', label: 'Theme', type: 'select', options: ['Specification', 'Quality', 'HSE', 'Lead Time', 'T&Cs', 'Liquidated Damages', 'Demand', 'Spare Part Quantity', 'Cost Price', 'Payments', 'ICV', 'Job Seekers / Omanization', 'Training & Interns', 'Other initiatives'] },
  { id: 'negotiationPoints', label: 'Negotiation Points', type: 'text', placeholder: 'Describe the points of negotiation', span: 2 },
  { id: 'aspiration', label: 'Aspiration', type: 'text', placeholder: 'Best possible outcome' },
  { id: 'target', label: 'Target', type: 'text', placeholder: 'Realistic target' },
  { id: 'walkAway', label: 'Walk-Away', type: 'text', placeholder: 'Minimum acceptable outcome' },
  { id: 'finalAchievement', label: 'Final Negotiation Achievement', type: 'text', placeholder: 'Actual outcome (updated post-negotiation)' },
]

/* ─── Template definitions ─── */

export const TEMPLATE_DEFS = [
  {
    id: 'company-estimate',
    title: 'Company Estimate',
    description: 'Estimate project costs, quantities, unit rates, and contingencies.',
    icon: DollarSign,
    color: '#0089cf',
    fields: COMPANY_ESTIMATE_FIELDS,
    dataKey: 'companyEstimate',
    rowLabel: 'Line Item',
    fileUrl: '/templates/COMPANY ESTIMATE (1).xlsx',
    fileType: 'excel',
  },
  {
    id: 'contract-risk',
    title: 'Contract Risk Assessment',
    description: 'Identify, evaluate and plan mitigations for contract risks.',
    icon: ShieldAlert,
    color: '#0089cf',
    fields: CONTRACT_RISK_FIELDS,
    dataKey: 'contractRiskAssessment',
    rowLabel: 'Risk',
    fileUrl: '/templates/Contract Risk Assessment.xlsx',
    fileType: 'excel',
  },
  {
    id: 'icv',
    title: 'ICV',
    description: 'Plan In-Country Value: local sourcing, Omanisation and in-Oman investment.',
    icon: BarChart2,
    color: '#0089cf',
    fields: ICV_FIELDS,
    dataKey: 'icvPlan',
    rowLabel: 'ICV Commitment',
    fileType: 'excel',
  },
  {
    id: 'technical-eval-matrix',
    title: 'Technical Evaluation Matrix',
    description: 'Define weighted Must/Want criteria and scoring bands for technical evaluation.',
    icon: ClipboardList,
    color: '#0089cf',
    fields: TECHNICAL_EVAL_MATRIX_FIELDS,
    dataKey: 'technicalEvalMatrix',
    rowLabel: 'Criterion',
    fileUrl: '/templates/Appendix I - Technical Evaluation Model Template.xls',
    fileType: 'excel',
  },
  {
    id: 'hse-risk',
    title: 'HSE Risk Assessment',
    description: 'Identify hazards and assess HSE risks with control measures.',
    icon: CheckSquare,
    color: '#0089cf',
    fields: HSE_RISK_FIELDS,
    dataKey: 'hseRiskAssessment',
    rowLabel: 'Hazard',
    fileUrl: '/templates/HSE Risk Assessment.xlsx',
    fileType: 'excel',
  },
  {
    id: 'negotiation-strategy',
    title: 'Negotiation Strategy',
    description: 'Plan aspirations, targets, and walk-away points for negotiations.',
    icon: Users,
    color: '#0089cf',
    fields: NEGOTIATION_STRATEGY_FIELDS,
    dataKey: 'negotiationStrategy',
    rowLabel: 'Negotiation Theme',
    fileType: 'word', // rendered as a generated Word document (no source file)
  },
]

/* ─── AI Prefill Data Generator ─── */

const AI_ANALYSIS_TASKS = [
  'Analysing tender requirements & scope',
  'Extracting key data points from contract details',
  'Cross-referencing industry benchmarks',
  'Generating recommended values',
  'Preparing AI suggestions for review',
]

function generateAiPrefill(templateId, tender) {
  const title = tender?.title || 'Contract Project'
  const budget = tender?.budget || ''

  switch (templateId) {
    case 'company-estimate':
      return [
        {
          itemDescription: `Primary equipment supply for ${title}`,
          quantity: '5',
          unit: 'Each',
          unitRate: '12000',
          contingency: '10',
          remarks: 'AI Suggested — Based on similar contract benchmarks and market analysis',
        },
        {
          itemDescription: `Installation & commissioning services`,
          quantity: '1',
          unit: 'Lump Sum',
          unitRate: '35000',
          contingency: '15',
          remarks: 'AI Suggested — Includes mobilisation, testing and handover',
        },
        {
          itemDescription: `Technical supervision & quality assurance`,
          quantity: '120',
          unit: 'Days',
          unitRate: '450',
          contingency: '5',
          remarks: 'AI Suggested — Based on estimated project duration',
        },
      ]

    case 'contract-risk':
      return [
        {
          riskCategory: 'Schedule',
          riskDescription: `Delay in delivery of critical materials for ${title} due to supply chain disruptions`,
          likelihood: 'Medium',
          impact: 'Major',
          mitigation: 'Establish alternative supplier list; include liquidated damages clause; early procurement of long-lead items',
          owner: 'Contract Holder',
        },
        {
          riskCategory: 'Commercial',
          riskDescription: 'Price escalation due to market volatility affecting project budget',
          likelihood: 'High',
          impact: 'Moderate',
          mitigation: 'Include price adjustment mechanism; fix prices for critical items; maintain contingency reserve',
          owner: 'Commercial Manager',
        },
        {
          riskCategory: 'QHSSE',
          riskDescription: 'Non-compliance with Oman LNG safety standards during execution',
          likelihood: 'Low',
          impact: 'Critical',
          mitigation: 'Mandatory QHSSE induction for all personnel; regular safety audits; stop-work authority for safety violations',
          owner: 'QHSSE Manager',
        },
      ]

    case 'icv':
      return [
        {
          icvCategory: 'Local Sourcing of Goods',
          description: 'AI Suggested — Procure consumables and spares from Omani-registered suppliers holding Certificates of Omani Origin',
          plannedSpend: '450000',
          icvSpend: '288000',
          targetPercent: '60',
          omaniHeadcount: '',
          evidence: 'Certificate of Omani Origin per purchase order; supplier CR verification',
        },
        {
          icvCategory: 'Omanisation in the Workforce',
          description: 'AI Suggested — Omani nationals in supervisory and technical positions per Appendix G position list',
          plannedSpend: '320000',
          icvSpend: '208000',
          targetPercent: '55',
          omaniHeadcount: '14',
          evidence: 'Ministry of Labour records and monthly payroll returns',
        },
        {
          icvCategory: 'Local Sourcing of Subcontracted Services',
          description: 'AI Suggested — Subcontract inspection and calibration scope to Oman-based service providers',
          plannedSpend: '180000',
          icvSpend: '90000',
          targetPercent: '50',
          omaniHeadcount: '',
          evidence: 'Subcontract award records; quarterly ICV reporting template (Appendix D)',
        },
      ]

    case 'technical-eval-matrix':
      return [
        {
          part: 'Part 1: QHSE',
          criteriaType: 'Must',
          criterion: 'AI Suggested — Contractor HSE Capability Assessment: response to the HSE Capability Questionnaire',
          weight: '20',
          minScore: '2',
          band1: 'Red banded',
          band2: 'Amber banded',
          band3: 'Green banded',
        },
        {
          part: 'Part 2: Contract-Specific',
          criteriaType: 'Must',
          criterion: 'AI Suggested — Methodology Statement: manner and sequence of carrying out the required Work/Services',
          weight: '10',
          minScore: '2',
          band1: 'Submission shows lack of understanding of Work',
          band2: 'Submission shows a competent understanding of Work',
          band3: 'Submission shows a detailed understanding of Work',
        },
        {
          part: 'Part 2: Contract-Specific',
          criteriaType: 'Must',
          criterion: 'AI Suggested — Omanisation Plan: compliance with Labour Law and contract requirements, including staff development and training',
          weight: '15',
          minScore: '2',
          band1: 'Submission complies with Labour Law',
          band2: 'Submission proposes an alternate equivalent plan',
          band3: 'Submission meets or exceeds requirements',
        },
        {
          part: 'Part 3: Contract-Generic',
          criteriaType: 'Want',
          criterion: 'AI Suggested — Proposed Organisational Structure: decision-making process, roles and responsibilities, management competency',
          weight: '2',
          minScore: '',
          band1: 'Submission includes simple outline',
          band2: 'Submission meets requirements',
          band3: 'Submission includes clear, concise and detailed information',
        },
      ]

    case 'hse-risk':
      return [
        {
          hazard: 'Working at height during installation and maintenance activities',
          activity: 'Equipment Installation at Elevated Platforms',
          consequence: 'Lost Time Injury',
          existingControls: 'Fall arrest systems, safety harnesses, scaffolding with guardrails, PTW system',
          residualLikelihood: 'Unlikely',
          residualSeverity: 'Major',
          additionalControls: 'AI Suggested — Implement buddy system; mandatory tool-tethering; enhanced pre-task risk assessment',
        },
        {
          hazard: 'Exposure to hazardous chemicals and substances',
          activity: 'Chemical Handling & Storage Operations',
          consequence: 'Medical Treatment',
          existingControls: 'MSDS availability, PPE provisions, chemical storage protocols, spill containment kits',
          residualLikelihood: 'Rare',
          residualSeverity: 'Moderate',
          additionalControls: 'AI Suggested — Quarterly chemical handling refresher training; enhanced ventilation monitoring',
        },
        {
          hazard: 'Heavy lifting and crane operations near live equipment',
          activity: 'Mechanical Lifting Operations',
          consequence: 'Permanent Disability',
          existingControls: 'Certified crane operators, lift plans, exclusion zones, banksman requirement',
          residualLikelihood: 'Unlikely',
          residualSeverity: 'Catastrophic',
          additionalControls: 'AI Suggested — Independent lift plan review; real-time load monitoring system; enhanced exclusion zone marking',
        },
      ]

    case 'negotiation-strategy':
      return [
        {
          theme: 'Cost Price',
          negotiationPoints: `Overall contract pricing for ${title} appears above the internal estimate; seek reduction through volume commitment and scope optimisation`,
          aspiration: '12% reduction from submitted price',
          target: '7% reduction from submitted price',
          walkAway: 'Price at or below approved budget of ' + (budget || 'internal estimate'),
          finalAchievement: 'AI Suggested — To be updated post-negotiation',
        },
        {
          theme: 'Liquidated Damages',
          negotiationPoints: 'Agree LD rate and cap for delayed delivery to protect Oman LNG against schedule slippage',
          aspiration: '1.0% per week, capped at 15% of contract value',
          target: '0.5% per week, capped at 10% of contract value',
          walkAway: 'Minimum 0.5% per week with a 5% cap',
          finalAchievement: 'AI Suggested — To be updated post-negotiation',
        },
        {
          theme: 'Payments',
          negotiationPoints: 'Improve cash-flow terms and reduce advance payment exposure',
          aspiration: 'No advance payment; 60-day payment terms',
          target: 'Max 10% advance against bank guarantee; 45-day terms',
          walkAway: 'Max 15% advance against bank guarantee; 30-day terms',
          finalAchievement: 'AI Suggested — To be updated post-negotiation',
        },
      ]

    default:
      return []
  }
}

/* ─── Template Download Utility ─── */

function generateTemplateDownloadContent(template, rows, tender) {
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
  let text = ''

  text += `${'═'.repeat(60)}\n`
  text += `  ${template.title.toUpperCase()}\n`
  text += `${'═'.repeat(60)}\n\n`
  text += `Tender Reference: ${tender?.id || 'N/A'}\n`
  text += `Tender Title: ${tender?.title || 'N/A'}\n`
  text += `Generated Date: ${today}\n`
  text += `Department: ${tender?.department || 'N/A'}\n`
  text += `Budget: ${tender?.budget || 'N/A'}\n`
  text += `${'─'.repeat(60)}\n\n`

  rows.forEach((row, idx) => {
    text += `${template.rowLabel} #${idx + 1}\n`
    text += `${'─'.repeat(40)}\n`
    template.fields.forEach(field => {
      const value = field.type === 'computed' ? field.compute(row) : (row[field.id] || '—')
      text += `  ${field.label}: ${value}\n`
    })
    text += '\n'
  })

  text += `${'═'.repeat(60)}\n`
  text += `  End of ${template.title}\n`
  text += `  Submitted by Contract Holder on ${today}\n`
  text += `${'═'.repeat(60)}\n`

  return text
}

// Build a resolved template payload (headers + values, with computed fields
// evaluated) from the submitted rows. Handed to the Excel/Word viewer via localStorage.
function buildTemplatePayload(template, rows, tender) {
  const headers = template.fields.map(f => f.label)
  const dataRows = rows.map(row =>
    template.fields.map(f =>
      f.type === 'computed' ? String(f.compute(row) ?? '') : String(row[f.id] ?? '')
    )
  )
  return {
    title: template.title,
    tenderRef: tenderRef(tender),
    tenderTitle: tender?.title || '',
    rowLabel: template.rowLabel || 'Item',
    headers,
    rows: dataRows,
  }
}

// Open the completed template's submitted data in a new tab.
// Excel templates render in the react-excel-renderer viewer; Word templates render
// as a generated document via docx-preview. Falls back to a text preview otherwise.
function openTemplateFile(template, rows, tender, tenderId) {
  if ((template.fileType === 'excel' || template.fileType === 'word') && rows?.length > 0) {
    const route = template.fileType === 'word' ? 'docx-viewer' : 'excel-viewer'
    const key = `atm_doc_${tenderId || 'draft'}_${template.id}`
    localStorage.setItem(key, JSON.stringify(buildTemplatePayload(template, rows, tender)))
    const viewer = `/${route}?data=${encodeURIComponent(key)}&name=${encodeURIComponent(template.title)}`
    window.open(viewer, '_blank', 'noopener,noreferrer')
    return
  }
  if (template.fileUrl) {
    window.open(encodeURI(template.fileUrl), '_blank', 'noopener,noreferrer')
    return
  }
  const text = generateTemplateDownloadContent(template, rows, tender)
  const blob = new Blob([text], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener,noreferrer')
}

/* ─── Reusable multi-row form with AI auto-fill ─── */

function TemplateForm({ template, initialData, onSave, onClose, tender }) {
  const emptyRow = () => template.fields.reduce((acc, f) => ({ ...acc, [f.id]: '' }), {})

  // Determine whether to show AI loading
  const hasExistingData = initialData?.length > 0
  const [isAiLoading, setIsAiLoading] = useState(!hasExistingData)
  const [aiStep, setAiStep] = useState(0)
  const [rows, setRows] = useState(hasExistingData ? initialData : [emptyRow()])
  const [aiFilledFields, setAiFilledFields] = useState(!hasExistingData)

  // AI loading animation
  useEffect(() => {
    if (!isAiLoading) return
    if (aiStep >= AI_ANALYSIS_TASKS.length) {
      const timer = setTimeout(() => {
        // Populate with AI prefill data
        const prefillData = generateAiPrefill(template.id, tender)
        if (prefillData.length > 0) {
          setRows(prefillData)
          setAiFilledFields(true)
        }
        setIsAiLoading(false)
      }, 400)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => setAiStep(s => s + 1), 500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAiLoading, aiStep])

  const updateRow = (idx, fieldId, value) => {
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [fieldId]: value } : r))
  }

  const addRow = () => setRows(prev => [...prev, emptyRow()])
  const removeRow = (idx) => setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev)

  const handleSubmit = () => {
    const validRows = rows.filter(r => template.fields.some(f => f.type !== 'computed' && r[f.id]))
    onSave(validRows)
    onClose()
  }

  const riskColor = (val) => {
    const map = { 'Low': '#10b981', 'Medium': '#f59e0b', 'High': '#ef4444', 'Critical': '#7c2d12', 'Extreme': '#7c2d12' }
    return map[val] || '#64748b'
  }

  // ── AI Loading State ──
  if (isAiLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <AiAnalysisLoader
          className="max-w-md"
          title="AI is Analysing & Pre-filling"
          description={`Generating ${template.title} data based on tender requirements and industry benchmarks`}
          progress={(aiStep / AI_ANALYSIS_TASKS.length) * 100}
          steps={AI_ANALYSIS_TASKS.map((task, i) => ({
            id: task,
            label: task,
            status: i < aiStep ? 'complete' : i === aiStep ? 'active' : 'pending',
          }))}
        />
      </div>
    )
  }

  // ── Main Form (AI pre-filled, editable by Contract Holder) ──
  return (
    <div className="space-y-4 olng-slide-up">
      {/* Form Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{
            background: `linear-gradient(135deg, ${template.color}20, ${template.color}08)`
          }}>
            <template.icon size={20} style={{ color: template.color }} />
          </div>
          <div>
            <h3 className="font-bold text-[15px]" style={{ color: '#1e293b' }}>{template.title}</h3>
            <p className="text-[11px] text-slate-400">{template.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {aiFilledFields && (
            <span className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg" style={{
              background: 'rgba(139,92,246,0.08)',
              color: '#7c3aed',
              border: '1px solid rgba(139,92,246,0.2)',
            }}>
              <Bot size={12} /> AI Pre-filled — Review & Edit
            </span>
          )}
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* AI Notice Banner */}
      {aiFilledFields && (
        <Card className="p-3 border border-purple-100" style={{ background: 'rgba(139,92,246,0.03)' }}>
          <div className="flex items-center gap-2">
            <Sparkles size={14} style={{ color: '#7c3aed' }} />
            <p className="text-[11px] text-slate-600">
              <strong style={{ color: '#7c3aed' }}>AI has pre-filled the fields below.</strong> Please review and edit any values as needed before submitting the template.
            </p>
          </div>
        </Card>
      )}

      {/* Rows */}
      {rows.map((row, rowIdx) => (
        <Card key={rowIdx} className="p-4 border border-slate-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: template.color }}>
                {template.rowLabel} #{rowIdx + 1}
              </span>
              {aiFilledFields && (
                <span className="flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full" style={{
                  background: 'rgba(139,92,246,0.08)',
                  color: '#7c3aed',
                }}>
                  <Bot size={9} /> AI Suggested
                </span>
              )}
            </div>
            {rows.length > 1 && (
              <button onClick={() => removeRow(rowIdx)} className="p-1 rounded hover:bg-red-50 text-slate-300 hover:text-red-500 transition-colors">
                <Trash2 size={13} />
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {template.fields.map(field => (
              <div key={field.id} className={field.span === 2 ? 'col-span-2' : ''}>
                <label className="text-[11px] font-semibold mb-1.5 block flex items-center gap-1" style={{ color: '#1e293b' }}>
                  {field.label}
                  {field.required && <span className="font-secondary" style={{ color: template.color }}>*</span>}
                </label>

                {field.type === 'computed' ? (
                  <div className="px-3 py-2 text-sm font-semibold rounded-lg" style={{
                    background: 'rgba(0,137,207,0.04)',
                    border: '1px solid rgba(0,137,207,0.1)',
                    color: riskColor(field.compute(row)) !== '#64748b' ? riskColor(field.compute(row)) : '#1e293b'
                  }}>
                    {field.compute(row) || '—'}
                  </div>
                ) : field.type === 'select' ? (
                  <select
                    value={row[field.id] || ''}
                    onChange={e => updateRow(rowIdx, field.id, e.target.value)}
                    className="w-full px-3 py-2 text-sm focus:outline-none transition-all olng-input bg-white"
                  >
                    <option value="">Select...</option>
                    {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                ) : field.type === 'number' ? (
                  <input
                    type="number"
                    value={row[field.id] || ''}
                    onChange={e => updateRow(rowIdx, field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm focus:outline-none transition-all olng-input"
                  />
                ) : (
                  <input
                    value={row[field.id] || ''}
                    onChange={e => updateRow(rowIdx, field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className="w-full px-3 py-2 text-sm focus:outline-none transition-all olng-input"
                  />
                )}
              </div>
            ))}
          </div>
        </Card>
      ))}

      {/* Add Row + Submit */}
      <div className="flex items-center justify-between">
        <Button variant="secondary" onClick={addRow} className="flex items-center gap-1.5">
          <Plus size={14} /> Add {template.rowLabel}
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="brand" onClick={handleSubmit} className="flex items-center gap-1.5">
            <CheckCircle size={14} /> Submit Template
          </Button>
        </div>
      </div>
    </div>
  )
}

function SowPreviewer({ sowDocument, reference, onSave }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedSow, setEditedSow] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  const handleEdit = () => {
    setEditedSow(JSON.parse(JSON.stringify(sowDocument)))
    setIsEditing(true)
  }

  const handleSave = () => {
    onSave(editedSow)
    setIsEditing(false)
  }

  const handleChange = (sectionIndex, value) => {
    const updated = { ...editedSow }
    updated.sections[sectionIndex].content = value
    setEditedSow(updated)
  }

  const handleDownloadSow = () => {
    const textContent = sowDocument.sections.map(s => {
      let text = `${s.heading}\n\n`
      if (s.content) text += `${s.content}\n\n`
      if (s.items) s.items.forEach(i => text += `${i.label}: ${i.value}\n`)
      if (s.subsections) s.subsections.forEach(sub => {
        text += `\n${sub.title}\n`
        sub.items.forEach(item => text += `- ${item}\n`)
      })
      return text
    }).join('\n\n')

    const blob = new Blob([textContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `SOW_${sowDocument.title}.txt`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const doc = isEditing ? editedSow : sowDocument

  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden olng-slide-up" style={{ animationDelay: '30ms' }}>
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between" style={{ background: '#f8fafc' }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.1)' }}>
            <FileText size={18} style={{ color: '#0089cf' }} />
          </div>
          <div>
            <h3 className="font-bold text-[15px]" style={{ color: '#1e293b' }}>{doc.title}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Reference: {reference || doc.reference} · Generated {doc.generatedDate}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-slate-50 text-slate-500 border border-slate-200">
                Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all text-white" style={{ background: '#0089cf' }}>
                <CheckCircle size={11} /> Save Changes
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setIsExpanded(!isExpanded)} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white" style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}>
                {isExpanded ? 'Collapse SOW' : 'Expand SOW'}
              </button>
              <button onClick={() => { setIsExpanded(true); handleEdit() }} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white" style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}>
                <Edit3 size={11} /> Edit SOW
              </button>
              <button onClick={handleDownloadSow} className="flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1.5 rounded-lg transition-all hover:bg-white" style={{ color: '#0089cf', border: '1px solid rgba(0,137,207,0.2)' }}>
                <Download size={11} /> Download SOW
              </button>
            </>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-6 py-5 space-y-5 text-sm leading-relaxed max-h-[500px] overflow-y-auto" style={{ color: '#334155' }}>
          {doc.sections.map((section, si) => (
            <div key={si}>
              <h4 className="font-bold text-[13px] mb-2 flex items-center gap-2" style={{ color: '#1e293b' }}>
                <div className="w-1.5 h-5 rounded-full" style={{ background: 'linear-gradient(180deg, #0089cf, #1b4c6f)' }} />
                {section.heading}
              </h4>
              
              {section.content && (
                isEditing ? (
                  <AiEditableTextarea
                    className="w-full pl-4 py-2 text-[12.5px] border border-slate-200 rounded-lg focus:outline-none focus:border-[#0089cf] mb-2 text-slate-600 leading-6 resize-y"
                    rows={4}
                    value={section.content}
                    onChange={val => handleChange(si, val)}
                  />
                ) : (
                  <div className="pl-4 text-[12.5px] whitespace-pre-line text-slate-600 leading-6">
                    {section.content}
                  </div>
                )
              )}

              {section.items && (
                <div className="pl-4 grid grid-cols-2 gap-2 mt-2">
                  {section.items.map((item, ii) => (
                    <div key={ii} className="flex items-center justify-between rounded-lg px-3 py-2" style={{
                      background: 'rgba(236,244,252,0.5)',
                      border: '1px solid rgba(0,137,207,0.08)'
                    }}>
                      <span className="text-[11px] text-slate-400">{item.label}</span>
                      <span className="text-[11px] font-semibold" style={{ color: item.color || '#1e293b' }}>
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {section.subsections && (
                <div className="pl-4 space-y-3 mt-2">
                  {section.subsections.map((sub, si2) => (
                    <div key={si2}>
                      <p className="text-[12px] font-semibold mb-1" style={{ color: '#1e293b' }}>{sub.title}</p>
                      <ul className="space-y-1">
                        {sub.items.map((item, ii) => (
                          <li key={ii} className="text-[12px] text-slate-600 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: '#0089cf' }} />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function StrategyTemplatesDashboard() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders, updateTender } = useTenders()
  const { t } = useLanguage()

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null
  const [activeForm, setActiveForm] = useState(null) // template id or null

  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)
  const [ackChoices, setAckChoices] = useState(null) // { [id]: boolean } pending choices in the gate modal
  
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const formParam = searchParams.get('form')
    if (formParam && formParam !== 'pre-qual') {
      setActiveForm(formParam)
    } else {
      setActiveForm(null)
    }
  }, [location.search])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldAlert size={32} />
      <p className="text-sm font-medium">{t('access.restricted')}</p>
      <p className="text-xs">Only Contract Holders can access this page.</p>
    </div>
  )

  const handleSaveForm = (templateId, dataKey, rows) => {
    if (existingTender) {
      updateTender(existingTender.id, { [dataKey]: rows })
    }
  }

  const handleCardClick = (templateId) => {
    if (templateId === 'pre-qual') {
      navigate(`/pre-qualification/${tenderId}`)
      return
    }
    navigate(`/strategy-templates/${tenderId}?form=${templateId}`)
  }

  // Every form template plus the non-form Pre-Qualification card
  const allCards = [
    ...TEMPLATE_DEFS.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      icon: t.icon,
      color: t.color,
      dataKey: t.dataKey,
      fileType: t.fileType,
      fileUrl: t.fileUrl,
      isForm: true,
    })),
    {
      id: 'pre-qual',
      title: 'Pre-Qualification Document',
      description: 'Run the full bidder pre-qualification process — match, evaluate, and shortlist bidders.',
      icon: Users,
      color: '#0089cf',
      dataKey: null,
      isForm: false,
    }
  ]

  const selectedTemplateIds = existingTender?.selectedTemplates || allCards.map(c => c.id)
  const visibleCards = allCards.filter(c => selectedTemplateIds.includes(c.id))

  // The user must acknowledge which templates to include before the page loads.
  // Gate is shown until `selectedTemplates` has been saved on the tender.
  const hasAcknowledged = Array.isArray(existingTender?.selectedTemplates)
  const showAckGate = !!existingTender && !hasAcknowledged && !activeForm

  const ackValue = (id) => ackChoices?.[id] ?? true
  const setAckChoice = (id, val) => setAckChoices(prev => ({ ...(prev || {}), [id]: val }))
  const handleConfirmAck = () => {
    const selected = allCards.filter(c => ackValue(c.id)).map(c => c.id)
    updateTender(tenderId, { selectedTemplates: selected })
  }

  // Yes/No acknowledgement — "Yes" includes the template (card shown), "No" excludes it (card hidden).
  const handleSetTemplate = (templateId, include) => {
    let newSelections = selectedTemplateIds.filter(id => id !== templateId)
    if (include) newSelections.push(templateId)
    updateTender(tenderId, { selectedTemplates: newSelections })
  }

  const isCompleted = (dataKey) => {
    return existingTender?.[dataKey]?.length > 0
  }

  // Templates hand off to the PSF Strategy (Procurement Submission Form), which
  // is what releases the tender to the Contract Engineer for ITT creation.
  const handleProceed = () => {
    navigate(`/psf-strategy/${tenderId}`)
  }

  const handleDownloadTemplateExcel = (card) => {
    const templateDef = TEMPLATE_DEFS.find(t => t.id === card.id)
    if (!templateDef) return
    exportTemplateExcel(templateDef, existingTender?.[card.dataKey] || [], existingTender)
  }

  const handleOpenDocument = (card) => {
    const templateDef = TEMPLATE_DEFS.find(t => t.id === card.id)
    if (!templateDef) return
    const data = existingTender?.[card.dataKey] || []
    openTemplateFile(templateDef, data, existingTender, tenderId)
  }

  // Completed, form-based templates (excluding Pre-Qualification) available to open.
  const submittedDocs = visibleCards.filter(
    c => c.isForm && c.id !== 'pre-qual' && isCompleted(c.dataKey)
  )

  const activeDef = TEMPLATE_DEFS.find(t => t.id === activeForm)

  // ── Acknowledgement gate: choose Yes/No for each template before the page loads ──
  if (showAckGate) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] w-full olng-fade-in">
        <Card branded className="w-full max-w-lg p-7 olng-scale-in">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
              <Layout size={18} style={{ color: '#0089cf' }} />
            </div>
            <div>
              <h3 className="font-bold text-[15px]" style={{ color: '#1e293b' }}>Select Required Templates</h3>
              <p className="text-[11px] text-slate-400">{tenderRef(existingTender)} — confirm which strategies to include</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-2 mb-5">
            Choose <strong>Yes</strong> to include a template in this tender's strategy, or <strong>No</strong> to leave it out. You can change this later from <strong>Manage Templates</strong>.
          </p>

          <div className="space-y-1.5 mb-6">
            {allCards.map(card => {
              const yes = ackValue(card.id)
              return (
                <div key={card.id} className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(236,244,252,0.5)', border: '1px solid rgba(0,137,207,0.08)' }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${card.color}15` }}>
                      <card.icon size={14} style={{ color: card.color }} />
                    </div>
                    <span className="text-[13px] font-semibold truncate" style={{ color: '#1e293b' }}>{card.title}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => setAckChoice(card.id, true)}
                      className="px-3 py-1 rounded-md text-[11px] font-semibold transition-all border"
                      style={yes
                        ? { background: 'rgba(16,185,129,0.1)', color: '#059669', borderColor: 'rgba(16,185,129,0.3)' }
                        : { background: '#fff', color: '#94a3b8', borderColor: '#e2e8f0' }}
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setAckChoice(card.id, false)}
                      className="px-3 py-1 rounded-md text-[11px] font-semibold transition-all border"
                      style={!yes
                        ? { background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }
                        : { background: '#fff', color: '#94a3b8', borderColor: '#e2e8f0' }}
                    >
                      No
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={() => navigate(-1)} className="flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
            <Button variant="brand" onClick={handleConfirmAck} className="flex items-center gap-2 py-3 px-6 text-[15px]">
              Continue <ArrowRight size={16} />
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-5 w-full">
      {/* Header Card */}
      <Card branded className="p-5 olng-slide-up">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(0,137,207,0.12), rgba(27,76,111,0.08))' }}>
            <Layout size={16} style={{ color: '#0089cf' }} />
          </div>
          <h3 className="font-semibold text-sm" style={{ color: '#1e293b' }}>
            {existingTender ? `Strategies — ${existingTender.costCode || existingTender.id}` : 'Strategies'}
          </h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          Complete the strategies below. AI will pre-fill the template data for your review — edit as needed, then submit each template to download.
        </p>
      </Card>

      {/* ── SOW Display ── */}
      {!activeForm && existingTender?.sowDocument && (
        <SowPreviewer 
          sowDocument={existingTender.sowDocument} 
          reference={existingTender.costCode || existingTender.id}
          onSave={(newSow) => updateTender(existingTender.id, { sowDocument: newSow })} 
        />
      )}

      {/* ── Active Form ── */}
      {activeDef && (
        <TemplateForm
          template={activeDef}
          initialData={existingTender?.[activeDef.dataKey]}
          tender={existingTender}
          onSave={(rows) => handleSaveForm(activeDef.id, activeDef.dataKey, rows)}
          onClose={() => {
            setActiveForm(null)
            navigate(`/strategy-templates/${tenderId}`)
          }}
        />
      )}

      {/* ── Cards Grid (hidden when form is open) ── */}
      {!activeForm && (
        <>
          <div className="mb-2 flex items-center justify-between olng-slide-up relative z-50" style={{ animationDelay: '40ms' }}>
            <h4 className="font-semibold text-[13px]" style={{ color: '#1e293b' }}>Required Templates</h4>
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-all text-[12px] font-semibold text-slate-600"
              >
                Manage Templates <ChevronDown size={14} />
              </button>
              
              {showDropdown && (
                <div className="absolute right-0 mt-1 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-2 olng-fade-in">
                  <p className="px-4 pt-1 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Include this template?
                  </p>
                  {allCards.map(card => {
                    const included = selectedTemplateIds.includes(card.id)
                    return (
                      <div key={card.id} className="flex items-center justify-between gap-3 px-4 py-2 hover:bg-slate-50">
                        <span className="text-[12px] font-medium text-slate-700 truncate">{card.title}</span>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleSetTemplate(card.id, true)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border"
                            style={included
                              ? { background: 'rgba(16,185,129,0.1)', color: '#059669', borderColor: 'rgba(16,185,129,0.3)' }
                              : { background: '#fff', color: '#94a3b8', borderColor: '#e2e8f0' }}
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => handleSetTemplate(card.id, false)}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all border"
                            style={!included
                              ? { background: 'rgba(239,68,68,0.1)', color: '#dc2626', borderColor: 'rgba(239,68,68,0.3)' }
                              : { background: '#fff', color: '#94a3b8', borderColor: '#e2e8f0' }}
                          >
                            No
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 olng-slide-up" style={{ animationDelay: '60ms' }}>
            {visibleCards.map((card) => {
              const isDone = card.dataKey ? isCompleted(card.dataKey) : (existingTender?.status === 'draft')
              
              return (
                <Card
                  key={card.id}
                  className="p-5 flex flex-col justify-between olng-hover-raise group border border-slate-100 hover:border-slate-200 transition-all cursor-pointer"
                  onClick={() => handleCardClick(card.id)}
                >
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{
                        background: `linear-gradient(135deg, ${card.color}15, ${card.color}05)`
                      }}>
                        <card.icon size={18} style={{ color: card.color }} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm" style={{ color: '#1e293b' }}>{card.title}</h4>
                        <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: card.color }}>
                          {card.isForm ? (card.id !== 'pre-qual' ? 'AI-Powered Template' : 'Form Template') : 'Workflow'}
                        </span>
                      </div>
                      {isDone && (
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                          <CheckCircle size={14} style={{ color: '#10b981' }} />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-4">
                      {card.description}
                    </p>
                  </div>

                  {/* Card action area */}
                  <div className="space-y-2 transition-all">
                    <div
                      className="w-full flex justify-center items-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all"
                      style={{
                        background: isDone ? 'rgba(16,185,129,0.06)' : `${card.color}08`,
                        color: isDone ? '#059669' : card.color,
                        border: `1px solid ${isDone ? 'rgba(16,185,129,0.15)' : card.color + '20'}`,
                      }}
                    >
                      {isDone ? (
                        <><CheckCircle size={13} /> Completed — Click to Edit</>
                      ) : card.id === 'pre-qual' ? (
                        <><ArrowRight size={13} /> Start Pre-Qualification</>
                      ) : (
                        <><Sparkles size={13} /> Open AI-Powered Form</>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* ── Submitted Documents list ── */}
          {(submittedDocs.length > 0 || existingTender?.prequalBidders?.length > 0) && (
            <Card className="p-5 border border-slate-100 olng-slide-up" style={{ animationDelay: '75ms' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'rgba(0,137,207,0.1)' }}>
                  <FileText size={14} style={{ color: '#0089cf' }} />
                </div>
                <h4 className="font-bold text-[13px]" style={{ color: '#1e293b' }}>Submitted Documents</h4>
                <span className="text-[11px] text-slate-400">— open in a new tab, or download as Excel</span>
              </div>
              <div className="space-y-2">
                {submittedDocs.map(card => {
                  const isExcel = card.fileType === 'excel'
                  const isWord = card.fileType === 'word'
                  const FileIcon = isExcel ? FileSpreadsheet : FileText
                  const accent = isExcel ? '#10b981' : isWord ? '#2563eb' : '#0089cf'
                  const typeLabel = isExcel ? 'Excel Spreadsheet (.xlsx)' : isWord ? 'Word Document (.docx)' : 'Document preview'
                  return (
                    <div
                      key={card.id}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all hover:shadow-sm group"
                      style={{ background: 'rgba(236,244,252,0.5)', border: '1px solid rgba(0,137,207,0.1)' }}
                    >
                      <button onClick={() => handleOpenDocument(card)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${accent}15` }}>
                          <FileIcon size={15} style={{ color: accent }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold truncate" style={{ color: '#1e293b' }}>{card.title}</p>
                          <p className="text-[10px] text-slate-400">{typeLabel}</p>
                        </div>
                        <ExternalLink size={15} className="text-slate-300 group-hover:text-[#0089cf] transition-colors shrink-0" />
                      </button>
                      <button
                        onClick={() => handleDownloadTemplateExcel(card)}
                        title={`Download ${card.title} as Excel`}
                        aria-label={`Download ${card.title} as Excel`}
                        className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-all hover:bg-white"
                        style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
                      >
                        <Download size={12} /> Excel
                      </button>
                    </div>
                  )
                })}

                {/* Pre-Qualification summary — downloadable alongside the templates */}
                {existingTender?.prequalBidders?.length > 0 && (
                  <div
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl"
                    style={{ background: 'rgba(236,244,252,0.5)', border: '1px solid rgba(0,137,207,0.1)' }}
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(16,185,129,0.09)' }}>
                      <FileSpreadsheet size={15} style={{ color: '#10b981' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold truncate" style={{ color: '#1e293b' }}>Pre-Qualification Summary</p>
                      <p className="text-[10px] text-slate-400">Excel Spreadsheet (.xlsx) — bidders, outcomes and financial results</p>
                    </div>
                    <button
                      onClick={() => exportPreQualSummaryExcel(
                        existingTender,
                        (existingTender.prequalBidders || []).filter(b => !b.droppedAt)
                      )}
                      title="Download Pre-Qualification Summary as Excel"
                      className="flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg shrink-0 transition-all hover:bg-white"
                      style={{ color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }}
                    >
                      <Download size={12} /> Excel
                    </button>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Progress Strip */}
          <Card branded className="p-4 olng-slide-up" style={{ animationDelay: '90ms' }}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                {visibleCards.map(card => {
                  const done = card.dataKey ? isCompleted(card.dataKey) : (existingTender?.status === 'draft')
                  return (
                    <div key={card.id} className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center" style={{
                        background: done ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)',
                      }}>
                        {done ? <CheckCircle size={11} style={{ color: '#10b981' }} /> : <div className="w-2 h-2 rounded-full bg-slate-300" />}
                      </div>
                      <span className={`text-[10px] font-semibold ${done ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {card.id === 'pre-qual' ? 'Pre-Qual' : card.title.split(' ').slice(0, 2).join(' ')}
                      </span>
                    </div>
                  )
                })}
              </div>
              <div className="flex-1" />
              <span className="text-[11px] text-slate-400 shrink-0">
                {visibleCards.filter(c => c.dataKey ? isCompleted(c.dataKey) : (existingTender?.status === 'draft')).length} of {visibleCards.length} completed
              </span>
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex items-center justify-between olng-slide-up" style={{ animationDelay: '120ms' }}>
            <Button variant="secondary" onClick={() => navigate(-1)} className="flex items-center gap-2">
              <ArrowLeft size={14} /> Back
            </Button>
            <Button 
              variant="brand" 
              onClick={handleProceed} 
              className="flex items-center gap-2 py-3 px-6 text-[15px]"
              disabled={visibleCards.filter(c => c.dataKey ? isCompleted(c.dataKey) : (existingTender?.status === 'draft')).length !== visibleCards.length || visibleCards.length === 0}
            >
              Move Forward to PSF Strategy <ArrowRight size={16} />
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
