import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, CheckCircle2, Package, MapPin, Globe, ShoppingCart, 
  Map, Building2, Search, RotateCcw, Calendar, Check, X,
  ChevronLeft, ChevronRight
} from 'lucide-react';
import { useData } from '../context/DataContext';
import './Fornecedores.css';

const DONUT_COLORS_LOCAL = ['#22c55e', '#64748b'];
const DONUT_COLORS_NET = ['#22c55e', '#64748b'];

export default function Fornecedores() {
  const { 
    fornecedores, 
    filteredFornecedores, 
    fornecedorFilters, 
    updateFornecedorFilter, 
    resetFornecedorFilters,
    filterOptions,
    loading 
  } = useData();

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Derive metrics and chart data
  const metrics = useMemo(() => {
    if (!filteredFornecedores) return null;

    const total = filteredFornecedores.length;
    let locais = 0;
    let naoLocais = 0;
    let compraNet = 0;
    let naoCompraNet = 0;

    const catMap = {};
    const ufMap = {};
    const cidadeMap = {};
    const uniqueCats = new Set();
    const uniqueUfs = new Set();
    const uniqueCidades = new Set();

    filteredFornecedores.forEach(f => {
      if (f.categoria) {
        uniqueCats.add(f.categoria);
        catMap[f.categoria] = (catMap[f.categoria] || 0) + 1;
      }
      if (f.uf) {
        uniqueUfs.add(f.uf);
        ufMap[f.uf] = (ufMap[f.uf] || 0) + 1;
      }
      if (f.cidade) {
        uniqueCidades.add(f.cidade);
        cidadeMap[f.cidade] = (cidadeMap[f.cidade] || 0) + 1;
      }

      if (f.fornecedor_local === 'SIM') locais++;
      else naoLocais++;

      if (f.compra_internet === 'SIM') compraNet++;
      else naoCompraNet++;
    });

    const percLocal = total > 0 ? (locais / total) * 100 : 0;
    const percNaoLocal = total > 0 ? (naoLocais / total) * 100 : 0;
    const percNet = total > 0 ? (compraNet / total) * 100 : 0;
    const percNaoNet = total > 0 ? (naoCompraNet / total) * 100 : 0;

    const catData = Object.entries(catMap)
      .map(([name, count]) => ({ name: name.length > 18 ? name.slice(0, 18) + '...' : name, fullName: name, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 10);

    const ufData = Object.entries(ufMap)
      .map(([name, count]) => ({ name, count, perc: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a,b) => b.count - a.count);

    const cidadeData = Object.entries(cidadeMap)
      .map(([name, count]) => ({ name: name.length > 16 ? name.slice(0, 16) + '...' : name, fullName: name, count }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 8);

    const donutLocal = [
      { name: 'Local', value: locais, perc: percLocal, color: '#22c55e' },
      { name: 'Não Local', value: naoLocais, perc: percNaoLocal, color: '#475569' }
    ];

    const donutNet = [
      { name: 'Sim', value: compraNet, perc: percNet, color: '#22c55e' },
      { name: 'Não', value: naoCompraNet, perc: percNaoNet, color: '#475569' }
    ];

    return {
      total,
      ativos: total,
      percAtivos: 100,
      totalCategorias: uniqueCats.size,
      locais,
      percLocal,
      naoLocais,
      percNaoLocal,
      compraNet,
      percNet,
      totalUfs: uniqueUfs.size,
      totalCidades: uniqueCidades.size,
      catData,
      ufData,
      cidadeData,
      donutLocal,
      donutNet
    };
  }, [filteredFornecedores]);

  // Paginated table data
  const totalPages = Math.ceil((filteredFornecedores.length || 0) / pageSize) || 1;
  const paginatedFornecedores = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFornecedores.slice(start, start + pageSize);
  }, [filteredFornecedores, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const hasActiveFilters = 
    fornecedorFilters.categoria !== 'Todos' ||
    fornecedorFilters.uf !== 'Todos' ||
    fornecedorFilters.cidade !== 'Todos' ||
    fornecedorFilters.compraInternet !== 'Todos' ||
    fornecedorFilters.fornecedorLocal !== 'Todos' ||
    Boolean(fornecedorFilters.busca);

  if (loading) {
    return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando fornecedores...</h2></div>;
  }

  const {
    total,
    ativos,
    percAtivos,
    totalCategorias,
    locais,
    percLocal,
    naoLocais,
    percNaoLocal,
    compraNet,
    percNet,
    totalUfs,
    totalCidades,
    catData,
    ufData,
    cidadeData,
    donutLocal,
    donutNet
  } = metrics || {};

  return (
    <div className="dashboard-container fornecedores-page">
      {/* Top Header */}
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">FORNECEDORES</h1>
          <p className="page-subtitle">Visão Geral do Cadastro</p>
        </div>

        {/* Fornecedores Filters Bar */}
        <div className="fornecedores-filters-bar">
          <div className="filter-group">
            <label>Categoria</label>
            <select 
              value={fornecedorFilters.categoria} 
              onChange={e => { updateFornecedorFilter('categoria', e.target.value); setCurrentPage(1); }}
            >
              {filterOptions.fornCategorias?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Estado (UF)</label>
            <select 
              value={fornecedorFilters.uf} 
              onChange={e => { updateFornecedorFilter('uf', e.target.value); setCurrentPage(1); }}
            >
              {filterOptions.fornUfs?.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Cidade</label>
            <select 
              value={fornecedorFilters.cidade} 
              onChange={e => { updateFornecedorFilter('cidade', e.target.value); setCurrentPage(1); }}
            >
              {filterOptions.fornCidades?.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="filter-group">
            <label>Compra pela Internet</label>
            <select 
              value={fornecedorFilters.compraInternet} 
              onChange={e => { updateFornecedorFilter('compraInternet', e.target.value); setCurrentPage(1); }}
            >
              <option value="Todos">Todos</option>
              <option value="SIM">Sim</option>
              <option value="NÃO">Não</option>
            </select>
          </div>

          <div className="filter-group">
            <label>Fornecedor Local</label>
            <select 
              value={fornecedorFilters.fornecedorLocal} 
              onChange={e => { updateFornecedorFilter('fornecedorLocal', e.target.value); setCurrentPage(1); }}
            >
              <option value="Todos">Todos</option>
              <option value="SIM">Sim</option>
              <option value="NÃO">Não</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button 
              type="button" 
              className="btn-clear-forn-filters" 
              onClick={() => { resetFornecedorFilters(); setCurrentPage(1); }}
              title="Limpar Filtros"
            >
              <RotateCcw size={14} />
              <span>Limpar filtros</span>
            </button>
          )}

          <div className="last-update-box">
            <Calendar size={14} />
            <div>
              <span className="last-update-label">Data da atualização</span>
              <span className="last-update-val">22/05/2026 08:30</span>
            </div>
          </div>
        </div>
      </header>

      {/* 8 KPI Cards Row */}
      <div className="forn-kpi-grid">
        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Total de Fornecedores</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><Users size={24} /></div>
            <div className="forn-kpi-val">{total}</div>
          </div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Fornecedores Ativos</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><CheckCircle2 size={24} /></div>
            <div className="forn-kpi-val">{ativos}</div>
          </div>
          <div className="forn-kpi-badge">{percAtivos}%</div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Categorias de Compras</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><Package size={24} /></div>
            <div className="forn-kpi-val">{totalCategorias}</div>
          </div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Fornecedores Locais</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><MapPin size={24} /></div>
            <div className="forn-kpi-val">{locais}</div>
          </div>
          <div className="forn-kpi-badge">{percLocal.toFixed(1).replace('.', ',')}%</div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Fornecedores Não Locais</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><Globe size={24} /></div>
            <div className="forn-kpi-val">{naoLocais}</div>
          </div>
          <div className="forn-kpi-badge">{percNaoLocal.toFixed(1).replace('.', ',')}%</div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Compra pela Internet</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><ShoppingCart size={24} /></div>
            <div className="forn-kpi-val">{compraNet}</div>
          </div>
          <div className="forn-kpi-badge">{percNet.toFixed(1).replace('.', ',')}%</div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Estados Atendidos</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><Map size={24} /></div>
            <div className="forn-kpi-val">{totalUfs}</div>
          </div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Cidades Atendidas</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><Building2 size={24} /></div>
            <div className="forn-kpi-val">{totalCidades}</div>
          </div>
        </div>
      </div>

      {/* Middle Visuals Row: 4 Blocks */}
      <div className="forn-charts-grid">
        {/* Block 1: Fornecedores por Categoria */}
        <div className="glass-panel forn-chart-card">
          <h3 className="chart-title">Fornecedores por Categoria</h3>
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 20 }}>
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={(val, name, item) => [`${val} fornecedores`, item.payload.fullName]}
                />
                <Bar dataKey="count" fill="#22c55e" barSize={12} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block 2: Fornecedores por Estado (UF) */}
        <div className="glass-panel forn-chart-card">
          <h3 className="chart-title">Fornecedores por Estado (UF)</h3>
          <div className="uf-distribution-container">
            {ufData.map((u, i) => (
              <div className="uf-dist-item" key={u.name}>
                <div className="uf-info">
                  <span className="uf-code">{u.name}</span>
                  <span className="uf-count">{u.count} ({u.perc.toFixed(1).replace('.', ',')}%)</span>
                </div>
                <div className="uf-bar-track">
                  <div className="uf-bar-fill" style={{ width: `${u.perc}%`, backgroundColor: i === 0 ? '#22c55e' : i === 1 ? '#16a34a' : '#15803d' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3: Fornecedores por Cidade */}
        <div className="glass-panel forn-chart-card">
          <h3 className="chart-title">Fornecedores por Cidade</h3>
          <div className="chart-container" style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cidadeData} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 20 }}>
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={110} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={(val, name, item) => [`${val} fornecedores`, item.payload.fullName]}
                />
                <Bar dataKey="count" fill="#22c55e" barSize={12} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block 4: Donuts for Local & Internet */}
        <div className="glass-panel forn-chart-card forn-donuts-card">
          <div className="donut-sub-block">
            <h4 className="donut-sub-title">Fornecedor Local</h4>
            <div className="donut-sub-chart">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={donutLocal} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none">
                    {donutLocal.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-sub-legend">
                <div className="sub-legend-item">
                  <span className="dot green"></span> Local <strong>{locais} ({percLocal.toFixed(1)}%)</strong>
                </div>
                <div className="sub-legend-item">
                  <span className="dot gray"></span> Não Local <strong>{naoLocais} ({percNaoLocal.toFixed(1)}%)</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="donut-sub-block" style={{marginTop: 12}}>
            <h4 className="donut-sub-title">Compra pela Internet</h4>
            <div className="donut-sub-chart">
              <ResponsiveContainer width={100} height={100}>
                <PieChart>
                  <Pie data={donutNet} innerRadius={28} outerRadius={42} paddingAngle={3} dataKey="value" stroke="none">
                    {donutNet.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="donut-sub-legend">
                <div className="sub-legend-item">
                  <span className="dot green"></span> Sim <strong>{compraNet} ({percNet.toFixed(1)}%)</strong>
                </div>
                <div className="sub-legend-item">
                  <span className="dot gray"></span> Não <strong>{total - compraNet} ({percNaoNet.toFixed(1)}%)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table: Lista de Fornecedores */}
      <div className="glass-panel forn-table-card">
        <div className="forn-table-header">
          <h3 className="chart-title" style={{margin: 0}}>Lista de Fornecedores</h3>
          <div className="forn-search-box">
            <Search size={16} className="forn-search-icon" />
            <input 
              type="text" 
              placeholder="Pesquisar fornecedor..." 
              value={fornecedorFilters.busca}
              onChange={e => { updateFornecedorFilter('busca', e.target.value); setCurrentPage(1); }}
            />
            {fornecedorFilters.busca && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => updateFornecedorFilter('busca', '')}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="table-container">
          <table className="data-table forn-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Categoria</th>
                <th>Razão Social</th>
                <th>CNPJ</th>
                <th>Estado (UF)</th>
                <th>Cidade</th>
                <th>Contato</th>
                <th>E-mail</th>
                <th className="text-center">Compra Internet</th>
                <th className="text-center">Fornecedor Local</th>
              </tr>
            </thead>
            <tbody>
              {paginatedFornecedores.map((f, i) => (
                <tr key={f.codigo || i}>
                  <td className="font-mono">{f.codigo}</td>
                  <td><span className="cat-badge">{f.categoria}</span></td>
                  <td className="font-semibold">{f.razao_social}</td>
                  <td className="font-mono text-muted">{f.cnpj}</td>
                  <td><span className="uf-badge">{f.uf}</span></td>
                  <td>{f.cidade}</td>
                  <td>{f.contato || '-'}</td>
                  <td className="email-col">{f.email || '-'}</td>
                  <td className="text-center">
                    {f.compra_internet === 'SIM' ? (
                      <span className="status-pill status-yes">Sim</span>
                    ) : (
                      <span className="status-pill status-no">Não</span>
                    )}
                  </td>
                  <td className="text-center">
                    {f.fornecedor_local === 'SIM' ? (
                      <span className="icon-badge icon-yes" title="Fornecedor Local"><Check size={16} /></span>
                    ) : (
                      <span className="icon-badge icon-no" title="Não Local"><X size={16} /></span>
                    )}
                  </td>
                </tr>
              ))}
              {paginatedFornecedores.length === 0 && (
                <tr>
                  <td colSpan="10" style={{textAlign: 'center', padding: '36px', color: 'var(--text-secondary)'}}>
                    Nenhum fornecedor encontrado com os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="forn-table-footer">
          <div className="forn-record-info">
            {total > 0 ? (
              <>
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, total)} de {total} registros
              </>
            ) : (
              '0 registros'
            )}
          </div>
          <div className="forn-pagination">
            <button 
              type="button" 
              className="page-btn" 
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, idx) => idx + 1)
              .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && <span className="page-ellipsis">...</span>}
                  <button 
                    type="button" 
                    className={`page-btn ${currentPage === p ? 'active' : ''}`}
                    onClick={() => handlePageChange(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}
            <button 
              type="button" 
              className="page-btn" 
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
