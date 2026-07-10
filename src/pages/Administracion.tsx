import React, { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Profile } from '../lib/supabase'

const API_URL = import.meta.env.VITE_API_URL as string

const Administracion: React.FC = () => {
  const [users, setUsers]     = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [msg, setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setUsers(data as Profile[])
    setLoading(false)
  }

  useEffect(() => { fetchUsers() }, [])

  const changeStatus = async (userId: string, status: 'aprobado' | 'denegado') => {
    setUpdating(userId)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const token = sessionData.session?.access_token
      const res = await fetch(`${API_URL}/api/auth/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.message || 'Error al actualizar')
      showMsg('ok', `Usuario ${status === 'aprobado' ? 'aprobado' : 'denegado'} correctamente.`)
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

  const fmt = (iso: string) => new Date(iso).toLocaleDateString('es-GT', {
    day: '2-digit', month: 'short', year: 'numeric'
  })

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Administración</h1>
            <p>Gestiona usuarios, roles y permisos del sistema SIGABIM.</p>
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
            Registros de usuarios
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
                    <td style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>{fmt(u.created_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                        <button
                          id={`btn-approve-${u.id.slice(0,8)}`}
                          className="btn btn-sm"
                          style={{ background: 'var(--color-success-light)', color: 'var(--color-success)', borderColor: '#bbf7d0' }}
                          onClick={() => changeStatus(u.id, 'aprobado')}
                          disabled={updating === u.id || u.status === 'aprobado'}
                          title="Aprobar acceso"
                        >
                          {updating === u.id
                            ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                            : <><i className="fa-solid fa-check" /> Aprobar</>
                          }
                        </button>
                        <button
                          id={`btn-deny-${u.id.slice(0,8)}`}
                          className="btn btn-sm btn-danger"
                          onClick={() => changeStatus(u.id, 'denegado')}
                          disabled={updating === u.id || u.status === 'denegado'}
                          title="Denegar acceso"
                        >
                          {updating === u.id
                            ? <div className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
                            : <><i className="fa-solid fa-xmark" /> Denegar</>
                          }
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
