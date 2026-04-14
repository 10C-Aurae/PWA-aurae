import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as authApi from '../api/authApi'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import {
  Monitor, Music, Palette, Gamepad2, Briefcase, ChefHat,
  Trophy, Handshake, Rocket, Leaf, Sparkles, ArrowRight,
  ArrowLeft, CheckCircle, Camera, Shirt, Film, Globe,
  Heart, FlaskConical, BookOpen, Zap, Mic2, GraduationCap,
  Coins, Drama,
} from 'lucide-react'

const INTERESES = [
  { id: 'tecnologia',      Icon: Monitor,        label: 'Tecnología' },
  { id: 'musica',          Icon: Music,          label: 'Música' },
  { id: 'arte',            Icon: Palette,        label: 'Arte' },
  { id: 'gaming',          Icon: Gamepad2,       label: 'Gaming' },
  { id: 'negocios',        Icon: Briefcase,      label: 'Negocios' },
  { id: 'gastronomia',     Icon: ChefHat,        label: 'Gastronomía' },
  { id: 'deportes',        Icon: Trophy,         label: 'Deportes' },
  { id: 'networking',      Icon: Handshake,      label: 'Networking' },
  { id: 'innovacion',      Icon: Rocket,         label: 'Innovación' },
  { id: 'sustentabilidad', Icon: Leaf,           label: 'Sustentabilidad' },
  { id: 'fotografia',      Icon: Camera,         label: 'Fotografía' },
  { id: 'moda',            Icon: Shirt,          label: 'Moda' },
  { id: 'cine',            Icon: Film,           label: 'Cine' },
  { id: 'viajes',          Icon: Globe,          label: 'Viajes' },
  { id: 'bienestar',       Icon: Heart,          label: 'Bienestar' },
  { id: 'ciencia',         Icon: FlaskConical,   label: 'Ciencia' },
  { id: 'literatura',      Icon: BookOpen,       label: 'Literatura' },
  { id: 'danza',           Icon: Zap,            label: 'Danza' },
  { id: 'podcasts',        Icon: Mic2,           label: 'Podcasts' },
  { id: 'educacion',       Icon: GraduationCap,  label: 'Educación' },
  { id: 'finanzas',        Icon: Coins,          label: 'Finanzas' },
  { id: 'teatro',          Icon: Drama,          label: 'Teatro' },
]

// Mirror del mapping del backend
const ARQUETIPOS = [
  { nombre: 'Techie',         afinidades: new Set(['tecnologia', 'innovacion', 'gaming', 'ciencia']),                              emoji: '⚡', desc: 'Explorador de lo digital y lo nuevo' },
  { nombre: 'Creativo',       afinidades: new Set(['arte', 'musica', 'fotografia', 'cine', 'teatro', 'danza']),                    emoji: '🎨', desc: 'Tu mirada transforma el espacio' },
  { nombre: 'Networker',      afinidades: new Set(['networking', 'negocios', 'innovacion', 'podcasts', 'educacion']),              emoji: '🤝', desc: 'Conectas personas e ideas' },
  { nombre: 'Gourmet',        afinidades: new Set(['gastronomia', 'sustentabilidad', 'viajes', 'bienestar']),                      emoji: '🍽️', desc: 'Vives para experiencias con sabor' },
  { nombre: 'Atleta',         afinidades: new Set(['deportes', 'bienestar', 'danza', 'sustentabilidad']),                          emoji: '🏃', desc: 'Energía en movimiento' },
  { nombre: 'Estratega',      afinidades: new Set(['negocios', 'gaming', 'networking', 'finanzas']),                               emoji: '♟️', desc: 'Siempre tres pasos adelante' },
  { nombre: 'Eco-consciente', afinidades: new Set(['sustentabilidad', 'gastronomia', 'deportes', 'bienestar', 'ciencia']),         emoji: '🌿', desc: 'El mundo importa, y lo cuidas' },
  { nombre: 'Artista',        afinidades: new Set(['arte', 'musica', 'teatro', 'danza', 'fotografia', 'cine', 'literatura']),      emoji: '🎭', desc: 'Sientes, creas, inspiras' },
  { nombre: 'Viajero',        afinidades: new Set(['viajes', 'gastronomia', 'fotografia', 'literatura', 'sustentabilidad']),       emoji: '✈️', desc: 'El mundo es tu escenario' },
  { nombre: 'Pensador',       afinidades: new Set(['literatura', 'ciencia', 'educacion', 'podcasts', 'cine']),                     emoji: '📚', desc: 'Buscas profundidad en cada experiencia' },
  { nombre: 'Trendsetter',    afinidades: new Set(['moda', 'arte', 'fotografia', 'musica', 'gaming']),                             emoji: '✨', desc: 'Marcas tendencia sin proponértelo' },
  { nombre: 'Explorador',     afinidades: new Set(),                                                                               emoji: '🧭', desc: 'Curioso de todo, límite de nada' },
]

function inferirArquetipo(intereses) {
  if (!intereses.length) return ARQUETIPOS.find(a => a.nombre === 'Explorador')
  const set = new Set(intereses)
  const candidatos = ARQUETIPOS.filter(a => a.afinidades.size > 0)
  const mejor = candidatos.reduce((acc, a) => {
    const score = [...a.afinidades].filter(x => set.has(x)).length
    return score > acc.score ? { arquetipo: a, score } : acc
  }, { arquetipo: null, score: 0 })
  return mejor.score > 0 ? mejor.arquetipo : ARQUETIPOS.find(a => a.nombre === 'Explorador')
}

// ── Step indicator ──────────────────────────────────────────────────────────
function Steps({ current }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {[1, 2].map((n) => (
        <div key={n} className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full transition-all duration-300 ${
            n <= current ? 'bg-aura-primary scale-125' : 'bg-aura-border'
          }`} />
          {n < 2 && <div className={`h-px w-8 transition-colors duration-300 ${current >= 2 ? 'bg-aura-primary' : 'bg-aura-border'}`} />}
        </div>
      ))}
    </div>
  )
}

export default function Registro() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nombre: '', email: '', password: '' })
  const [intereses, setIntereses] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [done, setDone] = useState(false)

  const arquetipo = inferirArquetipo(intereses)

  const toggleInteres = (id) =>
    setIntereses((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )

  const validateStep1 = () => {
    const nombre = form.nombre.trim()
    if (nombre.length < 2) return 'El nombre debe tener al menos 2 caracteres'
    if (nombre.length > 100) return 'El nombre no puede superar 100 caracteres'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Email inválido'
    if (form.password.length < 8) return 'La contraseña debe tener al menos 8 caracteres'
    if (!/[a-zA-Z]/.test(form.password)) return 'La contraseña debe contener al menos una letra'
    if (!/[0-9]/.test(form.password)) return 'La contraseña debe contener al menos un número'
    return null
  }

  const goToStep2 = () => {
    const err = validateStep1()
    if (err) { setError(err); return }
    setError(null)
    setStep(2)
  }

  const handleSubmit = async () => {
    if (intereses.length < 3) {
      setError('Selecciona al menos 3 intereses para personalizar tu experiencia')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await authApi.registro({ ...form, nombre: form.nombre.trim(), intereses })
      setDone(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al crear cuenta')
    } finally {
      setLoading(false)
    }
  }

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm animate-fade-in text-center space-y-5">
          <div className="text-6xl">{arquetipo.emoji}</div>
          <div>
            <h2 className="text-2xl font-extrabold text-aura-ink">¡Tu aura es {arquetipo.nombre}!</h2>
            <p className="text-sm text-aura-muted mt-1">{arquetipo.desc}</p>
          </div>
          <div className="card p-4 text-left space-y-2">
            <p className="text-xs font-bold text-aura-muted uppercase tracking-wider">Tus intereses</p>
            <div className="flex flex-wrap gap-1.5">
              {intereses.map((id) => {
                const item = INTERESES.find(i => i.id === id)
                return (
                  <span key={id} className="inline-flex items-center gap-1 rounded-full bg-aura-primary/10 px-2.5 py-1 text-xs font-medium text-aura-primary">
                    {item && <item.Icon size={10} strokeWidth={2} />}
                    {item?.label ?? id}
                  </span>
                )
              })}
            </div>
          </div>
          <p className="text-xs text-aura-muted">
            Aurae usará este perfil para recomendarte la mejor ruta en cada evento
          </p>
          <button
            onClick={() => navigate('/login', { state: { mensaje: 'Cuenta creada. Inicia sesión.' } })}
            className="btn-primary w-full py-3"
          >
            Iniciar sesión
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aura-nav mb-3 shadow-nav">
            <Sparkles size={28} strokeWidth={1.5} style={{ color: '#E6670A' }} />
          </div>
          <h1 className="text-3xl font-extrabold text-aura-ink tracking-tight">Aurae</h1>
          <p className="mt-1 text-sm text-aura-muted">
            {step === 1 ? 'Crea tu cuenta gratuita' : 'Elige tus intereses'}
          </p>
        </div>

        <Steps current={step} />

        <div className="card p-6 space-y-5">

          {/* ── Step 1: datos básicos ── */}
          {step === 1 && (
            <>
              <div className="space-y-4">
                <div>
                  <label className="label">Nombre</label>
                  <input type="text" required value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                    className="input" placeholder="Tu nombre"
                    onKeyDown={(e) => e.key === 'Enter' && goToStep2()} />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input type="email" required value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="input" placeholder="tu@email.com"
                    onKeyDown={(e) => e.key === 'Enter' && goToStep2()} />
                </div>
                <div>
                  <label className="label">Contraseña</label>
                  <input type="password" required minLength={8} value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="input" placeholder="Mín. 8 caracteres, letras y números"
                    onKeyDown={(e) => e.key === 'Enter' && goToStep2()} />
                </div>
              </div>

              <ErrorMessage message={error} />

              <button onClick={goToStep2} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
                Siguiente <ArrowRight size={16} strokeWidth={2} />
              </button>
            </>
          )}

          {/* ── Step 2: intereses ── */}
          {step === 2 && (
            <>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-semibold text-aura-ink">
                    ¿Qué te apasiona?
                  </p>
                  <p className="text-xs text-aura-muted mt-0.5">
                    Selecciona al menos 3. Esto define tu perfil Aura.
                  </p>
                </div>

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

                {/* Personality preview */}
                {intereses.length >= 1 && (
                  <div className="rounded-xl border border-aura-border bg-aura-surface p-3 flex items-center gap-3 animate-fade-in">
                    <span className="text-2xl">{arquetipo.emoji}</span>
                    <div>
                      <p className="text-xs font-bold text-aura-ink">
                        Tu perfil: <span className="text-aura-primary">{arquetipo.nombre}</span>
                      </p>
                      <p className="text-[11px] text-aura-muted">{arquetipo.desc}</p>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-aura-faint text-center">
                  {intereses.length < 3
                    ? `Selecciona ${3 - intereses.length} más`
                    : `${intereses.length} seleccionados ✓`}
                </p>
              </div>

              <ErrorMessage message={error} />

              <div className="flex gap-2">
                <button
                  onClick={() => { setStep(1); setError(null) }}
                  className="rounded-xl border border-aura-border px-4 py-2.5 text-sm text-aura-muted hover:text-aura-ink transition-colors flex items-center gap-1"
                >
                  <ArrowLeft size={14} /> Atrás
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || intereses.length < 3}
                  className="btn-primary flex-1 py-2.5 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? <LoadingSpinner size="sm" /> : (
                    <><CheckCircle size={15} strokeWidth={2} /> Crear mi perfil</>
                  )}
                </button>
              </div>
            </>
          )}

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
