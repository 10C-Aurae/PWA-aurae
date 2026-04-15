import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import AuraBadge from './AuraBadge'
import NotificacionesPanel from './NotificacionesPanel'
import { LogOut, Plus, Sparkles } from 'lucide-react'
import * as notifApi from '../api/notificacionesApi'

const WS_BASE = import.meta.env.VITE_API_BASE_URL
  ?.replace(/^https?/, (p) => (p === 'https' ? 'wss' : 'ws'))
  ?.replace(/\/api\/v1\/?$/, '')

const HIDDEN_PATHS = ['/login', '/registro']

export default function Navbar() {
  const { user, token, logout } = useAuth()
  const location = useLocation()
  const [noLeidas, setNoLeidas] = useState(0)
  const wsRef = useRef(null)

  // Carga inicial del badge
  const fetchNoLeidas = async () => {
    if (!token) return
    try {
      const res = await notifApi.noLeidas()
      setNoLeidas(res.data?.no_leidas ?? 0)
    } catch { /* ignore */ }
  }

  // WebSocket para notificaciones en tiempo real
  useEffect(() => {
    if (!token || !user?.id) return

    fetchNoLeidas()

    const url = `${WS_BASE}/api/v1/colas/ws/${user.id}?token=${token}`
    let ws
    let reconnectTimeout

    const connect = () => {
      ws = new WebSocket(url)
      wsRef.current = ws

      ws.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data)
          if (msg.tipo === 'notificacion') {
            setNoLeidas(msg.no_leidas ?? ((prev) => prev + 1))
          }
        } catch { /* ignore */ }
      }

      ws.onclose = () => {
        // Reconectar en 5s si se cierra inesperadamente
        reconnectTimeout = setTimeout(connect, 5000)
      }

      ws.onerror = () => ws.close()
    }

    connect()

    return () => {
      clearTimeout(reconnectTimeout)
      ws?.close()
    }
  }, [token, user?.id])

  if (HIDDEN_PATHS.includes(location.pathname)) return null
  if (location.pathname.endsWith('/chat')) return null
  if (location.pathname.startsWith('/staff')) return null
  if (/^\/stands\/[^/]+\/chat/.test(location.pathname)) return null

  const linkCls = ({ isActive }) =>
    `text-sm font-medium transition-colors duration-200 ${isActive ? '' : 'text-stone-400 hover:text-stone-100'
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
            <NavLink to="/eventos" className={linkCls} style={linkStyle}>Explorar</NavLink>
            {token && (
              <>
                <NavLink to="/mis-tickets" className={linkCls} style={linkStyle}>Tickets</NavLink>
                <NavLink to="/admin" className={linkCls} style={linkStyle}>Mis eventos</NavLink>
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
                  className="hidden sm:flex items-center gap-2 rounded-full px-2.5 py-1 transition-all duration-300 hover:bg-white/5"
                  style={{
                    boxShadow: '0 0 0 1.5px var(--user-aura), 0 0 12px var(--user-aura-20)',
                    background: 'rgba(255,255,255,0.03)'
                  }}
                >
                  <AuraBadge puntos={user.aura_puntos ?? 0} intereses={user.vector_intereses ?? []} size="sm" darkMode inline />
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
