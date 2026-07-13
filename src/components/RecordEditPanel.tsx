import React, { useState, useEffect } from 'react';
import { CellValue, InventarioRecord } from '../api/inventario';

// Reutilizamos los grupos de columnas para el layout
const COL_GROUPS = [
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
  },
  {
    id: 'baja',
    name: 'Estatus de Baja, Desincorporación y Disposición final',
    cols: [
      'Estatus Patrimonial (Estatus)',
      'Clave de Baja',
      'Motivo de Baja',
      'Fecha de Motivo de la Baja',
      'Folio Documento',
      'Tipo de Documento Patrimonial',
    ],
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
  },
];

interface RecordEditPanelProps {
  record?: InventarioRecord | null;
  cabeceras: string[];
  inventarioId: string;
  onSave: (data: Partial<InventarioRecord>) => void;
  onCancel: () => void;
  isSaving?: boolean;
}

const RecordEditPanel: React.FC<RecordEditPanelProps> = ({
  record,
  cabeceras,
  onSave,
  onCancel,
  isSaving = false,
}) => {
  const isEditing = !!record?.id;
  const [formData, setFormData] = useState<Record<string, CellValue>>({});
  const [activeGroup, setActiveGroup] = useState<string>(COL_GROUPS[0].id);

  // Inicializar formData
  useEffect(() => {
    if (record) {
      setFormData(record.datos || {});
    } else {
      setFormData({});
    }
  }, [record]);

  // Autocompletar Número de Inventario Oficial en vivo
  useEffect(() => {
    const cucop = formData['Clave CUCOP (CVE_FAMILIA)'] || '';
    const prefijo = formData['Prefijo Empresa'] || '';
    const tipo = formData['Clave Tipo de Bien'] || '';
    const entidad = formData['Entidad Federativa (CVE_Estado)'] || '';
    const anio = formData['Año de adquisición (AA)'] || '';
    const cons = formData['Consecutivo'] || '';

    // Solo si hay algún dato clave, intentamos formarlo para mostrar el previo
    if (cucop || prefijo || tipo || entidad || anio || cons) {
      const numOficial = `${cucop}${prefijo}${tipo}${entidad}${anio}${cons}`.toUpperCase().trim();
      if (formData['Número de Inventario Oficial'] !== numOficial) {
        setFormData(prev => ({ ...prev, 'Número de Inventario Oficial': numOficial }));
      }
    }
  }, [
    formData['Clave CUCOP (CVE_FAMILIA)'],
    formData['Prefijo Empresa'],
    formData['Clave Tipo de Bien'],
    formData['Entidad Federativa (CVE_Estado)'],
    formData['Año de adquisición (AA)'],
    formData['Consecutivo']
  ]);

  const handleChange = (col: string, val: string) => {
    setFormData(prev => ({ ...prev, [col]: val }));
  };

  const handleSave = () => {
    // Si la Categoría y Sección están en el form, las extraemos
    const seccion = formData['Sección'] || record?.seccion || null;
    const categoria = formData['Categoría'] || record?.categoria || null;
    onSave({ seccion, categoria, datos: formData });
  };

  // Filtrar grupos que realmente tienen columnas presentes en las cabeceras del inventario
  const mappedGroups = COL_GROUPS.map(g => {
    const activeCols = g.cols.filter(c => cabeceras.includes(c));
    return { ...g, activeCols };
  }).filter(g => g.activeCols.length > 0);

  const activeGroupData = mappedGroups.find(g => g.id === activeGroup);

  return (
    <div 
      className="record-edit-panel animate-fade-in" 
      style={{ 
        background: '#fff', 
        borderRadius: 'var(--radius-lg, 12px)', 
        border: '1px solid var(--color-neutral-300)',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden',
        width: '100%', 
        height: '600px',
        marginBottom: '20px'
      }}
    >

      {/* HEADER */}
      <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <i className={`fa-solid ${isEditing ? 'fa-pen-to-square' : 'fa-circle-plus'}`} style={{ color: 'var(--color-primary-500)' }}></i>
            {isEditing ? 'Editar Registro' : 'Agregar Nuevo Bien'}
          </h2>
          <p style={{ margin: '3px 0 0', fontSize: '0.85rem', color: 'var(--color-neutral-500)' }}>
            {isEditing 
              ? 'Modifica los datos del registro seleccionado.'
              : 'Completa los campos. El Número de Inventario Oficial se genera automáticamente.'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-secondary" onClick={onCancel} style={{ fontSize: '0.85rem' }} disabled={isSaving}>
            <i className="fa-solid fa-xmark" style={{ marginRight: 6 }}></i>Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave} style={{ fontSize: '0.85rem' }} disabled={isSaving}>
            {isSaving ? <i className="fa-solid fa-circle-notch fa-spin" style={{ marginRight: 6 }}></i> : <i className="fa-solid fa-save" style={{ marginRight: 6 }}></i>}
            Guardar Cambios
          </button>
        </div>
      </div>

      {/* BODY */}
      <div className="flex-col-mobile" style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* SIDEBAR */}
        <div className="filter-sidebar" style={{ borderRight: '1px solid var(--color-neutral-200)', overflowY: 'auto', background: 'var(--color-neutral-50)' }}>
          <div style={{ padding: '12px 14px 6px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Categorías de Información
          </div>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {mappedGroups.map(g => {
              const isActive = activeGroup === g.id;
              // Contar cuántos campos tienen valor en este grupo
              const filledCount = g.activeCols.filter(col => {
                const val = formData[col];
                return val !== undefined && val !== null && String(val).trim() !== '';
              }).length;

              return (
                <li key={g.id}>
                  <button
                    onClick={() => setActiveGroup(g.id)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      background: isActive ? 'var(--color-primary-100)' : 'transparent',
                      color: isActive ? 'var(--color-primary-800)' : 'var(--color-neutral-700)',
                      border: 'none',
                      borderLeft: isActive ? '4px solid var(--color-primary-600)' : '4px solid transparent',
                      fontWeight: isActive ? 600 : 500,
                      cursor: 'pointer',
                      fontSize: '0.85rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = 'var(--color-neutral-100)'; }}
                    onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
                  >
                    <span style={{ maxWidth: 180, lineHeight: 1.3 }}>{g.name}</span>
                    {filledCount > 0 && (
                      <span style={{ background: isActive ? 'var(--color-primary-200)' : 'var(--color-neutral-200)', color: isActive ? 'var(--color-primary-800)' : 'var(--color-neutral-600)', padding: '2px 6px', borderRadius: 12, fontSize: '0.7rem', fontWeight: 700 }}>
                        {filledCount}
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* INPUT GRID */}
        <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#fff' }}>
          {activeGroupData && (
            <div>
              <h3 style={{ marginTop: 0, marginBottom: 20, fontSize: '1.2rem', color: 'var(--color-neutral-800)', borderBottom: '1px solid var(--color-neutral-200)', paddingBottom: 10 }}>
                {activeGroupData.name}
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {activeGroupData.activeCols.map(col => {
                  const isNumOficial = col === 'Número de Inventario Oficial';
                  const isConsecutivo = col === 'Consecutivo';
                  return (
                    <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-neutral-700)' }}>
                        {col} {isConsecutivo && !isEditing && <span style={{color: 'var(--color-info-600)', fontSize: '0.7rem'}}>(Se generará automáticamente si está vacío)</span>}
                      </label>
                      <input 
                        type="text"
                        value={String(formData[col] ?? '')}
                        onChange={(e) => handleChange(col, e.target.value)}
                        disabled={isNumOficial}
                        style={{
                          padding: '8px 12px',
                          border: '1px solid var(--color-neutral-300)',
                          borderRadius: '6px',
                          fontSize: '0.9rem',
                          background: isNumOficial ? 'var(--color-neutral-100)' : '#fff',
                          color: isNumOficial ? 'var(--color-neutral-600)' : '#000',
                          fontWeight: isNumOficial ? 600 : 400
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RecordEditPanel;
