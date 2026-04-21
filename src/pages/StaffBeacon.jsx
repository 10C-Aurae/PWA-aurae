import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import * as standsApi from '../api/standsApi'
import * as eventosApi from '../api/eventosApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Radio, Wifi, AlertCircle } from 'lucide-react'

const HEARTBEAT_INTERVAL_MS = 30_000

export default function StaffBeacon() {
  const { stand_id } = useParams()

  const [stand, setStand]     = useState(null)
  const [evento, setEvento]   = useState(null)
  const [sesion, setSesion]   = useState(null) // BeaconSession del backend
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [now, setNow]         = useState(() => Date.now())

  const heartbeatRef = useRef(null)

  // ── Carga inicial: stand + evento + estado del beacon ────────────────────────
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [standRes, statusRes] = await Promise.all([
          standsApi.obtener(stand_id),
          standsApi.obtenerBeaconStatus(stand_id),
        ])
        if (cancelled) return
        setStand(standRes.data)
        const evRes = await eventosApi.obtener(standRes.data.evento_id)
        if (cancelled) return
        setEvento(evRes.data)
        if (statusRes.data.activo) setSesion(statusRes.data.sesion)
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.detail || 'Stand no encontrado')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [stand_id])

  // ── Tick de 1s para refrescar tiempos mostrados ──────────────────────────────
  useEffect(() => {
    if (!sesion) return
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [sesion])

  // ── Heartbeat periódico mientras la sesión está activa ───────────────────────
  useEffect(() => {
    if (!sesion) return
    heartbeatRef.current = setInterval(async () => {
      try {
        const res = await standsApi.beaconHeartbeat(stand_id)
        setSesion(res.data)
      } catch (err) {
        // Sesión perdida server-side: la reflejamos como inactiva
        if (err.response?.status === 404) {
          setSesion(null)
          setError('La sesión del beacon expiró. Actívala de nuevo.')
        }
      }
    }, HEARTBEAT_INTERVAL_MS)
    return () => clearInterval(heartbeatRef.current)
  }, [sesion, stand_id])

  // ── Cleanup al salir: intenta desactivar si quedó activo ─────────────────────
  useEffect(() => {
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current)
    }
  }, [])

  const activar = useCallback(async () => {
    setActionLoading(true)
    setError(null)
    try {
      const res = await standsApi.activarBeacon(stand_id)
      setSesion(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo activar el beacon.')
    } finally {
      setActionLoading(false)
    }
  }, [stand_id])

  const desactivar = useCallback(async () => {
    setActionLoading(true)
    setError(null)
    try {
      await standsApi.desactivarBeacon(stand_id)
      setSesion(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo desactivar el beacon.')
    } finally {
      setActionLoading(false)
    }
  }, [stand_id])

  if (loading) return <div className="page"><LoadingSpinner center /></div>
  if (error && !stand) {
    return <div className="page"><div className="mx-auto max-w-sm"><ErrorMessage message={error} /></div></div>
  }

  const activo = Boolean(sesion)
  const activadoEn = sesion?.activado_en ? new Date(sesion.activado_en).getTime() : null
  const lastHb     = sesion?.last_heartbeat ? new Date(sesion.last_heartbeat).getTime() : null
  const tiempoActivo = activadoEn ? Math.max(0, Math.floor((now - activadoEn) / 1000)) : 0
  const segDesdeHb   = lastHb ? Math.max(0, Math.floor((now - lastHb) / 1000)) : 0

  return (
    <div className="page">
      <div className="mx-auto max-w-sm space-y-5">

        <div>
          <Link to="/admin/eventos" className="text-xs text-aura-muted hover:text-aura-ink">← Mis eventos</Link>
          <h1 className="page-title mt-1">Modo Beacon</h1>
          <p className="page-subtitle">{stand?.nombre}{evento ? ` · ${evento.nombre}` : ''}</p>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle size={14} strokeWidth={2} className="mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!activo ? (
          <div className="card p-6 flex flex-col items-center gap-5 text-center animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-aura-surface flex items-center justify-center">
              <Radio size={32} strokeWidth={1.5} className="text-aura-muted" />
            </div>
            <div>
              <p className="font-semibold text-aura-ink">Beacon inactivo</p>
              <p className="text-xs text-aura-muted mt-1">
                Actívalo para que los asistentes puedan registrar su visita escaneando este dispositivo
              </p>
            </div>
            <button
              onClick={activar}
              disabled={actionLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Wifi size={16} strokeWidth={1.5} />
              {actionLoading ? 'Activando…' : 'Activar beacon'}
            </button>
          </div>
        ) : (
          <div className="card p-6 flex flex-col items-center gap-4 text-center animate-fade-in">
            <div className="relative flex items-center justify-center h-16 w-16">
              <span className="absolute inline-flex h-full w-full rounded-full bg-aura-primary/20 animate-ping-slow" />
              <span className="absolute inline-flex h-12 w-12 rounded-full bg-aura-primary/10 animate-ping-slow" style={{ animationDelay: '0.4s' }} />
              <div className="relative h-10 w-10 rounded-full bg-aura-primary/20 flex items-center justify-center">
                <Radio size={20} strokeWidth={1.5} className="text-aura-primary" />
              </div>
            </div>

            <div>
              <p className="font-semibold text-aura-ink">Beacon activo</p>
              <p className="text-xs text-aura-muted mt-0.5">
                Muestra este QR a los asistentes para que escaneen su visita
              </p>
            </div>

            <div className="rounded-2xl bg-white p-4 shadow-card-md">
              <QRCodeSVG value={stand_id} size={220} />
            </div>

            <div className="w-full rounded-xl border border-aura-border bg-aura-surface p-3 text-left space-y-1">
              <p className="text-xs font-semibold text-aura-ink">{stand?.nombre}</p>
              {stand?.categoria && <p className="text-[11px] text-aura-muted">Categoría: {stand.categoria}</p>}
              {stand?.responsable && <p className="text-[11px] text-aura-muted">Encargado: {stand.responsable}</p>}
            </div>

            <div className="w-full grid grid-cols-2 gap-2 text-[11px]">
              <div className="rounded-lg border border-aura-border bg-aura-card p-2">
                <p className="text-aura-faint">Tiempo activo</p>
                <p className="font-mono text-aura-ink">{formatElapsed(tiempoActivo)}</p>
              </div>
              <div className="rounded-lg border border-aura-border bg-aura-card p-2">
                <p className="text-aura-faint">Último heartbeat</p>
                <p className="font-mono text-aura-ink">hace {segDesdeHb}s</p>
              </div>
            </div>

            <p className="text-[11px] text-aura-faint">
              El asistente abre Aurae → Escanear QR → apunta a esta pantalla
            </p>

            <button
              onClick={desactivar}
              disabled={actionLoading}
              className="w-full rounded-xl border border-aura-border py-2.5 text-sm text-aura-muted hover:text-aura-ink transition-colors disabled:opacity-60"
            >
              {actionLoading ? 'Desactivando…' : 'Desactivar beacon'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function formatElapsed(totalSec) {
  const h = Math.floor(totalSec / 3600)
  const m = Math.floor((totalSec % 3600) / 60)
  const s = totalSec % 60
  const pad = (n) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
