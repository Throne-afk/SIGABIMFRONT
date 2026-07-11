import React, { useState } from 'react';

interface TableToolbarProps {
  search: string;
  onSearch: (searchTerm: string) => void;
  onOpenFilter: () => void;
  onAdd: () => void;
  onExport: () => void;
  activeFiltersCount: number;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  search,
  onSearch,
  onOpenFilter,
  onAdd,
  onExport,
  activeFiltersCount
}) => {
  const [searchValue, setSearchValue] = useState(search);

  React.useEffect(() => {
    setSearchValue(search);
  }, [search]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch(searchValue);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', alignItems: 'center' }}>
      
      {/* Buscador */}
      <div style={{ flex: 1, position: 'relative' }}>
        <i className="fa-solid fa-search" style={{ position: 'absolute', left: 12, top: 10, color: 'var(--color-neutral-400)' }}></i>
        <input 
          type="text" 
          placeholder="Buscar en toda la tabla (Presiona Enter para buscar)" 
          value={searchValue}
          onChange={(e) => {
            const val = e.target.value;
            setSearchValue(val);
            if (val === '') onSearch('');
          }}
          onKeyDown={handleKeyDown}
          style={{ 
            width: '100%', 
            padding: '8px 15px 8px 35px', 
            borderRadius: 'var(--radius-md)', 
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none'
          }}  
        />
        {searchValue && (
          <button 
            onClick={() => { setSearchValue(''); onSearch(''); }}
            style={{ position: 'absolute', right: 10, top: 10, background: 'none', border: 'none', color: 'var(--color-neutral-400)', cursor: 'pointer' }}
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        )}
      </div>

      {/* Botones de acción */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button className="btn btn-primary" onClick={onAdd} title="Agregar nuevo bien">
          <i className="fa-solid fa-plus"></i> Agregar bien
        </button>

        <button 
          className="btn btn-secondary" 
          onClick={onOpenFilter} 
          title="Filtros avanzados"
          style={{ position: 'relative' }}
        >
          <i className="fa-solid fa-filter"></i> Filtro
          {activeFiltersCount > 0 && (
            <span style={{
              position: 'absolute',
              top: -5,
              right: -5,
              background: 'var(--color-danger)',
              color: 'white',
              fontSize: '0.65rem',
              fontWeight: 'bold',
              borderRadius: 'var(--radius-full)',
              width: 16,
              height: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        <button className="btn btn-secondary" onClick={onExport} title="Exportar datos a Excel">
          <i className="fa-solid fa-file-export"></i> Exportar
        </button>
      </div>

    </div>
  );
};

export default TableToolbar;
