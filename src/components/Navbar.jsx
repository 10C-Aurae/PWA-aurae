import { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuraBadge from './AuraBadge'
import NotificacionesPanel from './NotificacionesPanel'
import { LogOut, Plus, Sparkles } from 'lucide-react'
import * as notifApi from '../api/notificacionesApi'

const HIDDEN_PATHS = ['/login', '/registro']

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const location = useLocation()
  const [noLeidas, setNoLeidas] = useState(0)

  const fetchNoLeidas = async () => {
    if (!token) return
    try {
      const res = await notifApi.noLeidas()
      setNoLeidas(res.data?.no_leidas ?? 0)
    } catch { /* ignore */ }
  }

  useEffect(() => {
    fetchNoLeidas()
    const interval = setInterval(fetchNoLeidas, 30000)
    return () => clearInterval(interval)
  }, [token])

  if (HIDDEN_PATHS.includes(location.pathname)) return null
  if (location.pathname.endsWith('/chat')) return null
  if (location.pathname.startsWith('/staff')) return null
  if (/^\/stands\/[^/]+\/chat/.test(location.pathname)) return null

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${
      isActive ? '' : 'text-stone-400 hover:text-stone-100'
    }`
  const linkStyle = ({ isActive }) =>
    isActive ? { color: 'var(--user-aura)' } : {}

  return (
    <header className="sticky top-0 z-40 bg-aura-nav shadow-nav">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-14 items-center justify-between gap-4">

          {/* Logo */}
          <Link
            to={token ? '/dashboard' : '/eventos'}
            className="flex-shrink-0 flex items-center gap-2"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-aura-user shadow-glow-sm hover:shadow-glow transition-all duration-300 hover:scale-110 hover:rotate-12">
              <Sparkles size={15} color="white" strokeWidth={2} />
            </span>
            <span className="text-base font-extrabold tracking-tight gradient-text-animate">
              Aurae
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <NavLink to="/eventos"    className={linkCls} style={linkStyle}>Explorar</NavLink>
            {token && (
              <>
                <NavLink to="/mis-tickets" className={linkCls} style={linkStyle}>Tickets</NavLink>
                <NavLink to="/admin"       className={linkCls} style={linkStyle}>Mis eventos</NavLink>
                <Link
                  to="/admin/eventos/nuevo"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-aura-user px-3.5 py-1.5 text-xs font-semibold text-white shadow-glow-sm transition-all duration-200 hover:scale-[1.03]"
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
                <NotificacionesPanel noLeidas={noLeidas} onLeer={fetchNoLeidas} />
                <Link
                  to={`/aura/${user.id}`}
                  className="hidden sm:flex rounded-full transition-all duration-300"
                  style={{ boxShadow: '0 0 0 2px var(--user-aura), 0 0 10px var(--user-aura-20)' }}
                >
                  <AuraBadge puntos={user.aura_puntos ?? 0} intereses={user.vector_intereses ?? []} size="sm" darkMode />
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
                className="rounded-xl bg-aura-user px-4 py-1.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-200 hover:scale-[1.03]"
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
