import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  Users, CheckCircle2, Package, MapPin, Globe, ShoppingCart, 
  Map, Building2, Search, RotateCcw, Calendar, Check, X,
  ChevronLeft, ChevronRight, FileSpreadsheet
} from 'lucide-react';
import { useData } from '../context/DataContext';
import CustomSelect from '../components/CustomSelect';
import { exportToExcel } from '../utils/exportUtils';
import './Fornecedores.css';

export default function Fornecedores() {
  const { 
    filteredFornecedores = [], 
    fornecedorFilters = { categoria: 'Todos', uf: 'Todos', cidade: 'Todos', compraInternet: 'Todos', fornecedorLocal: 'Todos', busca: '' }, 
    updateFornecedorFilter = () => {}, 
    resetFornecedorFilters = () => {},
    filterOptions = {},
    loading = false
  } = useData() || {};

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const fornList = filteredFornecedores || [];

  // Derive metrics and chart data
  const metrics = useMemo(() => {
    const total = fornList.length;
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

    fornList.forEach(f => {
      if (!f) return;
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

    const cleanCategoryName = (cat) => {
      if (!cat) return 'Outros';
      const map = {
        'Materiais e Suprimentos Industriais': 'Materiais e Suprim.',
        'Marketing, Comunicação e Eventos': 'Marketing & Eventos',
        'Fornecedores de Alimentação': 'Alimentação',
        'Consultoria Técnica / Jurídica': 'Consultoria',
        'Softwares e Licenciamento': 'Softwares & TI',
        'Tecnologia da Informação': 'Tecnologia da Info',
        'Serviços de Eventos': 'Eventos',
        'Locação de Espaços': 'Locação Espaços',
        'Transportes e Logística': 'Transporte & Log.',
        'Construção Civil e Reformas': 'Construção Civil'
      };
      return map[cat] || (cat.length > 20 ? cat.slice(0, 18) + '...' : cat);
    };

    const catData = Object.entries(catMap)
      .map(([name, count]) => ({ 
        name: cleanCategoryName(name), 
        fullName: name, 
        count 
      }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 7);

    const ufData = Object.entries(ufMap)
      .map(([name, count]) => ({ name, count, perc: total > 0 ? (count / total) * 100 : 0 }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 5);

    const cidadeData = Object.entries(cidadeMap)
      .map(([name, count]) => ({ 
        name: name.length > 15 ? name.slice(0, 14) + '...' : name, 
        fullName: name, 
        count 
      }))
      .sort((a,b) => b.count - a.count)
      .slice(0, 7);

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
      naoCompraNet,
      percNaoNet,
      totalUfs: uniqueUfs.size,
      totalCidades: uniqueCidades.size,
      catData,
      ufData,
      cidadeData,
      donutLocal,
      donutNet
    };
  }, [fornList]);

  // Paginated table data
  const totalRecords = fornList.length;
  const totalPages = Math.ceil(totalRecords / pageSize) || 1;
  const paginatedFornecedores = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return fornList.slice(start, start + pageSize);
  }, [fornList, currentPage]);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const hasActiveFilters = 
    (fornecedorFilters?.categoria && fornecedorFilters.categoria !== 'Todos') ||
    (fornecedorFilters?.uf && fornecedorFilters.uf !== 'Todos') ||
    (fornecedorFilters?.cidade && fornecedorFilters.cidade !== 'Todos') ||
    (fornecedorFilters?.compraInternet && fornecedorFilters.compraInternet !== 'Todos') ||
    (fornecedorFilters?.fornecedorLocal && fornecedorFilters.fornecedorLocal !== 'Todos') ||
    Boolean(fornecedorFilters?.busca);

  if (loading) {
    return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando fornecedores...</h2></div>;
  }

  const {
    total = 0,
    ativos = 0,
    percAtivos = 100,
    totalCategorias = 0,
    locais = 0,
    percLocal = 0,
    naoLocais = 0,
    percNaoLocal = 0,
    compraNet = 0,
    percNet = 0,
    naoCompraNet = 0,
    percNaoNet = 0,
    totalUfs = 0,
    totalCidades = 0,
    catData = [],
    ufData = [],
    cidadeData = [],
    donutLocal = [],
    donutNet = []
  } = metrics || {};

  const handleExportExcel = () => {
    const exportData = fornList.map(f => ({
      'Código Fornecedor': f.id_fornecedor || '-',
      'Razão Social': f.razao_social || '-',
      'Nome Fantasia': f.nome_fantasia || '-',
      'CNPJ': f.cnpj || '-',
      'Categoria': f.categoria || '-',
      'Cidade': f.cidade || '-',
      'UF': f.uf || '-',
      'Endereço': f.endereco || '-',
      'CEP': f.cep || '-',
      'Fornecedor Local': f.fornecedor_local || 'NÃO',
      'Compra Internet': f.compra_internet || 'NÃO'
    }));
    exportToExcel(exportData, `fornecedores_filtrados_${new Date().toISOString().slice(0,10)}`, 'Fornecedores');
  };

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
          <CustomSelect
            label="Categoria"
            value={fornecedorFilters?.categoria || 'Todos'}
            options={filterOptions?.fornCategorias || ['Todos']}
            onChange={val => { updateFornecedorFilter('categoria', val); setCurrentPage(1); }}
          />

          <CustomSelect
            label="Estado (UF)"
            value={fornecedorFilters?.uf || 'Todos'}
            options={filterOptions?.fornUfs || ['Todos']}
            onChange={val => { updateFornecedorFilter('uf', val); setCurrentPage(1); }}
          />

          <CustomSelect
            label="Cidade"
            value={fornecedorFilters?.cidade || 'Todos'}
            options={filterOptions?.fornCidades || ['Todos']}
            onChange={val => { updateFornecedorFilter('cidade', val); setCurrentPage(1); }}
          />

          <CustomSelect
            label="Compra pela Internet"
            value={fornecedorFilters?.compraInternet || 'Todos'}
            options={['Todos', 'SIM', 'NÃO']}
            onChange={val => { updateFornecedorFilter('compraInternet', val); setCurrentPage(1); }}
          />

          <CustomSelect
            label="Fornecedor Local"
            value={fornecedorFilters?.fornecedorLocal || 'Todos'}
            options={['Todos', 'SIM', 'NÃO']}
            onChange={val => { updateFornecedorFilter('fornecedorLocal', val); setCurrentPage(1); }}
          />

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
          <div className="forn-kpi-badge">{(percLocal || 0).toFixed(1).replace('.', ',')}%</div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Fornecedores Não Locais</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><Globe size={24} /></div>
            <div className="forn-kpi-val">{naoLocais}</div>
          </div>
          <div className="forn-kpi-badge">{(percNaoLocal || 0).toFixed(1).replace('.', ',')}%</div>
        </div>

        <div className="glass-panel forn-kpi-card">
          <div className="forn-kpi-title">Compra pela Internet</div>
          <div className="forn-kpi-body">
            <div className="forn-kpi-icon"><ShoppingCart size={24} /></div>
            <div className="forn-kpi-val">{compraNet}</div>
          </div>
          <div className="forn-kpi-badge">{(percNet || 0).toFixed(1).replace('.', ',')}%</div>
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
        <div id="chart-forn-categoria" className="glass-panel forn-chart-card">
          <div className="chart-header-flex">
            <h3 className="chart-title" style={{ margin: 0 }}>Fornecedores por Categoria (Top 7)</h3>
          </div>
          <div className="chart-container" style={{ height: 280, marginTop: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={catData} layout="vertical" margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={130} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={(val, name, item) => [`${val} fornecedores`, item?.payload?.fullName || name]}
                />
                <Bar dataKey="count" fill="#22c55e" barSize={14} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block 2: Fornecedores por Estado (UF) */}
        <div id="chart-forn-uf" className="glass-panel forn-chart-card">
          <div className="chart-header-flex">
            <h3 className="chart-title" style={{ margin: 0 }}>Fornecedores por Estado (UF)</h3>
          </div>
          <div className="uf-distribution-container" style={{ height: 280, marginTop: '8px', overflowY: 'auto' }}>
            {ufData.map((u, i) => (
              <div className="uf-dist-item" key={u.name}>
                <div className="uf-info">
                  <span className="uf-code">{u.name}</span>
                  <span className="uf-count">{u.count} ({(u.perc || 0).toFixed(1).replace('.', ',')}%)</span>
                </div>
                <div className="uf-bar-track">
                  <div className="uf-bar-fill" style={{ width: `${u.perc || 0}%`, backgroundColor: i === 0 ? '#22c55e' : i === 1 ? '#16a34a' : '#15803d' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Block 3: Fornecedores por Cidade */}
        <div id="chart-forn-cidade" className="glass-panel forn-chart-card">
          <div className="chart-header-flex">
            <h3 className="chart-title" style={{ margin: 0 }}>Fornecedores por Cidade (Top 7)</h3>
          </div>
          <div className="chart-container" style={{ height: 280, marginTop: '8px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cidadeData} layout="vertical" margin={{ top: 5, right: 20, bottom: 0, left: 10 }}>
                <XAxis type="number" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" fontSize={11} tickLine={false} axisLine={false} width={105} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold' }}
                  formatter={(val, name, item) => [`${val} fornecedores`, item?.payload?.fullName || name]}
                />
                <Bar dataKey="count" fill="#22c55e" barSize={14} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Block 4: Donuts for Local & Internet */}
        <div className="glass-panel forn-chart-card forn-donuts-card">
          <div className="donut-sub-block">
            <h4 className="donut-sub-title">Fornecedor Local</h4>
            <div className="donut-sub-chart">
              <div style={{ width: 85, height: 85 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutLocal} innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="value" stroke="none">
                      {donutLocal.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="donut-sub-legend">
                <div className="sub-legend-item">
                  <span className="dot green"></span> Local <strong>{locais} ({(percLocal || 0).toFixed(1)}%)</strong>
                </div>
                <div className="sub-legend-item">
                  <span className="dot gray"></span> Não Local <strong>{naoLocais} ({(percNaoLocal || 0).toFixed(1)}%)</strong>
                </div>
              </div>
            </div>
          </div>

          <div className="donut-sub-block">
            <h4 className="donut-sub-title">Compra pela Internet</h4>
            <div className="donut-sub-chart">
              <div style={{ width: 85, height: 85 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={donutNet} innerRadius={24} outerRadius={38} paddingAngle={3} dataKey="value" stroke="none">
                      {donutNet.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="donut-sub-legend">
                <div className="sub-legend-item">
                  <span className="dot green"></span> Sim <strong>{compraNet} ({(percNet || 0).toFixed(1)}%)</strong>
                </div>
                <div className="sub-legend-item">
                  <span className="dot gray"></span> Não <strong>{total - compraNet} ({(percNaoNet || 0).toFixed(1)}%)</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Table: Lista de Fornecedores */}
      <div className="glass-panel forn-table-card">
        <div className="forn-table-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 className="chart-title" style={{margin: 0}}>Lista de Fornecedores</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>({fornList.length} encontrados)</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className="export-excel-btn"
              onClick={handleExportExcel}
              title="Exportar dados filtrados para planilha Excel (.xlsx)"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>

            <div className="forn-search-box">
              <Search size={16} className="forn-search-icon" />
              <input 
                type="text" 
                placeholder="Pesquisar fornecedor..." 
                value={fornecedorFilters?.busca || ''}
                onChange={e => { updateFornecedorFilter('busca', e.target.value); setCurrentPage(1); }}
              />
              {fornecedorFilters?.busca && (
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
            {totalRecords > 0 ? (
              <>
                {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRecords)} de {totalRecords} registros
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
