import React, { useState } from 'react';

interface TableToolbarProps {
  search: string;
  onSearch: (searchTerm: string) => void;
  onOpenFilter: () => void;
  onAdd: () => void;
  onExport: () => void;
  onOpenColumnPicker: () => void;
  activeFiltersCount: number;
  visibleCols: number;
  totalCols: number;
}

const TableToolbar: React.FC<TableToolbarProps> = ({
  search,
  onSearch,
  onOpenFilter,
  onAdd,
  onExport,
  onOpenColumnPicker,
  activeFiltersCount,
  visibleCols,
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
    <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'stretch' }}>

      {/* ── Buscador ── */}
      <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
        <i
          className="fa-solid fa-magnifying-glass"
          style={{ position: 'absolute', left: 12, color: 'var(--color-neutral-400)', fontSize: 13, pointerEvents: 'none' }}
        />
        <input
          type="text"
          placeholder="Buscar en toda la tabla…  (↵ Enter para buscar)"
          value={searchValue}
          onChange={e => {
            const val = e.target.value;
            setSearchValue(val);
            if (val === '') onSearch('');
          }}
          onKeyDown={handleKeyDown}
          style={{
            width: '100%',
            padding: '9px 36px 9px 36px',
            border: '1px solid var(--color-neutral-300)',
            fontSize: 'var(--font-size-sm)',
            outline: 'none',
            background: searchValue ? 'var(--color-primary-50)' : '#fff',
            color: 'var(--color-neutral-800)',
            transition: 'border 0.15s, background 0.15s',
            borderLeft: searchValue ? '3px solid var(--color-primary-500)' : '1px solid var(--color-neutral-300)',
          }}
        />
        {searchValue && (
          <button
            onClick={() => { setSearchValue(''); onSearch(''); }}
            style={{ position: 'absolute', right: 10, background: 'none', border: 'none', color: 'var(--color-neutral-400)', cursor: 'pointer', padding: '0 4px' }}
            title="Limpiar búsqueda"
          >
            <i className="fa-solid fa-xmark" />
          </button>
        )}
      </div>

      {/* ── Separador vertical ── */}
      <div style={{ width: 1, background: 'var(--color-neutral-200)', alignSelf: 'stretch' }} />

      {/* ── Botones de acción ── */}
      <div style={{ display: 'flex', gap: 6 }}>

        {/* Agregar bien */}
        <button className="btn btn-primary" onClick={onAdd} title="Agregar nuevo bien" id="btn-add-record">
          <i className="fa-solid fa-plus" /> Agregar bien
        </button>

        {/* Filtros avanzados */}
        <button
          className={`btn ${activeFiltersCount > 0 ? 'btn-primary' : 'btn-secondary'}`}
          onClick={onOpenFilter}
          title="Filtros avanzados por columna"
          id="btn-open-filter"
          style={{ position: 'relative' }}
        >
          <i className="fa-solid fa-sliders" />
          Filtro
          {activeFiltersCount > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 4px',
              background: '#fff', color: 'var(--color-primary-700)',
              fontSize: '0.65rem', fontWeight: 800,
              borderRadius: '50%', marginLeft: 2,
            }}>
              {activeFiltersCount}
            </span>
          )}
        </button>

        {/* Elegir columnas */}
        <button
          className="btn btn-secondary"
          onClick={onOpenColumnPicker}
          title="Elegir columnas visibles"
          id="btn-column-picker"
          style={{ position: 'relative' }}
        >
          <i className="fa-solid fa-table-columns" />
          Columnas
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 18, height: 18, padding: '0 5px',
            background: 'var(--color-primary-600)', color: '#fff',
            fontSize: '0.62rem', fontWeight: 800,
            borderRadius: '50%', marginLeft: 2,
          }}>
            {visibleCols}
          </span>
        </button>

        {/* Exportar */}
        <button className="btn btn-secondary" onClick={onExport} title="Exportar datos a Excel" id="btn-export">
          <i className="fa-solid fa-file-arrow-down" /> Exportar
        </button>

      </div>
    </div>
  );
};

export default TableToolbar;
