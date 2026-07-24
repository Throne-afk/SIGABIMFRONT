import React, { useState } from 'react';
import { InventarioRecord } from '../api/inventario';

interface RecordDetailPanelProps {
  record: InventarioRecord;
  onClose: () => void;
  onEdit?: () => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const getVal = (datos: Record<string, any>, ...cols: string[]): string => {
  for (const col of cols) {
    const val = datos[col];
    if (val !== null && val !== undefined && String(val).trim() !== '' && String(val).trim().toUpperCase() !== 'NULL') {
      return String(val).trim();
    }
  }
  return 'S/INF';
};

// ─── StatusChip ───────────────────────────────────────────────────────────────

type ChipVariant = 'danger' | 'warning' | 'success' | 'neutral' | 'blue' | 'purple';

const statusChip = (label: string): { text: string; variant: ChipVariant } => {
  const l = label.toLowerCase();
  if (l.includes('pendiente') || l.includes('alta pendiente')) return { text: label, variant: 'danger' };
  if (l.includes('conciliaci') || l.includes('proceso') || l.includes('revisar') || l.includes('seguimiento')) return { text: label, variant: 'warning' };
  if (l.includes('correcto') || l.includes('activo') || l.includes('registrado') || l.includes('buen estado')) return { text: label, variant: 'success' };
  if (l.includes('sin resguardo') || l.includes('s/inf')) return { text: label, variant: 'neutral' };
  if (l.includes('etiquetado') || l.includes('conciliacion')) return { text: label, variant: 'purple' };
  return { text: label, variant: 'blue' };
};

const chipStyles: Record<ChipVariant, React.CSSProperties> = {
  danger:  { background: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' },
  warning: { background: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
  success: { background: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
  neutral: { background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1' },
  blue:    { background: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
  purple:  { background: '#ede9fe', color: '#6d28d9', border: '1px solid #c4b5fd' },
};

const chipIconMap: Record<ChipVariant, string> = {
  danger:  'fa-solid fa-circle-exclamation',
  warning: 'fa-solid fa-circle-dot',
  success: 'fa-solid fa-circle-check',
  neutral: 'fa-solid fa-circle-minus',
  blue:    'fa-solid fa-circle-info',
  purple:  'fa-solid fa-diamond',
};

const StatusChip: React.FC<{ label: string }> = ({ label }) => {
  if (!label || label === 'S/INF') {
    return (
      <span style={{ ...chipStyles.neutral, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600 }}>
        <i className="fa-solid fa-circle-minus" style={{ fontSize: '0.65rem' }} />
        S/INF
      </span>
    );
  }
  const { text, variant } = statusChip(label);
  return (
    <span style={{ ...chipStyles[variant], display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 600 }}>
      <i className={chipIconMap[variant]} style={{ fontSize: '0.65rem' }} />
      {text}
    </span>
  );
};

// ─── FieldRow ─────────────────────────────────────────────────────────────────

const FieldRow: React.FC<{ icon: string; label: string; value: string; isChip?: boolean; iconColor?: string }> = ({
  icon, label, value, isChip, iconColor
}) => (
  <div style={{
    display: 'flex',
    alignItems: 'flex-start',
    padding: '10px 0',
    borderBottom: '1px solid var(--color-neutral-100)',
    gap: 10,
    minHeight: 42,
  }}>
    <i className={`fa-solid ${icon}`} style={{
      width: 18,
      textAlign: 'center',
      color: iconColor ?? 'var(--color-neutral-400)',
      fontSize: '0.85rem',
      marginTop: 2,
      flexShrink: 0
    }} />
    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', width: 130, flexShrink: 0, paddingTop: 1 }}>
      {label}
    </div>
    <div style={{ flex: 1 }}>
      {isChip ? (
        <StatusChip label={value} />
      ) : (
        <span style={{
          fontSize: '0.875rem',
          fontWeight: 600,
          color: value === 'S/INF' ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)',
        }}>
          {value}
        </span>
      )}
    </div>
  </div>
);

// ─── SectionCard ──────────────────────────────────────────────────────────────

const SectionCard: React.FC<{
  number: string;
  title: string;
  icon: string;
  iconBg: string;
  children: React.ReactNode;
}> = ({ number, title, icon, iconBg, children }) => (
  <div style={{
    border: '1px solid var(--color-neutral-200)',
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
  }}>
    {/* Header */}
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      borderBottom: '2px solid var(--color-neutral-200)',
      background: 'var(--color-neutral-50)',
    }}>
      <span style={{
        background: iconBg,
        color: '#fff',
        width: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 3,
        fontSize: '0.75rem',
        fontWeight: 700,
        flexShrink: 0,
      }}>
        <i className={`fa-solid ${icon}`} />
      </span>
      <span style={{
        fontSize: '0.75rem',
        fontWeight: 700,
        color: 'var(--color-neutral-600)',
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
      }}>
        {number}. {title}
      </span>
    </div>
    {/* Body */}
    <div style={{ padding: '0 16px', flex: 1 }}>
      {children}
    </div>
  </div>
);

// ─── StatusBarItem ────────────────────────────────────────────────────────────

const StatusBarItem: React.FC<{ icon: string; label: string; value: string; iconColor?: string }> = ({ icon, label, value, iconColor }) => {
  const { variant } = statusChip(value);
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 6,
      flex: 1,
      padding: '12px 10px',
      borderRight: '1px solid var(--color-neutral-200)',
      minWidth: 140,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <i className={`fa-solid ${icon}`} style={{ color: iconColor ?? chipStyles[variant]?.color ?? 'var(--color-neutral-500)', fontSize: '0.85rem' }} />
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </span>
      </div>
      <StatusChip label={value} />
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const RecordDetailPanel: React.FC<RecordDetailPanelProps> = ({ record, onClose, onEdit }) => {
  const [showBitacora, setShowBitacora] = useState(false);

  if (!record) return null;
  const { datos } = record;
  const g = (k: string, ...rest: string[]) => getVal(datos, k, ...rest);

  // Identificadores
  const idOficial = g('Número de Inventario Oficial', 'Clave Artículo', 'No. Inventario');
  const descCorta = g('Descripción Corta del Bien', 'Descripción', 'Descripción del Bien');
  const tipoReg   = g('Tipo de Registro', 'Tipo');

  // Status bar fields
  const estatusGrp        = g('Estatus GRP', 'ESTATUS GRP', 'Estatus de GRP');
  const estatusResguardo  = g('Estatus de Resguardo', 'Resguardo');
  const estatusEtiquetado = g('Estatus de Etiquetado', 'Etiquetado');
  const estatusDoc        = g('Estatus de Documentación', 'Documentación', 'Estatus Documentación');
  const estatusAuditoria  = g('Estatus de Auditoría', 'Auditoría', 'Estatus de Auditoria');

  // Sección 1: Identificación y Ubicación
  const universo         = g('Universo');
  const categoria        = g('Categoría', 'Categoria');
  const tipoBien         = g('Tipo de Bien', 'Tipo Bien');
  const tramo            = g('Tramo');
  const estacion         = g('Estación / Edificio', 'Estacion', 'Edificio');
  const coordinacion     = g('Coordinación/Dirección', 'Coordinacion', 'Dirección');
  const responsable      = g('Responsable del Bien', 'Responsable');

  // Sección 2: Situación del Bien
  const estatusPatrimonial = g('Estatus Patrimonial (Status)', 'Estatus Patrimonial', 'Status', 'Estatus');
  const estadoFisico       = g('Estado Físico', 'Estado Fisico', 'Condición');
  const origenBien         = g('Origen del Bien (CVE_Concepto)', 'Origen del Bien', 'Origen', 'CVE_Concepto');
  const fechaContrato      = g('Fecha de Contrato', 'Fecha Contrato', 'Fecha de Alta');
  const valorUnitario      = g('Valor Unitario', 'Valor Total', 'Precio Unitario');
  const numContrato        = g('Número de Contrato (Documentación Soporte)', 'Número de Contrato', 'No. Contrato', 'Contrato');

  // Sección 3: Control y Seguimiento
  const estatusResguardoCtrl  = g('Estatus de Resguardo', 'Resguardo');
  const estatusEtiqCtrl       = g('Estatus de Etiquetado', 'Etiquetado');
  const estatusGrpCtrl        = g('Estatus GRP', 'ESTATUS GRP');
  const estatusAudCtrl        = g('Estatus de Auditoría', 'Estatus de Auditoria');
  const ultimoMovimiento      = g('Último Movimiento', 'Ultimo Movimiento', 'Último movimiento');
  const fechaUltimoMov        = g('Fecha Último Movimiento', 'Fecha Movimiento');
  const prioridad             = g('Prioridad de Atención', 'Prioridad');
  const accionRequerida       = g('Acción Requerida', 'Accion Requerida');
  const validacionOperativa   = g('Validación Operativa', 'Validacion Operativa');

  // Bottom metadata
  const fechaRegistro      = g('Fecha de Registro', 'Fecha Registro', 'Fecha de Importación');
  const registradoPor      = g('Registrado Por', 'Usuario de Captura', 'Usuario');
  const ultimaActualizacion = g('Última Actualización', 'Ultima Actualización', 'Fecha de Actualización');

  // Format money
  const formatMoney = (val: string) => {
    const num = parseFloat(val.replace(/[,$]/g, ''));
    if (!isNaN(num)) return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
    return val;
  };

  return (
    <div style={{
      background: '#f8fafc',
      borderTop: '3px solid var(--color-primary-600)',
      position: 'relative',
    }}>
      {/* ── Top accent bar ─────────────────────────────────────────── */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--color-primary-500), var(--color-primary-700), #7c3aed)' }} />

      {/* ── Header: Image + ID + Type ───────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 20,
        padding: '20px 24px 16px',
        borderBottom: '1px solid var(--color-neutral-200)',
        background: '#fff',
      }}>
        {/* Placeholder de imagen */}
        <div style={{
          width: 90,
          height: 70,
          background: 'linear-gradient(135deg, var(--color-neutral-100), var(--color-neutral-200))',
          border: '1px solid var(--color-neutral-300)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          gap: 4,
        }}>
          <i className="fa-solid fa-image" style={{ color: 'var(--color-neutral-400)', fontSize: 22 }} />
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--color-primary-600)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            cursor: 'pointer',
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ fontSize: '0.6rem' }} />
            Ver imagen
          </span>
        </div>

        {/* Info principal */}
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            Detalle del Registro Seleccionado
          </div>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--color-neutral-900)', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
            {idOficial}
          </h2>
          {descCorta !== 'S/INF' && (
            <div style={{ fontSize: '0.95rem', color: 'var(--color-neutral-600)', fontWeight: 500, marginBottom: 4 }}>{descCorta}</div>
          )}
          {tipoReg !== 'S/INF' && (
            <div style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)' }}>
              Tipo de registro: <strong style={{ color: 'var(--color-neutral-700)' }}>{tipoReg}</strong>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary btn-sm" onClick={onClose} style={{ padding: '6px 14px' }}>
            <i className="fa-solid fa-compress" /> Ocultar detalle
          </button>
          {onEdit && (
            <button className="btn btn-primary btn-sm" onClick={onEdit} style={{ padding: '6px 14px', background: 'linear-gradient(135deg,#b91c1c,#991b1b)', borderColor: '#991b1b' }}>
              <i className="fa-solid fa-pen-to-square" /> Editar registro seleccionado
            </button>
          )}
        </div>
      </div>

      {/* ── Status chips bar ────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        background: '#fff',
        borderBottom: '1px solid var(--color-neutral-200)',
        overflowX: 'auto',
      }}>
        <StatusBarItem icon="fa-registered"      label="Estatus GRP"          value={estatusGrp}        iconColor="var(--color-danger)" />
        <StatusBarItem icon="fa-shield-halved"   label="Resguardo"            value={estatusResguardo}  />
        <StatusBarItem icon="fa-barcode"         label="Etiquetado"           value={estatusEtiquetado} />
        <StatusBarItem icon="fa-file-lines"      label="Documentación"        value={estatusDoc}        iconColor="var(--color-success)" />
        <StatusBarItem icon="fa-clipboard-check" label="Auditoría"            value={estatusAuditoria}  iconColor="var(--color-danger)" />
      </div>

      {/* ── 3-column grid ───────────────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12,
        padding: '14px 16px',
      }}>

        {/* ─ Sección 1 ─ */}
        <SectionCard number="1" title="Identificación y Ubicación" icon="fa-location-dot" iconBg="var(--color-primary-600)">
          <FieldRow icon="fa-globe"           label="Universo"               value={universo}     iconColor="var(--color-primary-500)" />
          <FieldRow icon="fa-layer-group"     label="Categoría"              value={categoria}    iconColor="var(--color-primary-500)" />
          <FieldRow icon="fa-tag"             label="Tipo de Bien"           value={tipoBien}     iconColor="var(--color-primary-500)" />
          <FieldRow icon="fa-road"            label="Tramo"                  value={tramo}        />
          <FieldRow icon="fa-building"        label="Estación / Edificio"    value={estacion}     />
          <FieldRow icon="fa-sitemap"         label="Coordinación/Dirección" value={coordinacion} />
          <FieldRow icon="fa-user"            label="Responsable del Bien"   value={responsable}  isChip />
        </SectionCard>

        {/* ─ Sección 2 ─ */}
        <SectionCard number="2" title="Situación del Bien" icon="fa-diamond" iconBg="#7c3aed">
          <FieldRow icon="fa-circle-dot"      label="Estatus Patrimonial"    value={estatusPatrimonial} isChip />
          <FieldRow icon="fa-circle-half-stroke" label="Estado Físico"       value={estadoFisico}       isChip />
          <FieldRow icon="fa-arrow-right-arrow-left" label="Origen del Bien" value={origenBien} />
          <FieldRow icon="fa-calendar"        label="Fecha de Contrato"      value={fechaContrato} iconColor="var(--color-primary-500)" />
          <FieldRow icon="fa-dollar-sign"     label="Valor Unitario"         value={valorUnitario !== 'S/INF' ? formatMoney(valorUnitario) : 'S/INF'} iconColor="var(--color-success)" />
          <div style={{ paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-neutral-100)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-file-contract" style={{ color: 'var(--color-neutral-400)' }} />
              Número de Contrato (Documentación Soporte)
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: numContrato === 'S/INF' ? 'var(--color-neutral-400)' : 'var(--color-neutral-800)', wordBreak: 'break-all' }}>
                {numContrato}
              </span>
              {numContrato !== 'S/INF' && (
                <button style={{ background: 'none', border: '1px solid var(--color-neutral-300)', padding: '3px 7px', cursor: 'pointer', marginLeft: 'auto', flexShrink: 0 }} title="Ver documento">
                  <i className="fa-solid fa-file-lines" style={{ fontSize: '0.8rem', color: 'var(--color-neutral-500)' }} />
                </button>
              )}
            </div>
          </div>
        </SectionCard>

        {/* ─ Sección 3 ─ */}
        <SectionCard number="3" title="Control y Seguimiento" icon="fa-shield-halved" iconBg="var(--color-primary-700)">
          <FieldRow icon="fa-shield-halved"   label="Estatus de Resguardo"  value={estatusResguardoCtrl} isChip />
          <FieldRow icon="fa-barcode"         label="Estatus de Etiquetado" value={estatusEtiqCtrl}      isChip />
          <FieldRow icon="fa-registered"      label="Estatus GRP"           value={estatusGrpCtrl}       isChip iconColor="var(--color-danger)" />
          <FieldRow icon="fa-clipboard-check" label="Estatus de Auditoría"  value={estatusAudCtrl}       isChip />
          <div style={{ paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid var(--color-neutral-100)' }}>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fa-solid fa-rotate" style={{ color: 'var(--color-neutral-400)' }} />
              Último Movimiento
            </div>
            {ultimoMovimiento !== 'S/INF' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <StatusChip label={ultimoMovimiento} />
                {fechaUltimoMov !== 'S/INF' && (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-neutral-500)', marginTop: 2 }}>{fechaUltimoMov}</span>
                )}
              </div>
            ) : (
              <StatusChip label="S/INF" />
            )}
          </div>
          <FieldRow icon="fa-circle-exclamation" label="Prioridad de Atención" value={prioridad} isChip iconColor="var(--color-danger)" />
          {accionRequerida !== 'S/INF' && (
            <div style={{ padding: '10px 0', borderBottom: '1px solid var(--color-neutral-100)' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="fa-solid fa-arrow-right" style={{ color: 'var(--color-neutral-400)' }} />
                Acción Requerida
              </div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-800)', lineHeight: 1.5 }}>{accionRequerida}</div>
            </div>
          )}
          {validacionOperativa !== 'S/INF' && (
            <div style={{ padding: '10px 0' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-500)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'flex', gap: 8, alignItems: 'center' }}>
                <i className="fa-solid fa-shield-check" style={{ color: 'var(--color-neutral-400)' }} />
                Validación Operativa
              </div>
              <button style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#fff', border: '1px solid var(--color-primary-300)',
                color: 'var(--color-primary-600)', padding: '5px 12px',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
              }}>
                <i className="fa-solid fa-magnifying-glass" />
                Ver validación operativa »
              </button>
            </div>
          )}
        </SectionCard>
      </div>

      {/* ── Bottom metadata bar ──────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        background: '#fff',
        borderTop: '1px solid var(--color-neutral-200)',
        padding: '0',
      }}>
        {/* Fecha de registro */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          borderRight: '1px solid var(--color-neutral-200)',
          flex: 1, minWidth: 0,
        }}>
          <i className="fa-solid fa-calendar-days" style={{ color: 'var(--color-neutral-400)', fontSize: '1rem', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha de Registro</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>{fechaRegistro}</div>
          </div>
        </div>

        {/* Registrado por */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          borderRight: '1px solid var(--color-neutral-200)',
          flex: 1, minWidth: 0,
        }}>
          <i className="fa-solid fa-user-pen" style={{ color: 'var(--color-neutral-400)', fontSize: '1rem', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrado por</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>{registradoPor}</div>
          </div>
        </div>

        {/* Última actualización */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          borderRight: '1px solid var(--color-neutral-200)',
          flex: 1, minWidth: 0,
        }}>
          <i className="fa-solid fa-rotate" style={{ color: 'var(--color-neutral-400)', fontSize: '1rem', flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--color-neutral-400)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Última Actualización</div>
            <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-neutral-800)' }}>{ultimaActualizacion}</div>
          </div>
        </div>

        {/* Botón bitácora */}
        <div style={{ padding: '10px 20px', flexShrink: 0 }}>
          <button
            onClick={() => setShowBitacora(!showBitacora)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--color-neutral-800)',
              color: '#fff',
              border: 'none',
              padding: '9px 20px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-neutral-900)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--color-neutral-800)')}
          >
            <i className="fa-solid fa-book-open" />
            Abrir bitácora completa
          </button>
        </div>
      </div>

      {/* ── Bitácora expandida ───────────────────────────────────────── */}
      {showBitacora && (
        <div className="animate-fade-in" style={{
          borderTop: '1px solid var(--color-neutral-200)',
          background: '#fff',
          padding: '16px 24px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div className="stat-icon blue" style={{ width: 32, height: 32, fontSize: '0.8rem' }}>
              <i className="fa-solid fa-clock-rotate-left" />
            </div>
            <div>
              <div className="card-title" style={{ fontSize: '0.875rem' }}>Bitácora de Cambios del Registro</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-neutral-500)' }}>Historial completo de modificaciones e inhabilitaciones de este bien.</div>
            </div>
          </div>

          {/* Tabla de trazabilidad */}
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo de Movimiento</th>
                  <th>Campo Modificado</th>
                  <th>Valor Anterior</th>
                  <th>Valor Nuevo</th>
                  <th>Usuario</th>
                  <th>Observaciones</th>
                </tr>
              </thead>
              <tbody>
                {/* Mostrar datos del registro como contexto de trazabilidad */}
                <tr>
                  <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>{fechaRegistro}</td>
                  <td>
                    <span style={{ ...chipStyles.blue, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 3, fontSize: '0.75rem', fontWeight: 600 }}>
                      <i className="fa-solid fa-circle-plus" style={{ fontSize: '0.6rem' }} />
                      Registro inicial
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>—</td>
                  <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>—</td>
                  <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>—</td>
                  <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{registradoPor}</td>
                  <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Importación inicial del inventario</td>
                </tr>
                {ultimaActualizacion !== 'S/INF' && ultimaActualizacion !== fechaRegistro && (
                  <tr>
                    <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>{ultimaActualizacion}</td>
                    <td>
                      <span style={{ ...chipStyles.warning, display: 'inline-flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 3, fontSize: '0.75rem', fontWeight: 600 }}>
                        <i className="fa-solid fa-pen" style={{ fontSize: '0.6rem' }} />
                        Actualización
                      </span>
                    </td>
                    <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>Datos generales</td>
                    <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>—</td>
                    <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>—</td>
                    <td style={{ fontSize: '0.85rem', fontWeight: 500 }}>{registradoPor}</td>
                    <td style={{ color: 'var(--color-neutral-500)', fontSize: '0.8rem' }}>{g('Observaciones de Registro', 'Observaciones') !== 'S/INF' ? g('Observaciones de Registro', 'Observaciones') : 'Sin observaciones'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecordDetailPanel;
