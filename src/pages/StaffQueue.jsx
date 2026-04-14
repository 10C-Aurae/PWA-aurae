import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as colasApi from '../api/colaApi'
import * as standsApi from '../api/standsApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function StaffQueue() {
  const { stand_id } = useParams()
  const [stand, setStand] = useState(null)
  const [estado, setEstado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    try {
      const [standRes, colaRes] = await Promise.all([
        standsApi.obtener(stand_id),
        colasApi.porStand(stand_id)
      ])
      setStand(standRes.data)
      setEstado(colaRes.data)
      setError(null)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    // Polling every 10 seconds to keep the queue pseudo-realtime.
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

  if (loading && !stand) return <LoadingSpinner center />

  return (
    <div className="min-h-[calc(100vh-80px)] bg-aura-bg px-4 py-8 pb-20">
      <div className="mx-auto max-w-md">
        {error && <ErrorMessage message={error} onRetry={fetchData} />}
        
        {stand && (
          <div className="mb-6 flex flex-col items-center text-center">
            <h1 className="text-2xl font-bold text-white">{stand.nombre}</h1>
            <p className="text-sm text-gray-400">Panel de Fila Virtual - Staff</p>
          </div>
        )}

        {estado && (
          <div className="space-y-6">
            {/* Usuario en atención */}
            <div className="rounded-2xl border border-aura-border bg-aura-card p-6">
              <h2 className="text-sm font-semibold text-gray-400 mb-2">En atención actualmente</h2>
              {estado.en_atencion ? (
                <div className="flex flex-col gap-4">
                  <div className="rounded-xl bg-aura-primary/10 border border-aura-primary/30 p-4 flex items-center justify-between shadow-[0_0_15px_rgba(255,255,255,0.05)]">
                    <div>
                      <p className="text-xs text-aura-primary font-bold uppercase tracking-wider mb-1">Tu turno</p>
                      <p className="text-lg font-bold text-white">Ticket #{estado.en_atencion.posicion}</p>
                    </div>
                    <div className="h-10 w-10 rounded-full bg-aura-primary/20 flex items-center justify-center animate-pulse">
                      <span className="text-xl">👤</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleAtendido(estado.en_atencion.id)}
                    disabled={actionLoading}
                    className="w-full rounded-xl bg-green-500 py-3 font-bold text-white hover:bg-green-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Marcar como Atendido
                  </button>
                </div>
              ) : (
                <div className="w-full rounded-xl bg-white/5 p-6 text-center border border-white/5">
                  <p className="text-gray-400 font-medium tracking-wide">Nadie en atención</p>
                </div>
              )}
            </div>

            {/* Fila Virtual */}
            <div className="rounded-2xl border border-aura-border bg-aura-card p-6">
              <div className="flex justify-between items-end mb-4">
                <h2 className="text-sm font-semibold text-gray-400">En Fila Virtual</h2>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white shadow-sm">{estado.total_esperando}</span>
                  <span className="text-xs text-gray-400 ml-1">personas (~{estado.tiempo_espera_min} min)</span>
                </div>
              </div>

              <button 
                onClick={handleLlamar}
                disabled={actionLoading || estado.total_esperando === 0}
                className="w-full rounded-xl bg-aura-primary py-3 font-bold text-white hover:bg-blue-600 focus:ring-4 focus:ring-aura-primary/30 disabled:opacity-50 disabled:bg-gray-700 transition-all mb-4">
                {actionLoading ? 'Llamando...' : 'Llamar Siguiente'}
              </button>

              <div className="space-y-2">
                {estado.usuarios_en_cola.map((u, i) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg bg-white/5 px-4 py-3 border border-white/10 hover:bg-white/10 transition-colors">
                    <span className="text-sm font-medium text-white">Ticket #{u.posicion}</span>
                    <span className="text-xs text-gray-500">#{i + 1} en fila</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
