import React, { useEffect, useState } from 'react'
import { fetchInventarios, type ParseResult } from '../api/inventario'

const Dashboard: React.FC = () => {
  const [inventarios, setInventarios] = useState<ParseResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventarios()
      .then((resp) => {
        if (resp.success && resp.data) setInventarios(resp.data)
      })
      .catch(() => {/* silencioso si la API no está disponible */})
      .finally(() => setLoading(false))
  }, [])

  const totalRegistros = inventarios.reduce((acc, inv) => acc + inv.totalRegistros, 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Bienvenido al Sistema de Gestión y Administración BIM. Aquí tienes el resumen de actividad.</p>
      </div>

      {/* Stat Cards — datos reales */}
      <div className="grid grid-cols-3 gap-6 mb-8 animate-stagger">
        {/* Archivos importados */}
        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fa-solid fa-file-excel" />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {loading ? '—' : inventarios.length.toLocaleString()}
            </div>
            <div className="stat-label">Archivos importados</div>
          </div>
        </div>

        {/* Total registros */}
        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fa-solid fa-boxes-stacked" />
          </div>
          <div className="stat-info">
            <div className="stat-value">
              {loading ? '—' : totalRegistros.toLocaleString()}
            </div>
            <div className="stat-label">Total registros cargados</div>
          </div>
        </div>

        {/* Última importación */}
        <div className="stat-card">
          <div className="stat-icon yellow">
            <i className="fa-solid fa-clock-rotate-left" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-lg)' }}>
              {loading
                ? '—'
                : inventarios.length > 0
                  ? new Date(inventarios[0].fechaImportacion).toLocaleDateString('es-MX')
                  : 'Sin datos'
              }
            </div>
            <div className="stat-label">Última importación</div>
          </div>
        </div>
      </div>

      {/* Tabla de importaciones recientes — datos reales */}
      <div className="grid grid-cols-3 gap-6">
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header mb-4">
            <span className="card-title">
              <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px', color: 'var(--color-primary-500)' }} />
              Importaciones recientes
            </span>
            <a href="/inventarios" className="btn btn-sm btn-secondary">Ver todos</a>
          </div>

          {loading ? (
            <div style={{ padding: 24, textAlign: 'center' }}>
              <div className="spinner" style={{ margin: '0 auto' }} />
            </div>
          ) : inventarios.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
              <i className="fa-regular fa-file-excel" />
              <h3>Sin importaciones</h3>
              <p>Aún no se ha cargado ningún archivo. Ve a Inventarios para importar tu primer Excel.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Archivo</th>
                    <th>Fecha</th>
                    <th>Hoja</th>
                    <th>Registros</th>
                    <th>Columnas</th>
                  </tr>
                </thead>
                <tbody>
                  {inventarios.slice(0, 10).map((inv) => (
                    <tr key={inv.id}>
                      <td>
                        <div className="flex items-center gap-2">
                          <i className="fa-regular fa-file-excel" style={{ color: 'var(--color-success)' }} />
                          <span style={{ fontWeight: 500 }}>{inv.archivo}</span>
                        </div>
                      </td>
                      <td className="text-muted">
                        {new Date(inv.fechaImportacion).toLocaleString('es-MX', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="text-muted">{inv.hoja}</td>
                      <td>
                        <span className="badge badge-blue">{inv.totalRegistros.toLocaleString()}</span>
                      </td>
                      <td>
                        <span className="badge badge-neutral">{inv.cabeceras.length}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acceso rápido */}
        <div className="card">
          <div className="card-header mb-4">
            <span className="card-title">
              <i className="fa-solid fa-bolt" style={{ marginRight: '8px', color: 'var(--color-warning)' }} />
              Acceso rápido
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {[
              { icon: 'fa-solid fa-upload',          label: 'Importar Excel',   color: 'var(--color-primary-600)', path: '/inventarios' },
              { icon: 'fa-solid fa-layer-group',     label: 'Ver catálogos',    color: 'var(--color-success)',     path: '/catalogos' },
              { icon: 'fa-solid fa-sliders',         label: 'Configuración',    color: 'var(--color-warning)',     path: '/configuracion' },
              { icon: 'fa-solid fa-shield-halved',   label: 'Administración',   color: 'var(--color-danger)',      path: '/administracion' },
            ].map((item) => (
              <a
                key={item.label}
                href={item.path}
                className="flex items-center gap-3"
                style={{
                  padding: '12px 14px',
                  background: 'var(--color-neutral-50)',
                  border: '1px solid var(--color-neutral-200)',
                  color: 'var(--color-neutral-700)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 500,
                  textDecoration: 'none',
                  transition: 'var(--transition-fast)',
                }}
                onMouseEnter={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--color-primary-50)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-primary-200)'
                }}
                onMouseLeave={(e) => {
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-50)'
                  ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-neutral-200)'
                }}
              >
                <span
                  style={{
                    width: 34, height: 34,
                    background: `${item.color}18`,
                    color: item.color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <i className={item.icon} />
                </span>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
