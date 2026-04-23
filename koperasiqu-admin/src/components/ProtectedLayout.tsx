import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from './Sidebar'

export const ProtectedLayout = () => {
  const { auth } = useAuth()
  if (!auth) return <Navigate to="/login" replace />
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-auto" style={{ marginLeft: 'var(--sidebar-w)' }}>
        <Outlet />
      </main>
    </div>
  )
}
