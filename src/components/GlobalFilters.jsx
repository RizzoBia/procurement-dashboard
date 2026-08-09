import React from 'react';
import { useData } from '../context/DataContext';

export default function GlobalFilters() {
  const { filters, filterOptions, updateFilter } = useData();

  if (!filters || !filterOptions) return null;

  return (
    <div className="header-filters">
      <div className="filter-group">
        <label>Ano</label>
        <select value={filters.ano} onChange={e => updateFilter('ano', e.target.value)}>
          <option value="Todos">Todos</option>
          {filterOptions.anos.filter(a=>a!=='Todos').map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Mês</label>
        <select value={filters.mes} onChange={e => updateFilter('mes', e.target.value)}>
          {filterOptions.meses.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Comprador</label>
        <select value={filters.comprador} onChange={e => updateFilter('comprador', e.target.value)}>
          {filterOptions.compradores.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Área Requisitante</label>
        <select value={filters.area} onChange={e => updateFilter('area', e.target.value)}>
          {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label>Status SLA</label>
        <select value={filters.statusSla} onChange={e => updateFilter('statusSla', e.target.value)}>
          <option value="Todos">Todos</option>
          <option value="No Prazo">No Prazo</option>
          <option value="Atrasada">Atrasada</option>
        </select>
      </div>
    </div>
  );
}
