import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart
} from 'recharts';
import { DollarSign, PiggyBank, Percent, ShoppingCart, Clock, Target, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import ProcurementAlerts from '../components/ProcurementAlerts';
import ChartHeader from '../components/ChartHeader';
import './ExecutiveDashboard.css';

// Helper formatter
const formatCurrency = (val) => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2).replace('.', ',')} Mi`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1).replace('.', ',')} Mil`;
  return `R$ ${val.toFixed(2).replace('.', ',')}`;
};

export default function ExecutiveDashboard() {
  const { filteredData, monthlyRcs, loading } = useData();

  const dashboardData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let spendTotal = 0;
    let savingTotal = 0;
    let propostaInicialTotal = 0;
    let uniquePedidos = new Set();
    let slaAtendimentoSum = 0;
    let slaNoPrazoCount = 0;
    let pedidosEmAtrasoCount = 0;

    const mensalMap = {};
    const compradorMap = {};
    const areaMap = {};
    const fornecedorMap = {};
    const rcsMensalMap = {};
    const processosMap = new Map();

    filteredData.forEach(row => {
      const propNeg = row.proposta_negociada || 0;
      const saving = row.saving_cost_total || 0;
      const propIni = row.proposta_inicial || 0;
      
      spendTotal += propNeg;
      savingTotal += saving;
      propostaInicialTotal += propIni;
      
      if (row.pedido_compras && row.pedido_compras !== '') {
        uniquePedidos.add(row.pedido_compras);
      }
      if (row.sla_atendimento) slaAtendimentoSum += row.sla_atendimento;
      
      const status = row.atrasada_no_prazo ? row.atrasada_no_prazo.toUpperCase() : '';
      if (status.includes('NO PRAZO')) {
        slaNoPrazoCount++;
      } else if (status.includes('ATRASADA')) {
        pedidosEmAtrasoCount++;
      }

      // Evolução mensal de Spend e Saving
      if (row.data_pedido) {
        const date = new Date(row.data_pedido);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!mensalMap[monthYear]) mensalMap[monthYear] = { name: monthYear, spend: 0, saving: 0, propIni: 0, time: date.getTime() };
        mensalMap[monthYear].spend += propNeg;
        mensalMap[monthYear].saving += saving;
        mensalMap[monthYear].propIni += propIni;
      }

      // Evolução mensal de RCs Recebidas (data aprovação) x Concluídas (data pedido)
      if (row.data_aprovacao_rc) {
        const date = new Date(row.data_aprovacao_rc);
        const my = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!rcsMensalMap[my]) rcsMensalMap[my] = { name: my, recebidas: 0, concluidas: 0, time: date.getTime() };
        rcsMensalMap[my].recebidas += 1;
      }
      if (row.data_pedido) {
        const date = new Date(row.data_pedido);
        const my = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!rcsMensalMap[my]) rcsMensalMap[my] = { name: my, recebidas: 0, concluidas: 0, time: date.getTime() };
        rcsMensalMap[my].concluidas += 1;
      }

      // Agrupamentos
      if (row.comprador) {
        compradorMap[row.comprador] = (compradorMap[row.comprador] || 0) + saving;
      }
      if (row.area_requisitante) {
        areaMap[row.area_requisitante] = (areaMap[row.area_requisitante] || 0) + propNeg;
      }
      if (row.status_sla === 'No Prazo') slaNoPrazoCount++;
      if (row.status_sla === 'Em Atraso') pedidosEmAtrasoCount++;

      // Agrupamento Mensal Spend e Saving
      const mesKey = row.ano_mes || 'Outros';
      if (!mensalMap[mesKey]) {
        mensalMap[mesKey] = { mesKey, spend: 0, saving: 0, propIni: 0, time: row.data_rc ? new Date(row.data_rc).getTime() : 0 };
      }
      mensalMap[mesKey].spend += propNeg;
      mensalMap[mesKey].saving += saving;
      mensalMap[mesKey].propIni += propIni;

      // Agrupamento RCs Mensal (Recebidas vs Concluidas)
      if (!rcsMensalMap[mesKey]) {
        rcsMensalMap[mesKey] = { 
          name: mesKey, 
          recebidas: 0, 
          concluidas: 0, 
          time: row.data_rc ? new Date(row.data_rc).getTime() : 0 
        };
      }
      if (row.numero_rc) rcsMensalMap[mesKey].recebidas++;
      if (row.numero_pedido || row.status_sla === 'No Prazo') rcsMensalMap[mesKey].concluidas++;

      // Comprador
      const comp = row.comprador || 'Não informado';
      compradorMap[comp] = (compradorMap[comp] || 0) + saving;

      // Area
      const ar = row.area_requisitante || 'Não informada';
      areaMap[ar] = (areaMap[ar] || 0) + propNeg;

      // Fornecedor
      const forn = row.fornecedor || 'Não informado';
      fornecedorMap[forn] = (fornecedorMap[forn] || 0) + propNeg;

      // Processos (para tabela Top 10)
      const rcKey = row.numero_rc || row.numero_pedido || `Item-${Math.random()}`;
      if (!processosMap.has(rcKey)) {
        processosMap.set(rcKey, {
          rc: row.numero_rc || '-',
          pedido: row.numero_pedido || '-',
          fornecedor: row.fornecedor || '-',
          area: row.area_requisitante || '-',
          categoria: row.categoria || '-',
          pInicial: 0,
          pNegociada: 0,
          savingRs: 0,
          savingPerc: 0
        });
      }
      const proc = processosMap.get(rcKey);
      proc.pInicial += propIni;
      proc.pNegociada += propNeg;
      proc.savingRs += saving;
      proc.savingPerc = proc.pInicial > 0 ? ((proc.pInicial - proc.pNegociada) / proc.pInicial) * 100 : 0;
    });

    const savingPercTotal = propostaInicialTotal > 0 ? (savingTotal / propostaInicialTotal) * 100 : 0;
    const slaMedio = filteredData.length > 0 ? (slaAtendimentoSum / filteredData.length) : 0;
    const slaAtingimento = filteredData.length > 0 ? (slaNoPrazoCount / filteredData.length) * 100 : 0;

    // Calculo MoM Trend (Comparativo mês a mês para KPIs)
    const sortedMonths = Object.values(mensalMap).sort((a,b) => a.time - b.time);
    let spendTrend = null;
    let savingTrend = null;
    if (sortedMonths.length >= 2) {
      const lastM = sortedMonths[sortedMonths.length - 1];
      const prevM = sortedMonths[sortedMonths.length - 2];
      if (prevM.spend > 0) {
        const diff = ((lastM.spend - prevM.spend) / prevM.spend) * 100;
        spendTrend = { val: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`, isPositive: diff <= 0 };
      }
      if (prevM.saving > 0) {
        const diff = ((lastM.saving - prevM.saving) / prevM.saving) * 100;
        savingTrend = { val: `${diff > 0 ? '+' : ''}${diff.toFixed(1)}%`, isPositive: diff >= 0 };
      }
    }

    const kpis = [
      {
        title: 'SPEND TOTAL',
        value: formatCurrency(spendTotal),
        icon: <DollarSign size={22} />,
        iconColor: '#38bdf8',
        trend: spendTrend
      },
      {
        title: 'SAVING TOTAL',
        value: formatCurrency(savingTotal),
        icon: <PiggyBank size={22} />,
        iconColor: '#4ade80',
        trend: savingTrend
      },
      {
        title: 'SAVING %',
        value: `${savingPercTotal.toFixed(1).replace('.', ',')}%`,
        icon: <Percent size={22} />,
        iconColor: '#a78bfa'
      },
      {
        title: 'TOTAL PEDIDOS',
        value: uniquePedidos.size.toLocaleString('pt-BR'),
        icon: <ShoppingCart size={22} />,
        iconColor: '#f43f5e'
      },
      {
        title: 'SLA MÉDIO',
        value: `${slaMedio.toFixed(1).replace('.', ',')} dias`,
        icon: <Clock size={22} />,
        iconColor: '#fbbf24'
      },
      {
        title: '% NO PRAZO (SLA)',
        value: `${slaAtingimento.toFixed(1).replace('.', ',')}%`,
        icon: <Target size={22} />,
        iconColor: '#2dd4bf'
      },
      {
        title: 'PEDIDOS EM ATRASO',
        value: pedidosEmAtrasoCount.toLocaleString('pt-BR'),
        icon: <AlertTriangle size={22} />,
        iconColor: '#f87171'
      }
    ];

    // Evolução Mensal
    const evolucao = sortedMonths.map(m => ({
      name: m.mesKey,
      spend: m.spend / 1000000,
      saving: m.saving / 1000000,
      savingPerc: m.propIni > 0 ? (m.saving / m.propIni) * 100 : 0
    }));

    // Evolução RCs Recebidas x Concluídas
    let evolucaoRcs = Object.values(rcsMensalMap).sort((a,b) => a.time - b.time);
    if (evolucaoRcs.length === 0 && monthlyRcs && monthlyRcs.length > 0) {
      evolucaoRcs = monthlyRcs.map(m => ({
        name: m.mesKey,
        recebidas: m.recebidas,
        concluidas: m.concluidas
      }));
    }

    const topCompradores = Object.entries(compradorMap).map(([name, val]) => ({ name, value: val })).sort((a,b) => b.value - a.value).slice(0, 10);
    const topAreas = Object.entries(areaMap).map(([name, val]) => ({ name, value: val })).sort((a,b) => b.value - a.value).slice(0, 10);
    const topFornecedores = Object.entries(fornecedorMap).map(([name, val]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      fullName: name, 
      value: val 
    })).sort((a,b) => b.value - a.value).slice(0, 10);
    
    const topProcessos = Array.from(processosMap.values())
      .filter(p => p.savingRs > 0)
      .sort((a,b) => b.savingRs - a.savingRs)
      .slice(0, 10);

    return { kpis, evolucao, evolucaoRcs, topCompradores, topAreas, topFornecedores, topProcessos, totalItems: filteredData.length };
  }, [filteredData, monthlyRcs]);

  const handleExportTopProcessos = () => {
    if (!dashboardData?.topProcessos) return;
    const exportData = dashboardData.topProcessos.map(p => ({
      'RC': p.rc,
      'Pedido': p.pedido,
      'Fornecedor': p.fornecedor,
      'Área': p.area,
      'Categoria': p.categoria,
      'Proposta Inicial (R$)': p.pInicial,
      'Proposta Negociada (R$)': p.pNegociada,
      'Saving (R$)': p.savingRs,
      'Saving (%)': `${p.savingPerc.toFixed(1)}%`
    }));
    exportToExcel(exportData, 'top_processos_saving', 'Top Processos Saving');
  };

  if (loading) {
    return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;
  }

  const { kpis, evolucao, evolucaoRcs, topCompradores, topAreas, topFornecedores, topProcessos } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">VISÃO GERAL PROCUREMENT</h1>
          <p className="page-subtitle">Visão executiva de Compras</p>
        </div>
        <GlobalFilters />
      </header>

      {!dashboardData ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <h2>Nenhum dado encontrado</h2>
          <p>Não há registros para a combinação de filtros selecionada.</p>
        </div>
      ) : (
        <>
          {/* Alertas Inteligentes de Risco */}
          <ProcurementAlerts data={filteredData} />

          {/* KPIs Row */}
          <div className="kpi-row">
            {kpis.map((kpi, idx) => (
              <div className="glass-panel kpi-card-mini" key={idx}>
                <h4 className="kpi-mini-title">{kpi.title}</h4>
                <div className="kpi-mini-body">
                  <div className="kpi-mini-icon" style={{color: kpi.iconColor}}>
                    <div className="kpi-mini-icon-bg">{kpi.icon}</div>
                  </div>
                  <div className="kpi-mini-value">{kpi.value}</div>
                </div>
                <div className="kpi-mini-footer">
                  {kpi.trend ? (
                    <span className={`kpi-trend ${kpi.trend.isPositive ? 'trend-up' : 'trend-down'}`}>
                      {kpi.trend.val} vs mês ant.
                    </span>
                  ) : (
                    <span className="vs-mes">Ativos no período</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Middle Row Charts */}
          <div className="middle-charts-grid">
            <div id="chart-spend-saving" className="glass-panel chart-card col-span-2">
              <ChartHeader title="EVOLUÇÃO MENSAL - SPEND x SAVING" chartId="chart-spend-saving" downloadName="evolucao_spend_saving" />
              <div className="chart-legend-custom">
                 <span className="legend-item"><span className="legend-color" style={{backgroundColor: '#0f766e'}}></span> Spend (R$)</span>
                 <span className="legend-item"><span className="legend-color" style={{backgroundColor: '#86efac'}}></span> Saving (R$)</span>
                 <span className="legend-item"><span className="legend-line" style={{borderTop: '2px dashed #0f766e'}}></span> Saving %</span>
              </div>
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolucao} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <YAxis yAxisId="left" fontSize={12} stroke="var(--text-secondary)" tickFormatter={(val) => `${val} Mi`} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" fontSize={12} stroke="var(--text-secondary)" tickFormatter={(val) => `${val.toFixed(0)}%`} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val, name) => [name === 'savingPerc' ? `${val.toFixed(2)}%` : `R$ ${val.toFixed(2)} Mi`, name === 'savingPerc' ? 'Saving %' : name === 'spend' ? 'Spend' : 'Saving']} 
                    />
                    <Bar yAxisId="left" dataKey="saving" fill="#86efac" barSize={30} radius={[4, 4, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="savingPerc" stroke="#0f766e" strokeWidth={2} dot={{r: 4, fill: '#0f766e'}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="chart-saving-comprador" className="glass-panel chart-card">
              <ChartHeader title="SAVING POR COMPRADOR" chartId="chart-saving-comprador" downloadName="saving_por_comprador" />
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topCompradores} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={110} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => formatCurrency(val)} 
                    />
                    <Bar dataKey="value" fill="#0f766e" barSize={15} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="chart-rcs-evolucao" className="glass-panel chart-card">
              <ChartHeader title="EVOLUÇÃO MENSAL | RCs Recebidas x Concluídas" chartId="chart-rcs-evolucao" downloadName="rcs_recebidas_concluidas" />
              <div className="chart-legend-custom">
                 <span className="legend-item"><span className="legend-color" style={{backgroundColor: '#0f766e'}}></span> RCs Recebidas</span>
                 <span className="legend-item"><span className="legend-color" style={{backgroundColor: '#86efac'}}></span> RCs Concluídas</span>
              </div>
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={evolucaoRcs} margin={{ top: 20, right: 20, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                    <XAxis dataKey="name" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val, name) => [val, name === 'recebidas' ? 'RCs Recebidas' : 'RCs Concluídas']} 
                    />
                    <Bar dataKey="recebidas" fill="#0f766e" barSize={26} radius={[4, 4, 0, 0]} />
                    <Line type="monotone" dataKey="concluidas" stroke="#86efac" strokeWidth={3} dot={{ r: 5, fill: '#ffffff', stroke: '#86efac', strokeWidth: 2 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom Row Charts */}
          <div className="bottom-charts-grid">
            <div id="chart-spend-area" className="glass-panel chart-card">
              <ChartHeader title="SPEND POR ÁREA REQUISITANTE" chartId="chart-spend-area" downloadName="spend_por_area" />
              <div className="chart-container" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topAreas} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={100} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => [formatCurrency(val), 'Spend']} 
                    />
                    <Bar dataKey="value" fill="#0f766e" barSize={12} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="chart-top-fornecedores" className="glass-panel chart-card">
              <ChartHeader title="TOP 10 FORNECEDORES POR SPEND" chartId="chart-top-fornecedores" downloadName="top_fornecedores_spend" />
              <div className="chart-container" style={{ height: 320 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topFornecedores} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 40 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={120} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => [formatCurrency(val), 'Spend']} 
                      labelFormatter={(label, entries) => entries.length > 0 && entries[0].payload.fullName ? entries[0].payload.fullName : label} 
                    />
                    <Bar dataKey="value" fill="#0f766e" barSize={12} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-panel chart-card col-span-full">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="chart-title" style={{ margin: 0 }}>TOP 10 PROCESSOS COM MAIOR SAVING</h3>
                <button 
                  onClick={handleExportTopProcessos}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 12px',
                    background: 'rgba(15, 118, 110, 0.15)',
                    border: '1px solid rgba(15, 118, 110, 0.3)',
                    borderRadius: '8px',
                    color: '#2dd4bf',
                    fontSize: '12px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  <Download size={14} /> Exportar Excel
                </button>
              </div>
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>RC</th>
                      <th>Pedido</th>
                      <th>Fornecedor</th>
                      <th>Área</th>
                      <th>Categoria</th>
                      <th className="text-right">Proposta Inicial</th>
                      <th className="text-right">Proposta Negociada</th>
                      <th className="text-right">Saving (R$)</th>
                      <th className="text-right">Saving (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProcessos.map((row, i) => (
                      <tr key={i}>
                        <td>{row.rc}</td>
                        <td>{row.pedido}</td>
                        <td>{row.fornecedor}</td>
                        <td>{row.area}</td>
                        <td>{row.categoria}</td>
                        <td className="text-right">{formatCurrency(row.pInicial)}</td>
                        <td className="text-right">{formatCurrency(row.pNegociada)}</td>
                        <td className="text-right saving-col">{formatCurrency(row.savingRs)}</td>
                        <td className="text-right saving-col">{row.savingPerc.toFixed(1)}%</td>
                      </tr>
                    ))}
                    {topProcessos.length === 0 && (
                      <tr>
                        <td colSpan="9" style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>
                          Nenhum processo com saving no período filtrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="dashboard-footer-note">
            * Saving % / Custo Evitado % = ((Proposta Inicial - Proposta Negociada) / Proposta Inicial) | Dados dinâmicos e atualizados.
          </div>
        </>
      )}
    </div>
  );
}
