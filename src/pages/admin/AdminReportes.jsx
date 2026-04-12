import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import * as metricasApi from '../../api/metricasApi'
import * as eventosApi  from '../../api/eventosApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { Ticket, Users, Zap, Star, Trophy, TrendingUp } from 'lucide-react'

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#1C1838', border: '1px solid #2A2650', borderRadius: 8 },
  labelStyle: { color: '#EEE9FF' },
  itemStyle: { color: '#8D88AF' },
}

function StatCard({ Icon, label, value, sub, color = 'text-aura-primary' }) {
  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-center gap-2 text-aura-muted text-xs font-medium">
        <Icon size={13} strokeWidth={1.5} className={color} />
        {label}
      </div>
      <p className={`text-2xl font-extrabold tabular-nums ${color}`}>{value ?? '—'}</p>
      {sub && <p className="text-[10px] text-aura-faint">{sub}</p>}
    </div>
  )
}

function Stars({ value }) {
  if (!value) return <span className="text-aura-faint">—</span>
  return (
    <span className="inline-flex items-center gap-0.5 text-amber-400 font-semibold text-xs">
      <Star size={11} fill="currentColor" strokeWidth={0} />
      {Number(value).toFixed(1)}
    </span>
  )
}

export default function AdminReportes() {
  const { evento_id } = useParams()
  const [evento,   setEvento]   = useState(null)
  const [metricas, setMetricas] = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [error,    setError]    = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); setError(null)
      try {
        const [eRes, mRes] = await Promise.all([
          eventosApi.obtener(evento_id),
          metricasApi.evento(evento_id),
        ])
        setEvento(eRes.data)
        setMetricas(mRes.data)
      } catch (err) {
        setError(err.response?.data?.detail || 'Error al cargar métricas')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [evento_id])

  const standsData = metricas?.stands ?? []
  const chartData  = standsData
    .slice()
    .sort((a, b) => b.total_visitas - a.total_visitas)
    .slice(0, 10)
    .map((s) => ({ nombre: s.nombre.length > 14 ? `${s.nombre.slice(0, 14)}…` : s.nombre, visitas: s.total_visitas, válidas: s.visitas_validas }))

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div>
          <Link to="/admin" className="text-xs text-aura-muted hover:text-aura-ink transition-colors">← Admin</Link>
          <h1 className="text-2xl font-bold text-aura-ink mt-1">
            Reportes {evento ? `— ${evento.nombre}` : ''}
          </h1>
        </div>

        {loading && <LoadingSpinner center />}
        {error   && <ErrorMessage message={error} />}

        {!loading && !error && metricas && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatCard Icon={Ticket}   label="Tickets"          value={metricas.total_tickets}         color="text-aura-primary" />
              <StatCard Icon={Users}    label="Usuarios activos" value={metricas.usuarios_activos}      color="text-blue-400" />
              <StatCard Icon={Zap}      label="Interac. válidas" value={metricas.interacciones_validas}
                sub={`de ${metricas.total_interacciones} totales`} color="text-aura-secondary" />
              <StatCard Icon={Star}     label="Calificación"
                value={metricas.calificacion_global ? Number(metricas.calificacion_global).toFixed(1) : '—'}
                color="text-amber-400" />
            </div>

            {/* Highlights */}
            {(metricas.stand_mas_visitado || metricas.stand_mejor_calificado) && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {metricas.stand_mas_visitado && (
                  <div className="card p-4 flex items-center gap-3 animate-fade-in">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-aura-primary/10 flex-shrink-0">
                      <TrendingUp size={18} strokeWidth={1.5} className="text-aura-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-aura-faint uppercase tracking-wider">Más visitado</p>
                      <p className="font-bold text-aura-ink text-sm">{metricas.stand_mas_visitado}</p>
                    </div>
                  </div>
                )}
                {metricas.stand_mejor_calificado && (
                  <div className="card p-4 flex items-center gap-3 animate-fade-in">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 flex-shrink-0">
                      <Trophy size={18} strokeWidth={1.5} className="text-amber-400" />
                    </div>
                    <div>
                      <p className="text-[10px] text-aura-faint uppercase tracking-wider">Mejor calificado</p>
                      <p className="font-bold text-aura-ink text-sm">{metricas.stand_mejor_calificado}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Visitas por stand chart */}
            {chartData.length > 0 && (
              <div className="card p-5 animate-fade-in">
                <h2 className="text-sm font-semibold text-aura-ink mb-4">Visitas por stand</h2>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={chartData} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2650" />
                    <XAxis dataKey="nombre" stroke="#4A4470" tick={{ fontSize: 10, fill: '#8D88AF' }} />
                    <YAxis stroke="#4A4470" tick={{ fontSize: 11, fill: '#8D88AF' }} />
                    <Tooltip {...TOOLTIP_STYLE} />
                    <Bar dataKey="visitas" name="Totales" radius={[4, 4, 0, 0]}>
                      {chartData.map((_, i) => (
                        <Cell key={i} fill={i === 0 ? '#FF5C5C' : '#9B5DE5'} />
                      ))}
                    </Bar>
                    <Bar dataKey="válidas" name="Válidas" fill="#22c55e44" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Stands detail table */}
            {standsData.length > 0 && (
              <div className="card p-5 animate-fade-in">
                <h2 className="text-sm font-semibold text-aura-ink mb-3">Detalle por stand</h2>
                <div className="overflow-x-auto -mx-1">
                  <table className="w-full text-sm min-w-[520px]">
                    <thead>
                      <tr className="border-b border-aura-border text-left">
                        {['Stand', 'Visitas', 'Válidas', 'Duración prom.', 'Calificación', 'Conversión'].map((h) => (
                          <th key={h} className="py-2 pr-4 text-[10px] font-semibold text-aura-faint uppercase tracking-wider whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {standsData.map((s, i) => (
                        <tr key={i} className="border-b border-aura-border/40 hover:bg-aura-surface/50 transition-colors">
                          <td className="py-2.5 pr-4 font-medium text-aura-ink">{s.nombre}</td>
                          <td className="py-2.5 pr-4 tabular-nums text-aura-muted">{s.total_visitas}</td>
                          <td className="py-2.5 pr-4 tabular-nums text-emerald-400">{s.visitas_validas}</td>
                          <td className="py-2.5 pr-4 tabular-nums text-aura-muted">
                            {s.duracion_promedio_seg ? `${Math.round(s.duracion_promedio_seg)}s` : '—'}
                          </td>
                          <td className="py-2.5 pr-4"><Stars value={s.calificacion_promedio} /></td>
                          <td className="py-2.5 pr-4 tabular-nums text-aura-muted">
                            {s.tasa_conversion != null ? `${Number(s.tasa_conversion).toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {standsData.length === 0 && (
              <div className="card p-8 text-center animate-fade-in">
                <p className="text-aura-muted text-sm">No hay datos de stands para este evento todavía.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
