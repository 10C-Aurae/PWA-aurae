import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as ticketsApi from '../api/ticketsApi'
import TicketCard from '../components/TicketCard'
import FeedbackModal from '../components/FeedbackModal'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { TicketX, Clock, XCircle } from 'lucide-react'

const FILTROS = [
  { id: 'todos',     label: 'Todos' },
  { id: 'activo',    label: 'Activos' },
  { id: 'usado',     label: 'Usados' },
  { id: 'cancelado', label: 'Cancelados' },
  { id: 'expirado',  label: 'Expirados' },
]

function usadoReciente(ticket) {
  if (ticket.status_uso !== 'usado' || !ticket.fecha_uso) return false
  return Date.now() - new Date(ticket.fecha_uso).getTime() < 2 * 60 * 60 * 1000
}

export default function MisTickets() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filtro, setFiltro] = useState('todos')
  const [feedbackTicket, setFeedbackTicket] = useState(null)
  const [cancelando, setCancelando]         = useState(null)   // ticket id en proceso
  const [confirmCancel, setConfirmCancel]   = useState(null)   // ticket id esperando confirm

  const fetchTickets = async () => {
    if (!user?.id) return
    setLoading(true); setError(null)
    try {
      const res = await ticketsApi.porUsuario(user.id)
      setTickets(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar tickets')
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchTickets() }, [user?.id])

  const handleCancelar = async (ticketId) => {
    if (confirmCancel !== ticketId) { setConfirmCancel(ticketId); return }
    setCancelando(ticketId); setConfirmCancel(null)
    try {
      await ticketsApi.cancelar(ticketId)
      await fetchTickets()
    } catch {
      // ignorar — el ticket seguirá activo
    } finally {
      setCancelando(null)
    }
  }

  const filtered = filtro === 'todos' ? tickets : tickets.filter((t) => t.status_uso === filtro)

  return (
    <div className="page">
      <div className="mx-auto max-w-2xl md:max-w-4xl space-y-5">

        <div>
          <h1 className="page-title">Mis Tickets</h1>
          <p className="page-subtitle">Gestiona tus entradas a eventos</p>
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {FILTROS.map((f) => (
            <button key={f.id} onClick={() => setFiltro(f.id)}
              className={filtro === f.id ? 'chip-active' : 'chip-idle'}>
              {f.label}
            </button>
          ))}
        </div>

        {loading && <LoadingSpinner center />}
        {error   && <ErrorMessage message={error} onRetry={fetchTickets} />}

        {!loading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fade-in">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-aura-card border border-aura-border shadow-card">
              <TicketX size={28} strokeWidth={1.5} className="text-aura-faint" />
            </div>
            <p className="font-bold text-aura-ink">
              {filtro === 'todos' ? 'Aún no tienes tickets' : `Sin tickets "${filtro}"`}
            </p>
            <p className="mt-1 text-sm text-aura-muted">
              {filtro === 'todos' ? 'Explora eventos y compra tu primera entrada' : 'Prueba otro filtro'}
            </p>
            {filtro === 'todos' && (
              <Link to="/eventos" className="mt-4 btn-primary text-xs py-2 px-5">Ver eventos</Link>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="space-y-1.5">
                <TicketCard ticket={ticket} />

                {ticket.status_uso === 'activo' && (
                  <div className="flex items-center justify-end gap-2">
                    {confirmCancel === ticket.id ? (
                      <>
                        <span className="text-xs text-aura-muted">¿Cancelar ticket?</span>
                        <button
                          onClick={() => handleCancelar(ticket.id)}
                          disabled={cancelando === ticket.id}
                          className="rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-1 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors"
                        >
                          {cancelando === ticket.id ? <LoadingSpinner size="sm" /> : 'Confirmar'}
                        </button>
                        <button onClick={() => setConfirmCancel(null)} className="text-xs text-aura-faint hover:text-aura-muted transition-colors">
                          No
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleCancelar(ticket.id)}
                        className="inline-flex items-center gap-1 text-[11px] text-aura-faint hover:text-red-400 transition-colors"
                      >
                        <XCircle size={12} strokeWidth={1.5} /> Cancelar ticket
                      </button>
                    )}
                  </div>
                )}

                {usadoReciente(ticket) && (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-aura-secondary/30 bg-aura-secondary/8 px-4 py-3 animate-fade-in">
                    <p className="text-xs text-amber-700 leading-snug">
                      ¿Cómo estuvo? Comparte y gana <span className="font-bold">+5 Aura</span>
                    </p>
                    <button
                      onClick={() => setFeedbackTicket(ticket)}
                      className="flex-shrink-0 rounded-lg bg-aura-secondary/20 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-aura-secondary/30 transition-colors"
                    >
                      Compartir →
                    </button>
                  </div>
                )}

                {ticket.status_uso === 'usado' && ticket.evento_id && (
                  <Link to={`/capsula/${ticket.evento_id}`}
                    className="flex items-center justify-end gap-1.5 text-xs text-aura-muted hover:text-aura-primary transition-colors">
                    <Clock size={12} strokeWidth={1.5} />
                    Ver cápsula del tiempo
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {feedbackTicket && (
        <FeedbackModal
          stand={{ nombre: `Evento del ticket ${feedbackTicket.tipo}` }}
          onSubmit={() => setFeedbackTicket(null)}
          onClose={() => setFeedbackTicket(null)}
        />
      )}
    </div>
  )
}
