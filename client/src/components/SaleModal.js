import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Minus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const SaleModal = ({ isOpen, onClose, onSuccess }) => {
  const [products, setProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('efectivo');

  useEffect(() => {
    if (isOpen) {
      fetchProducts();
    }
  }, [isOpen]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get('/api/products?limit=100');
      setProducts(response.data.products.filter(p => p.stock_quantity > 0));
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Error al cargar productos');
    }
  };

  const addProduct = (product) => {
    const existing = selectedProducts.find(p => p.id === product.id);
    if (existing) {
      setSelectedProducts(selectedProducts.map(p => 
        p.id === product.id 
          ? { ...p, quantity: Math.min(p.quantity + 1, product.stock_quantity) }
          : p
      ));
    } else {
      setSelectedProducts([...selectedProducts, { ...product, quantity: 1 }]);
    }
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    } else {
      const product = products.find(p => p.id === productId);
      setSelectedProducts(selectedProducts.map(p => 
        p.id === productId 
          ? { ...p, quantity: Math.min(quantity, product.stock_quantity) }
          : p
      ));
    }
  };

  const removeProduct = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedProducts.length === 0) {
      toast.error('Debes seleccionar al menos un producto');
      return;
    }

    if (!customerName.trim()) {
      toast.error('El nombre del cliente es requerido');
      return;
    }

    setLoading(true);
    try {
      const saleData = {
        customer_name: customerName,
        customer_email: customerEmail,
        payment_method: paymentMethod,
        items: selectedProducts.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
          unit_price: item.price
        }))
      };

      await axios.post('/api/sales', saleData);
      toast.success('Venta registrada exitosamente');
      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast.error(error.response?.data?.error || 'Error al crear la venta');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedProducts([]);
    setCustomerName('');
    setCustomerEmail('');
    setPaymentMethod('efectivo');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Nueva Venta</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex h-[calc(90vh-120px)]">
          {/* Productos disponibles */}
          <div className="w-1/2 p-6 border-r overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Productos Disponibles</h3>
            <div className="space-y-2">
              {products.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => addProduct(product)}
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{product.name}</h4>
                    <p className="text-sm text-gray-600">
                      Stock: {product.stock_quantity} | ${product.price.toLocaleString()}
                    </p>
                  </div>
                  <Plus className="w-5 h-5 text-primary-600" />
                </div>
              ))}
            </div>
          </div>

          {/* Carrito */}
          <div className="w-1/2 p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-4">Carrito de Compra</h3>
            
            {/* Información del cliente */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="label">Nombre del Cliente *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="input"
                  placeholder="Nombre completo"
                  required
                />
              </div>
              <div>
                <label className="label">Email del Cliente</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="input"
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div>
                <label className="label">Método de Pago</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="input"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>
            </div>

            {/* Productos seleccionados */}
            <div className="flex-1 overflow-y-auto">
              {selectedProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No hay productos seleccionados
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedProducts.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-gray-600">
                          ${item.price.toLocaleString()} c/u
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="btn btn-sm btn-outline"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="btn btn-sm btn-outline"
                          disabled={item.quantity >= item.stock_quantity}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeProduct(item.id)}
                          className="btn btn-sm btn-danger ml-2"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total y botones */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  ${calculateTotal().toLocaleString()}
                </span>
              </div>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="btn btn-outline flex-1"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedProducts.length === 0}
                  className="btn btn-primary flex-1"
                >
                  {loading ? 'Procesando...' : 'Completar Venta'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleModal;
