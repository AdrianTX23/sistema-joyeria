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

  useEffect(() => {
    fetchReportData();
  }, [activeTab, period]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      let data = {};

      switch (activeTab) {
        case 'sales':
          const salesRes = await axios.get(`/api/reports/sales?period=${period}`);
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
      const fileName = `reporte-${activeTab}-${periodNames[period] || period}-${date}.csv`;
      
      // Crear y descargar archivo
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Limpiar recursos
      setTimeout(() => {
        document.body.removeChild(link);
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
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
            disabled={exporting}
          >
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="quarter">Este Trimestre</option>
            <option value="year">Este Año</option>
          </select>
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

            {/* Export Status */}
            {exporting && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="loading-spinner-sm mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Exportando reporte de ventas...</p>
                      <p className="text-sm text-blue-700">Por favor espera mientras se genera el archivo CSV</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'inventory' && reportData.inventory && (
          <div className="space-y-6">
            {/* Inventory Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Productos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {reportData.inventory.summary?.totalItems || 0}
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
                      <p className="text-sm font-medium text-gray-600">Valor Total</p>
                      <p className="text-2xl font-bold text-success-600">
                        ${reportData.inventory.summary?.totalValue || 0}
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
                      <p className="text-sm font-medium text-gray-600">Valor al Detalle</p>
                      <p className="text-2xl font-bold text-primary-600">
                        ${reportData.inventory.summary?.totalRetailValue || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-primary-600" />
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
                        {reportData.inventory.summary?.lowStockItems || 0}
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center">
                      <Package className="w-6 h-6 text-warning-600" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Export Status */}
            {exporting && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="loading-spinner-sm mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Exportando inventario...</p>
                      <p className="text-sm text-blue-700">Generando reporte completo del inventario actual</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'products' && reportData.products && (
          <div className="space-y-6">
            {/* Products Performance Chart */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Rendimiento de Productos</h3>
              </div>
              <div className="card-body">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.products.products?.slice(0, 10) || []}>
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

            {/* Export Status */}
            {exporting && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="loading-spinner-sm mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Exportando reporte de productos...</p>
                      <p className="text-sm text-blue-700">Incluyendo estadísticas de ventas y rendimiento</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'categories' && reportData.categories && (
          <div className="space-y-6">
            {/* Categories Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Rendimiento por Categoría</h3>
                </div>
                <div className="card-body">
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.categories.categories || []}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="revenue"
                        >
                          {(reportData.categories.categories || []).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Resumen por Categoría</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    {(reportData.categories.categories || []).map((category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{category.name}</p>
                          <p className="text-sm text-gray-500">
                            {category.product_count} productos
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-success-600">
                            ${category.revenue}
                          </p>
                          <p className="text-sm text-gray-500">
                            {category.units_sold} vendidos
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Export Status */}
            {exporting && (
              <div className="card bg-blue-50 border-blue-200">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="loading-spinner-sm mr-3" />
                    <div>
                      <p className="font-medium text-blue-900">Exportando reporte de categorías...</p>
                      <p className="text-sm text-blue-700">Incluyendo rendimiento y estadísticas por categoría</p>
                    </div>
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
