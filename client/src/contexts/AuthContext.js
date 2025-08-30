import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_CONFIG from '../config/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: sessionStorage.getItem('token') || localStorage.getItem('token'), // Usar sessionStorage primero
  isAuthenticated: false,
  loading: true,
  sessionExpired: false,
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        sessionExpired: false,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false,
        sessionExpired: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        sessionExpired: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        sessionExpired: false,
      };
    case 'SESSION_EXPIRED':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        sessionExpired: true,
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
      // Intentar obtener token de sessionStorage primero (sesión temporal)
      let token = sessionStorage.getItem('token');
      let isSessionToken = true;
      
      // Si no hay token en sessionStorage, intentar localStorage (sesión persistente)
      if (!token) {
        token = localStorage.getItem('token');
        isSessionToken = false;
      }
      
      if (token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          const response = await axios.get('/api/auth/profile');
          
          // Si el token es de sessionStorage, moverlo a sessionStorage para mantener la sesión temporal
          if (isSessionToken) {
            sessionStorage.setItem('token', token);
          }
          
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.user,
              token: token,
            },
          });
        } catch (error) {
          // Limpiar tokens inválidos
          sessionStorage.removeItem('token');
          localStorage.removeItem('token');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } else {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkAuth();
  }, []); // Removed state.token dependency to prevent infinite loops

  // Manejar cierre de sesión automático cuando se cierra la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Si hay un token en sessionStorage, limpiarlo al cerrar la página
      if (sessionStorage.getItem('token')) {
        sessionStorage.removeItem('token');
      }
    };

    const handleVisibilityChange = () => {
      // Si la página se oculta por más de 30 minutos, cerrar sesión
      if (document.hidden) {
        setTimeout(() => {
          if (document.hidden && sessionStorage.getItem('token')) {
            sessionStorage.removeItem('token');
            dispatch({ type: 'SESSION_EXPIRED' });
            toast.error('Sesión expirada por inactividad');
          }
        }, 30 * 60 * 1000); // 30 minutos
      }
    };

    // Eventos para detectar cierre de página/pestaña
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Limpiar eventos al desmontar
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const login = async (username, password, rememberMe = false) => {
    dispatch({ type: 'LOGIN_START' });
    
    try {
      const response = await axios.post('/api/auth/login', {
        username,
        password,
      });

      const { user, token } = response.data;
      
      // Si "recordar sesión" está marcado, usar localStorage (persistente)
      // Si no, usar sessionStorage (temporal, se pierde al cerrar la página)
      if (rememberMe) {
        localStorage.setItem('token', token);
        localStorage.removeItem('sessionToken'); // Limpiar token de sesión si existe
      } else {
        sessionStorage.setItem('token', token);
        localStorage.removeItem('token'); // Limpiar token persistente si existe
      }
      
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
    // Limpiar todos los tokens
    sessionStorage.removeItem('token');
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
