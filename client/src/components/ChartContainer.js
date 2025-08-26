import React, { useState } from 'react';
import { Download, Settings, Maximize2, Minimize2 } from 'lucide-react';

const ChartContainer = ({
  title,
  children,
  onExport,
  exportFormats = ['PNG', 'SVG', 'CSV'],
  className = '',
  loading = false,
  error = null
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const handleExport = (format) => {
    if (onExport) {
      onExport(format);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`card ${className}`}>
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="card-body">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <p className="text-red-600 mb-2">Error al cargar el gráfico</p>
              <p className="text-sm text-gray-500">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`card ${className} ${isFullscreen ? 'fixed inset-4 z-50 bg-white' : ''}`}>
      <div className="card-header">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <div className="flex items-center space-x-2">
            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                title="Exportar"
              >
                <Download className="w-5 h-5" />
              </button>
              {showSettings && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                  <div className="py-1">
                    {exportFormats.map((format) => (
                      <button
                        key={format}
                        onClick={() => {
                          handleExport(format);
                          setShowSettings(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Exportar como {format}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        <div className={isFullscreen ? 'h-full' : ''}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default ChartContainer;
