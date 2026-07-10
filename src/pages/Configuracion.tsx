import React, { useState } from 'react'

interface SettingGroup {
  icon: string
  label: string
  description: string
  items: { id: string; label: string; type: 'toggle' | 'text' | 'select'; value: string | boolean; options?: string[] }[]
}

const SETTINGS: SettingGroup[] = [
  {
    icon: 'fa-solid fa-server',
    label: 'Conexión API',
    description: 'Configura los parámetros de conexión con el backend',
    items: [
      { id: 'api-url',  label: 'URL de la API',   type: 'text',   value: 'http://localhost:3001/api' },
      { id: 'timeout',  label: 'Timeout (segundos)', type: 'text', value: '60' },
    ],
  },
  {
    icon: 'fa-solid fa-file-import',
    label: 'Importación Excel',
    description: 'Parámetros para el procesamiento de archivos Excel',
    items: [
      { id: 'sheet-index',   label: 'Índice de hoja por defecto', type: 'text',   value: '0' },
      { id: 'delete-after',  label: 'Eliminar archivo tras parseo', type: 'toggle', value: true },
      { id: 'max-size',      label: 'Tamaño máximo de archivo',    type: 'select', value: '25 MB', options: ['10 MB', '25 MB', '50 MB', '100 MB'] },
    ],
  },
  {
    icon: 'fa-solid fa-palette',
    label: 'Apariencia',
    description: 'Personalización de la interfaz de usuario',
    items: [
      { id: 'theme',    label: 'Tema',        type: 'select', value: 'Claro', options: ['Claro', 'Oscuro', 'Sistema'] },
      { id: 'lang',     label: 'Idioma',      type: 'select', value: 'Español', options: ['Español', 'English'] },
      { id: 'compact',  label: 'Modo compacto', type: 'toggle', value: false },
    ],
  },
]

const Configuracion: React.FC = () => {
  const [saved, setSaved] = useState(false)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Configuración</h1>
        <p>Administra los parámetros del sistema, conexión y preferencias de la aplicación.</p>
      </div>

      <div className="flex flex-col gap-6">
        {SETTINGS.map((group) => (
          <div key={group.label} className="card">
            <div className="card-header mb-6">
              <div className="flex items-center gap-3">
                <div className="stat-icon blue" style={{ width: 40, height: 40, fontSize: 'var(--font-size-base)' }}>
                  <i className={group.icon} />
                </div>
                <div>
                  <div className="card-title">{group.label}</div>
                  <div className="text-xs text-muted">{group.description}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              {group.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between"
                  style={{
                    padding: '12px 0',
                    borderBottom: '1px solid var(--color-neutral-100)',
                  }}
                >
                  <label
                    htmlFor={item.id}
                    style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: 500,
                      color: 'var(--color-neutral-700)',
                    }}
                  >
                    {item.label}
                  </label>
                  {item.type === 'toggle' && (
                    <div
                      id={item.id}
                      style={{
                        width: 44, height: 24,
                        borderRadius: 'var(--radius-full)',
                        background: item.value ? 'var(--color-primary-600)' : 'var(--color-neutral-300)',
                        cursor: 'pointer',
                        position: 'relative',
                        transition: 'var(--transition-base)',
                        flexShrink: 0,
                      }}
                    >
                      <div style={{
                        position: 'absolute',
                        top: 3, left: item.value ? 23 : 3,
                        width: 18, height: 18,
                        borderRadius: '50%',
                        background: '#fff',
                        boxShadow: 'var(--shadow-sm)',
                        transition: 'var(--transition-base)',
                      }} />
                    </div>
                  )}
                  {item.type === 'text' && (
                    <input
                      id={item.id}
                      defaultValue={String(item.value)}
                      style={{
                        border: '1px solid var(--color-neutral-300)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        fontSize: 'var(--font-size-sm)',
                        width: 220,
                        fontFamily: 'var(--font-family-base)',
                        outline: 'none',
                        color: 'var(--color-neutral-800)',
                      }}
                    />
                  )}
                  {item.type === 'select' && (
                    <select
                      id={item.id}
                      defaultValue={String(item.value)}
                      style={{
                        border: '1px solid var(--color-neutral-300)',
                        borderRadius: 'var(--radius-md)',
                        padding: '6px 12px',
                        fontSize: 'var(--font-size-sm)',
                        width: 180,
                        fontFamily: 'var(--font-family-base)',
                        outline: 'none',
                        color: 'var(--color-neutral-800)',
                        background: '#fff',
                      }}
                    >
                      {item.options?.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {saved && (
          <div className="alert alert-success animate-fade-in">
            <i className="fa-solid fa-circle-check" />
            Configuración guardada correctamente.
          </div>
        )}

        <div className="flex gap-3">
          <button
            className="btn btn-primary"
            id="btn-save-config"
            onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 3000) }}
          >
            <i className="fa-solid fa-floppy-disk" /> Guardar cambios
          </button>
          <button className="btn btn-secondary" id="btn-reset-config">
            <i className="fa-solid fa-rotate-left" /> Restablecer
          </button>
        </div>
      </div>
    </div>
  )
}

export default Configuracion
