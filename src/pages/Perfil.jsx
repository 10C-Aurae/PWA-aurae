import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'
import * as usuariosApi from '../api/usuariosApi'
import * as ordenesApi  from '../api/ordenesApi'
import { inferirArquetipo } from '../utils/auraColors'
import AuraBadge from '../components/AuraBadge'
import ImageUpload from '../components/ImageUpload'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Monitor, Music, Palette, Gamepad2, Briefcase, ChefHat, Trophy, Handshake, Rocket, Leaf, FlaskConical, RefreshCw, ShoppingBag, Bluetooth, Trash2 } from 'lucide-react'

const ARCHETYPE_ICONS = { FlaskConical, ChefHat, Handshake, Palette, Gamepad2, Leaf }

const INTERESES = [
  { id: 'tecnologia',      Icon: Monitor,   label: 'Tecnología' },
  { id: 'musica',          Icon: Music,     label: 'Música' },
  { id: 'arte',            Icon: Palette,   label: 'Arte' },
  { id: 'gaming',          Icon: Gamepad2,  label: 'Gaming' },
  { id: 'negocios',        Icon: Briefcase, label: 'Negocios' },
  { id: 'gastronomia',     Icon: ChefHat,   label: 'Gastronomía' },
  { id: 'deportes',        Icon: Trophy,    label: 'Deportes' },
  { id: 'networking',      Icon: Handshake, label: 'Networking' },
  { id: 'innovacion',      Icon: Rocket,    label: 'Innovación' },
  { id: 'sustentabilidad', Icon: Leaf,      label: 'Sustentabilidad' },
]

export default function Perfil() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()

  // Edit form
  const [form, setForm] = useState({ nombre: '', avatar_url: '', intereses: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  // BLE token
  const [bleToken, setBleToken]       = useState(null)
  const [bleLoading, setBleLoading]   = useState(false)
  const [bleError, setBleError]       = useState(null)

  // Órdenes
  const [ordenes, setOrdenes]         = useState([])
  const [ordenesLoading, setOrdenesLoading] = useState(false)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError,   setDeleteError]   = useState(null)

  useEffect(() => {
    if (user) setForm({ nombre: user.nombre ?? '', avatar_url: user.avatar_url ?? '', intereses: user.vector_intereses ?? [] })
  }, [user])

  // Cargar BLE token y órdenes al montar
  useEffect(() => {
    if (!user?.id) return
    setBleLoading(true)
    usuariosApi.bleToken()
      .then((r) => setBleToken(r.data))
      .catch(() => setBleError('No se pudo cargar el token BLE'))
      .finally(() => setBleLoading(false))

    setOrdenesLoading(true)
    ordenesApi.porUsuario(user.id)
      .then((r) => setOrdenes(r.data ?? []))
      .catch(() => {})
      .finally(() => setOrdenesLoading(false))
  }, [user?.id])

  const handleRotarBle = async () => {
    setBleLoading(true); setBleError(null)
    try {
      const r = await usuariosApi.rotarBle()
      setBleToken(r.data)
    } catch {
      setBleError('No se pudo rotar el token')
    } finally {
      setBleLoading(false)
    }
  }

  const handleEliminarCuenta = async () => {
    if (!deleteConfirm) { setDeleteConfirm(true); return }
    setDeleteLoading(true); setDeleteError(null)
    try {
      await usuariosApi.eliminar(user.id)
      logout()
    } catch (err) {
      setDeleteError(err.response?.data?.detail || 'Error al eliminar la cuenta')
      setDeleteConfirm(false)
    } finally {
      setDeleteLoading(false)
    }
  }

  const toggleInteres = (id) =>
    setForm((prev) => ({
      ...prev,
      intereses: prev.intereses.includes(id)
        ? prev.intereses.filter((x) => x !== id)
        : [...prev.intereses, id],
    }))

  const validateForm = () => {
    const nombre = form.nombre.trim()
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres'
    if (nombre.length > 100) return 'El nombre no puede superar 100 caracteres'
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationError = validateForm()
    if (validationError) { setError(validationError); return }
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await client.patch('/usuarios/me', {
        nombre:           form.nombre.trim(),
        avatar_url:       form.avatar_url || null,
        vector_intereses: form.intereses,
      })
      setUser(res.data)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al actualizar perfil')
    } finally { setLoading(false) }
  }

  const puntos    = user?.aura_puntos ?? 0
  const arquetipo = inferirArquetipo(form.intereses)

  return (
    <div className="page">
      <div className="mx-auto max-w-lg md:max-w-4xl">

        <h1 className="page-title mb-5">Mi Perfil</h1>

        <div className="md:grid md:grid-cols-[340px_1fr] md:gap-6 md:items-start space-y-5 md:space-y-0">

        {/* Profile hero — dark card */}
        <div className="card-dark rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden md:sticky md:top-20">
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full opacity-15 blur-2xl"
               style={{ background: 'radial-gradient(circle,#E6670A,transparent)' }} />
          <AuraBadge puntos={puntos} size="lg" darkMode />
          <div className="text-center">
            <p className="font-bold text-white">{user?.nombre}</p>
            <p className="text-sm text-stone-400 mt-0.5">{user?.email}</p>
            <p className="text-xs text-stone-500 mt-1 tabular-nums">{puntos.toLocaleString()} pts de Aura</p>
          </div>
          {arquetipo && (() => {
            const ArquetipoIcon = ARCHETYPE_ICONS[arquetipo.iconName]
            return (
              <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/10 px-4 py-2">
                {ArquetipoIcon && <ArquetipoIcon size={16} strokeWidth={1.5} className="text-aura-secondary flex-shrink-0" />}
                <div className="leading-tight">
                  <p className="text-xs font-semibold text-white">{arquetipo.nombre}</p>
                  <p className="text-[10px] text-stone-400">Tu arquetipo</p>
                </div>
              </div>
            )
          })()}
        </div>

        {/* Edit form */}
        <div className="card p-5">
          <h2 className="text-sm font-bold text-aura-ink mb-4">Editar información</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre</label>
              <input type="text" value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="label">Foto de perfil</label>
              <ImageUpload
                value={form.avatar_url}
                onChange={(url) => setForm({ ...form, avatar_url: url })}
              />
            </div>
            <div>
              <label className="label">Intereses</label>
              <div className="flex flex-wrap gap-2">
                {INTERESES.map(({ id, Icon, label }) => {
                  const active = form.intereses.includes(id)
                  return (
                    <button key={id} type="button" onClick={() => toggleInteres(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-aura-primary text-white shadow-glow-sm'
                          : 'border border-aura-border bg-white text-aura-muted hover:border-aura-primary hover:text-aura-primary'
                      }`}>
                      <Icon size={12} strokeWidth={2} />{label}
                    </button>
                  )
                })}
              </div>
            </div>

            {error   && <ErrorMessage message={error} />}
            {success && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 animate-fade-in">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Perfil actualizado correctamente
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <LoadingSpinner size="sm" /> : 'Guardar cambios'}
            </button>
          </form>
        </div>

        {/* BLE Token */}
        <div className="card p-5 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <Bluetooth size={15} strokeWidth={1.5} className="text-aura-secondary" />
            <h2 className="text-sm font-bold text-aura-ink">Token BLE anónimo</h2>
          </div>
          <p className="text-xs text-aura-muted">
            Tu dispositivo emite este token por Bluetooth. Rótalo si sospechas que fue capturado.
          </p>
          {bleLoading && <LoadingSpinner size="sm" />}
          {bleError   && <p className="text-xs text-red-400">{bleError}</p>}
          {bleToken && !bleLoading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-xl bg-aura-surface px-4 py-3">
                <code className="font-mono text-xs text-aura-secondary truncate">{bleToken.token}</code>
                <span className="text-[10px] text-aura-faint whitespace-nowrap flex-shrink-0">
                  Expira {new Date(bleToken.expires_at).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <button
                onClick={handleRotarBle}
                disabled={bleLoading}
                className="btn-ghost text-xs py-2 px-4 inline-flex items-center gap-1.5"
              >
                <RefreshCw size={13} strokeWidth={2} /> Rotar token
              </button>
            </div>
          )}
        </div>

        {/* Mis Órdenes */}
        <div className="card p-5 space-y-3 animate-fade-in">
          <div className="flex items-center gap-2">
            <ShoppingBag size={15} strokeWidth={1.5} className="text-aura-primary" />
            <h2 className="text-sm font-bold text-aura-ink">Mis Órdenes</h2>
          </div>
          {ordenesLoading && <LoadingSpinner size="sm" />}
          {!ordenesLoading && ordenes.length === 0 && (
            <p className="text-xs text-aura-muted">No tienes órdenes registradas.</p>
          )}
          {!ordenesLoading && ordenes.length > 0 && (
            <div className="space-y-2">
              {ordenes.slice(0, 5).map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 rounded-xl bg-aura-surface px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-aura-ink tabular-nums">
                      ${Number(o.monto_total).toFixed(2)} {o.moneda?.toUpperCase()}
                    </p>
                    <p className="text-[10px] text-aura-faint mt-0.5">
                      {new Date(o.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span className={`badge text-[10px] ${
                    o.status === 'pagada'      ? 'badge-green'  :
                    o.status === 'fallida'     ? 'badge-red'    :
                    o.status === 'reembolsada' ? 'badge-yellow' :
                    'badge-gray'
                  }`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zona de peligro */}
        <div className="card p-5 space-y-3 border-red-500/20 animate-fade-in">
          <div className="flex items-center gap-2">
            <Trash2 size={15} strokeWidth={1.5} className="text-red-400" />
            <h2 className="text-sm font-bold text-red-400">Zona de peligro</h2>
          </div>
          {deleteError && <p className="text-xs text-red-400">{deleteError}</p>}
          {!deleteConfirm ? (
            <button
              onClick={handleEliminarCuenta}
              className="btn-danger text-xs py-2 px-4"
            >
              Eliminar mi cuenta
            </button>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-red-400 font-medium">
                Esta acción es irreversible. ¿Confirmas que deseas eliminar tu cuenta?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleEliminarCuenta}
                  disabled={deleteLoading}
                  className="btn-danger text-xs py-2 px-4"
                >
                  {deleteLoading ? <LoadingSpinner size="sm" /> : 'Sí, eliminar'}
                </button>
                <button
                  onClick={() => setDeleteConfirm(false)}
                  className="btn-ghost text-xs py-2 px-4"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>

        </div>
      </div>
    </div>
  )
}
