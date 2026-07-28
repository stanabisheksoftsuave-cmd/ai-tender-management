import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom'
import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null } }
  static getDerivedStateFromError(e) { return { error: e } }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff1f0', minHeight: '100vh' }}>
          <h2 style={{ color: '#d32f2f' }}>Runtime Error</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#333' }}>{this.state.error?.message}</pre>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 11, color: '#666' }}>{this.state.error?.stack}</pre>
          {/* '/' resolves to whichever landing page the signed-in role may open. */}
          <button onClick={() => window.location.href = '/'} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>Go to Home</button>
        </div>
      )
    }
    return this.props.children
  }
}
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { TenderProvider } from './context/TenderContext'
import { LanguageProvider } from './context/LanguageContext'
import { NavigationProvider } from './context/NavigationContext'
import MainLayout from './components/layout/MainLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TenderList from './pages/TenderList'
import ITTCreation from './pages/ITTCreation'
import BidderUpload from './pages/BidderUpload'
import TechnicalEvaluation from './pages/TechnicalEvaluation'
import CommercialEvaluation from './pages/CommercialEvaluation'
import AwardRecommendation from './pages/AwardRecommendation'
import ContractTemplate from './pages/ContractTemplate'
import AuditLog from './pages/AuditLog'
import UserManagement from './pages/UserManagement'
import ContractStrategy from './pages/ContractStrategy'
import PreQualification from './pages/PreQualification'
import LegalReview from './pages/LegalReview'
import ContractExecution from './pages/ContractExecution'
import ContractManagement from './pages/ContractManagement'
import ContractClosure from './pages/ContractClosure'
import StrategyTemplatesDashboard from './pages/StrategyTemplatesDashboard'
import PsfStrategy from './pages/PsfStrategy'
import ExcelViewer from './pages/ExcelViewer'
import DocxViewer from './pages/DocxViewer'
import { canAccess, isKnownRoute, landingPath } from './utils/permissions'

// Both /create-itt (picker) and /create-itt/:tenderId (a specific ITT) render
// ITTCreation. Keying it by the tender id forces a fresh mount when you switch
// between them — otherwise the wizard keeps its previous step, and a generated
// ITT opened from the picker would wrongly show the "being prepared" screen.
function CreateIttRoute() {
  const { tenderId } = useParams()
  return <ITTCreation key={tenderId || 'picker'} />
}

/*
 * Every protected route is authorised here, against the shared ROUTE_ROLES map
 * in utils/permissions — the same map the sidebar filters its menu with. The
 * check runs on the URL itself, so it applies equally to a click, a typed-in
 * address, a refresh and a deep link; unknown paths fall through to the
 * catch-all below. Denied users go to the landing page their own role can open.
 */
function ProtectedRoutes() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  if (!user) return <Navigate to="/login" replace />

  const roleId = user.role?.id
  const home = landingPath(roleId)
  if (isKnownRoute(pathname) && !canAccess(roleId, pathname)) {
    return <Navigate to={home} replace />
  }

  return (
    <MainLayout>
      <ErrorBoundary>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tenders" element={<TenderList />} />
          <Route path="/contract-strategy" element={<ContractStrategy />} />
          <Route path="/contract-strategy/:tenderId" element={<ContractStrategy />} />
          <Route path="/strategy-templates/:tenderId" element={<StrategyTemplatesDashboard />} />
          <Route path="/psf-strategy/:tenderId" element={<PsfStrategy />} />
          <Route path="/pre-qualification" element={<PreQualification />} />
          <Route path="/pre-qualification/:tenderId" element={<PreQualification />} />
          <Route path="/create-itt" element={<CreateIttRoute />} />
          <Route path="/create-itt/:tenderId" element={<CreateIttRoute />} />
          <Route path="/upload" element={<BidderUpload />} />
          <Route path="/upload/:tenderId" element={<BidderUpload />} />
          <Route path="/technical-eval" element={<TechnicalEvaluation />} />
          <Route path="/technical-eval/:tenderId" element={<TechnicalEvaluation />} />
          <Route path="/commercial-eval" element={<CommercialEvaluation />} />
          <Route path="/commercial-eval/:tenderId" element={<CommercialEvaluation />} />
          <Route path="/mgmt-review" element={<AwardRecommendation />} />
          <Route path="/mgmt-review/:tenderId" element={<AwardRecommendation />} />
          <Route path="/contract" element={<ContractTemplate />} />
          <Route path="/contract/:tenderId" element={<ContractTemplate />} />
          <Route path="/legal-review" element={<LegalReview />} />
          <Route path="/legal-review/:tenderId" element={<LegalReview />} />
          <Route path="/contract-execution" element={<ContractExecution />} />
          <Route path="/contract-execution/:tenderId" element={<ContractExecution />} />
          <Route path="/contract-management" element={<ContractManagement />} />
          <Route path="/contract-management/:tenderId" element={<ContractManagement />} />
          <Route path="/contract-closure" element={<ContractClosure />} />
          <Route path="/contract-closure/:tenderId" element={<ContractClosure />} />
          <Route path="/audit-log" element={<AuditLog />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="*" element={<Navigate to={home} replace />} />
        </Routes>
      </ErrorBoundary>
    </MainLayout>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <TenderProvider>
              <LanguageProvider>
                <NavigationProvider>
                  <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/excel-viewer" element={<ExcelViewer />} />
                    <Route path="/docx-viewer" element={<DocxViewer />} />
                    <Route path="/*" element={<ProtectedRoutes />} />
                  </Routes>
                </NavigationProvider>
              </LanguageProvider>
            </TenderProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
