import React, { useEffect, useState, useRef } from 'react';
import { fetchNotificaciones, markNotificacionRead, type Notificacion } from '../api/bitacora';
import { useNavigate } from 'react-router-dom';

interface NotificationsPanelProps {
  open: boolean;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ open, onClose, onCountChange }) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotificaciones();
    // Podría haber un polling cada X segundos
    const interval = setInterval(loadNotificaciones, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotificaciones = async () => {
    try {
      const res = await fetchNotificaciones();
      if (res.success) {
        setNotificaciones(res.data);
        onCountChange(res.data.length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const handleRead = async (id: string) => {
    try {
      await markNotificacionRead(id);
      setNotificaciones(prev => prev.filter(n => n.id !== id));
      onCountChange(notificaciones.length - 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewAll = () => {
    onClose();
    navigate('/bitacora');
  };

  if (!open) return null;

  return (
    <>
      <div 
        style={{ position: 'fixed', inset: 0, zIndex: 1040 }} 
        onClick={onClose} 
      />
      <div 
        ref={panelRef}
        style={{
          position: 'absolute',
          top: 60,
          right: 80,
          width: 320,
          background: 'var(--color-surface)',
          borderRadius: 8,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          border: '1px solid var(--color-neutral-200)',
          zIndex: 1050,
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 400
        }}
        className="animate-fade-in"
      >
        <div style={{ padding: '16px', borderBottom: '1px solid var(--color-neutral-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>Notificaciones</h3>
          <span style={{ fontSize: 12, background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', padding: '2px 8px', borderRadius: 12 }}>
            {notificaciones.length} nuevas
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {notificaciones.length === 0 ? (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--color-neutral-400)' }}>
              <i className="fa-regular fa-bell-slash" style={{ fontSize: 24, marginBottom: 8 }} />
              <p style={{ margin: 0, fontSize: 14 }}>No hay notificaciones nuevas</p>
            </div>
          ) : (
            notificaciones.map(n => (
              <div 
                key={n.id} 
                style={{ 
                  padding: 16, 
                  borderBottom: '1px solid var(--color-neutral-100)',
                  background: 'var(--color-primary-50)',
                  position: 'relative'
                }}
              >
                <p style={{ margin: '0 0 4px 0', fontSize: 13, color: 'var(--color-neutral-700)' }}>
                  {n.mensaje}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11, color: 'var(--color-neutral-500)' }}>
                    {new Date(n.created_at).toLocaleString('es-MX')}
                  </span>
                  <button 
                    onClick={() => handleRead(n.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontSize: 11, cursor: 'pointer', padding: 0 }}
                  >
                    Marcar leída
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ padding: 12, borderTop: '1px solid var(--color-neutral-200)', textAlign: 'center' }}>
          <button 
            onClick={handleViewAll}
            style={{ background: 'none', border: 'none', color: 'var(--color-primary-600)', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
          >
            Ver Bitácora Completa
          </button>
        </div>
      </div>
    </>
  );
};

export default NotificationsPanel;
