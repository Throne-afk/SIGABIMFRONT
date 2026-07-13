import React, { useEffect, useState } from 'react';
import { fetchInventarios, fetchInventarioStats, type InventarioStats } from '../api/inventario';
import { fetchBitacora, type BitacoraRecord } from '../api/bitacora';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

// Colores para las gráficas
const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

const Dashboard: React.FC = () => {
  const [globalStats, setGlobalStats] = useState<InventarioStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filesCount, setFilesCount] = useState(0);
  const [recentBitacora, setRecentBitacora] = useState<BitacoraRecord[]>([]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Cargar Bitacora (últimos 5)
        const bitRes = await fetchBitacora(1, 5);
        if (bitRes.success) setRecentBitacora(bitRes.data);

        // Cargar Inventarios
        const invResp = await fetchInventarios();
        if (invResp.success && invResp.data) {
          const inventories = invResp.data;
          setFilesCount(inventories.length);
          
          if (inventories.length === 0) {
            setGlobalStats(null);
            return;
          }

          // Consultar estadísticas de cada inventario en paralelo
          const statsPromises = inventories.map(inv => fetchInventarioStats(inv.id));
          const statsResults = await Promise.all(statsPromises);
          
          const aggregated: InventarioStats = {
            totalGeneral: 0,
            equipoPrincipal: 0,
            componentes: 0,
            noInventariables: 0,
            activos: 0, // faltantes
            registradosGrp: 0,
            enProceso: 0,
            avanceGrpPct: 0,
            faltaGrpPct: 0,
          };

          statsResults.forEach(res => {
            if (res.success && res.data) {
              aggregated.totalGeneral += res.data.totalGeneral;
              aggregated.equipoPrincipal += res.data.equipoPrincipal;
              aggregated.componentes += res.data.componentes;
              aggregated.noInventariables += res.data.noInventariables;
              aggregated.activos += res.data.activos;
              aggregated.registradosGrp += res.data.registradosGrp;
              aggregated.enProceso += res.data.enProceso;
            }
          });

          // Recalcular porcentajes globales
          aggregated.avanceGrpPct = aggregated.totalGeneral > 0 
            ? Math.round((aggregated.registradosGrp / aggregated.totalGeneral) * 100) 
            : 0;
          aggregated.faltaGrpPct = aggregated.totalGeneral > 0 ? 100 - aggregated.avanceGrpPct : 0;

          setGlobalStats(aggregated);
        }
      } catch (err) {
        console.error("Error loading global stats:", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="spinner" style={{ width: 48, height: 48, marginBottom: 16 }} />
        <h3 style={{ color: 'var(--color-neutral-600)' }}>Calculando métricas globales...</h3>
      </div>
    );
  }

  if (filesCount === 0 || !globalStats) {
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Dashboard Global</h1>
          <p>Bienvenido al Sistema de Gestión y Administración BIM.</p>
        </div>
        <div className="empty-state" style={{ padding: 'var(--space-10)', marginTop: '2rem' }}>
          <i className="fa-regular fa-file-excel" style={{ fontSize: '3rem', color: 'var(--color-neutral-400)', marginBottom: '1rem' }} />
          <h3>Sin información disponible</h3>
          <p>Aún no se ha cargado ningún archivo. Ve a Inventarios para importar tu primer Excel y generar las gráficas.</p>
          <a href="/inventarios" className="btn btn-primary" style={{ marginTop: '1rem' }}>Ir a Inventarios</a>
        </div>
      </div>
    );
  }

  // Datos para la gráfica de Composición (Barras)
  const composicionData = [
    { name: 'Equipo Principal', cantidad: globalStats.equipoPrincipal },
    { name: 'Componentes', cantidad: globalStats.componentes },
    { name: 'No Inventariables', cantidad: globalStats.noInventariables },
    { name: 'Faltante de Validación', cantidad: globalStats.activos },
  ];

  // Datos para la gráfica de GRP (Pastel)
  const grpData = [
    { name: 'Registrados en GRP', value: globalStats.registradosGrp },
    { name: 'En Proceso', value: globalStats.enProceso },
  ];

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Dashboard Global</h1>
        <p>Resumen unificado de todos los inventarios y bienes cargados en el sistema.</p>
      </div>

      {/* ── Top Level Stats ── */}
      <div className="grid grid-cols-4 gap-6 mb-8 animate-stagger">
        <div className="stat-card" style={{ gridColumn: 'span 1' }}>
          <div className="stat-icon purple" style={{ borderRadius: '50%' }}>
            <i className="fa-solid fa-file-excel" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-2xl)', color: 'var(--color-primary-800)' }}>
              {filesCount.toLocaleString()}
            </div>
            <div className="stat-label">Archivos Importados</div>
          </div>
        </div>

        <div className="stat-card" style={{ gridColumn: 'span 3', background: 'var(--color-primary-50)', border: '1px solid var(--color-primary-200)' }}>
          <div className="stat-icon blue" style={{ borderRadius: '50%', background: 'var(--color-primary-600)', color: '#fff' }}>
            <i className="fa-solid fa-boxes-stacked" />
          </div>
          <div className="stat-info">
            <div className="stat-value" style={{ fontSize: 'var(--font-size-3xl)', color: 'var(--color-primary-700)' }}>
              {globalStats.totalGeneral.toLocaleString('es-MX')}
            </div>
            <div className="stat-label" style={{ fontWeight: 700, color: 'var(--color-primary-800)' }}>Total General de Bienes Muebles</div>
          </div>
        </div>
      </div>

      {/* ── Gráficas ── */}
      <div className="grid grid-cols-2 gap-6 mb-8 animate-stagger">
        {/* Gráfica de Barras */}
        <div className="card">
          <div className="card-header mb-4">
            <span className="card-title">
              <i className="fa-solid fa-chart-column" style={{ marginRight: '8px', color: 'var(--color-primary-500)' }} />
              Composición del Inventario
            </span>
          </div>
          <div style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={composicionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }} 
                  contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="cantidad" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Pastel */}
        <div className="card">
          <div className="card-header mb-4">
            <span className="card-title">
              <i className="fa-solid fa-chart-pie" style={{ marginRight: '8px', color: 'var(--color-success)' }} />
              Avance Administrativo GRP
            </span>
          </div>
          <div style={{ display: 'flex', height: 300, alignItems: 'center' }}>
            <div style={{ flex: 1, height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={grpData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {grpData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, paddingRight: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: PIE_COLORS[0] }} />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>Registrados en GRP</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 700, color: 'var(--color-neutral-800)', marginLeft: 20 }}>
                  {globalStats.registradosGrp.toLocaleString('es-MX')} <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-success)', fontWeight: 600 }}>({globalStats.avanceGrpPct}%)</span>
                </div>
              </div>
              
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: PIE_COLORS[1] }} />
                  <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, color: 'var(--color-neutral-700)' }}>En Proceso</span>
                </div>
                <div style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-neutral-600)', marginLeft: 20 }}>
                  {globalStats.enProceso.toLocaleString('es-MX')} <span style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-warning-dark)', fontWeight: 600 }}>({globalStats.faltaGrpPct}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* ── Últimos Movimientos Bitácora ── */}
      <div className="card mb-8">
        <div className="card-header mb-4" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span className="card-title">
            <i className="fa-solid fa-clock-rotate-left" style={{ marginRight: '8px', color: 'var(--color-primary-600)' }} />
            Últimos Movimientos en el Sistema
          </span>
          <a href="/bitacora" style={{ fontSize: 13, color: 'var(--color-primary-600)', textDecoration: 'none', fontWeight: 500 }}>
            Ver toda la bitácora &rarr;
          </a>
        </div>
        <div className="table-wrapper">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Fecha y Hora</th>
                <th>Usuario</th>
                <th>Acción</th>
                <th>Entidad</th>
              </tr>
            </thead>
            <tbody>
              {recentBitacora.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: 'var(--color-neutral-500)' }}>
                    No hay movimientos recientes
                  </td>
                </tr>
              ) : (
                recentBitacora.map(row => (
                  <tr key={row.id}>
                    <td>
                      <span className="text-muted">
                        {new Date(row.created_at).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </td>
                    <td style={{ fontWeight: 500 }}>{row.usuario_nombre}</td>
                    <td>
                      <span className={`badge ${row.accion === 'CREAR' ? 'badge-blue' : row.accion === 'EDITAR' ? 'badge-yellow' : 'badge-danger'}`}>
                        {row.accion}
                      </span>
                    </td>
                    <td>{row.entidad}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Botones de navegación (Opcional minimalista) ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
        <a href="/inventarios" className="btn btn-primary" style={{ minWidth: 200, justifyContent: 'center' }}>
          <i className="fa-solid fa-list-check" style={{ marginRight: 8 }} /> Gestionar Inventarios
        </a>
      </div>

    </div>
  );
};

export default Dashboard;
