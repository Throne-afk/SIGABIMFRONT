import React, { useEffect, useState } from 'react'
import type { Profile } from '../context/AuthContext'
import { useAuth } from '../context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const Administracion: React.FC = () => {
  const { session } = useAuth()
  const [users, setUsers] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/users`, {
        headers: { Authorization: `Bearer ${session?.token}` }
      });
      const data = await res.json();
      if (data.success) {
        setUsers(data.data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
      }
    } catch (err) {
      console.error(err);
    }
    setLoading(false)
  }

  useEffect(() => { 
    if (session?.token) fetchUsers() 
  }, [session])

  const changeStatusAndRole = async (userId: string, status: 'aprobado' | 'denegado', rol?: 'admin' | 'editor') => {
    setUpdating(userId)
    try {
      const body: any = { status };
      if (rol) body.rol = rol;

      const res = await fetch(`${API_URL}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.token}`,
        },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Error al actualizar')
      showMsg('ok', `Usuario ${status === 'aprobado' ? 'aprobado' : 'denegado'} correctamente.`)
      await fetchUsers()
    } catch (err: any) {
      showMsg('err', err.message)
    } finally {
      setUpdating(null)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar permanentemente a este usuario?')) return;
    
    setUpdating(userId)
    try {
      const res = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session?.token}` },
      })
      const json = await res.json()
      if (!res.ok || !json.success) throw new Error(json.message || 'Error al eliminar')
      showMsg('ok', 'Usuario eliminado correctamente.')
      await fetchUsers()
    } catch (err: any) {
      showMsg('err', err.message)
    } finally {
      setUpdating(null)
    }
  }

  const statusBadge = (status: string) => {
    if (status === 'aprobado')  return <span className="badge badge-green"><i className="fa-solid fa-circle-check" /> Aprobado</span>
    if (status === 'denegado')  return <span className="badge badge-red"><i className="fa-solid fa-circle-xmark" /> Denegado</span>
    return <span className="badge badge-yellow"><i className="fa-solid fa-clock" /> Pendiente</span>
  }

  const roleBadge = (rol: string) => {
    if (rol === 'admin') return <span className="badge badge-blue"><i className="fa-solid fa-user-shield" /> Admin</span>
    return <span className="badge badge-gray"><i className="fa-solid fa-user-pen" /> Editor</span>
  }

  const fmt = (iso?: string) => iso ? new Date(iso).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric'
  }) : '—'

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Administrador de registros</h1>
            <p>Aprueba accesos, asigna roles y gestiona a los usuarios del sistema.</p>
          </div>
          <button className="btn btn-secondary" onClick={fetchUsers} id="btn-refresh-users">
            <i className="fa-solid fa-rotate" /> Actualizar
          </button>
        </div>
      </div>

      {msg && (
        <div className={`auth-alert ${msg.type === 'ok' ? 'auth-alert-success' : 'auth-alert-error'}`} style={{ marginBottom: '1.5rem' }}>
          <i className={`fa-solid ${msg.type === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
          <span>{msg.text}</span>
        </div>
      )}

      <div className="card" style={{ padding: 0 }}>
        <div className="card-header" style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-neutral-200)' }}>
          <span className="card-title">
            <i className="fa-solid fa-users" style={{ marginRight: 8, color: 'var(--color-primary-600)' }} />
            Usuarios registrados
          </span>
          <span className="badge badge-blue">{users.length} usuarios</span>
        </div>

        {loading ? (
          <div className="empty-state">
            <div className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            <p style={{ marginTop: 16 }}>Cargando usuarios...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="empty-state">
            <i className="fa-solid fa-users" />
            <h3>Sin usuarios registrados</h3>
            <p>Cuando los empleados soliciten acceso, aparecerán aquí.</p>
          </div>
        ) : (
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th>Teléfono</th>
                  <th>Estado</th>
                  <th>Rol</th>
                  <th>Fecha de solicitud</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="admin-user-avatar">
                          {u.avatar_url
                            ? <img src={u.avatar_url} alt={u.nombre} />
                            : u.nombre.slice(0, 2).toUpperCase()
                          }
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--color-neutral-800)' }}>{u.nombre}</div>
                          <div style={{ fontSize: 12, color: 'var(--color-neutral-500)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>{u.telefono || <span style={{ color: 'var(--color-neutral-400)' }}>—</span>}</td>
                    <td>{statusBadge(u.status)}</td>
                    <td>{roleBadge(u.rol)}</td>
                    <td style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>{fmt(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        {u.status !== 'aprobado' && (
                          <>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', borderColor: '#bbf7d0' }}
                              onClick={() => changeStatusAndRole(u.id, 'aprobado', 'editor')}
                              disabled={updating === u.id}
                              title="Aprobar como Editor"
                            >
                              {updating === u.id
                                ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                                : <><i className="fa-solid fa-check" /> Aprobar (Editor)</>
                              }
                            </button>
                            <button
                              className="btn btn-sm"
                              style={{ background: 'var(--color-primary-100)', color: 'var(--color-primary-700)', borderColor: 'var(--color-primary-200)' }}
                              onClick={() => changeStatusAndRole(u.id, 'aprobado', 'admin')}
                              disabled={updating === u.id}
                              title="Aprobar como Admin"
                            >
                              {updating === u.id
                                ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                                : <><i className="fa-solid fa-user-shield" /> Aprobar (Admin)</>
                              }
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => changeStatusAndRole(u.id, 'denegado')}
                              disabled={updating === u.id}
                              title="Denegar acceso"
                            >
                              <i className="fa-solid fa-xmark" />
                            </button>
                          </>
                        )}
                        {u.status === 'aprobado' && (
                          <select 
                            className="input" 
                            style={{ padding: '4px 8px', height: '30px', fontSize: '13px' }}
                            value={u.rol}
                            onChange={(e) => changeStatusAndRole(u.id, 'aprobado', e.target.value as 'admin' | 'editor')}
                            disabled={updating === u.id}
                          >
                            <option value="admin">Administrador</option>
                            <option value="editor">Editor</option>
                          </select>
                        )}
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteUser(u.id)}
                          disabled={updating === u.id}
                          title="Eliminar usuario"
                        >
                          <i className="fa-regular fa-trash-can" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Administracion
