import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line, ComposedChart, PieChart, Pie, Cell
} from 'recharts';
import { DollarSign, PiggyBank, Percent, ShoppingCart, Clock, Target, Calendar } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import './ExecutiveDashboard.css';

// Helper formatter
const formatCurrency = (val) => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2).replace('.', ',')} Mi`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1).replace('.', ',')} Mil`;
  return `R$ ${val.toFixed(2).replace('.', ',')}`;
};

export default function ExecutiveDashboard() {
  const { filteredData, filters, filterOptions, updateFilter, loading } = useData();

  const dashboardData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let spendTotal = 0;
    let savingTotal = 0;
    let propostaInicialTotal = 0;
    let uniquePedidos = new Set();
    let slaAtendimentoSum = 0;
    let slaNoPrazoCount = 0;
    let rcsAtrasadasCount = 0;

    const mensalMap = {};
    const compradorMap = {};
    const areaMap = {};
    const fornecedorMap = {};
    const processos = [];

    filteredData.forEach(row => {
      const propNeg = row.proposta_negociada || 0;
      const saving = row.saving_cost_total || 0;
      const propIni = row.proposta_inicial || 0;
      
      spendTotal += propNeg;
      savingTotal += saving;
      propostaInicialTotal += propIni;
      
      if (row.pedido_compras) uniquePedidos.add(row.pedido_compras);
      if (row.sla_atendimento) slaAtendimentoSum += row.sla_atendimento;
      
      if (row.atrasada_no_prazo && row.atrasada_no_prazo.toUpperCase().includes('NO PRAZO')) {
        slaNoPrazoCount++;
      } else if (row.atrasada_no_prazo && row.atrasada_no_prazo.toUpperCase().includes('ATRASADA')) {
        rcsAtrasadasCount++;
      }

      // Evolução mensal
      if (row.data_pedido) {
        const date = new Date(row.data_pedido);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!mensalMap[monthYear]) mensalMap[monthYear] = { name: monthYear, spend: 0, saving: 0, propIni: 0, time: date.getTime() };
        mensalMap[monthYear].spend += propNeg;
        mensalMap[monthYear].saving += saving;
        mensalMap[monthYear].propIni += propIni;
      }

      // Agrupamentos
      if (row.comprador) {
        compradorMap[row.comprador] = (compradorMap[row.comprador] || 0) + saving;
      }
      if (row.area_requisitante) {
        areaMap[row.area_requisitante] = (areaMap[row.area_requisitante] || 0) + propNeg;
      }
      if (row.fornecedor) {
        fornecedorMap[row.fornecedor] = (fornecedorMap[row.fornecedor] || 0) + propNeg;
      }

      // Processos
      processos.push({
        rc: row.rc,
        pedido: row.pedido_compras,
        fornecedor: row.fornecedor,
        area: row.area_requisitante,
        categoria: row.material_servico || row.tipo,
        pInicial: propIni,
        pNegociada: propNeg,
        savingRs: saving,
        savingPerc: propIni > 0 ? (saving / propIni) * 100 : 0
      });
    });

    const savingPercTotal = propostaInicialTotal > 0 ? (savingTotal / propostaInicialTotal) * 100 : 0;
    const avgLeadTime = filteredData.length > 0 ? (slaAtendimentoSum / filteredData.length) : 0;
    const slaPerc = filteredData.length > 0 ? (slaNoPrazoCount / filteredData.length) * 100 : 0;

    const kpis = [
      { title: 'SPEND TOTAL', value: formatCurrency(spendTotal), icon: <DollarSign size={20} />, trend: '-', trendUp: true, iconColor: '#22c55e' },
      { title: 'SAVING TOTAL', value: formatCurrency(savingTotal), icon: <PiggyBank size={20} />, trend: '-', trendUp: true, iconColor: '#22c55e' },
      { title: 'SAVING %', value: `${savingPercTotal.toFixed(2).replace('.', ',')}%`, icon: <Percent size={20} />, trend: '-', trendUp: true, iconColor: '#22c55e' },
      { title: 'TOTAL DE PEDIDOS', value: uniquePedidos.size.toString(), icon: <ShoppingCart size={20} />, trend: '-', trendUp: true, iconColor: '#22c55e' },
      { title: 'LEAD TIME MÉDIO', value: `${avgLeadTime.toFixed(1).replace('.', ',')} dias`, icon: <Clock size={20} />, trend: '-', trendUp: false, iconColor: '#ef4444' },
      { title: 'SLA (%)', value: `${slaPerc.toFixed(1).replace('.', ',')}%`, icon: <Target size={20} />, trend: '-', trendUp: true, iconColor: '#22c55e' },
      { title: 'RCs ATRASADAS', value: rcsAtrasadasCount.toString(), icon: <Calendar size={20} />, trend: '-', trendUp: false, iconColor: '#ef4444' }
    ];

    const evolucao = Object.values(mensalMap).sort((a,b) => a.time - b.time).map(m => ({
      name: m.name,
      spend: m.spend / 1000000,
      saving: m.saving / 1000000,
      savingPerc: m.propIni > 0 ? (m.saving / m.propIni) * 100 : 0
    }));

    const topCompradores = Object.entries(compradorMap).map(([name, val]) => ({ name, value: val })).sort((a,b) => b.value - a.value).slice(0, 10);
    const topAreas = Object.entries(areaMap).map(([name, val]) => ({ name, value: val })).sort((a,b) => b.value - a.value).slice(0, 10);
    const topFornecedores = Object.entries(fornecedorMap).map(([name, val]) => ({ 
      name: name.length > 15 ? name.substring(0, 15) + '...' : name, 
      fullName: name, 
      value: val 
    })).sort((a,b) => b.value - a.value).slice(0, 10);
    const topProcessos = processos.sort((a,b) => b.savingRs - a.savingRs).slice(0, 10);

    const slaDataChart = [
      { name: 'No Prazo', value: slaNoPrazoCount, color: '#0f766e' },
      { name: 'Atrasada', value: rcsAtrasadasCount, color: '#ef4444' }
    ];

    return { kpis, evolucao, topCompradores, topAreas, topFornecedores, topProcessos, slaDataChart, totalItems: filteredData.length };
  }, [filteredData]);

  if (loading) {
    return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;
  }

  const { kpis, evolucao, topCompradores, topAreas, topFornecedores, topProcessos, slaDataChart, totalItems } = dashboardData || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">PROCUREMENT DASHBOARD</h1>
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
              <span className="vs-mes">Ativos no período</span>
            </div>
          </div>
        ))}
      </div>

      {/* Middle Row Charts */}
      <div className="middle-charts-grid">
        <div className="glass-panel chart-card col-span-2">
          <h3 className="chart-title">EVOLUÇÃO MENSAL - SPEND x SAVING</h3>
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

        <div className="glass-panel chart-card">
          <h3 className="chart-title">SAVING POR COMPRADOR</h3>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompradores} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={100} />
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

        <div className="glass-panel chart-card">
          <h3 className="chart-title">STATUS SLA</h3>
          <div className="chart-container donut-container" style={{ height: 300, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slaDataChart} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                  {slaDataChart.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      onClick={() => updateFilter('statusSla', filters.statusSla === entry.name ? 'Todos' : entry.name)}
                      style={{ cursor: 'pointer', outline: 'none', opacity: filters.statusSla !== 'Todos' && filters.statusSla !== entry.name ? 0.3 : 1 }}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="donut-center">
              <strong>{totalItems}</strong>
              <span>Itens</span>
            </div>
            <div className="donut-legend">
              {slaDataChart.map(d => (
                <div className="dl-item" key={d.name}>
                  <div><span className="dl-color" style={{backgroundColor: d.color}}></span> {d.name}</div>
                  <div>{(totalItems > 0 ? (d.value / totalItems * 100) : 0).toFixed(1)}% <span className="dl-val">{d.value}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row Charts */}
      <div className="bottom-charts-grid">
        <div className="glass-panel chart-card">
          <h3 className="chart-title">SPEND POR ÁREA REQUISITANTE</h3>
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

        <div className="glass-panel chart-card">
          <h3 className="chart-title">TOP 10 FORNECEDORES POR SPEND</h3>
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
          <h3 className="chart-title">TOP 10 PROCESSOS COM MAIOR SAVING</h3>
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
              </tbody>
            </table>
          </div>
        </div>
      </div>
          <div className="dashboard-footer-note">
            * Saving % = ((Proposta Inicial - Proposta Negociada) / Proposta Inicial) | Dados dinâmicos.
          </div>
        </>
      )}
    </div>
  );
}
