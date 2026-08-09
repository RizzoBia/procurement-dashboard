import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Users, Star, Activity, Clock } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import './ExecutiveDashboard.css';

export default function Performance() {
  const { filteredData, loading } = useData();

  const performanceData = useMemo(() => {
    if (!filteredData || filteredData.length === 0) return null;

    let totalCompradores = new Set();
    let slaSumAll = 0;
    let noPrazoAll = 0;
    let totalRcsAll = 0;

    const compMap = {};

    filteredData.forEach(row => {
      const comp = row.comprador;
      if (!comp) return;

      totalCompradores.add(comp);
      
      if (!compMap[comp]) {
        compMap[comp] = { name: comp, pedidos: 0, slaNoPrazo: 0, propIni: 0, saving: 0 };
      }

      const isNoPrazo = row.atrasada_no_prazo && row.atrasada_no_prazo.toUpperCase().includes('NO PRAZO');
      
      compMap[comp].pedidos++;
      if (isNoPrazo) compMap[comp].slaNoPrazo++;
      compMap[comp].propIni += row.proposta_inicial || 0;
      compMap[comp].saving += row.saving_cost_total || 0;

      if (row.sla_atendimento) slaSumAll += row.sla_atendimento;
      if (isNoPrazo) noPrazoAll++;
      totalRcsAll++;
    });

    const perfArray = Object.values(compMap).map(c => {
      const slaPerc = (c.slaNoPrazo / c.pedidos) * 100;
      const savPerc = c.propIni > 0 ? (c.saving / c.propIni) * 100 : 0;
      
      // Normalizando Saving % para caber no Radar de 0 a 100
      // Ajuste simples: apenas multiplicamos por 3, limitando a 100, para o radar ficar visível
      let savingScore = savPerc * 3;
      if (savingScore > 100) savingScore = 100;

      return {
        name: c.name,
        pedidos: c.pedidos,
        sla: parseFloat(slaPerc.toFixed(1)),
        saving: parseFloat(savingScore.toFixed(1)), // Usando score normalizado para o Radar
        savingRealPerc: parseFloat(savPerc.toFixed(1)),
        fullMark: 100
      };
    });

    const topPerformer = [...perfArray].sort((a, b) => ((b.sla + b.saving) / 2) - ((a.sla + a.saving) / 2))[0];
    
    const slaGeral = totalRcsAll > 0 ? (noPrazoAll / totalRcsAll) * 100 : 0;
    const leadTimeGeral = totalRcsAll > 0 ? slaSumAll / totalRcsAll : 0;

    return { 
      totalCompradores: totalCompradores.size,
      topPerformerName: topPerformer ? topPerformer.name : 'N/A',
      slaGeral,
      leadTimeGeral,
      perfArray: perfArray.sort((a,b) => b.pedidos - a.pedidos)
    };
  }, [filteredData]);

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  const { totalCompradores, topPerformerName, slaGeral, leadTimeGeral, perfArray } = performanceData || {};

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">PERFORMANCE DOS COMPRADORES</h1>
          <p className="page-subtitle">Avaliação Individual</p>
        </div>
        <GlobalFilters />
      </header>

      {!performanceData ? (
        <div style={{padding: '60px 20px', textAlign: 'center', color: 'var(--text-secondary)'}}>
          <h2>Nenhum dado encontrado</h2>
          <p>Não há registros de Performance para a combinação de filtros selecionada.</p>
        </div>
      ) : (
        <>
          <div className="kpi-row" style={{marginBottom: 20}}>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">TOTAL COMPRADORES</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#8b5cf6'}}><div className="kpi-mini-icon-bg"><Users size={20} /></div></div>
                <div className="kpi-mini-value">{totalCompradores}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">TOP PERFORMER</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#f59e0b'}}><div className="kpi-mini-icon-bg"><Star size={20} /></div></div>
                <div className="kpi-mini-value">{topPerformerName}</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">SLA GERAL EQUIPE</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#22c55e'}}><div className="kpi-mini-icon-bg"><Activity size={20} /></div></div>
                <div className="kpi-mini-value">{slaGeral.toFixed(1).replace('.', ',')}%</div>
              </div>
            </div>
            <div className="glass-panel kpi-card-mini">
              <h4 className="kpi-mini-title">LEAD TIME EQUIPE</h4>
              <div className="kpi-mini-body">
                <div className="kpi-mini-icon" style={{color: '#3b82f6'}}><div className="kpi-mini-icon-bg"><Clock size={20} /></div></div>
                <div className="kpi-mini-value">{leadTimeGeral.toFixed(1).replace('.', ',')} Dias</div>
              </div>
            </div>
          </div>

          <div className="middle-charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="glass-panel chart-card">
              <h3 className="chart-title">RADAR DE PERFORMANCE (SKILLS)</h3>
              <div className="chart-container" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={perfArray}>
                    <PolarGrid stroke="var(--border-color)" />
                    <PolarAngleAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 12}} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="var(--text-secondary)" tick={{fontSize: 10}}/>
                    <Radar name="SLA %" dataKey="sla" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                    <Radar name="Saving (Score)" dataKey="saving" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="glass-panel chart-card">
              <h3 className="chart-title">PEDIDOS POR COMPRADOR</h3>
              <div className="chart-container" style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={perfArray} layout="vertical" margin={{ left: 10, right: 30, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" horizontal={false} />
                    <XAxis type="number" stroke="var(--text-secondary)" tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="var(--text-secondary)" tickLine={false} axisLine={false} width={80} />
                    <RechartsTooltip 
                      cursor={{fill: 'rgba(255, 255, 255, 0.05)'}}
                      contentStyle={{ backgroundColor: 'var(--panel-bg)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                      labelStyle={{ color: 'var(--text-primary)', fontWeight: 'bold', marginBottom: '4px' }}
                      itemStyle={{ color: 'var(--text-secondary)' }}
                    />
                    <Bar dataKey="pedidos" name="Total Pedidos" fill="#8b5cf6" radius={[0,4,4,0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
