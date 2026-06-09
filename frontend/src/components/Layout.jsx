import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { to: '/',             label: 'Dashboard',   icon: '🏠' },
  { to: '/transactions', label: 'Transações',  icon: '📋' },
  { to: '/add',          label: 'Nova',        icon: '➕' },
  { to: '/notifications',label: 'Alertas',     icon: '🔔' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-dark-800 border-b border-dark-600 px-6 h-14 flex items-center justify-between sticky top-0 z-20">
        <span className="font-bold text-lg">
          💰 <span className="text-green-400">Finanças</span>Pro
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-400">
            Olá, <span className="text-slate-100 font-semibold">{user?.name?.split(' ')[0]}</span>
          </span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 border border-dark-600 px-3 py-1.5 rounded-lg
                       hover:bg-red-400/10 hover:border-red-400 transition-all"
          >
            Sair
          </button>
        </div>
      </header>

      {/* Nav */}
      <nav className="bg-dark-800 border-b border-dark-600 px-4 flex gap-1">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `px-4 py-3.5 text-sm font-semibold border-b-2 transition-all ${
                isActive
                  ? 'text-green-400 border-green-400'
                  : 'text-slate-400 border-transparent hover:text-slate-100'
              }`
            }
          >
            {icon} {label}
          </NavLink>
        ))}
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-7">
        <Outlet />
      </main>
    </div>
  )
}
