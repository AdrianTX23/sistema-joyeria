import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ShoppingCart,
  AlertTriangle,
  BarChart3,
  Activity,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';
import DateTimeDisplay from '../components/DateTimeDisplay';

const Dashboard = () => {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching dashboard data...');
      
      const response = await axios.get('/api/reports/dashboard');
      console.log('📊 Dashboard data received:', response.data);
      
      setDashboardData(response.data);
    } catch (err) {
      console.error('❌ Dashboard error:', err);
      setError('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleNewSale = () => {
    navigate('/sales');
  };

  const handleAddProduct = () => {
    navigate('/products');
  };

  const handleViewReports = () => {
    navigate('/reports');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="btn btn-primary mt-4"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  const { summary, recentSales, topProducts } = dashboardData;

  const StatCard = ({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) => (
    <div className="card">
      <div className="card-body">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
            {trend && (
              <div className="flex items-center mt-2">
                {trend === 'up' ? (
                  <TrendingUp className="w-4 h-4 text-success-600 mr-1" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-danger-600 mr-1" />
                )}
                <span className={`text-sm ${trend === 'up' ? 'text-success-600' : 'text-danger-600'}`}>
                  {trendValue}
                </span>
              </div>
            )}
          </div>
          <div className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}>
            <Icon className={`w-6 h-6 text-${color}-600`} />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Resumen general del negocio
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Ventas Hoy"
          value={summary.todaySales || 0}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="Ingresos Hoy"
          value={`$${summary.todayRevenue || '0.00'}`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Productos"
          value={summary.totalProducts || 0}
          icon={Package}
          color="secondary"
        />
        <StatCard
          title="Stock Bajo"
          value={summary.lowStockProducts || 0}
          icon={AlertTriangle}
          color="warning"
        />
      </div>

      {/* Reloj y Calendario en Tiempo Real */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <DateTimeDisplay />
        </div>
        
        {/* Información del Sistema */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <Activity className="w-5 h-5 text-blue-500 mr-2" />
            Estado del Sistema
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Última Actualización:</span>
              <span className="text-sm font-medium text-gray-800">
                {new Date().toLocaleTimeString('es-ES')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estado:</span>
              <span className="flex items-center text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Operativo
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Base de Datos:</span>
              <span className="text-sm font-medium text-gray-800">Conectada</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Backup:</span>
              <span className="text-sm font-medium text-gray-800">Automático</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Ventas Recientes</h3>
          </div>
          <div className="card-body">
            {recentSales && recentSales.length > 0 ? (
              <div className="space-y-3">
                {recentSales.slice(0, 5).map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{sale.customer_name || 'Cliente sin nombre'}</p>
                      <p className="text-sm text-gray-600">{sale.sale_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-success-600">${parseFloat(sale.total_amount).toFixed(2)}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(sale.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No hay ventas recientes</p>
            )}
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
          </div>
          <div className="card-body">
            {topProducts && topProducts.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total_sold" fill="#F9D664" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-gray-600 text-center py-4">No hay datos de productos vendidos</p>
            )}
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Resumen Mensual</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ventas Totales</span>
              <span className="font-semibold">{summary.monthSales || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ingresos</span>
              <span className="font-semibold text-success-600">
                ${summary.monthRevenue || '0.00'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Promedio por Venta</span>
              <span className="font-semibold">
                ${summary.monthSales > 0 ? (parseFloat(summary.monthRevenue) / summary.monthSales).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Inventario</h3>
          </div>
          <div className="card-body space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Productos</span>
              <span className="font-semibold">{summary.totalProducts || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Stock Bajo</span>
              <span className="font-semibold text-warning-600">
                {summary.lowStockProducts || 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Estado</span>
              <span className={`font-semibold ${summary.lowStockProducts > 0 ? 'text-warning-600' : 'text-success-600'}`}>
                {summary.lowStockProducts > 0 ? 'Atención' : 'Normal'}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h3>
          </div>
          <div className="card-body space-y-3">
            <button 
              onClick={handleNewSale}
              className="w-full btn btn-primary btn-sm"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Nueva Venta
            </button>
            <button 
              onClick={handleAddProduct}
              className="w-full btn btn-secondary btn-sm"
            >
              <Package className="w-4 h-4 mr-2" />
              Agregar Producto
            </button>
            <button 
              onClick={handleViewReports}
              className="w-full btn btn-secondary btn-sm"
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Ver Reportes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
