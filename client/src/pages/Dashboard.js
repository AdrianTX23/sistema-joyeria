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
      const [dashboardRes, salesRes, topProductsRes] = await Promise.all([
        axios.get('/api/reports/dashboard'),
        axios.get('/api/reports/sales?period=week'),
        axios.get('/api/sales/stats/top-products?limit=5&period=week'),
      ]);

      setDashboardData({
        dashboard: dashboardRes.data,
        sales: salesRes.data,
        topProducts: topProductsRes.data.products,
      });
    } catch (err) {
      setError('Error al cargar los datos del dashboard');
      console.error('Dashboard error:', err);
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
      </div>
    );
  }

  const { dashboard, sales, topProducts } = dashboardData;



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
          value={dashboard.today.sales}
          icon={ShoppingCart}
          color="primary"
        />
        <StatCard
          title="Ingresos Hoy"
          value={`$${dashboard.today.revenue}`}
          icon={DollarSign}
          color="success"
        />
        <StatCard
          title="Productos"
          value={dashboard.inventory.totalProducts}
          icon={Package}
          color="secondary"
        />
        <StatCard
          title="Stock Bajo"
          value={dashboard.inventory.lowStockItems}
          icon={AlertTriangle}
          color="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Ventas de la Semana</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sales.data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8B5CF6"
                    strokeWidth={2}
                    dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
          </div>
          <div className="card-body">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="units_sold" fill="#8B5CF6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
              <span className="font-semibold">{dashboard.month.sales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Ingresos</span>
              <span className="font-semibold text-success-600">
                ${dashboard.month.revenue}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Promedio por Venta</span>
              <span className="font-semibold">
                ${dashboard.month.averageSale}
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
              <span className="text-gray-600">Valor Total</span>
              <span className="font-semibold text-primary-600">
                ${dashboard.inventory.totalValue}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Productos</span>
              <span className="font-semibold">{dashboard.inventory.totalProducts}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Stock Bajo</span>
              <span className="font-semibold text-warning-600">
                {dashboard.inventory.lowStockItems}
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
