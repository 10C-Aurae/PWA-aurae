import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend,
} from 'recharts'
import * as ticketsApi from '../../api/ticketsApi'
import * as standsApi from '../../api/standsApi'
import * as eventosApi from '../../api/eventosApi'
import * as interaccionesApi from '../../api/interaccionesApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

export default function AdminReportes() {
  const { evento_id } = useParams()
  const [evento, setEvento] = useState(null)
  const [tickets, setTickets] = useState([])
  const [stands, setStands] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [eRes, tRes, sRes] = await Promise.all([
          eventosApi.obtener(evento_id),
          ticketsApi.porEvento(evento_id, 0, 500),
          standsApi.porEvento(evento_id, 0, 100),
        ])
        setEvento(eRes.data)
        setTickets(tRes.data)
        setStands(sRes.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar reportes')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [evento_id])

  // Agrupar tickets por tipo para BarChart
  const ticketsPorTipo = [
    { tipo: 'General', cantidad: tickets.filter((t) => t.tipo === 'general').length },
    { tipo: 'VIP', cantidad: tickets.filter((t) => t.tipo === 'vip').length },
    { tipo: 'Early Bird', cantidad: tickets.filter((t) => t.tipo === 'early_bird').length },
  ]

  // Línea de tickets por día (para LineChart simple)
  const ticketsPorDia = tickets.reduce((acc, t) => {
    const dia = t.fecha_creacion ? new Date(t.fecha_creacion).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }) : 'Sin fecha'
    acc[dia] = (acc[dia] ?? 0) + 1
    return acc
  }, {})
  const lineData = Object.entries(ticketsPorDia).map(([dia, cantidad]) => ({ dia, cantidad }))

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <Link to="/admin" className="text-xs text-gray-500 hover:text-white">← Admin</Link>
        <h1 className="text-2xl font-bold text-white mt-1 mb-1">
          Reportes {evento ? `— ${evento.nombre}` : ''}
        </h1>

        {loading && <LoadingSpinner center />}
        {error && <ErrorMessage message={error} />}

        {!loading && !error && (
          <div className="flex flex-col gap-6 mt-4">
            {/* Tickets por tipo */}
            <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
              <h2 className="text-sm font-semibold text-white mb-4">Tickets por tipo</h2>
              {tickets.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay tickets registrados</p>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ticketsPorTipo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D4E" />
                    <XAxis dataKey="tipo" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2D2D4E', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Bar dataKey="cantidad" fill="#4169E1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Línea de tickets por día */}
            {lineData.length > 1 && (
              <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
                <h2 className="text-sm font-semibold text-white mb-4">Tickets vendidos por día</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={lineData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2D2D4E" />
                    <XAxis dataKey="dia" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1A1A2E', border: '1px solid #2D2D4E', borderRadius: 8 }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="cantidad" stroke="#9B59B6" strokeWidth={2} dot={{ fill: '#9B59B6' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Tabla de stands */}
            <div className="rounded-2xl border border-aura-border bg-aura-card p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Stands del evento</h2>
              {stands.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay stands configurados</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-aura-border text-left">
                      <th className="py-2 text-xs text-gray-400">Stand</th>
                      <th className="py-2 text-xs text-gray-400">Categoría</th>
                      <th className="py-2 text-xs text-gray-400">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stands.map((s) => (
                      <tr key={s.id} className="border-b border-aura-border/40">
                        <td className="py-2 text-white">{s.nombre}</td>
                        <td className="py-2 text-gray-400">{s.categoria ?? '—'}</td>
                        <td className="py-2">
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                            {s.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
