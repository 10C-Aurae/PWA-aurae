import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

export default function PrivateRoute({ children }) {
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

  // Staff no tiene acceso a páginas de usuario normal
  if (user?.role === 'staff_stand') {
    return <Navigate to="/staff/login" replace />
  }

  return children
}
