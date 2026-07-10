import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'

const PAGE_META: Record<string, { title: string; breadcrumb: string }> = {
  '/':              { title: 'Dashboard',       breadcrumb: 'Inicio / Dashboard' },
  '/inventarios':   { title: 'Inventarios',     breadcrumb: 'Inicio / Inventarios' },
  '/catalogos':     { title: 'Catálogos',       breadcrumb: 'Inicio / Catálogos' },
  '/configuracion': { title: 'Configuración',   breadcrumb: 'Inicio / Configuración' },
  '/administracion':{ title: 'Administración',  breadcrumb: 'Inicio / Administración' },
}

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const location = useLocation()

  // Resolve active page meta (handle nested routes too)
  const pageMeta =
    PAGE_META[location.pathname] ||
    Object.entries(PAGE_META).find(([key]) => key !== '/' && location.pathname.startsWith(key))?.[1] ||
    { title: 'SIGABIM', breadcrumb: 'Inicio' }

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className={`app-content${collapsed ? ' sidebar-collapsed' : ''}`}>
        {/* Topbar */}
        <header className={`topbar${collapsed ? ' sidebar-collapsed' : ''}`}>
          <div className="topbar-left">
            <h1 className="topbar-title">{pageMeta.title}</h1>
            <span className="topbar-breadcrumb">
              <i className="fa-solid fa-chevron-right" style={{ fontSize: '10px', marginRight: '6px' }} />
              {pageMeta.breadcrumb}
            </span>
          </div>

          <div className="topbar-right">
            {/* Notificaciones */}
            <button className="topbar-btn" title="Notificaciones" id="btn-notifications">
              <i className="fa-regular fa-bell" />
            </button>

            {/* Ayuda */}
            <button className="topbar-btn" title="Ayuda" id="btn-help">
              <i className="fa-regular fa-circle-question" />
            </button>

            {/* Avatar de usuario */}
            <div className="topbar-avatar" title="Mi cuenta" id="btn-user-menu">
              AD
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default MainLayout
