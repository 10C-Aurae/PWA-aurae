import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAura } from '../hooks/useAura'
import { getAuraInfo } from '../utils/auraColors'
import * as auraFlowApi from '../api/auraFlowApi'
import {
  Map, RefreshCw, Sparkles, Bot, ChevronRight, Star,
  MapPin, FlaskConical, ChefHat, Palette, Handshake,
  Gamepad2, Leaf, Zap, Wifi, Utensils, Bus, ParkingSquare,
} from 'lucide-react'
import AuraBadge from '../components/AuraBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// Icono según categoría del stand
function iconoPorCategoria(cat = '') {
  const c = cat.toLowerCase()
  if (c.includes('tecnolog') || c.includes('innovac') || c.includes('tech')) return FlaskConical
  if (c.includes('gastro') || c.includes('comida') || c.includes('food')) return Utensils
  if (c.includes('musica') || c.includes('arte') || c.includes('creat')) return Palette
  if (c.includes('network') || c.includes('negocio')) return Handshake
  if (c.includes('gaming') || c.includes('jueg')) return Gamepad2
  if (c.includes('sustent') || c.includes('eco')) return Leaf
  if (c.includes('deporte') || c.includes('activ')) return Zap
  if (c.includes('wifi') || c.includes('digital')) return Wifi
  if (c.includes('transport')) return Bus
  if (c.includes('estacion')) return ParkingSquare
  return MapPin
}

function StandCard({ stand, index }) {
  const Icon = iconoPorCategoria(stand.categoria)
  const isTop = index === 0

  return (
    <div className={`rounded-2xl border p-4 transition-all duration-200 ${
      isTop
        ? 'border-aura-primary/40 bg-aura-primary/10 shadow-glow-sm'
        : 'border-aura-border bg-aura-card'
    }`}>
      <div className="flex items-start gap-3">
        {/* Número de prioridad */}
        <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold ${
          isTop
            ? 'bg-aura-primary text-white'
            : 'border border-aura-border bg-aura-surface text-aura-muted'
        }`}>
          {index + 1}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Icon size={14} strokeWidth={1.5} className="text-aura-primary flex-shrink-0" />
            <p className="text-sm font-semibold text-aura-ink truncate">{stand.nombre}</p>
            {isTop && (
              <span className="flex-shrink-0 inline-flex items-center gap-0.5 rounded-full bg-aura-primary/20 px-2 py-0.5 text-[10px] font-bold text-aura-primary">
                <Star size={9} fill="currentColor" /> TOP
              </span>
            )}
          </div>

          {stand.categoria && (
            <span className="inline-block rounded-full border border-aura-border px-2 py-0.5 text-[10px] text-aura-muted capitalize mb-2">
              {stand.categoria}
            </span>
          )}

          <p className="text-xs text-aura-muted leading-relaxed italic">
            "{stand.razon}"
          </p>
        </div>
      </div>
    </div>
  )
}

export default function AuraFlow() {
  const { id } = useParams()
  const { user } = useAuth()
  const { aura, loading: auraLoading } = useAura(user?.id)

  const [resultado, setResultado] = useState(null)
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState(null)

  const puntos = aura?.puntos_totales ?? user?.aura_puntos ?? 0
  const intereses = user?.vector_intereses ?? []
  const { current } = getAuraInfo(puntos, intereses)

  const handleGenerar = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await auraFlowApi.recomendar(id)
      setResultado(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar la ruta')
    } finally {
      setLoading(false)
    }
  }

  const recomendaciones = resultado?.recomendaciones ?? []
  const arquetipo       = resultado?.arquetipo || user?.arquetipo || ''
  const resumen         = resultado?.resumen    || ''
  const conIA           = resultado?.generado_con_ia

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8 pb-28">
      <div className="mx-auto max-w-lg">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-aura-ink">Aura Flow</h1>
            <p className="text-sm text-aura-muted">Tu ruta personalizada por el evento</p>
          </div>
          {resultado && (
            <button
              onClick={handleGenerar}
              disabled={loading}
              className="rounded-lg border border-aura-primary/30 bg-aura-primary/10 px-3 py-1.5 text-xs font-medium text-aura-primary hover:bg-aura-primary hover:text-white disabled:opacity-50 transition-all duration-200 inline-flex items-center gap-1.5"
            >
              {loading
                ? <><LoadingSpinner size="sm" /> Regenerando</>
                : <><RefreshCw size={12} strokeWidth={2} /> Regenerar</>}
            </button>
          )}
        </div>

        {auraLoading && <LoadingSpinner center />}

        {!auraLoading && (
          <>
            {/* ── Badge + info ────────────────────────────────────── */}
            <div className="mb-6 rounded-2xl border border-aura-border bg-aura-card p-5 flex items-center gap-4">
              <AuraBadge puntos={puntos} intereses={intereses} size="lg" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-aura-muted uppercase tracking-wider mb-0.5">Tu perfil Aura</p>
                <p className="text-base font-bold text-aura-ink flex items-center gap-1.5 truncate">
                  {arquetipo
                    ? <><Sparkles size={14} strokeWidth={1.5} className="text-aura-secondary flex-shrink-0" />{arquetipo}</>
                    : <><Sparkles size={14} strokeWidth={1.5} className="text-aura-muted flex-shrink-0" />Explorador</>
                  }
                </p>
                <p className="text-xs text-aura-muted mt-0.5">{current?.nombre ?? 'Nivel 1'} · {puntos} pts</p>
              </div>
            </div>

            {/* ── Error ───────────────────────────────────────────── */}
            {error && <ErrorMessage message={error} />}

            {/* ── Estado vacío ─────────────────────────────────────── */}
            {!resultado && !loading && (
              <div className="flex flex-col items-center justify-center py-14 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-aura-primary/10 mb-5">
                  <Map size={40} strokeWidth={1} className="text-aura-primary" />
                </div>
                <h2 className="text-lg font-semibold text-aura-ink mb-2">
                  Genera tu ruta personalizada
                </h2>
                <p className="text-sm text-aura-muted mb-6 max-w-xs leading-relaxed">
                  La IA analiza tus intereses y los stands que has visitado para recomendarte los mejores del evento.
                </p>
                <button
                  onClick={handleGenerar}
                  className="btn-primary inline-flex items-center gap-2 px-7 py-3"
                >
                  <Bot size={16} strokeWidth={1.5} />
                  Generar mi ruta
                </button>
              </div>
            )}

            {/* ── Cargando ─────────────────────────────────────────── */}
            {loading && (
              <div className="flex flex-col items-center py-16 gap-4">
                <div className="relative">
                  <div className="h-16 w-16 rounded-full bg-aura-primary/20 animate-ping-slow absolute inset-0" />
                  <div className="h-16 w-16 rounded-full bg-aura-primary/10 flex items-center justify-center relative">
                    <Bot size={28} strokeWidth={1.5} className="text-aura-primary" />
                  </div>
                </div>
                <p className="text-sm text-aura-muted animate-pulse">Analizando tu Aura…</p>
              </div>
            )}

            {/* ── Resultados ───────────────────────────────────────── */}
            {!loading && resultado && (
              <div className="space-y-4 animate-fade-in">

                {/* Resumen de la IA */}
                {resumen && (
                  <div className="rounded-2xl border border-aura-secondary/30 bg-aura-secondary/10 px-4 py-3 flex items-start gap-3">
                    <Bot size={16} strokeWidth={1.5} className="text-aura-secondary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-aura-ink leading-relaxed">{resumen}</p>
                  </div>
                )}

                {/* Badge IA o fallback */}
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-aura-muted uppercase tracking-wider">
                    {recomendaciones.length > 0
                      ? `${recomendaciones.length} stands recomendados`
                      : 'Sin recomendaciones aún'}
                  </p>
                  {conIA !== undefined && (
                    <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      conIA
                        ? 'bg-aura-secondary/20 text-aura-secondary'
                        : 'bg-aura-surface text-aura-muted border border-aura-border'
                    }`}>
                      {conIA ? '✦ Generado con IA' : 'Modo básico'}
                    </span>
                  )}
                </div>

                {/* Tarjetas de stands */}
                {recomendaciones.length > 0 ? (
                  <div className="space-y-3">
                    {recomendaciones.map((stand, i) => (
                      <StandCard key={stand.stand_id || i} stand={stand} index={i} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-aura-border bg-aura-card p-8 text-center">
                    <p className="text-sm text-aura-muted">
                      Visita más stands para obtener una ruta personalizada.
                    </p>
                  </div>
                )}

                {/* CTA volver */}
                <Link
                  to={`/eventos/${id}`}
                  className="mt-2 flex items-center justify-center gap-1.5 text-xs text-aura-muted hover:text-aura-ink transition-colors"
                >
                  Volver al evento <ChevronRight size={13} strokeWidth={2} />
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
