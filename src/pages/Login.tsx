import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) { setError('Por favor completa todos los campos.'); return }
    setLoading(true)
    setError('')
    try {
      await login(email, password)
      navigate('/', { replace: true })
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      {/* Left panel — brand */}
      <div className="auth-brand-panel">
        <div className="auth-brand-content">
          <div className="auth-logo">
            <i className="fa-solid fa-building-columns" />
          </div>
          <h1 className="auth-brand-title">SIGABIM</h1>
          <p className="auth-brand-subtitle">Sistema de Gestión de Activos e Inventarios BIM</p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <i className="fa-solid fa-shield-halved" />
              <span>Acceso seguro y controlado</span>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-boxes-stacked" />
              <span>Gestión integral de inventarios</span>
            </div>
            <div className="auth-feature">
              <i className="fa-solid fa-chart-line" />
              <span>Reportes y análisis en tiempo real</span>
            </div>
          </div>
        </div>
        <div className="auth-brand-footer">
          <span>© 2025 SIGABIM — Todos los derechos reservados</span>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="auth-form-panel">
        <div className="auth-form-container">
          <div className="auth-form-header">
            <h2>Bienvenido</h2>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {error && (
            <div className="auth-alert auth-alert-error" role="alert">
              <i className="fa-solid fa-circle-exclamation" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            <div className="auth-field">
              <label htmlFor="login-email">Correo electrónico</label>
              <div className="auth-input-wrapper">
                <i className="fa-regular fa-envelope auth-input-icon" />
                <input
                  id="login-email"
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
              <label htmlFor="login-password">Contraseña</label>
              <div className="auth-input-wrapper">
                <i className="fa-solid fa-lock auth-input-icon" />
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="auth-toggle-pass"
                  onClick={() => setShowPass(s => !s)}
                  tabIndex={-1}
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>
            </div>

            <button
              id="btn-login-submit"
              type="submit"
              className="btn btn-primary btn-lg auth-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verificando...</>
              ) : (
                <><i className="fa-solid fa-right-to-bracket" /> Ingresar al sistema</>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>¿No tienes cuenta?</span>
          </div>

          <Link to="/register" id="link-go-register" className="btn btn-secondary btn-lg auth-register-link">
            <i className="fa-solid fa-user-plus" />
            Solicitar acceso
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
