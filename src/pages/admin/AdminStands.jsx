import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import * as standsApi from '../../api/standsApi'
import * as eventosApi from '../../api/eventosApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

function StandQRModal({ stand, eventoId, onClose }) {
  const scanUrl = `${window.location.origin}/scan/${eventoId}`
  const handlePrint = () => {
    const w = window.open('', '_blank')
    w.document.write(`
      <html><head><title>QR Stand - ${stand.nombre}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}h2{margin-bottom:8px}p{color:#666;font-size:14px;margin:4px 0}svg{margin:20px auto;display:block}</style>
      </head><body>
        <h2>${stand.nombre}</h2>
        ${stand.categoria ? `<p>Categoría: ${stand.categoria}</p>` : ''}
        <p style="font-size:12px;color:#999">Escanea con la app Aurae para registrar tu visita</p>
        ${document.getElementById(`qr-print-${stand.id}`)?.outerHTML ?? ''}
        <p style="font-size:11px;color:#bbb;margin-top:16px">ID: ${stand.id}</p>
      </body></html>
    `)
    w.document.close()
    w.print()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-xs rounded-2xl border border-aura-border bg-aura-card p-6 flex flex-col items-center gap-4">
        <div className="flex justify-between items-center w-full">
          <h2 className="font-bold text-white">QR del Stand</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl">✕</button>
        </div>

        <p className="text-sm font-semibold text-white">{stand.nombre}</p>
        {stand.categoria && <p className="text-xs text-gray-400 -mt-2">{stand.categoria}</p>}

        <div className="rounded-xl bg-white p-4">
          <QRCodeSVG id={`qr-print-${stand.id}`} value={stand.id} size={200} />
        </div>

        <p className="text-[11px] text-gray-500 text-center">
          Los asistentes abren la app → escanean este QR → se registra su visita
        </p>
        <p className="text-[10px] text-gray-600 text-center">
          Scanner: <span className="text-gray-500">{scanUrl}</span>
        </p>

        <div className="flex gap-2 w-full">
          <button onClick={handlePrint}
            className="flex-1 rounded-lg bg-aura-primary py-2 text-sm font-semibold text-white hover:bg-blue-600 transition-all">
            Imprimir / Guardar
          </button>
          <button onClick={onClose}
            className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  nombre: '', categoria: '', descripcion: '', responsable: '',
  beacon_uuid: '', beacon_major: '', beacon_minor: '', activo: true,
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-300 mb-0.5">{label}</label>
      {hint && <p className="text-[10px] text-gray-500 mb-1">{hint}</p>}
      {children}
    </div>
  )
}

function StandModal({ stand, eventoId, onClose, onSaved }) {
  const [form, setForm] = useState(stand ? {
    nombre:       stand.nombre       ?? '',
    categoria:    stand.categoria    ?? '',
    descripcion:  stand.descripcion  ?? '',
    responsable:  stand.responsable  ?? '',
    beacon_uuid:  stand.beacon_uuid  ?? '',
    beacon_major: stand.beacon_major ?? '',
    beacon_minor: stand.beacon_minor ?? '',
    activo:       stand.activo       ?? true,
  } : EMPTY_FORM)
  const [showBeacon, setShowBeacon] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const payload = {
        nombre:      form.nombre,
        categoria:   form.categoria  || null,
        descripcion: form.descripcion || null,
        responsable: form.responsable || null,
        beacon_uuid:  form.beacon_uuid  || null,
        beacon_major: form.beacon_major ? Number(form.beacon_major) : null,
        beacon_minor: form.beacon_minor ? Number(form.beacon_minor) : null,
        activo:      form.activo,
        evento_id:   eventoId,
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

  const inputCls = "w-full rounded-lg border border-aura-border bg-aura-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aura-primary focus:outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
      <div className="w-full max-w-md rounded-2xl border border-aura-border bg-aura-card p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-white text-lg">{stand ? 'Editar' : 'Nuevo'} Stand</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Información básica ── */}
          <Field label="Nombre del stand *" hint="Ej: Stand de Bienvenida, Zona Comida, Tecnología">
            <input required type="text" value={form.nombre} onChange={set('nombre')}
              placeholder="Nombre visible para los asistentes"
              className={inputCls} />
          </Field>

          <Field label="Categoría" hint="Agrupa stands del mismo tipo. Ej: Comida, Arte, Tecnología">
            <input type="text" value={form.categoria} onChange={set('categoria')}
              placeholder="Opcional"
              className={inputCls} />
          </Field>

          <Field label="Descripción" hint="Breve descripción de qué ofrece este stand">
            <input type="text" value={form.descripcion} onChange={set('descripcion')}
              placeholder="Opcional"
              className={inputCls} />
          </Field>

          <Field label="Persona responsable" hint="Nombre del staff a cargo de este stand">
            <input type="text" value={form.responsable} onChange={set('responsable')}
              placeholder="Opcional"
              className={inputCls} />
          </Field>

          <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
            <input type="checkbox" checked={form.activo}
              onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              className="accent-aura-primary w-4 h-4" />
            Stand activo (visible para asistentes)
          </label>

          {/* ── Configuración técnica BLE ── */}
          <button type="button"
            onClick={() => setShowBeacon(!showBeacon)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors text-left"
          >
            <span>{showBeacon ? '▾' : '▸'}</span>
            Configuración de sensor BLE (opcional, para staff técnico)
          </button>

          {showBeacon && (
            <div className="rounded-xl border border-aura-border/50 bg-aura-surface p-4 flex flex-col gap-3">
              <p className="text-[11px] text-gray-500">Estos datos los proporciona el equipo técnico que instala los beacons Bluetooth en cada stand.</p>
              <Field label="UUID del beacon">
                <input type="text" value={form.beacon_uuid} onChange={set('beacon_uuid')}
                  placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  className={inputCls + " font-mono text-xs"} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Major">
                  <input type="number" value={form.beacon_major} onChange={set('beacon_major')}
                    placeholder="0–65535" className={inputCls} />
                </Field>
                <Field label="Minor">
                  <input type="number" value={form.beacon_minor} onChange={set('beacon_minor')}
                    placeholder="0–65535" className={inputCls} />
                </Field>
              </div>
            </div>
          )}

          {error && <ErrorMessage message={error} />}

          <div className="flex gap-2 justify-end pt-1">
            <button type="button" onClick={onClose}
              className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="rounded-lg bg-aura-primary px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-all">
              {loading ? 'Guardando…' : stand ? 'Guardar cambios' : 'Crear stand'}
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
  const [modal, setModal]   = useState(null)
  const [qrModal, setQrModal] = useState(null)

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
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setQrModal(s)} className="text-xs text-purple-400 hover:text-purple-300">QR</button>
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

      {qrModal && (
        <StandQRModal
          stand={qrModal}
          eventoId={evento_id}
          onClose={() => setQrModal(null)}
        />
      )}
    </div>
  )
}
