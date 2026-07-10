import React, { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'

interface Props {
  open: boolean
  onClose: () => void
}

const UserProfilePanel: React.FC<Props> = ({ open, onClose }) => {
  const { profile, logout, updateProfile, uploadAvatar } = useAuth()

  const [nombre,      setNombre]      = useState(profile?.nombre ?? '')
  const [email,       setEmail]       = useState(profile?.email ?? '')
  const [avatarPreview, setPreview]   = useState<string | null>(null)
  const [saving,      setSaving]      = useState(false)
  const [uploading,   setUploading]   = useState(false)
  const [msg,         setMsg]         = useState<{ type: 'ok' | 'err'; text: string } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  // Sync fields when profile changes
  React.useEffect(() => {
    setNombre(profile?.nombre ?? '')
    setEmail(profile?.email ?? '')
    setPreview(null)
  }, [profile, open])

  const showMsg = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 3500)
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // Preview inmediato (antes de subir)
    const reader = new FileReader()
    reader.onload = (ev) => setPreview(ev.target?.result as string)
    reader.readAsDataURL(file)

    setUploading(true)
    try {
      await uploadAvatar(file)
      showMsg('ok', 'Avatar actualizado correctamente.')
    } catch (err: any) {
      showMsg('err', err.message)
      setPreview(null)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await updateProfile({ nombre, email })
      showMsg('ok', 'Perfil actualizado correctamente.')
    } catch (err: any) {
      showMsg('err', err.message)
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (name: string) =>
    name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'

  const currentAvatar = avatarPreview || profile?.avatar_url || null

  return (
    <>
      {/* Backdrop */}
      <div
        className={`profile-backdrop${open ? ' open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <aside className={`profile-panel${open ? ' open' : ''}`} aria-label="Panel de perfil">
        {/* Header */}
        <div className="profile-panel-header">
          <h3>Mi Perfil</h3>
          <button className="profile-close-btn" onClick={onClose} aria-label="Cerrar panel" id="btn-close-profile">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>

        {/* Avatar section */}
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="profile-avatar-img" />
            ) : (
              <div className="profile-avatar-initials">
                {getInitials(profile?.nombre || '')}
              </div>
            )}
            <button
              className="profile-avatar-overlay"
              onClick={() => fileRef.current?.click()}
              title="Cambiar foto"
              disabled={uploading}
              id="btn-change-avatar"
            >
              {uploading
                ? <div className="spinner" style={{ width: 18, height: 18, borderWidth: 2, borderTopColor: '#fff' }} />
                : <i className="fa-solid fa-camera" />
              }
            </button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleAvatarChange}
            id="input-avatar-upload"
          />
          <p className="profile-avatar-hint">
            <i className="fa-solid fa-bolt" /> Se convierte a <strong>WebP</strong> automáticamente
          </p>

          {/* Status badge */}
          <div className={`profile-status-badge status-${profile?.status ?? 'pendiente'}`}>
            {profile?.status === 'aprobado'  && <><i className="fa-solid fa-circle-check" /> Aprobado</>}
            {profile?.status === 'pendiente' && <><i className="fa-solid fa-clock" /> Pendiente</>}
            {profile?.status === 'denegado'  && <><i className="fa-solid fa-circle-xmark" /> Denegado</>}
          </div>
        </div>

        {/* Messages */}
        {msg && (
          <div className={`auth-alert ${msg.type === 'ok' ? 'auth-alert-success' : 'auth-alert-error'}`} style={{ margin: '0 1.5rem' }}>
            <i className={`fa-solid ${msg.type === 'ok' ? 'fa-circle-check' : 'fa-circle-exclamation'}`} />
            <span>{msg.text}</span>
          </div>
        )}

        {/* Edit form */}
        <form onSubmit={handleSave} className="profile-edit-form">
          <div className="auth-field">
            <label htmlFor="profile-nombre">Nombre</label>
            <div className="auth-input-wrapper">
              <i className="fa-regular fa-user auth-input-icon" />
              <input
                id="profile-nombre"
                type="text"
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                placeholder="Nombre completo"
              />
            </div>
          </div>

          <div className="auth-field">
            <label htmlFor="profile-email">Correo electrónico</label>
            <div className="auth-input-wrapper">
              <i className="fa-regular fa-envelope auth-input-icon" />
              <input
                id="profile-email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="correo@empresa.com"
              />
            </div>
          </div>

          <button
            id="btn-save-profile"
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ width: '100%', justifyContent: 'center' }}
          >
            {saving
              ? <><div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Guardando...</>
              : <><i className="fa-solid fa-floppy-disk" /> Guardar cambios</>
            }
          </button>
        </form>

        {/* Footer — logout */}
        <div className="profile-panel-footer">
          <button
            id="btn-logout"
            className="btn btn-danger"
            style={{ width: '100%', justifyContent: 'center' }}
            onClick={logout}
          >
            <i className="fa-solid fa-right-from-bracket" /> Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}

export default UserProfilePanel
