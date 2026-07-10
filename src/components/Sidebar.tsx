import React from 'react'
import { NavLink, useLocation } from 'react-router-dom'

interface NavItem {
  path: string
  label: string
  icon: string
  description: string
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
  },
  {
    path: '/configuracion',
    label: 'Configuración',
    icon: 'fa-solid fa-sliders',
    description: 'Configuración del sistema',
  },
  {
    path: '/administracion',
    label: 'Administración',
    icon: 'fa-solid fa-shield-halved',
    description: 'Usuarios y permisos',
  },
]

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const location = useLocation()

  return (
    <aside className={`sidebar${collapsed ? ' collapsed' : ''}`}>
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

        {NAV_ITEMS.map((item) => {
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
