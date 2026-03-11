import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../api/authApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Monitor, Music, Palette, Gamepad2, Briefcase, ChefHat, Trophy, Handshake, Rocket, Leaf } from 'lucide-react'

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

export default function Registro() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [intereses, setIntereses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const toggleInteres = (id) =>
    setIntereses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await authApi.registro({ ...form, intereses })
      navigate('/login', { state: { mensaje: 'Cuenta creada. Inicia sesión.' } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aura-nav mb-4 shadow-nav">
            <span className="text-2xl font-black" style={{ background: 'linear-gradient(135deg,#E6670A,#F88903)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              A
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-aura-ink tracking-tight">Aurae</h1>
          <p className="mt-2 text-sm text-aura-muted">Crea tu cuenta gratuita</p>
        </div>

        <div className="card p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Nombre</label>
              <input type="text" required value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="input" placeholder="Tu nombre" />
            </div>
            <div>
              <label className="label">Email</label>
              <input type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input" placeholder="tu@email.com" />
            </div>
            <div>
              <label className="label">Contraseña</label>
              <input type="password" required minLength={8} value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input" placeholder="Mín. 8 caracteres" />
            </div>

            {/* Interests */}
            <div>
              <label className="label">
                Intereses{' '}
                <span className="text-aura-faint font-normal">(opcional)</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {INTERESES.map(({ id, Icon, label }) => {
                  const active = intereses.includes(id)
                  return (
                    <button
                      key={id} type="button" onClick={() => toggleInteres(id)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 active:scale-95 ${
                        active
                          ? 'bg-aura-primary text-white shadow-glow-sm'
                          : 'border border-aura-border bg-white text-aura-muted hover:border-aura-primary hover:text-aura-primary'
                      }`}
                    >
                      <Icon size={12} strokeWidth={2} />{label}
                    </button>
                  )
                })}
              </div>
            </div>

            <ErrorMessage message={error} />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <LoadingSpinner size="sm" /> : 'Crear cuenta'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-aura-muted">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold text-aura-primary hover:text-aura-primary-dark transition-colors">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
