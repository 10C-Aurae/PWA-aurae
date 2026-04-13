import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as auraApi from '../api/auraApi'
import * as interaccionesApi from '../api/interaccionesApi'
import { MapPin, CheckCircle2, Zap, Timer, Telescope, Handshake } from 'lucide-react'
import * as eventosApi from '../api/eventosApi'
import { getAuraInfo, getNivelesConColor, inferirArquetipo } from '../utils/auraColors'
import AuraBadge from '../components/AuraBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { formatDateTime } from '../utils/formatDate'

function StatCard({ Icon, label, value }) {
  return (
    <div className="rounded-xl border border-aura-border bg-aura-card p-4 flex flex-col items-center gap-1 text-center">
      <Icon size={22} strokeWidth={1.5} className="text-aura-primary" />
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  )
}

export default function Capsula() {
  const { evento_id } = useParams()
  const { user }      = useAuth()

  const [evento,          setEvento]          = useState(null)
  const [aura,            setAura]            = useState(null)
  const [interacciones,   setInteracciones]   = useState([])
  const [snapshot,        setSnapshot]        = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [error,           setError]           = useState(null)

  useEffect(() => {
    if (!user?.id || !evento_id) return

    const fetchAll = async () => {
      setLoading(true)
      setError(null)
      try {
        const [auraRes, intRes, evRes] = await Promise.all([
          auraApi.obtener(user.id),
          interaccionesApi.porUsuarioEvento(user.id, evento_id),
          eventosApi.obtener(evento_id),
        ])
        setAura(auraRes.data)
        setInteracciones(intRes.data ?? [])
        setEvento(evRes.data)

        // Intenta obtener el snapshot más reciente (si el endpoint lo soporta)
        try {
          const snapRes = await auraApi.snapshot({ usuario_id: user.id, evento_id })
          setSnapshot(snapRes.data)
        } catch {
          // Snapshot no disponible — se muestra placeholder
        }
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar tu cápsula')
      } finally {
        setLoading(false)
      }
    }

    fetchAll()
  }, [user?.id, evento_id])

  if (loading) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-aura-bg px-4 py-8">
        <ErrorMessage message={error} />
      </div>
    )
  }

  const puntos         = aura?.aura_puntos ?? user?.aura_puntos ?? 0
  const intereses      = user?.vector_intereses ?? []
  const { current }    = getAuraInfo(puntos, intereses)
  const nivelesConColor = getNivelesConColor(intereses)
  const nivelInicial   = nivelesConColor[0]
  const arquetipo      = inferirArquetipo(intereses)

  // Estadísticas
  const totalVisitas          = interacciones.length
  const validadas             = interacciones.filter((i) => i.validada).length
  const puntosGanados         = validadas * 10

  // Stand con mayor tiempo
  const standMaxTiempo = interacciones.reduce((max, i) => {
    if (!max || i.duracion_seg > max.duracion_seg) return i
    return max
  }, null)

  // Timeline ordenado por timestamp
  const timeline = [...interacciones].sort(
    (a, b) => new Date(a.timestamp_inicio) - new Date(b.timestamp_inicio)
  )

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-lg">

        {/* Header */}
        <Link
          to="/mis-tickets"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← Mis Tickets
        </Link>
        <h1 className="text-2xl font-bold text-white mb-1">Tu Cápsula del Tiempo</h1>
        <p className="text-sm text-gray-400 mb-8">
          {evento?.nombre ?? `Evento ${evento_id}`}
        </p>

        {/* Evolución de Aura */}
        <section className="rounded-2xl border border-aura-border bg-aura-card p-6 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Tu evolución de Aura
          </h2>
          <div className="flex items-center justify-center gap-4">
            {/* Nivel inicial */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="h-14 w-14 rounded-full border-4 border-white/30"
                style={{ backgroundColor: nivelInicial.color, boxShadow: nivelInicial.glow }}
              />
              <p className="text-xs text-gray-400 text-center">{nivelInicial.nombre}</p>
            </div>

            {/* Flecha */}
            <div className="text-gray-500 text-xl">→</div>

            {/* Nivel actual */}
            <div className="flex flex-col items-center gap-2">
              <AuraBadge puntos={puntos} intereses={intereses} size="md" />
              <p className="text-xs text-gray-300 font-medium text-center">{current.nombre}</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-400 mt-4">
            Comenzaste en <span className="text-white">Neutro</span> →
            llegaste a <span className="text-white font-semibold">{current.nombre}</span>
          </p>
          {arquetipo && (
            <p className="text-center text-xs text-gray-500 mt-1">
              Arquetipo: {arquetipo.emoji} {arquetipo.nombre}
            </p>
          )}
        </section>

        {/* Estadísticas */}
        <section className="mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Tus estadísticas
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard Icon={MapPin}       label="Stands visitados"         value={totalVisitas} />
            <StatCard Icon={CheckCircle2} label="Interacciones validadas"  value={`${validadas}/${totalVisitas}`} />
            <StatCard Icon={Zap}          label="Puntos ganados"           value={`+${puntosGanados}`} />
            <StatCard
              Icon={Timer}
              label="Stand más visitado"
              value={standMaxTiempo ? `${Math.round(standMaxTiempo.duracion_seg)}s` : '—'}
            />
          </div>
        </section>

        {/* Resumen IA */}
        <section className="rounded-2xl border border-aura-border bg-aura-card p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Resumen de la IA
          </h2>
          {snapshot?.resumen_ia ? (
            <p className="text-sm text-gray-200 leading-relaxed">{snapshot.resumen_ia}</p>
          ) : (
            <div className="flex items-center gap-3 py-2">
              <Telescope size={28} strokeWidth={1.5} className="text-aura-faint flex-shrink-0" />
              <p className="text-sm text-gray-400 italic">
                Tu resumen con IA estará disponible próximamente.
                Continúa explorando el evento para generarlo.
              </p>
            </div>
          )}
          {snapshot?.recomendaciones?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-aura-border">
              <p className="text-xs font-medium text-gray-400 mb-2">Recomendaciones</p>
              <ul className="flex flex-col gap-1.5">
                {snapshot.recomendaciones.map((r, i) => (
                  <li key={i} className="text-xs text-gray-300 flex gap-2">
                    <span className="text-aura-primary">→</span> {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* Timeline de interacciones */}
        {timeline.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Tus paradas
            </h2>
            <div className="flex flex-col">
              {timeline.map((inter, i) => (
                <div key={inter.id ?? i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-3 w-3 rounded-full mt-1 flex-shrink-0 ${
                        inter.validada ? 'bg-green-400' : 'bg-gray-600'
                      }`}
                    />
                    {i < timeline.length - 1 && (
                      <div className="w-0.5 flex-1 bg-aura-border mt-1" />
                    )}
                  </div>
                  <div className="mb-3 flex-1 rounded-lg border border-aura-border bg-aura-card p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-white flex items-center gap-1.5">
                        {inter.tipo === 'user_handshake'
                          ? <><Handshake size={12} strokeWidth={1.5} /> Handshake</>
                          : <><MapPin size={12} strokeWidth={1.5} /> Stand visit</>}
                      </span>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          inter.validada
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {inter.validada ? 'Validada' : 'Sin validar'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      {formatDateTime(inter.timestamp_inicio)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Duración: {Math.round(inter.duracion_seg ?? 0)}s
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {timeline.length === 0 && (
          <div className="text-center py-10 text-gray-500 text-sm">
            Aún no registras interacciones en este evento
          </div>
        )}

      </div>
    </div>
  )
}
