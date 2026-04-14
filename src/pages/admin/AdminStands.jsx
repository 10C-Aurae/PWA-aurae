import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import * as standsApi from '../../api/standsApi'
import * as eventosApi from '../../api/eventosApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

const EMPTY_FORM = {
  nombre: '', categoria: '', beacon_uuid: '',
  beacon_major: '', beacon_minor: '', responsable: '', activo: true,
}

function StandModal({ stand, eventoId, onClose, onSaved }) {
  const [form, setForm] = useState(stand ? {
    nombre: stand.nombre ?? '',
    categoria: stand.categoria ?? '',
    beacon_uuid: stand.beacon_uuid ?? '',
    beacon_major: stand.beacon_major ?? '',
    beacon_minor: stand.beacon_minor ?? '',
    responsable: stand.responsable ?? '',
    activo: stand.activo ?? true,
  } : EMPTY_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        ...form,
        evento_id: eventoId,
        beacon_major: form.beacon_major ? Number(form.beacon_major) : null,
        beacon_minor: form.beacon_minor ? Number(form.beacon_minor) : null,
      }
      if (stand) {
        await standsApi.actualizar(stand.id, payload)
      } else {
        await standsApi.crear(payload)
      }
      onSaved()
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar stand')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-aura-border bg-aura-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-white">{stand ? 'Editar' : 'Crear'} Stand</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {[
            ['nombre', 'Nombre', 'text', true],
            ['categoria', 'Categoría', 'text', false],
            ['beacon_uuid', 'Beacon UUID', 'text', false],
            ['beacon_major', 'Beacon Major', 'number', false],
            ['beacon_minor', 'Beacon Minor', 'number', false],
            ['responsable', 'Responsable', 'text', false],
          ].map(([key, label, type, required]) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1">{label}</label>
              <input
                type={type}
                required={required}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full rounded-lg border border-aura-border bg-aura-bg px-3 py-2 text-sm text-white focus:border-aura-primary focus:outline-none"
              />
            </div>
          ))}
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={form.activo} onChange={(e) => setForm({ ...form, activo: e.target.checked })} className="accent-aura-primary" />
            Activo
          </label>
          {error && <ErrorMessage message={error} />}
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={loading} className="rounded-lg bg-aura-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50 transition-all">
              {loading ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function AdminStands() {
  const { evento_id } = useParams()
  const [stands, setStands] = useState([])
  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, eRes] = await Promise.all([
        standsApi.porEvento(evento_id),
        eventosApi.obtener(evento_id),
      ])
      setStands(sRes.data)
      setEvento(eRes.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [evento_id])

  const handleEliminar = async (id) => {
    if (!confirm('¿Eliminar este stand?')) return
    try {
      await standsApi.eliminar(id)
      fetchData()
    } catch (err) {
      alert(err.response?.data?.detail || 'Error al eliminar')
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between mb-2">
          <div>
            <Link to="/admin/eventos" className="text-xs text-gray-500 hover:text-white">← Eventos</Link>
            <h1 className="text-2xl font-bold text-white mt-1">
              Stands {evento ? `— ${evento.nombre}` : ''}
            </h1>
          </div>
          <button onClick={() => setModal('create')} className="rounded-lg bg-aura-primary px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-all">
            + Crear Stand
          </button>
        </div>

        {loading && <LoadingSpinner center />}
        {error && <ErrorMessage message={error} onRetry={fetchData} />}

        {!loading && stands.length === 0 && (
          <p className="text-gray-400 text-center py-12">No hay stands para este evento</p>
        )}

        {!loading && stands.length > 0 && (
          <div className="rounded-2xl border border-aura-border bg-aura-card overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-aura-border text-left">
                  <th className="px-4 py-3 text-xs text-gray-400">Nombre</th>
                  <th className="px-4 py-3 text-xs text-gray-400 hidden sm:table-cell">Categoría</th>
                  <th className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">Beacon UUID</th>
                  <th className="px-4 py-3 text-xs text-gray-400 hidden md:table-cell">Responsable</th>
                  <th className="px-4 py-3 text-xs text-gray-400">Estado</th>
                  <th className="px-4 py-3 text-xs text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stands.map((s) => (
                  <tr key={s.id} className="border-b border-aura-border/50 hover:bg-white/5">
                    <td className="px-4 py-3 text-white">{s.nombre}</td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{s.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                      {s.beacon_uuid ? `${s.beacon_uuid.slice(0, 12)}…` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{s.responsable ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.activo ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {s.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => setModal(s)} className="text-xs text-aura-primary hover:text-blue-400">Editar</button>
                        <button onClick={() => handleEliminar(s.id)} className="text-xs text-red-400 hover:text-red-300">Eliminar</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && (
        <StandModal
          stand={modal === 'create' ? null : modal}
          eventoId={evento_id}
          onClose={() => setModal(null)}
          onSaved={() => { setModal(null); fetchData() }}
        />
      )}
    </div>
  )
}
