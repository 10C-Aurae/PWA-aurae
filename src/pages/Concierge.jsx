import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as colaApi from '../api/colaApi'
import * as standsApi from '../api/standsApi'
import { ESTADO_COLA } from '../api/colaApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Bell, CalendarOff, RefreshCw, WifiOff, MapPin } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

function buildWsUrl(usuarioId, token) {
  const base = (import.meta.env.VITE_API_BASE_URL || '')
    .replace(/^http:/, 'ws:')
    .replace(/^https:/, 'wss:')
  return `${base}/colas/ws/${usuarioId}?token=${token}`
}

// ─────────────────────────────────────────────────────────────
// Badge de estado
// ─────────────────────────────────────────────────────────────
function EstadoBadge({ status }) {
  const config = {
    [ESTADO_COLA.ESPERANDO]:  { label: 'En cola',      cls: 'bg-yellow-500/20 text-yellow-400' },
    [ESTADO_COLA.ACTIVO]:     { label: '¡Es tu turno!', cls: 'bg-blue-500/20 text-blue-400 animate-pulse' },
    [ESTADO_COLA.CONFIRMADO]: { label: 'Llegaste ✓',   cls: 'bg-emerald-500/20 text-emerald-400' },
    [ESTADO_COLA.ATENDIDO]:   { label: 'Atendido',     cls: 'bg-green-500/20 text-green-400' },
    [ESTADO_COLA.CANCELADO]:  { label: 'Cancelado',    cls: 'bg-gray-600/30 text-gray-500' },
  }
  const { label, cls } = config[status] ?? config[ESTADO_COLA.ESPERANDO]

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}>
      {status === ESTADO_COLA.ACTIVO && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
      )}
      {label}
    </span>
  )
}

// ─────────────────────────────────────────────────────────────
// Tarjeta de turno
// ─────────────────────────────────────────────────────────────
function TurnoCard({ turno, standNombre, onCancelar, onConfirmar, cancelando, confirmando }) {
  const cancelable = [ESTADO_COLA.ESPERANDO, ESTADO_COLA.ACTIVO, ESTADO_COLA.CONFIRMADO].includes(turno.status)

  return (
    <div className={`rounded-2xl border bg-aura-card p-4 ${
      turno.status === ESTADO_COLA.ACTIVO
        ? 'border-blue-500/50 shadow-lg shadow-blue-500/10'
        : turno.status === ESTADO_COLA.CONFIRMADO
          ? 'border-emerald-500/40 shadow-lg shadow-emerald-500/5'
          : 'border-aura-border'
    }`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h3 className="font-medium text-white text-sm">{standNombre}</h3>
          {turno.status === ESTADO_COLA.ESPERANDO && (
            <p className="text-xs text-gray-400 mt-0.5">
              Posición <span className="text-white font-semibold">#{turno.posicion}</span>
            </p>
          )}
        </div>
        <EstadoBadge status={turno.status} />
      </div>

      {turno.status === ESTADO_COLA.ACTIVO && (
        <div className="mb-3 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-2">
          <p className="text-xs font-medium text-blue-300 flex items-center gap-1.5">
            <Bell size={12} strokeWidth={2} className="flex-shrink-0" />
            Dirígete al stand ahora
            {turno.tiempo_espera_min ? ` · ~${turno.tiempo_espera_min} min` : ''}
          </p>
        </div>
      )}

      {turno.status === ESTADO_COLA.CONFIRMADO && (
        <div className="mb-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
          <p className="text-xs font-medium text-emerald-300 flex items-center gap-1.5">
            <MapPin size={12} strokeWidth={2} className="flex-shrink-0" />
            El staff te atenderá en un momento
          </p>
        </div>
      )}

      {turno.status === ESTADO_COLA.ESPERANDO && turno.tiempo_espera_min != null && (
        <p className="text-xs text-gray-500 mb-3">
          Espera estimada: <span className="text-gray-300">~{turno.tiempo_espera_min} min</span>
        </p>
      )}

      <div className="flex flex-col gap-2">
        {turno.status === ESTADO_COLA.ACTIVO && (
          <button
            onClick={() => onConfirmar(turno.id)}
            disabled={confirmando === turno.id}
            className="w-full rounded-lg bg-emerald-500/20 border border-emerald-500/40 py-2 text-xs font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <MapPin size={12} strokeWidth={2} />
            {confirmando === turno.id ? 'Confirmando…' : 'Ya llegué al stand'}
          </button>
        )}
        {cancelable && (
          <button
            onClick={() => onCancelar(turno.id)}
            disabled={cancelando === turno.id}
            className="w-full rounded-lg border border-red-500/30 py-1.5 text-xs text-red-400 hover:bg-red-500/10 transition-all duration-200 disabled:opacity-50"
          >
            {cancelando === turno.id ? 'Cancelando…' : 'Cancelar turno'}
          </button>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function Concierge() {
  const { id: eventoId }    = useParams()
  const { user, token }     = useAuth()
  const [turnos, setTurnos] = useState([])
  const [stands, setStands] = useState({})   // standId → standNombre
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [cancelando, setCancelando]   = useState(null)
  const [confirmando, setConfirmando] = useState(null)
  const [wsStatus, setWsStatus] = useState('disconnected') // connected | disconnected | error
  const wsRef   = useRef(null)
  const pingRef = useRef(null)

  // ── Fetch turnos + stands ─────────────────────────────────

  const fetchTurnos = useCallback(async () => {
    try {
      const [turnosRes, standsRes] = await Promise.all([
        colaApi.misTurnos(),
        standsApi.porEvento(eventoId),
      ])
      const standsMap = {}
      for (const s of standsRes.data) {
        standsMap[s.id] = s.nombre
      }
      setStands(standsMap)
      setTurnos(turnosRes.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar los turnos')
    } finally {
      setLoading(false)
    }
  }, [eventoId])

  useEffect(() => { fetchTurnos() }, [fetchTurnos])

  // ── WebSocket ─────────────────────────────────────────────

  useEffect(() => {
    if (!user?.id || !token) return

    const url = buildWsUrl(user.id, token)
    let ws

    try {
      ws = new WebSocket(url)
      wsRef.current = ws
    } catch {
      return
    }

    ws.onopen = () => {
      setWsStatus('connected')
      // Keepalive cada 25 s (el servidor espera texto para mantener la conexión)
      pingRef.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send('ping')
      }, 25_000)
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        if (msg.tipo === 'turno_llamado' && msg.stand_id) {
          // Actualizar el turno de ese stand a ACTIVO
          setTurnos((prev) =>
            prev.map((t) =>
              t.stand_id === msg.stand_id && t.status === ESTADO_COLA.ESPERANDO
                ? { ...t, status: ESTADO_COLA.ACTIVO }
                : t
            )
          )
        }
      } catch {
        // mensaje no JSON (p.ej. pong) — ignorar
      }
    }

    ws.onerror = () => setWsStatus('error')
    ws.onclose = () => {
      setWsStatus('disconnected')
      clearInterval(pingRef.current)
    }

    return () => {
      clearInterval(pingRef.current)
      ws.close()
    }
  }, [user?.id, token])

  // ── Cancelar turno ────────────────────────────────────────

  const handleCancelar = async (colaId) => {
    setCancelando(colaId)
    try {
      await colaApi.cancelarTurno(colaId)
      setTurnos((prev) =>
        prev.map((t) => t.id === colaId ? { ...t, status: ESTADO_COLA.CANCELADO } : t)
      )
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cancelar el turno')
    } finally {
      setCancelando(null)
    }
  }

  // ── Confirmar llegada ─────────────────────────────────────

  const handleConfirmar = async (colaId) => {
    setConfirmando(colaId)
    try {
      await colaApi.confirmarLlegada(colaId)
      setTurnos((prev) =>
        prev.map((t) => t.id === colaId ? { ...t, status: ESTADO_COLA.CONFIRMADO } : t)
      )
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo confirmar la llegada')
    } finally {
      setConfirmando(null)
    }
  }

  // ── Partición de turnos ───────────────────────────────────

  const activos  = turnos.filter((t) => [ESTADO_COLA.ESPERANDO, ESTADO_COLA.ACTIVO, ESTADO_COLA.CONFIRMADO].includes(t.status))
  const pasados  = turnos.filter((t) => [ESTADO_COLA.ATENDIDO, ESTADO_COLA.CANCELADO].includes(t.status))
  const llamados = turnos.filter((t) => t.status === ESTADO_COLA.ACTIVO)

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-lg">

        <Link
          to={`/eventos/${eventoId}`}
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← Volver al evento
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Mis Colas</h1>
          <div className="flex items-center gap-2">
            {wsStatus === 'connected' ? (
              <span className="text-xs text-green-400 flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                En vivo
              </span>
            ) : (
              <button
                onClick={fetchTurnos}
                className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-300 transition-colors"
              >
                <RefreshCw size={11} strokeWidth={2} /> Actualizar
              </button>
            )}
            {wsStatus === 'error' && (
              <WifiOff size={12} className="text-red-400" title="Sin conexión en tiempo real" />
            )}
          </div>
        </div>
        <p className="text-sm text-gray-400 mb-6">Gestiona tus turnos virtuales en stands</p>

        {error && <ErrorMessage message={error} className="mb-4" />}
        {loading && <LoadingSpinner center />}

        {!loading && (
          <>
            {/* Banner de turno urgente */}
            {llamados.length > 0 && (
              <div className="mb-4 rounded-xl border border-blue-500/40 bg-blue-500/10 p-4 animate-pulse">
                <p className="text-sm font-semibold text-blue-300 flex items-center gap-1.5">
                  <Bell size={14} strokeWidth={2} className="flex-shrink-0" />
                  {llamados.length === 1
                    ? `Es tu turno en "${stands[llamados[0].stand_id] || 'el stand'}"`
                    : `Tienes ${llamados.length} turnos listos`}
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
                    <TurnoCard
                      key={t.id}
                      turno={t}
                      standNombre={stands[t.stand_id] || `Stand ${t.stand_id.slice(-6)}`}
                      onCancelar={handleCancelar}
                      onConfirmar={handleConfirmar}
                      cancelando={cancelando}
                      confirmando={confirmando}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Sin turnos activos */}
            {activos.length === 0 && !error && (
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
                    <TurnoCard
                      key={t.id}
                      turno={t}
                      standNombre={stands[t.stand_id] || `Stand ${t.stand_id.slice(-6)}`}
                      onCancelar={handleCancelar}
                      onConfirmar={handleConfirmar}
                      cancelando={cancelando}
                      confirmando={confirmando}
                    />
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
