import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Target, Building2, ShieldOff, ArrowRight } from 'lucide-react'
import Card from '../components/ui/Card'
import Button from '../components/ui/Button'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'

const TENDER_TYPES = ['Goods', 'Services', 'Works', 'Consultancy']

export default function ContractStrategy() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenders, addTender, updateTender } = useTenders()

  const existingTender = tenderId ? tenders.find(t => t.id === tenderId) : null

  const [form, setForm] = useState({
    title: existingTender?.title || '',
    tenderType: existingTender?.tenderType || TENDER_TYPES[0],
    department: existingTender?.department || '',
  })
  const [showErrors, setShowErrors] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">Access Restricted</p>
      <p className="text-xs">Only Contract Holders can access this page.</p>
    </div>
  )

  const setField = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const isFormValid = form.title.trim() !== ''
  const fieldError = () => showErrors && form.title.trim() === ''

  const handleSubmit = () => {
    if (!isFormValid) { setShowErrors(true); return }

    if (existingTender) {
      updateTender(existingTender.id, { ...form })
      setSubmitted(true)
      setTimeout(() => navigate(`/pre-qualification/${existingTender.id}`), 500)
      return
    }

    const maxNum = tenders.reduce((max, t) => Math.max(max, parseInt(t.id.split('-')[2]) || 0), 0)
    const newId = `ITT-2025-${String(maxNum + 1).padStart(3, '0')}`
    addTender({
      id: newId,
      ...form,
      status: 'prequal_stage1',
      stage: 'Pre-Qualification — Bidder Matching',
      created: new Date().toISOString().split('T')[0],
      bidders: 0,
      bidderList: [],
      aiScore: null,
    })
    setSubmitted(true)
    setTimeout(() => navigate(`/pre-qualification/${newId}`), 500)
  }

  return (
    <div className="space-y-5 max-w-xl">

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-1">
          <Target size={16} className="text-[var(--color-primary)]" />
          <h3 className="font-semibold text-slate-800 text-sm">
            {existingTender ? `Contract Strategy — ${existingTender.id}` : 'New Tender'}
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Name the tender to begin. Everything else — budget, deadline, scope and the evaluation matrix — is
          captured later once bidders are pre-qualified.
        </p>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <label className="text-xs font-medium text-slate-600 mb-1 block">Tender Name *</label>
          <input
            value={form.title}
            onChange={e => setField('title', e.target.value)}
            placeholder="e.g. Supply of Gas Turbine Spare Parts"
            className={`w-full text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 ${fieldError() ? 'border-red-300' : 'border-slate-200'}`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 block">Tender Type</label>
            <select
              value={form.tenderType}
              onChange={e => setField('tenderType', e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30 bg-white"
            >
              {TENDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-600 mb-1 flex items-center gap-1"><Building2 size={11} /> Requesting Department</label>
            <input
              value={form.department}
              onChange={e => setField('department', e.target.value)}
              placeholder="Optional"
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30"
            />
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3">
        {submitted ? (
          <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
            Tender saved — moving to Pre-Qualification…
          </div>
        ) : (
          <Button onClick={handleSubmit}>
            Proceed to Pre-Qualification <ArrowRight size={14} />
          </Button>
        )}
      </div>
    </div>
  )
}
