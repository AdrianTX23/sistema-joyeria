import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff, Lock, User, Mail, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';

const Login = () => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    rememberMe: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useEmail, setUseEmail] = useState(false);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username && !formData.email) {
      toast.error('Ingresa tu usuario o correo electrónico');
      return;
    }
    
    if (!formData.password) {
      toast.error('Ingresa tu contraseña');
      return;
    }

    // Validar formato de email si se está usando email
    if (useEmail && formData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        toast.error('Formato de email inválido');
        return;
      }
    }

    setLoading(true);
    
    try {
      const loginResult = await login(
        formData.username || formData.email,
        formData.password,
        formData.rememberMe
      );
      
      if (loginResult.success) {
        toast.success('¡Bienvenido al sistema de joyería!');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleLoginMethod = () => {
    setUseEmail(!useEmail);
    setFormData(prev => ({
      ...prev,
      username: '',
      email: ''
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      {/* Fondo decorativo */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-yellow-200/20 to-yellow-300/20 rounded-full blur-3xl floating-shapes"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-yellow-200/20 to-yellow-300/20 rounded-full blur-3xl floating-shapes"></div>
        <div className="absolute top-1/2 left-1/4 w-40 h-40 bg-gradient-to-br from-yellow-100/30 to-yellow-200/30 rounded-full blur-2xl floating-shapes"></div>
      </div>

              {/* Contenedor principal */}
        <div className="relative w-full max-w-md fade-in">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Logo className="w-20 h-20" showText={false} />
              <div className="absolute -top-2 -right-2">
                <Sparkles className="w-6 h-6 text-yellow-500 animate-pulse" />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Bienvenido
          </h1>
          <p className="text-gray-600 text-lg">
            Sistema de Inventario y Ventas
          </p>
        </div>

        {/* Formulario de login */}
        <div className="bg-white rounded-2xl shadow-2xl shadow-yellow-200/50 border border-yellow-100 p-8 slide-up">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Selector de método de login */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setUseEmail(false)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  !useEmail
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <User className="w-4 h-4 inline mr-2" />
                Usuario
              </button>
              <button
                type="button"
                onClick={() => setUseEmail(true)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                  useEmail
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Mail className="w-4 h-4 inline mr-2" />
                Correo
              </button>
            </div>

            {/* Campo de usuario/email */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {useEmail ? 'Correo Electrónico' : 'Nombre de Usuario'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  {useEmail ? (
                    <Mail className="h-5 w-5 text-gray-400" />
                  ) : (
                    <User className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  type={useEmail ? 'email' : 'text'}
                  name={useEmail ? 'email' : 'username'}
                  value={useEmail ? formData.email : formData.username}
                  onChange={handleInputChange}
                  className="login-input"
                  placeholder={useEmail ? 'tu@correo.com' : 'tu_usuario'}
                  required
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="login-input pr-12"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={togglePasswordVisibility}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Opciones adicionales */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded transition-colors duration-200"
                />
                <span className="ml-2 text-sm text-gray-700">
                  Recordar sesión
                </span>
              </label>
            </div>

            {/* Botón de login */}
            <button
              type="submit"
              disabled={loading}
              className={`login-button ${loading ? 'opacity-50' : ''}`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <Lock className="w-5 h-5 mr-2" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Información de sesión */}
          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Tipos de Sesión
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p><strong>Temporal:</strong> Se cierra al cerrar el navegador</p>
                  <p><strong>Persistente:</strong> Se mantiene hasta cerrar sesión</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-sm text-gray-500">
            © 2024 Joyería Elegante. Sistema de gestión empresarial.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
