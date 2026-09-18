import React, { useState, useMemo } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, ChevronDown, ChevronUp, Bell } from 'lucide-react';
import './ProcurementAlerts.css';

export default function ProcurementAlerts({ data = [] }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const alerts = useMemo(() => {
    if (!data || data.length === 0) return [];

    const result = [];
    let totalSpend = 0;
    let atrasadosCount = 0;
    const fornecedorSpend = {};

    data.forEach(row => {
      const propNeg = row.proposta_negociada || 0;
      totalSpend += propNeg;

      if (row.atrasada_no_prazo && row.atrasada_no_prazo.toUpperCase().includes('ATRASADA')) {
        atrasadosCount++;
      }

      if (row.fornecedor) {
        fornecedorSpend[row.fornecedor] = (fornecedorSpend[row.fornecedor] || 0) + propNeg;
      }
    });

    // 1. Alerta de Concentração de Fornecedor (> 20% do Spend)
    if (totalSpend > 0) {
      Object.entries(fornecedorSpend).forEach(([forn, spend]) => {
        const perc = (spend / totalSpend) * 100;
        if (perc >= 20 && spend > 50000) {
          result.push({
            id: `conc-${forn}`,
            type: 'warning',
            title: 'Alta Concentração de Fornecedor',
            message: `${forn} concentra ${(perc).toFixed(1)}% do Spend total (R$ ${(spend / 1000).toFixed(1)}k). Avaliar risco de dependência.`
          });
        }
      });
    }

    // 2. Alerta de SLAs em Atraso
    if (atrasadosCount > 0) {
      const percAtraso = (atrasadosCount / data.length) * 100;
      result.push({
        id: 'sla-atraso',
        type: percAtraso > 15 ? 'danger' : 'warning',
        title: 'Processos em Atraso',
        message: `${atrasadosCount} pedido(s) (${percAtraso.toFixed(1)}% da base) com SLA atrasado em relação ao prazo padrão acordado.`
      });
    }

    return result;
  }, [data]);

  if (alerts.length === 0) return null;

  return (
    <div className="procurement-alerts-card glass-panel">
      <div className="procurement-alerts-header" onClick={() => setIsExpanded(!isExpanded)}>
        <div className="alerts-title-wrap">
          <div className="alerts-bell-icon">
            <Bell size={18} />
          </div>
          <div>
            <span className="alerts-title">Alertas e Oportunidades</span>
            <span className="alerts-badge">{alerts.length} ativo(s)</span>
          </div>
        </div>
        <button type="button" className="alerts-toggle-btn" aria-label="Expandir alertas">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {isExpanded && (
        <div className="procurement-alerts-list">
          {alerts.map(item => (
            <div key={item.id} className={`alert-item alert-${item.type}`}>
              <div className="alert-item-icon">
                {item.type === 'danger' ? <ShieldAlert size={18} /> : <AlertTriangle size={18} />}
              </div>
              <div className="alert-item-content">
                <div className="alert-item-title">{item.title}</div>
                <div className="alert-item-message">{item.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
