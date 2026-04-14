import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Plus, Trash2, Clock, Copy, Check } from 'lucide-react'
import * as standsApi from '../../api/standsApi'
import * as eventosApi from '../../api/eventosApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'

// ─────────────────────────────────────────────────────────────
// QR Modal
// ─────────────────────────────────────────────────────────────
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-16 sm:pb-0">
      <div className="w-full max-w-xs rounded-2xl border border-aura-border bg-aura-card p-6 flex flex-col items-center gap-4 max-h-[calc(100dvh-6rem)] sm:max-h-[90vh] overflow-y-auto">
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

// ─────────────────────────────────────────────────────────────
// Gestión de servicios (dentro del modal de edición)
// ─────────────────────────────────────────────────────────────
function ServiciosSection({ standId, servicios, onChange }) {
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevaDuracion, setNuevaDuracion] = useState(10)
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(null)

  const handleAgregar = async () => {
    if (!nuevoNombre.trim()) return
    setGuardando(true)
    try {
      const res = await standsApi.agregarServicio(standId, {
        nombre: nuevoNombre.trim(),
        duracion_min: Number(nuevaDuracion),
      })
      onChange(res.data.servicios)
      setNuevoNombre('')
      setNuevaDuracion(10)
    } catch { /* ignore */ } finally { setGuardando(false) }
  }

  const handleToggle = async (svc) => {
    try {
      const res = await standsApi.actualizarServicio(standId, svc.id, { activo: !svc.activo })
      onChange(res.data.servicios)
    } catch { /* ignore */ }
  }

  const handleEliminar = async (svcId) => {
    setEliminando(svcId)
    try {
      const res = await standsApi.eliminarServicio(standId, svcId)
      onChange(res.data.servicios)
    } catch { /* ignore */ } finally { setEliminando(null) }
  }

  const inputCls = "rounded-lg border border-aura-border bg-aura-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aura-primary focus:outline-none"

  return (
    <div className="rounded-xl border border-aura-border/50 bg-aura-surface p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-gray-300">Servicios con turno</p>
      <p className="text-[10px] text-gray-500">Los asistentes elegirán a cuál hacer cola. Ej: Degustación, Pick-up, Mesa para 2.</p>

      {/* Lista existente */}
      {servicios.length > 0 && (
        <div className="flex flex-col gap-2">
          {servicios.map((svc) => (
            <div key={svc.id} className="flex items-center gap-2 rounded-lg border border-aura-border bg-aura-bg px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate ${svc.activo ? 'text-white' : 'text-gray-500 line-through'}`}>
                  {svc.nombre}
                </p>
                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock size={9} strokeWidth={2} />
                  ~{svc.duracion_min} min por turno
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggle(svc)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                  svc.activo
                    ? 'bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400'
                    : 'bg-gray-500/20 text-gray-500 hover:bg-green-500/20 hover:text-green-400'
                }`}
              >
                {svc.activo ? 'Activo' : 'Inactivo'}
              </button>
              <button
                type="button"
                onClick={() => handleEliminar(svc.id)}
                disabled={eliminando === svc.id}
                className="text-red-500 hover:text-red-400 transition-colors disabled:opacity-40"
              >
                <Trash2 size={13} strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Agregar nuevo */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <input
            type="text"
            value={nuevoNombre}
            onChange={(e) => setNuevoNombre(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAgregar())}
            placeholder="Nombre del servicio"
            className={inputCls + " w-full"}
          />
        </div>
        <div className="w-20">
          <input
            type="number"
            value={nuevaDuracion}
            onChange={(e) => setNuevaDuracion(e.target.value)}
            min={1} max={480}
            title="Duración en minutos"
            className={inputCls + " w-full"}
          />
        </div>
        <button
          type="button"
          onClick={handleAgregar}
          disabled={guardando || !nuevoNombre.trim()}
          className="flex items-center gap-1 rounded-lg bg-aura-primary px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 disabled:opacity-40 transition-all"
        >
          <Plus size={13} strokeWidth={2} />
          {guardando ? '…' : 'Add'}
        </button>
      </div>
      <p className="text-[9px] text-gray-600">El número es la duración estimada en minutos por turno</p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Modal de credenciales de staff
// ─────────────────────────────────────────────────────────────
function StaffModal({ stand, onClose }) {
  const [nombre, setNombre] = useState('')
  const [email, setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [creds, setCreds]     = useState(null) // { email, password, stand_id }
  const [copied, setCopied]   = useState(false)

  const handleGenerar = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await standsApi.generarStaff(stand.id, { nombre: nombre.trim(), email: email.trim() })
      setCreds(res.data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al generar credenciales')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    const text = `Email: ${creds.email}\nContraseña: ${creds.password}\nPanel: ${window.location.origin}/staff/login`
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const inputCls = "w-full rounded-lg border border-aura-border bg-aura-bg px-3 py-2 text-sm text-white placeholder-gray-600 focus:border-aura-primary focus:outline-none"

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-16 sm:pb-0">
      <div className="w-full max-w-sm rounded-2xl border border-aura-border bg-aura-card p-6 max-h-[calc(100dvh-6rem)] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="font-bold text-white">Credenciales de Staff</h2>
            <p className="text-xs text-gray-500">{stand.nombre}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        {!creds ? (
          <form onSubmit={handleGenerar} className="flex flex-col gap-3">
            <p className="text-xs text-gray-400">
              Crea un usuario temporal para el staff de este stand. Recibirán acceso automático al panel de cola.
            </p>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Nombre del staff</label>
              <input required type="text" value={nombre} onChange={e => setNombre(e.target.value)}
                placeholder="Ej: María García" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Correo electrónico</label>
              <input required type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="staff@ejemplo.com" className={inputCls} />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={onClose}
                className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="rounded-lg bg-aura-primary px-5 py-2 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-all">
                {loading ? 'Generando…' : 'Generar acceso'}
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="rounded-xl bg-green-500/10 border border-green-500/20 p-4 flex flex-col gap-2">
              <p className="text-xs font-semibold text-green-400 mb-1">¡Credenciales creadas!</p>
              <div className="flex flex-col gap-1 font-mono text-sm">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-400 text-xs">Email</span>
                  <span className="text-white truncate">{creds.email}</span>
                </div>
                <div className="flex justify-between items-center gap-2">
                  <span className="text-gray-400 text-xs">Contraseña</span>
                  <span className="text-yellow-300 font-bold tracking-widest">{creds.password}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-aura-surface border border-aura-border/50 px-3 py-2">
              <p className="text-[10px] text-gray-500 mb-1">URL del panel de staff:</p>
              <p className="text-xs text-aura-primary break-all">{window.location.origin}/staff/login</p>
            </div>

            <p className="text-[10px] text-gray-500">
              La cuenta expirará 24 horas después de que termine el evento. Comparte estas credenciales solo con el staff del stand.
            </p>

            <div className="flex gap-2">
              <button onClick={handleCopy}
                className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-aura-primary py-2.5 text-sm font-semibold text-white hover:bg-blue-600 transition-all">
                {copied ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar todo</>}
              </button>
              <button onClick={onClose}
                className="rounded-lg border border-aura-border px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  nombre: '', categoria: '', descripcion: '', responsable: '',
  beacon_uuid: '', beacon_major: '', beacon_minor: '',
  is_active: true, tiene_cola: false,
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

// ─────────────────────────────────────────────────────────────
// Modal de crear/editar stand
// ─────────────────────────────────────────────────────────────
function StandModal({ stand, eventoId, onClose, onSaved }) {
  const [form, setForm] = useState(stand ? {
    nombre:       stand.nombre       ?? '',
    categoria:    stand.categoria    ?? '',
    descripcion:  stand.descripcion  ?? '',
    responsable:  stand.responsable  ?? '',
    beacon_uuid:  stand.beacon_uuid  ?? '',
    beacon_major: stand.beacon_major ?? '',
    beacon_minor: stand.beacon_minor ?? '',
    is_active:    stand.is_active    ?? true,
    tiene_cola:   stand.tiene_cola   ?? false,
  } : EMPTY_FORM)

  const [servicios, setServicios] = useState(stand?.servicios ?? [])
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
        nombre:       form.nombre,
        categoria:    form.categoria   || null,
        descripcion:  form.descripcion || null,
        responsable:  form.responsable || null,
        beacon_uuid:  form.beacon_uuid  || null,
        beacon_major: form.beacon_major ? Number(form.beacon_major) : null,
        beacon_minor: form.beacon_minor ? Number(form.beacon_minor) : null,
        is_active:    form.is_active,
        tiene_cola:   form.tiene_cola,
        evento_id:    eventoId,
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
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 px-4 pb-16 sm:pb-0">
      <div className="w-full max-w-md rounded-2xl border border-aura-border bg-aura-card p-6 max-h-[calc(100dvh-6rem)] sm:max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-white text-lg">{stand ? 'Editar' : 'Nuevo'} Stand</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl leading-none">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          <Field label="Nombre del stand *" hint="Ej: Stand de Bienvenida, Zona Comida, Tecnología">
            <input required type="text" value={form.nombre} onChange={set('nombre')}
              placeholder="Nombre visible para los asistentes" className={inputCls} />
          </Field>

          <Field label="Categoría" hint="Agrupa stands del mismo tipo. Ej: Comida, Arte, Tecnología">
            <input type="text" value={form.categoria} onChange={set('categoria')}
              placeholder="Opcional" className={inputCls} />
          </Field>

          <Field label="Descripción" hint="Breve descripción de qué ofrece este stand">
            <input type="text" value={form.descripcion} onChange={set('descripcion')}
              placeholder="Opcional" className={inputCls} />
          </Field>

          <Field label="Persona responsable" hint="Nombre del staff a cargo de este stand">
            <input type="text" value={form.responsable} onChange={set('responsable')}
              placeholder="Opcional" className={inputCls} />
          </Field>

          {/* Toggles */}
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="accent-aura-primary w-4 h-4" />
              Stand activo (visible para asistentes)
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
              <input type="checkbox" checked={form.tiene_cola}
                onChange={(e) => setForm({ ...form, tiene_cola: e.target.checked })}
                className="accent-aura-primary w-4 h-4" />
              Ofrece cola virtual (turno digital)
            </label>
          </div>

          {/* Servicios — solo si tiene_cola está activo y es un stand existente */}
          {form.tiene_cola && stand && (
            <ServiciosSection
              standId={stand.id}
              servicios={servicios}
              onChange={setServicios}
            />
          )}
          {form.tiene_cola && !stand && (
            <p className="text-[10px] text-gray-500 bg-aura-surface rounded-lg px-3 py-2 border border-aura-border/50">
              Guarda el stand primero para agregar servicios de cola.
            </p>
          )}

          {/* BLE */}
          <button type="button"
            onClick={() => setShowBeacon(!showBeacon)}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors text-left"
          >
            <span>{showBeacon ? '▾' : '▸'}</span>
            Configuración de sensor BLE (opcional, para staff técnico)
          </button>

          {showBeacon && (
            <div className="rounded-xl border border-aura-border/50 bg-aura-surface p-4 flex flex-col gap-3">
              <p className="text-[11px] text-gray-500">Datos proporcionados por el equipo técnico que instala los beacons Bluetooth.</p>
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

// ─────────────────────────────────────────────────────────────
// Página principal
// ─────────────────────────────────────────────────────────────
export default function AdminStands() {
  const { evento_id } = useParams()
  const [stands, setStands] = useState([])
  const [evento, setEvento] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [modal, setModal]       = useState(null)
  const [qrModal, setQrModal]   = useState(null)
  const [staffModal, setStaffModal] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [sRes, eRes] = await Promise.all([
        standsApi.porEventoAdmin(evento_id),
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
                  <th className="px-4 py-3 text-xs text-gray-400">Cola</th>
                  <th className="px-4 py-3 text-xs text-gray-400">Estado</th>
                  <th className="px-4 py-3 text-xs text-gray-400">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {stands.map((s) => (
                  <tr key={s.id} className="border-b border-aura-border/50 hover:bg-white/5">
                    <td className="px-4 py-3 text-white">
                      {s.nombre}
                      {s.tiene_cola && s.servicios?.length > 0 && (
                        <span className="ml-2 text-[10px] text-purple-400">
                          {s.servicios.filter(sv => sv.activo).length} servicio{s.servicios.filter(sv => sv.activo).length !== 1 ? 's' : ''}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">{s.categoria ?? '—'}</td>
                    <td className="px-4 py-3 text-gray-500 font-mono text-xs hidden md:table-cell">
                      {s.beacon_uuid ? `${s.beacon_uuid.slice(0, 12)}…` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{s.responsable ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.tiene_cola ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/10 text-gray-600'}`}>
                        {s.tiene_cola ? 'Sí' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {s.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button onClick={() => setQrModal(s)} className="text-xs text-purple-400 hover:text-purple-300">QR</button>
                        <Link to={`/staff/beacon/${s.id}`} className="text-xs text-emerald-400 hover:text-emerald-300">Beacon</Link>
                        <button onClick={() => setStaffModal(s)} className="text-xs text-yellow-400 hover:text-yellow-300">Staff</button>
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

      {staffModal && (
        <StaffModal
          stand={staffModal}
          onClose={() => setStaffModal(null)}
        />
      )}
    </div>
  )
}
