import React, { useState } from 'react';
import { Search, FileSpreadsheet } from 'lucide-react';
import { useData } from '../context/DataContext';
import GlobalFilters from '../components/GlobalFilters';
import { exportToExcel } from '../utils/exportUtils';
import './ExecutiveDashboard.css';

const formatCurrency = (val) => {
  return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export default function Operacional() {
  const { filteredData, loading } = useData();
  const [searchTerm, setSearchTerm] = useState('');

  const displayData = (filteredData || []).filter(row => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (row.rc && row.rc.toLowerCase().includes(term)) ||
      (row.pedido_compras && String(row.pedido_compras).toLowerCase().includes(term)) ||
      (row.comprador && row.comprador.toLowerCase().includes(term)) ||
      (row.fornecedor && row.fornecedor.toLowerCase().includes(term))
    );
  });

  const handleExportExcel = () => {
    const exportData = displayData.map(row => ({
      'RC': row.rc || '-',
      'Pedido': row.pedido_compras || '-',
      'Comprador': row.comprador || '-',
      'Área Requisitante': row.area_requisitante || '-',
      'Fornecedor': row.fornecedor || '-',
      'Tipo': row.tipo || '-',
      'Material / Serviço': row.material_servico || '-',
      'Categoria': row.capex_opex || 'OPEX',
      'Proposta Inicial (R$)': row.proposta_inicial || 0,
      'Proposta Negociada (R$)': row.proposta_negociada || 0,
      'Saving Total (R$)': row.saving_cost_total || 0,
      'SLA Atendimento (Dias)': row.sla_atendimento || 0,
      'Status SLA': row.atrasada_no_prazo || 'NO PRAZO',
      'Data Aprovação RC': row.data_aprovacao_rc || '-',
      'Data Pedido': row.data_pedido || '-'
    }));
    exportToExcel(exportData, `gestao_operacional_${new Date().toISOString().slice(0, 10)}`, 'Operacional');
  };

  if (loading) return <div className="dashboard-container" style={{padding: 40}}><h2>Carregando dados...</h2></div>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">GESTÃO OPERACIONAL</h1>
          <p className="page-subtitle">Tabela Detalhada de Processos</p>
        </div>
        <GlobalFilters />
      </header>

      <div className="glass-panel" style={{marginBottom: '20px', padding: '16px'}}>
        <div style={{display:'flex', justifyContent: 'space-between', gap:'16px', alignItems:'center', flexWrap: 'wrap'}}>
          <div style={{ position: 'relative', width: '100%', maxWidth: '420px' }}>
            <Search size={18} color="var(--text-secondary)" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input 
              type="text" 
              placeholder="Buscar por RC, Pedido, Comprador ou Fornecedor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '9px 12px 9px 38px', 
                borderRadius: '12px', 
                border: '1px solid var(--border-color)', 
                background: 'var(--panel-bg)', 
                color: 'var(--text-primary)',
                width: '100%',
                outline: 'none',
                fontSize: '0.85rem'
              }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span style={{color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: 600}}>
              {displayData.length} registros encontrados
            </span>
            <button
              type="button"
              className="export-excel-btn"
              onClick={handleExportExcel}
              title="Exportar dados filtrados para planilha Excel (.xlsx)"
            >
              <FileSpreadsheet size={16} />
              <span>Exportar Excel</span>
            </button>
          </div>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{overflowX: 'auto', maxHeight: '600px', overflowY: 'auto'}}>
          <table className="data-table" style={{width: '100%'}}>
            <thead style={{ position: 'sticky', top: 0, background: 'var(--panel-bg)', zIndex: 1 }}>
              <tr>
                <th>RC</th>
                <th>Pedido</th>
                <th>Comprador</th>
                <th>Área Requisitante</th>
                <th>Fornecedor</th>
                <th className="text-right">Spend</th>
                <th className="text-right">Saving</th>
                <th className="text-right">SLA Real</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {displayData.map((row, i) => (
                <tr key={i}>
                  <td>{row.rc}</td>
                  <td>{row.pedido_compras}</td>
                  <td>{row.comprador}</td>
                  <td>{row.area_requisitante}</td>
                  <td>{row.fornecedor}</td>
                  <td className="text-right">{formatCurrency(row.proposta_negociada || 0)}</td>
                  <td className="text-right" style={{color: (row.saving_cost_total || 0) > 0 ? '#22c55e' : 'inherit'}}>
                    {formatCurrency(row.saving_cost_total || 0)}
                  </td>
                  <td className="text-right">{row.sla_atendimento || 0}</td>
                  <td>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: row.atrasada_no_prazo && row.atrasada_no_prazo.toUpperCase().includes('NO PRAZO') ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: row.atrasada_no_prazo && row.atrasada_no_prazo.toUpperCase().includes('NO PRAZO') ? '#22c55e' : '#ef4444'
                    }}>
                      {row.atrasada_no_prazo}
                    </span>
                  </td>
                </tr>
              ))}
              {displayData.length === 0 && (
                <tr>
                  <td colSpan="9" style={{textAlign: 'center', padding: '30px', color: 'var(--text-secondary)'}}>
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
