import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import LoadingSpinner from './LoadingSpinner'

/**
 * Guard for staff_stand-only pages.
 * Redirects unauthenticated users to /staff/login.
 * Redirects authenticated non-staff users to /eventos.
 */
export default function StaffRoute({ children }) {
  const { user, token, loading } = useAuth()

  if (loading) return <LoadingSpinner center />

  if (!token) return <Navigate to="/staff/login" replace />

  if (user?.role !== 'staff_stand') return <Navigate to="/eventos" replace />

  return children
}
