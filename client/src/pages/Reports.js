import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Package,
  Download,
  AlertCircle,
  CheckCircle,
  Calendar,
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
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import LoadingSpinner from '../components/LoadingSpinner';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');
  const [period, setPeriod] = useState('month');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [reportData, setReportData] = useState({});
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [useCustomDates, setUseCustomDates] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [activeTab, period, startDate, endDate, useCustomDates]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let data = {};

      switch (activeTab) {
        case 'sales':
          let salesUrl = `/api/reports/sales?period=${period}`;
          if (useCustomDates && startDate && endDate) {
            salesUrl = `/api/reports/sales?startDate=${startDate}&endDate=${endDate}`;
          }
          const salesRes = await axios.get(salesUrl);
          data.sales = salesRes.data;
          break;
        case 'inventory':
          const inventoryRes = await axios.get('/api/reports/inventory');
          data.inventory = inventoryRes.data;
          break;
        case 'products':
          const productsRes = await axios.get(`/api/reports/products?period=${period}`);
          data.products = productsRes.data;
          break;
        case 'categories':
          const categoriesRes = await axios.get(`/api/reports/categories?period=${period}`);
          data.categories = categoriesRes.data;
          break;
        default:
          break;
      }

      setReportData(data);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Error al cargar los datos del reporte');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (type, value) => {
    if (type === 'start') {
      setStartDate(value);
      if (value && endDate && value > endDate) {
        setEndDate(value);
      }
    } else {
      setEndDate(value);
    }
  };

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setUseCustomDates(false);
    setStartDate('');
    setEndDate('');
  };

  const handleCustomDatesToggle = () => {
    setUseCustomDates(!useCustomDates);
    if (!useCustomDates) {
      // Al activar fechas personalizadas, establecer fechas por defecto
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      // Al desactivar, limpiar fechas
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExport = async () => {
    // Validaciones previas
    if (exporting) {
      toast.error('Ya hay una exportación en progreso', { id: 'export' });
      return;
    }

    if (!activeTab) {
      toast.error('Selecciona un tipo de reporte', { id: 'export' });
      return;
    }

    try {
      setExporting(true);
      toast.loading('Preparando exportación...', { id: 'export' });
      
      // Verificar que hay datos para exportar
      const hasData = reportData[activeTab] && 
        (reportData[activeTab].data?.length > 0 || 
         reportData[activeTab].products?.length > 0 ||
         reportData[activeTab].categories?.length > 0 ||
         reportData[activeTab].totals);

      if (!hasData) {
        toast.error('No hay datos para exportar en este período', { id: 'export' });
        return;
      }

      toast.loading('Generando archivo CSV...', { id: 'export' });
      
      const response = await axios.get(`/api/reports/export?type=${activeTab}&period=${period}`, {
        responseType: 'blob',
        timeout: 30000 // 30 segundos de timeout
      });
      
      // Verificar que la respuesta es válida
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo generado está vacío');
      }

      // Crear nombre de archivo descriptivo
      const date = new Date().toISOString().split('T')[0];
      const periodNames = {
        week: 'semana',
        month: 'mes',
        quarter: 'trimestre',
        year: 'año'
      };
      const fileName = `reporte_${activeTab}_${periodNames[period] || period}_${date}.csv`;

      // Crear y descargar el archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // Limpiar URL después de un breve delay
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Reporte exportado: ${fileName}`, { id: 'export' });
      
    } catch (error) {
      console.error('Error exporting report:', error);
      
      let errorMessage = 'Error al exportar el reporte';
      
      if (error.response) {
        // Error del servidor
        if (error.response.status === 401) {
          errorMessage = 'Sesión expirada. Inicia sesión nuevamente';
        } else if (error.response.status === 404) {
          errorMessage = 'Tipo de reporte no encontrado';
        } else if (error.response.status === 500) {
          errorMessage = 'Error interno del servidor';
        }
      } else if (error.code === 'ECONNABORTED') {
        errorMessage = 'Tiempo de espera agotado. Intenta nuevamente';
      } else if (error.message.includes('Network Error')) {
        errorMessage = 'Error de conexión. Verifica tu internet';
      }
      
      toast.error(errorMessage, { id: 'export' });
    } finally {
      setExporting(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const tabs = [
    { id: 'sales', name: 'Ventas', icon: TrendingUp },
    { id: 'inventory', name: 'Inventario', icon: Package },
    { id: 'products', name: 'Productos', icon: BarChart3 },
    { id: 'categories', name: 'Categorías', icon: DollarSign },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reportes</h1>
          <p className="text-gray-600 mt-1">
            Análisis y estadísticas del negocio
          </p>
        </div>
        <div className="flex items-center space-x-2 mt-4 sm:mt-0">
          {activeTab === 'sales' && (
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={useCustomDates}
                  onChange={handleCustomDatesToggle}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-gray-700">Fechas personalizadas</span>
              </label>
            </div>
          )}
          
          {activeTab === 'sales' && useCustomDates ? (
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => handleDateChange('start', e.target.value)}
                  className="input text-sm"
                  max={endDate || undefined}
                />
              </div>
              <span className="text-gray-500">a</span>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => handleDateChange('end', e.target.value)}
                  className="input text-sm"
                  min={startDate || undefined}
                />
              </div>
            </div>
          ) : (
            <select
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="input"
              disabled={exporting}
            >
              <option value="week">Esta Semana</option>
              <option value="month">Este Mes</option>
              <option value="quarter">Este Trimestre</option>
              <option value="year">Este Año</option>
            </select>
          )}
          
          <button 
            onClick={handleExport}
            className={`btn ${exporting ? 'btn-secondary opacity-50' : 'btn-secondary'}`}
            disabled={loading || exporting}
          >
            {exporting ? (
              <>
                <div className="loading-spinner-sm mr-2" />
                Exportando...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                disabled={exporting}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Report Content */}
      <div className="space-y-6">
        {activeTab === 'sales' && reportData.sales && (
          <div className="space-y-6">
            {/* Sales Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ventas Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.sales.totals?.totalSales || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-success-600">
                        ${reportData.sales.totals?.totalRevenue || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-success-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Promedio por Venta</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${reportData.sales.totals?.averageSale || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-6 h-6 text-secondary-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Chart */}
            {reportData.sales.data && reportData.sales.data.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Tendencia de Ventas</h3>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.sales.data}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sales Table */}
            {reportData.sales.data && reportData.sales.data.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Detalle de Ventas</h3>
                </div>
                <div className="card-body">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ventas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingresos
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.sales.data.map((item, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {item.sales}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${item.revenue}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && reportData.inventory && (
          <div className="space-y-6">
            {/* Inventory Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Productos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.inventory.totalProducts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                      <p className="text-2xl font-bold text-warning-600">
                        {reportData.inventory.lowStockProducts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-warning-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Stock Agotado</p>
                      <p className="text-2xl font-bold text-danger-600">
                        {reportData.inventory.outOfStockProducts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-danger-100 rounded-lg flex items-center justify-center">
                      <AlertCircle className="w-6 h-6 text-danger-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Inventory Chart */}
            {reportData.inventory.categories && reportData.inventory.categories.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Productos por Categoría</h3>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.inventory.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.inventory.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && reportData.products && (
          <div className="space-y-6">
            {/* Products Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Productos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.products.summary?.totalProducts || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Unidades Vendidas</p>
                      <p className="text-2xl font-bold text-success-600">
                        {reportData.products.summary?.totalUnitsSold || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-success-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${reportData.products.summary?.totalRevenue || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-secondary-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Products Chart */}
            {reportData.products.products && reportData.products.products.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Productos Más Vendidos</h3>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.products.products.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="units_sold" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Products Table */}
            {reportData.products.products && reportData.products.products.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Rendimiento de Productos</h3>
                </div>
                <div className="card-body">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unidades Vendidas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingresos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Stock Actual
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.products.products.map((product, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.category_name || 'Sin categoría'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.units_sold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${product.revenue}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {product.stock_quantity}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && reportData.categories && (
          <div className="space-y-6">
            {/* Categories Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Categorías</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.categories.summary?.totalCategories || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Unidades Vendidas</p>
                      <p className="text-2xl font-bold text-success-600">
                        {reportData.categories.summary?.totalUnitsSold || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-success-600" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                      <p className="text-2xl font-bold text-gray-900">
                        ${reportData.categories.summary?.totalRevenue || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-secondary-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-secondary-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories Chart */}
            {reportData.categories.categories && reportData.categories.categories.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Categoría</h3>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.categories.categories}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Categories Table */}
            {reportData.categories.categories && reportData.categories.categories.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Detalle por Categoría</h3>
                </div>
                <div className="card-body">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Categoría
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Productos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Unidades Vendidas
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ingresos
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Ventas
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.categories.categories.map((category, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {category.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {category.product_count}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {category.units_sold}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              ${category.revenue}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {category.sale_count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
