import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import initialData from '../data/procurementData.json';

const DataContext = createContext();

export function useData() {
  return useContext(DataContext);
}

export function DataProvider({ children }) {
  const [data, setData] = useState({
    pcs: initialData.pcs || [],
    fornecedores: initialData.fornecedores || [],
    monthly_rcs: initialData.monthly_rcs || []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Global Filters for Procurement
  const [filters, setFilters] = useState({
    ano: 'Todos',
    mes: 'Todos',
    periodoInicio: '',
    periodoFim: '',
    comprador: 'Todos',
    area: 'Todos',
    statusSla: 'Todos',
  });

  // Filters specifically for Fornecedores
  const [fornecedorFilters, setFornecedorFilters] = useState({
    categoria: 'Todos',
    uf: 'Todos',
    cidade: 'Todos',
    compraInternet: 'Todos',
    fornecedorLocal: 'Todos',
    busca: ''
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
      // Try fetching from Supabase
      const { data: pcsData, error: pcsError } = await supabase
        .from('controle_pcs')
        .select('*');

      if (pcsError) {
        console.warn("Supabase load failed, using local bundled data:", pcsError.message);
        // Fallback to bundled dataset
        setData({
          pcs: initialData.pcs || [],
          fornecedores: initialData.fornecedores || [],
          monthly_rcs: initialData.monthly_rcs || []
        });
      } else if (pcsData && pcsData.length > 0) {
        const formattedData = pcsData.map(row => {
          const fallbackRow = initialData.pcs?.find(p => p.id === row.id || (p.pedido_compras && row.pedido_compras && p.pedido_compras === row.pedido_compras));
          const capexOpex = row.capex_opex || fallbackRow?.capex_opex || (row.area_requisitante && row.area_requisitante.toUpperCase().includes('CAPEX') ? 'CAPEX' : 'OPEX');

          return {
            ...row,
            comprador: toTitleCase(row.comprador),
            area_requisitante: toTitleCase(row.area_requisitante),
            fornecedor: toTitleCase(row.fornecedor),
            material_servico: toTitleCase(row.material_servico),
            tipo: toTitleCase(row.tipo),
            capex_opex: capexOpex
          };
        });

        setData(prev => ({
          ...prev,
          pcs: formattedData,
          fornecedores: initialData.fornecedores || [],
          monthly_rcs: initialData.monthly_rcs || []
        }));
      }
    } catch (err) {
      console.warn("Error loading data from Supabase, fallback to bundled data:", err);
      setData({
        pcs: initialData.pcs || [],
        fornecedores: initialData.fornecedores || [],
        monthly_rcs: initialData.monthly_rcs || []
      });
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

  const resetFilters = () => {
    setFilters({
      ano: 'Todos',
      mes: 'Todos',
      periodoInicio: '',
      periodoFim: '',
      comprador: 'Todos',
      area: 'Todos',
      statusSla: 'Todos',
    });
  };

  const updateFornecedorFilter = (key, value) => {
    setFornecedorFilters(prev => ({ ...prev, [key]: value }));
  };

  const resetFornecedorFilters = () => {
    setFornecedorFilters({
      categoria: 'Todos',
      uf: 'Todos',
      cidade: 'Todos',
      compraInternet: 'Todos',
      fornecedorLocal: 'Todos',
      busca: ''
    });
  };

  // Filter options derived from loaded data
  const filterOptions = useMemo(() => {
    const compradores = new Set(['Todos']);
    const areas = new Set(['Todos']);
    const anos = new Set(['Todos']);
    const meses = new Set(['Todos']);

    data.pcs.forEach(row => {
      if (row.comprador) compradores.add(row.comprador);
      if (row.area_requisitante) areas.add(row.area_requisitante);
      
      const dateStr = row.data_pedido || row.data_aprovacao_rc;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          anos.add(date.getFullYear().toString());
          const monthName = date.toLocaleString('pt-BR', { month: 'long' });
          meses.add(monthName.charAt(0).toUpperCase() + monthName.slice(1));
        }
      }
    });

    // Fornecedor filter options
    const fornCategorias = new Set(['Todos']);
    const fornUfs = new Set(['Todos']);
    const fornCidades = new Set(['Todos']);

    data.fornecedores.forEach(f => {
      if (f.categoria) fornCategorias.add(f.categoria);
      if (f.uf) fornUfs.add(f.uf);
      if (f.cidade) fornCidades.add(f.cidade);
    });

    return {
      anos: Array.from(anos).sort(),
      meses: Array.from(meses),
      compradores: Array.from(compradores).sort(),
      areas: Array.from(areas).sort(),
      fornCategorias: Array.from(fornCategorias).sort(),
      fornUfs: Array.from(fornUfs).sort(),
      fornCidades: Array.from(fornCidades).sort()
    };
  }, [data.pcs, data.fornecedores]);

  // Derived filtered PCs
  const filteredData = useMemo(() => {
    return data.pcs.filter(row => {
      let pass = true;

      // Filter by Comprador
      if (filters.comprador !== 'Todos' && row.comprador !== filters.comprador) pass = false;
      
      // Filter by Area
      if (filters.area !== 'Todos' && row.area_requisitante !== filters.area) pass = false;

      // Filter by Ano/Mês
      const dateStr = row.data_pedido || row.data_aprovacao_rc;
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          if (filters.ano !== 'Todos' && date.getFullYear().toString() !== filters.ano) pass = false;
          
          if (filters.mes !== 'Todos') {
            const monthName = date.toLocaleString('pt-BR', { month: 'long' });
            const formattedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
            if (formattedMonth !== filters.mes) pass = false;
          }

          // Date period range filter
          if (filters.periodoInicio) {
            const start = new Date(filters.periodoInicio);
            if (date < start) pass = false;
          }
          if (filters.periodoFim) {
            const end = new Date(filters.periodoFim);
            // end of that day
            end.setHours(23, 59, 59, 999);
            if (date > end) pass = false;
          }
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

  // Derived filtered Fornecedores
  const filteredFornecedores = useMemo(() => {
    return data.fornecedores.filter(f => {
      let pass = true;

      if (fornecedorFilters.categoria !== 'Todos' && f.categoria !== fornecedorFilters.categoria) pass = false;
      if (fornecedorFilters.uf !== 'Todos' && f.uf !== fornecedorFilters.uf) pass = false;
      if (fornecedorFilters.cidade !== 'Todos' && f.cidade !== fornecedorFilters.cidade) pass = false;
      if (fornecedorFilters.compraInternet !== 'Todos' && f.compra_internet !== fornecedorFilters.compraInternet) pass = false;
      if (fornecedorFilters.fornecedorLocal !== 'Todos' && f.fornecedor_local !== fornecedorFilters.fornecedorLocal) pass = false;

      if (fornecedorFilters.busca && fornecedorFilters.busca.trim() !== '') {
        const q = fornecedorFilters.busca.toLowerCase();
        const matchRazao = (f.razao_social || '').toLowerCase().includes(q);
        const matchFantasia = (f.nome_fantasia || '').toLowerCase().includes(q);
        const matchCnpj = (f.cnpj || '').toLowerCase().includes(q);
        const matchCod = (f.codigo || '').toLowerCase().includes(q);
        const matchContato = (f.contato || '').toLowerCase().includes(q);
        const matchEmail = (f.email || '').toLowerCase().includes(q);
        const matchCidade = (f.cidade || '').toLowerCase().includes(q);
        if (!matchRazao && !matchFantasia && !matchCnpj && !matchCod && !matchContato && !matchEmail && !matchCidade) {
          pass = false;
        }
      }

      return pass;
    });
  }, [data.fornecedores, fornecedorFilters]);

  const value = {
    rawData: data,
    filteredData,
    fornecedores: data.fornecedores,
    filteredFornecedores,
    monthlyRcs: data.monthly_rcs,
    filters,
    filterOptions,
    updateFilter,
    resetFilters,
    fornecedorFilters,
    updateFornecedorFilter,
    resetFornecedorFilters,
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
