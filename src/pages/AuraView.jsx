import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAura } from '../hooks/useAura'
import { getNivelesConColor } from '../utils/auraColors'
import { Sparkles, Check, QrCode, CalendarCheck } from 'lucide-react'
import AuraBadge from '../components/AuraBadge'
import AuraProgress from '../components/AuraProgress'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import * as ticketsApi from '../api/ticketsApi'

export default function AuraView() {
  const { usuario_id } = useParams()
  const { user } = useAuth()
  const { aura, loading, error, info, generarSnapshot } = useAura(usuario_id)
  const [snapLoading, setSnapLoading] = useState(false)
  const [snapResult, setSnapResult] = useState(null)
  const [snapError, setSnapError] = useState(null)

  const [tickets, setTickets] = useState([])
  const [ticketsLoading, setTicketsLoading] = useState(false)

  const puntos    = aura?.aura_puntos ?? 0
  const esPropio  = String(user?.id) === String(usuario_id)
  const intereses = esPropio ? (user?.vector_intereses ?? []) : []

  useEffect(() => {
    if (!esPropio || !usuario_id) return
    setTicketsLoading(true)
    ticketsApi.porUsuario(usuario_id)
      .then((r) => setTickets((r.data ?? []).filter((t) => t.status_uso === 'usado')))
      .catch(() => {})
      .finally(() => setTicketsLoading(false))
  }, [usuario_id, esPropio])
  const nivelesConColor = getNivelesConColor(intereses)

  const handleSnapshot = async () => {
    setSnapLoading(true); setSnapError(null)
    try {
      const data = await generarSnapshot({ usuario_id })
      setSnapResult(data)
    } catch (err) {
      setSnapError(err.response?.data?.detail || 'Error al generar snapshot')
    } finally { setSnapLoading(false) }
  }

  if (loading) return <div className="page"><LoadingSpinner center /></div>

  return (
    <div className="page">
      <div className="mx-auto max-w-lg md:max-w-4xl space-y-4">

        <div>
          <h1 className="page-title">{esPropio ? 'Mi Aura' : 'Aura del usuario'}</h1>
          <p className="page-subtitle">Estado de tu energía en el evento</p>
        </div>

        {error && <ErrorMessage message={error} />}

        {!error && (
          <div className="md:grid md:grid-cols-2 md:gap-5 md:items-start space-y-4 md:space-y-0">

            {/* Left col: Hero — dark card */}
            <div className="card-dark rounded-2xl p-8 flex flex-col items-center gap-5 relative overflow-hidden animate-fade-in">
              <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-48 w-48 rounded-full opacity-15 blur-3xl"
                   style={{ background: 'radial-gradient(circle,#E6670A,transparent)' }} />
              <AuraBadge puntos={puntos} intereses={intereses} size="xl" pulso darkMode />
              <p className="text-3xl font-extrabold text-white tabular-nums">{puntos.toLocaleString()} pts</p>
              <div className="w-full max-w-xs">
                <AuraProgress puntos={puntos} intereses={intereses} darkMode />
              </div>
            </div>

            {/* Right col: levels + history + concierge */}
            <div className="space-y-4">
              {/* Level table */}
              <div className="card p-5 space-y-3 animate-fade-in">
                <h2 className="text-sm font-bold text-aura-ink">Progresión de niveles</h2>
                <div className="space-y-1.5">
                  {nivelesConColor.map((n) => {
                    const activo    = info?.current?.nivel === n.nivel
                    const alcanzado = puntos >= n.min
                    return (
                      <div
                        key={n.nivel}
                        className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 transition-all duration-200 ${
                          activo ? 'bg-aura-primary/10 border border-aura-primary/25' : 'border border-transparent hover:bg-aura-surface'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: n.color, boxShadow: activo ? n.glow : 'none' }} />
                          <span className={`text-sm font-medium ${activo ? 'text-aura-ink font-bold' : alcanzado ? 'text-aura-ink' : 'text-aura-faint'}`}>
                            {n.nombre}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-aura-muted tabular-nums">{n.min.toLocaleString()} pts</span>
                          {activo ? (
                            <span className="badge badge-primary text-[10px]">Actual</span>
                          ) : alcanzado ? (
                            <Check size={16} strokeWidth={2} className="text-emerald-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-aura-border" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* QR scan history */}
              {esPropio && (
                <div className="card p-5 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2">
                    <QrCode size={15} strokeWidth={1.5} className="text-aura-primary" />
                    <h2 className="text-sm font-bold text-aura-ink">Tickets escaneados</h2>
                  </div>
                  {ticketsLoading && <LoadingSpinner size="sm" />}
                  {!ticketsLoading && tickets.length === 0 && (
                    <p className="text-xs text-aura-muted">Aún no has usado ningún ticket en un evento.</p>
                  )}
                  {!ticketsLoading && tickets.length > 0 && (
                    <div className="space-y-2">
                      {tickets.slice(0, 8).map((t) => (
                        <div key={t.id} className="flex items-center gap-3 rounded-xl bg-aura-surface px-3.5 py-2.5">
                          <CalendarCheck size={14} strokeWidth={1.5} className="text-emerald-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-aura-ink capitalize">{t.tipo}</p>
                            <p className="text-[10px] text-aura-faint truncate">
                              Evento · {t.evento_id?.slice(-8)}
                            </p>
                          </div>
                          {t.fecha_uso && (
                            <span className="text-[10px] text-aura-muted whitespace-nowrap flex-shrink-0">
                              {new Date(t.fecha_uso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Smart Concierge */}
              {esPropio && (
                <div className="card p-5 space-y-3 animate-fade-in">
                  <h2 className="text-sm font-bold text-aura-ink">Smart Concierge</h2>
                  {snapResult && <p className="text-sm text-aura-muted leading-relaxed">{snapResult.recomendaciones?.[0] ?? 'Análisis generado'}</p>}
                  {snapError  && <ErrorMessage message={snapError} />}
                  <button onClick={handleSnapshot} disabled={snapLoading} className="btn-ghost text-xs py-2 px-4 inline-flex items-center gap-1.5">
                    {snapLoading ? <><LoadingSpinner size="sm" /> Generando…</> : <><Sparkles size={13} strokeWidth={1.5} /> Generar Snapshot</>}
                  </button>
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
