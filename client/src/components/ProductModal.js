import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Upload, Package } from 'lucide-react';
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
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

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
      setImagePreview(product.image_url || '');
    }
  }, [product]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      
      // Add form fields
      Object.keys(formData).forEach(key => {
        if (formData[key] !== '') {
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add image if selected
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      if (product) {
        // Update existing product
        await axios.put(`/api/products/${product.id}`, formDataToSend);
        toast.success('Producto actualizado exitosamente');
      } else {
        // Create new product
        await axios.post('/api/products', formDataToSend);
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-large max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card-body space-y-6">
          {/* Image Upload */}
          <div>
            <label className="label">Imagen del Producto</label>
            <div className="flex items-center space-x-4">
              <div className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <Package className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="btn btn-secondary cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Subir Imagen
                </label>
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sku" className="label">SKU *</label>
              <input
                type="text"
                id="sku"
                name="sku"
                value={formData.sku}
                onChange={handleChange}
                className="input"
                placeholder="SKU-001"
                required
              />
            </div>
            <div>
              <label htmlFor="name" className="label">Nombre *</label>
              <input
                type="text"
                id="name"
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
            <label htmlFor="description" className="label">Descripción</label>
            <textarea
              id="description"
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
              <label htmlFor="category_id" className="label">Categoría</label>
              <select
                id="category_id"
                name="category_id"
                value={formData.category_id}
                onChange={handleChange}
                className="input"
              >
                <option value="">Seleccionar categoría</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="material" className="label">Material</label>
              <input
                type="text"
                id="material"
                name="material"
                value={formData.material}
                onChange={handleChange}
                className="input"
                placeholder="Oro, Plata, etc."
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className="label">Precio de Venta *</label>
              <input
                type="number"
                id="price"
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
            <div>
              <label htmlFor="cost" className="label">Costo *</label>
              <input
                type="number"
                id="cost"
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
          </div>

          {/* Stock Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="stock_quantity" className="label">Stock Inicial</label>
              <input
                type="number"
                id="stock_quantity"
                name="stock_quantity"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="input"
                placeholder="0"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="min_stock_level" className="label">Stock Mínimo</label>
              <input
                type="number"
                id="min_stock_level"
                name="min_stock_level"
                value={formData.min_stock_level}
                onChange={handleChange}
                className="input"
                placeholder="5"
                min="0"
              />
            </div>
            <div>
              <label htmlFor="weight" className="label">Peso (g)</label>
              <input
                type="number"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                className="input"
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="dimensions" className="label">Dimensiones</label>
            <input
              type="text"
              id="dimensions"
              name="dimensions"
              value={formData.dimensions}
              onChange={handleChange}
              className="input"
              placeholder="Largo x Ancho x Alto"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="loading-spinner-sm mr-2" />
                  Guardando...
                </div>
              ) : (
                product ? 'Actualizar' : 'Crear'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
