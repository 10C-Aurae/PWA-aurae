import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import * as eventosApi from '../../api/eventosApi'
import LoadingSpinner from '../../components/LoadingSpinner'
import ErrorMessage from '../../components/ErrorMessage'
import ImageUpload from '../../components/ImageUpload'
import { ChevronLeft, Eye, EyeOff, RefreshCw, MapPin, Search, X, Loader2 } from 'lucide-react'
import ChatbotInfoBuilder from '../../components/ChatbotInfoBuilder'

const DESC_MAX = 500

const CATEGORIAS = [
  'tecnologia', 'musica', 'arte', 'gaming', 'negocios',
  'gastronomia', 'deportes', 'networking', 'innovacion', 'sustentabilidad',
]

const ARQUETIPOS_DEFAULT = ['Techie', 'Foodie', 'Networking Master', 'Explorer', 'Creativo']
const PROMPT_MAX = 1000

const EMPTY_FORM = {
  // Básico
  nombre:      '',
  descripcion: '',
  imagen_url:  '',
  // Lugar y tiempo
  ubicacion: { nombre: '', direccion: '', lat: 0, lng: 0 },
  fecha_inicio: '',
  fecha_fin:    '',
  // Detalles
  capacidad_max: '',
  categorias:    [],
  // Acceso
  es_publico:      true,
  tiene_password:  false,
  password_acceso: '',
  // Precio
  es_gratuito: true,
  precio:      '',
  // Características
  chat_habilitado: true,
  is_active:       true,
  // Aura Flow IA
  aura_flow_prompt:       '',
  arquetipos_disponibles: [],
  // Chatbot FAQ
  info_chatbot: '',
}

function SectionTitle({ children }) {
  return (
    <p className="text-[10px] font-bold text-aura-muted uppercase tracking-wider pt-2">
      {children}
    </p>
  )
}

function Field({ label, required, error, hint, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-aura-ink mb-1.5">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        {hint && <span className="ml-2 text-[11px] font-normal text-aura-muted">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

function Toggle({ checked, onChange, label, sub }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-aura-border bg-white px-4 py-3 shadow-card">
      <div>
        <p className="text-sm font-medium text-aura-ink">{label}</p>
        {sub && <p className="text-xs text-aura-muted mt-0.5">{sub}</p>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none ${
          checked ? 'bg-aura-primary' : 'bg-stone-300'
        }`}
      >
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`} />
      </button>
    </div>
  )
}

function generatePassword() {
  return Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')
}

export default function AdminEventoForm() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const isEdit   = Boolean(id)
  const { user } = useAuth()

  const [form, setForm]               = useState(EMPTY_FORM)
  const [loadingInit, setLoadingInit] = useState(isEdit)
  const [saving, setSaving]           = useState(false)
  const [error, setError]             = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [showPassword, setShowPassword] = useState(false)

  // ── Location autocomplete (Nominatim / OpenStreetMap) ──────────
  const [ubQuery,     setUbQuery]     = useState('')
  const [ubResults,   setUbResults]   = useState([])
  const [ubSearching, setUbSearching] = useState(false)
  const [ubOpen,      setUbOpen]      = useState(false)
  const ubRef = useRef(null)

  useEffect(() => {
    const trimmed = ubQuery.trim()
    if (trimmed.length < 3) { setUbResults([]); setUbOpen(false); return }
    const t = setTimeout(async () => {
      setUbSearching(true)
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=5&addressdetails=1`
        const res  = await fetch(url, { headers: { 'Accept-Language': 'es' } })
        const data = await res.json()
        setUbResults(data)
        setUbOpen(data.length > 0)
      } catch { /* network error — silently ignore */ }
      finally { setUbSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [ubQuery])

  useEffect(() => {
    const handler = (e) => {
      if (ubRef.current && !ubRef.current.contains(e.target)) setUbOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const selectPlace = (place) => {
    const nombre    = place.name || place.display_name.split(',')[0].trim()
    const direccion = place.display_name
    setForm((prev) => ({
      ...prev,
      ubicacion: { nombre, direccion, lat: parseFloat(place.lat), lng: parseFloat(place.lon) },
    }))
    setUbQuery(nombre)
    setUbResults([])
    setUbOpen(false)
  }

  const clearUbicacion = () => {
    setForm((prev) => ({ ...prev, ubicacion: { nombre: '', direccion: '', lat: 0, lng: 0 } }))
    setUbQuery('')
    setUbResults([])
    setUbOpen(false)
  }

  useEffect(() => {
    if (!isEdit) return
    eventosApi.obtener(id)
      .then((res) => {
        const ev = res.data
        setForm({
          nombre:      ev.nombre       ?? '',
          descripcion: ev.descripcion  ?? '',
          imagen_url:  ev.imagen_url   ?? '',
          ubicacion: {
            nombre:    ev.ubicacion?.nombre    ?? '',
            direccion: ev.ubicacion?.direccion ?? '',
            lat:       ev.ubicacion?.lat       ?? 0,
            lng:       ev.ubicacion?.lng       ?? 0,
          },
          fecha_inicio:  ev.fecha_inicio?.slice(0, 16) ?? '',
          fecha_fin:     ev.fecha_fin?.slice(0, 16)    ?? '',
          capacidad_max: ev.capacidad_max ?? '',
          categorias:    ev.categorias   ?? [],
          es_publico:    ev.es_publico    ?? true,
          tiene_password:  ev.tiene_password  ?? false,
          password_acceso: '',   // nunca se pre-carga por seguridad
          es_gratuito: ev.es_gratuito ?? true,
          precio:      ev.precio > 0 ? ev.precio : '',
          chat_habilitado: ev.chat_habilitado ?? true,
          is_active:       ev.is_active       ?? true,
          aura_flow_prompt:       ev.aura_flow_prompt       ?? '',
          arquetipos_disponibles: ev.arquetipos_disponibles ?? [],
          info_chatbot:           ev.info_chatbot           ?? '',
        })
        // Pre-populate location search field
        if (ev.ubicacion?.nombre) setUbQuery(ev.ubicacion.nombre)
      })
      .catch((err) => setError(err.response?.data?.detail || 'Error al cargar evento'))
      .finally(() => setLoadingInit(false))
  }, [id, isEdit])

  const set = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    if (fieldErrors[key]) setFieldErrors((prev) => ({ ...prev, [key]: null }))
  }

  const setUb = (key, value) =>
    setForm((prev) => ({ ...prev, ubicacion: { ...prev.ubicacion, [key]: value } }))

  const toggleCat = (cat) =>
    setForm((prev) => ({
      ...prev,
      categorias: prev.categorias.includes(cat)
        ? prev.categorias.filter((c) => c !== cat)
        : [...prev.categorias, cat],
    }))

  const handlePasswordChange = (text) => {
    const digits = text.replace(/\D/g, '').slice(0, 8)
    set('password_acceso', digits)
  }

  const validate = () => {
    const errs = {}
    if (!form.nombre.trim())      errs.nombre       = 'El nombre es requerido'
    if (!form.descripcion.trim()) errs.descripcion  = 'La descripción es requerida'
    if (!form.fecha_inicio)       errs.fecha_inicio = 'La fecha de inicio es requerida'
    if (!form.fecha_fin)          errs.fecha_fin    = 'La fecha de fin es requerida'
    if (form.fecha_fin && form.fecha_inicio && form.fecha_fin <= form.fecha_inicio)
      errs.fecha_fin = 'La fecha fin debe ser posterior a la fecha inicio'
    if (form.capacidad_max !== '' && (isNaN(form.capacidad_max) || Number(form.capacidad_max) < 0))
      errs.capacidad_max = 'Debe ser un número positivo'
    if (form.tiene_password && form.password_acceso.length !== 8 && !isEdit)
      errs.password_acceso = 'La contraseña debe tener exactamente 8 dígitos'
    if (!form.es_gratuito && (!form.precio || Number(form.precio) <= 0))
      errs.precio = 'Ingresa un precio mayor a 0'
    return errs
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFieldErrors(errs); return }

    setSaving(true)
    setError(null)
    try {
      const payload = {
        nombre:      form.nombre,
        descripcion: form.descripcion || null,
        imagen_url:  form.imagen_url  || null,
        ubicacion: (form.ubicacion.direccion || form.ubicacion.nombre)
          ? {
              nombre:    form.ubicacion.nombre,
              direccion: form.ubicacion.direccion,
              lat:       Number(form.ubicacion.lat) || 0,
              lng:       Number(form.ubicacion.lng) || 0,
            }
          : null,
        fecha_inicio:  form.fecha_inicio,
        fecha_fin:     form.fecha_fin,
        capacidad_max: form.capacidad_max !== '' ? Number(form.capacidad_max) : 0,
        categorias:    form.categorias,
        es_publico:    form.es_publico,
        tiene_password: form.tiene_password,
        ...(form.tiene_password && form.password_acceso
          ? { password_acceso: form.password_acceso }
          : {}),
        es_gratuito: form.es_gratuito,
        precio:      form.es_gratuito ? 0 : Number(form.precio),
        chat_habilitado: form.chat_habilitado,
        is_active:       form.is_active,
        aura_flow_prompt:       form.aura_flow_prompt,
        arquetipos_disponibles: form.arquetipos_disponibles,
        info_chatbot:           form.info_chatbot,
      }

      if (isEdit) {
        await eventosApi.actualizar(id, payload)
      } else {
        await eventosApi.crear(payload)
      }
      navigate('/admin/eventos')
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al guardar el evento')
    } finally {
      setSaving(false)
    }
  }

  const disableSubmit = saving
    || !form.nombre.trim()
    || !form.descripcion.trim()
    || !form.fecha_inicio
    || !form.fecha_fin
    || (!form.es_gratuito && !form.precio)

  const inputCls = (hasError) =>
    `w-full rounded-xl border bg-white px-4 py-3 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors shadow-card ${
      hasError ? 'border-red-400' : 'border-aura-border'
    }`

  if (loadingInit) return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  )

  return (
    <div className="min-h-screen bg-aura-bg px-4 py-8 pb-28 md:pb-10">
      <div className="mx-auto max-w-2xl">

        <Link
          to="/admin/eventos"
          className="inline-flex items-center gap-1 text-sm text-aura-muted hover:text-aura-ink mb-6 transition-colors"
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Volver a eventos
        </Link>

        <h1 className="text-2xl font-bold text-aura-ink mb-1">
          {isEdit ? 'Editar Evento' : 'Crear Evento'}
        </h1>
        <p className="text-sm text-aura-muted mb-8">
          {isEdit ? 'Modifica los datos del evento' : 'Completa la información para publicar el evento'}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* ── Información básica ─────────────────────── */}
          <SectionTitle>Información básica</SectionTitle>

          <Field label="Nombre del evento" required error={fieldErrors.nombre}>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              placeholder="Ej. Tech Fest 2025"
              className={inputCls(fieldErrors.nombre)}
            />
          </Field>

          <Field label="Descripción" required error={fieldErrors.descripcion}>
            <textarea
              value={form.descripcion}
              onChange={(e) => {
                const next = e.target.value.length > DESC_MAX
                  ? e.target.value.slice(0, DESC_MAX)
                  : e.target.value
                set('descripcion', next)
              }}
              placeholder="Describe el evento, sus actividades y lo que los asistentes pueden esperar…"
              rows={4}
              className={`w-full rounded-xl border bg-white px-4 py-3 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors resize-none shadow-card ${
                form.descripcion.length >= DESC_MAX || fieldErrors.descripcion
                  ? 'border-red-400' : 'border-aura-border'
              }`}
            />
            <p className={`text-xs text-right mt-1 ${form.descripcion.length >= DESC_MAX ? 'text-red-500' : 'text-aura-muted'}`}>
              {form.descripcion.length}/{DESC_MAX}
            </p>
          </Field>

          <Field label="Imagen de portada">
            <ImageUpload
              value={form.imagen_url}
              onChange={(url) => set('imagen_url', url)}
            />
          </Field>

          {/* ── Lugar y tiempo ─────────────────────────── */}
          <SectionTitle>Lugar y tiempo</SectionTitle>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha y hora de inicio" required error={fieldErrors.fecha_inicio}>
              <input
                type="datetime-local"
                value={form.fecha_inicio}
                onChange={(e) => set('fecha_inicio', e.target.value)}
                className={`${inputCls(fieldErrors.fecha_inicio)} [color-scheme:light]`}
              />
            </Field>
            <Field label="Fecha y hora de fin" required error={fieldErrors.fecha_fin}>
              <input
                type="datetime-local"
                value={form.fecha_fin}
                onChange={(e) => set('fecha_fin', e.target.value)}
                className={`${inputCls(fieldErrors.fecha_fin)} [color-scheme:light]`}
              />
            </Field>
          </div>

          <div className="rounded-xl border border-aura-border bg-white p-4 flex flex-col gap-3 shadow-card">
            <p className="text-xs font-semibold text-aura-muted uppercase tracking-wider">Ubicación</p>

            {/* Search input */}
            <div ref={ubRef} className="relative">
              <Search size={14} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-aura-faint pointer-events-none" />
              <input
                type="text"
                value={ubQuery}
                onChange={(e) => { setUbQuery(e.target.value); if (!e.target.value) clearUbicacion() }}
                placeholder="Buscar lugar… (ej. Centro Banamex, CDMX)"
                className="w-full rounded-lg border border-aura-border bg-aura-surface pl-9 pr-9 py-2 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors"
              />
              {ubSearching && (
                <Loader2 size={13} strokeWidth={2} className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-muted animate-spin" />
              )}
              {!ubSearching && ubQuery && (
                <button
                  type="button"
                  onClick={clearUbicacion}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-faint hover:text-aura-ink transition-colors"
                >
                  <X size={13} strokeWidth={2} />
                </button>
              )}

              {/* Results dropdown */}
              {ubOpen && ubResults.length > 0 && (
                <ul className="absolute z-50 mt-1 w-full rounded-xl border border-aura-border bg-white shadow-lg overflow-hidden">
                  {ubResults.map((place) => (
                    <li key={place.place_id}>
                      <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); selectPlace(place) }}
                        className="w-full flex items-start gap-2.5 px-3 py-2.5 text-left hover:bg-aura-surface transition-colors"
                      >
                        <MapPin size={13} strokeWidth={1.5} className="text-aura-primary flex-shrink-0 mt-0.5" />
                        <div className="min-w-0">
                          <p className="text-sm text-aura-ink truncate">
                            {place.name || place.display_name.split(',')[0]}
                          </p>
                          <p className="text-[11px] text-aura-muted truncate">{place.display_name}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Selected place summary */}
            {form.ubicacion.direccion && (
              <div className="rounded-lg border border-aura-border bg-aura-surface px-3 py-2.5 flex items-start gap-2">
                <MapPin size={13} strokeWidth={1.5} className="text-aura-primary flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  {form.ubicacion.nombre && (
                    <p className="text-sm text-aura-ink font-medium truncate">{form.ubicacion.nombre}</p>
                  )}
                  <p className="text-[11px] text-aura-muted truncate">{form.ubicacion.direccion}</p>
                  {(form.ubicacion.lat !== 0 || form.ubicacion.lng !== 0) && (
                    <p className="text-[10px] text-aura-faint mt-0.5 font-mono">
                      {Number(form.ubicacion.lat).toFixed(5)}, {Number(form.ubicacion.lng).toFixed(5)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* OSM attribution */}
            <p className="text-[10px] text-aura-faint">
              Resultados por{' '}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-aura-muted transition-colors"
              >
                OpenStreetMap
              </a>
              {' '}— © contribuidores de OpenStreetMap
            </p>
          </div>

          {/* ── Detalles ───────────────────────────────── */}
          <SectionTitle>Detalles</SectionTitle>

          <Field label="Capacidad máxima" hint="0 = sin límite" error={fieldErrors.capacidad_max}>
            <input
              type="number"
              value={form.capacidad_max}
              onChange={(e) => set('capacidad_max', e.target.value)}
              placeholder="500"
              min="0"
              className={inputCls(fieldErrors.capacidad_max)}
            />
          </Field>

          <div>
            <label className="block text-sm font-medium text-aura-ink mb-2">Categorías</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIAS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCat(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-medium capitalize transition-all duration-200 ${
                    form.categorias.includes(cat)
                      ? 'bg-aura-primary text-white'
                      : 'border border-aura-border text-aura-muted hover:border-aura-primary hover:text-aura-primary'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Acceso ─────────────────────────────────── */}
          <SectionTitle>Acceso</SectionTitle>

          <Toggle
            checked={form.es_publico}
            onChange={(v) => set('es_publico', v)}
            label="Evento público"
            sub="Cualquier usuario puede ver y comprar tickets"
          />

          <div className="flex flex-col gap-2">
            <Toggle
              checked={form.tiene_password}
              onChange={(v) => set('tiene_password', v)}
              label="Contraseña de acceso"
              sub="Los asistentes necesitan un código de 8 dígitos para inscribirse"
            />

            {form.tiene_password && (
              <div className="rounded-xl border border-aura-border bg-aura-surface px-4 py-3 flex flex-col gap-2">
                <label className="text-xs text-aura-muted">Código de acceso (8 dígitos)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      inputMode="numeric"
                      value={form.password_acceso}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      placeholder="········"
                      maxLength={8}
                      className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors font-mono tracking-widest ${
                        fieldErrors.password_acceso ? 'border-red-400' : 'border-aura-border'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-aura-faint hover:text-aura-ink transition-colors"
                    >
                      {showPassword
                        ? <EyeOff size={14} strokeWidth={1.5} />
                        : <Eye size={14} strokeWidth={1.5} />}
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => set('password_acceso', generatePassword())}
                    className="inline-flex items-center gap-1 rounded-lg border border-aura-border bg-white px-3 py-2 text-xs text-aura-muted hover:text-aura-primary hover:border-aura-primary transition-colors"
                  >
                    <RefreshCw size={12} strokeWidth={2} />
                    Generar
                  </button>
                </div>
                {form.password_acceso.length === 8 && (
                  <p className="text-[11px] text-green-600">Contraseña configurada</p>
                )}
                {fieldErrors.password_acceso && (
                  <p className="text-xs text-red-500">{fieldErrors.password_acceso}</p>
                )}
                {isEdit && (
                  <p className="text-[11px] text-aura-muted">Deja vacío para mantener la contraseña actual</p>
                )}
              </div>
            )}
          </div>

          {/* ── Precio ─────────────────────────────────── */}
          <SectionTitle>Precio</SectionTitle>

          <div className="flex flex-col gap-2">
            <Toggle
              checked={form.es_gratuito}
              onChange={(v) => set('es_gratuito', v)}
              label="Evento gratuito"
              sub="Sin costo de entrada para los asistentes"
            />

            {!form.es_gratuito && (
              <Field label="Precio del ticket (MXN)" error={fieldErrors.precio}>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-aura-muted text-sm">$</span>
                  <input
                    type="number"
                    value={form.precio}
                    onChange={(e) => set('precio', e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    className={`${inputCls(fieldErrors.precio)} pl-8`}
                  />
                </div>
                {form.precio > 0 && (
                  <div className="mt-2 rounded-lg border border-aura-border bg-aura-surface px-3 py-2 text-xs text-aura-muted space-y-0.5">
                    <p>Precio base: <span className="text-aura-ink font-medium">${Number(form.precio).toFixed(2)}</span></p>
                    <p>Cargo por servicio (10%): <span className="text-aura-ink font-medium">${(Number(form.precio) * 0.1).toFixed(2)}</span></p>
                    <p className="font-medium">Precio final para asistente: <span className="text-green-600">${(Number(form.precio) * 1.1).toFixed(2)}</span></p>
                  </div>
                )}
              </Field>
            )}
          </div>

          {/* ── Características ────────────────────────── */}
          <SectionTitle>Características</SectionTitle>

          <Toggle
            checked={form.chat_habilitado}
            onChange={(v) => set('chat_habilitado', v)}
            label="Chat del evento"
            sub="Canal de mensajes para asistentes (próximamente)"
          />

          <Toggle
            checked={form.is_active}
            onChange={(v) => set('is_active', v)}
            label="Publicar evento"
            sub="El evento será visible para todos los usuarios"
          />

          {/* ── Aura Flow IA ───────────────────────────── */}
          <SectionTitle>Aura Flow IA</SectionTitle>

          <Field
            label="Prompt maestro"
            hint="Instrucción personalizada para la IA (opcional)"
          >
            <textarea
              value={form.aura_flow_prompt}
              onChange={(e) => {
                const next = e.target.value.length > PROMPT_MAX
                  ? e.target.value.slice(0, PROMPT_MAX)
                  : e.target.value
                set('aura_flow_prompt', next)
              }}
              placeholder={'Ej. "Prioriza stands de tecnología y networking. Saluda al usuario de forma motivadora y menciona su arquetipo."'}
              rows={3}
              className={`w-full rounded-xl border border-aura-border bg-white px-4 py-3 text-sm text-aura-ink placeholder-aura-faint focus:outline-none focus:ring-2 focus:ring-aura-primary/20 focus:border-aura-primary transition-colors resize-none shadow-card ${
                form.aura_flow_prompt.length >= PROMPT_MAX ? 'border-red-400' : 'border-aura-border'
              }`}
            />
            <p className={`text-xs text-right mt-1 ${form.aura_flow_prompt.length >= PROMPT_MAX ? 'text-red-500' : 'text-aura-muted'}`}>
              {form.aura_flow_prompt.length}/{PROMPT_MAX}
            </p>
          </Field>

          <div>
            <label className="block text-sm font-medium text-aura-ink mb-1.5">
              Arquetipos de asistente
              <span className="ml-2 text-[11px] font-normal text-aura-muted">
                La IA clasificará a cada asistente en uno de estos perfiles
              </span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {ARQUETIPOS_DEFAULT.map((arq) => {
                const active = form.arquetipos_disponibles.includes(arq)
                return (
                  <button
                    key={arq}
                    type="button"
                    onClick={() =>
                      set('arquetipos_disponibles',
                        active
                          ? form.arquetipos_disponibles.filter((a) => a !== arq)
                          : [...form.arquetipos_disponibles, arq]
                      )
                    }
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'bg-aura-primary text-white'
                        : 'border border-aura-border text-aura-muted hover:border-aura-primary hover:text-aura-primary'
                    }`}
                  >
                    {arq}
                  </button>
                )
              })}
            </div>
            {form.arquetipos_disponibles.length > 0 && (
              <p className="text-[11px] text-aura-muted">
                Activos: {form.arquetipos_disponibles.join(', ')}
              </p>
            )}
          </div>

          {/* ── Chatbot FAQ ────────────────────────────── */}
          <SectionTitle>Chatbot del evento</SectionTitle>

          <div>
            <label className="block text-sm font-medium text-aura-ink mb-1.5">
              Información para el chatbot
              <span className="ml-2 text-[11px] font-normal text-aura-muted">
                Los asistentes podrán preguntar sobre estos temas
              </span>
            </label>
            <ChatbotInfoBuilder
              value={form.info_chatbot}
              onChange={(v) => set('info_chatbot', v)}
            />
          </div>

          {error && <ErrorMessage message={error} />}

          {/* ── Actions ────────────────────────────────── */}
          <div className="flex gap-3 pt-2">
            <Link
              to="/admin/eventos"
              className="flex-1 rounded-xl border border-aura-border bg-white px-4 py-3 text-sm font-medium text-aura-muted hover:text-aura-ink hover:border-aura-border-dark text-center transition-colors shadow-card"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={disableSubmit}
              className="flex-1 rounded-xl bg-aura-primary px-4 py-3 text-sm font-semibold text-white hover:bg-aura-primary-dark shadow-glow-sm hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}
