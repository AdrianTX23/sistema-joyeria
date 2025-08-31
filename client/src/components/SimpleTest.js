import React from 'react';

const SimpleTest = () => {
  console.log('🧪 SimpleTest component rendering');
  
  return (
    <div className="p-8 bg-blue-100 border-2 border-blue-500 rounded-lg">
      <h1 className="text-2xl font-bold text-blue-800 mb-4">
        🧪 Componente de Prueba Simple
      </h1>
      <p className="text-blue-700 mb-4">
        Si puedes ver esto, el routing y el renderizado básico funcionan.
      </p>
      <div className="bg-white p-4 rounded border">
        <h2 className="font-semibold mb-2">Información del componente:</h2>
        <ul className="text-sm space-y-1">
          <li>✅ Componente renderizado correctamente</li>
          <li>✅ CSS aplicado</li>
          <li>✅ React funcionando</li>
          <li>✅ Routing funcionando</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleTest;
