import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Gem } from 'lucide-react';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const result = await login(formData.username, formData.password);
    
    if (!result.success) {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-secondary-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4 shadow-medium">
            <Gem className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Joyería Elegante
          </h1>
          <p className="text-gray-600">
            Sistema de Inventario y Ventas
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="username" className="label">
                  Usuario o Email
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="input"
                  placeholder="Ingresa tu usuario o email"
                  required
                  disabled={isLoading}
                />
              </div>

              <div>
                <label htmlFor="password" className="label">
                  Contraseña
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="input pr-10"
                    placeholder="Ingresa tu contraseña"
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="loading-spinner-sm mr-2" />
                    Iniciando sesión...
                  </div>
                ) : (
                  'Iniciar Sesión'
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 text-center">
          <div className="card">
            <div className="card-body">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Credenciales de Demo
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p><strong>Usuario:</strong> admin</p>
                <p><strong>Contraseña:</strong> admin123</p>
              </div>
            </div>
          </div>
        </div>



        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2025 Joyería Elegante. Todos los derechos reservados.</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
