import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  AlertTriangle,
  Filter,
  Grid3X3,
  List,
  MoreHorizontal,
  Eye,
  TrendingUp,
  DollarSign,
  Hash,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ProductModal from '../components/ProductModal';
import StockModal from '../components/StockModal';
import BackendTest from '../components/BackendTest';

const Products = () => {
  console.log('🚀 Products component - START OF COMPONENT');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('name'); // 'name', 'price', 'stock', 'date'

  console.log('🚀 Products component mounted');

  useEffect(() => {
    console.log('📋 Products useEffect triggered');
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      console.log('📦 Starting products fetch...');
      setLoading(true);
      setError(null);

      const response = await axios.get('/api/products');
      console.log('✅ Products response:', response.data);
      
      // Asegurar que products sea siempre un array
      const productsData = response.data.products;
      if (Array.isArray(productsData)) {
        setProducts(productsData);
      } else {
        console.error('❌ Products response is not an array:', productsData);
        setProducts([]);
        setError('Error: Respuesta del servidor no válida');
      }
    } catch (error) {
      console.error('❌ Products fetch error:', error);
      setError(error.response?.data?.error || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('📂 Starting categories fetch...');
      const response = await axios.get('/api/categories');
      console.log('✅ Categories response:', response.data);
      
      // Asegurar que categories sea siempre un array
      const categoriesData = response.data.categories;
      if (Array.isArray(categoriesData)) {
        setCategories(categoriesData);
      } else {
        console.error('❌ Categories response is not an array:', categoriesData);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Categories fetch error:', error);
    }
  };

  // Filtrar y ordenar productos
  const filteredAndSortedProducts = products
    .filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = !selectedCategory || product.category_id == selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.name || '').localeCompare(b.name || '');
        case 'price':
          return (a.price || 0) - (b.price || 0);
        case 'stock':
          return (a.stock_quantity || 0) - (b.stock_quantity || 0);
        case 'date':
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        default:
          return 0;
      }
    });

  const getStockStatus = (quantity, minLevel = 5) => {
    if (quantity === 0) return { status: 'out', text: 'Sin Stock', color: 'bg-red-100 text-red-800' };
    if (quantity <= minLevel) return { status: 'low', text: 'Stock Bajo', color: 'bg-yellow-100 text-yellow-800' };
    return { status: 'ok', text: 'En Stock', color: 'bg-green-100 text-green-800' };
  };

  console.log('🔄 Products render state:', {
    loading,
    productsCount: products.length,
    categoriesCount: categories.length,
    error,
    filteredCount: filteredAndSortedProducts.length
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600 mt-1">Gestiona tu inventario de joyería</p>
          </div>
        </div>
        
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner size="lg" />
          <div className="ml-4">
            <p className="text-gray-600">Cargando productos...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Productos</h1>
            <p className="text-gray-600 mt-1">Gestiona tu inventario de joyería</p>
          </div>
        </div>
        
        <div className="card">
          <div className="card-body">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Error al cargar productos
                </h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <button
                  onClick={() => {
                    setError(null);
                    fetchProducts();
                  }}
                  className="btn btn-primary"
                >
                  Reintentar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  console.log('🔄 Rendering main content');
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
        <button className="btn btn-primary mt-4 sm:mt-0">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Producto
        </button>
      </div>

      {/* Backend Test */}
      <BackendTest />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="p-2 bg-[#F9D664]/20 rounded-lg">
                <Package className="w-6 h-6 text-[#F9D664]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Productos</p>
                <p className="text-2xl font-bold text-gray-900">{products.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => (p.stock_quantity || 0) > 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => (p.stock_quantity || 0) <= (p.min_stock_level || 5)).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body p-4">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <Hash className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Sin Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {products.filter(p => (p.stock_quantity || 0) === 0).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card">
        <div className="card-body">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full sm:w-64"
                />
              </div>
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input w-full sm:w-48"
              >
                <option value="">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input w-full sm:w-40"
              >
                <option value="name">Ordenar por nombre</option>
                <option value="price">Ordenar por precio</option>
                <option value="stock">Ordenar por stock</option>
                <option value="date">Ordenar por fecha</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'grid' 
                    ? 'bg-[#F9D664] text-gray-900' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-[#F9D664] text-gray-900' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {filteredAndSortedProducts.length === 0 ? (
        <div className="card">
          <div className="card-body">
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategory ? 'No se encontraron productos' : 'No hay productos registrados'}
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || selectedCategory 
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer producto'
                }
              </p>
              {!searchTerm && !selectedCategory && (
                <button className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Producto
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="text-sm text-gray-600">
            Mostrando {filteredAndSortedProducts.length} de {products.length} productos
          </div>

          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredAndSortedProducts.map((product) => {
                const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level);
                return (
                  <div key={product.id} className="card hover:shadow-lg transition-shadow">
                    <div className="card-body p-4">
                      {/* Product Image Placeholder */}
                      <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center mb-4">
                        <Package className="w-12 h-12 text-gray-400" />
                      </div>
                      
                      {/* Product Info */}
                      <div className="space-y-2">
                        <h3 className="font-semibold text-gray-900 truncate">{product.name}</h3>
                        <p className="text-sm text-gray-500 font-mono">{product.sku}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                        
                        {/* Price and Stock */}
                        <div className="flex items-center justify-between">
                          <span className="text-lg font-bold text-[#F9D664]">
                            ${product.price || 0}
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                            {stockStatus.text}
                          </span>
                        </div>
                        
                        {/* Stock Quantity */}
                        <div className="text-sm text-gray-600">
                          Stock: {product.stock_quantity || 0}
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center space-x-2 pt-2">
                          <button className="btn btn-sm btn-outline flex-1">
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </button>
                          <button className="btn btn-sm btn-outline flex-1">
                            <Edit className="w-3 h-3 mr-1" />
                            Editar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="card">
              <div className="card-body p-0">
                <div className="overflow-x-auto">
                  <table className="table">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          SKU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Precio
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Stock
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredAndSortedProducts.map((product) => {
                        const stockStatus = getStockStatus(product.stock_quantity, product.min_stock_level);
                        return (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                                  <Package className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">{product.name}</div>
                                  <div className="text-sm text-gray-500">{product.description}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-mono text-sm text-gray-900">{product.sku}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">
                                {categories.find(c => c.id === product.category_id)?.name || 'Sin categoría'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-[#F9D664]">${product.price || 0}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm text-gray-900">{product.stock_quantity || 0}</span>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                                {stockStatus.text}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <button className="btn btn-sm btn-outline">
                                  <Eye className="w-3 h-3" />
                                </button>
                                <button className="btn btn-sm btn-outline">
                                  <Edit className="w-3 h-3" />
                                </button>
                                <button className="btn btn-sm btn-outline btn-danger">
                                  <Trash2 className="w-3 h-3" />
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
          )}
        </div>
      )}

      {/* Debug Info */}
      <div className="card">
        <div className="card-body">
          <h3 className="text-lg font-semibold mb-4">Debug Info</h3>
          <pre className="text-xs bg-gray-100 p-4 rounded">
            {JSON.stringify({
              productsCount: products.length,
              categoriesCount: categories.length,
              loading,
              error,
              searchTerm,
              selectedCategory,
              sortBy,
              viewMode,
              filteredCount: filteredAndSortedProducts.length,
              products: products.slice(0, 2) // Show first 2 products
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default Products;
