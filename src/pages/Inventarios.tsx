import React, { useState, useCallback, useEffect, useMemo } from 'react'
import {
  uploadInventarioExcel,
  fetchInventarios,
  deleteInventario,
  createRecord,
  updateRecord,
  fetchUniversos,
  fetchBajasHistory,
  type ParseResult,
  type InventarioRecord,
  type BajaRecord,
} from '../api/inventario'
import VirtualTable from '../components/VirtualTable'
import TableToolbar from '../components/TableToolbar'
import AdvancedFilterModal from '../components/AdvancedFilterModal'
import RecordDetailPanel from '../components/RecordDetailPanel'
import RecordEditPanel from '../components/RecordEditPanel'
import InventarioDashboard from '../components/InventarioDashboard'
import ColumnPickerModal from '../components/ColumnPickerModal'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'error'
type ViewMode = 'base-general' | 'universo' | 'historial-bajas'

interface Toast {
  id: number
  msg: string
  type: 'info' | 'warning' | 'success' | 'error'
  icon: string
}

// ─── Toast Manager ─────────────────────────────────────────────────────────────

let toastId = 0

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const show = useCallback((
    msg: string,
    type: Toast['type'] = 'info',
    icon = 'fa-solid fa-circle-info',
    duration = 3500
  ) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, msg, type, icon }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  return { toasts, show }
}

// ─── Upload Zone ───────────────────────────────────────────────────────────────

const UploadZone: React.FC<{
  status: UploadStatus
  progress: number
  selectedFile: File | null
  errorMsg: string
  onFileSelect: (file: File) => void
  onRetry: () => void
}> = ({ status, progress, selectedFile, errorMsg, onFileSelect, onRetry }) => {
  const [dragging, setDragging] = useState(false)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (status !== 'idle') return
      const file = e.dataTransfer.files[0]
      if (file) onFileSelect(file)
    },
    [onFileSelect, status]
  )

  return (
    <div className="card" style={{ padding: 0 }}>
      <div style={{ padding: '13px 16px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fa-solid fa-file-import" style={{ color: 'var(--color-primary-600)', fontSize: 14 }} />
        <span className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>Importar Excel</span>
      </div>

      {/* ── idle: drop zone ─────────────────────────────────────────── */}
      {status === 'idle' && (
        <div style={{ padding: 14 }}>
          <div
            style={{
              border: `2px dashed ${dragging ? 'var(--color-primary-500)' : 'var(--color-neutral-300)'}`,
              padding: '18px 12px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'var(--color-primary-50)' : 'var(--color-neutral-50)',
              borderRadius: 4,
              transition: 'all 0.18s ease',
            }}
            onClick={() => document.getElementById('side-file-input')?.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <i
              className={dragging ? 'fa-solid fa-cloud-arrow-up' : 'fa-regular fa-file-excel'}
              style={{ fontSize: 26, color: dragging ? 'var(--color-primary-500)' : 'var(--color-success)', marginBottom: 8, display: 'block' }}
            />
            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-600)', marginBottom: 10 }}>
              {dragging ? 'Suelta el archivo aquí' : <>Arrastra un <strong>.xlsx</strong> o <strong>.xls</strong></>}
            </div>
            <label
              htmlFor="side-file-input"
              className="btn btn-primary"
              style={{ cursor: 'pointer', display: 'inline-flex', pointerEvents: 'none' }}
            >
              <i className="fa-solid fa-folder-open" />
              Seleccionar archivo
            </label>
            <input
              id="side-file-input"
              type="file"
              accept=".xls,.xlsx"
              style={{ display: 'none' }}
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) onFileSelect(file)
                e.target.value = ''
              }}
            />
          </div>

          {/* Estructura esperada */}
          <div style={{
            marginTop: 10,
            padding: '8px 10px',
            background: 'var(--color-info-light)',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-info-dark)',
            border: '1px solid #aac6e0',
            borderRadius: 3,
            lineHeight: 1.65,
          }}>
            <div style={{ fontWeight: 700, marginBottom: 3 }}>
              <i className="fa-solid fa-circle-info" style={{ marginRight: 5 }} />
              Estructura del Excel
            </div>
            <div>· <strong>Filas 1-2:</strong> Se omiten</div>
            <div>· <strong>Fila 3:</strong> Encabezados (keys)</div>
            <div>· <strong>Fila 4+:</strong> Datos del inventario</div>
            <div>· <strong>Col 1-2:</strong> Sección / Categoría</div>
          </div>
        </div>
      )}

      {/* ── uploading ───────────────────────────────────────────────── */}
      {status === 'uploading' && (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <i className="fa-solid fa-cloud-arrow-up"
            style={{ fontSize: 28, color: 'var(--color-primary-400)', display: 'block', marginBottom: 10 }} />
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-700)', marginBottom: 3 }}>
            Transfiriendo archivo...
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selectedFile?.name}
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${progress}%`, transition: 'width 0.3s' }} />
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-400)', marginTop: 4 }}>{progress}%</div>
        </div>
      )}

      {/* ── processing ──────────────────────────────────────────────── */}
      {status === 'processing' && (
        <div style={{ padding: 20, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px', width: 30, height: 30 }} />
          <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-700)', marginBottom: 4 }}>
            Procesando en servidor...
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', lineHeight: 1.65 }}>
            Parseando filas del Excel<br />e insertando en Supabase.<br />
            <span style={{ color: 'var(--color-neutral-400)' }}>Puede tardar unos segundos.</span>
          </div>
        </div>
      )}

      {/* ── error ───────────────────────────────────────────────────── */}
      {status === 'error' && (
        <div style={{ padding: 14 }}>
          <div className="alert alert-error" style={{ marginBottom: 10, fontSize: 'var(--font-size-xs)' }}>
            <i className="fa-solid fa-circle-xmark" />
            <div>{errorMsg}</div>
          </div>
          <button className="btn btn-secondary w-full" onClick={onRetry} id="btn-retry-upload">
            <i className="fa-solid fa-rotate-left" /> Reintentar
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Lista de inventarios ──────────────────────────────────────────────────────

const InventarioList: React.FC<{
  inventarios: ParseResult[]
  activeArchivo: string | null
  onSelect: (archivo: string) => void
  onDelete: (id: string) => void
}> = ({ inventarios, activeArchivo, onSelect, onDelete }) => {
  if (inventarios.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
        <i className="fa-solid fa-inbox" />
        <h3>Sin inventarios</h3>
        <p>Importa un Excel para comenzar.</p>
      </div>
    )
  }

  // Agrupar por archivo
  const archivosMap = new Map<string, { fecha: string, total: number, ids: string[] }>()
  inventarios.forEach(inv => {
    if (!archivosMap.has(inv.archivo)) {
      archivosMap.set(inv.archivo, { fecha: inv.fechaImportacion, total: inv.totalRegistros, ids: [inv.id] })
    } else {
      const g = archivosMap.get(inv.archivo)!
      g.total += inv.totalRegistros
      g.ids.push(inv.id)
    }
  })
  const archivos = Array.from(archivosMap.entries())

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {archivos.map(([archivo, data], idx) => (
        <div
          key={archivo}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderBottom: idx < archivos.length - 1 ? '1px solid var(--color-neutral-100)' : 'none',
            background: activeArchivo === archivo ? 'var(--color-primary-50)' : '#fff',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onClick={() => onSelect(archivo)}
          onMouseEnter={e => { if (activeArchivo !== archivo) (e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-50)' }}
          onMouseLeave={e => { if (activeArchivo !== archivo) (e.currentTarget as HTMLElement).style.background = '#fff' }}
        >
          <i
            className="fa-regular fa-file-excel"
            style={{ fontSize: 19, color: activeArchivo === archivo ? 'var(--color-primary-600)' : 'var(--color-success)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {archivo}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2 }}>
              {new Date(data.fecha).toLocaleString('es-MX')}
              {' · '}
              <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 5px' }}>
                {data.total.toLocaleString()} reg. totales
              </span>
              {' · '}<span style={{ opacity: 0.7 }}>{data.ids.length} hoja(s)</span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-danger"
            id={`btn-delete-${archivo}`}
            title="Eliminar inventario (todas las hojas)"
            onClick={e => { 
              e.stopPropagation(); 
              data.ids.forEach(id => onDelete(id));
            }}
          >
            <i className="fa-regular fa-trash-can" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── ModuleCardStats — carga stats reales para cada tarjeta de módulo ──────────

const ModuleCardStats: React.FC<{ inventarioId: string }> = ({ inventarioId }) => {
  const [universoCount, setUniversoCount] = useState<number | null>(null)

  useEffect(() => {
    fetchUniversos(inventarioId)
      .then(res => {
        if (res.success && res.data) {
          const valid = res.data.filter(u => u && u.trim() && u.toUpperCase() !== 'S/INF' && u.toUpperCase() !== 'NULL')
          setUniversoCount(valid.length)
        }
      })
      .catch(() => {})
  }, [inventarioId])


  return (
    <>
      <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-neutral-800)', letterSpacing: '-0.01em' }}>
        {universoCount !== null ? universoCount.toLocaleString('es-MX') : <span style={{ color: 'var(--color-neutral-300)', fontSize: '0.85rem' }}>—</span>}
      </div>
    </>
  )
}

const ModuleCardStatsCantidad: React.FC<{ totalRegistros: number }> = ({ totalRegistros }) => (
  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-neutral-800)', letterSpacing: '-0.01em' }}>
    {totalRegistros.toLocaleString('es-MX')}
  </div>
)

// ─── Historial de Bajas Component ─────────────────────────────────────────────


const HistorialBajas: React.FC<{ inventarioId: string }> = ({ inventarioId }) => {
  const [bajas, setBajas] = useState<BajaRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetchBajasHistory(inventarioId)
      .then(res => {
        if (res.success && res.data) setBajas(res.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [inventarioId])

  const chipStyle = (tipo: string): React.CSSProperties => {
    const t = tipo.toLowerCase()
    if (t.includes('baja')) return { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
    if (t.includes('inhabilitad')) return { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' }
    return { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' }
  }

  return (
    <div style={{ padding: '0 16px 16px' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '16px 0 14px',
        borderBottom: '1px solid var(--color-neutral-200)',
        marginBottom: 16,
      }}>
        <div className="stat-icon red" style={{ width: 38, height: 38, fontSize: '0.9rem', borderRadius: 4 }}>
          <i className="fa-solid fa-arrow-down-to-bracket" />
        </div>
        <div>
          <div className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>Historial de Bajas e Inhabilitaciones</div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
            Todos los movimientos de baja, inhabilitación o cambios registrados en los bienes del inventario.
          </div>
        </div>
        <span className="badge badge-red" style={{ marginLeft: 'auto' }}>
          <i className="fa-solid fa-list" /> {bajas.length} movimientos
        </span>
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 12px' }} />
          <div style={{ color: 'var(--color-neutral-500)', fontSize: 'var(--font-size-sm)' }}>Cargando historial de bajas...</div>
        </div>
      ) : bajas.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-12)' }}>
          <i className="fa-solid fa-clock-rotate-left" />
          <h3>Sin movimientos registrados</h3>
          <p>No se han registrado bajas o inhabilitaciones en este inventario aún.<br />Los movimientos se registrarán aquí cuando se realicen cambios a los bienes.</p>
        </div>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>No. Inventario</th>
                <th>Descripción</th>
                <th>Universo</th>
                <th>Tipo de Movimiento</th>
                <th>Campo Modificado</th>
                <th>Valor Anterior</th>
                <th>Valor Nuevo</th>
                <th>Usuario</th>
                <th>Fecha</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {bajas.map((b, i) => (
                <tr key={b.id}>
                  <td style={{ color: 'var(--color-neutral-400)', fontSize: '0.8rem' }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-primary-700)' }}>{b.numeroInventario}</td>
                  <td style={{ fontSize: '0.85rem', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.descripcion}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-neutral-600)' }}>{b.universo}</td>
                  <td>
                    <span style={{ ...chipStyle(b.tipoMovimiento), display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 3, fontSize: '0.75rem', fontWeight: 600 }}>
                      {b.tipoMovimiento.includes('baja') && <i className="fa-solid fa-arrow-down" style={{ fontSize: '0.6rem' }} />}
                      {b.tipoMovimiento.includes('inhabilitad') && <i className="fa-solid fa-ban" style={{ fontSize: '0.6rem' }} />}
                      {b.tipoMovimiento}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-neutral-600)' }}>{b.campoModificado ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-danger)', fontStyle: b.valorAnterior ? 'normal' : 'italic' }}>{b.valorAnterior ?? '—'}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-success)', fontStyle: b.valorNuevo ? 'normal' : 'italic' }}>{b.valorNuevo ?? '—'}</td>
                  <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{b.usuario}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', whiteSpace: 'nowrap' }}>
                    {new Date(b.fechaMovimiento).toLocaleString('es-MX')}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {b.observaciones ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── View Mode Tabs ────────────────────────────────────────────────────────────

const ViewModeTabs: React.FC<{
  mode: ViewMode
  onChange: (m: ViewMode) => void
  universos: string[]
  selectedUniverso: string | null
  onUniversoSelect: (u: string | null) => void
  loadingUniversos: boolean
}> = ({ mode, onChange, universos, selectedUniverso, onUniversoSelect, loadingUniversos }) => {
  const tabs: { key: ViewMode; label: string; icon: string }[] = [
    { key: 'base-general', label: 'Base General', icon: 'fa-table' },
    { key: 'universo',     label: 'Universo',     icon: 'fa-globe' },
    { key: 'historial-bajas', label: 'Historial de Bajas', icon: 'fa-clock-rotate-left' },
  ]

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '8px 18px',
    border: active ? '2px solid var(--color-primary-600)' : '2px solid var(--color-neutral-200)',
    background: active ? 'var(--color-primary-600)' : '#fff',
    color: active ? '#fff' : 'var(--color-neutral-600)',
    fontWeight: active ? 700 : 500,
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.18s',
    letterSpacing: '0.01em',
  })

  return (
    <div>
      {/* Tab buttons */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '14px 16px 0',
        borderBottom: '2px solid var(--color-neutral-200)',
        background: '#fff',
        flexWrap: 'wrap',
      }}>
        {tabs.map(t => (
          <button
            key={t.key}
            id={`tab-${t.key}`}
            style={{
              ...tabStyle(mode === t.key),
              marginBottom: -2,
              borderBottomColor: mode === t.key ? 'var(--color-primary-600)' : 'transparent',
              borderBottom: mode === t.key ? '2px solid var(--color-primary-600)' : '2px solid transparent',
            }}
            onClick={() => onChange(t.key)}
            onMouseEnter={e => {
              if (mode !== t.key) {
                (e.currentTarget as HTMLElement).style.background = 'var(--color-primary-50)'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--color-primary-700)'
              }
            }}
            onMouseLeave={e => {
              if (mode !== t.key) {
                (e.currentTarget as HTMLElement).style.background = '#fff'
                ;(e.currentTarget as HTMLElement).style.color = 'var(--color-neutral-600)'
              }
            }}
          >
            <i className={`fa-solid ${t.icon}`} style={{ fontSize: '0.8rem' }} />
            {t.label}
            {t.key === 'historial-bajas' && (
              <span style={{
                background: mode === t.key ? 'rgba(255,255,255,0.25)' : 'var(--color-danger-light)',
                color: mode === t.key ? '#fff' : 'var(--color-danger)',
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: '0.7rem',
                fontWeight: 700,
                marginLeft: 2,
              }}>HIST</span>
            )}
          </button>
        ))}
      </div>

      {/* Universo list panel — shown inline next to tab when mode === 'universo' */}
      {mode === 'universo' && (
        <div className="animate-fade-in" style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 0,
          borderBottom: '1px solid var(--color-neutral-200)',
          background: 'var(--color-neutral-50)',
        }}>
          {/* Universo list sidebar */}
          <div style={{
            width: 220,
            borderRight: '1px solid var(--color-neutral-200)',
            background: '#fff',
            maxHeight: 240,
            overflowY: 'auto',
            flexShrink: 0,
          }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-neutral-100)', display: 'flex', alignItems: 'center', gap: 7 }}>
              <i className="fa-solid fa-globe" style={{ color: 'var(--color-primary-500)', fontSize: '0.8rem' }} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-600)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Universos disponibles
              </span>
            </div>
            {loadingUniversos ? (
              <div style={{ padding: 20, textAlign: 'center' }}>
                <div className="spinner" style={{ width: 20, height: 20, margin: '0 auto' }} />
              </div>
            ) : universos.length === 0 ? (
              <div style={{ padding: '14px 12px', fontSize: '0.8rem', color: 'var(--color-neutral-400)', textAlign: 'center' }}>
                Sin universos detectados
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Opción "Todos" */}
                <button
                  onClick={() => onUniversoSelect(null)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 12px',
                    background: selectedUniverso === null ? 'var(--color-primary-50)' : '#fff',
                    color: selectedUniverso === null ? 'var(--color-primary-700)' : 'var(--color-neutral-600)',
                    fontWeight: selectedUniverso === null ? 700 : 400,
                    fontSize: '0.85rem',
                    border: 'none',
                    borderBottom: '1px solid var(--color-neutral-100)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'all 0.12s',
                  }}
                >
                  <i className="fa-solid fa-list" style={{ fontSize: '0.7rem', width: 14, textAlign: 'center', color: selectedUniverso === null ? 'var(--color-primary-600)' : 'var(--color-neutral-400)' }} />
                  Todos los universos
                </button>
                {universos.map((u, i) => (
                  <button
                    key={u}
                    onClick={() => onUniversoSelect(u)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '9px 12px',
                      background: selectedUniverso === u ? 'var(--color-primary-50)' : '#fff',
                      color: selectedUniverso === u ? 'var(--color-primary-700)' : 'var(--color-neutral-700)',
                      fontWeight: selectedUniverso === u ? 700 : 400,
                      fontSize: '0.85rem',
                      border: 'none',
                      borderBottom: i < universos.length - 1 ? '1px solid var(--color-neutral-100)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.12s',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <i className="fa-solid fa-circle" style={{ fontSize: '0.4rem', width: 14, textAlign: 'center', color: selectedUniverso === u ? 'var(--color-primary-600)' : 'var(--color-neutral-400)' }} />
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info about selected universo */}
          <div style={{ padding: '12px 16px', flex: 1 }}>
            {selectedUniverso ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 700, border: '1px solid var(--color-primary-200)', borderRadius: 4 }}>
                  <i className="fa-solid fa-filter" style={{ marginRight: 6, fontSize: '0.7rem' }} />
                  Filtrando por: {selectedUniverso}
                </span>
                <button onClick={() => onUniversoSelect(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-400)', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="fa-solid fa-xmark" /> Limpiar filtro
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--color-neutral-500)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-hand-pointer" style={{ color: 'var(--color-primary-400)' }} />
                Selecciona un universo de la lista para filtrar los registros de la tabla.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const Inventarios: React.FC = () => {
  const [inventarios, setInventarios]         = useState<ParseResult[]>([])
  const [activeArchivo, setActiveArchivo]       = useState<string | null>(null)
  const [activeInventario, setActiveInventario] = useState<ParseResult | null>(null)
  const [uploadStatus, setUploadStatus]       = useState<UploadStatus>('idle')
  const [progress, setProgress]               = useState(0)
  const [errorMsg, setErrorMsg]               = useState('')
  const [selectedFile, setSelectedFile]       = useState<File | null>(null)
  const [loadingList, setLoadingList]         = useState(true)

  // View mode state
  const [viewMode, setViewMode] = useState<ViewMode>('base-general')
  const [universos, setUniversos] = useState<string[]>([])
  const [loadingUniversos, setLoadingUniversos] = useState(false)
  const [selectedUniverso, setSelectedUniverso] = useState<string | null>(null)

  // Estados para búsqueda y filtros
  const [globalSearch, setGlobalSearch] = useState(() => sessionStorage.getItem('sigabim_search') || '')
  
  useEffect(() => {
    sessionStorage.setItem('sigabim_search', globalSearch)
  }, [globalSearch])

  const [advancedFilters, setAdvancedFilters] = useState<Record<string, string>>({})
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isColumnPickerOpen, setIsColumnPickerOpen] = useState(false)

  // Columnas visibles — persiste en sessionStorage por inventario
  const [visibleCols, setVisibleCols] = useState<Set<string> | null>(null)

  // Cuando cambia el inventario activo, restaurar la selección guardada (o mostrar todas)
  useEffect(() => {
    if (!activeInventario) return;
    const key = `sigabim_cols_${activeInventario.id}`;
    const saved = sessionStorage.getItem(key);
    if (saved) {
      try {
        setVisibleCols(new Set(JSON.parse(saved)));
        return;
      } catch { /* ignorar */ }
    }
    // Por defecto: todas las columnas visibles
    setVisibleCols(null);
  }, [activeInventario?.id])

  // Cargar universos cuando cambia el inventario activo
  useEffect(() => {
    if (!activeInventario) return
    setLoadingUniversos(true)
    setUniversos([])
    setSelectedUniverso(null)
    fetchUniversos(activeInventario.id)
      .then(res => {
        if (res.success && res.data) {
          // Filtrar valores vacíos y S/INF
          const filtered = res.data.filter(u => u && u.trim() !== '' && u.toUpperCase() !== 'S/INF' && u.toUpperCase() !== 'NULL')
          setUniversos(filtered)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingUniversos(false))
  }, [activeInventario?.id])

  const handleApplyColumns = useCallback((cols: Set<string>) => {
    setVisibleCols(cols);
    if (activeInventario) {
      sessionStorage.setItem(`sigabim_cols_${activeInventario.id}`, JSON.stringify([...cols]));
    }
  }, [activeInventario])

  // Array de columnas visibles (para pasar a VirtualTable)
  const visibleCabecerasArr = useMemo(() => {
    if (!visibleCols || !activeInventario) return undefined;
    return activeInventario.cabeceras.filter(c => visibleCols.has(c));
  }, [visibleCols, activeInventario])

  // Filtros avanzados computados (universo + advanced)
  const computedFilters = useMemo(() => {
    const base = { ...advancedFilters }
    if (viewMode === 'universo' && selectedUniverso) {
      base['Universo'] = selectedUniverso
    }
    return base
  }, [advancedFilters, viewMode, selectedUniverso])

  // Estados para el registro seleccionado
  const [selectedRecord, setSelectedRecord] = useState<InventarioRecord | null>(null)
  const [selectedRowIndex, setSelectedRowIndex] = useState<number | null>(null)

  // Estados para agregar/editar
  const [showEditPanel, setShowEditPanel] = useState(false)
  const [editingRecord, setEditingRecord] = useState<InventarioRecord | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  // Vista expandida (pantalla completa de la tabla)
  const [expandedView, setExpandedView] = useState(false)

  // Salir de vista expandida con ESC
  useEffect(() => {
    if (!expandedView) return
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setExpandedView(false) }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [expandedView])

  const { toasts, show: showToast } = useToast()

  // ── Cargar inventarios ──────────────────────────────────────────────────────

  useEffect(() => { loadInventarios() }, [])

  const loadInventarios = async () => {
    setLoadingList(true)
    try {
      const resp = await fetchInventarios()
      if (resp.success && resp.data) {
        setInventarios(resp.data)
      }
    } catch { /* silencioso */ }
    finally { setLoadingList(false) }
  }

  // ── Upload ──────────────────────────────────────────────────────────────────

  const handleFileSelect = async (file: File) => {
    setSelectedFile(file)
    setUploadStatus('uploading')
    setProgress(0)
    setErrorMsg('')

    try {
      const response = await uploadInventarioExcel(file, 0, pct => {
        setProgress(pct)
        if (pct >= 100) setUploadStatus('processing')
      })

      if (response.success && response.data) {
        setInventarios(prev => [...response.data!, ...prev])
        setActiveArchivo(response.data[0].archivo)
        setActiveInventario(null)
        setUploadStatus('idle')
        showToast(
          `${response.data.length} hoja(s) importada(s) correctamente`,
          'success',
          'fa-solid fa-circle-check'
        )
      } else {
        setErrorMsg(response.message || 'El servidor rechazó el archivo.')
        setUploadStatus('error')
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con el servidor.'
      )
      setUploadStatus('error')
    }

    setSelectedFile(null)
  }

  // ── Eliminar ────────────────────────────────────────────────────────────────

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Eliminar este inventario? Esta acción no se puede deshacer.')) return
    try {
      await deleteInventario(id)
      const updated = inventarios.filter(inv => inv.id !== id)
      setInventarios(updated)
      if (activeInventario?.id === id) setActiveInventario(null)
      showToast('Inventario eliminado', 'warning', 'fa-solid fa-trash-can')
    } catch {
      showToast('No se pudo eliminar el inventario', 'warning', 'fa-solid fa-circle-xmark')
    }
  }

  // ── Acciones de fila ────────────────────────────────────────────────────────

  const handleEdit = useCallback((row: InventarioRecord, _idx: number) => {
    setEditingRecord(row)
    setShowEditPanel(true)
  }, [])

  const handleAdd = useCallback(() => {
    setEditingRecord(null)
    setShowEditPanel(true)
  }, [])

  const handleSaveRecord = async (data: Partial<InventarioRecord>) => {
    if (!activeInventario) return
    setIsSaving(true)
    try {
      if (editingRecord && editingRecord.id) {
        // Modo Edición
        const res = await updateRecord(activeInventario.id, editingRecord.id, data)
        if (res.success) {
          showToast('Registro actualizado exitosamente', 'success', 'fa-solid fa-check')
          setShowEditPanel(false)
          setGlobalSearch(' ') 
          setTimeout(() => setGlobalSearch(''), 50)
        } else {
          showToast(res.message || 'Error al actualizar', 'error', 'fa-solid fa-xmark')
        }
      } else {
        // Modo Creación
        const res = await createRecord(activeInventario.id, data as Omit<InventarioRecord, 'id'>)
        if (res.success) {
          showToast('Registro creado exitosamente', 'success', 'fa-solid fa-check')
          setShowEditPanel(false)
          setGlobalSearch(' ')
          setTimeout(() => setGlobalSearch(''), 50)
        } else {
          showToast(res.message || 'Error al crear registro', 'error', 'fa-solid fa-xmark')
        }
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Ocurrió un error al guardar', 'error', 'fa-solid fa-xmark')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDisable = useCallback((_row: InventarioRecord, idx: number) => {
    const confirmed = window.confirm(
      `¿Inhabilitar el registro #${idx + 1}?\n\nEsta acción marcará el registro como inactivo.`
    )
    if (!confirmed) return

    showToast(
      `Registro #${idx + 1} inhabilitado — integración con backend en desarrollo`,
      'warning',
      'fa-solid fa-ban'
    )
  }, [showToast])

  // ── Handle view mode change ─────────────────────────────────────────────────

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    // Reset selected record when changing mode
    setSelectedRecord(null)
    setSelectedRowIndex(null)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="animate-fade-in">

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <h1>Inventarios</h1>
        <p>
          Importa y consulta inventarios de Bienes Muebles.
          Los datos se persisten en Supabase · Cabeceras desde Fila 3 del Excel · Datos desde Fila 4.
        </p>
      </div>

      {/* ── Layout ─────────────────────────────────────────────────── */}
      <div className="inventarios-layout" style={{ display: 'grid', gridTemplateColumns: activeInventario ? '1fr' : '290px 1fr', gap: 'var(--space-5)', alignItems: 'start', transition: 'all 0.3s ease' }}>

        {/* ── Panel izquierdo ──────────────────────────────────────── */}
        {!activeInventario && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <UploadZone
            status={uploadStatus}
            progress={progress}
            selectedFile={selectedFile}
            errorMsg={errorMsg}
            onFileSelect={handleFileSelect}
            onRetry={() => { setUploadStatus('idle'); setErrorMsg('') }}
          />

          <div className="card" style={{ padding: 0 }}>
            <div style={{
              padding: '13px 16px',
              borderBottom: '1px solid var(--color-neutral-200)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <span className="card-title" style={{ fontSize: 'var(--font-size-sm)', display: 'flex', alignItems: 'center', gap: 7 }}>
                <i className="fa-solid fa-boxes-stacked" style={{ color: 'var(--color-primary-600)' }} />
                Inventarios guardados
              </span>
              {inventarios.length > 0 && (
                <span className="badge badge-blue">{inventarios.length}</span>
              )}
            </div>

            {loadingList ? (
              <div style={{ padding: 24, textAlign: 'center' }}>
                <div className="spinner" style={{ margin: '0 auto' }} />
              </div>
            ) : (
              <InventarioList
                inventarios={inventarios}
                activeArchivo={activeArchivo}
                onSelect={(archivo) => {
                  setActiveArchivo(archivo)
                  setActiveInventario(null)
                  setSelectedRecord(null)
                  setSelectedRowIndex(null)
                }}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>
        )}

        {/* ── Panel derecho — Tabla Excel o Selección ───────────────────────────── */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {activeInventario ? (
            <>
              {/* Card header */}
              <div style={{
                padding: '13px 16px',
                borderBottom: '1px solid var(--color-neutral-200)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}>
                <button 
                  className="btn btn-sm btn-secondary" 
                  onClick={() => setActiveInventario(null)}
                  title="Volver a la selección de apartados"
                  style={{ padding: '4px 8px' }}
                >
                  <i className="fa-solid fa-arrow-left" />
                </button>
                <i className="fa-regular fa-file-excel" style={{ fontSize: 16, color: 'var(--color-success)', marginLeft: 8 }} />
                <span className="card-title" style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>
                  {activeInventario.archivo} <span style={{ opacity: 0.6 }}>/ {activeInventario.hoja}</span>
                </span>
                <div style={{ display: 'flex', gap: 5 }}>
                  <span className="badge badge-blue">
                    <i className="fa-solid fa-table-columns" />
                    {activeInventario.cabeceras.length + 2} cols
                  </span>
                  <span className="badge badge-neutral">
                    <i className="fa-solid fa-list" />
                    {activeInventario.totalRegistros.toLocaleString()} filas
                  </span>
                  <span className="badge badge-neutral" style={{ opacity: 0.75 }}>
                    {activeInventario.hoja}
                  </span>
                </div>
              </div>

              {/* Dashboard de métricas */}
              <InventarioDashboard inventarioId={activeInventario.id} />

              {/* ── View Mode Tabs (Base General / Universo / Historial de Bajas) ── */}
              <div style={{ display: !showEditPanel ? 'block' : 'none' }}>
                <ViewModeTabs
                  mode={viewMode}
                  onChange={handleViewModeChange}
                  universos={universos}
                  selectedUniverso={selectedUniverso}
                  onUniversoSelect={setSelectedUniverso}
                  loadingUniversos={loadingUniversos}
                />
              </div>

              {/* ── Historial de Bajas view ── */}
              {viewMode === 'historial-bajas' && !showEditPanel && (
                <div className="animate-fade-in">
                  <HistorialBajas inventarioId={activeInventario.id} />
                </div>
              )}

              {/* ── Toolbar (only for base-general and universo) ── */}
              {(viewMode === 'base-general' || viewMode === 'universo') && (
                <div style={{ padding: '0 16px', marginTop: '15px', display: !showEditPanel ? 'block' : 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                      <TableToolbar 
                        search={globalSearch}
                        onSearch={setGlobalSearch}
                        onOpenFilter={() => setIsFilterModalOpen(!isFilterModalOpen)}
                        onAdd={handleAdd}
                        onExport={() => showToast('Exportación de tabla en desarrollo', 'info')}
                        onOpenColumnPicker={() => setIsColumnPickerOpen(true)}
                        activeFiltersCount={Object.keys(advancedFilters).length + (viewMode === 'universo' && selectedUniverso ? 1 : 0)}
                        visibleCols={visibleCols ? visibleCols.size : activeInventario.cabeceras.length}
                        totalCols={activeInventario.cabeceras.length}
                      />
                    </div>
                    {/* Botón Expandir vista */}
                    <button
                      id="btn-expand-table"
                      title="Expandir tabla a pantalla completa (ESC para salir)"
                      onClick={() => setExpandedView(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        padding: '7px 14px',
                        background: 'var(--color-neutral-800)',
                        color: '#fff',
                        border: 'none',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                        height: 36,
                      }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-900)'}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-800)'}
                    >
                      <i className="fa-solid fa-expand" style={{ fontSize: '0.8rem' }} />
                      Expandir vista
                    </button>
                  </div>
                </div>
              )}

              {/* Panel de Filtros Avanzados */}
              {(viewMode === 'base-general' || viewMode === 'universo') && (
                <div style={{ padding: '0 16px', display: !showEditPanel ? 'block' : 'none' }}>
                  <AdvancedFilterModal 
                    isOpen={isFilterModalOpen}
                    onClose={() => setIsFilterModalOpen(false)}
                    initialFilters={advancedFilters}
                    onApply={setAdvancedFilters}
                    cabeceras={activeInventario?.cabeceras || []}
                    inventarioId={activeInventario?.id || ''}
                  />
                </div>
              )}

              {/* Tabla Excel con scroll infinito */}
              {(viewMode === 'base-general' || viewMode === 'universo') && (
                <div style={{ padding: '0 14px 14px', flex: (selectedRecord && !showEditPanel) ? '1 1 50%' : '1 1 auto', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  {showEditPanel ? (
                    <RecordEditPanel
                      record={editingRecord}
                      cabeceras={activeInventario.cabeceras}
                      inventarioId={activeInventario.id}
                      onSave={handleSaveRecord}
                      onCancel={() => setShowEditPanel(false)}
                      isSaving={isSaving}
                    />
                  ) : (
                    <VirtualTable
                      key={activeInventario.id + globalSearch + JSON.stringify(computedFilters)}
                      inventarioId={activeInventario.id}
                      cabeceras={activeInventario.cabeceras}
                      visibleCabeceras={visibleCabecerasArr}
                      totalRegistros={activeInventario.totalRegistros}
                      search={globalSearch}
                      filters={computedFilters}
                      onEdit={handleEdit}
                      onDisable={handleDisable}
                      selectedRowIndex={selectedRowIndex}
                      onRowClick={(row, idx) => {
                        setSelectedRecord(row);
                        setSelectedRowIndex(idx);
                      }}
                    />
                  )}
                </div>
              )}

              {/* Panel de Detalles del Registro Seleccionado */}
              {(selectedRecord && !showEditPanel && (viewMode === 'base-general' || viewMode === 'universo')) && (
                <div style={{ flex: '0 0 auto' }}>
                  <RecordDetailPanel 
                    record={selectedRecord} 
                    onClose={() => {
                      setSelectedRecord(null);
                      setSelectedRowIndex(null);
                    }}
                    onEdit={() => {
                      setEditingRecord(selectedRecord);
                      setShowEditPanel(true);
                    }}
                  />
                </div>
              )}
            </>
          ) : activeArchivo ? (
            /* ── Pantalla de selección de módulo ──────────────────────────── */
            <div className="animate-fade-in" style={{ padding: '32px 28px', background: '#fff', minHeight: 500 }}>

              {/* Breadcrumb */}
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fa-solid fa-box-archive" />
                Inventarios
              </div>

              {/* Título principal */}
              <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--color-neutral-900)', margin: '0 0 8px', letterSpacing: '-0.02em' }}>
                Seleccione el módulo que desea consultar
              </h2>
              <p style={{ fontSize: '0.9rem', color: 'var(--color-neutral-500)', margin: '0 0 32px', lineHeight: 1.6, maxWidth: 680 }}>
                Primero elija la naturaleza de la información que desea revisar. Cada módulo conserva la misma lógica de navegación: Base general, Universos, Vista agrupada y Vista general.
              </p>

              {/* Cards de módulos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 20 }}>
                {inventarios.filter(inv => inv.archivo === activeArchivo).map(inv => {
                  const isIntangible = inv.hoja.toLowerCase().includes('intangible');

                  // Colores según tipo
                  const accentColor  = isIntangible ? '#dc2626' : '#991b1b';
                  const iconBg       = isIntangible ? 'linear-gradient(135deg,#fecaca,#fca5a5)' : 'linear-gradient(135deg,#fecaca,#fca5a5)';
                  const iconColor    = isIntangible ? '#991b1b' : '#7f1d1d';

                  return (
                    <div
                      key={inv.id}
                      style={{
                        border: '1px solid var(--color-neutral-200)',
                        background: '#fff',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                        display: 'flex',
                        flexDirection: 'column',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.12)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
                        ;(e.currentTarget as HTMLElement).style.transform = 'translateY(0)'
                      }}
                    >
                      {/* Card header */}
                      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--color-neutral-100)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                          {/* Ícono de Excel */}
                          <div style={{
                            width: 44,
                            height: 44,
                            background: iconBg,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            fontSize: '1.2rem',
                            color: iconColor,
                          }}>
                            <i className="fa-regular fa-file-excel" />
                          </div>
                          <div style={{ flex: 1 }}>
                            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-neutral-900)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                              {isIntangible ? 'Activos Intangibles' : 'Bienes Muebles'}
                            </h3>
                            <p style={{ fontSize: '0.82rem', color: 'var(--color-neutral-500)', margin: 0, lineHeight: 1.5 }}>
                              {isIntangible
                                ? 'Consulta licencias, software, desarrollos, sistemas y demás activos intangibles en un módulo independiente, sin mezclarlos con bienes muebles.'
                                : 'Consulta la Base General de Inventarios de Bienes Muebles y su desglose por universos, con clasificación, edición, filtros, búsqueda y exportación.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats strip */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        borderBottom: '1px solid var(--color-neutral-100)',
                      }}>
                        {/* Universos */}
                        <div style={{ padding: '12px 14px', borderRight: '1px solid var(--color-neutral-100)' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            Total de Universos
                          </div>
                          <ModuleCardStats inventarioId={inv.id} />
                        </div>
                        {/* Cantidad de bienes */}
                        <div style={{ padding: '12px 14px', borderRight: '1px solid var(--color-neutral-100)' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            Total de Cantidad de Bienes
                          </div>
                          <ModuleCardStatsCantidad totalRegistros={inv.totalRegistros} />
                        </div>
                        {/* Valor total */}
                        <div style={{ padding: '12px 14px' }}>
                          <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                            Valor Total
                          </div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--color-neutral-800)', letterSpacing: '-0.01em' }}>
                            —
                          </div>
                        </div>
                      </div>


                      {/* Acciones */}
                      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: accentColor,
                            color: '#fff',
                            border: 'none',
                            padding: '9px 20px',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'background 0.15s',
                            letterSpacing: '0.01em',
                          }}
                          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = '#7f1d1d'}
                          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = accentColor}
                          onClick={() => {
                            setActiveInventario(inv)
                            setViewMode('base-general')
                            setSelectedUniverso(null)
                          }}
                        >
                          <i className="fa-solid fa-arrow-right-to-bracket" />
                          Entrar a {isIntangible ? 'Activos Intangibles' : 'Bienes Muebles'}
                        </button>

                        <button
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            background: '#fff',
                            color: 'var(--color-neutral-700)',
                            border: '1px solid var(--color-neutral-300)',
                            padding: '8px 16px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                          onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-50)'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-neutral-400)'
                          }}
                          onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = '#fff'
                            ;(e.currentTarget as HTMLElement).style.borderColor = 'var(--color-neutral-300)'
                          }}
                          onClick={() => document.getElementById('side-file-input')?.click()}
                        >
                          <i className="fa-solid fa-arrow-up-from-bracket" style={{ fontSize: '0.8rem' }} />
                          Actualizar corte Excel
                        </button>
                      </div>

                      {/* Footer del card */}
                      <div style={{
                        padding: '10px 20px',
                        background: 'var(--color-neutral-50)',
                        borderTop: '1px solid var(--color-neutral-100)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}>
                        <div style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <i className="fa-solid fa-clock" style={{ fontSize: '0.7rem', color: 'var(--color-neutral-400)' }} />
                          <strong style={{ color: 'var(--color-neutral-600)' }}>Último corte:</strong>
                          {' '}
                          {new Date(inv.fechaImportacion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--color-neutral-400)' }}>
                          {inv.hoja}
                        </span>
                      </div>

                      {/* Bottom note */}
                      <div style={{ padding: '8px 20px 14px', fontSize: '0.78rem', color: 'var(--color-primary-600)' }}>
                        {isIntangible
                          ? 'Conserva el mismo flujo completo de consulta, pero en un módulo separado.'
                          : 'Incluye Base general, Universos, Vista agrupada y Vista general en un mismo flujo.'}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Volver button */}
              <div style={{ marginTop: 28 }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveArchivo(null)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                >
                  <i className="fa-solid fa-arrow-left" /> Volver a inventarios guardados
                </button>
              </div>
            </div>

          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-table" />
              <h3>Ningún inventario seleccionado</h3>
              <p>Importa un archivo Excel o selecciona uno de la lista.</p>
            </div>
          )}
        </div>

        {/* Modal selector de columnas — fuera del ternario, siempre disponible cuando hay inventario activo */}
        {activeInventario && (
          <ColumnPickerModal
            isOpen={isColumnPickerOpen}
            onClose={() => setIsColumnPickerOpen(false)}
            cabeceras={activeInventario.cabeceras}
            visible={visibleCols ?? new Set(activeInventario.cabeceras)}
            onApply={handleApplyColumns}
          />
        )}
      </div>

      {/* ── Toast Notifications ─────────────────────────────────────── */}
      <div style={{ position: 'fixed', bottom: 28, right: 28, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {toasts.map(t => (
          <div
            key={t.id}
            className={`excel-toast excel-toast-${t.type === 'success' ? 'info' : t.type}`}
            style={t.type === 'success' ? { background: '#0c3a22', borderLeftColor: '#16a34a' } : {}}
          >
            <i className={t.icon} style={{ fontSize: 14, flexShrink: 0 }} />
            <span>{t.msg}</span>
          </div>
        ))}
      </div>

      {/* ── Vista Expandida (Pantalla Completa) ──────────────────────── */}
      {expandedView && activeInventario && (
        <div
          className="animate-fade-in"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 8000,
            background: '#fff',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header de la vista expandida */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '10px 18px',
            background: 'var(--color-neutral-900)',
            color: '#fff',
            flexShrink: 0,
            borderBottom: '2px solid var(--color-primary-600)',
          }}>
            {/* Nombre del inventario */}
            <i className="fa-regular fa-file-excel" style={{ fontSize: 16, color: '#4ade80' }} />
            <span style={{ fontWeight: 700, fontSize: '0.9rem', flex: 1 }}>
              {activeInventario.archivo}
              <span style={{ opacity: 0.5, marginLeft: 8 }}>/ {activeInventario.hoja}</span>
            </span>
            <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', marginRight: 8 }}>
              <i className="fa-solid fa-keyboard" style={{ marginRight: 5 }} />
              ESC para salir
            </span>
            {/* Filtros avanzados inline para la vista expandida */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={() => setIsFilterModalOpen(v => !v)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  background: Object.keys(computedFilters).length > 0 ? 'var(--color-primary-600)' : 'rgba(255,255,255,0.1)',
                  color: '#fff', border: 'none', padding: '6px 13px',
                  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                <i className="fa-solid fa-filter" style={{ fontSize: '0.75rem' }} />
                Filtros {Object.keys(computedFilters).length > 0 && `(${Object.keys(computedFilters).length})`}
              </button>
            </div>
            <button
              id="btn-collapse-table"
              onClick={() => setExpandedView(false)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                background: 'rgba(255,255,255,0.12)', color: '#fff',
                border: '1px solid rgba(255,255,255,0.25)',
                padding: '6px 14px', fontSize: '0.82rem', fontWeight: 600,
                cursor: 'pointer', transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.12)'}
            >
              <i className="fa-solid fa-compress" style={{ fontSize: '0.78rem' }} />
              Comprimir vista
            </button>
          </div>

          {/* Toolbar en modo expandido */}
          <div style={{
            padding: '10px 16px',
            background: 'var(--color-neutral-50)',
            borderBottom: '1px solid var(--color-neutral-200)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ flex: 1 }}>
                <TableToolbar
                  search={globalSearch}
                  onSearch={setGlobalSearch}
                  onOpenFilter={() => setIsFilterModalOpen(v => !v)}
                  onAdd={handleAdd}
                  onExport={() => showToast('Exportación de tabla en desarrollo', 'info')}
                  onOpenColumnPicker={() => setIsColumnPickerOpen(true)}
                  activeFiltersCount={Object.keys(computedFilters).length}
                  visibleCols={visibleCols ? visibleCols.size : activeInventario.cabeceras.length}
                  totalCols={activeInventario.cabeceras.length}
                />
              </div>
              {/* Info badges */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <span className="badge badge-blue" style={{ fontSize: '0.75rem' }}>
                  <i className="fa-solid fa-list" /> {activeInventario.totalRegistros.toLocaleString()} filas
                </span>
                <span className="badge badge-neutral" style={{ fontSize: '0.75rem' }}>
                  <i className="fa-solid fa-table-columns" /> {activeInventario.cabeceras.length} cols
                </span>
              </div>
            </div>
          </div>

          {/* Panel de filtros avanzados en modo expandido */}
          <div style={{ flexShrink: 0, padding: '0 16px' }}>
            <AdvancedFilterModal
              isOpen={isFilterModalOpen}
              onClose={() => setIsFilterModalOpen(false)}
              initialFilters={advancedFilters}
              onApply={setAdvancedFilters}
              cabeceras={activeInventario.cabeceras}
              inventarioId={activeInventario.id}
            />
          </div>

          {/* Tabla en modo expandido — ocupa todo el espacio restante */}
          <div style={{ flex: 1, overflow: 'hidden', padding: '10px 14px 14px', display: 'flex', flexDirection: 'column' }}>
            <VirtualTable
              key={`expanded-${activeInventario.id}-${globalSearch}-${JSON.stringify(computedFilters)}`}
              inventarioId={activeInventario.id}
              cabeceras={activeInventario.cabeceras}
              visibleCabeceras={visibleCabecerasArr}
              totalRegistros={activeInventario.totalRegistros}
              search={globalSearch}
              filters={computedFilters}
              onEdit={handleEdit}
              onDisable={handleDisable}
              selectedRowIndex={selectedRowIndex}
              onRowClick={(row, idx) => {
                setSelectedRecord(row)
                setSelectedRowIndex(idx)
              }}
            />
          </div>

          {/* Column picker en modo expandido */}
          <ColumnPickerModal
            isOpen={isColumnPickerOpen}
            onClose={() => setIsColumnPickerOpen(false)}
            cabeceras={activeInventario.cabeceras}
            visible={visibleCols ?? new Set(activeInventario.cabeceras)}
            onApply={handleApplyColumns}
          />
        </div>
      )}
    </div>
  )
}

export default Inventarios
