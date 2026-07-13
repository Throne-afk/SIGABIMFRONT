import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

interface NavItem {
  path: string
  label: string
  icon: string
  description: string
  adminOnly?: boolean
}

const NAV_ITEMS: NavItem[] = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'fa-solid fa-gauge-high',
    description: 'Resumen general',
  },
  {
    path: '/inventarios',
    label: 'Inventarios',
    icon: 'fa-solid fa-boxes-stacked',
    description: 'Gestión de inventarios',
  },
  {
    path: '/catalogos',
    label: 'Catálogos',
    icon: 'fa-solid fa-layer-group',
    description: 'Catálogos de activos',
    adminOnly: true,
  },
  {
    path: '/configuracion',
    label: 'Configuración',
    icon: 'fa-solid fa-sliders',
    description: 'Configuración del sistema',
    adminOnly: true,
  },
  {
    path: '/administracion',
    label: 'Administración',
    icon: 'fa-solid fa-shield-halved',
    description: 'Usuarios y permisos',
    adminOnly: true,
  },
  {
    path: '/bitacora',
    label: 'Bitácora',
    icon: 'fa-solid fa-clipboard-list',
    description: 'Auditoría y movimientos',
    adminOnly: true,
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  mobileOpen?: boolean
  onMobileClose?: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle, mobileOpen, onMobileClose }) => {
  const location = useLocation()
  const { profile } = useAuth()

  // Si el usuario es editor, filtramos los ítems adminOnly
  const visibleItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && profile?.rol !== 'admin') return false
    return true
  })

  // Close sidebar on mobile when navigating
  const handleNavClick = () => {
    if (mobileOpen && onMobileClose) {
      onMobileClose()
    }
  }

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
      {/* Header / Brand */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <i className="fa-solid fa-building-columns" />
        </div>
        <div className="sidebar-brand">
          <h2>SIGABIM</h2>
          <span>Sistema BIM v1.0</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">Menú principal</div>

        {visibleItems.map((item) => {
          const isActive =
            item.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(item.path)

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : undefined}
              onClick={handleNavClick}
            >
              <span className="nav-icon">
                <i className={item.icon} />
              </span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Toggle button */}
      <div className="sidebar-toggle">
        <button onClick={onToggle} title={collapsed ? 'Expandir' : 'Colapsar'}>
          <i className={`fa-solid fa-angles-${collapsed ? 'right' : 'left'}`} />
          {!collapsed && <span>Colapsar</span>}
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
