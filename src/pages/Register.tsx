import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Register: React.FC = () => {
  const { register } = useAuth()
  const navigate = useNavigate()

  const [nombre,    setNombre]    = useState('')
  const [email,     setEmail]     = useState('')
  const [telefono,  setTelefono]  = useState('')
  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)
  const [loading,   setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!nombre || !email || !telefono || !password || !confirm) {
      setError('Todos los campos son obligatorios.'); return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.'); return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.'); return
    }

    setLoading(true)
    try {
      await register(nombre, email, telefono, password)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Error al registrarse.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="auth-shell">
        <div className="auth-brand-panel">
          <div className="auth-brand-content">
            <div className="auth-logo"><i className="fa-solid fa-building-columns" /></div>
            <h1 className="auth-brand-title">SIGABIM</h1>
            <p className="auth-brand-subtitle">Sistema de Gestión de Activos e Inventarios BIM</p>
          </div>
          <div className="auth-brand-footer">
            <span>© 2025 SIGABIM — Todos los derechos reservados</span>
          </div>
        </div>
        <div className="auth-form-panel">
          <div className="auth-form-container">
            <div className="auth-success-state">
              <div className="auth-success-icon">
                <i className="fa-solid fa-circle-check" />
              </div>
              <h2>¡Solicitud enviada!</h2>
              <p>
                Tu solicitud de acceso ha sido registrada correctamente.
                Un administrador de SIGABIM revisará tu solicitud y te notificará cuando sea aprobada.
              </p>
              <div className="auth-alert auth-alert-info" style={{ marginTop: '1.5rem' }}>
                <i className="fa-solid fa-circle-info" />
                <span>Mientras tanto, tu cuenta está en estado <strong>Pendiente</strong>. No podrás ingresar hasta recibir aprobación.</span>
              </div>
              <button
                id="btn-go-to-login"
                className="btn btn-primary btn-lg auth-submit-btn"
                style={{ marginTop: '2rem' }}
                onClick={() => navigate('/login')}
              >
                <i className="fa-solid fa-arrow-left" /> Volver al inicio de sesión
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-shell">
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo"><i className="fa-solid fa-building-columns" /></div>
          <h1 className="auth-brand-title">SIGABIM</h1>
          <p className="auth-brand-subtitle">Sistema de Gestión de Activos e Inventarios BIM</p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <i className="fa-solid fa-user-shield" />
              <span>Acceso aprobado por administrador</span>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-clock" />
              <span>Proceso de aprobación ágil</span>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-lock" />
              <span>Sistema seguro y auditado</span>
            </div>
          </div>
        </div>
        <div className="auth-brand-footer">
          <span>© 2025 SIGABIM — Todos los derechos reservados</span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Solicitar acceso</h2>
            <p>Completa el formulario para solicitar tu registro en SIGABIM</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="reg-nombre">Nombre del empleado <span className="auth-required">*</span></label>
              <div className="auth-input-wrapper">
                <i className="fa-regular fa-user auth-input-icon" />
                <input
                  id="reg-nombre"
                  type="text"
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Nombre completo"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-email">Correo electrónico <span className="auth-required">*</span></label>
              <div className="auth-input-wrapper">
                <i className="fa-regular fa-envelope auth-input-icon" />
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="correo@empresa.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="reg-telefono">Teléfono <span className="auth-required">*</span></label>
              <div className="auth-input-wrapper">
                <i className="fa-solid fa-phone auth-input-icon" />
                <input
                  id="reg-telefono"
                  type="tel"
                  value={telefono}
                  onChange={e => setTelefono(e.target.value)}
                  placeholder="+502 1234-5678"
                  required
                />
              </div>
            </div>

            <div className="auth-fields-row">
              <div className="auth-field">
                <label htmlFor="reg-password">Contraseña <span className="auth-required">*</span></label>
                <div className="auth-input-wrapper">
                  <i className="fa-solid fa-lock auth-input-icon" />
                  <input
                    id="reg-password"
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Mín. 6 caracteres"
                    autoComplete="new-password"
                    required
                  />
                  <button type="button" className="auth-toggle-pass" onClick={() => setShowPass(s => !s)} tabIndex={-1}>
                    <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              </div>

              <div className="auth-field">
                <label htmlFor="reg-confirm">Confirmar contraseña <span className="auth-required">*</span></label>
                <div className="auth-input-wrapper">
                  <i className="fa-solid fa-lock auth-input-icon" />
                  <input
                    id="reg-confirm"
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Repite la contraseña"
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </div>

            <button
              id="btn-register-submit"
              type="submit"
              className="btn btn-primary btn-lg auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Enviando solicitud...</>
              ) : (
                <><i className="fa-solid fa-paper-plane" /> Enviar solicitud de acceso</>
              )}
            </button>
          </form>

          <div className="auth-divider"><span>¿Ya tienes cuenta aprobada?</span></div>
          <Link to="/login" id="link-go-login" className="btn btn-secondary btn-lg auth-register-link">
            <i className="fa-solid fa-right-to-bracket" /> Iniciar sesión
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Register
