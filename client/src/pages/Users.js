import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  User,
  Plus,
  Edit,
  Trash2,
  Search,
  Shield,
  RefreshCw,
  UserPlus,
  Filter,
  Grid3X3,
  List,
  Download,
  UserX,
  Eye,
  Mail,
  Phone,
  MapPin,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import UserModal from '../components/UserModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUser = async (userData) => {
    try {
      if (selectedUser) {
        // Actualizar usuario existente
        await axios.put(`/api/users/${selectedUser.id}`, userData);
        toast.success('Usuario actualizado correctamente');
      } else {
        // Crear nuevo usuario
        await axios.post('/api/users', userData);
        toast.success('Usuario creado correctamente');
      }
      setShowUserModal(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Error al guardar usuario');
      }
    }
  };

  const handleAddUser = () => {
    setSelectedUser(null); // Asegurar que no hay usuario seleccionado
    setShowUserModal(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        toast.success('Usuario eliminado correctamente');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('Error al eliminar usuario');
      }
    }
  };

  const handleExport = () => {
    // Implementar exportación
    toast.info('Función de exportación en desarrollo');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'administrador':
        return 'from-purple-500 to-purple-600';
      case 'vendedor':
        return 'from-blue-500 to-blue-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'administrador':
        return <Shield className="w-4 h-4" />;
      case 'vendedor':
        return <User className="w-4 h-4" />;
      default:
        return <User className="w-4 h-4" />;
    }
  };

  const getStatusColor = (user) => {
    // Simular estado activo/inactivo basado en la fecha de creación
    const daysSinceCreation = Math.floor((new Date() - new Date(user.created_at)) / (1000 * 60 * 60 * 24));
    if (daysSinceCreation < 30) return 'from-green-500 to-green-600';
    if (daysSinceCreation < 90) return 'from-yellow-500 to-yellow-600';
    return 'from-gray-500 to-gray-600';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Filtrar usuarios
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !selectedRole || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Calcular paginación
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header con gradiente */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-2xl lg:text-3xl xl:text-4xl font-bold mb-2">
                👥 Gestión de Usuarios
              </h1>
              <p className="text-indigo-100 text-base lg:text-lg">
                Administra usuarios, roles y permisos del sistema
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
              <button
                onClick={fetchUsers}
                disabled={loading}
                className="inline-flex items-center px-3 lg:px-4 py-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-all duration-200 border border-white/30 text-sm lg:text-base"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </button>
              
              <button
                onClick={handleAddUser}
                className="inline-flex items-center px-4 lg:px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm lg:text-base"
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Agregar Usuario
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Filtros y controles */}
        <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 p-4 lg:p-6 mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 lg:gap-6">
            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 lg:w-5 h-4 lg:h-5 text-gray-500" />
                <span className="text-sm lg:text-base font-medium text-gray-700">Filtros:</span>
              </div>
              
              <input
                type="text"
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base min-w-[200px] lg:min-w-[250px]"
              />
              
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm lg:text-base"
              >
                <option value="">Todos los roles</option>
                <option value="administrador">Administrador</option>
                <option value="vendedor">Vendedor</option>
                <option value="inventario">Inventario</option>
              </select>
            </div>
            
            <div className="flex items-center gap-3 lg:gap-4">
              {/* Toggle de vista */}
              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'grid'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vista de cuadrícula"
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all duration-200 ${
                    viewMode === 'list'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  title="Vista de lista"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              <button
                onClick={handleExport}
                className="inline-flex items-center px-3 lg:px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 rounded-lg font-medium text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm lg:text-base"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Contenido de usuarios */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-12">
            <UserX className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron usuarios</h3>
            <p className="text-gray-500">Intenta ajustar los filtros de búsqueda</p>
          </div>
        ) : (
          <>
            {/* Vista de cuadrícula */}
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {currentUsers.map((user) => (
                  <div key={user.id} className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className={`bg-gradient-to-r ${getRoleColor(user.role)} p-4 lg:p-6 text-white relative`}>
                      {/* Badge de estado */}
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      
                      {/* Foto de perfil */}
                      <div className="flex justify-center mb-4">
                        <div className="w-16 lg:w-20 h-16 lg:h-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30">
                          {user.profile_image ? (
                            <img src={user.profile_image} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-8 lg:w-10 h-8 lg:h-10 text-white" />
                          )}
                        </div>
                      </div>
                      
                      <h3 className="text-base lg:text-lg font-bold text-center mb-1">{user.full_name}</h3>
                      <p className="text-indigo-100 text-sm text-center mb-3">@{user.username}</p>
                      
                      {/* Rol */}
                      <div className="flex justify-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="ml-1 capitalize">{user.role}</span>
                        </span>
                      </div>
                    </div>
                    
                    {/* Información del usuario */}
                    <div className="p-4 lg:p-6 space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="truncate">{user.email}</span>
                      </div>
                      
                      {user.phone && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                      
                      {user.address && (
                        <div className="flex items-start text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{user.address}</span>
                        </div>
                      )}
                      
                      {user.bio && (
                        <div className="text-sm text-gray-600">
                          <p className="line-clamp-3">{user.bio}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Acciones */}
                    <div className="px-4 lg:px-6 pb-4 lg:pb-6">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver/Editar
                        </button>
                        
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="inline-flex items-center justify-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Vista de lista */}
            {viewMode === 'list' && (
              <div className="bg-white rounded-xl lg:rounded-2xl shadow-lg lg:shadow-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Usuario
                        </th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Rol
                        </th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 lg:px-6 py-3 lg:py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentUsers.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mr-3">
                                {user.profile_image ? (
                                  <img src={user.profile_image} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                  <User className="w-5 h-5 text-white" />
                                )}
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{user.full_name}</div>
                                <div className="text-sm text-gray-500">@{user.username}</div>
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                              {getRoleIcon(user.role)}
                              <span className="ml-1 capitalize">{user.role}</span>
                            </span>
                          </td>
                          
                          <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{user.email}</div>
                            {user.phone && (
                              <div className="text-sm text-gray-500">{user.phone}</div>
                            )}
                          </td>
                          
                          <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.is_active ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>
                          
                          <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEdit(user)}
                                className="inline-flex items-center px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                              >
                                <Eye className="w-3 h-3 mr-1" />
                                Ver/Editar
                              </button>
                              
                              <button
                                onClick={() => handleDelete(user.id)}
                                className="inline-flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors duration-200"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-6 lg:mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsers.length)} de {filteredUsers.length} usuarios
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Anterior
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 border rounded-lg text-sm font-medium transition-colors duration-200 ${
                        currentPage === page
                          ? 'border-indigo-500 bg-indigo-500 text-white'
                          : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de usuario */}
      {showUserModal && (
        <UserModal
          user={selectedUser}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={handleSaveUser}
        />
      )}
    </div>
  );
};

export default Users;
