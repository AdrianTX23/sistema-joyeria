import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Menu,
  X,
  Home,
  Package,
  ShoppingCart,
  BarChart3,
  Shield,
  Users,
  LogOut,
  User,
  ChevronDown,
  Settings,
  Clock,
  CheckCircle,
} from 'lucide-react';
import Logo from './Logo';
import MiniClock from './MiniClock';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sessionType, setSessionType] = useState('temporal');
  const { user, logout } = useAuth();
  const location = useLocation();

  // Detectar tipo de sesión
  useEffect(() => {
    const checkSessionType = () => {
      const hasSessionToken = sessionStorage.getItem('token');
      const hasPersistentToken = localStorage.getItem('token');
      
      if (hasPersistentToken) {
        setSessionType('persistente');
      } else if (hasSessionToken) {
        setSessionType('temporal');
      } else {
        setSessionType('none');
      }
    };

    checkSessionType();
    
    // Verificar cada vez que cambie el storage
    const handleStorageChange = () => {
      checkSessionType();
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-close sidebar on mobile when route changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false); // Close sidebar on desktop
      }
    };

    // Close sidebar when route changes on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [location.pathname]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, description: 'Vista general del negocio' },
    { name: 'Productos', href: '/products', icon: Package, description: 'Gestionar inventario' },
    { name: 'Ventas', href: '/sales', icon: ShoppingCart, description: 'Registrar ventas' },
    { name: 'Reportes', href: '/reports', icon: BarChart3, description: 'Análisis y estadísticas' },
    { name: 'Backup', href: '/backup', icon: Shield, description: 'Respaldo del sistema' },
    ...(user?.role === 'administrador' ? [{ name: 'Usuarios', href: '/users', icon: Users, description: 'Gestionar usuarios' }] : []),
  ];

  const isActive = (href) => location.pathname === href;

  const currentPage = navigation.find(item => isActive(item.href)) || navigation[0];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Navigation Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <Logo className="w-8 h-8" showText={false} />
              <span className="text-lg font-bold text-gray-900 ml-2">Joyería</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 truncate max-w-24">
                {currentPage.name}
              </p>
              <p className="text-xs text-gray-500 truncate max-w-24">
                {currentPage.description}
              </p>
            </div>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors user-menu"
            >
              <User className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-100">
            <div className="flex items-center">
              <Logo className="w-8 h-8" showText={false} />
              <span className="text-xl font-bold text-gray-900 ml-3">Joyería</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Cerrar menú"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive(item.href)
                      ? 'bg-[#F9D664]/20 text-gray-800 border border-[#F9D664]/40 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <Icon className={`w-5 h-5 mr-3 transition-colors ${
                    isActive(item.href) ? 'text-[#F9D664]' : 'text-gray-400 group-hover:text-gray-600'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className={`text-xs transition-colors ${
                      isActive(item.href) ? 'text-[#F9D664]' : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {item.description}
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-100 p-4">
            <div className="flex items-center">
              <div className="w-10 h-10 bg-[#F9D664]/20 rounded-full flex items-center justify-center mr-3">
                <User className="w-5 h-5 text-[#F9D664]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </p>
                {/* Session Type Indicator */}
                <div className="flex items-center mt-1">
                  {sessionType === 'persistente' ? (
                    <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 text-orange-500 mr-1" />
                  )}
                  <span className={`text-xs ${
                    sessionType === 'persistente' ? 'text-green-600' : 'text-orange-600'
                  }`}>
                    {sessionType === 'persistente' ? 'Sesión persistente' : 'Sesión temporal'}
                  </span>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 transition-opacity duration-300 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Desktop Header */}
        <header className="hidden lg:block bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                {currentPage.name}
              </h1>
              <span className="ml-3 text-sm text-gray-500">
                {currentPage.description}
              </span>
            </div>
            
            {/* Mini Reloj en Tiempo Real */}
            <div className="flex items-center space-x-4">
              <MiniClock showSeconds={false} showDate={true} compact={false} />
            </div>

            {/* Desktop User Menu */}
            <div className="relative user-menu">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-150"
              >
                              <div className="w-8 h-8 bg-[#F9D664]/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-[#F9D664]" />
              </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.fullName}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user?.role}
                  </p>
                  {/* Session Type Indicator */}
                  <div className="flex items-center mt-1">
                    {sessionType === 'persistente' ? (
                      <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 text-orange-500 mr-1" />
                    )}
                    <span className={`text-xs ${
                      sessionType === 'persistente' ? 'text-green-600' : 'text-orange-600'
                    }`}>
                      {sessionType === 'persistente' ? 'Sesión persistente' : 'Sesión temporal'}
                    </span>
                  </div>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${
                  userMenuOpen ? 'rotate-180' : ''
                }`} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-large border border-gray-100 py-2 z-50">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.fullName}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.email}
                    </p>
                    {/* Session Type Info */}
                    <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        {sessionType === 'persistente' ? (
                          <CheckCircle className="w-3 h-3 text-green-500 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 text-orange-500 mr-1" />
                        )}
                        <span className="text-xs text-gray-600">
                          {sessionType === 'persistente' 
                            ? 'Sesión persistente - Se mantiene al cerrar el navegador'
                            : 'Sesión temporal - Se cierra al cerrar la página'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-150"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={`p-4 lg:p-6 ${window.innerWidth < 1024 ? 'pt-20' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
