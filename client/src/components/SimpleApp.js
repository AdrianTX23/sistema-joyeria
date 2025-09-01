import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const SimpleApp = () => {
  const auth = useAuth();
  
  console.log('🔍 SimpleApp - Auth state:', {
    user: auth.user,
    loading: auth.loading,
    token: auth.token ? 'Present' : 'Missing',
    isAuthenticated: auth.isAuthenticated
  });

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Diagnóstico de Autenticación
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estado de Autenticación */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Estado de Autenticación</h2>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Usuario:</span>
                <span className={auth.user ? 'text-green-600' : 'text-red-600'}>
                  {auth.user ? 'Logueado' : 'No logueado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Cargando:</span>
                <span className={auth.loading ? 'text-yellow-600' : 'text-green-600'}>
                  {auth.loading ? 'Sí' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Token:</span>
                <span className={auth.token ? 'text-green-600' : 'text-red-600'}>
                  {auth.token ? 'Presente' : 'Ausente'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Autenticado:</span>
                <span className={auth.isAuthenticated ? 'text-green-600' : 'text-red-600'}>
                  {auth.isAuthenticated ? 'Sí' : 'No'}
                </span>
              </div>
            </div>
          </div>

          {/* Información del Usuario */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Información del Usuario</h2>
            {auth.user ? (
              <div className="space-y-2">
                <div><strong>ID:</strong> {auth.user.id}</div>
                <div><strong>Usuario:</strong> {auth.user.username}</div>
                <div><strong>Email:</strong> {auth.user.email}</div>
                <div><strong>Rol:</strong> {auth.user.role}</div>
                <div><strong>Nombre:</strong> {auth.user.fullName || auth.user.full_name}</div>
              </div>
            ) : (
              <p className="text-gray-500">No hay usuario logueado</p>
            )}
          </div>

          {/* Acciones */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Acciones</h2>
            <div className="space-y-2">
              <button 
                onClick={() => auth.checkAuth()}
                className="w-full btn btn-primary"
              >
                Verificar Autenticación
              </button>
              <button 
                onClick={() => auth.logout()}
                className="w-full btn btn-danger"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>

          {/* Debug Info */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Debug Info</h2>
            <div className="text-xs bg-gray-100 p-3 rounded">
              <pre>{JSON.stringify(auth, null, 2)}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;
