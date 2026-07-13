import React, { useState } from 'react';
import { InventarioRecord } from '../api/inventario';

interface RecordDetailPanelProps {
  record: InventarioRecord;
  onClose: () => void;
}

const RecordDetailPanel: React.FC<RecordDetailPanelProps> = ({ record, onClose }) => {
  const [showValidation, setShowValidation] = useState(true);

  if (!record) return null;

  const { datos } = record;

  // Extraer valores clave para el detalle y convertirlos a string
  const getVal = (col: string) => {
    const val = datos[col];
    return (val !== null && val !== undefined && val !== '') ? String(val) : 'N/A';
  };
  
  const idOficial = getVal('Número de Inventario Oficial') !== 'N/A' ? getVal('Número de Inventario Oficial') : (getVal('Clave Artículo') !== 'N/A' ? getVal('Clave Artículo') : 'Registro Seleccionado');
  const descCorta = getVal('Descripción Corta del Bien');
  const tipoRegistro = getVal('Tipo de Registro');

  // Calcular métricas de validación
  const emptyFieldsCount = Object.values(datos).filter(v => {
    const s = String(v).trim().toUpperCase();
    return !v || s === 'N/A' || s === 'S/INF' || s === 'NULL' || s === '';
  }).length;

  const estatusGrp = String(datos['Estatus GRP'] || datos['ESTATUS GRP'] || '').toUpperCase().trim();
  const hasGrp = estatusGrp === 'REGISTRADO' || estatusGrp.includes('ALTA') || estatusGrp === 'SÍ' || estatusGrp === 'SI';
  
  const estatusAuditoria = getVal('Estatus de Auditoría');
  const estatusConciliacion = getVal('Estatus de Conciliación') !== 'N/A' ? getVal('Estatus de Conciliación') : getVal('Situación del Bien');

  const ultimaAct = getVal('Última Actualización') !== 'N/A' ? getVal('Última Actualización') : getVal('Fecha de Actualización');
  const usuario = getVal('Usuario de Captura') !== 'N/A' ? getVal('Usuario de Captura') : getVal('Usuario');
  const areaMov = getVal('Área') !== 'N/A' ? getVal('Área') : getVal('Movimiento');
  const obs = getVal('Observaciones de Registro') !== 'N/A' ? getVal('Observaciones de Registro') : getVal('Observaciones');

  return (
    <div className="record-detail-panel" style={{
      background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
      borderTop: '1px solid var(--color-primary-200)',
      padding: '24px 32px',
      boxShadow: '0 -8px 24px rgba(0,0,0,0.06)',
      position: 'relative'
    }}>
      {/* Banda decorativa superior */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--color-primary-400), var(--color-primary-600))' }}></div>

      <div className="detail-header-flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ 
              background: 'var(--color-primary-50)', 
              color: 'var(--color-primary-600)', 
              padding: '4px 10px', 
              borderRadius: 6, 
              fontSize: '0.75rem', 
              fontWeight: 700, 
              letterSpacing: '0.05em',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6
            }}>
              <i className="fa-solid fa-layer-group"></i> Detalle de Registro
            </span>
            {tipoRegistro !== 'N/A' && (
              <span style={{ fontSize: '0.85rem', color: 'var(--color-neutral-500)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="fa-solid fa-tag" style={{ opacity: 0.6 }}></i> {tipoRegistro}
              </span>
            )}
          </div>
          
          <h2 style={{ fontSize: '1.6rem', margin: '0 0 6px', color: 'var(--color-primary-900)', fontWeight: 800, letterSpacing: '-0.02em' }}>
            {idOficial}
          </h2>
          
          {descCorta !== 'N/A' && (
            <div style={{ fontSize: '1.05rem', color: 'var(--color-neutral-600)', fontWeight: 500 }}>
              {descCorta}
            </div>
          )}
        </div>
        
        <div>
          <button 
            className="btn btn-secondary" 
            onClick={onClose} 
            style={{ 
              borderRadius: 8, 
              padding: '8px 18px', 
              fontSize: '0.9rem',
              fontWeight: 600,
              boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <i className="fa-solid fa-compress"></i> Ocultar panel
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 20 }}>
        <DetailCard title="Universo" icon="fa-globe" value={getVal('Universo')} />
        <DetailCard title="Categoría" icon="fa-boxes-stacked" value={getVal('Categoría')} />
        <DetailCard title="Estación / Edificio" icon="fa-building" value={getVal('Estación / Edificio')} />
        <DetailCard title="Estatus Resguardo" icon="fa-shield-halved" value={getVal('Estatus de Resguardo')} isBadge />
        <DetailCard title="Estatus Etiquetado" icon="fa-barcode" value={getVal('Estatus de Etiquetado')} isBadge />
        <DetailCard title="Origen del Bien" icon="fa-truck-ramp-box" value={getVal('Origen del Bien (CVE_Concepto)')} />
        <DetailCard title="Valor Total" icon="fa-money-bill-wave" value={getVal('Valor Total')} isMoney />
        <DetailCard title="Estatus Auditoría" icon="fa-clipboard-check" value={getVal('Estatus de Auditoría')} isBadge errorIfEmpty />
      </div>

      {/* ── SECCIÓN: VALIDACIÓN Y TRAZABILIDAD ── */}
      <div style={{ marginTop: 32, borderTop: '1px solid var(--color-neutral-200)', paddingTop: 24 }}>

        {/* Header de sección */}
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="stat-icon blue" style={{ width: 36, height: 36, fontSize: 'var(--font-size-sm)' }}>
              <i className="fa-solid fa-shield-halved" />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: 'var(--font-size-sm)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Validación y Trazabilidad del Registro
              </div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>
                Información vinculada al mismo registro seleccionado en la tabla.
              </div>
            </div>
          </div>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setShowValidation(!showValidation)}
          >
            <i className={`fa-solid fa-chevron-${showValidation ? 'up' : 'down'}`} />
            {showValidation ? 'Ocultar validación' : 'Mostrar validación'}
          </button>
        </div>

        {showValidation && (
          <div className="animate-fade-in">

            {/* Banner de alerta */}
            <div className="alert" style={{
              background: 'var(--color-warning-light)',
              border: '1px solid var(--color-warning)',
              color: 'var(--color-warning-dark)',
              marginBottom: 16,
            }}>
              <i className="fa-solid fa-triangle-exclamation" />
              <div>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>
                  Registro con pendientes de atención
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)' }}>
                  Se recomienda revisar los puntos detectados antes de validar o cerrar el registro.
                </div>
              </div>
            </div>

            <div className="grid-cols-2" style={{ display: 'grid', gap: 14 }}>

              {/* Columna izquierda: Pendientes */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="stat-icon yellow" style={{ width: 32, height: 32, fontSize: 'var(--font-size-xs)' }}>
                    <i className="fa-solid fa-exclamation" />
                  </div>
                  <div>
                    <div className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>Pendientes detectados</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>Campos o procesos que requieren revisión.</div>
                  </div>
                </div>
                <div className="grid-cols-2" style={{ display: 'grid' }}>
                  <ValidationCard
                    title="Campos sin información"
                    desc={`Se detectaron ${emptyFieldsCount} campos con S/INF dentro del registro.`}
                    isActive={emptyFieldsCount > 0}
                  />
                  <ValidationCard
                    title="Alta GRP pendiente"
                    desc={hasGrp ? 'Registro identificado correctamente en GRP.' : 'No se identifica fecha de alta o registro formal en GRP.'}
                    isActive={!hasGrp}
                  />
                  <ValidationCard
                    title="Auditoría por revisar"
                    desc={`Estatus actual: ${estatusAuditoria}`}
                    isActive={estatusAuditoria === 'N/A'}
                  />
                  <ValidationCard
                    title="Conciliación pendiente"
                    desc={`Situación actual: ${estatusConciliacion}`}
                    isActive={estatusConciliacion === 'N/A' || estatusConciliacion.toLowerCase().includes('pendiente')}
                  />
                </div>
              </div>

              {/* Columna derecha: Trazabilidad */}
              <div className="card" style={{ padding: 0 }}>
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="stat-icon blue" style={{ width: 32, height: 32, fontSize: 'var(--font-size-xs)' }}>
                    <i className="fa-solid fa-clock-rotate-left" />
                  </div>
                  <div>
                    <div className="card-title" style={{ fontSize: 'var(--font-size-sm)' }}>Último movimiento registrado</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)' }}>Referencia de trazabilidad del registro.</div>
                  </div>
                </div>
                <div style={{ padding: '4px 0', display: 'flex', flexDirection: 'column' }}>
                  <TraceRow label="ÚLTIMA ACTUALIZACIÓN" value={ultimaAct} />
                  <TraceRow label="USUARIO DE CAPTURA"   value={usuario} />
                  <TraceRow label="ÁREA / MOVIMIENTO"    value={areaMov} />
                  <TraceRow label="OBSERVACIONES"        value={obs !== 'N/A' ? obs : 'Sin observaciones'} isLast />
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};



const ValidationCard: React.FC<{ title: string; desc: string; isActive: boolean }> = ({ title, desc, isActive }) => (
  <div style={{
    padding: '12px 14px',
    borderBottom: '1px solid var(--color-neutral-200)',
    borderRight: '1px solid var(--color-neutral-200)',
    background: isActive ? 'var(--color-warning-light)' : 'var(--color-neutral-0)',
  }}>
    <div style={{
      fontSize: 'var(--font-size-xs)',
      fontWeight: 700,
      color: isActive ? 'var(--color-warning-dark)' : 'var(--color-neutral-600)',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: '0.03em',
    }}>
      {isActive && <i className="fa-solid fa-circle-exclamation" style={{ marginRight: 5 }} />}
      {title}
    </div>
    <div style={{ fontSize: 'var(--font-size-xs)', color: isActive ? 'var(--color-warning-dark)' : 'var(--color-neutral-500)' }}>
      {desc}
    </div>
  </div>
);

const TraceRow: React.FC<{ label: string; value: string; isLast?: boolean }> = ({ label, value, isLast }) => (
  <div style={{
    display: 'flex',
    padding: '10px 16px',
    borderBottom: isLast ? 'none' : '1px solid var(--color-neutral-100)',
  }}>
    <div style={{
      width: 170,
      fontSize: 'var(--font-size-xs)',
      fontWeight: 700,
      color: 'var(--color-neutral-500)',
      textTransform: 'uppercase',
      letterSpacing: '0.04em',
      flexShrink: 0,
    }}>
      {label}
    </div>
    <div style={{ flex: 1, fontSize: 'var(--font-size-sm)', fontWeight: 500, color: 'var(--color-neutral-800)' }}>
      {value}
    </div>
  </div>
);

const DetailCard: React.FC<{ title: string, icon?: string, value: any, isBadge?: boolean, errorIfEmpty?: boolean, isMoney?: boolean }> = ({ title, icon, value, isBadge, errorIfEmpty, isMoney }) => {
  const valStr = String(value);
  const isEmpty = valStr === 'N/A' || valStr.trim() === '' || valStr.toLowerCase() === 'null';
  
  const displayValue = isMoney && !isEmpty && !isNaN(Number(valStr))
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valStr))
    : valStr;

  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--font-size-xs)', fontWeight: 600, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {icon && <i className={`fa-solid ${icon}`} style={{ color: 'var(--color-primary-500)' }}></i>}
        {title}
      </div>
      <div>
        {isBadge ? (
          <span className={`badge ${isEmpty && errorIfEmpty ? 'badge-red' : (isEmpty ? 'badge-neutral' : 'badge-yellow')}`}>
            {isEmpty && errorIfEmpty ? 'S/INF' : displayValue}
          </span>
        ) : (
          <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600, color: isEmpty ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)', wordBreak: 'break-word' }}>
            {isEmpty ? 'No especificado' : displayValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default RecordDetailPanel;

