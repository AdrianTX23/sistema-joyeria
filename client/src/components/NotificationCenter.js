import React, { useState, useEffect } from 'react';
import { Bell, X, AlertTriangle, Info, CheckCircle } from 'lucide-react';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);

  // Simular notificaciones del sistema
  useEffect(() => {
    const systemNotifications = [
      {
        id: 1,
        type: 'warning',
        title: 'Stock Bajo',
        message: '5 productos tienen stock bajo',
        time: '2 min ago'
      },
      {
        id: 2,
        type: 'info',
        title: 'Backup Completado',
        message: 'Respaldo de base de datos exitoso',
        time: '1 hora ago'
      },
      {
        id: 3,
        type: 'success',
        title: 'Venta Exitosa',
        message: 'Nueva venta registrada: $1,250',
        time: '3 horas ago'
      }
    ];

    setNotifications(systemNotifications);
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-warning-600" />;
      case 'info':
        return <Info className="w-5 h-5 text-info-600" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-success-600" />;
      default:
        return <Info className="w-5 h-5 text-gray-600" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case 'warning':
        return 'bg-warning-100 text-warning-800';
      case 'info':
        return 'bg-info-100 text-info-800';
      case 'success':
        return 'bg-success-100 text-success-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.length;

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No hay notificaciones
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className="p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-1">
                        {getIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {notification.title}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {notification.time}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-200">
              <button
                onClick={() => setNotifications([])}
                className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                Marcar todas como leídas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;
