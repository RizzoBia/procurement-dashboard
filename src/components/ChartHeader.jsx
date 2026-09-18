import React, { useState } from 'react';
import { Download, Check } from 'lucide-react';
import { exportChartToPng } from '../utils/exportUtils';
import './ChartHeader.css';

export default function ChartHeader({ title, chartId, downloadName = 'grafico' }) {
  const [downloading, setDownloading] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      await exportChartToPng(chartId, `${downloadName}.png`);
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="chart-header-flex">
      <h3 className="chart-title" style={{ margin: 0 }}>{title}</h3>
      {chartId && (
        <button
          type="button"
          className="chart-download-btn"
          onClick={handleDownload}
          title="Baixar este gráfico em imagem PNG"
        >
          {downloaded ? (
            <Check size={14} className="download-icon success" />
          ) : (
            <Download size={14} className={`download-icon ${downloading ? 'loading' : ''}`} />
          )}
          <span>{downloaded ? 'Baixado!' : 'PNG'}</span>
        </button>
      )}
    </div>
  );
}
