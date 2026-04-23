import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { ProtectedLayout } from './components/ProtectedLayout'
import LoginPage    from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import MembersPage  from './pages/MembersPage'
import LoansPage    from './pages/LoansPage'
import ApprovalPage from './pages/ApprovalPage'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedLayout />}>
            <Route path="/"        element={<DashboardPage />} />
            <Route path="/members" element={<MembersPage />}  />
            <Route path="/loans"   element={<LoansPage />}    />
            <Route path="/approval" element={<ApprovalPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
    </AuthProvider>
  )
}
