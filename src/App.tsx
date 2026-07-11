import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventarios from './pages/Inventarios'
import Catalogos from './pages/Catalogos'
import Configuracion from './pages/Configuracion'
import Administracion from './pages/Administracion'
import Login from './pages/Login'
import Register from './pages/Register'

// ─── Spinner pantalla completa ────────────────────────────────────────────────
const FullPageSpinner = () => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100vh', flexDirection: 'column', gap: '1rem',
    background: 'var(--color-neutral-50)'
  }}>
    <div className="spinner" style={{ width: 40, height: 40, borderWidth: 4 }} />
    <p style={{ color: 'var(--color-neutral-500)', fontSize: '0.875rem' }}>
      Verificando sesión...
    </p>
  </div>
)

// ─── Layout wrapper protegido (usa Outlet correctamente) ──────────────────────
const ProtectedLayout: React.FC = () => {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!session) return <Navigate to="/login" replace />
  return <MainLayout />
}

// ─── Wrapper ruta pública (redirige si ya logueado) ───────────────────────────
const PublicLayout: React.FC = () => {
  const { session, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (session) return <Navigate to="/" replace />
  return <Outlet />
}

// ─── Wrapper ruta de administrador ──────────────────────────────────────────────
const AdminRoute: React.FC = () => {
  const { profile } = useAuth()
  if (profile?.rol !== 'admin') return <Navigate to="/" replace />
  return <Outlet />
}

// ─── Rutas ────────────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Rutas públicas */}
    <Route element={<PublicLayout />}>
      <Route path="/login"    element={<Login />} />
      <Route path="/register" element={<Register />} />
    </Route>

    {/* Rutas protegidas */}
    <Route element={<ProtectedLayout />}>
      <Route index                  element={<Dashboard />} />
      <Route path="inventarios"     element={<Inventarios />} />
      
      {/* Rutas solo para Administradores */}
      <Route element={<AdminRoute />}>
        <Route path="catalogos"       element={<Catalogos />} />
        <Route path="configuracion"   element={<Configuracion />} />
        <Route path="administracion"  element={<Administracion />} />
      </Route>
    </Route>

    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
)

const App: React.FC = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  </BrowserRouter>
)

export default App
