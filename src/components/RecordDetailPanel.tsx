import React from 'react';
import { InventarioRecord } from '../api/inventario';

interface RecordDetailPanelProps {
  record: InventarioRecord;
  onClose: () => void;
}

const RecordDetailPanel: React.FC<RecordDetailPanelProps> = ({ record, onClose }) => {
  if (!record) return null;

  const { datos } = record;

  // Extraer valores clave para el detalle
  const getVal = (col: string) => datos[col] || 'N/A';
  
  const idOficial = getVal('Número de Inventario Oficial') !== 'N/A' ? getVal('Número de Inventario Oficial') : (getVal('Clave Artículo') !== 'N/A' ? getVal('Clave Artículo') : 'Registro Seleccionado');
  const descLarga = getVal('Descripción Larga del Bien');
  const tipoRegistro = getVal('Tipo de Registro');

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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
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
          
          {descLarga !== 'N/A' && (
            <div style={{ fontSize: '1.05rem', color: 'var(--color-neutral-600)', fontWeight: 500 }}>
              {descLarga}
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
    </div>
  );
};

const DetailCard: React.FC<{ title: string, icon?: string, value: any, isBadge?: boolean, errorIfEmpty?: boolean, isMoney?: boolean }> = ({ title, icon, value, isBadge, errorIfEmpty, isMoney }) => {
  const valStr = String(value);
  const isEmpty = valStr === 'N/A' || valStr.trim() === '' || valStr.toLowerCase() === 'null';
  
  const displayValue = isMoney && !isEmpty && !isNaN(Number(valStr)) 
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(valStr))
    : valStr;

  return (
    <div style={{ 
      background: '#ffffff',
      border: '1px solid var(--color-neutral-200)', 
      borderRadius: 'var(--radius-lg, 12px)', 
      padding: '16px', 
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'default'
    }}
    onMouseEnter={e => {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.06)';
      e.currentTarget.style.borderColor = 'var(--color-primary-200)';
    }}
    onMouseLeave={e => {
      e.currentTarget.style.transform = 'none';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.02)';
      e.currentTarget.style.borderColor = 'var(--color-neutral-200)';
    }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {icon && <i className={`fa-solid ${icon}`} style={{ color: 'var(--color-primary-400)', fontSize: '0.9rem' }}></i>}
        {title}
      </div>
      <div>
        {isBadge ? (
          <span className={`badge ${isEmpty && errorIfEmpty ? 'badge-error' : (isEmpty ? 'badge-neutral' : 'badge-warning')}`} style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
            {isEmpty && errorIfEmpty ? 'S/INF' : displayValue}
          </span>
        ) : (
          <span style={{ fontSize: '1rem', fontWeight: 600, color: isEmpty ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)', wordBreak: 'break-word' }}>
            {isEmpty ? 'No especificado' : displayValue}
          </span>
        )}
      </div>
    </div>
  );
};

export default RecordDetailPanel;
