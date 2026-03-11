import { useState, useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { ESTADO_COLA } from '../api/colaApi'
import LoadingSpinner from '../components/LoadingSpinner'
import { Bell, CalendarOff, RefreshCw } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Datos mock mientras el backend implementa /colas
// TODO: reemplazar polling por WebSocket ws://backend/ws/colas/:stand_id
// ─────────────────────────────────────────────────────────────
const MOCK_TURNOS = [
  {
    id: 'turno-1',
    stand_nombre: 'Stand de IA & Robótica',
    stand_id: 'stand-abc',
    posicion: 3,
    total_en_cola: 8,
    estado: ESTADO_COLA.EN_COLA,
    espera_min: 12,
  },
  {
    id: 'turno-2',
    stand_nombre: 'Gastro Lab',
    stand_id: 'stand-def',
    posicion: 1,
    total_en_cola: 3,
    estado: ESTADO_COLA.NOTIFICADO,
    espera_min: 2,
  },
  {
    id: 'turno-3',
    stand_nombre: 'Creative Hub',
    stand_id: 'stand-ghi',
    posicion: 0,
    total_en_cola: 5,
    estado: ESTADO_COLA.ATENDIDO,
    espera_min: 0,
  },
]

// ─────────────────────────────────────────────────────────────
// Badge de estado
// ─────────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const config = {
    [ESTADO_COLA.REGISTRADO]: {
      label: 'Registrado',
      cls: 'bg-gray-500/20 text-gray-400',
    },
    [ESTADO_COLA.EN_COLA]: {
      label: 'En Cola',
      cls: 'bg-yellow-500/20 text-yellow-400',
    },
    [ESTADO_COLA.NOTIFICADO]: {
      label: 'Es tu turno!',
      cls: 'bg-blue-500/20 text-blue-400 animate-pulse',
    },
    [ESTADO_COLA.ATENDIDO]: {
      label: 'Atendido',
      cls: 'bg-green-500/20 text-green-400',
    },
    [ESTADO_COLA.EXPIRADO]: {
      label: 'Expirado',
      cls: 'bg-gray-600/30 text-gray-500',
    },
  }
  const { label, cls } = config[estado] ?? config[ESTADO_COLA.REGISTRADO]

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {estado === ESTADO_COLA.NOTIFICADO && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
      )}
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de turno
// ─────────────────────────────────────────────────────────────
function TurnoCard({ turno, onCancelar }) {
  const activo = [ESTADO_COLA.EN_COLA, ESTADO_COLA.NOTIFICADO, ESTADO_COLA.REGISTRADO].includes(turno.estado)

  return (
    <div className={`rounded-2xl border bg-aura-card p-4 ${
      turno.estado === ESTADO_COLA.NOTIFICADO
        ? 'border-blue-500/50 shadow-lg shadow-blue-500/10'
        : 'border-aura-border'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-medium text-white text-sm">{turno.stand_nombre}</h3>
          {turno.estado === ESTADO_COLA.EN_COLA && (
            <p className="text-xs text-gray-400 mt-0.5">
              Posición <span className="text-white font-semibold">#{turno.posicion}</span>
              {' '}de {turno.total_en_cola}
            </p>
          )}
        </div>
        <EstadoBadge estado={turno.estado} />
      </div>

      {turno.estado === ESTADO_COLA.NOTIFICADO && (
        <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
          <p className="text-xs font-medium text-blue-300 flex items-center gap-1.5">
            <Bell size={12} strokeWidth={2} className="flex-shrink-0" />
            Dirígete al stand ahora · espera ~{turno.espera_min} min
          </p>
        </div>
      )}

      {turno.estado === ESTADO_COLA.EN_COLA && (
        <p className="text-xs text-gray-500 mb-3">
          Espera estimada: <span className="text-gray-300">~{turno.espera_min} min</span>
        </p>
      )}

      {activo && (
        <button
          onClick={() => onCancelar(turno.id)}
          className="w-full rounded-lg border border-red-500/30 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-all duration-200"
        >
          Cancelar turno
        </button>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Concierge() {
  const { id }               = useParams()
  const { user }             = useAuth()
  const [turnos, setTurnos]  = useState([])
  const [loading, setLoading] = useState(true)
  const intervalRef          = useRef(null)

  // Simula fetch de turnos (mock mientras el backend implementa /colas)
  const fetchTurnos = async () => {
    // TODO: reemplazar por colaApi.misTurnos(user.id) cuando el backend esté listo
    // TODO: reemplazar polling por WebSocket ws://backend/ws/colas/:stand_id
    await new Promise((r) => setTimeout(r, 400))
    setTurnos(MOCK_TURNOS)
    setLoading(false)
  }

  useEffect(() => {
    fetchTurnos()
    // Polling cada 10 segundos
    intervalRef.current = setInterval(fetchTurnos, 10_000)
    return () => clearInterval(intervalRef.current)
  }, [user?.id])

  const handleCancelar = (turnoId) => {
    // TODO: llamar a colaApi.cancelarTurno(turnoId) cuando el backend esté listo
    setTurnos((prev) => prev.filter((t) => t.id !== turnoId))
  }

  const activos   = turnos.filter((t) => [ESTADO_COLA.EN_COLA, ESTADO_COLA.NOTIFICADO, ESTADO_COLA.REGISTRADO].includes(t.estado))
  const pasados   = turnos.filter((t) => [ESTADO_COLA.ATENDIDO, ESTADO_COLA.EXPIRADO].includes(t.estado))
  const notificados = turnos.filter((t) => t.estado === ESTADO_COLA.NOTIFICADO)

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-lg">

        <Link
          to={`/eventos/${id}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← Volver al evento
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Mis Colas</h1>
          <span className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw size={11} strokeWidth={2} /> auto-actualiza cada 10s</span>
        </div>
        <p className="text-sm text-gray-400 mb-6">Gestiona tus turnos virtuales en stands</p>

        {loading && <LoadingSpinner center />}

        {!loading && (
          <>
            {/* Banner de notificación urgente */}
            {notificados.length > 0 && (
              <div className="mb-4 rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 animate-pulse">
                <p className="text-sm font-semibold text-blue-300 flex items-center gap-1.5">
                  <Bell size={14} strokeWidth={2} className="flex-shrink-0" />
                  {notificados.length === 1
                    ? `Es tu turno en "${notificados[0].stand_nombre}"`
                    : `Tienes ${notificados.length} turnos listos`}
                </p>
                <p className="text-xs text-blue-400 mt-0.5">Dirígete al stand ahora</p>
              </div>
            )}

            {/* Turnos activos */}
            {activos.length > 0 && (
              <section className="mb-6">
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  En espera ({activos.length})
                </h2>
                <div className="flex flex-col gap-3">
                  {activos.map((t) => (
                    <TurnoCard key={t.id} turno={t} onCancelar={handleCancelar} />
                  ))}
                </div>
              </section>
            )}

            {/* Sin turnos activos */}
            {activos.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <CalendarOff size={36} strokeWidth={1.5} className="text-gray-600 mb-3" />
                <p className="text-gray-400 text-sm">No estás en ninguna cola activa</p>
                <p className="text-gray-500 text-xs mt-1">
                  Ve a un evento y únete a la cola de un stand
                </p>
              </div>
            )}

            {/* Historial */}
            {pasados.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Historial
                </h2>
                <div className="flex flex-col gap-3">
                  {pasados.map((t) => (
                    <TurnoCard key={t.id} turno={t} onCancelar={handleCancelar} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
