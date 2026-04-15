import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import * as eventosApi  from '../api/eventosApi'
import * as standsApi   from '../api/standsApi'
import * as feedbackApi from '../api/feedbackApi'
import * as ticketsApi  from '../api/ticketsApi'
import * as colaApi     from '../api/colaApi'
import { useAuth } from '../hooks/useAuth'
import { QrCode, MapPin, Calendar, Clock, Users, Ticket, ChevronLeft, ChevronDown, ChevronUp, Wand2, Map, Lock, DollarSign, Pencil, MessageCircle, CheckCircle } from 'lucide-react'
import { formatDateTime } from '../utils/formatDate'
import StandCard from '../components/StandCard'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import ChatbotEvento from '../components/ChatbotEvento'

export default function EventoDetalle() {
  const { id } = useParams()
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [evento, setEvento] = useState(null)
  const [stands, setStands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tieneTicket, setTieneTicket] = useState(false)
  const [colaJoin,  setColaJoin]  = useState({})   // key → { status: 'loading'|'joined'|'error', hora_estimada? }
  const [colaError, setColaError] = useState({})   // key → mensaje de error
  const [ratings,   setRatings]   = useState({})   // standId → promedio
  const [standsOpen, setStandsOpen] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null)
      try {
        const requests = [eventosApi.obtener(id), standsApi.porEvento(id)]
        if (user?.id) requests.push(ticketsApi.porUsuario(user.id))

        const [evRes, standsRes, ticketsRes] = await Promise.all(requests)
        setEvento(evRes.data)
        const standsArr = standsRes.data
        setStands(standsArr)

        if (ticketsRes) {
          const tickets = ticketsRes.data ?? []
          setTieneTicket(tickets.some((t) => String(t.evento_id) === String(id)))
        }

        // Cargar colas activas del usuario para pre-marcar stands
        if (user?.id) {
          try {
            const misTurnosRes = await colaApi.misTurnos()
            const turnosActivos = misTurnosRes.data ?? []
            const colaPreCargada = {}
            turnosActivos.forEach((t) => {
              const key = t.servicio_id ? `${t.stand_id}__${t.servicio_id}` : t.stand_id
              colaPreCargada[key] = { status: 'joined', hora_estimada: t.hora_estimada }
            })
            if (Object.keys(colaPreCargada).length > 0) setColaJoin(colaPreCargada)
          } catch { /* ignorar si falla */ }
        }

        // Fetch feedback summaries para mostrar rating en cada stand card
        const ratingResults = await Promise.allSettled(
          standsArr.map((s) => feedbackApi.resumenStand(s.id))
        )
        const ratingMap = {}
        ratingResults.forEach((r, i) => {
          if (r.status === 'fulfilled' && r.value.data?.promedio) {
            ratingMap[standsArr[i].id] = r.value.data.promedio
          }
        })
        setRatings(ratingMap)
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar el evento')
      } finally { setLoading(false) }
    }
    fetchData()
  }, [id, user?.id])

  const handleAbrirMaps = (texto) => {
    if (window.confirm('¿Abrir ubicación en Google Maps?')) {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(texto)}`, '_blank', 'noopener')
    }
  }

  const handleAgregarCalendario = () => {
    if (!evento) return
    const fmt = (d) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: evento.nombre,
      dates: `${fmt(evento.fecha_inicio)}/${fmt(evento.fecha_fin)}`,
      details: evento.descripcion || '',
      location: ubicacionText || '',
    })
    window.open(`https://calendar.google.com/calendar/render?${params}`, '_blank', 'noopener')
  }

  const handleComprar = () =>
    token ? navigate(`/comprar/${id}`) : navigate('/login', { state: { from: `/comprar/${id}` } })

  const handleUnirCola = async (standId, servicioId = null) => {
    if (!token) { navigate('/login'); return }
    const key = servicioId ? `${standId}__${servicioId}` : standId
    setColaJoin((prev) => ({ ...prev, [key]: { status: 'loading' } }))
    setColaError((prev) => ({ ...prev, [key]: null }))
    try {
      const res = await colaApi.unirse(standId, id, servicioId)
      setColaJoin((prev) => ({ ...prev, [key]: { status: 'joined', hora_estimada: res.data?.hora_estimada } }))
    } catch (err) {
      const msg = err.response?.data?.detail || 'No se pudo unir a la cola'
      if (err.response?.status === 409) {
        setColaJoin((prev) => ({ ...prev, [key]: { status: 'joined' } }))
      } else {
        setColaJoin((prev) => ({ ...prev, [key]: { status: 'error' } }))
        setColaError((prev) => ({ ...prev, [key]: msg }))
      }
    }
  }

  if (loading) return <div className="page"><LoadingSpinner center /></div>
  if (error || !evento) return (
    <div className="page"><div className="mx-auto max-w-3xl"><ErrorMessage message={error ?? 'Evento no encontrado'} /></div></div>
  )

  const ubicacionText = evento.ubicacion
    ? [evento.ubicacion.nombre, evento.ubicacion.direccion].filter(Boolean).join(' — ')
    : null

  const isOrganizer = evento && user && String(user.id) === String(evento.organizador_id)

  const metaItems = [
    ubicacionText   && { Icon: MapPin,   text: ubicacionText,    action: () => handleAbrirMaps(ubicacionText), tooltip: 'Abrir en Google Maps' },
    evento.fecha_inicio && { Icon: Calendar, text: `Inicio: ${formatDateTime(evento.fecha_inicio)}`, action: handleAgregarCalendario, tooltip: 'Agregar al calendario' },
    evento.fecha_fin    && { Icon: Clock,    text: `Fin: ${formatDateTime(evento.fecha_fin)}`,       action: handleAgregarCalendario, tooltip: 'Agregar al calendario' },
    evento.capacidad_max > 0 && { Icon: Users, text: `Capacidad: ${evento.capacidad_max}` },
  ].filter(Boolean)

  return (
    <div className="page">
      <div className="mx-auto max-w-3xl lg:max-w-6xl space-y-4">

        <Link to="/eventos" className="inline-flex items-center gap-1.5 text-sm text-aura-muted hover:text-aura-ink transition-colors">
          <ChevronLeft size={16} strokeWidth={1.5} />
          Volver a eventos
        </Link>

        <div className="lg:grid lg:grid-cols-[1fr_360px] lg:gap-6 lg:items-start space-y-4 lg:space-y-0">

          {/* Left col: Event card */}
          <div className="card overflow-hidden animate-fade-in">
            {/* Cover image */}
            {evento.imagen_url && (
              <div className="h-48 lg:h-64 w-full overflow-hidden">
                <img src={evento.imagen_url} alt={evento.nombre} className="h-full w-full object-cover" />
              </div>
            )}
            {/* Orange accent bar */}
            <div className="h-1.5 w-full bg-aura-gradient" />

            <div className="p-5 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-bold text-aura-ink leading-tight">{evento.nombre}</h1>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  {!evento.es_gratuito && evento.precio > 0 && (
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-aura-primary/10 px-2.5 py-1 text-sm font-bold text-aura-primary">
                        <DollarSign size={13} strokeWidth={2} />
                        ${(evento.precio * 1.10).toFixed(2)}
                      </span>
                      <span className="text-[10px] text-aura-muted">incluye 10% tarifa</span>
                    </div>
                  )}
                  {evento.es_gratuito && (
                    <span className="rounded-lg bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Gratuito</span>
                  )}
                  {evento.tiene_password && (
                    <span className="inline-flex items-center gap-1 rounded-lg bg-stone-100 px-2.5 py-1 text-xs font-medium text-aura-muted">
                      <Lock size={11} strokeWidth={2} /> Acceso con código
                    </span>
                  )}
                </div>
              </div>

              {evento.descripcion && (
                <p className="text-sm text-aura-muted leading-relaxed">{evento.descripcion}</p>
              )}

              {metaItems.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {metaItems.map((m, i) => (
                    m.action ? (
                      <button
                        key={i}
                        onClick={m.action}
                        title={m.tooltip}
                        className="flex items-start gap-2.5 rounded-xl bg-aura-surface px-3 py-2.5 text-left hover:bg-aura-primary/10 hover:ring-1 hover:ring-aura-primary/30 transition-all group"
                      >
                        <m.Icon size={15} strokeWidth={1.5} className="text-aura-primary flex-shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-sm text-aura-muted group-hover:text-aura-primary transition-colors">{m.text}</span>
                      </button>
                    ) : (
                      <div key={i} className="flex items-start gap-2.5 rounded-xl bg-aura-surface px-3 py-2.5">
                        <m.Icon size={15} strokeWidth={1.5} className="text-aura-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-aura-muted">{m.text}</span>
                      </div>
                    )
                  ))}
                </div>
              )}

              {evento.categorias?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {evento.categorias.map((cat) => (
                    <span key={cat} className="badge badge-primary capitalize">{cat}</span>
                  ))}
                </div>
              )}

              {isOrganizer ? (
                <Link
                  to={`/admin/eventos/${id}/editar`}
                  className="btn-primary w-full sm:w-auto py-3 px-8 inline-flex items-center gap-2"
                >
                  <Pencil size={16} strokeWidth={1.5} />
                  Editar evento
                </Link>
              ) : tieneTicket ? (
                <div className="inline-flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 px-5 py-3 text-sm font-semibold text-green-400">
                  <CheckCircle size={16} strokeWidth={2} />
                  Ya tienes ticket
                </div>
              ) : (
                <button onClick={handleComprar} className="btn-primary w-full sm:w-auto py-3 px-8 inline-flex items-center gap-2">
                  <Ticket size={16} strokeWidth={1.5} />
                  Comprar ticket
                </button>
              )}
            </div>
          </div>

          {/* Right col: stands + tools — solo con ticket */}
          {tieneTicket && (
          <div className="space-y-4 lg:sticky lg:top-20">

            {stands.length > 0 && (
              <div className="card overflow-hidden">
                <button
                  onClick={() => setStandsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-5 py-4 hover:bg-aura-surface transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-aura-ink">Stands del evento</h2>
                    <span className="text-xs font-medium text-aura-muted bg-aura-surface rounded-full px-2 py-0.5">{stands.length}</span>
                  </div>
                  {standsOpen
                    ? <ChevronUp size={18} strokeWidth={1.5} className="text-aura-muted" />
                    : <ChevronDown size={18} strokeWidth={1.5} className="text-aura-muted" />
                  }
                </button>
                {standsOpen && (
                  <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {stands.map((stand) => (
                      <StandCard
                        key={stand.id}
                        stand={stand}
                        onUnirCola={handleUnirCola}
                        colaJoin={colaJoin}
                        colaError={colaError}
                        rating={ratings[stand.id]}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* In-event tools */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-aura-muted uppercase tracking-wider">Herramientas del evento</p>

              <div className="card px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aura-surface flex-shrink-0">
                    <Wand2 size={18} strokeWidth={1.5} className="text-aura-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-aura-ink">Concierge</p>
                    <p className="text-xs text-aura-muted">Gestiona tus turnos virtuales en stands</p>
                  </div>
                </div>
                <Link to={`/eventos/${id}/concierge`} className="btn-sm flex-shrink-0">Abrir</Link>
              </div>

              <div className="card px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aura-surface flex-shrink-0">
                    <Map size={18} strokeWidth={1.5} className="text-aura-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-aura-ink">Aura Flow</p>
                    <p className="text-xs text-aura-muted">Tu ruta personalizada por el evento</p>
                  </div>
                </div>
                <Link to={`/eventos/${id}/aura-flow`} className="btn-sm flex-shrink-0">Abrir</Link>
              </div>

              <div className="card px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aura-surface flex-shrink-0">
                    <QrCode size={18} strokeWidth={1.5} className="text-aura-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-aura-ink">Escanear QR de Stand</p>
                    <p className="text-xs text-aura-muted">Usa la cámara si el BLE no está disponible</p>
                  </div>
                </div>
                <Link to={`/scan/${id}`} className="btn-sm flex-shrink-0">Escanear</Link>
              </div>

              <div className="card px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-aura-surface flex-shrink-0">
                    <MessageCircle size={18} strokeWidth={1.5} className="text-aura-muted" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-aura-ink">Chat del evento</p>
                    <p className="text-xs text-aura-muted">Habla con todos los asistentes en tiempo real</p>
                  </div>
                </div>
                <Link to={`/eventos/${id}/chat`} className="btn-sm flex-shrink-0">Abrir</Link>
              </div>
            </div>

          </div>
          )}
        </div>
      </div>

      {/* Chatbot flotante — solo si el usuario está autenticado */}
      {token && (
        <ChatbotEvento eventoId={id} eventoNombre={evento.nombre} />
      )}
    </div>
  )
}
