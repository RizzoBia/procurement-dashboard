import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import './AdminUpload.css';

export default function AdminUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const processAndUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatus(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      let totalInserted = 0;

      if (workbook.SheetNames.includes('Controle PCs')) {
        const pcsSheet = workbook.Sheets['Controle PCs'];
        const pcsData = XLSX.utils.sheet_to_json(pcsSheet);
        
        const pcsPayload = pcsData.map(row => {
          const pedido = row['Pedido Compras'] ? String(row['Pedido Compras']) : '';
          const rc = row['RC'] ? String(row['RC']) : '';
          const fornecedor = row['Fornecedor'] ? String(row['Fornecedor']) : '';
          const proposta = row[' Proposta\r\n Negociada '] ? String(row[' Proposta\r\n Negociada ']) : '';
          const uniqId = `${pedido}_${rc}_${fornecedor}_${proposta}`.replace(/\s+/g, '');

          return {
            id: uniqId,
            pedido_compras: pedido || null,
            rc: rc || null,
          comprador: row['Comprador'],
          area_requisitante: row['Área Requisitante'],
          fornecedor: row['Fornecedor'],
          tipo: row['Tipo'],
          proposta_inicial: row[' Proposta\r\n Inicial '] || 0,
          proposta_negociada: row[' Proposta\r\n Negociada '] || 0,
          saving_cost_total: row[' Saving + Cost \r\nTotal '] || 0,
          percentual_reducao: row['% Redução'] || 0,
          sla_atendimento: row['SLA Atendimento'] || 0,
          atrasada_no_prazo: row['Atrasada / No prazo'],
          data_aprovacao_rc: row['Data Última Aprovação RC'] ? new Date(Math.round((row['Data Última Aprovação RC'] - 25569) * 86400 * 1000)).toISOString() : null,
          data_pedido: row['Data\r\nPedido'] ? new Date(Math.round((row['Data\r\nPedido'] - 25569) * 86400 * 1000)).toISOString() : null
          };
        }).filter(row => row.id && row.pedido_compras);

        const batchSize = 1000;
        for (let i = 0; i < pcsPayload.length; i += batchSize) {
          const batch = pcsPayload.slice(i, i + batchSize);
          const { error } = await supabase.from('controle_pcs').upsert(batch, { onConflict: 'id' });
          if (error) throw error;
          totalInserted += batch.length;
        }
      }

      setStatus({ type: 'success', message: `Upload concluído! ${totalInserted} registros de Controle PCs processados.` });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `Erro ao processar: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">Administração do Sistema</h1>
          <p className="page-subtitle">Atualização da base de dados</p>
        </div>
      </header>

      <div className="upload-card glass-panel">
        <div className="upload-header">
          <FileSpreadsheet size={32} className="upload-icon" />
          <h2>Upload de Planilha de Compras</h2>
          <p>Selecione a planilha Excel mais recente contendo as abas "Controle PCs", etc.</p>
        </div>

        <div className="upload-area">
          <input 
            type="file" 
            accept=".xlsx, .xls" 
            onChange={handleFileChange} 
            id="file-upload" 
            className="file-input"
          />
          <label htmlFor="file-upload" className="file-label">
            <Upload size={20} />
            {file ? file.name : "Escolher arquivo .xlsx"}
          </label>
        </div>

        {file && (
          <button 
            className="btn-upload" 
            onClick={processAndUpload} 
            disabled={isUploading}
          >
            {isUploading ? "Processando e Enviando..." : "Iniciar Upload"}
          </button>
        )}

        {status && (
          <div className={`status-message ${status.type}`}>
            {status.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            <span>{status.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}
