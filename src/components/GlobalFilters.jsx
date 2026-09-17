import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, RotateCcw } from 'lucide-react';
import { useData } from '../context/DataContext';
import './GlobalFilters.css';

export default function GlobalFilters() {
  const { filters, filterOptions, updateFilter, resetFilters } = useData();
  const [isOpenPeriod, setIsOpenPeriod] = useState(false);
  const popoverRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpenPeriod(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!filters || !filterOptions) return null;

  const getPeriodLabel = () => {
    if (filters.periodoInicio && filters.periodoFim) {
      const d1 = new Date(filters.periodoInicio + 'T00:00:00');
      const d2 = new Date(filters.periodoFim + 'T00:00:00');
      const m1 = d1.toLocaleString('pt-BR', { month: 'short' });
      const m2 = d2.toLocaleString('pt-BR', { month: 'short' });
      return `${m1.charAt(0).toUpperCase() + m1.slice(1)}/${d1.getFullYear()} - ${m2.charAt(0).toUpperCase() + m2.slice(1)}/${d2.getFullYear()}`;
    }
    if (filters.ano !== 'Todos' || filters.mes !== 'Todos') {
      if (filters.ano !== 'Todos' && filters.mes !== 'Todos') {
        return `${filters.mes.slice(0, 3)}/${filters.ano}`;
      }
      if (filters.ano !== 'Todos') return `Ano ${filters.ano}`;
      return `Mês ${filters.mes}`;
    }
    return 'Jan/2026 - Set/2026';
  };

  const handlePeriodPreset = (preset) => {
    if (preset === 'all') {
      updateFilter('periodoInicio', '');
      updateFilter('periodoFim', '');
      updateFilter('ano', 'Todos');
      updateFilter('mes', 'Todos');
    } else if (preset === '2026') {
      updateFilter('ano', '2026');
      updateFilter('mes', 'Todos');
      updateFilter('periodoInicio', '2026-01-01');
      updateFilter('periodoFim', '2026-12-31');
    } else if (preset === 'q3_2026') {
      updateFilter('ano', '2026');
      updateFilter('mes', 'Todos');
      updateFilter('periodoInicio', '2026-07-01');
      updateFilter('periodoFim', '2026-09-30');
    }
    setIsOpenPeriod(false);
  };

  const hasActiveFilters = 
    filters.ano !== 'Todos' || 
    filters.mes !== 'Todos' || 
    filters.comprador !== 'Todos' || 
    filters.area !== 'Todos' || 
    filters.statusSla !== 'Todos' ||
    Boolean(filters.periodoInicio);

  return (
    <div className="header-filters-wrapper">
      <div className="header-filters">
        {/* Modern Period Filter Box as requested in image1.png */}
        <div className="period-filter-box" ref={popoverRef}>
          <button 
            type="button" 
            className={`period-trigger-btn ${filters.periodoInicio ? 'active' : ''}`}
            onClick={() => setIsOpenPeriod(!isOpenPeriod)}
            title="Selecionar Período"
          >
            <div className="period-icon-wrap">
              <Calendar size={18} className="period-calendar-icon" />
            </div>
            <div className="period-text-wrap">
              <span className="period-label">Período</span>
              <span className="period-value">{getPeriodLabel()}</span>
            </div>
            <ChevronDown size={16} className={`period-chevron ${isOpenPeriod ? 'rotated' : ''}`} />
          </button>

          {isOpenPeriod && (
            <div className="period-popover glass-panel">
              <div className="period-popover-title">Intervalo de Datas</div>
              <div className="period-inputs-row">
                <div className="period-input-group">
                  <label>De:</label>
                  <input 
                    type="date" 
                    value={filters.periodoInicio} 
                    onChange={e => updateFilter('periodoInicio', e.target.value)} 
                  />
                </div>
                <div className="period-input-group">
                  <label>Até:</label>
                  <input 
                    type="date" 
                    value={filters.periodoFim} 
                    onChange={e => updateFilter('periodoFim', e.target.value)} 
                  />
                </div>
              </div>
              <div className="period-presets">
                <button type="button" onClick={() => handlePeriodPreset('2026')}>Ano 2026</button>
                <button type="button" onClick={() => handlePeriodPreset('q3_2026')}>Jul/26 - Set/26</button>
                <button type="button" onClick={() => handlePeriodPreset('all')}>Todo Período</button>
              </div>
            </div>
          )}
        </div>

        {/* Ano */}
        <div className="filter-group">
          <label>Ano</label>
          <select value={filters.ano} onChange={e => updateFilter('ano', e.target.value)}>
            <option value="Todos">Todos</option>
            {filterOptions.anos.filter(a => a !== 'Todos').map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Mês */}
        <div className="filter-group">
          <label>Mês</label>
          <select value={filters.mes} onChange={e => updateFilter('mes', e.target.value)}>
            {filterOptions.meses.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        {/* Comprador */}
        <div className="filter-group">
          <label>Comprador</label>
          <select value={filters.comprador} onChange={e => updateFilter('comprador', e.target.value)}>
            {filterOptions.compradores.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Área Requisitante */}
        <div className="filter-group">
          <label>Área Requisitante</label>
          <select value={filters.area} onChange={e => updateFilter('area', e.target.value)}>
            {filterOptions.areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>

        {/* Status SLA */}
        <div className="filter-group">
          <label>Status SLA</label>
          <select value={filters.statusSla} onChange={e => updateFilter('statusSla', e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="No Prazo">No Prazo</option>
            <option value="Atrasada">Atrasada</option>
          </select>
        </div>

        {/* Limpar Filtros Button */}
        {hasActiveFilters && (
          <button 
            type="button" 
            className="btn-clear-filters" 
            onClick={resetFilters}
            title="Limpar todos os filtros"
          >
            <RotateCcw size={14} />
            <span>Limpar</span>
          </button>
        )}
      </div>
    </div>
  );
}
