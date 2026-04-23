import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Users, ClipboardList,
  CheckCircle, LogOut, Building2, ShieldCheck, Shield
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getAdminRoleFromToken } from '../lib/jwt'

const links = [
  { to: '/',        icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/members', icon: Users,           label: 'Anggota'     },
  { to: '/loans',   icon: ClipboardList,   label: 'Pinjaman'    },
  { to: '/approval',icon: CheckCircle,     label: 'Approval'    },
]

export default function Sidebar() {
  const { auth, logout } = useAuth()
  const adminRole = getAdminRoleFromToken()
  const isManager = adminRole === 'Manager'

  return (
    <aside
      className="fixed left-0 top-0 h-screen bg-indigo-900 flex flex-col z-40"
      style={{ width: 'var(--sidebar-w)' }}
    >
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-indigo-800">
        <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm">KoperasiQu</p>
          <p className="text-indigo-300 text-xs">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : 'text-indigo-300 hover:text-white hover:bg-indigo-800'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + Role + Logout */}
      <div className="px-3 py-4 border-t border-indigo-800">
        <div className="px-4 py-2 mb-2">
          <p className="text-white text-xs font-medium truncate">{auth?.fullName}</p>
          <p className="text-indigo-400 text-xs">{auth?.username}</p>
          {/* Role Badge */}
          <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
            isManager
              ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-500/30'
              : 'bg-blue-400/20 text-blue-300 border border-blue-500/30'
          }`}>
            {isManager ? <ShieldCheck size={10} /> : <Shield size={10} />}
            {isManager ? 'Ketua Manager' : 'Staf Operasional'}
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm
                     text-red-400 hover:text-red-300 hover:bg-indigo-800 transition-all"
        >
          <LogOut size={16} />
          Keluar
        </button>
      </div>
    </aside>
  )
}
