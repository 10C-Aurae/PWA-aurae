import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuraBadge from './AuraBadge'
import { LogOut, Plus, Sparkles } from 'lucide-react'

const HIDDEN_PATHS = ['/login', '/registro']

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const location = useLocation()

  if (HIDDEN_PATHS.includes(location.pathname)) return null

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive
        ? 'text-white'
        : 'text-stone-400 hover:text-stone-100'
    }`

  return (
    <header className="sticky top-0 z-40 bg-aura-nav shadow-nav">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link
            to={token ? '/dashboard' : '/eventos'}
            className="flex-shrink-0 flex items-center gap-2"
          >
            {/* Orange dot indicator */}
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-aura-gradient shadow-glow-sm">
              <Sparkles size={15} color="white" strokeWidth={2} />
            </span>
            <span className="text-base font-extrabold text-white tracking-tight">
              Aurae
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/eventos"    className={linkCls}>Explorar</NavLink>
            {token && (
              <>
                <NavLink to="/mis-tickets" className={linkCls}>Tickets</NavLink>
                <NavLink to="/admin"       className={linkCls}>Admin</NavLink>
                <Link
                  to="/admin/eventos/nuevo"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-aura-primary px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-aura-primary-dark shadow-glow-sm hover:shadow-glow transition-all duration-200"
                >
                  <Plus size={13} strokeWidth={2.5} />
                  Crear evento
                </Link>
              </>
            )}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            {token && user ? (
              <>
                <Link to={`/aura/${user.id}`} className="hidden sm:flex">
                  <AuraBadge puntos={user.aura_puntos ?? 0} size="sm" darkMode />
                </Link>
                <button
                  onClick={logout}
                  className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-stone-400 transition-all duration-200 hover:border-red-400/40 hover:text-red-400"
                >
                  <LogOut size={14} strokeWidth={1.5} />
                  Salir
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="rounded-xl bg-aura-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-aura-primary-dark shadow-glow-sm transition-all duration-200"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
