import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  fetchInventarioRows,
  type InventarioRecord,
  type CellValue,
} from '../api/inventario'

// ─── Props ─────────────────────────────────────────────────────────────────────

interface VirtualTableProps {
  /** ID del inventario en Supabase */
  inventarioId: string
  /** Cabeceras extraídas de la Fila 3 del Excel */
  cabeceras: string[]
  /** Total de registros en la base de datos */
  totalRegistros: number
  /** Callback al presionar el ícono de editar (fa-pen) */
  onEdit?: (row: InventarioRecord, rowIndex: number) => void
  /** Callback al presionar el ícono de inhabilitar (fa-ban) */
  onDisable?: (row: InventarioRecord, rowIndex: number) => void
}

// ─── Constants ─────────────────────────────────────────────────────────────────

const PAGE_SIZE = 100

// Colores de fila — definidos aquí para coherencia con las clases CSS
const BG_EVEN        = '#ffffff'
const BG_ODD         = '#f2f6fb'
const BG_ACTIONS_EVEN = '#e8f0f8'
const BG_ACTIONS_ODD  = '#dde8f3'
const BG_HOVER        = '#d8eaf8'
const BG_ACTIONS_HOVER = '#c8ddf2'

// ─── Helper ────────────────────────────────────────────────────────────────────

function cellText(value: CellValue): string {
  if (value === null || value === undefined) return ''
  return String(value).trim()
}

function renderCell(value: CellValue): React.ReactNode {
  const text = cellText(value)
  if (!text) return <span className="excel-cell-empty">—</span>
  return text
}

// ─── VirtualTable ──────────────────────────────────────────────────────────────

/**
 * Tabla estilo Excel con scroll infinito (IntersectionObserver).
 *
 * Características:
 * - Columna de acciones fijada (pinned) a la izquierda
 * - Cabecera fijada (sticky) en la parte superior
 * - Bordes de grilla visibles (border-collapse: separate)
 * - Carga PAGE_SIZE filas por scroll — nunca todo el dataset en el DOM
 * - Skeleton de carga con shimmer en la primera carga
 */
const VirtualTable: React.FC<VirtualTableProps> = ({
  inventarioId,
  cabeceras,
  totalRegistros,
  onEdit,
  onDisable,
}) => {
  const [rows, setRows]     = useState<InventarioRecord[]>([])
  const [page, setPage]     = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const sentinelRef  = useRef<HTMLDivElement>(null)
  const loadingRef   = useRef(false)

  // ── Cargar página ─────────────────────────────────────────────────────────

  const loadPage = useCallback(async (pageNum: number) => {
    if (loadingRef.current) return
    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const resp = await fetchInventarioRows(inventarioId, pageNum, PAGE_SIZE)
      if (resp.success && resp.data) {
        const { registros, hasMore: more } = resp.data
        setRows(prev => pageNum === 1 ? registros : [...prev, ...registros])
        setHasMore(more)
        if (more) setPage(pageNum + 1)
      } else {
        setError('No se pudieron cargar los registros.')
        setHasMore(false)
      }
    } catch {
      setError('Error de conexión al cargar registros.')
      setHasMore(false)
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [inventarioId])

  // ── Reset al cambiar inventario ───────────────────────────────────────────

  useEffect(() => {
    setRows([])
    setPage(1)
    setHasMore(true)
    setError(null)
    loadingRef.current = false
    loadPage(1)
  }, [inventarioId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── IntersectionObserver (root = contenedor de scroll) ────────────────────

  useEffect(() => {
    const sentinel  = sentinelRef.current
    const container = containerRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadPage(page)
        }
      },
      {
        root: container,     // el contenedor con overflow:auto
        rootMargin: '150px', // pre-carga 150px antes del fondo
        threshold: 0,
      }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, page, loadPage])

  // ── Hover handlers — actualiza fondo de toda la fila sin re-render ────────

  const handleRowEnter = (e: React.MouseEvent<HTMLTableRowElement>) => {
    const tds = e.currentTarget.querySelectorAll<HTMLTableCellElement>('td')
    tds.forEach((td, i) => {
      td.style.background = i === 0 ? BG_ACTIONS_HOVER : BG_HOVER
    })
  }

  const handleRowLeave = (
    e: React.MouseEvent<HTMLTableRowElement>,
    idx: number
  ) => {
    const isEven = idx % 2 === 0
    const tds    = e.currentTarget.querySelectorAll<HTMLTableCellElement>('td')
    tds.forEach((td, i) => {
      td.style.background = i === 0
        ? (isEven ? BG_ACTIONS_EVEN : BG_ACTIONS_ODD)
        : (isEven ? BG_EVEN : BG_ODD)
    })
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  const totalCols = 2 + cabeceras.length // Sección + Categoría + datos

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>

      {/* ── Status bar ─────────────────────────────────────────────────── */}
      <div className="excel-statusbar">
        <span>
          <i
            className="fa-regular fa-file-excel"
            style={{ marginRight: 6, color: 'var(--color-primary-600)' }}
          />
          <strong>{rows.length.toLocaleString()}</strong>
          {' / '}
          <strong>{totalRegistros.toLocaleString()}</strong>
          {' registros  ·  '}
          <strong>{totalCols + 2}</strong> columnas
          {' (Cols 1-2: Sección/Categoría · Fila 3: Encabezados · Fila 4+: Datos)'}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {hasMore && !loading && (
            <span style={{ color: 'var(--color-primary-500)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fa-solid fa-angles-down" />
              Scroll ↓ para más
            </span>
          )}
          {!hasMore && rows.length > 0 && (
            <span style={{ color: 'var(--color-success)', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="fa-solid fa-circle-check" />
              Carga completa
            </span>
          )}
        </div>
      </div>

      {/* ── Error ──────────────────────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error" style={{ fontSize: 12, padding: '8px 12px', marginBottom: 2 }}>
          <i className="fa-solid fa-circle-xmark" />
          <div>
            {error}{' '}
            <button
              style={{ background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: 'inherit', fontSize: 'inherit' }}
              onClick={() => loadPage(page)}
            >
              Reintentar
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TABLA EXCEL
          - border-collapse: separate  → permite sticky + bordes visibles
          - Primera columna fijada (position:sticky left:0 z-index:5)
          - Cabecera fijada (position:sticky top:0)
          - Esquina superior-izquierda (z-index:22 — sobre ambos)
          ══════════════════════════════════════════════════════════════════ */}
      <div
        className="excel-wrapper"
        id="virtual-table-container"
        ref={containerRef}
      >
        <table className="excel-table">
          <colgroup>
            {/* Acciones */}
            <col style={{ width: 80 }} />
            {/* # */}
            <col style={{ width: 52 }} />
            {/* Sección */}
            <col style={{ minWidth: 110 }} />
            {/* Categoría */}
            <col style={{ minWidth: 120 }} />
            {/* Columnas de datos */}
            {cabeceras.map((_, i) => (
              <col key={i} style={{ minWidth: 130 }} />
            ))}
          </colgroup>

          {/* ── thead ────────────────────────────────────────────────── */}
          <thead>
            <tr>
              {/* Acciones — esquina congelada (sticky left + sticky top) */}
              <th className="excel-th excel-th-actions" title="Acciones de fila">
                <i
                  className="fa-solid fa-table-cells"
                  style={{ fontSize: 11, opacity: 0.7 }}
                />
              </th>

              {/* Número de fila */}
              <th className="excel-th excel-th-num">#</th>

              {/* Sección y Categoría (cols 1 y 2 del Excel) */}
              <th className="excel-th">Sección</th>
              <th className="excel-th">Categoría</th>

              {/* Cabeceras de datos — extraídas de la Fila 3 del Excel */}
              {cabeceras.map((h, i) => (
                <th
                  key={`h-${i}`}
                  className="excel-th"
                  title={h}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          {/* ── tbody ────────────────────────────────────────────────── */}
          <tbody>

            {/* Filas de datos cargadas */}
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0
              const dataBg    = isEven ? BG_EVEN : BG_ODD
              const actionsBg = isEven ? BG_ACTIONS_EVEN : BG_ACTIONS_ODD

              return (
                <tr
                  key={`r-${idx}`}
                  className={isEven ? 'excel-tr-even' : 'excel-tr-odd'}
                  onMouseEnter={handleRowEnter}
                  onMouseLeave={e => handleRowLeave(e, idx)}
                >
                  {/* ── Columna de acciones (fijada a la izquierda) ── */}
                  <td
                    className="excel-td excel-td-actions"
                    style={{ background: actionsBg }}
                  >
                    {/* Editar registro */}
                    <button
                      className="excel-action-btn excel-action-edit"
                      title="Editar registro"
                      id={`btn-edit-row-${idx}`}
                      onClick={() => onEdit?.(row, idx)}
                    >
                      <i className="fa-solid fa-pen" />
                    </button>

                    {/* Inhabilitar registro */}
                    <button
                      className="excel-action-btn excel-action-disable"
                      title="Inhabilitar registro"
                      id={`btn-disable-row-${idx}`}
                      onClick={() => onDisable?.(row, idx)}
                    >
                      <i className="fa-solid fa-ban" />
                    </button>
                  </td>

                  {/* Número de fila */}
                  <td
                    className="excel-td excel-td-num"
                    style={{ background: dataBg }}
                  >
                    {idx + 1}
                  </td>

                  {/* Sección (columna 1 del Excel) */}
                  <td
                    className="excel-td"
                    style={{ background: dataBg }}
                  >
                    {cellText(row.seccion)
                      ? <span className="badge badge-neutral" style={{ fontSize: 10.5 }}>{String(row.seccion)}</span>
                      : <span className="excel-cell-empty">—</span>
                    }
                  </td>

                  {/* Categoría (columna 2 del Excel) */}
                  <td
                    className="excel-td"
                    style={{ background: dataBg }}
                  >
                    {cellText(row.categoria)
                      ? <span className="badge badge-blue" style={{ fontSize: 10.5 }}>{String(row.categoria)}</span>
                      : <span className="excel-cell-empty">—</span>
                    }
                  </td>

                  {/* Columnas de datos — desde Fila 4 del Excel */}
                  {cabeceras.map((h) => (
                    <td
                      key={`${idx}-${h}`}
                      className="excel-td"
                      style={{ background: dataBg }}
                      title={cellText(row.datos[h])}
                    >
                      {renderCell(row.datos[h])}
                    </td>
                  ))}
                </tr>
              )
            })}

            {/* ── Skeleton — primera carga ─────────────────────────── */}
            {loading && rows.length === 0 &&
              Array.from({ length: 16 }).map((_, i) => {
                const isEven = i % 2 === 0
                const dataBg    = isEven ? BG_EVEN : BG_ODD
                const actionsBg = isEven ? BG_ACTIONS_EVEN : BG_ACTIONS_ODD
                return (
                  <tr key={`sk-${i}`}>
                    {/* Acciones skeleton */}
                    <td className="excel-td excel-td-actions" style={{ background: actionsBg }}>
                      <span className="excel-skel" style={{ width: 24, height: 24, display: 'inline-block', borderRadius: 3, marginRight: 4 }} />
                      <span className="excel-skel" style={{ width: 24, height: 24, display: 'inline-block', borderRadius: 3 }} />
                    </td>
                    {/* # skeleton */}
                    <td className="excel-td excel-td-num" style={{ background: dataBg }}>
                      <span className="excel-skel" style={{ width: 24, height: 12 }} />
                    </td>
                    {/* Resto de columnas */}
                    {Array.from({ length: 2 + cabeceras.length }).map((_, j) => (
                      <td key={j} className="excel-td" style={{ background: dataBg }}>
                        <span
                          className="excel-skel"
                          style={{
                            width: `${40 + ((i * 7 + j * 13) % 80)}px`,
                            height: 12,
                          }}
                        />
                      </td>
                    ))}
                  </tr>
                )
              })
            }
          </tbody>
        </table>

        {/* Sentinel — el IntersectionObserver lo observa */}
        <div ref={sentinelRef} style={{ height: 1, width: '100%' }} aria-hidden="true" />
      </div>

      {/* ── Spinner de carga de páginas siguientes ──────────────────── */}
      {loading && rows.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 9,
            padding: '9px 0',
            color: 'var(--color-neutral-500)',
            fontSize: 12.5,
            borderTop: '1px solid var(--color-neutral-100)',
          }}
        >
          <div className="spinner" style={{ width: 15, height: 15 }} />
          Cargando {PAGE_SIZE} registros más...
        </div>
      )}
    </div>
  )
}

export default VirtualTable
