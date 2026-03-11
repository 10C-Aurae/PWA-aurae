import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from '../components/LoadingSpinner'
import ErrorMessage from '../components/ErrorMessage'

export default function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales inválidas')
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
            <span className="text-2xl font-black text-white" style={{ background: 'linear-gradient(135deg,#E6670A,#F88903)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              A
            </span>
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
              />
            </div>

            <ErrorMessage message={error} />

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
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
