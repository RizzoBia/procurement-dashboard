import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useData } from '../context/DataContext';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import './AdminUpload.css';

export default function AdminUpload() {
  const { refreshData } = useData();
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState(null);
  const [cleanSync, setCleanSync] = useState(true);

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
      let totalFornecedores = 0;

      // 1. Processar Cadastro Fornecedores
      const fornSheetName = workbook.SheetNames.find(s => {
        const lower = s.toLowerCase();
        return lower.includes('fornecedor') || lower.includes('cadastro');
      });

      if (fornSheetName) {
        const fornSheet = workbook.Sheets[fornSheetName];
        const fornData = XLSX.utils.sheet_to_json(fornSheet);

        const fornPayload = fornData.map((row, idx) => {
          const getVal = (...keys) => {
            for (const k of keys) {
              for (const rowKey of Object.keys(row)) {
                const cleanRowKey = rowKey.replace(/[\r\n\s_]+/g, '').toLowerCase();
                const cleanTarget = k.replace(/[\r\n\s_]+/g, '').toLowerCase();
                if (cleanRowKey.includes(cleanTarget)) {
                  const val = row[rowKey];
                  return val !== undefined && val !== null ? String(val).trim() : '';
                }
              }
            }
            return '';
          };

          const cod = getVal('cod', 'codigo');
          const cat = getVal('categoria');
          const razao = getVal('razaosocial', 'razao');
          const fantasia = getVal('nomefantasia', 'fantasia') || razao;
          const cnpj = getVal('cnpj');
          const endereco = getVal('endereco');
          const cidade = getVal('cidade');
          const uf = getVal('uf').toUpperCase();
          const cep = getVal('cep');
          const pais = getVal('pais');
          const contato = getVal('contato');
          const tel = getVal('telefone', 'tel');
          const email = getVal('email', 'e-mail');
          
          const compNetRaw = getVal('comprainternet', 'internet').toUpperCase();
          const compNet = (compNetRaw.includes('SIM') || compNetRaw === 'S') ? 'SIM' : 'NÃO';
          
          const fornLocRaw = getVal('fornecedorlocal', 'local').toUpperCase();
          const fornLoc = (fornLocRaw.includes('SIM') || fornLocRaw === 'S') ? 'SIM' : 'NÃO';

          if (!razao && !fantasia && !cnpj) return null;

          return {
            codigo: cod || String(300000 + idx + 1),
            categoria: cat || 'Outros',
            razao_social: razao || fantasia,
            nome_fantasia: fantasia || razao,
            cnpj: cnpj || '',
            endereco: endereco || '',
            cidade: cidade || 'Não informada',
            uf: uf || 'ND',
            cep: cep || '',
            pais: pais || 'BRASIL',
            contato: contato || '',
            telefone: tel || '',
            email: email || '',
            compra_internet: compNet,
            fornecedor_local: fornLoc,
            status: 'Ativo'
          };
        }).filter(Boolean);

        if (fornPayload.length > 0) {
          localStorage.setItem('procurement_custom_fornecedores', JSON.stringify(fornPayload));
          totalFornecedores = fornPayload.length;
        }
      }

      // 2. Processar Controle PCs
      if (workbook.SheetNames.includes('Controle PCs')) {
        const pcsSheet = workbook.Sheets['Controle PCs'];
        const pcsData = XLSX.utils.sheet_to_json(pcsSheet);
        
        const pcsPayload = pcsData.map((row, idx) => {
          const pedido = row['Pedido Compras'] ? String(row['Pedido Compras']).trim() : '';
          const rc = row['RC'] ? String(row['RC']).trim() : '';
          const fornecedor = row['Fornecedor'] ? String(row['Fornecedor']).trim() : '';
          const propNeg = row[' Proposta\r\n Negociada '] || row['Proposta Negociada'] || row['Proposta\n Negociada'] || 0;
          const propIni = row[' Proposta\r\n Inicial '] || row['Proposta Inicial'] || row['Proposta\n Inicial'] || 0;
          const saving = row[' Saving + Cost \r\nTotal '] || row['Saving + Cost Total'] || row['Saving + Cost \nTotal'] || 0;
          const uniqId = `${pedido}_${rc}_${fornecedor}_${propNeg}_${idx}`.replace(/\s+/g, '_');

          const parseExcelDate = (val) => {
            if (!val) return null;
            if (typeof val === 'number') {
              return new Date(Math.round((val - 25569) * 86400 * 1000)).toISOString();
            }
            const d = new Date(val);
            return !isNaN(d.getTime()) ? d.toISOString() : null;
          };

          const capexRaw = row['CAPEX / OPEX'] || row['CAPEX/OPEX'] || row['Capex / Opex'] || row['Capex/Opex'] || row['Natureza'] || row['Capex'] || '';
          const capexVal = String(capexRaw).trim().toUpperCase().includes('CAPEX') ? 'CAPEX' : 'OPEX';

          return {
            id: uniqId,
            pedido_compras: pedido || null,
            rc: rc || null,
            comprador: row['Comprador'] ? String(row['Comprador']).trim() : null,
            area_requisitante: row['Área Requisitante'] ? String(row['Área Requisitante']).trim() : null,
            fornecedor: fornecedor || null,
            tipo: row['Tipo'] ? String(row['Tipo']).trim() : null,
            material_servico: row['Material / Serviço'] ? String(row['Material / Serviço']).trim() : null,
            capex_opex: capexVal,
            proposta_inicial: typeof propIni === 'number' ? propIni : parseFloat(propIni) || 0,
            proposta_negociada: typeof propNeg === 'number' ? propNeg : parseFloat(propNeg) || 0,
            saving_cost_total: typeof saving === 'number' ? saving : parseFloat(saving) || 0,
            percentual_reducao: row['% Redução'] || 0,
            sla_atendimento: row['SLA Atendimento'] || 0,
            atrasada_no_prazo: row['Atrasada / No prazo'] ? String(row['Atrasada / No prazo']).trim() : 'NO PRAZO',
            data_aprovacao_rc: parseExcelDate(row['Data Última Aprovação RC']),
            data_pedido: parseExcelDate(row['Data\r\nPedido'] || row['Data\nPedido'] || row['Data Pedido'])
          };
        }).filter(row => row.id && (row.pedido_compras || row.rc));

        if (cleanSync) {
          // Purge existing table to prevent ghost/duplicate records
          await supabase.from('controle_pcs').delete().neq('id', '___non_existent___');
        }

        const batchSize = 100;
        for (let i = 0; i < pcsPayload.length; i += batchSize) {
          const batch = pcsPayload.slice(i, i + batchSize);
          let { error } = await supabase.from('controle_pcs').upsert(batch, { onConflict: 'id' });
          if (error && error.message && error.message.includes('capex_opex')) {
            const strippedBatch = batch.map(({ capex_opex, ...rest }) => rest);
            const retryRes = await supabase.from('controle_pcs').upsert(strippedBatch, { onConflict: 'id' });
            if (retryRes.error) throw retryRes.error;
          } else if (error) {
            throw error;
          }
          totalInserted += batch.length;
        }
      }

      if (refreshData) {
        await refreshData();
      }

      const msgParts = [];
      if (totalInserted > 0) msgParts.push(`${totalInserted} registros de Controle PCs`);
      if (totalFornecedores > 0) msgParts.push(`${totalFornecedores} fornecedores cadastrados`);

      setStatus({ 
        type: 'success', 
        message: `Upload concluído com sucesso! ${msgParts.join(' e ')} sincronizados.` 
      });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', message: `Erro ao processar planilha: ${err.message}` });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header-flex">
        <div className="header-titles">
          <h1 className="page-title">Administração do Sistema</h1>
          <p className="page-subtitle">Sincronização e Atualização da Base de Dados</p>
        </div>
      </header>

      <div className="upload-card glass-panel">
        <div className="upload-header">
          <FileSpreadsheet size={32} className="upload-icon" />
          <h2>Upload de Planilha de Compras</h2>
          <p>Selecione a planilha Excel mais recente contendo as abas "Controle PCs", "Cadastro Fornecedores", etc.</p>
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

        <div style={{ margin: '14px 0', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <input 
            type="checkbox" 
            id="clean-sync" 
            checked={cleanSync} 
            onChange={e => setCleanSync(e.target.checked)} 
          />
          <label htmlFor="clean-sync" style={{ cursor: 'pointer', color: 'var(--text-primary)' }}>
            <strong>Sincronização Limpa:</strong> substituir base anterior para evitar duplicidades e registros fantasmas (Recomendado).
          </label>
        </div>

        {file && (
          <button 
            className="btn-upload" 
            onClick={processAndUpload} 
            disabled={isUploading}
          >
            {isUploading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Processando e Sincronizando...</span>
              </>
            ) : (
              "Iniciar Upload e Sincronização"
            )}
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
