import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';


const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#a855f7', '#ec4899', '#06b6d4', '#8b5cf6'];

const formatCurrency = (val) => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(2).replace('.', ',')} Mi`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(1).replace('.', ',')} Mil`;
  return `R$ ${val.toFixed(2).replace('.', ',')}`;
};

export default function Saving() {
  const { filteredData, loading } = useData();

  const savingData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let savingTotal = 0;
    let propIniTotal = 0;
    let maxSaving = 0;
    let savingCount = 0;

    const mensalMap = {};
    const compradorMap = {};

    filteredData.forEach(row => {
      const saving = row.saving_cost_total || 0;
      const propIni = row.proposta_inicial || 0;
      
      savingTotal += saving;
      propIniTotal += propIni;
      if (saving > maxSaving) maxSaving = saving;
      if (saving > 0) savingCount++;

      // Agrupamento Mensal
      if (row.data_pedido) {
        const date = new Date(row.data_pedido);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!mensalMap[monthYear]) mensalMap[monthYear] = { name: monthYear, saving: 0, time: date.getTime() };
        mensalMap[monthYear].saving += saving;
      }

      // Agrupamento Comprador
      if (row.comprador && saving > 0) {
        if (!compradorMap[row.comprador]) compradorMap[row.comprador] = 0;
        compradorMap[row.comprador] += saving;
      }
    });

    const savingPerc = propIniTotal > 0 ? (savingTotal / propIniTotal) * 100 : 0;
    const savingMedio = savingCount > 0 ? savingTotal / savingCount : 0;

    const savingMensal = Object.values(mensalMap).sort((a,b) => a.time - b.time);
    const savingComprador = Object.entries(compradorMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value)
      .slice(0, 7); // top 7 compradores

    return { savingTotal, savingPerc, savingMedio, maxSaving, savingMensal, savingComprador };
  }, [filteredData]);

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  const { savingTotal, savingPerc, savingMedio, maxSaving, savingMensal, savingComprador } = savingData || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">SAVING</h1>
          <p className="page-subtitle">Resultados de Negociações</p>
        </div>
        <GlobalFilters />
      </header>

      {!savingData ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <h2>Nenhum dado encontrado</h2>
          <p>Não há registros de Saving para a combinação de filtros selecionada.</p>
        </div>
      ) : (
        <>
          <div className="kpi-row" style={{marginBottom: 20}}>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">SAVING TOTAL</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#22c55e'}}><div className="kpi-mini-icon-bg"><TrendingUp size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(savingTotal)}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">SAVING %</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#3b82f6'}}><div className="kpi-mini-icon-bg"><Target size={20} /></div></div>
                <div className="kpi-mini-value">{savingPerc.toFixed(1).replace('.', ',')}%</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">SAVING MÉDIO POR PROCESSO</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#a855f7'}}><div className="kpi-mini-icon-bg"><DollarSign size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(savingMedio)}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">MAIOR SAVING ÚNICO</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#f59e0b'}}><div className="kpi-mini-icon-bg"><Award size={20} /></div></div>
                <div className="kpi-mini-value">{formatCurrency(maxSaving)}</div>
              </div>
            </div>
          </div>

          <div className="middle-charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="glass-panel chart-card">
              <h3 className="chart-title">EVOLUÇÃO DO SAVING MENSAL</h3>
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={savingMensal} margin={{ top: 20, right: 30, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false}/>
                    <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => formatCurrency(val)} 
                    />
                    <Bar dataKey="saving" name="Saving" fill="#22c55e" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-panel chart-card">
              <h3 className="chart-title">TOP SAVING POR COMPRADOR</h3>
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={savingComprador} innerRadius={60} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name">
                      {savingComprador.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => formatCurrency(val)} 
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{fontSize: '12px', color: 'var(--text-secondary)'}}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
