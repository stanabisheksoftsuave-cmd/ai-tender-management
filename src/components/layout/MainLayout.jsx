import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'

const pageMeta = {
  '/dashboard':      { titleKey: 'page.dashboard',  subKey: 'page.dashboard.sub' },
  '/tenders':        { titleKey: 'page.tenders',     subKey: 'page.tenders.sub' },
  '/contract-strategy':  { titleKey: 'page.contractStrategy',  subKey: 'page.contractStrategy.sub' },
  '/strategy-templates': { titleKey: 'page.strategyTemplates', subKey: 'page.strategyTemplates.sub' },
  '/psf-strategy':       { titleKey: 'page.psfStrategy',       subKey: 'page.psfStrategy.sub' },
  '/pre-qualification':  { titleKey: 'page.preQualification',  subKey: 'page.preQualification.sub' },
  '/create-itt':     { titleKey: 'page.createItt',   subKey: 'page.createItt.sub' },
  '/upload':         { titleKey: 'page.ingestion',   subKey: 'page.ingestion.sub' },
  '/technical-eval': { titleKey: 'page.techEval',    subKey: 'page.techEval.sub' },
  '/commercial-eval':{ titleKey: 'page.commEval',    subKey: 'page.commEval.sub' },
  '/scm-tech-review':     { titleKey: 'page.scmTechReview',     subKey: 'page.scmTechReview.sub' },
  '/scm-review':          { titleKey: 'page.scmAwardReview',    subKey: 'page.scmAwardReview.sub' },
  '/scm-contract-review': { titleKey: 'page.scmContractReview', subKey: 'page.scmContractReview.sub' },
  '/contract':       { titleKey: 'page.contract',    subKey: 'page.contract.sub' },
  '/legal-review':   { titleKey: 'page.legalReview',      subKey: 'page.legalReview.sub' },
  '/contract-execution': { titleKey: 'page.contractExecution', subKey: 'page.contractExecution.sub' },
  '/contract-management':{ titleKey: 'page.contractManagement', subKey: 'page.contractManagement.sub' },
  '/contract-closure':   { titleKey: 'page.contractClosure',    subKey: 'page.contractClosure.sub' },
  '/audit-log':      { titleKey: 'page.auditLog',    subKey: 'page.auditLog.sub' },
  '/users':          { titleKey: 'page.users',       subKey: 'page.users.sub' },
}

// The roles that review and approve ITT sections rather than author the ITT —
// they reach /create-itt through the same route, but the page is a review desk
// for them, so its title says so (see ITTCreation's own header).
const ITT_REVIEWER_ROLES = ['pof', 'hse', 'icv']

export default function MainLayout({ children }) {
  const { pathname } = useLocation()
  const { lang, t } = useLanguage()
  const { user } = useAuth()
  const isRtl = lang === 'ar'

  const basePath = '/' + pathname.split('/')[1]
  let meta = pageMeta[basePath] || { titleKey: 'page.dashboard', subKey: '' }
  if (basePath === '/create-itt' && ITT_REVIEWER_ROLES.includes(user?.role?.id)) {
    meta = { titleKey: 'page.ittReviewApprove', subKey: 'page.ittReviewApprove.sub' }
  }

  return (
    <div className="app-root flex min-h-screen">
      <Header title={t(meta.titleKey)} subtitle={meta.subKey ? t(meta.subKey) : ''} />
      <Sidebar />
      <div className={`flex-1 ${isRtl ? 'mr-[220px]' : 'ml-[220px]'} flex flex-col pt-16`}>
        <main className="flex-1 p-6 overflow-auto fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
