import React from 'react'

const Configuracion: React.FC = () => {
  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center' }}>
      <div style={{ fontSize: '4rem', color: 'var(--color-primary-500)', marginBottom: '1rem' }}>
        <i className="fa-solid fa-person-digging"></i>
      </div>
      <h1 style={{ fontSize: '2rem', color: 'var(--color-neutral-800)', marginBottom: '0.5rem' }}>
        Sección en Construcción
      </h1>
      <p style={{ color: 'var(--color-neutral-500)', maxWidth: '400px', lineHeight: '1.5' }}>
        Estamos trabajando para traer nuevas opciones de configuración y personalización muy pronto. ¡Vuelve más adelante!
      </p>
    </div>
  )
}

export default Configuracion
