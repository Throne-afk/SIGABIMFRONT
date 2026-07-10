import React, { useState, useCallback, useEffect } from 'react'
import {
  uploadInventarioExcel,
  fetchInventarios,
  deleteInventario,
  type ParseResult,
  type InventarioRecord,
} from '../api/inventario'
import VirtualTable from '../components/VirtualTable'

// ─── Tipos ─────────────────────────────────────────────────────────────────────

type UploadStatus = 'idle' | 'uploading' | 'processing' | 'error'

interface Toast {
  id: number
  msg: string
  type: 'info' | 'warning' | 'success'
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
  activeId: string | null
  onSelect: (inv: ParseResult) => void
  onDelete: (id: string) => void
}> = ({ inventarios, activeId, onSelect, onDelete }) => {
  if (inventarios.length === 0) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-8)' }}>
        <i className="fa-solid fa-inbox" />
        <h3>Sin inventarios</h3>
        <p>Importa un Excel para comenzar.</p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {inventarios.map((inv, idx) => (
        <div
          key={inv.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '10px 14px',
            borderBottom: idx < inventarios.length - 1 ? '1px solid var(--color-neutral-100)' : 'none',
            background: activeId === inv.id ? 'var(--color-primary-50)' : '#fff',
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
          onClick={() => onSelect(inv)}
          onMouseEnter={e => { if (activeId !== inv.id) (e.currentTarget as HTMLElement).style.background = 'var(--color-neutral-50)' }}
          onMouseLeave={e => { if (activeId !== inv.id) (e.currentTarget as HTMLElement).style.background = '#fff' }}
        >
          <i
            className="fa-regular fa-file-excel"
            style={{ fontSize: 19, color: activeId === inv.id ? 'var(--color-primary-600)' : 'var(--color-success)', flexShrink: 0 }}
          />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {inv.archivo}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-neutral-500)', marginTop: 2 }}>
              {new Date(inv.fechaImportacion).toLocaleString('es-MX')}
              {' · '}
              <span className="badge badge-blue" style={{ fontSize: 10, padding: '1px 5px' }}>
                {inv.totalRegistros.toLocaleString()} reg.
              </span>
              {' · '}<span style={{ opacity: 0.7 }}>{inv.hoja}</span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-danger"
            id={`btn-delete-${inv.id}`}
            title="Eliminar inventario"
            onClick={e => { e.stopPropagation(); onDelete(inv.id) }}
          >
            <i className="fa-regular fa-trash-can" />
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

const Inventarios: React.FC = () => {
  const [inventarios, setInventarios]         = useState<ParseResult[]>([])
  const [activeInventario, setActiveInventario] = useState<ParseResult | null>(null)
  const [uploadStatus, setUploadStatus]       = useState<UploadStatus>('idle')
  const [progress, setProgress]               = useState(0)
  const [errorMsg, setErrorMsg]               = useState('')
  const [selectedFile, setSelectedFile]       = useState<File | null>(null)
  const [loadingList, setLoadingList]         = useState(true)

  const { toasts, show: showToast } = useToast()

  // ── Cargar inventarios ──────────────────────────────────────────────────────

  useEffect(() => { loadInventarios() }, [])

  const loadInventarios = async () => {
    setLoadingList(true)
    try {
      const resp = await fetchInventarios()
      if (resp.success && resp.data) {
        setInventarios(resp.data)
        if (resp.data.length > 0) {
          setActiveInventario(current => current ?? resp.data![0])
        }
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
        setInventarios(prev => [response.data!, ...prev])
        setActiveInventario(response.data)
        setUploadStatus('idle')
        showToast(
          `${response.data.totalRegistros.toLocaleString()} registros importados correctamente`,
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
      if (activeInventario?.id === id) setActiveInventario(updated[0] ?? null)
      showToast('Inventario eliminado', 'warning', 'fa-solid fa-trash-can')
    } catch {
      showToast('No se pudo eliminar el inventario', 'warning', 'fa-solid fa-circle-xmark')
    }
  }

  // ── Acciones de fila ────────────────────────────────────────────────────────

  /**
   * Editar registro — muestra un toast informativo.
   * TODO: Abrir modal de edición con formulario dinámico.
   */
  const handleEdit = useCallback((_row: InventarioRecord, idx: number) => {
    showToast(
      `Editar registro #${idx + 1} — funcionalidad disponible próximamente`,
      'info',
      'fa-solid fa-pen'
    )
  }, [showToast])

  /**
   * Inhabilitar registro — muestra confirmación y toast.
   * TODO: Llamar a PATCH /api/inventarios/:invId/rows/:rowId/disable
   */
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
      <div style={{ display: 'grid', gridTemplateColumns: '290px 1fr', gap: 'var(--space-5)', alignItems: 'start' }}>

        {/* ── Panel izquierdo ──────────────────────────────────────── */}
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
                activeId={activeInventario?.id ?? null}
                onSelect={setActiveInventario}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        {/* ── Panel derecho — Tabla Excel ───────────────────────────── */}
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
                <i className="fa-regular fa-file-excel" style={{ fontSize: 16, color: 'var(--color-success)' }} />
                <span className="card-title" style={{ fontSize: 'var(--font-size-sm)', flex: 1 }}>
                  {activeInventario.archivo}
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

              {/* Tabla Excel con scroll infinito */}
              <div style={{ padding: '10px 14px 14px' }}>
                <VirtualTable
                  key={activeInventario.id}
                  inventarioId={activeInventario.id}
                  cabeceras={activeInventario.cabeceras}
                  totalRegistros={activeInventario.totalRegistros}
                  onEdit={handleEdit}
                  onDisable={handleDisable}
                />
              </div>
            </>
          ) : (
            <div className="empty-state">
              <i className="fa-solid fa-table" />
              <h3>Ningún inventario seleccionado</h3>
              <p>Importa un archivo Excel o selecciona uno de la lista.</p>
            </div>
          )}
        </div>
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
    </div>
  )
}

export default Inventarios
