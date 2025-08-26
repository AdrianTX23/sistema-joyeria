import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingCart, Package, BarChart3, Plus, Users } from 'lucide-react';

const QuickActions = ({ variant = 'default' }) => {
  const navigate = useNavigate();

  const actions = [
    {
      id: 'new-sale',
      title: 'Nueva Venta',
      icon: ShoppingCart,
      color: 'primary',
      onClick: () => navigate('/sales'),
      description: 'Registrar una nueva venta'
    },
    {
      id: 'add-product',
      title: 'Agregar Producto',
      icon: Package,
      color: 'secondary',
      onClick: () => navigate('/products'),
      description: 'Añadir producto al inventario'
    },
    {
      id: 'view-reports',
      title: 'Ver Reportes',
      icon: BarChart3,
      color: 'secondary',
      onClick: () => navigate('/reports'),
      description: 'Analizar datos del negocio'
    },
    {
      id: 'manage-users',
      title: 'Gestionar Usuarios',
      icon: Users,
      color: 'secondary',
      onClick: () => navigate('/users'),
      description: 'Administrar usuarios del sistema'
    }
  ];

  if (variant === 'compact') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {actions.slice(0, 4).map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.onClick}
              className={`btn btn-${action.color} btn-sm w-full flex items-center justify-center`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {action.title}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={action.onClick}
            className={`w-full btn btn-${action.color} btn-sm flex items-center justify-between group`}
          >
            <div className="flex items-center">
              <Icon className="w-4 h-4 mr-2" />
              <span>{action.title}</span>
            </div>
            <Plus className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        );
      })}
    </div>
  );
};

export default QuickActions;
