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
  Activity,
  RefreshCw,
  Filter,
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
  AreaChart,
  Area,
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
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      
      setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleExport = async () => {
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
      
      let exportUrl = `/api/reports/export?type=${activeTab}`;
      
      if (activeTab === 'sales' && useCustomDates && startDate && endDate) {
        exportUrl += `&startDate=${startDate}&endDate=${endDate}`;
      } else {
        exportUrl += `&period=${period}`;
      }
      
      const response = await axios.get(exportUrl, {
        responseType: 'blob',
        timeout: 30000
      });
      
      if (!response.data || response.data.size === 0) {
        throw new Error('El archivo generado está vacío');
      }

      const date = new Date().toISOString().split('T')[0];
      const periodNames = {
        week: 'semana',
        month: 'mes',
        quarter: 'trimestre',
        year: 'año'
      };
      
      let fileName;
      if (activeTab === 'sales' && useCustomDates && startDate && endDate) {
        fileName = `ventas_${startDate}_a_${endDate}.csv`;
      } else {
        fileName = `reporte_${activeTab}_${periodNames[period] || period}_${date}.csv`;
      }

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      setTimeout(() => {
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success(`Reporte exportado: ${fileName}`, { id: 'export' });
      
    } catch (error) {
      console.error('Error exporting report:', error);
      
      let errorMessage = 'Error al exportar el reporte';
      
      if (error.response) {
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

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

  const tabs = [
    { id: 'sales', name: 'Ventas', icon: TrendingUp, color: 'from-blue-500 to-blue-600' },
    { id: 'inventory', name: 'Inventario', icon: Package, color: 'from-green-500 to-green-600' },
    { id: 'products', name: 'Productos', icon: BarChart3, color: 'from-purple-500 to-purple-600' },
    { id: 'categories', name: 'Categorías', icon: DollarSign, color: 'from-orange-500 to-orange-600' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando reportes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">
                📊 Dashboard de Reportes
              </h1>
              <p className="text-blue-100 text-base lg:text-lg">
                Análisis completo y estadísticas detalladas de tu negocio
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <button
                onClick={fetchReportData}
                disabled={loading}
                className="inline-flex items-center px-3 lg:px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all duration-200 border border-white/30 text-sm lg:text-base"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              <button 
                onClick={handleExport}
                className={`inline-flex items-center px-4 lg:px-6 py-2 rounded-lg font-medium transition-all duration-200 text-sm lg:text-base ${
                  exporting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105'
                }`}
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
                    Exportar Reporte
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Filtros y controles */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 p-4 lg:p-6 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 lg:w-5 h-4 lg:h-5 text-gray-500" />
                <span className="text-sm lg:text-base font-medium text-gray-700">Filtros:</span>
              </div>
              
              {activeTab === 'sales' && (
                <div className="flex items-center space-x-3">
                  <label className="flex items-center space-x-2 text-sm lg:text-base">
                    <input
                      type="checkbox"
                      checked={useCustomDates}
                      onChange={handleCustomDatesToggle}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-gray-700">Fechas personalizadas</span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              {activeTab === 'sales' && useCustomDates ? (
                <div className="flex items-center space-x-2 lg:space-x-3">
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => handleDateChange('start', e.target.value)}
                      className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none"
                      max={endDate || undefined}
                    />
                  </div>
                  <span className="text-gray-500">a</span>
                  <div className="flex items-center space-x-2 bg-gray-50 rounded-lg px-2 lg:px-3 py-1.5 lg:py-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => handleDateChange('end', e.target.value)}
                      className="bg-transparent border-none text-sm focus:ring-0 focus:outline-none"
                      min={startDate || undefined}
                    />
                  </div>
                </div>
              ) : (
                <select
                  value={period}
                  onChange={(e) => handlePeriodChange(e.target.value)}
                  className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-sm lg:text-base"
                  disabled={exporting}
                >
                  <option value="week">Esta Semana</option>
                  <option value="month">Este Mes</option>
                  <option value="quarter">Este Trimestre</option>
                  <option value="year">Este Año</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* Tabs con diseño moderno */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 p-2 mb-6 lg:mb-8">
          <nav className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  disabled={exporting}
                  className={`flex-1 flex items-center justify-center px-4 lg:px-6 py-3 lg:py-4 rounded-lg lg:rounded-xl font-medium text-sm lg:text-base transition-all duration-200 ${
                    isActive
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-lg transform scale-105`
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  } ${exporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <Icon className="w-4 lg:w-5 h-4 lg:h-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenido del reporte */}
        <div className="space-y-6 lg:space-y-8">
          {activeTab === 'sales' && reportData.sales && (
            <div className="space-y-6 lg:space-y-8">
              {/* Tarjetas de resumen con gradientes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs lg:text-sm font-medium">Ventas Totales</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        {reportData.sales.totals?.totalSales || 0}
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <TrendingUp className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-xs lg:text-sm font-medium">Ingresos Totales</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        ${reportData.sales.totals?.totalRevenue || 0}
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <DollarSign className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-xs lg:text-sm font-medium">Promedio por Venta</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        ${reportData.sales.totals?.averageSale || 0}
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <BarChart3 className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-xs lg:text-sm font-medium">Tendencia</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        +12.5%
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Activity className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Gráfico de ventas mejorado */}
              {reportData.sales.data && reportData.sales.data.length > 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 p-4 lg:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4 lg:mb-6 gap-3">
                    <h3 className="text-lg lg:text-xl font-bold text-gray-900">📈 Tendencia de Ventas</h3>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span>Ventas</span>
                      <div className="w-3 h-3 bg-green-500 rounded-full ml-4"></div>
                      <span>Ingresos</span>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={300} className="min-h-[300px]">
                    <AreaChart data={reportData.sales.data}>
                      <defs>
                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                      <XAxis dataKey="date" stroke="#6B7280" />
                      <YAxis stroke="#6B7280" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                      <Area type="monotone" dataKey="sales" stroke="#3B82F6" strokeWidth={3} fill="url(#colorSales)" />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Tabla de ventas mejorada */}
              {reportData.sales.data && reportData.sales.data.length > 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 overflow-hidden">
                  <div className="px-4 lg:px-6 py-3 lg:py-4 border-b border-gray-100 bg-gradient-to-r from-gray-50 to-gray-100">
                    <h3 className="text-base lg:text-lg font-semibold text-gray-900">📋 Detalle de Ventas</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Fecha
                          </th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Ventas
                          </th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Ingresos
                          </th>
                          <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Estado
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {reportData.sales.data.map((item, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-150">
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {item.date}
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {item.sales}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              ${item.revenue}
                            </td>
                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Completado
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Otros tabs con diseño responsivo similar */}
          {activeTab === 'inventory' && reportData.inventory && (
            <div className="space-y-6 lg:space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-xs lg:text-sm font-medium">Total Productos</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        {reportData.inventory.totalProducts || 0}
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <Package className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-yellow-100 text-xs lg:text-sm font-medium">Stock Bajo</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        {reportData.inventory.lowStockProducts || 0}
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <AlertCircle className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl lg:rounded-2xl p-4 lg:p-6 text-white shadow-lg lg:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-red-100 text-xs lg:text-sm font-medium">Stock Agotado</p>
                      <p className="text-2xl lg:text-3xl font-bold">
                        {reportData.inventory.outOfStockProducts || 0}
                      </p>
                    </div>
                    <div className="w-10 lg:w-12 h-10 lg:h-12 bg-white/20 rounded-lg lg:rounded-xl flex items-center justify-center backdrop-blur-sm">
                      <AlertCircle className="w-5 lg:w-6 h-5 lg:h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {reportData.inventory.categories && reportData.inventory.categories.length > 0 && (
                <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 p-4 lg:p-6">
                  <h3 className="text-lg lg:text-xl font-bold text-gray-900 mb-4 lg:mb-6">📊 Productos por Categoría</h3>
                  <ResponsiveContainer width="100%" height={300} className="min-h-[300px]">
                    <PieChart>
                      <Pie
                        data={reportData.inventory.categories}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {reportData.inventory.categories.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #E5E7EB',
                          borderRadius: '12px',
                          boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Continuar con otros tabs... */}
        </div>
      </div>
    </div>
  );
};

export default Reports;
