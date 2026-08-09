import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, ComposedChart, Line } from 'recharts';
import { DollarSign, PieChart as PieIcon, Briefcase, TrendingDown } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import './ExecutiveDashboard.css';

const formatCurrency = (val) => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2).replace('.', ',')} Mi`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1).replace('.', ',')} Mil`;
  return `R$ ${val.toFixed(2).replace('.', ',')}`;
};

export default function Financeiro() {
  const { filteredData, loading } = useData();

  const financeiroData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let spendTotal = 0;
    let capexTotal = 0;
    let opexTotal = 0;
    let savingTotal = 0;

    const mensalMap = {};
    const fornecedoresMap = {};

    filteredData.forEach(row => {
      const propNeg = row.proposta_negociada || 0;
      const saving = row.saving_cost_total || 0;
      
      spendTotal += propNeg;
      savingTotal += saving;
      
      if (row.capex_opex && row.capex_opex.toUpperCase() === 'CAPEX') {
        capexTotal += propNeg;
      } else {
        opexTotal += propNeg; // Assuming anything else or OPEX goes here
      }

      // Mensal
      if (row.data_pedido) {
        const date = new Date(row.data_pedido);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!mensalMap[monthYear]) mensalMap[monthYear] = { name: monthYear, spend: 0, time: date.getTime() };
        mensalMap[monthYear].spend += propNeg;
      }

      // Pareto Fornecedores
      if (row.fornecedor) {
        if (!fornecedoresMap[row.fornecedor]) fornecedoresMap[row.fornecedor] = 0;
        fornecedoresMap[row.fornecedor] += propNeg;
      }
    });

    const spendMensal = Object.values(mensalMap).sort((a,b) => a.time - b.time);
    
    // Calcular Pareto
    const fornecedoresArray = Object.entries(fornecedoresMap)
      .map(([name, spend]) => ({ name, spend }))
      .sort((a,b) => b.spend - a.spend); // Ordem descrescente
      
    let acumulado = 0;
    const paretoData = fornecedoresArray.map(f => {
      acumulado += f.spend;
      return {
        name: f.name.substring(0, 15) + (f.name.length > 15 ? '...' : ''),
        fullName: f.name,
        spend: f.spend,
        acumuladoPerc: spendTotal > 0 ? (acumulado / spendTotal) * 100 : 0
      };
    }).slice(0, 15); // Top 15 para não poluir

    return { spendTotal, capexTotal, opexTotal, savingTotal, spendMensal, paretoData };
  }, [filteredData]);

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  const { spendTotal, capexTotal, opexTotal, savingTotal, spendMensal, paretoData } = financeiroData || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">GESTÃO FINANCEIRA</h1>
          <p className="page-subtitle">Spend, Capex e Opex</p>
        </div>
        <GlobalFilters />
      </header>

      {!financeiroData ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <h2>Nenhum dado encontrado</h2>
          <p>Não há registros financeiros para a combinação de filtros selecionada.</p>
        </div>
      ) : (
        <>
          <div className="kpi-row" style={{marginBottom: 20}}>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">SPEND TOTAL</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#ef4444'}}><div className="kpi-mini-icon-bg"><DollarSign size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(spendTotal)}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">CAPEX TOTAL</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#3b82f6'}}><div className="kpi-mini-icon-bg"><Briefcase size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(capexTotal)}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">OPEX TOTAL</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#f59e0b'}}><div className="kpi-mini-icon-bg"><PieIcon size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(opexTotal)}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">SAVING REALIZADO</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#22c55e'}}><div className="kpi-mini-icon-bg"><TrendingDown size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(savingTotal)}</div>
              </div>
            </div>
          </div>

          <div className="middle-charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="glass-panel chart-card">
              <h3 className="chart-title">EVOLUÇÃO DO SPEND MENSAL</h3>
              <div className="chart-container" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spendMensal} margin={{ top: 20, right: 30, bottom: 0, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => formatCurrency(val)} 
                    />
                    <Area type="monotone" name="Spend" dataKey="spend" stroke="#ef4444" fill="rgba(239, 68, 68, 0.2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-panel chart-card">
              <h3 className="chart-title">CURVA DE PARETO - FORNECEDORES (TOP 15)</h3>
              <div className="chart-container" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={paretoData} margin={{ top: 20, right: 20, bottom: 40, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" stroke="var(--text-secondary)" tickLine={false} axisLine={false} fontSize={10} />
                    <YAxis yAxisId="left" stroke="var(--text-secondary)" tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" tickFormatter={(val) => `${val.toFixed(0)}%`} tickLine={false} axisLine={false} domain={[0, 100]} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val, name) => [name === 'acumuladoPerc' ? `${val.toFixed(1)}%` : formatCurrency(val), name === 'acumuladoPerc' ? '% Acumulado' : 'Spend']}
                      labelFormatter={(label, entries) => entries.length > 0 ? entries[0].payload.fullName : label}
                    />
                    <Bar yAxisId="left" dataKey="spend" name="Spend" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                    <Line yAxisId="right" type="monotone" dataKey="acumuladoPerc" name="% Acumulado" stroke="#f59e0b" strokeWidth={2} dot={{r: 2, fill: '#f59e0b'}} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
