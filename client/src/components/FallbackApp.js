import React from 'react';

const FallbackApp = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          🔍 Diagnóstico de la Aplicación
        </h1>
        <p className="text-gray-600 mb-4">
          Si puedes ver esto, React está funcionando correctamente.
        </p>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-700">
            Estado: Componente de fallback cargado
          </p>
        </div>
      </div>
    </div>
  );
};

export default FallbackApp;
