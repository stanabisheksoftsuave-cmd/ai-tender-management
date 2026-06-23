import { createContext, useContext, useState } from 'react'
import { tenders as initialTenders } from '../data/mockData'

const TenderContext = createContext()

const NEXT_STATUS = {
  draft:        { status: 'upload',        stage: 'Awaiting Ingestion' },
  upload:       { status: 'tech_eval',     stage: 'Technical Evaluation',  evalProgress: 'not_started' },
  tech_eval:    { status: 'comm_eval',     stage: 'Commercial Evaluation', evalProgress: 'not_started' },
  comm_eval:    { status: 'legal_review',  stage: 'Legal Review',          evalProgress: 'not_started' },
  legal_review: { status: 'mgmt_review',   stage: 'Management Review',     evalProgress: 'not_started' },
  mgmt_review:  { status: 'award',         stage: 'Award Recommended' },
}

export function TenderProvider({ children }) {
  const [tenders, setTenders] = useState(initialTenders)

  const advanceTender = (tenderId) => {
    setTenders(prev => prev.map(t => {
      if (t.id !== tenderId) return t
      const next = NEXT_STATUS[t.status]
      return next ? { ...t, ...next } : t
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

  return (
    <TenderContext.Provider value={{ tenders, advanceTender, addTender, updateTender }}>
      {children}
    </TenderContext.Provider>
  )
}

export const useTenders = () => useContext(TenderContext)
