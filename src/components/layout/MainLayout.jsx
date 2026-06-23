import Sidebar from './Sidebar'
import Header from './Header'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

const pageMeta = {
  '/dashboard':      { titleKey: 'page.dashboard',  subKey: 'page.dashboard.sub' },
  '/tenders':        { titleKey: 'page.tenders',     subKey: 'page.tenders.sub' },
  '/create-itt':     { titleKey: 'page.createItt',   subKey: 'page.createItt.sub' },
  '/upload':         { titleKey: 'page.ingestion',   subKey: 'page.ingestion.sub' },
  '/technical-eval': { titleKey: 'page.techEval',    subKey: 'page.techEval.sub' },
  '/commercial-eval':{ titleKey: 'page.commEval',    subKey: 'page.commEval.sub' },
  '/legal-review':   { titleKey: 'page.legalReview', subKey: 'page.legalReview.sub' },
  '/mgmt-review':    { titleKey: 'page.mgmtReview',  subKey: 'page.mgmtReview.sub' },
  '/contract':       { titleKey: 'page.contract',    subKey: 'page.contract.sub' },
  '/audit-log':      { titleKey: 'page.auditLog',    subKey: 'page.auditLog.sub' },
  '/system':         { titleKey: 'page.system',      subKey: 'page.system.sub' },
  '/users':          { titleKey: 'page.users',       subKey: 'page.users.sub' },
}

export default function MainLayout({ children }) {
  const { pathname } = useLocation()
  const { lang, t } = useLanguage()
  const isRtl = lang === 'ar'

  const basePath = '/' + pathname.split('/')[1]
  const meta = pageMeta[basePath] || { titleKey: 'page.dashboard', subKey: '' }

  return (
    <div className="app-root flex min-h-screen">
      <Sidebar />
      <div className={`flex-1 ${isRtl ? 'mr-[232px]' : 'ml-[232px]'} flex flex-col min-h-screen`}>
        <Header title={t(meta.titleKey)} subtitle={meta.subKey ? t(meta.subKey) : ''} />
        <main className="flex-1 p-6 overflow-auto fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
