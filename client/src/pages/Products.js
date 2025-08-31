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
import BackendTest from '../components/BackendTest';

const Products = () => {
  console.log('🚀 Products component - START OF COMPONENT');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);

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
      
      setProducts(response.data.products || []);
    } catch (error) {
      console.error('❌ Products fetch error:', error);
      setError(error.response?.data?.error || 'Error loading products');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      console.log('📂 Starting categories fetch...');
      const response = await axios.get('/api/categories');
      console.log('✅ Categories response:', response.data);
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('❌ Categories fetch error:', error);
    }
  };

  console.log('🔄 Products render state:', {
    loading,
    productsCount: products.length,
    categoriesCount: categories.length,
    error
  });

  try {
    if (loading) {
      console.log('🔄 Rendering loading state');
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
      console.log('🔄 Rendering error state');
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

        {/* Products List */}
        <div className="card">
          <div className="card-body">
            <h3 className="text-lg font-semibold mb-4">Lista de Productos</h3>
            
            {products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No hay productos registrados</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table">
                  <thead>
                    <tr>
                      <th>SKU</th>
                      <th>Nombre</th>
                      <th>Precio</th>
                      <th>Stock</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product.id}>
                        <td>{product.sku}</td>
                        <td>{product.name}</td>
                        <td>${product.price}</td>
                        <td>{product.stock_quantity}</td>
                        <td>
                          <button className="btn btn-sm btn-outline mr-2">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button className="btn btn-sm btn-outline btn-danger">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

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
                products: products.slice(0, 2) // Show first 2 products
              }, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    );
  } catch (componentError) {
    console.error('❌ CRITICAL ERROR in Products component:', componentError);
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
                  Error crítico en el componente
                </h3>
                <p className="text-gray-600 mb-4">
                  {componentError.message}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="btn btn-primary"
                >
                  Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Products;
