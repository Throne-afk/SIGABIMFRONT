import React from 'react'

const Catalogos: React.FC = () => {
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div className="flex items-center justify-between">
          <div>
            <h1>Catálogos</h1>
            <p>Gestiona los catálogos de elementos, materiales y activos BIM del sistema.</p>
          </div>
          <button className="btn btn-primary" id="btn-new-catalogo">
            <i className="fa-solid fa-plus" /> Nuevo catálogo
          </button>
        </div>
      </div>

      <div className="card">
        <div className="empty-state">
          <i className="fa-solid fa-layer-group" />
          <h3>Sin catálogos</h3>
          <p>Aún no se han creado catálogos. Importa inventarios desde la sección de Inventarios para comenzar a generar catálogos de elementos.</p>
        </div>
      </div>
    </div>
  )
}

export default Catalogos
