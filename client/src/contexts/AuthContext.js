import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_CONFIG from '../config/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'UPDATE_USER':
      return {
        ...state,
        user: action.payload,
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Configurar axios con la URL del backend
  useEffect(() => {
    axios.defaults.baseURL = API_CONFIG.baseURL;
  }, []);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/profile');
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token: token,
            },
          });
        } catch (error) {
          localStorage.removeItem('token');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuth();
  }, [state.token]);

  const login = async (username, password) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      const { user, token } = response.data;
      
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      toast.success(`Bienvenido, ${user.fullName}!`);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
    toast.success('Sesión cerrada exitosamente');
  };

  const updateUser = (userData) => {
    dispatch({
      type: 'UPDATE_USER',
      payload: userData,
    });
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', {
        currentPassword,
        newPassword,
      });
      
      toast.success('Contraseña actualizada exitosamente');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Error al cambiar la contraseña';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
