import React, { useState } from 'react';
import axios from 'axios';
import { X, Package, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const StockModal = ({ product, onClose }) => {
  const [formData, setFormData] = useState({
    quantity: '',
    movementType: 'adjustment',
    notes: '',
  });
  const [loading, setLoading] = useState(false);

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
      await axios.patch(`/api/products/${product.id}/stock`, formData);
      toast.success('Stock actualizado exitosamente');
      onClose();
    } catch (error) {
      const message = error.response?.data?.error || 'Error al actualizar el stock';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const getNewStock = () => {
    const currentStock = product.stock_quantity;
    const change = parseInt(formData.quantity) || 0;
    return Math.max(0, currentStock + change);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-large max-w-md w-full">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Actualizar Stock
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="card-body space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                <p className="text-sm text-gray-500">
                  Stock actual: <span className="font-medium">{product.stock_quantity}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Stock Change */}
          <div>
            <label htmlFor="quantity" className="label">Cantidad a Ajustar *</label>
            <div className="relative">
              <input
                type="number"
                id="quantity"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                className="input"
                placeholder="0"
                required
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                {parseInt(formData.quantity) > 0 ? (
                  <TrendingUp className="w-5 h-5 text-success-600" />
                ) : parseInt(formData.quantity) < 0 ? (
                  <TrendingDown className="w-5 h-5 text-danger-600" />
                ) : null}
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Use números positivos para agregar, negativos para restar
            </p>
          </div>

          {/* Movement Type */}
          <div>
            <label htmlFor="movementType" className="label">Tipo de Movimiento</label>
            <select
              id="movementType"
              name="movementType"
              value={formData.movementType}
              onChange={handleChange}
              className="input"
            >
              <option value="adjustment">Ajuste de Stock</option>
              <option value="restock">Reabastecimiento</option>
              <option value="damage">Daño/Pérdida</option>
              <option value="return">Devolución</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="label">Notas</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="input"
              rows="3"
              placeholder="Motivo del ajuste de stock..."
            />
          </div>

          {/* Preview */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Resumen del Cambio</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">Stock Actual:</span>
                <span className="font-medium">{product.stock_quantity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Cambio:</span>
                <span className={`font-medium ${
                  parseInt(formData.quantity) > 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {parseInt(formData.quantity) > 0 ? '+' : ''}{formData.quantity || 0}
                </span>
              </div>
              <div className="flex justify-between border-t border-blue-200 pt-2">
                <span className="text-blue-900 font-medium">Nuevo Stock:</span>
                <span className="font-bold text-blue-900">{getNewStock()}</span>
              </div>
            </div>
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
                  Actualizando...
                </div>
              ) : (
                'Actualizar Stock'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockModal;
