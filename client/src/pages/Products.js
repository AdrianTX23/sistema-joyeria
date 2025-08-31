import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductModal from '../components/ProductModal';
import StockModal from '../components/StockModal';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('📦 Iniciando fetch de productos...');
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        category: selectedCategory,
        lowStock: lowStockFilter,
      });

      console.log('📡 Enviando petición a:', `/api/products?${params}`);
      const response = await axios.get(`/api/products?${params}`);
      
      console.log('✅ Respuesta de productos recibida:', {
        status: response.status,
        productsCount: response.data.products?.length || 0,
        hasPagination: !!response.data.pagination
      });
      
      setProducts(response.data.products);
      setTotalPages(response.data.pagination?.total || 1);
    } catch (error) {
      console.error('❌ Error fetching products:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      try {
        await axios.delete(`/api/products/${productId}`);
        fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleStockUpdate = (product) => {
    setSelectedProduct(product);
    setShowStockModal(true);
  };

  const handleModalClose = () => {
    setShowProductModal(false);
    setShowStockModal(false);
    setSelectedProduct(null);
    fetchProducts();
  };

  const getStockStatus = (quantity, minLevel) => {
    if (quantity === 0) return { status: 'out', text: 'Sin Stock', color: 'danger' };
    if (quantity <= minLevel) return { status: 'low', text: 'Stock Bajo', color: 'warning' };
    return { status: 'ok', text: 'En Stock', color: 'success' };
  };

  if (loading && products.length === 0) {
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
          <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu inventario de joyería
          </p>
        </div>
        <button
          onClick={() => setShowProductModal(true)}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
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
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Filtro</label>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="lowStock"
                  checked={lowStockFilter}
                  onChange={(e) => setLowStockFilter(e.target.checked)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="lowStock" className="text-sm text-gray-700">
                  Solo stock bajo
                </label>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('');
                  setLowStockFilter(false);
                }}
                className="btn btn-secondary w-full"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Producto</th>
                  <th className="table-header-cell">SKU</th>
                  <th className="table-header-cell">Categoría</th>
                  <th className="table-header-cell">Precio</th>
                  <th className="table-header-cell">Stock</th>
                  <th className="table-header-cell">Estado</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {products.map((product) => {
                  const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level);
                  return (
                    <tr key={product.id} className="table-row">
                      <td className="table-cell">
                        <div className="flex items-center">
                          {product.image_url ? (
                            <img
                              src={product.image_url}
                              alt={product.name}
                              className="w-10 h-10 rounded-lg object-cover mr-3"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{product.name}</p>
                            <p className="text-sm text-gray-500">{product.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className="font-mono text-sm">{product.sku}</span>
                      </td>
                      <td className="table-cell">
                        <span className="badge badge-secondary">
                          {product.category_name || 'Sin categoría'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="font-semibold">${product.price}</span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{product.stock_quantity}</span>
                          {stockStatus.status === 'low' && (
                            <AlertTriangle className="w-4 h-4 text-warning-500" />
                          )}
                        </div>
                      </td>
                      <td className="table-cell">
                        <span className={`badge badge-${stockStatus.color}`}>
                          {stockStatus.text}
                        </span>
                      </td>
                      <td className="table-cell">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(product)}
                            className="p-1 text-gray-400 hover:text-primary-600"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStockUpdate(product)}
                            className="p-1 text-gray-400 hover:text-warning-600"
                            title="Actualizar Stock"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1 text-gray-400 hover:text-danger-600"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Modals */}
      {showProductModal && (
        <ProductModal
          product={selectedProduct}
          categories={categories}
          onClose={handleModalClose}
        />
      )}

      {showStockModal && (
        <StockModal
          product={selectedProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default Products;
