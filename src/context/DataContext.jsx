import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [data, setData] = useState({ pcs: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters state
  const [filters, setFilters] = useState({
    ano: 'Todos',
    mes: 'Todos',
    comprador: 'Todos',
    area: 'Todos',
    statusSla: 'Todos',
  });

  // Unique options for dropdowns
  const [filterOptions, setFilterOptions] = useState({
    anos: ['Todos'],
    meses: ['Todos'],
    compradores: ['Todos'],
    areas: ['Todos']
  });

  const toTitleCase = (str) => {
    if (!str) return '';
    return str
      .toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: pcsData, error: pcsError } = await supabase
        .from('controle_pcs')
        .select('*');

      if (pcsError) throw pcsError;

      const formattedData = (pcsData || []).map(row => ({
        ...row,
        comprador: toTitleCase(row.comprador),
        area_requisitante: toTitleCase(row.area_requisitante),
        fornecedor: toTitleCase(row.fornecedor),
        material_servico: toTitleCase(row.material_servico),
        tipo: toTitleCase(row.tipo)
      }));

      setData({ pcs: formattedData });

      // Build unique filter options based on the loaded data
      const compradores = new Set(['Todos']);
      const areas = new Set(['Todos']);
      const anos = new Set(['Todos']);
      const meses = new Set(['Todos']);

      formattedData.forEach(row => {
        if (row.comprador) compradores.add(row.comprador);
        if (row.area_requisitante) areas.add(row.area_requisitante);
        
        if (row.data_pedido) {
          const date = new Date(row.data_pedido);
          anos.add(date.getFullYear().toString());
          // Month names in pt-BR
          const monthName = date.toLocaleString('pt-BR', { month: 'long' });
          meses.add(monthName.charAt(0).toUpperCase() + monthName.slice(1));
        }
      });

      setFilterOptions({
        anos: Array.from(anos).sort(),
        meses: Array.from(meses), // Ideally sort by month index
        compradores: Array.from(compradores).sort(),
        areas: Array.from(areas).sort()
      });

    } catch (err) {
      console.error("Error fetching data from Supabase:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Derive filtered data
  const filteredData = React.useMemo(() => {
    return data.pcs.filter(row => {
      let pass = true;

      // Filter by Comprador
      if (filters.comprador !== 'Todos' && row.comprador !== filters.comprador) pass = false;
      
      // Filter by Area
      if (filters.area !== 'Todos' && row.area_requisitante !== filters.area) pass = false;

      // Filter by Ano/Mês
      if (row.data_pedido && (filters.ano !== 'Todos' || filters.mes !== 'Todos')) {
        const date = new Date(row.data_pedido);
        if (filters.ano !== 'Todos' && date.getFullYear().toString() !== filters.ano) pass = false;
        
        if (filters.mes !== 'Todos') {
          const monthName = date.toLocaleString('pt-BR', { month: 'long' });
          const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
          if (formattedMonth !== filters.mes) pass = false;
        }
      }

      // Filter by SLA Status
      if (filters.statusSla !== 'Todos') {
        const rowStatus = row.atrasada_no_prazo ? row.atrasada_no_prazo.toUpperCase() : '';
        if (filters.statusSla === 'No Prazo' && !rowStatus.includes('NO PRAZO')) pass = false;
        if (filters.statusSla === 'Atrasada' && !rowStatus.includes('ATRASADA')) pass = false;
      }

      return pass;
    });
  }, [data.pcs, filters]);

  const value = {
    rawData: data,
    filteredData,
    filters,
    filterOptions,
    updateFilter,
    loading,
    error,
    refreshData: fetchData
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
}
