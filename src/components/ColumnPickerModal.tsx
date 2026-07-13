import React, { useState, useEffect, useRef, useMemo } from 'react';

// ── Grupos de columnas (compartido con VirtualTable y AdvancedFilterModal) ──────
export const COL_GROUPS: { id: string; name: string; icon: string; cols: string[]; keywords: string[] }[] = [
  {
    id: 'integracion',
    name: 'Integración de Número de Inventario',
    icon: 'fa-hashtag',
    cols: [
      'Clave CUCOP (CVE_FAMILIA)', 'Prefijo Empresa', 'Clave Tipo de Bien',
      'Entidad Federativa (CVE_Estado)', 'Año de adquisición (AA)', 'Consecutivo',
      'Número de Inventario Oficial',
    ],
    keywords: ['cucop', 'cve familia', 'prefijo empresa', 'clave tipo de bien', 'entidad federativa', 'adquisicion aa', 'inventario oficial'],
  },
  {
    id: 'descripcion',
    name: 'Descripción Técnica y Clasificación',
    icon: 'fa-tag',
    cols: [
      'Clave Artículo', 'Universo', 'Clasificación patrimonial del bien (Tipo)', 'Naturaleza del bien',
      'Categoría', 'Tipo de Bien', 'Descripción Corta del Bien', 'Descripción Larga del Bien',
      'CVE_MARCA', 'Marca', 'Modelo', 'Número de Serie', 'Número Económico',
    ],
    keywords: ['cve marca', 'clave articulo', 'universo', 'clasificacion patrimonial', 'naturaleza del bien', 'descripcion corta', 'descripcion larga', 'numero de serie', 'numero economico'],
  },
  {
    id: 'identificacion',
    name: 'Identificación del Bien',
    icon: 'fa-fingerprint',
    cols: [
      'Número de Inventario Provisional', 'Estatus del Número de Inventario', 'Tipo de Registro',
      'ID_Conjunto', 'ID_Principal_Asociado', 'Equipo Principal Asociado',
      'Observaciones de Registro', 'Estatus GRP', 'Cantidad',
    ],
    keywords: ['inventario provisional', 'id conjunto', 'id principal', 'equipo principal asociado', 'observaciones de registro', 'estatus grp'],
  },
  {
    id: 'ubicacion',
    name: 'Ubicación y Asignación',
    icon: 'fa-location-dot',
    cols: [
      'Origen del Bien Estación/Edificio', 'Estado', 'Clave de Edificio', 'Ubicación Física Actual',
      'Tramo', 'Estación / Edificio', 'Unidad Administrativa', 'CVE_NUE Coordinación/Dirección',
      'Coordinación/Dirección', 'Área', 'Nivel', 'Zona/Dirección', 'Responsable del Bien',
    ],
    keywords: ['cve nue', 'clave de edificio', 'ubicacion fisica actual', 'unidad administrativa', 'responsable del bien', 'zona direccion', 'estacion edificio'],
  },
  {
    id: 'estado',
    name: 'Estado y Control',
    icon: 'fa-shield-halved',
    cols: [
      'Número de Resguardo', 'Estatus de Etiquetado', 'Estatus de Resguardo', 'Estado Físico',
      'Estado Administrativo', 'Fecha Última Impresión Etiqueta',
      'Fecha Última Impresión Resguardo', 'Fecha Última Verificación Física',
    ],
    keywords: ['numero de resguardo', 'estatus de etiquetado', 'estatus de resguardo', 'estado fisico', 'estado administrativo', 'impresion etiqueta', 'impresion resguardo', 'verificacion fisica'],
  },
  {
    id: 'origen',
    name: 'Origen y Documentación',
    icon: 'fa-file-invoice',
    cols: [
      'Fuente de Financiamiento', 'Origen del Bien (CVE_Concepto)', 'Organismo que Entrega',
      'Número de Contrato (Documentación Soporte)', 'Fecha de Contrato', 'Clave Proveedor',
      'Proveedor', 'Número de Factura', 'Fecha de Número de Factura',
      'Fecha Acta Entrega Recepción', 'Valor Unitario', 'IVA', 'Valor Total',
      'Fecha de Alta GRP', 'Folio de Vale de Entrada',
    ],
    keywords: ['fuente de financiamiento', 'cve concepto', 'organismo que entrega', 'numero de contrato documentacion', 'clave proveedor', 'numero de factura', 'acta entrega recepcion', 'valor unitario', 'valor total', 'alta grp', 'vale de entrada'],
  },
  {
    id: 'baja',
    name: 'Estatus de Baja y Disposición Final',
    icon: 'fa-trash-can',
    cols: [
      'Estatus Patrimonial (Estatus)', 'Clave de Baja', 'Motivo de Baja',
      'Fecha de Motivo de la Baja', 'Folio Documento', 'Tipo de Documento Patrimonial',
    ],
    keywords: ['clave de baja', 'motivo de baja', 'fecha de motivo de la baja', 'folio documento', 'tipo de documento patrimonial', 'estatus patrimonial'],
  },
  {
    id: 'trazabilidad',
    name: 'Trazabilidad y Auditoría',
    icon: 'fa-clock-rotate-left',
    cols: [
      'Usuario de Captura', 'Número de Empleado', 'Última Actualización',
      'Estatus de Auditoría', 'Fecha Auditoría',
      'Año del Ejercicio Fiscal / Cuenta Pública', 'Fecha de Publicación de Cuenta Pública',
      'Observaciones',
    ],
    keywords: ['usuario de captura', 'numero de empleado', 'ultima actualizacion', 'estatus de auditoria', 'fecha auditoria', 'ejercicio fiscal', 'cuenta publica', 'observaciones'],
  },
];

// ── Normalización ─────────────────────────────────────────────────────────────
const norm = (s: string) =>
  s.toLowerCase()
   .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
   .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

function findGroupId(colName: string): string {
  const colToGroupId = new Map<string, string>();
  COL_GROUPS.forEach(g => g.cols.forEach(c => colToGroupId.set(c, g.id)));
  if (colToGroupId.has(colName)) return colToGroupId.get(colName)!;
  const normCol = norm(colName);
  for (const g of COL_GROUPS) {
    if (g.keywords.some(kw => normCol.includes(norm(kw)))) return g.id;
  }
  return '__other__';
}

// ── Props ─────────────────────────────────────────────────────────────────────
interface ColumnPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  cabeceras: string[];          // todas las columnas del inventario
  visible: Set<string>;          // columnas actualmente visibles
  onApply: (visible: Set<string>) => void;
}

const ColumnPickerModal: React.FC<ColumnPickerModalProps> = ({
  isOpen, onClose, cabeceras, visible, onApply,
}) => {
  const [localVisible, setLocalVisible] = useState<Set<string>>(new Set(visible));
  const [query, setQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(COL_GROUPS.map(g => g.id)));
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sincronizar al abrir
  useEffect(() => {
    if (isOpen) {
      setLocalVisible(new Set(visible));
      setQuery('');
    }
  }, [isOpen, visible]);

  // Cerrar con Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Construir grupos con columnas reales del inventario
  const groups = useMemo(() => {
    const otherCols: string[] = [];
    const grouped = COL_GROUPS.map(g => ({
      ...g,
      actualCols: [] as string[],
    }));
    const groupMap = new Map(grouped.map(g => [g.id, g]));

    cabeceras.forEach(col => {
      const gid = findGroupId(col);
      if (groupMap.has(gid)) {
        groupMap.get(gid)!.actualCols.push(col);
      } else {
        otherCols.push(col);
      }
    });

    const result = grouped.filter(g => g.actualCols.length > 0);
    if (otherCols.length > 0) {
      result.push({ id: '__other__', name: 'Otros campos', icon: 'fa-ellipsis', cols: [], keywords: [], actualCols: otherCols });
    }
    return result;
  }, [cabeceras]);

  // Filtrar por búsqueda
  const filteredGroups = useMemo(() => {
    if (!query.trim()) return groups;
    const q = norm(query);
    return groups
      .map(g => ({
        ...g,
        actualCols: g.actualCols.filter(c => norm(c).includes(q) || norm(g.name).includes(q)),
      }))
      .filter(g => g.actualCols.length > 0);
  }, [groups, query]);

  if (!isOpen) return null;

  const totalVisible = localVisible.size;
  const totalCols = cabeceras.length;

  const toggleCol = (col: string) => {
    setLocalVisible(prev => {
      const next = new Set(prev);
      if (next.has(col)) next.delete(col); else next.add(col);
      return next;
    });
  };

  const toggleGroup = (g: typeof groups[0], checked: boolean) => {
    setLocalVisible(prev => {
      const next = new Set(prev);
      g.actualCols.forEach(c => checked ? next.add(c) : next.delete(c));
      return next;
    });
  };

  const selectOnlyGroup = (g: typeof groups[0]) => {
    setLocalVisible(new Set(g.actualCols));
  };

  const selectAll = () => setLocalVisible(new Set(cabeceras));
  const clearAll = () => setLocalVisible(new Set());

  const handleApply = () => {
    onApply(localVisible);
    onClose();
  };

  const toggleGroupExpanded = (gid: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(gid)) next.delete(gid); else next.add(gid);
      return next;
    });
  };

  return (
    <div
      ref={overlayRef}
      onClick={e => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.45)',
        zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div style={{
        background: 'var(--color-neutral-0)',
        border: '1px solid var(--color-neutral-200)',
        boxShadow: 'var(--shadow-xl)',
        width: '820px', maxWidth: '95vw',
        maxHeight: '88vh',
        display: 'flex', flexDirection: 'column',
      }}>

        {/* ── Header ── */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div className="stat-icon blue" style={{ width: 32, height: 32, borderRadius: '50%', fontSize: 'var(--font-size-sm)' }}>
                <i className="fa-solid fa-table-columns" />
              </div>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-neutral-900)' }}>
                Elegir columnas visibles
              </h2>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
              Selecciona las columnas que deseas mostrar en la tabla. Puedes elegir campos de una o varias clasificaciones.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--color-neutral-500)', padding: '2px 6px', lineHeight: 1 }}
          >
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* ── Search + summary bar ── */}
        <div style={{ padding: '12px 24px', borderBottom: '1px solid var(--color-neutral-200)', background: 'var(--color-neutral-50)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <i className="fa-solid fa-magnifying-glass" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-neutral-400)', fontSize: 13 }} />
            <input
              type="text"
              placeholder="Buscar columna o clasificación..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px 7px 32px',
                border: '1px solid var(--color-neutral-300)',
                fontSize: 'var(--font-size-sm)', outline: 'none',
                background: '#fff', boxSizing: 'border-box',
              }}
            />
          </div>
          <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-primary-600)', whiteSpace: 'nowrap' }}>
            {totalVisible} / {totalCols} columnas seleccionadas
          </span>
          <button className="btn btn-sm btn-secondary" onClick={selectAll}>
            <i className="fa-solid fa-check-double" /> Todas
          </button>
          <button className="btn btn-sm btn-secondary" onClick={clearAll}>
            <i className="fa-solid fa-xmark" /> Ninguna
          </button>
        </div>

        {/* ── Subtitle ── */}
        <div style={{ padding: '10px 24px 6px', borderBottom: '1px solid var(--color-neutral-200)' }}>
          <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Columnas por clasificación
          </span>
          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-400)', marginLeft: 8 }}>
            Marca únicamente las columnas que necesitas ver en la tabla.
          </span>
        </div>

        {/* ── Groups list ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredGroups.map(g => {
            const isExpanded = expandedGroups.has(g.id);
            const groupSelected = g.actualCols.filter(c => localVisible.has(c)).length;
            const groupTotal = g.actualCols.length;
            const allChecked = groupSelected === groupTotal;
            const someChecked = groupSelected > 0 && groupSelected < groupTotal;

            return (
              <div key={g.id} className="card" style={{ padding: 0 }}>
                {/* Group header */}
                <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Group checkbox */}
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked; }}
                    onChange={e => toggleGroup(g, e.target.checked)}
                    style={{ width: 16, height: 16, cursor: 'pointer', accentColor: 'var(--color-primary-600)', flexShrink: 0 }}
                    title={allChecked ? 'Quitar todas las columnas de esta clasificación' : 'Seleccionar todas las columnas de esta clasificación'}
                  />
                  {/* Icon */}
                  <div className="stat-icon blue" style={{ width: 28, height: 28, borderRadius: '50%', fontSize: 11, flexShrink: 0 }}>
                    <i className={`fa-solid ${g.icon}`} />
                  </div>
                  {/* Name + counter */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-800)' }}>{g.name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: groupSelected > 0 ? 'var(--color-primary-600)' : 'var(--color-neutral-500)', fontWeight: groupSelected > 0 ? 700 : 400 }}>
                      {groupSelected}/{groupTotal} columnas seleccionadas
                    </div>
                  </div>
                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11 }}
                      onClick={() => toggleGroup(g, true)}
                    >
                      Seleccionar columnas
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      style={{ fontSize: 11 }}
                      onClick={() => toggleGroup(g, false)}
                    >
                      Quitar columnas
                    </button>
                    <button
                      className="btn btn-sm btn-primary"
                      style={{ fontSize: 11 }}
                      onClick={() => selectOnlyGroup(g)}
                    >
                      Solo esta clasificación
                    </button>
                    <button
                      onClick={() => toggleGroupExpanded(g.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-neutral-500)', padding: '4px 6px' }}
                      title={isExpanded ? 'Colapsar' : 'Expandir'}
                    >
                      <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'}`} style={{ fontSize: 12 }} />
                    </button>
                  </div>
                </div>

                {/* Columns grid */}
                {isExpanded && (
                  <div style={{ borderTop: '1px solid var(--color-neutral-100)', padding: '10px 16px' }}>
                    <div style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                      <span>Columnas para visualizar</span>
                      <span style={{ background: 'var(--color-primary-600)', color: '#fff', padding: '1px 8px', borderRadius: '50%', fontSize: 10 }}>{groupTotal}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
                      {g.actualCols.map(col => (
                        <label
                          key={col}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '7px 10px',
                            border: '1px solid var(--color-neutral-200)',
                            background: localVisible.has(col) ? 'var(--color-primary-50)' : 'var(--color-neutral-0)',
                            cursor: 'pointer',
                            transition: 'background 0.12s',
                            fontSize: 'var(--font-size-sm)',
                            color: localVisible.has(col) ? 'var(--color-primary-700)' : 'var(--color-neutral-700)',
                            fontWeight: localVisible.has(col) ? 600 : 400,
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={localVisible.has(col)}
                            onChange={() => toggleCol(col)}
                            style={{ width: 14, height: 14, accentColor: 'var(--color-primary-600)', flexShrink: 0 }}
                          />
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={col}>{col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredGroups.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-neutral-400)' }}>
              <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '2rem', marginBottom: 12 }} />
              <p style={{ margin: 0 }}>No se encontraron columnas para "{query}"</p>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-neutral-50)' }}>
          <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>
            La selección se guarda automáticamente al aplicar.
          </span>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="btn btn-primary" onClick={handleApply} disabled={localVisible.size === 0}>
              <i className="fa-solid fa-check" /> Aplicar selección ({localVisible.size})
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ColumnPickerModal;
