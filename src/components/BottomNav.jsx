import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Home, PlusCircle, Ticket, Sparkles, User, LogIn, Calendar } from 'lucide-react'

const HIDDEN_PATHS = ['/login', '/registro']

export default function BottomNav() {
  const { user, token } = useAuth()
  const location = useLocation()

  if (HIDDEN_PATHS.includes(location.pathname)) return null

  const authedTabs = [
    { to: '/dashboard',              Icon: Home,        label: 'Inicio'  },
    { to: '/admin/eventos/nuevo',    Icon: PlusCircle,  label: 'Crear'   },
    { to: '/mis-tickets',            Icon: Ticket,      label: 'Tickets' },
    { to: `/aura/${user?.id}`,       Icon: Sparkles,    label: 'Aura'    },
    { to: '/perfil',                 Icon: User,        label: 'Perfil'  },
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
                isActive ? 'text-aura-secondary' : 'text-stone-500 hover:text-stone-300'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={`transition-transform duration-200 ${isActive ? 'scale-110' : ''}`}>
                  <tab.Icon size={20} strokeWidth={1.5} />
                </span>
                <span className="text-[10px] font-semibold">{tab.label}</span>
                <span
                  className={`h-0.5 w-5 rounded-full transition-all duration-200 ${
                    isActive ? 'bg-aura-secondary opacity-100' : 'opacity-0'
                  }`}
                />
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
