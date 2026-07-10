import React from 'react'

const Administracion: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Administración</h1>
            <p>Gestiona usuarios, roles y permisos del sistema SIGABIM.</p>
          </div>
          <button className="btn btn-primary" id="btn-new-user">
            <i className="fa-solid fa-user-plus" /> Agregar usuario
          </button>
        </div>
      </div>

      <div className="card">
        <div className="empty-state">
          <i className="fa-solid fa-users" />
          <h3>Sin usuarios registrados</h3>
          <p>La gestión de usuarios estará disponible en la siguiente versión. Por ahora el sistema opera en modo local sin autenticación.</p>
        </div>
      </div>
    </div>
  )
}

export default Administracion
