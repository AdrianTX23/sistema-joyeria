import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

const UserModal = ({ isOpen, onClose, onSuccess, user = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    fullName: '',
    role: 'vendedor'
  });

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        email: user.email || '',
        password: '',
        fullName: user.full_name || '',
        role: user.role || 'vendedor'
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        fullName: '',
        role: 'vendedor'
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.username || !formData.email || !formData.fullName) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    if (!user && !formData.password) {
      toast.error('La contraseña es requerida para nuevos usuarios');
      return;
    }

    setLoading(true);
    try {
      if (user) {
        // Actualizar usuario
        const updateData = { ...formData };
        if (!formData.password) {
          delete updateData.password;
        }
        await axios.put(`/api/users/${user.id}`, updateData);
        toast.success('Usuario actualizado exitosamente');
      } else {
        // Crear nuevo usuario
        const response = await axios.post('/api/auth/register', formData);
        
        toast.success('Usuario creado exitosamente');
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || 'Error al guardar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">
            {user ? 'Editar Usuario' : 'Nuevo Usuario'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="label">Nombre de Usuario *</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              className="input"
              placeholder="usuario123"
              required
            />
          </div>

          <div>
            <label className="label">Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input"
              placeholder="usuario@ejemplo.com"
              required
            />
          </div>

          <div>
            <label className="label">Nombre Completo *</label>
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="input"
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div>
            <label className="label">Contraseña {!user && '*'}</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="input"
              placeholder={user ? 'Dejar vacío para no cambiar' : 'Contraseña'}
              required={!user}
            />
            {user && (
              <p className="text-sm text-gray-500 mt-1">
                Deja vacío para mantener la contraseña actual
              </p>
            )}
          </div>

          <div>
            <label className="label">Rol *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="input"
            >
              <option value="vendedor">Vendedor</option>
              <option value="administrador">Administrador</option>
            </select>
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
              {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserModal;
