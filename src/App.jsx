import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
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
          <button onClick={() => window.location.href = '/dashboard'} style={{ marginTop: 16, padding: '8px 16px', cursor: 'pointer' }}>Go to Dashboard</button>
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
import ExcelViewer from './pages/ExcelViewer'
import DocxViewer from './pages/DocxViewer'

function AdminRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'it_admin' && user?.role?.id !== 'biz_admin') return <Navigate to="/dashboard" replace />
  return children
}

function TechEvalRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'tech_eval') return <Navigate to="/dashboard" replace />
  return children
}

function CommEvalRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'comm_eval') return <Navigate to="/dashboard" replace />
  return children
}

function MgmtReviewRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'mgmt_review') return <Navigate to="/dashboard" replace />
  return children
}

function PofRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'pof') return <Navigate to="/dashboard" replace />
  return children
}

function LegalReviewRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'legal_review') return <Navigate to="/dashboard" replace />
  return children
}

function ContractHolderRoute({ children }) {
  const { user } = useAuth()
  if (user?.role?.id !== 'contract_holder') return <Navigate to="/dashboard" replace />
  return children
}

function ProtectedRoutes() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <MainLayout>
      <ErrorBoundary>
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tenders" element={<TenderList />} />
          <Route path="/contract-strategy" element={<ContractHolderRoute><ContractStrategy /></ContractHolderRoute>} />
          <Route path="/contract-strategy/:tenderId" element={<ContractHolderRoute><ContractStrategy /></ContractHolderRoute>} />
          <Route path="/strategy-templates/:tenderId" element={<ContractHolderRoute><StrategyTemplatesDashboard /></ContractHolderRoute>} />
          <Route path="/pre-qualification" element={<ContractHolderRoute><PreQualification /></ContractHolderRoute>} />
          <Route path="/pre-qualification/:tenderId" element={<ContractHolderRoute><PreQualification /></ContractHolderRoute>} />
          <Route path="/create-itt" element={<PofRoute><ITTCreation /></PofRoute>} />
          <Route path="/create-itt/:tenderId" element={<PofRoute><ITTCreation /></PofRoute>} />
          <Route path="/upload" element={<PofRoute><BidderUpload /></PofRoute>} />
          <Route path="/upload/:tenderId" element={<PofRoute><BidderUpload /></PofRoute>} />
          <Route path="/technical-eval" element={<TechEvalRoute><TechnicalEvaluation /></TechEvalRoute>} />
          <Route path="/technical-eval/:tenderId" element={<TechEvalRoute><TechnicalEvaluation /></TechEvalRoute>} />
          <Route path="/commercial-eval" element={<CommEvalRoute><CommercialEvaluation /></CommEvalRoute>} />
          <Route path="/commercial-eval/:tenderId" element={<CommEvalRoute><CommercialEvaluation /></CommEvalRoute>} />
          <Route path="/mgmt-review" element={<MgmtReviewRoute><AwardRecommendation /></MgmtReviewRoute>} />
          <Route path="/mgmt-review/:tenderId" element={<MgmtReviewRoute><AwardRecommendation /></MgmtReviewRoute>} />
          <Route path="/contract" element={<PofRoute><ContractTemplate /></PofRoute>} />
          <Route path="/contract/:tenderId" element={<PofRoute><ContractTemplate /></PofRoute>} />
          <Route path="/legal-review" element={<LegalReviewRoute><LegalReview /></LegalReviewRoute>} />
          <Route path="/legal-review/:tenderId" element={<LegalReviewRoute><LegalReview /></LegalReviewRoute>} />
          <Route path="/contract-execution" element={<PofRoute><ContractExecution /></PofRoute>} />
          <Route path="/contract-execution/:tenderId" element={<PofRoute><ContractExecution /></PofRoute>} />
          <Route path="/contract-management" element={<PofRoute><ContractManagement /></PofRoute>} />
          <Route path="/contract-management/:tenderId" element={<PofRoute><ContractManagement /></PofRoute>} />
          <Route path="/contract-closure" element={<PofRoute><ContractClosure /></PofRoute>} />
          <Route path="/contract-closure/:tenderId" element={<PofRoute><ContractClosure /></PofRoute>} />
          <Route path="/audit-log" element={<AdminRoute><AuditLog /></AdminRoute>} />
          <Route path="/users" element={<AdminRoute><UserManagement /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
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
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/excel-viewer" element={<ExcelViewer />} />
                  <Route path="/docx-viewer" element={<DocxViewer />} />
                  <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
              </LanguageProvider>
            </TenderProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
