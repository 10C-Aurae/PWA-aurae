import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import * as eventosApi from '../../api/eventosApi'
import client from '../../api/client'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { CalendarDays, MapPin, Ticket, BarChart2, Users, Radio } from 'lucide-react'

const ADMIN_LINKS = [
  { to: '/admin/eventos',    Icon: CalendarDays, label: 'Gestionar Eventos', desc: 'Crear, editar y eliminar eventos',  accent: 'border-aura-primary/30 hover:border-aura-primary' },
  { to: '/admin/eventos',    Icon: MapPin,       label: 'Gestionar Stands',  desc: 'Selecciona un evento para ver sus stands', accent: 'border-purple-300 hover:border-purple-400' },
  { to: '/admin/tickets/1',  Icon: Ticket,       label: 'Ver Tickets',       desc: 'Gestionar entradas por evento',     accent: 'border-emerald-300 hover:border-emerald-400' },
  { to: '/admin/reportes/1', Icon: BarChart2,    label: 'Reportes',          desc: 'Métricas y gráficas del evento',   accent: 'border-amber-300 hover:border-amber-400' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState({ eventos: 0, usuarios: 0, tickets: 0, interacciones: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const [evRes, usrRes] = await Promise.all([
          eventosApi.listar(0, 100),
          client.get('/usuarios/', { params: { skip: 0, limit: 100 } }).catch(() => ({ data: [] })),
        ])
        setStats({
          eventos:       Array.isArray(evRes.data)  ? evRes.data.length  : 0,
          usuarios:      Array.isArray(usrRes.data) ? usrRes.data.length : 0,
          tickets:       0,
          interacciones: 0,
        })
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar estadísticas')
      } finally { setLoading(false) }
    }
    fetchStats()
  }, [])

  const STAT_CARDS = [
    { label: 'Eventos',       value: stats.eventos,       Icon: CalendarDays, valueColor: 'text-aura-primary' },
    { label: 'Usuarios',      value: stats.usuarios,      Icon: Users,        valueColor: 'text-purple-600' },
    { label: 'Tickets',       value: stats.tickets,       Icon: Ticket,       valueColor: 'text-emerald-600' },
    { label: 'Interacciones', value: stats.interacciones, Icon: Radio,        valueColor: 'text-aura-secondary' },
  ]

  return (
    <div className="page">
      <div className="mx-auto max-w-4xl space-y-6">

        <div>
          <h1 className="page-title">Mis Eventos</h1>
          <p className="page-subtitle">Gestiona los eventos que organizas</p>
        </div>

        {loading && <LoadingSpinner center />}
        {error   && <ErrorMessage message={error} />}

        {!loading && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {STAT_CARDS.map((card) => (
                <div key={card.label} className="stat-card animate-fade-in">
                  <card.Icon size={22} strokeWidth={1.5} className="text-aura-faint" />
                  <p className={`text-3xl font-extrabold tabular-nums ${card.valueColor}`}>
                    {card.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-aura-muted font-semibold">{card.label}</p>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div>
              <p className="text-xs font-bold text-aura-muted uppercase tracking-wider mb-3">Acciones rápidas</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {ADMIN_LINKS.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={`flex items-center gap-4 rounded-2xl border bg-aura-card p-4 transition-all duration-200 shadow-card hover:shadow-card-md animate-fade-in ${link.accent}`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-aura-surface">
                      <link.Icon size={18} strokeWidth={1.5} className="text-aura-muted" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-aura-ink leading-tight">{link.label}</p>
                      <p className="text-xs text-aura-muted mt-0.5 truncate">{link.desc}</p>
                    </div>
                    <svg xmlns="http://www.w3.org/2000/svg" className="ml-auto h-4 w-4 flex-shrink-0 text-aura-faint" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
