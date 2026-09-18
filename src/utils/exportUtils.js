import * as XLSX from 'xlsx';
import { toPng } from 'html-to-image';

/**
 * Exporta array de objetos para arquivo Excel (.xlsx)
 */
export function exportToExcel(data, fileName = 'relatorio.xlsx', sheetName = 'Dados') {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar com os filtros atuais.');
    return;
  }

  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Auto-ajustar largura das colunas
    const maxCols = Object.keys(data[0] || {}).map(key => {
      const maxLen = Math.max(
        key.length,
        ...data.slice(0, 100).map(row => String(row[key] ?? '').length)
      );
      return { wch: Math.min(Math.max(maxLen + 2, 10), 50) };
    });
    worksheet['!cols'] = maxCols;

    XLSX.writeFile(workbook, fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`);
  } catch (err) {
    console.error('Erro ao exportar para Excel:', err);
    alert('Ocorreu um erro ao exportar os dados para Excel.');
  }
}

/**
 * Exporta um elemento DOM (card de gráfico) para imagem PNG
 */
export async function exportChartToPng(elementOrId, fileName = 'grafico.png') {
  let node = typeof elementOrId === 'string' ? document.getElementById(elementOrId) : elementOrId;
  if (!node) {
    console.warn('Elemento para exportação não encontrado');
    return;
  }

  try {
    const dataUrl = await toPng(node, {
      backgroundColor: '#111827',
      quality: 1,
      pixelRatio: 2, // Retina quality
      style: {
        borderRadius: '16px',
        padding: '16px'
      }
    });

    const link = document.createElement('a');
    link.download = fileName.endsWith('.png') ? fileName : `${fileName}.png`;
    link.href = dataUrl;
    link.click();
  } catch (err) {
    console.error('Erro ao exportar gráfico para PNG:', err);
  }
}
