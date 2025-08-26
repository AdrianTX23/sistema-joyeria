import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, AlertCircle, CheckCircle } from 'lucide-react';

const ExportButton = ({ 
  type, 
  period, 
  disabled = false, 
  className = '', 
  onSuccess,
  onError 
}) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (exporting || disabled) {
      return;
    }

    try {
      setExporting(true);
      toast.loading('Preparando exportación...', { id: 'export' });
      
      const response = await axios.get(`/api/reports/export?type=${type}&period=${period}`, {
        responseType: 'blob',
        timeout: 30000
      });
      
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo generado está vacío');
      }

      // Crear nombre de archivo descriptivo
      const date = new Date().toISOString().split('T')[0];
      const periodNames = {
        week: 'semana',
        month: 'mes',
        quarter: 'trimestre',
        year: 'año'
      };
      const fileName = `reporte-${type}-${periodNames[period] || period}-${date}.csv`;
      
      // Crear y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Limpiar recursos
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Reporte exportado: ${fileName}`, { id: 'export' });
      
      if (onSuccess) {
        onSuccess(fileName);
      }
      
    } catch (error) {
      console.error('Error exporting report:', error);
      
      let errorMessage = 'Error al exportar el reporte';
      
      if (error.response) {
        if (error.response.status === 401) {
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
        } else if (error.response.status === 404) {
          errorMessage = 'No hay datos para exportar en este período';
        } else if (error.response.status === 500) {
          errorMessage = 'Error interno del servidor';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. Intenta nuevamente';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      
      toast.error(errorMessage, { id: 'export' });
      
      if (onError) {
        onError(error);
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <button 
      onClick={handleExport}
      className={`btn ${exporting ? 'btn-secondary opacity-50' : 'btn-secondary'} ${className}`}
      disabled={disabled || exporting}
      title={exporting ? 'Exportando...' : `Exportar reporte de ${type}`}
    >
      {exporting ? (
        <>
          <div className="loading-spinner-sm mr-2" />
          Exportando...
        </>
      ) : (
        <>
          <Download className="w-4 h-4 mr-2" />
          Exportar
        </>
      )}
    </button>
  );
};

export default ExportButton;
