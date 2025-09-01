import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Package, TrendingUp, TrendingDown } from 'lucide-react';

const StockModal = ({ isOpen, onClose, product, onStockUpdate }) => {
  const [quantity, setQuantity] = useState(0);
  const [movementType, setMovementType] = useState('add'); // 'add' or 'subtract'
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setQuantity(0);
      setMovementType('add');
      setReason('');
    }
  }, [product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || quantity <= 0) return;

    setLoading(true);
    try {
      // Aquí iría la lógica para actualizar el stock
      // Por ahora solo simulamos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onStockUpdate) {
        onStockUpdate({
          productId: product.id,
          quantity: movementType === 'add' ? quantity : -quantity,
          reason,
          type: movementType
        });
      }
      
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-[#F9D664]/20 rounded-lg">
              <Package className="w-6 h-6 text-[#F9D664]" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Gestionar Stock</h3>
              <p className="text-sm text-gray-600">{product.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Current Stock Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-600">Stock Actual</p>
                <p className="text-2xl font-bold text-gray-900">{product.stock_quantity || 0}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Stock Mínimo</p>
                <p className="text-lg font-semibold text-yellow-600">{product.min_stock_level || 5}</p>
              </div>
            </div>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de Movimiento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMovementType('add')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  movementType === 'add'
                    ? 'border-[#F9D664] bg-[#F9D664]/10 text-[#F9D664]'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Plus className="w-4 h-4" />
                  <span>Agregar</span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setMovementType('subtract')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  movementType === 'subtract'
                    ? 'border-red-500 bg-red-50 text-red-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Minus className="w-4 h-4" />
                  <span>Restar</span>
                </div>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cantidad
            </label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              className="input w-full"
              placeholder="Ingresa la cantidad"
              required
            />
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input w-full"
              required
            >
              <option value="">Selecciona un motivo</option>
              {movementType === 'add' ? (
                <>
                  <option value="compra">Compra de inventario</option>
                  <option value="devolucion">Devolución de cliente</option>
                  <option value="ajuste">Ajuste de inventario</option>
                  <option value="transferencia">Transferencia entre sucursales</option>
                </>
              ) : (
                <>
                  <option value="venta">Venta</option>
                  <option value="perdida">Pérdida o daño</option>
                  <option value="ajuste">Ajuste de inventario</option>
                  <option value="transferencia">Transferencia entre sucursales</option>
                </>
              )}
            </select>
          </div>

          {/* Preview */}
          {quantity > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-blue-800">
                {movementType === 'add' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-medium">Resumen del cambio:</span>
              </div>
              <p className="text-sm text-blue-700 mt-1">
                Stock actual: <strong>{product.stock_quantity || 0}</strong>
                {movementType === 'add' ? ' + ' : ' - '}
                <strong>{quantity}</strong>
                {' = '}
                <strong>
                  {movementType === 'add' 
                    ? (product.stock_quantity || 0) + quantity
                    : Math.max(0, (product.stock_quantity || 0) - quantity)
                  }
                </strong>
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={loading || !quantity || !reason}
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Actualizando...</span>
                </div>
              ) : (
                `Actualizar Stock`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockModal;
