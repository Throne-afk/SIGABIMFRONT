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
  /** Búsqueda global */
  search?: string
  /** Filtros avanzados (columna -> valor) */
  filters?: Record<string, string>
  /** Total de registros en la base de datos */
  totalRegistros: number
  /** Callback al presionar el ícono de editar (fa-pen) */
  onEdit?: (row: InventarioRecord, rowIndex: number) => void
  /** Callback al presionar el ícono de inhabilitar (fa-ban) */
  onDisable?: (row: InventarioRecord, rowIndex: number) => void
  /** Fila actualmente seleccionada */
  selectedRowIndex?: number | null
  /** Callback al hacer clic en una fila */
  onRowClick?: (row: InventarioRecord, rowIndex: number) => void
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

// ─── Grupos de columnas ────────────────────────────────────────────────────────
// cols     : nombres EXACTOS del Excel — match prioritario
// keywords : frases Únicas (sin ambigüedad entre grupos) para cuando el exact falla
//            Cada keyword SOLO aparece en UN grupo.
const COL_GROUPS: { name: string; cols: string[]; keywords: string[] }[] = [
  {
    name: 'Integración de Número de Inventario',
    cols: [
      'Clave CUCOP (CVE_FAMILIA)',
      'Prefijo Empresa',
      'Clave Tipo de Bien',
      'Entidad Federativa (CVE_Estado)',
      'Año de adquisición (AA)',
      'Consecutivo',
      'Número de Inventario Oficial',
    ],
    // keywords exclusivos del grupo (cucop, prefijo, cve_familia, inventario oficial)
    keywords: ['cucop', 'cve familia', 'prefijo empresa', 'clave tipo de bien', 'entidad federativa', 'adquisicion aa', 'inventario oficial'],
  },
  {
    name: 'Descripción Técnica y Clasificación',
    cols: [
      'Clave Artículo',
      'Universo',
      'Clasificación patrimonial del bien (Tipo)',
      'Naturaleza del bien',
      'Categoría',
      'Tipo de Bien',
      'Descripción Corta del Bien',
      'Descripción Larga del Bien',
      'CVE_MARCA',
      'Marca',
      'Modelo',
      'Número de Serie',
      'Número Económico',
    ],
    // keywords exclusivos: clasificacion patrimonial, descripcion corta/larga, cve_marca, numero de serie, numero economico
    keywords: ['cve marca', 'clave articulo', 'universo', 'clasificacion patrimonial', 'naturaleza del bien', 'descripcion corta', 'descripcion larga', 'numero de serie', 'numero economico'],
  },
  {
    name: 'Identificación del Bien',
    cols: [
      'Número de Inventario Provisional',
      'Estatus del Número de Inventario',
      'Tipo de Registro',
      'ID_Conjunto',
      'ID_Principal_Asociado',
      'Equipo Principal Asociado',
      'Observaciones de Registro',
      'Estatus GRP',
      'Cantidad',
    ],
    // keywords exclusivos: id_conjunto, id_principal, estatus grp, inventario provisional
    keywords: ['inventario provisional', 'id conjunto', 'id principal', 'equipo principal asociado', 'observaciones de registro', 'estatus grp'],
  },
  {
    name: 'Ubicación y Asignación',
    cols: [
      'Origen del Bien Estación/Edificio',
      'Estado',
      'Clave de Edificio',
      'Ubicación Física Actual',
      'Tramo',
      'Estación / Edificio',
      'Unidad Administrativa',
      'CVE_NUE Coordinación/Dirección',
      'Coordinación/Dirección',
      'Área',
      'Nivel',
      'Zona/Dirección',
      'Responsable del Bien',
    ],
    // keywords SOLO de ubicacion — sin 'estado' (muy genérico), sin 'area'/'nivel'/'zona' solos
    keywords: ['cve nue', 'clave de edificio', 'ubicacion fisica actual', 'unidad administrativa', 'responsable del bien', 'zona direccion', 'estacion edificio'],
  },
  {
    name: 'Estado y Control',
    cols: [
      'Número de Resguardo',
      'Estatus de Etiquetado',
      'Estatus de Resguardo',
      'Estado Físico',
      'Estado Administrativo',
      'Fecha Última Impresión Etiqueta',
      'Fecha Última Impresión Resguardo',
      'Fecha Última Verificación Física',
    ],
    // keywords exclusivos: resguardo, etiquetado, estado fisico, estado administrativo, impresion, verificacion fisica
    keywords: ['numero de resguardo', 'estatus de etiquetado', 'estatus de resguardo', 'estado fisico', 'estado administrativo', 'impresion etiqueta', 'impresion resguardo', 'verificacion fisica'],
  },
  {
    name: 'Origen y Documentación',
    cols: [
      'Fuente de Financiamiento',
      'Origen del Bien (CVE_Concepto)',
      'Organismo que Entrega',
      'Número de Contrato (Documentación Soporte)',
      'Fecha de Contrato',
      'Clave Proveedor',
      'Proveedor',
      'Número de Factura',
      'Fecha de Número de Factura',
      'Fecha Acta Entrega Recepción',
      'Valor Unitario',
      'IVA',
      'Valor Total',
      'Fecha de Alta GRP',
      'Folio de Vale de Entrada',
    ],
    // keywords exclusivos: financiamiento, cve concepto, organismo, factura, acta entrega, valor unitario, iva, vale de entrada
    keywords: ['fuente de financiamiento', 'cve concepto', 'organismo que entrega', 'numero de contrato documentacion', 'clave proveedor', 'numero de factura', 'acta entrega recepcion', 'valor unitario', 'valor total', 'alta grp', 'vale de entrada'],
  },
  {
    name: 'Estatus de Baja, Desincorporación, Enajenación y Disposición final',
    cols: [
      'Estatus Patrimonial (Estatus)',
      'Clave de Baja',
      'Motivo de Baja',
      'Fecha de Motivo de la Baja',
      'Folio Documento',
      'Tipo de Documento Patrimonial',
    ],
    // keywords exclusivos: baja, patrimonial, motivo de baja, folio documento, desincorporacion
    keywords: ['clave de baja', 'motivo de baja', 'fecha de motivo de la baja', 'folio documento', 'tipo de documento patrimonial', 'estatus patrimonial'],
  },
  {
    name: 'Trazabilidad y Auditoría',
    cols: [
      'Usuario de Captura',
      'Número de Empleado',
      'Última Actualización',
      'Estatus de Auditoría',
      'Fecha Auditoría',
      'Año del Ejercicio Fiscal / Cuenta Pública',
      'Fecha de Publicación de Cuenta Pública',
      'Observaciones',
    ],
    // keywords exclusivos: usuario de captura, numero de empleado, auditoria, ejercicio fiscal, cuenta publica
    keywords: ['usuario de captura', 'numero de empleado', 'ultima actualizacion', 'estatus de auditoria', 'fecha auditoria', 'ejercicio fiscal', 'cuenta publica', 'observaciones'],
  },
];


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
  search,
  filters,
  onEdit,
  onDisable,
  selectedRowIndex,
  onRowClick,
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
      const resp = await fetchInventarioRows(inventarioId, pageNum, PAGE_SIZE, search, filters)
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
  }, [inventarioId, search, filters]) // eslint-disable-line react-hooks/exhaustive-deps

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

  const totalCols = cabeceras.length // Datos solamente

  // ─── Construir grupos para el encabezado ─────────────────────────────────
  //
  // Estrategia de matching (en orden de prioridad):
  //  1. Match exacto: la cabecera del Excel está listada en g.cols
  //  2. Match flexible: la cabecera normalizada contiene alguno de los keywords del grupo
  //
  // El orden del grupo al que se asigna una columna es el orden definido en COL_GROUPS,
  // pero el orden de aparición en la tabla sigue el orden de 'cabeceras' (del Excel).

  // Mapa rápido para match exacto
  const colToGroupName = new Map<string, string>();
  COL_GROUPS.forEach(g => g.cols.forEach(c => colToGroupName.set(c, g.name)));

  // Función de normalización: minúsculas, sin acentos, sin símbolos
  const norm = (s: string) =>
    s.toLowerCase()
     .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // quitar acentos
     .replace(/[^a-z0-9]/g, ' ')                       // sólo alfanumérico + espacios
     .replace(/\s+/g, ' ').trim();

  const findGroup = (colName: string): string => {
    // 1. Match exacto
    if (colToGroupName.has(colName)) return colToGroupName.get(colName)!;
    // 2. Match flexible por keywords
    const normCol = norm(colName);
    for (const g of COL_GROUPS) {
      if (g.keywords.some(kw => normCol.includes(norm(kw)))) return g.name;
    }
    return 'General';
  };

  const mappedGroups: { name: string, span: number }[] = [];
  let currentGroup: string | null = null;
  let spanCount = 0;

  cabeceras.forEach((colName) => {
    const group = findGroup(colName);
    if (group === currentGroup) {
      spanCount++;
    } else {
      if (currentGroup !== null) mappedGroups.push({ name: currentGroup, span: spanCount });
      currentGroup = group;
      spanCount = 1;
    }
  });
  if (currentGroup !== null) mappedGroups.push({ name: currentGroup, span: spanCount });

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
          <strong>{totalCols}</strong> columnas
          {' (Fila 1: Grupos · Fila 2: Encabezados · Fila 3+: Datos)'}
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
        style={{ position: 'relative' }}
      >
        
        {/* Overlay de búsqueda principal (cuando rows.length === 0 y está cargando) */}
        {loading && rows.length === 0 && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '1px solid var(--color-primary-200)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '24px 32px',
            borderRadius: '16px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
            zIndex: 30,
            maxWidth: 320,
            textAlign: 'center'
          }}>
            <i className="fa-solid fa-circle-notch fa-spin" style={{ fontSize: '2.5rem', color: 'var(--color-primary-600)' }}></i>
            <div>
              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: 'var(--color-primary-900)', fontWeight: 800 }}>Buscando coincidencias</h3>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-neutral-600)', lineHeight: 1.4 }}>Explorando todos los registros de la base de datos. Por favor, espere un momento...</p>
            </div>
          </div>
        )}

        <table className="excel-table">
          <colgroup>
            {/* Acciones */}
            <col style={{ width: 80 }} />
            {/* # */}
            <col style={{ width: 52 }} />
            {/* Columnas de datos */}
            {cabeceras.map((_, i) => (
              <col key={i} style={{ minWidth: 150 }} />
            ))}
          </colgroup>

          {/* ── thead ────────────────────────────────────────────────── */}
          <thead>
            {/* Fila 1: Grupos */}
            <tr>
              <th className="excel-th excel-th-actions" rowSpan={2} title="Acciones de fila" style={{ zIndex: 30, background: '#fff' }}>
                <i className="fa-solid fa-table-cells" style={{ fontSize: 11, opacity: 0.7 }} />
              </th>
              <th className="excel-th excel-th-num" rowSpan={2} style={{ zIndex: 20, background: '#fff', borderRight: '1px solid var(--color-neutral-300)' }}>#</th>
              
              {mappedGroups.map((g, i) => (
                <th key={`g-${i}`} colSpan={g.span} className="excel-th-group" style={{ background: 'var(--color-neutral-800)', borderColor: 'var(--color-neutral-900)', color: '#fff' }}>
                  {g.name}
                </th>
              ))}
            </tr>
            {/* Fila 2: Cabeceras */}
            <tr>
              {cabeceras.map((h, i) => (
                <th key={`h-${i}`} className="excel-th-sub" title={h} style={{ background: 'var(--color-neutral-700)', borderColor: 'var(--color-neutral-800)', borderBottom: '2px solid var(--color-neutral-900)', color: '#fff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{h}</span>
                    <i className="fa-solid fa-caret-down" style={{ opacity: 0.7, fontSize: 12, marginLeft: 6 }} />
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* ── tbody ────────────────────────────────────────────────── */}
          <tbody>

            {/* Filas de datos cargadas */}
            {rows.map((row, idx) => {
              const isEven = idx % 2 === 0
              const isSelected = selectedRowIndex === idx
              const dataBg    = isSelected ? '#f1f5f9' : (isEven ? BG_EVEN : BG_ODD)
              const actionsBg = isSelected ? '#e2e8f0' : (isEven ? BG_ACTIONS_EVEN : BG_ACTIONS_ODD)

              return (
                <tr
                  key={`r-${idx}`}
                  className={isEven ? 'excel-tr-even' : 'excel-tr-odd'}
                  style={isSelected ? { boxShadow: 'inset 4px 0 0 var(--color-primary-600)', position: 'relative', zIndex: 10 } : { cursor: 'pointer' }}
                  onClick={() => onRowClick?.(row, idx)}
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

                  {/* Columnas de datos */}
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
                    {Array.from({ length: cabeceras.length }).map((_, j) => (
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
