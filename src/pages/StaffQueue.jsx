import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { LogOut, RefreshCw } from 'lucide-react'
import * as colasApi from '../api/colaApi'
import * as standsApi from '../api/standsApi'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function StaffQueue() {
  const { stand_id } = useParams()
  const { logout, user } = useAuth()
  const [stand, setStand] = useState(null)
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastRefresh, setLastRefresh] = useState(null)

  const fetchData = async () => {
    try {
      const [standRes, colaRes] = await Promise.all([
        standsApi.obtener(stand_id),
        colasApi.porStand(stand_id)
      ])
      setStand(standRes.data)
      setEstado(colaRes.data)
      setError(null)
      setLastRefresh(new Date())
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 10000)
    return () => clearInterval(interval)
  }, [stand_id])

  const handleLlamar = async () => {
    setActionLoading(true)
    try {
      await colasApi.llamarSiguiente(stand_id)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al llamar siguiente')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAtendido = async (colaId) => {
    setActionLoading(true)
    try {
      await colasApi.marcarAtendido(colaId, stand_id)
      await fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al marcar atendido')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg flex flex-col">
      {/* Staff header */}
      <header className="sticky top-0 z-40 bg-aura-nav border-b border-white/10 shadow-nav px-4">
        <div className="mx-auto max-w-md flex h-14 items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 leading-none">Panel de cola</p>
            <p className="text-sm font-bold text-white leading-snug truncate max-w-[200px]">
              {stand?.nombre ?? '…'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={actionLoading}
              className="text-gray-400 hover:text-white transition-colors disabled:opacity-40"
              title="Actualizar"
            >
              <RefreshCw size={16} strokeWidth={1.5} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-gray-400 hover:text-red-400 hover:border-red-400/40 transition-all"
            >
              <LogOut size={13} strokeWidth={1.5} />
              Salir
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-6 pb-safe">
        <div className="mx-auto max-w-md space-y-4">
          {loading && !stand && <LoadingSpinner center />}
          {error && <ErrorMessage message={error} onRetry={fetchData} />}

          {estado && (
            <>
              {/* Atención actual */}
              <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
                <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                  En atención ahora
                </h2>
                {estado.en_atencion ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-xl bg-aura-primary/10 border border-aura-primary/30 p-4 flex items-center justify-between">
                      <div>
                        <p className="text-xs text-aura-primary font-bold uppercase tracking-wider mb-0.5">
                          Turno #{estado.en_atencion.posicion}
                        </p>
                        {estado.en_atencion.servicio_nombre && (
                          <p className="text-xs text-gray-400">
                            {estado.en_atencion.servicio_nombre}
                          </p>
                        )}
                      </div>
                      <div className="h-10 w-10 rounded-full bg-aura-primary/20 flex items-center justify-center animate-pulse">
                        <span className="text-xl">👤</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAtendido(estado.en_atencion.id)}
                      disabled={actionLoading}
                      className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                        <polyline points="22 4 12 14.01 9 11.01" />
                      </svg>
                      Marcar como Atendido
                    </button>
                  </div>
                ) : (
                  <div className="rounded-xl bg-white/5 p-5 text-center border border-white/5">
                    <p className="text-gray-500 text-sm">Nadie en atención</p>
                  </div>
                )}
              </div>

              {/* Cola */}
              <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
                <div className="flex justify-between items-end mb-4">
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    En fila
                  </h2>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-white">{estado.total_esperando}</span>
                    <span className="text-xs text-gray-500 ml-1">
                      (~{estado.tiempo_espera_min} min)
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLlamar}
                  disabled={actionLoading || estado.total_esperando === 0}
                  className="w-full rounded-xl bg-aura-primary py-3.5 font-bold text-white hover:bg-blue-600 focus:ring-4 focus:ring-aura-primary/30 disabled:opacity-40 disabled:bg-gray-700 transition-all mb-4"
                >
                  {actionLoading ? 'Llamando…' : '📣  Llamar Siguiente'}
                </button>

                {estado.usuarios_en_cola.length === 0 ? (
                  <p className="text-center text-sm text-gray-600 py-4">La fila está vacía</p>
                ) : (
                  <div className="space-y-2">
                    {estado.usuarios_en_cola.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 border border-white/10"
                      >
                        <div>
                          <span className="text-sm font-semibold text-white">
                            #{u.posicion}
                          </span>
                          {u.servicio_nombre && (
                            <span className="ml-2 text-xs text-gray-500">{u.servicio_nombre}</span>
                          )}
                        </div>
                        <span className="text-xs text-gray-600">~{u.tiempo_espera_min} min</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {lastRefresh && (
                <p className="text-center text-[10px] text-gray-700">
                  Actualizado {lastRefresh.toLocaleTimeString()} · auto cada 10s
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
