import React, { useEffect, useState } from 'react';
import { fetchInventarioStats, InventarioStats } from '../api/inventario';

interface InventarioDashboardProps {
  inventarioId: string;
}

const InventarioDashboard: React.FC<InventarioDashboardProps> = ({ inventarioId }) => {
  const [stats, setStats] = useState<InventarioStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const res = await fetchInventarioStats(inventarioId);
        if (res.success && res.data) setStats(res.data);
      } catch (err) {
        console.error('Error loading stats:', err);
      } finally {
        setLoading(false);
      }
    };
    if (inventarioId) loadStats();
  }, [inventarioId]);

  if (loading) {
    return (
      <div style={{ padding: '20px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--color-neutral-200)' }}>
        <div className="spinner" style={{ width: 18, height: 18 }} />
        <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-neutral-500)' }}>Calculando métricas del inventario...</span>
      </div>
    );
  }

  if (!stats) return null;

  const avancePct = Math.round(stats.avanceGrpPct ?? 0);
  const faltaPct = 100 - avancePct;

  return (
    <div style={{ borderBottom: '1px solid var(--color-neutral-200)', padding: '16px' }}>

      {/* ── Bloque superior: Total General ── */}
      <div className="stat-card" style={{ marginBottom: 14, flexDirection: 'column', gap: 12 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="stat-icon blue" style={{ borderRadius: '50%' }}>
            <i className="fa-solid fa-boxes-stacked" />
          </div>
          <div>
            <div className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 'var(--font-size-xs)', fontWeight: 700 }}>
              Total General de Cantidad de Bienes Muebles
            </div>
            <div className="stat-value" style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-primary-700)' }}>
              {stats.totalGeneral.toLocaleString('es-MX')}
            </div>
          </div>
        </div>

        {/* Sub-cards: composición */}
        <div className="grid-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
          <ComposicionCard label="Equipo Principal" value={stats.equipoPrincipal} icon="fa-desktop" color="blue" />
          <ComposicionCard label="Componentes"      value={stats.componentes}      icon="fa-puzzle-piece" color="blue" />
          <ComposicionCard label="No Inventariables" value={stats.noInventariables} icon="fa-ban" color="yellow" />
          <ComposicionCard label="Validación Física" value={stats.activos} icon="fa-clipboard-question" color="yellow" />
        </div>
      </div>

      {/* ── Fila inferior: métricas GRP ── */}
      <div className="grid-dashboard" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>

        <div className="stat-card">
          <div className="stat-icon blue" style={{ borderRadius: '50%' }}><i className="fa-solid fa-registered" /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary-700)' }}>
              {stats.registradosGrp.toLocaleString('es-MX')}
            </div>
            <div className="stat-label">Registrado en GRP</div>
            <div className="stat-change">Bienes con alta o registro formal</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow" style={{ borderRadius: '50%' }}><i className="fa-solid fa-hourglass-half" /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-warning-dark)' }}>
              {stats.enProceso.toLocaleString('es-MX')}
            </div>
            <div className="stat-label">Proceso de Regularización (Alta GRP)</div>
            <div className="stat-change">Pendientes de validación o ajuste</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green" style={{ borderRadius: '50%' }}><i className="fa-solid fa-chart-line" /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-success)' }}>
              {avancePct}%
            </div>
            <div className="stat-label">Avance GRP</div>
            {/* Barra de progreso */}
            <div style={{ marginTop: 6, height: 5, background: 'var(--color-neutral-200)' }}>
              <div style={{ height: '100%', width: `${avancePct}%`, background: 'var(--color-success)', transition: 'width 0.5s ease' }} />
            </div>
            <div className="stat-change up">Respecto al total general</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon yellow" style={{ borderRadius: '50%' }}><i className="fa-solid fa-triangle-exclamation" /></div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-warning)' }}>
              {faltaPct}%
            </div>
            <div className="stat-label">Falta para 100% avance GRP</div>
            <div className="stat-change">Brecha pendiente de integración</div>
          </div>
        </div>

      </div>
    </div>
  );
};

// Tarjeta pequeña de composición (dentro del total general)
const ComposicionCard: React.FC<{
  label: string;
  value: number;
  icon: string;
  color: 'blue' | 'yellow' | 'green';
}> = ({ label, value, icon, color }) => (
  <div style={{
    background: 'var(--color-neutral-50)',
    border: '1px solid var(--color-neutral-200)',
    padding: '12px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: 10,
  }}>
    <div className={`stat-icon ${color}`} style={{ width: 36, height: 36, fontSize: 'var(--font-size-sm)', borderRadius: '50%' }}>
      <i className={`fa-solid ${icon}`} />
    </div>
    <div>
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-neutral-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-neutral-800)', lineHeight: 1.2 }}>
        {value.toLocaleString('es-MX')}
      </div>
    </div>
  </div>
);

export default InventarioDashboard;
