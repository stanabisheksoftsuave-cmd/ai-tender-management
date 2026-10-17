import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, ShieldOff } from 'lucide-react'
import Button from '../components/ui/Button'
import { useAuth } from '../context/AuthContext'
import { useTenders } from '../context/TenderContext'
import { useAccess, useHomePath } from '../utils/permissions'
import { canEvaluate } from '../utils/evalAssignment'
import { TechEvalWorklist } from '../components/techeval/TechEvalWorklist'
import { TechEvalFlow } from '../components/techeval/TechEvalFlow'

/**
 * ITT Technical Evaluation — `/technical-eval` (worklist) and
 * `/technical-eval/:tenderId` (the evaluation). A port of MAIN's
 * `IttTechnicalEvaluationWorklist` + `TechnicalEvaluationFlow`; the screens
 * live in `components/techeval/`.
 *
 * Access is a permission check on the route (the Access Control matrix), not a
 * role-id comparison (§8.B.13); the per-tender guard is the same
 * assignment-aware `canEvaluate` the worklist filters on, so nothing can be
 * listed but unopenable.
 */
export default function TechnicalEvaluation() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { can } = useAccess()
  const home = useHomePath()
  const { tenders } = useTenders()

  if (!can('/technical-eval')) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
          <ShieldOff size={22} className="text-red-400" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">Access Restricted</p>
          <p className="mt-1 text-xs text-slate-400">Technical Evaluation is only accessible to the Contract Holder.</p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
          <ArrowLeft size={13} /> Back to Home
        </Button>
      </div>
    )
  }

  if (!tenderId) return <TechEvalWorklist />

  const tender = tenders.find(t => t.id === tenderId)
  if (!tender || !canEvaluate(tender, 'tech', user)) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 text-slate-500">
        <p className="text-sm">{!tender ? 'Tender not found.' : 'This tender is not assigned to you.'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(home)}>
          <ArrowLeft size={13} /> Back to Home
        </Button>
      </div>
    )
  }

  // Keyed by tender so switching tenders never carries one run's state into another.
  return <TechEvalFlow key={tender.id} tender={tender} />
}
