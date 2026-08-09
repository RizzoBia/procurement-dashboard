import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from 'recharts';
import { Clock, Target, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import './ExecutiveDashboard.css';

export default function GestaoSLA() {
  const { filteredData, filters, updateFilter, loading } = useData();

  const slaMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let slaSum = 0;
    let atrasadasCount = 0;
    let noPrazoCount = 0;
    let andamentoCount = 0;
    let processos = [];

    const slaPorAreaMap = {};
    const slaMensalMap = {};

    filteredData.forEach(row => {
      if (row.sla_atendimento) slaSum += row.sla_atendimento;
      
      const status = row.atrasada_no_prazo ? row.atrasada_no_prazo.toUpperCase() : '';
      if (status.includes('NO PRAZO')) noPrazoCount++;
      else if (status.includes('ATRASADA')) atrasadasCount++;
      else andamentoCount++;

      // Area grouping
      if (row.area_requisitante) {
        if (!slaPorAreaMap[row.area_requisitante]) slaPorAreaMap[row.area_requisitante] = { name: row.area_requisitante, noPrazo: 0, atrasada: 0, total: 0 };
        slaPorAreaMap[row.area_requisitante].total++;
        if (status.includes('NO PRAZO')) slaPorAreaMap[row.area_requisitante].noPrazo++;
        else if (status.includes('ATRASADA')) slaPorAreaMap[row.area_requisitante].atrasada++;
      }

      // Mensal grouping
      if (row.data_pedido) {
        const date = new Date(row.data_pedido);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!slaMensalMap[monthYear]) slaMensalMap[monthYear] = { name: monthYear, slaSum: 0, count: 0, time: date.getTime() };
        slaMensalMap[monthYear].slaSum += row.sla_atendimento || 0;
        slaMensalMap[monthYear].count++;
      }

      if (status.includes('ATRASADA')) {
        processos.push({
          rc: row.rc,
          pedido: row.pedido_compras,
          comprador: row.comprador,
          area: row.area_requisitante,
          sla: row.sla_atendimento,
          fornecedor: row.fornecedor
        });
      }
    });

    const avgLeadTime = filteredData.length > 0 ? (slaSum / filteredData.length) : 0;
    const slaPerc = filteredData.length > 0 ? (noPrazoCount / filteredData.length) * 100 : 0;

    const slaStatusData = [
      { name: 'No Prazo', value: noPrazoCount, color: '#0f766e' },
      { name: 'Em Andamento', value: andamentoCount, color: '#facc15' },
      { name: 'Atrasada', value: atrasadasCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    const slaPorArea = Object.values(slaPorAreaMap)
      .map(d => ({ ...d, slaPerc: (d.noPrazo / d.total) * 100 }))
      .sort((a,b) => b.slaPerc - a.slaPerc);

    const slaMensal = Object.values(slaMensalMap)
      .sort((a,b) => a.time - b.time)
      .map(m => ({ name: m.name, mediaSLA: m.count > 0 ? m.slaSum / m.count : 0 }));

    const topAtrasos = processos.sort((a,b) => b.sla - a.sla).slice(0, 10);

    return { avgLeadTime, slaPerc, slaStatusData, slaPorArea, slaMensal, topAtrasos, total: filteredData.length, atrasadasCount };
  }, [filteredData]);

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  const { avgLeadTime, slaPerc, slaStatusData, slaPorArea, slaMensal, topAtrasos, total, atrasadasCount } = slaMetrics || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">GESTÃO DE SLA</h1>
          <p className="page-subtitle">Acompanhamento de Prazos e Entregas</p>
        </div>
        <GlobalFilters />
      </header>

      {!slaMetrics ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <h2>Nenhum dado encontrado</h2>
          <p>Não há registros para a combinação de filtros selecionada.</p>
        </div>
      ) : (
        <>
          {/* KPIs Row */}
          <div className="kpi-row">
        <div className="glass-panel kpi-card-mini">
          <h4 className="kpi-mini-title">LEAD TIME MÉDIO</h4>
          <div className="kpi-mini-body">
            <div className="kpi-mini-icon" style={{color: '#3b82f6'}}><div className="kpi-mini-icon-bg"><Clock size={20} /></div></div>
            <div className="kpi-mini-value">{avgLeadTime.toFixed(1).replace('.', ',')} dias</div>
          </div>
        </div>
        <div className="glass-panel kpi-card-mini">
          <h4 className="kpi-mini-title">SLA DE ATENDIMENTO</h4>
          <div className="kpi-mini-body">
            <div className="kpi-mini-icon" style={{color: '#22c55e'}}><div className="kpi-mini-icon-bg"><Target size={20} /></div></div>
            <div className="kpi-mini-value">{slaPerc.toFixed(1).replace('.', ',')}%</div>
          </div>
        </div>
        <div className="glass-panel kpi-card-mini">
          <h4 className="kpi-mini-title">PROCESSOS ATRASADOS</h4>
          <div className="kpi-mini-body">
            <div className="kpi-mini-icon" style={{color: '#ef4444'}}><div className="kpi-mini-icon-bg"><AlertTriangle size={20} /></div></div>
            <div className="kpi-mini-value">{atrasadasCount}</div>
          </div>
        </div>
        <div className="glass-panel kpi-card-mini">
          <h4 className="kpi-mini-title">TOTAL DE PROCESSOS</h4>
          <div className="kpi-mini-body">
            <div className="kpi-mini-icon" style={{color: '#0f766e'}}><div className="kpi-mini-icon-bg"><CheckCircle2 size={20} /></div></div>
            <div className="kpi-mini-value">{total}</div>
          </div>
        </div>
      </div>

      <div className="middle-charts-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
        <div className="glass-panel chart-card">
          <h3 className="chart-title">STATUS DOS PROCESSOS</h3>
          <div className="chart-container donut-container" style={{ height: 300, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slaStatusData} innerRadius={70} outerRadius={100} paddingAngle={2} dataKey="value" stroke="none">
                  {slaStatusData.map((entry, index) => (
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
            <div className="donut-center" style={{top: '45%'}}>
              <strong>{total}</strong>
              <span>Total</span>
            </div>
            <div className="donut-legend" style={{marginTop: 10}}>
              {slaStatusData.map(d => (
                <div className="dl-item" key={d.name}>
                  <div><span className="dl-color" style={{backgroundColor: d.color}}></span> {d.name}</div>
                  <div>{(total > 0 ? (d.value / total * 100) : 0).toFixed(1)}% <span className="dl-val">{d.value}</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="glass-panel chart-card">
          <h3 className="chart-title">EVOLUÇÃO DO LEAD TIME MÉDIO (Dias)</h3>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaMensal} margin={{ top: 20, right: 30, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
                <XAxis dataKey="name" fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                <YAxis fontSize={12} stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(val) => `${val.toFixed(1)} dias`} 
                />
                <Line type="monotone" dataKey="mediaSLA" name="Lead Time" stroke="#3b82f6" strokeWidth={3} dot={{r: 5, fill: '#3b82f6'}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel chart-card">
          <h3 className="chart-title">% DE SLA POR ÁREA REQUISITANTE</h3>
          <div className="chart-container" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={slaPorArea} layout="vertical" margin={{ top: 0, right: 30, bottom: 0, left: 30 }}>
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" fontSize={11} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} />
                <RechartsTooltip 
                  cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                  contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                  itemStyle={{ color: 'var(--text-secondary)' }}
                  formatter={(val) => `${val.toFixed(1)}%`} 
                />
                <Bar dataKey="slaPerc" fill="#22c55e" barSize={12} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bottom-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="glass-panel chart-card">
          <h3 className="chart-title">PROCESSOS ATRASADOS (Maiores Lead Times)</h3>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>RC</th>
                  <th>Pedido</th>
                  <th>Comprador</th>
                  <th>Área</th>
                  <th>Fornecedor</th>
                  <th className="text-right">SLA (Dias)</th>
                </tr>
              </thead>
              <tbody>
                {topAtrasos.map((row, i) => (
                  <tr key={i}>
                    <td>{row.rc}</td>
                    <td>{row.pedido}</td>
                    <td>{row.comprador}</td>
                    <td>{row.area}</td>
                    <td>{row.fornecedor}</td>
                    <td className="text-right" style={{color: '#ef4444', fontWeight: 600}}>{row.sla}</td>
                  </tr>
                ))}
                {topAtrasos.length === 0 && (
                  <tr><td colSpan="6" style={{textAlign: 'center', padding: '20px'}}>Nenhum processo atrasado!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
