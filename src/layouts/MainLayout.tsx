import React, { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import UserProfilePanel from '../components/UserProfilePanel'
import { useAuth } from '../context/AuthContext'

const PAGE_META: Record<string, { title: string; breadcrumb: string }> = {
  '/':              { title: 'Dashboard',       breadcrumb: 'Inicio / Dashboard' },
  '/inventarios':   { title: 'Inventarios',     breadcrumb: 'Inicio / Inventarios' },
  '/catalogos':     { title: 'Catálogos',       breadcrumb: 'Inicio / Catálogos' },
  '/configuracion': { title: 'Configuración',   breadcrumb: 'Inicio / Configuración' },
  '/administracion':{ title: 'Administración',  breadcrumb: 'Inicio / Administración' },
}

const MainLayout: React.FC = () => {
  const [collapsed,    setCollapsed]    = useState(false)
  const [profileOpen,  setProfileOpen]  = useState(false)
  const location = useLocation()
  const { profile } = useAuth()

  const pageMeta =
    PAGE_META[location.pathname] ||
    Object.entries(PAGE_META).find(([key]) => key !== '/' && location.pathname.startsWith(key))?.[1] ||
    { title: 'SIGABIM', breadcrumb: 'Inicio' }

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

  return (
    <div className="app-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

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

            {/* Avatar de usuario — abre panel de perfil */}
            <div
              className="topbar-avatar"
              title={profile?.nombre ?? 'Mi cuenta'}
              id="btn-user-menu"
              onClick={() => setProfileOpen(true)}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setProfileOpen(true)}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.nombre}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                getInitials(profile?.nombre ?? '')
              )}
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="page-container">
          <Outlet />
        </main>
      </div>

      {/* Panel de perfil */}
      <UserProfilePanel open={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  )
}

export default MainLayout
