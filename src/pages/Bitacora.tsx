import React, { useEffect, useState } from 'react';
import { fetchBitacora, type BitacoraRecord } from '../api/bitacora';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Bitacora: React.FC = () => {
  const [registros, setRegistros] = useState<BitacoraRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchBitacora(1, 100);
      if (res.success) {
        setRegistros(res.data);
      }
    } catch (error) {
      console.error('Error fetching bitacora:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Reporte de Bitácora y Movimientos - SIGABIM', 14, 22);
    
    doc.setFontSize(11);
    doc.text(`Fecha de exportación: ${new Date().toLocaleString('es-MX')}`, 14, 30);

    const tableColumn = ["Fecha", "Usuario", "Acción", "Entidad", "Detalles"];
    const tableRows = registros.map(r => [
      new Date(r.created_at).toLocaleString('es-MX'),
      r.usuario_nombre,
      r.accion,
      r.entidad,
      JSON.stringify(r.detalles).substring(0, 100) + (JSON.stringify(r.detalles).length > 100 ? '...' : '')
    ]);

    autoTable(doc, {
      startY: 35,
      head: [tableColumn],
      body: tableRows,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [37, 99, 235] }
    });

    doc.save(`bitacora_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="animate-fade-in" style={{ paddingBottom: 40 }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Bitácora del Sistema</h1>
          <p>Registro de auditoría de todos los movimientos y cambios realizados en SIGABIM.</p>
        </div>
        <button className="btn btn-primary" onClick={exportPDF} disabled={registros.length === 0}>
          <i className="fa-solid fa-file-pdf" style={{ marginRight: 8 }} />
          Exportar a PDF
        </button>
      </div>

      <div className="card mt-4">
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto' }} />
            <p style={{ marginTop: 16, color: 'var(--color-neutral-500)' }}>Cargando bitácora...</p>
          </div>
        ) : registros.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-10)' }}>
            <i className="fa-solid fa-clipboard-list" style={{ fontSize: '3rem', color: 'var(--color-neutral-300)' }} />
            <h3 style={{ marginTop: 16 }}>Sin Movimientos</h3>
            <p>No se ha registrado ninguna actividad en el sistema todavía.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th>Fecha y Hora</th>
                  <th>Usuario</th>
                  <th>Acción</th>
                  <th>Entidad</th>
                  <th>Detalles Técnicos</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((row) => (
                  <tr key={row.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <span className="text-muted">
                        {new Date(row.created_at).toLocaleString('es-MX', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 'bold' }}>
                          {row.usuario_nombre.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 500 }}>{row.usuario_nombre}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${row.accion === 'CREAR' ? 'badge-blue' : row.accion === 'EDITAR' ? 'badge-yellow' : 'badge-danger'}`}>
                        {row.accion}
                      </span>
                    </td>
                    <td>{row.entidad}</td>
                    <td style={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      <code style={{ fontSize: '11px', background: 'var(--color-neutral-100)', padding: '2px 6px', borderRadius: 4 }}>
                        {JSON.stringify(row.detalles)}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Bitacora;
