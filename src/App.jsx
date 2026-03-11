import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import BottomNav from './components/BottomNav'
import PrivateRoute from './components/PrivateRoute'

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
import ScanQR     from './pages/ScanQR'

// Admin
import AdminDashboard   from './pages/admin/AdminDashboard'
import AdminEventos     from './pages/admin/AdminEventos'
import AdminEventoForm  from './pages/admin/AdminEventoForm'
import AdminStands    from './pages/admin/AdminStands'
import AdminTickets   from './pages/admin/AdminTickets'
import AdminReportes  from './pages/admin/AdminReportes'
import AdminColas     from './pages/admin/AdminColas'

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
        <PrelineInit />
        <Navbar />
        <Routes>
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
          <Route path="/scan/:evento_id"    element={<PrivateRoute><ScanQR /></PrivateRoute>} />

          {/* Admin — TODO: RBAC */}
          <Route path="/admin"                        element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
          <Route path="/admin/eventos"                element={<PrivateRoute><AdminEventos /></PrivateRoute>} />
          <Route path="/admin/eventos/nuevo"          element={<PrivateRoute><AdminEventoForm /></PrivateRoute>} />
          <Route path="/admin/eventos/:id/editar"     element={<PrivateRoute><AdminEventoForm /></PrivateRoute>} />
          <Route path="/admin/stands/:evento_id"      element={<PrivateRoute><AdminStands /></PrivateRoute>} />
          <Route path="/admin/tickets/:evento_id"     element={<PrivateRoute><AdminTickets /></PrivateRoute>} />
          <Route path="/admin/reportes/:evento_id"    element={<PrivateRoute><AdminReportes /></PrivateRoute>} />
          <Route path="/admin/colas/:evento_id"       element={<PrivateRoute><AdminColas /></PrivateRoute>} />

          {/* Default */}
          <Route path="/"  element={<Navigate to="/eventos" replace />} />
          <Route path="*"  element={<Navigate to="/eventos" replace />} />
        </Routes>
        <BottomNav />
      </AuthProvider>
    </BrowserRouter>
  )
}
