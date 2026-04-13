import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as eventosApi from '../../api/eventosApi'
import { formatShortDate } from '../../utils/formatDate'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import { Plus, Pencil, Trash2 } from 'lucide-react'

export default function AdminEventos() {
  const navigate = useNavigate()
  const [eventos, setEventos]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [deleting, setDeleting] = useState(null)

  const fetchEventos = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await eventosApi.listar(0, 100)
      setEventos(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar eventos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEventos() }, [])

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return
    setDeleting(id)
    try {
      await eventosApi.eliminar(id)
      setEventos((prev) => prev.filter((ev) => ev.id !== id))
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar')
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-5xl">

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Mis Eventos</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {eventos.length} evento{eventos.length !== 1 ? 's' : ''} registrado{eventos.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/eventos/nuevo')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-aura-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-all"
          >
            <Plus size={15} strokeWidth={2} />
            Crear Evento
          </button>
        </div>

        {loading && <LoadingSpinner center />}
        {error   && <ErrorMessage message={error} onRetry={fetchEventos} />}

        {!loading && eventos.length === 0 && (
          <div className="flex flex-col items-center py-16 text-center">
            <p className="text-gray-400 text-sm">No hay eventos creados aún</p>
            <button
              onClick={() => navigate('/admin/eventos/nuevo')}
              className="mt-4 text-sm text-aura-primary hover:text-blue-400 transition-colors"
            >
              Crear el primer evento →
            </button>
          </div>
        )}

        {!loading && eventos.length > 0 && (
          <div className="rounded-2xl border border-aura-border bg-aura-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border text-left">
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">Nombre</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium hidden sm:table-cell">Fecha inicio</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium hidden md:table-cell">Categorías</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">Estado</th>
                  <th className="px-4 py-3 text-xs text-gray-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {eventos.map((ev) => (
                  <tr
                    key={ev.id}
                    className="border-b border-aura-border/50 hover:bg-white/5 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/eventos/${ev.id}`}
                        className="font-medium text-white hover:text-aura-primary transition-colors"
                      >
                        {ev.nombre}
                      </Link>
                      {ev.ubicacion && (
                        <p className="text-[11px] text-gray-500 mt-0.5 truncate max-w-[180px]">{ev.ubicacion?.nombre || ev.ubicacion?.direccion}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">
                      {formatShortDate(ev.fecha_inicio)}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <div className="flex flex-wrap gap-1">
                        {(ev.categorias ?? []).slice(0, 2).map((cat) => (
                          <span
                            key={cat}
                            className="rounded-full bg-aura-primary/20 text-aura-primary px-2 py-0.5 text-[9px] capitalize"
                          >
                            {cat}
                          </span>
                        ))}
                        {(ev.categorias ?? []).length > 2 && (
                          <span className="text-[9px] text-gray-500">
                            +{ev.categorias.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        ev.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {ev.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => navigate(`/admin/eventos/${ev.id}/editar`)}
                          className="inline-flex items-center gap-1 text-xs text-aura-primary hover:text-blue-400 transition-colors"
                        >
                          <Pencil size={11} strokeWidth={2} />
                          Editar
                        </button>
                        <button
                          onClick={() => handleEliminar(ev.id)}
                          disabled={deleting === ev.id}
                          className="inline-flex items-center gap-1 text-xs text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          <Trash2 size={11} strokeWidth={2} />
                          {deleting === ev.id ? '…' : 'Eliminar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
