import { useEffect } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import Card from '../components/ui/Card'
import { useTenders } from '../context/TenderContext'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { tenderRef } from '../utils/tenderRef'
import { MANDATORY_TEMPLATE_IDS, PRE_QUAL_ID, findTemplateDef, includedTemplateIds } from '../utils/strategyTemplates'
import TemplateSelectionScreen from '../components/strategy/TemplateSelectionScreen'
import StrategiesHub from '../components/strategy/StrategiesHub'
import TemplateRegister from '../components/strategy/TemplateRegister'

// Kept for Sidebar / PsfStrategy / ITTCreation, which import it from this page.
export { TEMPLATE_DEFS } from '../utils/strategyTemplates'

/**
 * /strategy-templates/:tenderId — the Contract Holder's Strategy Templates step:
 *   ?new=true (or no selection saved yet) → "Select Required Templates";
 *   ?form=<templateId>[&autogen=1]        → that template's register;
 *   ?form=pre-qual                        → the Pre-Qualification workflow;
 *   otherwise                             → the "Strategies" hub.
 */
export default function StrategyTemplatesDashboard() {
  const { tenderId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const { tenders, updateTender } = useTenders()
  const { t } = useLanguage()

  const tender = tenderId ? tenders.find(item => item.id === tenderId) : null
  const params = new URLSearchParams(location.search)
  const formId = params.get('form')
  const autogen = params.get('autogen') === '1'
  const isNew = params.get('new') === 'true'
  const template = formId ? findTemplateDef(formId) : null

  // `autogen=1` is one-shot: the register reads it on open, then it is dropped
  // so a reload or back/forward never starts the AI again unasked.
  useEffect(() => {
    if (!template || !autogen) return
    navigate(`/strategy-templates/${tenderId}?form=${template.id}`, { replace: true })
  }, [template, autogen, tenderId, navigate])

  if (user?.role?.id !== 'contract_holder') {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <ShieldAlert size={32} aria-hidden="true" />
        <p className="text-sm font-medium">{t('access.restricted')}</p>
        <p className="text-xs">Only Contract Holders can access this page.</p>
      </div>
    )
  }

  if (formId === PRE_QUAL_ID) return <Navigate to={`/pre-qualification/${tenderId}`} replace />

  if (!tender) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm font-semibold text-slate-800">Strategies</p>
        <p className="text-xs text-slate-500 mt-1">
          This tender could not be found. Open a Contract Initiating Form draft to continue its strategy.
        </p>
      </Card>
    )
  }

  if (template) {
    return (
      <TemplateRegister
        key={`${tender.id}:${template.id}`}
        template={template}
        tender={tender}
        tenderId={tender.id}
        autogen={autogen}
        navigate={navigate}
        updateTender={updateTender}
      />
    )
  }

  const needsSelection = isNew || !Array.isArray(tender.selectedTemplates)
  if (needsSelection) {
    return (
      <TemplateSelectionScreen
        key={tender.id}
        costCode={tenderRef(tender)}
        included={includedTemplateIds(tender)}
        onBack={() => navigate(`/contract-strategy/${tender.id}/sow`)}
        onContinue={selected => {
          const withMandatory = [...new Set([...selected, ...MANDATORY_TEMPLATE_IDS])]
          updateTender(tender.id, { selectedTemplates: withMandatory, cifProgressStage: 'strategy_templates' })
          navigate(`/strategy-templates/${tender.id}`, { replace: true })
        }}
      />
    )
  }

  return <StrategiesHub tender={tender} tenderId={tender.id} navigate={navigate} updateTender={updateTender} />
}
