import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventarios from './pages/Inventarios'
import Catalogos from './pages/Catalogos'
import Configuracion from './pages/Configuracion'
import Administracion from './pages/Administracion'
import Login from './pages/Login'
import Register from './pages/Register'

// ─── Ruta protegida ───────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth()

  if (loading) {
    return (
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
  }

  if (!session) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ─── Ruta pública (redirige si ya hay sesión) ─────────────────────────────────
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { session, loading } = useAuth()
  if (loading) return null
  if (session) return <Navigate to="/" replace />
  return <>{children}</>
}

// ─── App con rutas ────────────────────────────────────────────────────────────
const AppRoutes: React.FC = () => (
  <Routes>
    {/* Rutas públicas */}
    <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

    {/* Rutas protegidas */}
    <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
      <Route index                element={<Dashboard />} />
      <Route path="inventarios"   element={<Inventarios />} />
      <Route path="catalogos"     element={<Catalogos />} />
      <Route path="configuracion" element={<Configuracion />} />
      <Route path="administracion" element={<Administracion />} />
    </Route>

    {/* Catch-all */}
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
