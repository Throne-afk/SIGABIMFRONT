import React, { useState, useEffect, useRef } from 'react';
import { fetchColumnValues } from '../api/inventario';

// Nombres exactos de las columnas del Excel (Fila 3) + keywords para match flexible
const COL_GROUPS: { id: string; name: string; cols: string[]; keywords: string[] }[] = [
  {
    id: 'integracion',
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
    keywords: ['cucop', 'prefijo empresa', 'clave tipo de bien', 'entidad federativa', 'adquisicion', 'consecutivo', 'inventario oficial'],
  },
  {
    id: 'descripcion',
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
    keywords: ['articulo', 'universo', 'clasificacion patrimonial', 'naturaleza del bien', 'categoria', 'tipo de bien', 'descripcion corta', 'descripcion larga', 'cve_marca', 'marca', 'modelo', 'numero de serie', 'numero economico'],
  },
  {
    id: 'identificacion',
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
    keywords: ['inventario provisional', 'estatus del numero de inventario', 'tipo de registro', 'id_conjunto', 'id_principal', 'equipo principal', 'observaciones de registro', 'estatus grp', 'cantidad'],
  },
  {
    id: 'ubicacion',
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
    keywords: ['cve nue', 'clave de edificio', 'ubicacion fisica actual', 'unidad administrativa', 'responsable del bien', 'zona direccion', 'estacion edificio'],
  },
  {
    id: 'estado',
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
    keywords: ['numero de resguardo', 'estatus de etiquetado', 'estatus de resguardo', 'estado fisico', 'estado administrativo', 'impresion etiqueta', 'impresion resguardo', 'verificacion fisica'],
  },
  {
    id: 'origen',
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
    keywords: ['fuente de financiamiento', 'cve concepto', 'organismo que entrega', 'numero de contrato documentacion', 'clave proveedor', 'numero de factura', 'acta entrega recepcion', 'valor unitario', 'valor total', 'alta grp', 'vale de entrada'],
  },
  {
    id: 'baja',
    name: 'Estatus de Baja, Desincorporación, Enajenación y Disposición final',
    cols: [
      'Estatus Patrimonial (Estatus)',
      'Clave de Baja',
      'Motivo de Baja',
      'Fecha de Motivo de la Baja',
      'Folio Documento',
      'Tipo de Documento Patrimonial',
    ],
    keywords: ['estatus patrimonial', 'clave de baja', 'motivo de baja', 'fecha de motivo', 'folio documento', 'tipo de documento patrimonial'],
  },
  {
    id: 'trazabilidad',
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
    keywords: ['usuario de captura', 'numero de empleado', 'ultima actualizacion', 'estatus de auditoria', 'fecha auditoria', 'ejercicio fiscal', 'publicacion de cuenta', 'observaciones'],
  },
];


interface AdvancedFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
  cabeceras: string[];
  inventarioId: string;
}

// ─── Combobox individual por columna ──────────────────────────────────────────
interface ColComboboxProps {
  col: string;
  inventarioId: string;
  value: string;
  onChange: (v: string) => void;
}

const ColCombobox: React.FC<ColComboboxProps> = ({ col, inventarioId, value, onChange }) => {
  const [inputVal, setInputVal]   = useState(value);
  const [options, setOptions]     = useState<string[]>([]);
  const [loading, setLoading]     = useState(false);
  const [open, setOpen]           = useState(false);
  const [fetched, setFetched]     = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Sincronizar inputVal con value externo (e.g. al limpiar filtros)
  useEffect(() => { setInputVal(value); }, [value]);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchOptions = async () => {
    if (fetched) return;
    setLoading(true);
    try {
      const resp = await fetchColumnValues(inventarioId, col, 200);
      if (resp.success && resp.data) setOptions(resp.data);
    } catch { /* silenciar */ }
    setLoading(false);
    setFetched(true);
  };

  const handleFocus = () => {
    setOpen(true);
    fetchOptions();
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setInputVal(v);
    onChange(v);
    setOpen(true);
    fetchOptions();
  };

  const handleSelect = (opt: string) => {
    setInputVal(opt);
    onChange(opt);
    setOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setInputVal('');
    onChange('');
    setOpen(false);
  };

  const filtered = inputVal
    ? options.filter(o => o.toLowerCase().includes(inputVal.toLowerCase()))
    : options;

  const hasValue = !!inputVal;

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <label style={{
        display: 'block', fontSize: '0.72rem', fontWeight: 700,
        color: hasValue ? 'var(--color-primary-600)' : 'var(--color-neutral-500)',
        textTransform: 'uppercase', marginBottom: 6,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        letterSpacing: '0.04em'
      }} title={col}>
        {col}
      </label>

      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <input
          type="text"
          placeholder="Escribe o selecciona..."
          value={inputVal}
          onFocus={handleFocus}
          onChange={handleInput}
          style={{
            width: '100%',
            padding: hasValue ? '9px 56px 9px 12px' : '9px 36px 9px 12px',
            borderRadius: 'var(--radius-md)',
            border: hasValue
              ? '2px solid var(--color-primary-400)'
              : '1px solid var(--color-neutral-300)',
            fontSize: '0.88rem',
            background: hasValue ? 'var(--color-primary-50)' : '#fff',
            outline: 'none',
            transition: 'border 0.15s, background 0.15s',
            boxSizing: 'border-box'
          }}
        />
        {hasValue && (
          <button
            onClick={handleClear}
            style={{
              position: 'absolute', right: 32, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-primary-500)', padding: '0 4px', lineHeight: 1
            }}
            title="Limpiar"
          >
            <i className="fa-solid fa-xmark" style={{ fontSize: '0.8rem' }}></i>
          </button>
        )}
        <i
          className={`fa-solid ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`}
          onClick={handleFocus}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--color-neutral-400)', fontSize: '0.75rem', cursor: 'pointer'
          }}
        />
      </div>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: '#fff', border: '1px solid var(--color-neutral-200)',
          borderRadius: 'var(--radius-md)', boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
          zIndex: 9999, maxHeight: 220, overflowY: 'auto'
        }}>
          {loading ? (
            <div style={{ padding: '12px 16px', color: 'var(--color-neutral-500)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-spinner fa-spin"></i> Cargando valores...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '12px 16px', color: 'var(--color-neutral-400)', fontSize: '0.85rem' }}>
              {options.length === 0 ? 'Sin datos disponibles' : 'Sin coincidencias'}
            </div>
          ) : (
            <>
              {inputVal && !options.includes(inputVal) && (
                <div
                  onClick={() => handleSelect(inputVal)}
                  style={{ padding: '9px 14px', fontSize: '0.85rem', cursor: 'pointer', background: 'var(--color-primary-50)', color: 'var(--color-primary-700)', fontStyle: 'italic', borderBottom: '1px solid var(--color-neutral-100)' }}
                >
                  <i className="fa-solid fa-magnifying-glass" style={{ marginRight: 6 }}></i>
                  Buscar "{inputVal}"
                </div>
              )}
              {filtered.slice(0, 150).map(opt => (
                <div
                  key={opt}
                  onClick={() => handleSelect(opt)}
                  style={{
                    padding: '9px 14px', fontSize: '0.85rem', cursor: 'pointer',
                    background: opt === inputVal ? 'var(--color-primary-100)' : 'transparent',
                    color: opt === inputVal ? 'var(--color-primary-700)' : 'var(--color-neutral-700)',
                    borderBottom: '1px solid var(--color-neutral-50)',
                    transition: 'background 0.1s'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-50)')}
                  onMouseLeave={e => (e.currentTarget.style.background = opt === inputVal ? 'var(--color-primary-100)' : 'transparent')}
                >
                  {opt === inputVal && <i className="fa-solid fa-check" style={{ marginRight: 8, fontSize: '0.75rem', color: 'var(--color-primary-500)' }}></i>}
                  {opt}
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Modal principal ───────────────────────────────────────────────────────────
const AdvancedFilterModal: React.FC<AdvancedFilterModalProps> = ({
  isOpen,
  onClose,
  initialFilters,
  onApply,
  cabeceras,
  inventarioId
}) => {
  const [activeGroup, setActiveGroup] = useState<string>(COL_GROUPS[0].id);
  const [localFilters, setLocalFilters] = useState<Record<string, string>>({});

  // Construir grupos mapeados dinámicamente con las cabeceras reales
  const [mappedGroups, setMappedGroups] = useState(COL_GROUPS.map(g => ({ ...g, actualCols: [] as string[] })));

  useEffect(() => {
    // Match exacto primero, luego por keywords
    const colToGroupId = new Map<string, string>();
    COL_GROUPS.forEach(g => g.cols.forEach(c => colToGroupId.set(c, g.id)));

    const norm = (s: string) =>
      s.toLowerCase()
       .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
       .replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();

    const findGroupId = (colName: string): string => {
      if (colToGroupId.has(colName)) return colToGroupId.get(colName)!;
      const normCol = norm(colName);
      for (const g of COL_GROUPS) {
        if (g.keywords.some(kw => normCol.includes(norm(kw)))) return g.id;
      }
      return '__general__';
    };

    const newGroups = COL_GROUPS.map(g => {
      const actualCols = cabeceras.filter(colName => findGroupId(colName) === g.id);
      return { ...g, actualCols };
    });
    setMappedGroups(newGroups);
  }, [cabeceras]);

  useEffect(() => {
    if (isOpen) {
      setLocalFilters(initialFilters);
    }
  }, [isOpen, initialFilters]);

  if (!isOpen) return null;

  const handleFilterChange = (colName: string, value: string) => {
    setLocalFilters(prev => {
      const next = { ...prev };
      if (!value) delete next[colName];
      else next[colName] = value;
      
      // Aplicar filtro inmediatamente (búsqueda en toda la base de datos)
      onApply(next);
      return next;
    });
  };

  const handleClear = () => { setLocalFilters({}); onApply({}); onClose(); };

  const activeGroupData = mappedGroups.find(g => g.id === activeGroup);
  const totalActiveFilters = Object.keys(localFilters).length;

  return (
    <div 
      className="advanced-filter-panel" 
      style={{ 
        background: '#fff', 
        borderRadius: 'var(--radius-lg, 12px)', 
        border: '1px solid var(--color-neutral-300)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        width: '100%', 
        marginBottom: '20px',
        maxHeight: '600px'
      }}
    >

        {/* HEADER */}
        <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
              <i className="fa-solid fa-sliders" style={{ color: 'var(--color-primary-500)' }}></i>
              Filtros avanzados
              {totalActiveFilters > 0 && (
                <span style={{ background: 'var(--color-primary-500)', color: '#fff', borderRadius: 20, padding: '2px 10px', fontSize: '0.78rem', fontWeight: 700 }}>
                  {totalActiveFilters} activos
                </span>
              )}
            </h2>
            <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--color-neutral-500)' }}>
              La tabla se actualizará automáticamente al seleccionar cualquier valor (buscando en toda la base de datos).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button className="btn btn-secondary" onClick={handleClear} style={{ fontSize: '0.85rem' }}>
              <i className="fa-solid fa-broom" style={{ marginRight: 6 }}></i>Limpiar todo
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.1rem', cursor: 'pointer', color: 'var(--color-neutral-500)', padding: '4px 8px' }}>
              <i className="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        {/* BODY */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* SIDEBAR */}
          <div style={{ width: '260px', minWidth: 260, borderRight: '1px solid var(--color-neutral-200)', overflowY: 'auto', background: 'var(--color-neutral-50)' }}>
            <div style={{ padding: '12px 14px 6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Clasificaciones
            </div>
            {mappedGroups.map(group => {
              const isActive = activeGroup === group.id;
              const activeCount = group.actualCols.filter(c => localFilters[c]).length;

              return (
                <div
                  key={group.id}
                  onClick={() => setActiveGroup(group.id)}
                  style={{
                    padding: '11px 14px',
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'pointer',
                    background: isActive ? 'var(--color-primary-50)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--color-primary-500)' : '3px solid transparent',
                    borderBottom: '1px solid var(--color-neutral-100)',
                    transition: 'all 0.15s'
                  }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: isActive ? 'var(--color-primary-100)' : '#fff',
                    border: `1px solid ${isActive ? 'var(--color-primary-300)' : 'var(--color-neutral-200)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isActive ? 'var(--color-primary-600)' : 'var(--color-neutral-400)'
                  }}>
                    <i className="fa-solid fa-list-ul" style={{ fontSize: '0.7rem' }}></i>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: isActive ? 700 : 500, color: isActive ? 'var(--color-primary-700)' : 'var(--color-neutral-700)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {group.name}
                    </div>
                    <div style={{ fontSize: '0.68rem', marginTop: 1, color: activeCount > 0 ? 'var(--color-primary-600)' : 'var(--color-neutral-400)', fontWeight: activeCount > 0 ? 700 : 400 }}>
                      {activeCount > 0 ? `${activeCount} filtro${activeCount > 1 ? 's' : ''} activo${activeCount > 1 ? 's' : ''}` : `${group.actualCols.length} columnas`}
                    </div>
                  </div>
                  {activeCount > 0 && (
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary-500)', flexShrink: 0 }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* MAIN FORM AREA */}
          <div style={{ flex: 1, padding: '20px 28px', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.1rem', color: 'var(--color-neutral-800)' }}>
              {activeGroupData?.name}
            </h3>
            <p style={{ margin: '0 0 20px 0', fontSize: '0.82rem', color: 'var(--color-neutral-500)' }}>
              Haz clic en un campo para ver los valores disponibles en la base de datos. Puedes escribir para buscar.
            </p>

            {activeGroupData?.actualCols.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-neutral-400)' }}>
                <i className="fa-solid fa-circle-info" style={{ fontSize: '2rem', marginBottom: 12 }}></i>
                <p style={{ margin: 0 }}>No hay columnas detectadas para esta clasificación en el inventario actual.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px 28px' }}>
                {activeGroupData?.actualCols.map(col => (
                  <ColCombobox
                    key={col}
                    col={col}
                    inventarioId={inventarioId}
                    value={localFilters[col] || ''}
                    onChange={v => handleFilterChange(col, v)}
                  />
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
  );
};


export default AdvancedFilterModal;


