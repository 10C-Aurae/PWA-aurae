import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import client from '../api/client'
import { inferirArquetipo } from '../utils/auraColors'
import AuraBadge from '../components/AuraBadge'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Monitor, Music, Palette, Gamepad2, Briefcase, ChefHat, Trophy, Handshake, Rocket, Leaf, FlaskConical } from 'lucide-react'

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
  const { user, setUser } = useAuth()
  const [form, setForm] = useState({ nombre: '', avatar_url: '', intereses: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (user) setForm({ nombre: user.nombre ?? '', avatar_url: user.avatar_url ?? '', intereses: user.vector_intereses ?? [] })
  }, [user])

  const toggleInteres = (id) =>
    setForm((prev) => ({
      ...prev,
      intereses: prev.intereses.includes(id)
        ? prev.intereses.filter((x) => x !== id)
        : [...prev.intereses, id],
    }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(false)
    try {
      const res = await client.patch('/usuarios/me', {
        nombre:           form.nombre,
        avatar_url:       form.avatar_url,
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
      <div className="mx-auto max-w-lg space-y-5">

        <h1 className="page-title">Mi Perfil</h1>

        {/* Profile hero — dark card */}
        <div className="card-dark rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
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
              <div className="flex items-center gap-2.5 rounded-full border border-white/15 bg-white/8 px-4 py-2">
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
              <label className="label">URL de avatar</label>
              <input type="url" value={form.avatar_url}
                onChange={(e) => setForm({ ...form, avatar_url: e.target.value })}
                className="input" placeholder="https://…" />
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
      </div>
    </div>
  )
}
