import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Eye,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import SaleModal from '../components/SaleModal';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showSaleModal, setShowSaleModal] = useState(false);

  useEffect(() => {
    fetchSales();
  }, [currentPage, searchTerm, startDate, endDate]);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        startDate,
        endDate,
      });

      const response = await axios.get(`/api/sales?${params}`);
      setSales(response.data.sales);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && sales.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Ventas</h1>
          <p className="text-gray-600 mt-1">
            Gestiona las ventas de tu joyería
          </p>
        </div>
        <button 
          onClick={() => setShowSaleModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar ventas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Fecha Inicio</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input"
              />
            </div>
            <div>
              <label className="label">Fecha Fin</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="btn btn-secondary w-full"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Número</th>
                  <th className="table-header-cell">Cliente</th>
                  <th className="table-header-cell">Vendedor</th>
                  <th className="table-header-cell">Total</th>
                  <th className="table-header-cell">Método de Pago</th>
                  <th className="table-header-cell">Fecha</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {sales.map((sale) => (
                  <tr key={sale.id} className="table-row">
                    <td className="table-cell">
                      <span className="font-mono text-sm font-medium">
                        {sale.sale_number}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div>
                        <p className="font-medium text-gray-900">
                          {sale.customer_name || 'Cliente sin nombre'}
                        </p>
                        {sale.customer_email && (
                          <p className="text-sm text-gray-500">{sale.customer_email}</p>
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm">{sale.seller_name}</span>
                    </td>
                    <td className="table-cell">
                      <span className="font-semibold text-success-600">
                        ${sale.total_amount}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">
                        {sale.payment_method}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">
                        {formatDate(sale.created_at)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <button className="btn btn-ghost btn-sm">
                        <Eye className="w-4 h-4 mr-1" />
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Sale Modal */}
      <SaleModal
        isOpen={showSaleModal}
        onClose={() => setShowSaleModal(false)}
        onSuccess={fetchSales}
      />
    </div>
  );
};

export default Sales;
