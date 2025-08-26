import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Plus,
  Search,
  User,
  Shield,
  Edit,
  Trash2,
  Key,
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import UserModal from '../components/UserModal';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [currentPage, searchTerm, selectedRole]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        search: searchTerm,
        role: selectedRole,
      });

      const response = await axios.get(`/api/users?${params}`);
      setUsers(response.data.users);
      setTotalPages(response.data.pagination.total);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        await axios.delete(`/api/users/${userId}`);
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setShowUserModal(true);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Usuarios</h1>
          <p className="text-gray-600 mt-1">
            Gestiona los usuarios del sistema
          </p>
        </div>
        <button 
          onClick={handleAddUser}
          className="btn btn-primary mt-4 sm:mt-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agregar Usuario
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Buscar</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>
            <div>
              <label className="label">Rol</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="input"
              >
                <option value="">Todos los roles</option>
                <option value="administrador">Administrador</option>
                <option value="vendedor">Vendedor</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedRole('');
                }}
                className="btn btn-secondary w-full"
              >
                Limpiar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Usuario</th>
                  <th className="table-header-cell">Email</th>
                  <th className="table-header-cell">Rol</th>
                  <th className="table-header-cell">Fecha de Registro</th>
                  <th className="table-header-cell">Acciones</th>
                </tr>
              </thead>
              <tbody className="table-body">
                {users.map((user) => (
                  <tr key={user.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center mr-3">
                          <User className="w-4 h-4 text-primary-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.full_name}</p>
                          <p className="text-sm text-gray-500">@{user.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm">{user.email}</span>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        user.role === 'administrador' ? 'badge-primary' : 'badge-secondary'
                      }`}>
                        <Shield className="w-3 h-3 mr-1" />
                        {user.role}
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className="text-sm text-gray-600">
                        {formatDate(user.created_at)}
                      </span>
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-1 text-gray-400 hover:text-primary-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          className="p-1 text-gray-400 hover:text-warning-600"
                          title="Restablecer Contraseña"
                        >
                          <Key className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-1 text-gray-400 hover:text-danger-600"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Página {currentPage} de {totalPages}
          </p>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="btn btn-secondary btn-sm"
            >
              Anterior
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="btn btn-secondary btn-sm"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* User Modal */}
      <UserModal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />
    </div>
  );
};

export default Users;
