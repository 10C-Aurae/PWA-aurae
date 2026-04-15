import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as colaApi from '../../api/colaApi'
import * as standsApi from '../../api/standsApi'
import { ESTADO_COLA } from '../../api/colaApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { Clock, Bell, Check, RefreshCw, MapPin } from 'lucide-react'

function contarPor(usuarios, status) {
  return usuarios.filter((u) => u.status === status).length
}

function EstadoBadgeMini({ status }) {
  const map = {
    [ESTADO_COLA.ESPERANDO]:  'bg-yellow-500/20 text-yellow-400',
    [ESTADO_COLA.ACTIVO]:     'bg-blue-500/20 text-blue-400 animate-pulse',
    [ESTADO_COLA.CONFIRMADO]: 'bg-emerald-500/20 text-emerald-400',
    [ESTADO_COLA.ATENDIDO]:   'bg-green-500/20 text-green-400',
    [ESTADO_COLA.CANCELADO]:  'bg-gray-500/20 text-gray-400',
  }
  const labels = {
    [ESTADO_COLA.ESPERANDO]:  'En cola',
    [ESTADO_COLA.ACTIVO]:     'Llamado',
    [ESTADO_COLA.CONFIRMADO]: 'Presente ✓',
    [ESTADO_COLA.ATENDIDO]:   'Atendido',
    [ESTADO_COLA.CANCELADO]:  'Cancelado',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[status] ?? ''}`}>
      {labels[status] ?? status}
    </span>
  )
}

function StandColaPanel({ stand, onLlamarSiguiente, onMarcarAtendido, llamando, marcando }) {
  const usuarios   = stand.usuarios_en_cola ?? []
  const enEspera   = contarPor(usuarios, ESTADO_COLA.ESPERANDO)
  const activos    = contarPor(usuarios, ESTADO_COLA.ACTIVO)
  const presentes  = contarPor(usuarios, ESTADO_COLA.CONFIRMADO)
  const atendidos  = contarPor(usuarios, ESTADO_COLA.ATENDIDO)
  const primero    = usuarios.find((u) => u.status === ESTADO_COLA.ESPERANDO)

  return (
    <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-white">{stand.nombre}</h3>
          <div className="flex flex-wrap gap-3 mt-1">
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <Clock size={11} strokeWidth={2} /> {enEspera} en espera
            </span>
            {activos > 0 && (
              <span className="text-xs text-blue-400 flex items-center gap-1">
                <Bell size={11} strokeWidth={2} /> {activos} llamados
              </span>
            )}
            {presentes > 0 && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <MapPin size={11} strokeWidth={2} /> {presentes} presentes
              </span>
            )}
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check size={11} strokeWidth={2} /> {atendidos} atendidos
            </span>
          </div>
        </div>
        <button
          onClick={() => onLlamarSiguiente(stand.id)}
          disabled={!primero || llamando === stand.id}
          className="flex-shrink-0 rounded-lg bg-aura-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          {llamando === stand.id ? 'Llamando…' : 'Llamar siguiente'}
        </button>
      </div>

      {usuarios.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Cola vacía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {usuarios.map((u, idx) => (
            <div
              key={u.id}
              className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                u.status === ESTADO_COLA.CONFIRMADO
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-aura-border bg-aura-bg'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-4">#{u.posicion || idx + 1}</span>
                <span className="text-sm text-white font-mono text-xs">
                  {u.usuario_id.slice(-8)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {u.status === ESTADO_COLA.ESPERANDO && u.tiempo_espera_min != null && (
                  <span className="text-xs text-gray-500">~{u.tiempo_espera_min} min</span>
                )}
                <EstadoBadgeMini status={u.status} />
                {(u.status === ESTADO_COLA.ACTIVO || u.status === ESTADO_COLA.CONFIRMADO) && (
                  <button
                    onClick={() => onMarcarAtendido(u.id, stand.id)}
                    disabled={marcando === u.id}
                    className="rounded px-2 py-0.5 text-[10px] font-medium bg-green-500/20 text-green-400 hover:bg-green-500/30 disabled:opacity-50 transition-colors whitespace-nowrap"
                  >
                    {marcando === u.id ? '…' : 'Atendido'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminColas() {
  const { evento_id }          = useParams()
  const [stands, setStands]    = useState([])   // stands enriquecidos con colas
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState(null)
  const [llamando, setLlamando] = useState(null)
  const [marcando, setMarcando] = useState(null)
  const intervalRef            = useRef(null)

  const fetchColas = useCallback(async () => {
    try {
      const standsRes = await standsApi.porEvento(evento_id)
      const standsData = standsRes.data

      // Para cada stand, obtener el estado de la cola
      const colasResults = await Promise.allSettled(
        standsData.map((s) => colaApi.porStand(s.id))
      )

      const standsConColas = standsData.map((s, i) => {
        const result = colasResults[i]
        if (result.status === 'fulfilled') {
          return { ...s, usuarios_en_cola: result.value.data.usuarios_en_cola ?? [] }
        }
        return { ...s, usuarios_en_cola: [] }
      })

      setStands(standsConColas)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar las colas')
    } finally {
      setLoading(false)
    }
  }, [evento_id])

  useEffect(() => {
    fetchColas()
    intervalRef.current = setInterval(fetchColas, 10_000)
    return () => clearInterval(intervalRef.current)
  }, [fetchColas])

  const handleLlamarSiguiente = async (standId) => {
    setLlamando(standId)
    try {
      await colaApi.llamarSiguiente(standId)
      // Actualizar localmente antes de que llegue el próximo ciclo de polling
      setStands((prev) =>
        prev.map((s) => {
          if (s.id !== standId) return s
          const primero = s.usuarios_en_cola.find((u) => u.status === ESTADO_COLA.ESPERANDO)
          if (!primero) return s
          return {
            ...s,
            usuarios_en_cola: s.usuarios_en_cola.map((u) =>
              u.id === primero.id ? { ...u, status: ESTADO_COLA.ACTIVO } : u
            ),
          }
        })
      )
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al llamar al siguiente usuario')
    } finally {
      setLlamando(null)
    }
  }

  const handleMarcarAtendido = async (colaId, standId) => {
    setMarcando(colaId)
    try {
      await colaApi.marcarAtendido(colaId, standId)
      setStands((prev) =>
        prev.map((s) => {
          if (s.id !== standId) return s
          return {
            ...s,
            usuarios_en_cola: s.usuarios_en_cola.map((u) =>
              u.id === colaId ? { ...u, status: ESTADO_COLA.ATENDIDO } : u
            ),
          }
        })
      )
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al marcar como atendido')
    } finally {
      setMarcando(null)
    }
  }

  const totalEspera    = stands.reduce((s, c) => s + contarPor(c.usuarios_en_cola ?? [], ESTADO_COLA.ESPERANDO), 0)
  const totalActivos   = stands.reduce((s, c) => s + contarPor(c.usuarios_en_cola ?? [], ESTADO_COLA.ACTIVO), 0)
  const totalPresentes = stands.reduce((s, c) => s + contarPor(c.usuarios_en_cola ?? [], ESTADO_COLA.CONFIRMADO), 0)
  const totalAtendidos = stands.reduce((s, c) => s + contarPor(c.usuarios_en_cola ?? [], ESTADO_COLA.ATENDIDO), 0)

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">

        <Link
          to="/admin/eventos"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← Volver a Eventos
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Colas Virtuales</h1>
          <button
            onClick={fetchColas}
            className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-300 transition-colors"
          >
            <RefreshCw size={11} strokeWidth={2} /> {loading ? 'Actualizando…' : 'Actualizar'}
          </button>
        </div>
        <p className="text-sm text-gray-400 mb-6">Gestión de turnos por stand · auto-refresh 10s</p>

        {error && <ErrorMessage message={error} className="mb-4" />}

        {/* Resumen global */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-yellow-400">{totalEspera}</p>
            <p className="text-xs text-gray-400 mt-0.5">En espera</p>
          </div>
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{totalActivos}</p>
            <p className="text-xs text-gray-400 mt-0.5">Llamados</p>
          </div>
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-emerald-400">{totalPresentes}</p>
            <p className="text-xs text-gray-400 mt-0.5">Presentes</p>
          </div>
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-green-400">{totalAtendidos}</p>
            <p className="text-xs text-gray-400 mt-0.5">Atendidos</p>
          </div>
        </div>

        {loading && stands.length === 0 && <LoadingSpinner center />}

        {!loading && stands.length === 0 && !error && (
          <p className="text-center text-sm text-gray-500 py-10">
            No hay stands configurados para este evento.
          </p>
        )}

        <div className="flex flex-col gap-4">
          {stands.map((stand) => (
            <StandColaPanel
              key={stand.id}
              stand={stand}
              onLlamarSiguiente={handleLlamarSiguiente}
              onMarcarAtendido={handleMarcarAtendido}
              llamando={llamando}
              marcando={marcando}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
