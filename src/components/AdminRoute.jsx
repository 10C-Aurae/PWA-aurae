import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

/**
 * Protege rutas de administrador.
 *
 * RBAC: cuando el backend exponga `es_admin: bool` en el modelo de Usuario,
 * descomentar la línea marcada abajo — el resto ya está listo.
 */
export default function AdminRoute({ children }) {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-aura-bg flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/login" replace />
  }

  // TODO: descomentar cuando el backend agregue es_admin al modelo Usuario
  // if (!user?.es_admin) return <Navigate to="/dashboard" replace />

  return children
}
