import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Login: React.FC = () => {
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email,     setEmail]    = useState('')
  const [password,  setPassword] = useState('')
  const [error,     setError]    = useState('')
  const [loading,   setLoading]  = useState(false)
  const [showPass,  setShowPass] = useState(false)

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
    <div className="login-page">
      {/* Background decorative elements */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />

      <div className="login-card">
        {/* Logo */}
        <div className="login-logo-wrap">
          <div className="login-logo">
            <i className="fa-solid fa-building-columns" />
          </div>
        </div>

        <div className="login-header">
          <h1 className="login-title">SIGABIM</h1>
          <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <i className="fa-solid fa-triangle-exclamation" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          <div className="login-field">
            <label htmlFor="login-email">Correo electrónico</label>
            <div className="login-input-wrap">
              <i className="fa-regular fa-envelope login-input-icon" />
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

          <div className="login-field">
            <label htmlFor="login-password">Contraseña</label>
            <div className="login-input-wrap">
              <i className="fa-solid fa-lock login-input-icon" />
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
                className="login-eye-btn"
                onClick={() => setShowPass(s => !s)}
                tabIndex={-1}
                aria-label="Mostrar contraseña"
              >
                <i className={`fa-regular ${showPass ? 'fa-eye-slash' : 'fa-eye'}`} />
              </button>
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="login-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <><div className="login-spinner" /> Verificando...</>
            ) : (
              <>Ingresar al sistema <i className="fa-solid fa-arrow-right" /></>
            )}
          </button>
        </form>

        <div className="login-footer">
          <span>¿Aún no tienes acceso?</span>
          <Link to="/register" id="link-go-register">Solicitar registro</Link>
        </div>
      </div>

      <p className="login-copyright">© 2025 SIGABIM — Sistema de Gestión de Activos BIM</p>
    </div>
  )
}

export default Login
