import { useLocation, useParams } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import CifDraftsPicker from '../components/cif/CifDraftsPicker'
import CifFormPage from '../components/cif/CifFormPage'
import SowDocumentPage from '../components/cif/SowDocumentPage'

/*
 * Contract Strategy — Contract Initiating Form (CIF) entry point. One route
 * component for the three CIF URLs (registered in App.jsx), each a screen of
 * its own, ported from MAIN's initiating-form/* pages:
 *
 *   /contract-strategy                 → drafts picker
 *   /contract-strategy/new             → blank CIF form
 *   /contract-strategy/:tenderId       → CIF form for that tender
 *   /contract-strategy/:tenderId/sow   → the generated Statement of Work
 *
 * The old single-page step machine (form → loader → SOW review in local
 * state) is gone: the SOW is its own URL now, read off the tender, so a
 * refresh or a re-opened draft lands back on the saved document.
 */
export default function ContractStrategy() {
  const { tenderId } = useParams()
  const { pathname, state } = useLocation()
  const { user } = useAuth()
  const { t } = useLanguage()

  if (user?.role?.id !== 'contract_holder') return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
      <ShieldOff size={32} />
      <p className="text-sm font-medium">{t('access.restricted')}</p>
      <p className="text-xs">Only Contract Holders can access this page.</p>
    </div>
  )

  if (!tenderId) return <CifDraftsPicker />

  if (/\/sow\/?$/.test(pathname)) {
    return (
      <SowDocumentPage
        key={`sow-${tenderId}`}
        tenderId={tenderId}
        initialDuplicateWarning={state?.duplicateWarning ?? null}
      />
    )
  }

  return (
    <CifFormPage
      key={`cif-${tenderId}`}
      tenderId={tenderId}
      autoGenerate={Boolean(state?.autoGenerate)}
    />
  )
}
