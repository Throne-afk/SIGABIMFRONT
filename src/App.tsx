import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import Dashboard from './pages/Dashboard'
import Inventarios from './pages/Inventarios'
import Catalogos from './pages/Catalogos'
import Configuracion from './pages/Configuracion'
import Administracion from './pages/Administracion'

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="inventarios" element={<Inventarios />} />
          <Route path="catalogos"   element={<Catalogos />} />
          <Route path="configuracion" element={<Configuracion />} />
          <Route path="administracion" element={<Administracion />} />
        </Route>
        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
