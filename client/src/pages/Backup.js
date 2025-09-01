import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  Upload,
  RefreshCw,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  HardDrive,
  Plus,
  Eye
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Backup = () => {
  const [backups, setBackups] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoringBackup, setRestoringBackup] = useState(null);

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, []);

  const fetchBackups = async () => {
    try {
      const response = await axios.get('/api/backup/list');
      if (response.data.success) {
        setBackups(response.data.backups);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      toast.error('Error cargando backups');
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/backup/stats');
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    setCreatingBackup(true);
    try {
      const response = await axios.post('/api/backup/create');
      if (response.data.success) {
        toast.success('Backup creado exitosamente');
        fetchBackups();
        fetchStats();
      } else {
        toast.error('Error creando backup');
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      toast.error('Error creando backup');
    } finally {
      setCreatingBackup(false);
    }
  };

  const restoreBackup = async (filename) => {
    if (!window.confirm('¿Estás seguro de que quieres restaurar este backup? Esta acción sobrescribirá los datos actuales.')) {
      return;
    }

    setRestoringBackup(filename);
    try {
      const response = await axios.post(`/api/backup/restore/${filename}`);
      if (response.data.success) {
        toast.success('Backup restaurado exitosamente');
        // Recargar la página para reflejar los cambios
        window.location.reload();
      } else {
        toast.error('Error restaurando backup');
      }
    } catch (error) {
      console.error('Error restoring backup:', error);
      toast.error('Error restaurando backup');
    } finally {
      setRestoringBackup(null);
    }
  };

  const verifyBackup = async (filename) => {
    try {
      const response = await axios.get(`/api/backup/verify/${filename}`);
      if (response.data.success) {
        toast.success('Backup verificado correctamente');
      } else {
        toast.error('Backup corrupto o no encontrado');
      }
    } catch (error) {
      console.error('Error verifying backup:', error);
      toast.error('Error verificando backup');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Sistema de Backup
        </h1>
        <p className="text-gray-600">
          Gestiona y protege los datos de tu joyería con backups automáticos
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Backups</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalBackups}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <HardDrive className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tamaño Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSize}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-[#F9D664]/20 rounded-lg">
                <Clock className="w-6 h-6 text-[#F9D664]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Último Backup</p>
                <p className="text-lg font-bold text-gray-900">
                  {stats.newestBackup ? formatDate(stats.newestBackup) : 'N/A'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tamaño Promedio</p>
                <p className="text-2xl font-bold text-gray-900">{stats.averageSize}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Acciones</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={createBackup}
              disabled={creatingBackup}
              className="btn btn-primary flex items-center"
            >
              {creatingBackup ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              {creatingBackup ? 'Creando...' : 'Crear Backup'}
            </button>

            <button
              onClick={() => {
                fetchBackups();
                fetchStats();
              }}
              className="btn btn-secondary flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {/* Backups List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Backups Disponibles</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archivo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tamaño
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Creado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Modificado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {backups.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No hay backups disponibles
                  </td>
                </tr>
              ) : (
                backups.map((backup, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-blue-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {backup.filename}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {backup.size}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.created)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(backup.modified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => verifyBackup(backup.filename)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Verificar"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => restoreBackup(backup.filename)}
                          disabled={restoringBackup === backup.filename}
                          className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          title="Restaurar"
                        >
                          {restoringBackup === backup.filename ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start">
          <CheckCircle className="w-6 h-6 text-blue-600 mt-1 mr-3" />
          <div>
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Información del Sistema de Backup
            </h3>
            <ul className="text-blue-800 space-y-1">
              <li>• Los backups se crean automáticamente cada día a las 2:00 AM</li>
              <li>• Se mantienen los últimos 30 backups para ahorrar espacio</li>
              <li>• Los archivos se comprimen automáticamente para optimizar almacenamiento</li>
              <li>• Siempre se crea un backup antes de restaurar para mayor seguridad</li>
              <li>• Se recomienda verificar la integridad de los backups regularmente</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Backup;
