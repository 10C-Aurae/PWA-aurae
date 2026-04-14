import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import * as standsApi from '../api/standsApi'
import * as eventosApi from '../api/eventosApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Radio, Wifi } from 'lucide-react'

export default function StaffBeacon() {
  const { stand_id } = useParams()
  const [stand,  setStand]  = useState(null)
  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)
  const [activo,  setActivo]  = useState(false)

  useEffect(() => {
    standsApi.obtener(stand_id)
      .then(async (res) => {
        setStand(res.data)
        const evRes = await eventosApi.obtener(res.data.evento_id)
        setEvento(evRes.data)
      })
      .catch((err) => setError(err.response?.data?.detail || 'Stand no encontrado'))
      .finally(() => setLoading(false))
  }, [stand_id])

  if (loading) return <div className="page"><LoadingSpinner center /></div>
  if (error)   return <div className="page"><div className="mx-auto max-w-sm"><ErrorMessage message={error} /></div></div>

  return (
    <div className="page">
      <div className="mx-auto max-w-sm space-y-5">

        <div>
          <Link to="/admin/eventos" className="text-xs text-aura-muted hover:text-aura-ink">← Mis eventos</Link>
          <h1 className="page-title mt-1">Modo Beacon</h1>
          <p className="page-subtitle">{stand?.nombre}{evento ? ` · ${evento.nombre}` : ''}</p>
        </div>

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
              onClick={() => setActivo(true)}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              <Wifi size={16} strokeWidth={1.5} />
              Activar beacon
            </button>
          </div>
        ) : (
          <div className="card p-6 flex flex-col items-center gap-4 text-center animate-fade-in">
            {/* Indicador de señal animado */}
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

            {/* QR del stand */}
            <div className="rounded-2xl bg-white p-4 shadow-card-md">
              <QRCodeSVG value={stand_id} size={220} />
            </div>

            <div className="w-full rounded-xl border border-aura-border bg-aura-surface p-3 text-left space-y-1">
              <p className="text-xs font-semibold text-aura-ink">{stand?.nombre}</p>
              {stand?.categoria && <p className="text-[11px] text-aura-muted">Categoría: {stand.categoria}</p>}
              {stand?.responsable && <p className="text-[11px] text-aura-muted">Encargado: {stand.responsable}</p>}
            </div>

            <p className="text-[11px] text-aura-faint">
              El asistente abre Aurae → Escanear QR → apunta a esta pantalla
            </p>

            <button
              onClick={() => setActivo(false)}
              className="w-full rounded-xl border border-aura-border py-2.5 text-sm text-aura-muted hover:text-aura-ink transition-colors"
            >
              Desactivar beacon
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
