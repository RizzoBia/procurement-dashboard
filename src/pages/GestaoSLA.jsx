import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Clock, Target, AlertTriangle, CheckCircle2, Download } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import ChartHeader from '../components/ChartHeader';
import { exportToExcel } from '../utils/exportUtils';
import './ExecutiveDashboard.css';

export default function GestaoSLA() {
  const { filteredData, loading } = useData();

  const slaMetrics = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let slaSum = 0;
    let atrasadasCount = 0;
    let noPrazoCount = 0;
    let uniquePedidos = new Set();
    let processos = [];

    const slaPorAreaMap = {};
    const pedidosPorAreaMap = {};
    const slaMensalMap = {};

    filteredData.forEach(row => {
      if (row.pedido_compras) uniquePedidos.add(row.pedido_compras);
      if (row.sla_atendimento) slaSum += row.sla_atendimento;
      
      const status = row.atrasada_no_prazo ? row.atrasada_no_prazo.toUpperCase() : '';
      if (status.includes('NO PRAZO')) noPrazoCount++;
      else if (status.includes('ATRASADA')) atrasadasCount++;

      // Pedidos por Area
      if (row.area_requisitante) {
        if (!pedidosPorAreaMap[row.area_requisitante]) {
          pedidosPorAreaMap[row.area_requisitante] = { name: row.area_requisitante, pedidos: 0, volume: 0 };
        }
        pedidosPorAreaMap[row.area_requisitante].volume += 1;
        if (row.pedido_compras) {
          pedidosPorAreaMap[row.area_requisitante].pedidos += 1;
        }

        if (!slaPorAreaMap[row.area_requisitante]) {
          slaPorAreaMap[row.area_requisitante] = { name: row.area_requisitante, noPrazo: 0, atrasada: 0, total: 0 };
        }
        slaPorAreaMap[row.area_requisitante].total++;
        if (status.includes('NO PRAZO')) slaPorAreaMap[row.area_requisitante].noPrazo++;
        else if (status.includes('ATRASADA')) slaPorAreaMap[row.area_requisitante].atrasada++;
      }

      // Mensal grouping
      const dateStr = row.data_pedido || row.data_aprovacao_rc;
      if (dateStr) {
        const date = new Date(dateStr);
        const monthYear = `${date.toLocaleString('pt-BR', { month: 'short' })}/${date.getFullYear().toString().slice(-2)}`;
        if (!slaMensalMap[monthYear]) slaMensalMap[monthYear] = { name: monthYear, slaSum: 0, count: 0, time: date.getTime() };
        slaMensalMap[monthYear].slaSum += row.sla_atendimento || 0;
        slaMensalMap[monthYear].count++;
      }

      if (status.includes('ATRASADA')) {
        processos.push({
          rc: row.rc,
          pedido: row.pedido_compras || '-',
          comprador: row.comprador,
          area: row.area_requisitante,
          sla: row.sla_atendimento,
          fornecedor: row.fornecedor
        });
      }
    });

    const avgLeadTime = filteredData.length > 0 ? (slaSum / filteredData.length) : 0;
    const slaPerc = filteredData.length > 0 ? (noPrazoCount / filteredData.length) * 100 : 0;

    const pedidosPorArea = Object.values(pedidosPorAreaMap)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 8);

    const slaPorArea = Object.values(slaPorAreaMap)
      .map(d => ({ ...d, slaPerc: d.total > 0 ? (d.noPrazo / d.total) * 100 : 0 }))
      .sort((a,b) => b.slaPerc - a.slaPerc)
      .slice(0, 8);

    const slaMensal = Object.values(slaMensalMap)
      .sort((a,b) => a.time - b.time)
      .map(m => ({ name: m.name, mediaSLA: m.count > 0 ? m.slaSum / m.count : 0 }));

    const topAtrasos = processos.sort((a,b) => b.sla - a.sla).slice(0, 10);

    return { 
      avgLeadTime, 
      slaPerc, 
      pedidosPorArea, 
      slaPorArea, 
      slaMensal, 
      topAtrasos, 
      total: filteredData.length, 
      atrasadasCount 
    };
  }, [filteredData]);

  const handleExportAtrasos = () => {
    if (!slaMetrics?.topAtrasos) return;
    const exportData = slaMetrics.topAtrasos.map(p => ({
      'RC': p.rc,
      'Pedido': p.pedido,
      'Comprador': p.comprador,
      'Área': p.area,
      'Fornecedor': p.fornecedor,
      'SLA (Dias)': p.sla
    }));
    exportToExcel(exportData, 'pedidos_em_atraso_sla', 'Pedidos em Atraso');
  };

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  const { avgLeadTime, slaPerc, pedidosPorArea, slaPorArea, slaMensal, topAtrasos, total, atrasadasCount } = slaMetrics || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">GESTÃO DE SLA</h1>
          <p className="page-subtitle">Acompanhamento de Prazos, Demandas e Entregas</p>
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
              <h4 className="kpi-mini-title">PEDIDOS EM ATRASO</h4>
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
            <div id="chart-pedidos-area-sla" className="glass-panel chart-card">
              <ChartHeader title="QUANTIDADE DE PEDIDOS POR ÁREA" chartId="chart-pedidos-area-sla" downloadName="pedidos_por_area" />
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={pedidosPorArea} layout="vertical" margin={{ top: 10, right: 25, bottom: 0, left: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" fontSize={11} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => [`${val} pedidos`, 'Volume']} 
                    />
                    <Bar dataKey="volume" fill="#0f766e" barSize={14} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="chart-leadtime-mensal" className="glass-panel chart-card">
              <ChartHeader title="EVOLUÇÃO DO LEAD TIME MÉDIO (Dias)" chartId="chart-leadtime-mensal" downloadName="evolucao_lead_time" />
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
                      formatter={(val) => [`${val.toFixed(1)} dias`, 'Lead Time Médio']} 
                    />
                    <Line type="monotone" dataKey="mediaSLA" name="Lead Time" stroke="#3b82f6" strokeWidth={3} dot={{r: 5, fill: '#3b82f6'}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div id="chart-sla-area" className="glass-panel chart-card">
              <ChartHeader title="% DE SLA POR ÁREA REQUISITANTE" chartId="chart-sla-area" downloadName="sla_por_area" />
              <div className="chart-container" style={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={slaPorArea} layout="vertical" margin={{ top: 10, right: 30, bottom: 0, left: 20 }}>
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" fontSize={11} stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                      formatter={(val) => [`${val.toFixed(1)}%`, '% SLA no Prazo']} 
                    />
                    <Bar dataKey="slaPerc" fill="#22c55e" barSize={14} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="bottom-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
            <div className="glass-panel chart-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 className="chart-title" style={{ margin: 0 }}>PEDIDOS EM ATRASO (Maiores Lead Times)</h3>
                <button 
                  onClick={handleExportAtrasos}
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
                      <tr><td colSpan="6" style={{textAlign: 'center', padding: '24px', color: 'var(--text-secondary)'}}>Nenhum pedido em atraso no período! 🎉</td></tr>
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
