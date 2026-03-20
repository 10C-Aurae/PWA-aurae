import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'
import { Sparkles } from 'lucide-react'

const MAX_ATTEMPTS = 3
const COOLDOWN_SECS = 30

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [attempts, setAttempts] = useState(0)
  const [cooldown, setCooldown] = useState(0)
  const timerRef = useRef(null)

  // Countdown ticker
  useEffect(() => {
    if (cooldown <= 0) return
    timerRef.current = setInterval(() => {
      setCooldown((s) => {
        if (s <= 1) { clearInterval(timerRef.current); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timerRef.current)
  }, [cooldown])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (cooldown > 0) return

    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      setAttempts(0)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const next = attempts + 1
      setAttempts(next)
      setError(err.response?.data?.detail || 'Credenciales inválidas')
      if (next >= MAX_ATTEMPTS) {
        setCooldown(COOLDOWN_SECS)
      }
    } finally {
      setLoading(false)
    }
  }

  const isBlocked = cooldown > 0

  return (
    <div className="min-h-screen bg-aura-bg flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-aura-nav mb-4 shadow-nav">
            <Sparkles size={28} strokeWidth={1.5} style={{ color: '#E6670A' }} />
          </div>
          <h1 className="text-3xl font-extrabold text-aura-ink tracking-tight">Aurae</h1>
          <p className="mt-2 text-sm text-aura-muted">Inicia sesión para continuar</p>
        </div>

        {/* Card */}
        <div className="card p-6 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input"
                placeholder="tu@email.com"
                disabled={isBlocked}
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input"
                placeholder="••••••••"
                disabled={isBlocked}
              />
            </div>

            <ErrorMessage message={error} />

            {isBlocked && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Demasiados intentos fallidos. Espera <span className="font-bold tabular-nums">{cooldown}s</span> para continuar.
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isBlocked}
              className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <LoadingSpinner size="sm" /> : 'Iniciar sesión'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-aura-muted">
            ¿No tienes cuenta?{' '}
            <Link to="/registro" className="font-semibold text-aura-primary hover:text-aura-primary-dark transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
