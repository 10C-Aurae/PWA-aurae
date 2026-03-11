import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ESTADO_COLA } from '../../api/colaApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import { Clock, Bell, Check, RefreshCw } from 'lucide-react'

// ─────────────────────────────────────────────────────────────
// Mock de colas por stand mientras el backend implementa /colas
// TODO: reemplazar polling por WebSocket ws://backend/ws/colas/:stand_id
// ─────────────────────────────────────────────────────────────
const MOCK_COLAS = [
  {
    stand_id: 'stand-abc',
    stand_nombre: 'Stand de IA & Robótica',
    usuarios: [
      { turno_id: 't1', nombre: 'Ana López',   posicion: 1, estado: ESTADO_COLA.NOTIFICADO, espera_min: 2  },
      { turno_id: 't2', nombre: 'Luis Pérez',  posicion: 2, estado: ESTADO_COLA.EN_COLA,    espera_min: 8  },
      { turno_id: 't3', nombre: 'Sara Gutiérrez', posicion: 3, estado: ESTADO_COLA.EN_COLA, espera_min: 14 },
    ],
  },
  {
    stand_id: 'stand-def',
    stand_nombre: 'Gastro Lab',
    usuarios: [
      { turno_id: 't4', nombre: 'Carlos Díaz', posicion: 1, estado: ESTADO_COLA.EN_COLA, espera_min: 5 },
    ],
  },
  {
    stand_id: 'stand-ghi',
    stand_nombre: 'Creative Hub',
    usuarios: [],
  },
]

function contarPor(usuarios, estado) {
  return usuarios.filter((u) => u.estado === estado).length
}

function EstadoBadgeMini({ estado }) {
  const map = {
    [ESTADO_COLA.EN_COLA]:    'bg-yellow-500/20 text-yellow-400',
    [ESTADO_COLA.NOTIFICADO]: 'bg-blue-500/20 text-blue-400 animate-pulse',
    [ESTADO_COLA.ATENDIDO]:   'bg-green-500/20 text-green-400',
    [ESTADO_COLA.EXPIRADO]:   'bg-gray-500/20 text-gray-400',
    [ESTADO_COLA.REGISTRADO]: 'bg-gray-500/20 text-gray-400',
  }
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${map[estado] ?? ''}`}>
      {estado}
    </span>
  )
}

function StandColaPanel({ stand, onLlamarSiguiente }) {
  const enCola    = contarPor(stand.usuarios, ESTADO_COLA.EN_COLA)
  const notif     = contarPor(stand.usuarios, ESTADO_COLA.NOTIFICADO)
  const atendidos = contarPor(stand.usuarios, ESTADO_COLA.ATENDIDO)
  const primero   = stand.usuarios.find((u) => u.estado === ESTADO_COLA.EN_COLA)

  return (
    <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
      {/* Header del stand */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="font-semibold text-white">{stand.stand_nombre}</h3>
          <div className="flex gap-3 mt-1">
            <span className="text-xs text-yellow-400 flex items-center gap-1">
              <Clock size={11} strokeWidth={2} /> {enCola} en cola
            </span>
            <span className="text-xs text-blue-400 flex items-center gap-1">
              <Bell size={11} strokeWidth={2} /> {notif} notificados
            </span>
            <span className="text-xs text-green-400 flex items-center gap-1">
              <Check size={11} strokeWidth={2} /> {atendidos} atendidos
            </span>
          </div>
        </div>
        <button
          onClick={() => onLlamarSiguiente(stand.stand_id)}
          disabled={!primero}
          className="flex-shrink-0 rounded-lg bg-aura-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
        >
          Llamar siguiente
        </button>
      </div>

      {/* Lista de usuarios */}
      {stand.usuarios.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">Cola vacía</p>
      ) : (
        <div className="flex flex-col gap-2">
          {stand.usuarios.map((u) => (
            <div
              key={u.turno_id}
              className="flex items-center justify-between rounded-lg border border-aura-border bg-aura-bg px-3 py-2"
            >
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-gray-500 w-4">#{u.posicion}</span>
                <span className="text-sm text-white">{u.nombre}</span>
              </div>
              <div className="flex items-center gap-2">
                {u.estado === ESTADO_COLA.EN_COLA && (
                  <span className="text-xs text-gray-500">~{u.espera_min} min</span>
                )}
                <EstadoBadgeMini estado={u.estado} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminColas() {
  const { evento_id }       = useParams()
  const [colas, setColas]   = useState([])
  const [loading, setLoading] = useState(true)
  const intervalRef         = useRef(null)

  const fetchColas = async () => {
    // TODO: reemplazar por colaApi.porEvento(evento_id) cuando el backend esté listo
    // TODO: reemplazar polling por WebSocket ws://backend/ws/colas/:stand_id
    await new Promise((r) => setTimeout(r, 300))
    setColas(MOCK_COLAS)
    setLoading(false)
  }

  useEffect(() => {
    fetchColas()
    intervalRef.current = setInterval(fetchColas, 10_000)
    return () => clearInterval(intervalRef.current)
  }, [evento_id])

  const handleLlamarSiguiente = (standId) => {
    // TODO: llamar a colaApi.llamarSiguiente(standId) cuando el backend esté listo
    setColas((prev) =>
      prev.map((stand) => {
        if (stand.stand_id !== standId) return stand
        const primero = stand.usuarios.find((u) => u.estado === ESTADO_COLA.EN_COLA)
        if (!primero) return stand
        return {
          ...stand,
          usuarios: stand.usuarios.map((u) =>
            u.turno_id === primero.turno_id
              ? { ...u, estado: ESTADO_COLA.NOTIFICADO }
              : u
          ),
        }
      })
    )
  }

  // Totales globales
  const totalEnCola    = colas.reduce((s, c) => s + contarPor(c.usuarios, ESTADO_COLA.EN_COLA), 0)
  const totalNotif     = colas.reduce((s, c) => s + contarPor(c.usuarios, ESTADO_COLA.NOTIFICADO), 0)
  const totalAtendidos = colas.reduce((s, c) => s + contarPor(c.usuarios, ESTADO_COLA.ATENDIDO), 0)

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-2xl">

        {/* Breadcrumb */}
        <Link
          to="/admin/eventos"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-6 transition-colors"
        >
          ← Volver a Eventos
        </Link>

        <div className="flex items-center justify-between mb-1">
          <h1 className="text-2xl font-bold text-white">Colas Virtuales</h1>
          <span className="text-xs text-gray-500 flex items-center gap-1"><RefreshCw size={11} strokeWidth={2} /> 10s</span>
        </div>
        <p className="text-sm text-gray-400 mb-6">Gestión de turnos por stand</p>

        {/* Resumen global */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-yellow-400">{totalEnCola}</p>
            <p className="text-xs text-gray-400 mt-0.5">En cola</p>
          </div>
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{totalNotif}</p>
            <p className="text-xs text-gray-400 mt-0.5">Notificados</p>
          </div>
          <div className="rounded-xl border border-aura-border bg-aura-card p-3 text-center">
            <p className="text-xl font-bold text-green-400">{totalAtendidos}</p>
            <p className="text-xs text-gray-400 mt-0.5">Atendidos</p>
          </div>
        </div>

        {loading && <LoadingSpinner center />}

        {!loading && (
          <div className="flex flex-col gap-4">
            {colas.map((stand) => (
              <StandColaPanel
                key={stand.stand_id}
                stand={stand}
                onLlamarSiguiente={handleLlamarSiguiente}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
