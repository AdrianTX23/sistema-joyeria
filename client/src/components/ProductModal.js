import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const ProductModal = ({ product, categories, onClose }) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    category_id: '',
    price: '',
    cost: '',
    stock_quantity: '',
    min_stock_level: '5',
    weight: '',
    dimensions: '',
    material: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku || '',
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id || '',
        price: product.price || '',
        cost: product.cost || '',
        stock_quantity: product.stock_quantity || '',
        min_stock_level: product.min_stock_level || '5',
        weight: product.weight || '',
        dimensions: product.dimensions || '',
        material: product.material || '',
      });
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (product) {
        // Update existing product
        await axios.put(`/api/products/${product.id}`, formData);
        toast.success('Producto actualizado exitosamente');
      } else {
        // Create new product
        await axios.post('/api/products', formData);
        toast.success('Producto creado exitosamente');
      }

      onClose();
    } catch (error) {
      const message = error.response?.data?.error || 'Error al guardar el producto';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">SKU *</label>
              <input
                type="text"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input"
                placeholder="SKU123"
                required
              />
            </div>

            <div>
              <label className="label">Nombre *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="input"
                placeholder="Nombre del producto"
                required
              />
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Descripción del producto"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Categoría</label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Sin categoría</option>
                {categories?.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Precio de Venta *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Costo *</label>
              <input
                type="number"
                name="cost"
                value={formData.cost}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </div>

            <div>
              <label className="label">Stock Inicial</label>
              <input
                type="number"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="input"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Stock Mínimo</label>
              <input
                type="number"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleChange}
                className="input"
                placeholder="5"
                min="0"
              />
            </div>

            <div>
              <label className="label">Peso (g)</label>
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="input"
                placeholder="0"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Dimensiones</label>
              <input
                type="text"
                name="dimensions"
                value={formData.dimensions}
                onChange={handleChange}
                className="input"
                placeholder="10x5x2 cm"
              />
            </div>

            <div>
              <label className="label">Material</label>
              <input
                type="text"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="input"
                placeholder="Oro, Plata, etc."
              />
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary flex-1"
            >
              {loading ? 'Guardando...' : (product ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
