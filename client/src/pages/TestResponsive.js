import React, { useEffect } from 'react';
import { addResizeListener, updateScreenInfo } from '../utils/responsiveDetector';

const TestResponsive = () => {
  useEffect(() => {
    // Configurar listener para cambios de tamaño
    const cleanup = addResizeListener(() => {
      updateScreenInfo();
    });
    
    // Actualización inicial
    updateScreenInfo();
    
    return cleanup;
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="card">
        <div className="card-header">
          <h1 className="text-2xl font-bold text-gray-900">Prueba de Responsive Design</h1>
        </div>
        <div className="card-body space-y-6">
          
          {/* Información del dispositivo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-900">Ancho de Pantalla</h3>
              <p className="text-blue-700" id="screen-width">Cargando...</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-semibold text-green-900">Tipo de Dispositivo</h3>
              <p className="text-green-700" id="device-type">Cargando...</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-900">Breakpoint Actual</h3>
              <p className="text-purple-700" id="breakpoint">Cargando...</p>
            </div>
          </div>

          {/* Pruebas de navegación */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Pruebas de Navegación</h2>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Sidebar Visible:</h3>
              <p className="text-sm text-gray-600">
                En desktop (lg y superior): El sidebar debe estar siempre visible
                <br />
                En móvil: El sidebar debe estar oculto por defecto y mostrarse al hacer clic en el menú
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Navegación:</h3>
              <p className="text-sm text-gray-600">
                Verifica que puedas navegar entre las diferentes secciones:
                <br />
                • Dashboard
                <br />
                • Productos
                <br />
                • Ventas
                <br />
                • Reportes
                <br />
                • Backup
                <br />
                • Usuarios (solo administradores)
              </p>
            </div>
          </div>

          {/* Indicadores visuales */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900">Indicadores Visuales</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-red-100 p-3 rounded-lg text-center">
                <div className="text-red-600 font-semibold">XS</div>
                <div className="text-xs text-red-500">0-640px</div>
              </div>
              
              <div className="bg-yellow-100 p-3 rounded-lg text-center">
                <div className="text-yellow-600 font-semibold">SM</div>
                <div className="text-xs text-yellow-500">640-768px</div>
              </div>
              
              <div className="bg-blue-100 p-3 rounded-lg text-center">
                <div className="text-blue-600 font-semibold">MD</div>
                <div className="text-xs text-blue-500">768-1024px</div>
              </div>
              
              <div className="bg-green-100 p-3 rounded-lg text-center">
                <div className="text-green-600 font-semibold">LG+</div>
                <div className="text-xs text-green-500">1024px+</div>
              </div>
            </div>
          </div>

          {/* Instrucciones */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">Instrucciones de Prueba:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Redimensiona la ventana del navegador para probar diferentes tamaños</li>
              <li>• En móvil: Verifica que el menú hamburguesa funcione</li>
              <li>• En desktop: Verifica que el sidebar esté siempre visible</li>
              <li>• Prueba la navegación entre secciones</li>
              <li>• Verifica que el contenido se adapte correctamente</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TestResponsive;
