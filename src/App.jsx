import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { useFCM } from './hooks/useFCM'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import PrivateRoute from './components/PrivateRoute'
import AdminRoute from './components/AdminRoute'

// Public pages
import Login       from './pages/Login'
import Registro    from './pages/Registro'
import Eventos     from './pages/Eventos'
import EventoDetalle from './pages/EventoDetalle'

// Private pages
import Dashboard  from './pages/Dashboard'
import MisTickets from './pages/MisTickets'
import Comprar    from './pages/Comprar'
import Perfil     from './pages/Perfil'
import AuraView   from './pages/AuraView'
import AuraFlow   from './pages/AuraFlow'
import Concierge  from './pages/Concierge'
import Capsula    from './pages/Capsula'
import ScanQR      from './pages/ScanQR'
import StaffBeacon from './pages/StaffBeacon'
import Chat        from './pages/Chat'
import StaffQueue  from './pages/StaffQueue'
import StaffLogin  from './pages/StaffLogin'
import StaffRoute  from './components/StaffRoute'
import StandChat   from './pages/StandChat'

// Admin
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminEventos     from './pages/admin/AdminEventos'
import AdminEventoForm  from './pages/admin/AdminEventoForm'
import AdminStands    from './pages/admin/AdminStands'
import AdminTickets   from './pages/admin/AdminTickets'
import AdminReportes  from './pages/admin/AdminReportes'
import AdminColas     from './pages/admin/AdminColas'

// Register FCM token once user is logged in
function FCMInit() {
  const { user } = useAuth()
  useFCM(user)
  return null
}

// Inyecta el color Aura del usuario como CSS variable global
function AuraTheme() {
  const { user } = useAuth()
  useEffect(() => {
    const color = user?.aura_color_actual || '#FF5C5C'
    document.documentElement.style.setProperty('--user-aura', color)
    // versión con transparencia para glows y fondos
    document.documentElement.style.setProperty('--user-aura-20', color + '33')
    document.documentElement.style.setProperty('--user-aura-10', color + '1A')
  }, [user?.aura_color_actual])
  return null
}

// Re-initialize Preline interactive components on route change
function PrelineInit() {
  const location = useLocation()
  useEffect(() => {
    if (typeof window !== 'undefined' && window.HSStaticMethods) {
      window.HSStaticMethods.autoInit()
    }
  }, [location.pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FCMInit />
        <AuraTheme />
        <PrelineInit />
        <Navbar />
        <Routes>
          {/* Staff — separate login + queue panel (no Navbar/BottomNav) */}
          <Route path="/staff/login" element={<StaffLogin />} />
          <Route path="/staff/stand/:stand_id/queue" element={<StaffRoute><StaffQueue /></StaffRoute>} />

          {/* Public */}
          <Route path="/login"       element={<Login />} />
          <Route path="/registro"    element={<Registro />} />
          <Route path="/eventos"     element={<Eventos />} />
          <Route path="/eventos/:id" element={<EventoDetalle />} />

          {/* Private */}
          <Route path="/dashboard"          element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/mis-tickets"        element={<PrivateRoute><MisTickets /></PrivateRoute>} />
          <Route path="/comprar/:evento_id" element={<PrivateRoute><Comprar /></PrivateRoute>} />
          <Route path="/perfil"             element={<PrivateRoute><Perfil /></PrivateRoute>} />
          <Route path="/aura/:usuario_id"   element={<PrivateRoute><AuraView /></PrivateRoute>} />
          <Route path="/eventos/:id/aura-flow" element={<PrivateRoute><AuraFlow /></PrivateRoute>} />
          <Route path="/eventos/:id/concierge" element={<PrivateRoute><Concierge /></PrivateRoute>} />
          <Route path="/capsula/:evento_id" element={<PrivateRoute><Capsula /></PrivateRoute>} />
          <Route path="/scan/:evento_id"          element={<PrivateRoute><ScanQR /></PrivateRoute>} />
          <Route path="/staff/beacon/:stand_id"  element={<PrivateRoute><StaffBeacon /></PrivateRoute>} />
          <Route path="/stands/:stand_id/chat"   element={<PrivateRoute><StandChat /></PrivateRoute>} />
          <Route path="/eventos/:evento_id/chat" element={<PrivateRoute><Chat /></PrivateRoute>} />

          {/* Admin — RBAC via AdminRoute (activar es_admin check en AdminRoute.jsx) */}
          <Route path="/admin"                        element={<AdminRoute><AdminDashboard /></AdminRoute>} />
          <Route path="/admin/eventos"                element={<AdminRoute><AdminEventos /></AdminRoute>} />
          <Route path="/admin/eventos/nuevo"          element={<AdminRoute><AdminEventoForm /></AdminRoute>} />
          <Route path="/admin/eventos/:id/editar"     element={<AdminRoute><AdminEventoForm /></AdminRoute>} />
          <Route path="/admin/stands/:evento_id"      element={<AdminRoute><AdminStands /></AdminRoute>} />
          <Route path="/admin/tickets/:evento_id"     element={<AdminRoute><AdminTickets /></AdminRoute>} />
          <Route path="/admin/reportes/:evento_id"    element={<AdminRoute><AdminReportes /></AdminRoute>} />
          <Route path="/admin/colas/:evento_id"       element={<AdminRoute><AdminColas /></AdminRoute>} />

          {/* Default */}
          <Route path="/"  element={<Navigate to="/eventos" replace />} />
          <Route path="*"  element={<Navigate to="/eventos" replace />} />
        </Routes>
        <BottomNav />
      </AuthProvider>
    </BrowserRouter>
  )
}
