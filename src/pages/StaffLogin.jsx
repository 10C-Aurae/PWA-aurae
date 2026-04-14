import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import * as standsApi from '../api/standsApi'

export default function StaffLogin() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const user = await login(email.trim(), password)
      if (user.role !== 'staff_stand') {
        setError('Esta sesión es exclusiva para staff de stands.')
        setLoading(false)
        return
      }
      // Find the stand assigned to this staff member
      try {
        const res = await standsApi.miStandStaff()
        navigate(`/staff/stand/${res.data.id}/queue`, { replace: true })
      } catch {
        setError('No tienes un stand asignado. Contacta al organizador.')
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Credenciales incorrectas.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-aura-primary focus:outline-none transition-colors'

  return (
    <div className="min-h-screen bg-aura-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3 mb-10">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-aura-user shadow-glow">
            <Sparkles size={22} color="white" strokeWidth={2} />
          </span>
          <div className="text-center">
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Aurae Staff</h1>
            <p className="text-sm text-gray-500 mt-0.5">Panel de cola virtual</p>
          </div>
        </div>

        {/* Form */}
        <div className="rounded-2xl border border-aura-border bg-aura-card p-6 flex flex-col gap-4">
          <p className="text-xs text-gray-400 text-center mb-1">
            Ingresa con las credenciales que te proporcionó el organizador del evento.
          </p>

          {error && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Correo electrónico</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@ejemplo.com"
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Contraseña</label>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Tu contraseña temporal"
                className={inputCls}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-xl bg-aura-primary py-3 text-sm font-semibold text-white hover:bg-blue-600 disabled:opacity-50 transition-all"
            >
              {loading ? 'Ingresando…' : 'Ingresar al panel'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          ¿Eres asistente?{' '}
          <a href="/login" className="text-aura-primary hover:underline">
            Ir al login principal
          </a>
        </p>
      </div>
    </div>
  )
}
