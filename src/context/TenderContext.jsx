import { createContext, useContext, useState, useEffect } from 'react'
import { tenders as initialTenders } from '../data/mockData'

const TenderContext = createContext()

const NEXT_STATUS = {
  draft:            { status: 'upload',           stage: 'Awaiting Ingestion' },
  upload:           { status: 'tech_eval',         stage: 'Technical Evaluation',   evalProgress: 'not_started' },
  tech_eval:        { status: 'tech_eval_export',  stage: 'Awaiting Contract Engineer Upload', evalProgress: 'not_started' },
  tech_eval_export: { status: 'comm_eval',         stage: 'Commercial Evaluation',  evalProgress: 'not_started' },
  comm_eval:        { status: 'comm_eval_export',  stage: 'Awaiting Contract Engineer Upload', evalProgress: 'not_started' },
  comm_eval_export: { status: 'mgmt_review',       stage: 'Management Review',      evalProgress: 'not_started' },
  mgmt_review:      { status: 'award',             stage: 'Award Recommended' },
  award:            { status: 'legal_review',      stage: 'Legal Review' },
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
  contractRisks: ['Low', 'Medium', 'High', 'Critical'],
  currencies: [
    { code: 'USD', symbol: '$', label: 'USD — US Dollar' },
    { code: 'EUR', symbol: '€', label: 'EUR — Euro' },
    { code: 'SAR', symbol: '﷼', label: 'SAR — Saudi Riyal' },
    { code: 'AED', symbol: 'د.إ', label: 'AED — UAE Dirham' },
    { code: 'GBP', symbol: '£', label: 'GBP — British Pound' },
  ],
}

export function TenderProvider({ children }) {
  const [tenders, setTenders] = useState(initialTenders)

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
  // An evaluator submits their side (tech/comm) of a parallel tender. The side
  // moves to 'awaiting_report' so the Contract Engineer can upload its report.
  const submitParallelEval = (tenderId, side) => {
    setTenders(prev => prev.map(t => {
      if (t.id !== tenderId) return t
      return { ...t, [side === 'tech' ? 'techSide' : 'commSide']: 'awaiting_report' }
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
