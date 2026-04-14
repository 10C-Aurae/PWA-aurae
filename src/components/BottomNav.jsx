import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Home, CalendarDays, Ticket, Sparkles, User, LogIn, Calendar } from 'lucide-react'

const HIDDEN_PATHS = ['/login', '/registro']

export default function BottomNav() {
  const { user, token } = useAuth()
  const location = useLocation()

  if (HIDDEN_PATHS.includes(location.pathname)) return null
  if (location.pathname.endsWith('/chat')) return null

  const authedTabs = [
    { to: '/dashboard',   Icon: Home,         label: 'Inicio'    },
    { to: '/admin',       Icon: CalendarDays, label: 'Mis eventos' },
    { to: '/mis-tickets', Icon: Ticket,       label: 'Tickets'   },
    { to: `/aura/${user?.id}`, Icon: Sparkles, label: 'Aura'     },
    { to: '/perfil',      Icon: User,         label: 'Perfil'    },
  ]

  const guestTabs = [
    { to: '/eventos', Icon: Calendar, label: 'Eventos' },
    { to: '/login',   Icon: LogIn,    label: 'Entrar' },
  ]

  const tabs = token ? authedTabs : guestTabs

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-aura-nav border-t border-white/10 shadow-nav pb-safe">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-all duration-200 ${
                isActive ? 'text-aura-primary' : 'text-aura-faint hover:text-aura-muted'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}
                  style={isActive ? { color: 'var(--user-aura)' } : {}}
                >
                  <tab.Icon size={20} strokeWidth={1.5} />
                </span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
                <span
                  className={`h-0.5 rounded-full transition-all duration-300 ${isActive ? 'w-6 opacity-100' : 'w-2 opacity-0'}`}
                  style={isActive ? { background: 'linear-gradient(90deg, #FF5C5C, var(--user-aura))', boxShadow: '0 0 8px var(--user-aura-20)' } : {}}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
