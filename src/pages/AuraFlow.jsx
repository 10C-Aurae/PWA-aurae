import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useAura } from '../hooks/useAura'
import { getAuraInfo, inferirArquetipo } from '../utils/auraColors'
import {
  MapPin, FlaskConical, ChefHat, Palette, Handshake, Gamepad2, Leaf, Zap, Sparkles,
  Map, RefreshCw, Check,
} from 'lucide-react'

const ARCHETYPE_ICONS = { FlaskConical, ChefHat, Handshake, Palette, Gamepad2, Leaf }
import AuraBadge from '../components/AuraBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

// Devuelve el componente Lucide apropiado según el texto de la recomendación
function iconoPorTexto(texto) {
  const t = texto.toLowerCase()
  if (t.includes('stand') || t.includes('visita') || t.includes('explora')) return MapPin
  if (t.includes('tecnolog') || t.includes('innovaci')) return FlaskConical
  if (t.includes('gastro') || t.includes('comida')) return ChefHat
  if (t.includes('musica') || t.includes('arte') || t.includes('creativ')) return Palette
  if (t.includes('network') || t.includes('negocio') || t.includes('convers')) return Handshake
  if (t.includes('gaming') || t.includes('jueg')) return Gamepad2
  if (t.includes('sustent') || t.includes('eco') || t.includes('verde')) return Leaf
  if (t.includes('deportes') || t.includes('activ')) return Zap
  return Sparkles
}

// Extrae el nombre del stand si la recomendación lo menciona entre comillas o con "Stand"
function extractStandNombre(texto) {
  const match = texto.match(/"([^"]+)"|'([^']+)'/)
  if (match) return match[1] || match[2]
  return null
}

function Parada({ numero, recomendacion }) {
  const IconComponent = iconoPorTexto(recomendacion)
  const standNombre = extractStandNombre(recomendacion)

  return (
    <div className="flex gap-4">
      {/* Línea de tiempo */}
      <div className="flex flex-col items-center">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-aura-primary bg-aura-primary/20 text-sm font-bold text-aura-primary">
          {numero}
        </div>
        <div className="mt-1 w-0.5 flex-1 bg-aura-border" />
      </div>

      {/* Tarjeta */}
      <div className="mb-4 flex-1 rounded-xl border border-aura-border bg-aura-card p-4">
        <div className="flex items-start gap-3">
          <IconComponent size={20} strokeWidth={1.5} className="text-aura-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-gray-200 leading-relaxed">{recomendacion}</p>
            {standNombre && (
              <span className="mt-2 inline-block rounded-full bg-aura-primary/20 px-3 py-0.5 text-xs text-aura-primary">
                {standNombre}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuraFlow() {
  const { id } = useParams()
  const { user } = useAuth()
  const { aura, loading: auraLoading, generarSnapshot } = useAura(user?.id)

  const [snapshot, setSnapshot]       = useState(null)
  const [generating, setGenerating]   = useState(false)
  const [genError, setGenError]       = useState(null)
  const [lastUpdate, setLastUpdate]   = useState(null)

  const puntos = aura?.aura_puntos ?? user?.aura_puntos ?? 0
  const { current } = getAuraInfo(puntos)
  const arquetipo = inferirArquetipo(user?.vector_intereses ?? [])

  const handleGenerar = async () => {
    if (!user?.id) return
    setGenerating(true)
    setGenError(null)
    try {
      const data = await generarSnapshot({ usuario_id: user.id })
      setSnapshot(data)
      setLastUpdate(new Date())
    } catch (err) {
      setGenError(err.response?.data?.detail || 'Error al generar la ruta')
    } finally {
      setGenerating(false)
    }
  }

  const minutosDesde = lastUpdate
    ? Math.floor((Date.now() - lastUpdate.getTime()) / 60000)
    : null

  const recomendaciones = snapshot?.recomendaciones ?? []

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Aura Flow</h1>
            <p className="text-sm text-gray-400">Tu ruta personalizada por el evento</p>
          </div>
          {snapshot && (
            <button
              onClick={handleGenerar}
              disabled={generating}
              className="rounded-lg border border-aura-primary/30 bg-aura-primary/10 px-3 py-1.5 text-xs font-medium text-aura-primary hover:bg-aura-primary hover:text-white disabled:opacity-50 transition-all duration-200 inline-flex items-center gap-1.5"
            >
              {generating ? <><LoadingSpinner size="sm" /> Regenerando</> : <><RefreshCw size={12} strokeWidth={2} /> Regenerar</>}
            </button>
          )}
        </div>

        {auraLoading && <LoadingSpinner center />}

        {!auraLoading && (
          <>
            {/* Badge + arquetipo */}
            <div className="mb-6 rounded-2xl border border-aura-border bg-aura-card p-5 flex items-center gap-4">
              <AuraBadge puntos={puntos} size="lg" />
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider">Tu arquetipo</p>
                <p className="text-lg font-bold text-white flex items-center gap-2">
                  {arquetipo
                    ? (() => {
                        const AIcon = ARCHETYPE_ICONS[arquetipo.iconName]
                        return <>{AIcon && <AIcon size={16} strokeWidth={1.5} />}{arquetipo.nombre}</>
                      })()
                    : <><Sparkles size={16} strokeWidth={1.5} />Explorador</>
                  }
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{current.nombre} · {puntos} pts</p>
              </div>
            </div>

            {/* Timestamp */}
            {lastUpdate && (
              <p className="text-xs text-gray-500 mb-4 text-right">
                Última actualización: hace {minutosDesde === 0 ? 'menos de 1' : minutosDesde} min
              </p>
            )}

            {/* Error */}
            {genError && <ErrorMessage message={genError} />}

            {/* Sin snapshot */}
            {!snapshot && !generating && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Map size={56} strokeWidth={1} className="text-aura-faint mb-4" />
                <h2 className="text-lg font-semibold text-white mb-2">
                  Genera tu ruta personalizada
                </h2>
                <p className="text-sm text-gray-400 mb-6 max-w-xs">
                  El concierge de IA analiza tus intereses e interacciones para recomendarte
                  los mejores stands del evento.
                </p>
                <button
                  onClick={handleGenerar}
                  className="rounded-lg bg-aura-primary px-6 py-3 text-sm font-semibold text-white hover:bg-blue-600 transition-all duration-200"
                >
                  Generar mi ruta personalizada
                </button>
              </div>
            )}

            {/* Generando */}
            {generating && (
              <div className="flex flex-col items-center py-16 gap-4">
                <LoadingSpinner size="lg" />
                <p className="text-sm text-gray-400 animate-pulse">Analizando tu Aura…</p>
              </div>
            )}

            {/* Ruta con paradas */}
            {!generating && recomendaciones.length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                  Tu ruta · {recomendaciones.length} paradas
                </h2>
                <div>
                  {recomendaciones.map((rec, i) => (
                    <Parada key={i} numero={i + 1} recomendacion={rec} />
                  ))}
                  {/* Parada final */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 border-green-500 bg-green-500/20">
                        <Check size={16} strokeWidth={2.5} className="text-green-400" />
                      </div>
                    </div>
                    <div className="mb-4 flex-1 rounded-xl border border-green-500/30 bg-green-500/10 p-4">
                      <p className="text-sm text-green-400 font-medium">¡Ruta completada!</p>
                      <p className="text-xs text-gray-400 mt-0.5">Sigue explorando para ganar más Aura</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sin recomendaciones pero sí snapshot */}
            {!generating && snapshot && recomendaciones.length === 0 && (
              <div className="text-center py-10 text-gray-400 text-sm">
                No hay recomendaciones disponibles aún. Visita más stands para obtener una ruta personalizada.
              </div>
            )}
          </>
        )}

        <div className="mt-8 text-center">
          <Link to={`/eventos/${id}`} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
            ← Volver al evento
          </Link>
        </div>
      </div>
    </div>
  )
}
