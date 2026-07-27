import { createContext, useContext, useState, useEffect } from 'react'
import { tenders as initialTenders } from '../data/mockData'

const TenderContext = createContext()

const NEXT_STATUS = {
  draft:            { status: 'upload',      stage: 'Awaiting Ingestion' },
  upload:           { status: 'tech_eval',   stage: 'Technical Evaluation',  evalProgress: 'not_started' },
  // Bidder documents are uploaded up-front at ingestion, so evaluations advance
  // straight to the next stage — there is no post-evaluation report-upload step.
  tech_eval:        { status: 'comm_eval',   stage: 'Commercial Evaluation', evalProgress: 'not_started' },
  comm_eval:        { status: 'mgmt_review',  stage: 'Management Review',     evalProgress: 'not_started' },
  mgmt_review:      { status: 'award',        stage: 'Award Recommended' },
  // The procurement flow ends once the contract is created — it does not
  // continue to legal review / execution.
  award:            { status: 'active',       stage: 'Contract Active' },
  // Retained for any seed tenders already in these later contract stages.
  legal_review:     { status: 'contract_execution',stage: 'Contract Execution' },
  contract_execution:{ status: 'active',           stage: 'Contract Active' },
  active:           { status: 'contract_closure',  stage: 'Closure In Progress' },
  contract_closure: { status: 'closed',            stage: 'Closed & Archived' },
}

/* ─── Default dropdown options (used as fallback) ─── */
const DEFAULT_DROPDOWN_CONFIG = {
  contractModes: [
    'Lump Sum',
    'Reimbursable',
    'Unit Rate',
    'Time & Material',
    'Framework Agreement',
    'Call-Off Contract',
  ],
  tenderTypes: ['Goods', 'Services', 'Works', 'Consultancy'],
  departments: [
    'IT',
    'Supply Chain',
    'Operations',
    'Engineering',
    'Finance',
    'Human Resources',
    'HSSE',
    'Legal',
    'Maintenance',
    'Projects',
  ],
  contractRisks: ['Low', 'Medium', 'High', 'Critical'],
  currencies: [
    { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
    { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
    { code: 'SAR', symbol: '﷼', label: 'SAR — Saudi Riyal' },
    { code: 'AED', symbol: 'د.إ', label: 'AED — UAE Dirham' },
    { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  ],
}

// Tenders are persisted to localStorage so multi-role handoffs survive the
// logout/login used to switch roles (e.g. the Contract Holder generates an ITT,
// then the Contract Engineer / HSE / ICV log in to fill their sections). Bump
// TENDERS_VERSION to force every client back to the seed data.
const TENDERS_KEY = 'atm_tenders'
const TENDERS_VERSION_KEY = 'atm_tenders_v'
const TENDERS_VERSION = '2'

function loadTenders() {
  try {
    if (localStorage.getItem(TENDERS_VERSION_KEY) !== TENDERS_VERSION) {
      localStorage.setItem(TENDERS_VERSION_KEY, TENDERS_VERSION)
      localStorage.removeItem(TENDERS_KEY)
      return initialTenders
    }
    const saved = localStorage.getItem(TENDERS_KEY)
    if (!saved) return initialTenders
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed) || parsed.length === 0) return initialTenders
    // Keep any brand-new seed tenders that aren't in the saved set yet.
    const ids = new Set(parsed.map(t => t.id))
    const missingSeeds = initialTenders.filter(t => !ids.has(t.id))
    return [...parsed, ...missingSeeds]
  } catch {
    return initialTenders
  }
}

export function TenderProvider({ children }) {
  const [tenders, setTenders] = useState(loadTenders)

  // Persist on every change. File/Blob fields (uploaded documents) serialise to
  // {} — acceptable for the demo, since the workflow-critical fields (status,
  // sectionsGenerated, sectionAnswers, psfCompleted, bidderList) are plain data.
  useEffect(() => {
    try {
      localStorage.setItem(TENDERS_KEY, JSON.stringify(tenders))
    } catch {
      /* quota or non-serialisable value — ignore, keep in-memory state */
    }
  }, [tenders])

  // ── Admin-configurable dropdown options (persisted to localStorage) ──
  const [dropdownConfig, setDropdownConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('atm_dropdown_config')
      if (!saved) return DEFAULT_DROPDOWN_CONFIG
      const parsed = JSON.parse(saved)
      // Merge with defaults to ensure all keys exist
      return { ...DEFAULT_DROPDOWN_CONFIG, ...parsed }
    } catch {
      return DEFAULT_DROPDOWN_CONFIG
    }
  })

  useEffect(() => {
    localStorage.setItem('atm_dropdown_config', JSON.stringify(dropdownConfig))
  }, [dropdownConfig])

  const updateDropdownConfig = (key, values) => {
    setDropdownConfig(prev => ({ ...prev, [key]: values }))
  }

  const advanceTender = (tenderId) => {
    setTenders(prev => prev.map(t => {
      if (t.id !== tenderId) return t
      const next = NEXT_STATUS[t.status]
      return next ? { ...t, ...next } : t
    }))
  }

  // ── Parallel evaluation ──
  // An evaluator submits their side (tech/comm) of a parallel tender. The side is
  // marked done immediately (no post-evaluation report upload); once both sides
  // are done the tender converges to Management Review.
  const submitParallelEval = (tenderId, side) => {
    setTenders(prev => prev.map(t => {
      if (t.id !== tenderId) return t
      const updated = { ...t, [side === 'tech' ? 'techSide' : 'commSide']: 'done' }
      if (updated.techSide === 'done' && updated.commSide === 'done') {
        return { ...updated, status: 'mgmt_review', stage: 'Management Review', evalProgress: 'not_started' }
      }
      return updated
    }))
  }

  // Contract Engineer uploads a side's evaluation report. When BOTH sides are
  // done, the parallel tender converges to Management Review.
  const uploadParallelReport = (tenderId, side) => {
    setTenders(prev => prev.map(t => {
      if (t.id !== tenderId) return t
      const updated = { ...t, [side === 'tech' ? 'techSide' : 'commSide']: 'done' }
      if (updated.techSide === 'done' && updated.commSide === 'done') {
        return { ...updated, status: 'mgmt_review', stage: 'Management Review', evalProgress: 'not_started' }
      }
      return updated
    }))
  }

  const addTender = (tender) => {
    setTenders(prev => {
      if (tender.id) return [...prev, tender]
      const maxNum = prev.reduce((max, t) => {
        const num = parseInt(t.id.split('-')[2]) || 0
        return Math.max(max, num)
      }, 0)
      const id = `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
      return [...prev, { id, ...tender }]
    })
  }

  const updateTender = (tenderId, changes) => {
    setTenders(prev => prev.map(t => t.id === tenderId ? { ...t, ...changes } : t))
  }

  const reassignTender = (tenderId, newStatus, newStage) => {
    setTenders(prev => prev.map(t =>
      t.id === tenderId ? { ...t, status: newStatus, stage: newStage, evalProgress: 'not_started' } : t
    ))
  }

  return (
    <TenderContext.Provider value={{
      tenders, advanceTender, addTender, updateTender, reassignTender,
      submitParallelEval, uploadParallelReport,
      dropdownConfig, updateDropdownConfig,
    }}>
      {children}
    </TenderContext.Provider>
  )
}

export const useTenders = () => useContext(TenderContext)
