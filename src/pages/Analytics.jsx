import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart, Line, Cell, Legend } from 'recharts';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import './ExecutiveDashboard.css';

const formatCurrency = (val) => {
  if (val >= 1000000) return `R$ ${(val / 1000000).toFixed(1).replace('.', ',')} Mi`;
  if (val >= 1000) return `R$ ${(val / 1000).toFixed(0).replace('.', ',')}k`;
  return `R$ ${val.toFixed(0).replace('.', ',')}`;
};

export default function Analytics() {
  const { filteredData, loading } = useData();

  const analyticsData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    const catMap = {};
    const fornMap = {};

    filteredData.forEach(row => {
      // Área / Categoria
      const cat = row.area_requisitante || row.material_servico || row.tipo || 'Outros';
      if (!catMap[cat]) catMap[cat] = { name: cat, spend: 0, saving: 0 };
      catMap[cat].spend += row.proposta_negociada || 0;
      catMap[cat].saving += row.saving_cost_total || 0;

      // Fornecedor
      const forn = row.fornecedor || 'Desconhecido';
      if (!fornMap[forn]) fornMap[forn] = { name: forn, spend: 0, slaSoma: 0, processos: 0 };
      fornMap[forn].spend += row.proposta_negociada || 0;
      fornMap[forn].slaSoma += row.sla_atendimento || 0;
      fornMap[forn].processos += 1;
    });

    const categorias = Object.values(catMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 8) // Reduzido para 8 para dar mais espaço (respiração) no gráfico
      .map(c => ({
        ...c,
        name: c.name.length > 15 ? c.name.substring(0, 15) + '...' : c.name
      }));

    const fornecedores = Object.values(fornMap)
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10) // Reduzido para 10 para ficar mais limpo
      .map(f => ({
        name: f.name.length > 12 ? f.name.substring(0, 12) + '...' : f.name,
        fullName: f.name,
        spend: f.spend,
        slaMedio: parseFloat((f.processos > 0 ? f.slaSoma / f.processos : 0).toFixed(1))
      }));

    return { categorias, fornecedores };
  }, [filteredData]);

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">ANALYTICS</h1>
          <p className="page-subtitle">Visões Estratégicas e Consolidadas</p>
        </div>
        <GlobalFilters />
      </header>
      
      {!analyticsData ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <h2>Nenhum dado encontrado</h2>
          <p>Não há registros de Analytics para a combinação de filtros selecionada.</p>
        </div>
      ) : (
        <div className="charts-grid">
          
          {/* Gráfico 1: Categorias/Áreas (Vertical BarChart Limpo) */}
          <div className="glass-panel chart-card" style={{gridColumn: '1 / -1'}}>
            <h3 className="chart-title">DISTRIBUIÇÃO DE SPEND E SAVING POR ÁREA (TOP 8)</h3>
            <div className="chart-container" style={{ height: 380, marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analyticsData.categorias} margin={{ top: 10, right: 10, bottom: 20, left: 10 }} barSize={40}>
                  <defs>
                    <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    </linearGradient>
                    <linearGradient id="colorSaving" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} dy={10} fontSize={11} />
                  <YAxis stroke="var(--text-secondary)" tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} fontSize={11} />
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255, 255, 255, 0.03)'}}
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '12px' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    formatter={(value) => formatCurrency(value)}
                  />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{fontSize: '12px', color: 'var(--text-secondary)'}} />
                  <Bar dataKey="spend" name="Spend Negociado" fill="url(#colorSpend)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="saving" name="Saving Realizado" fill="url(#colorSaving)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Gráfico 2: Fornecedores (Composed Chart Premium) */}
          <div className="glass-panel chart-card" style={{gridColumn: '1 / -1', marginTop: '16px'}}>
            <h3 className="chart-title">PERFORMANCE DE FORNECEDORES: SPEND VS SLA (TOP 10)</h3>
            <div className="chart-container" style={{ height: 380, marginTop: '20px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={analyticsData.fornecedores} margin={{ top: 10, right: 10, bottom: 30, left: 10 }} barSize={50}>
                  <defs>
                    <linearGradient id="colorFornSpend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="var(--text-secondary)" tickLine={false} axisLine={false} dy={10} fontSize={11} />
                  <YAxis yAxisId="left" stroke="var(--text-secondary)" tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`} tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" tickFormatter={(val) => `${val} d`} tickLine={false} axisLine={false} fontSize={11} />
                  
                  <RechartsTooltip 
                    cursor={{fill: 'rgba(255, 255, 255, 0.03)'}}
                    contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', padding: '12px' }}
                    itemStyle={{ fontSize: '13px', fontWeight: 600 }}
                    formatter={(value, name) => {
                      if (name === 'Spend Volume') return formatCurrency(value);
                      if (name === 'SLA Médio de Entrega') return `${value} Dias`;
                      return value;
                    }}
                    labelFormatter={(label, entries) => entries.length > 0 ? entries[0].payload.fullName : label}
                  />
                  <Legend verticalAlign="top" height={40} iconType="circle" wrapperStyle={{fontSize: '12px', color: 'var(--text-secondary)'}} />
                  
                  <Bar yAxisId="left" dataKey="spend" name="Spend Volume" fill="url(#colorFornSpend)" radius={[8, 8, 0, 0]} />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="slaMedio" 
                    name="SLA Médio de Entrega" 
                    stroke="#f43f5e" 
                    strokeWidth={3} 
                    dot={{r: 5, fill: '#f43f5e', strokeWidth: 3, stroke: 'var(--panel-bg)'}} 
                    activeDot={{r: 8}}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
