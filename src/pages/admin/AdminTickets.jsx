import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as ticketsApi from '../../api/ticketsApi'
import * as eventosApi from '../../api/eventosApi'
import { formatDateTime } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const STATUS_STYLES = {
  activo:    'bg-green-500/20 text-green-400',
  usado:     'bg-gray-500/20 text-gray-400',
  cancelado: 'bg-red-500/20 text-red-400',
  expirado:  'bg-yellow-500/20 text-yellow-400',
}

const LIMIT = 20

export default function AdminTickets() {
  const { evento_id } = useParams()
  const [tickets, setTickets] = useState([])
  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(0)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [tRes, eRes] = await Promise.all([
        ticketsApi.porEvento(evento_id, page * LIMIT, LIMIT),
        eventosApi.obtener(evento_id),
      ])
      setTickets(tRes.data)
      setEvento(eRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar tickets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [evento_id, page])

  const handleMarcarUsado = async (id) => {
    try {
      await ticketsApi.marcarUsado(id)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error')
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <Link to="/admin" className="text-xs text-gray-500 hover:text-white">← Admin</Link>
        <h1 className="text-2xl font-bold text-white mt-1 mb-1">
          Tickets {evento ? `— ${evento.nombre}` : ''}
        </h1>

        {loading && <LoadingSpinner center />}
        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {!loading && tickets.length === 0 && (
          <p className="text-gray-400 text-center py-12">No hay tickets para este evento</p>
        )}

        {!loading && tickets.length > 0 && (
          <>
            <div className="rounded-2xl border border-aura-border bg-aura-card overflow-auto mt-4">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-aura-border text-left">
                    <th className="px-4 py-3 text-xs text-gray-400">ID</th>
                    <th className="px-4 py-3 text-xs text-gray-400">Usuario</th>
                    <th className="px-4 py-3 text-xs text-gray-400">Tipo</th>
                    <th className="px-4 py-3 text-xs text-gray-400">Estado</th>
                    <th className="px-4 py-3 text-xs text-gray-400">QR</th>
                    <th className="px-4 py-3 text-xs text-gray-400">Fecha uso</th>
                    <th className="px-4 py-3 text-xs text-gray-400">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr key={t.id} className="border-b border-aura-border/50 hover:bg-white/5">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{t.id}</td>
                      <td className="px-4 py-3 text-gray-300">{t.usuario_id}</td>
                      <td className="px-4 py-3 text-gray-300 capitalize">{t.tipo?.replace('_', ' ')}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_STYLES[t.status_uso] ?? STATUS_STYLES.activo}`}>
                          {t.status_uso}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs max-w-[100px] truncate">{t.qr_code ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 text-xs">{t.fecha_uso ? formatDateTime(t.fecha_uso) : '—'}</td>
                      <td className="px-4 py-3">
                        {t.status_uso === 'activo' && (
                          <button
                            onClick={() => handleMarcarUsado(t.id)}
                            className="text-xs text-aura-primary hover:text-blue-400 transition-colors"
                          >
                            Marcar usado
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center gap-3 mt-6">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-300 disabled:opacity-30 hover:border-aura-primary/50 transition-all">Anterior</button>
              <span className="flex items-center text-sm text-gray-500">Pág. {page + 1}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={tickets.length < LIMIT} className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-300 disabled:opacity-30 hover:border-aura-primary/50 transition-all">Siguiente</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
