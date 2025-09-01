import React, { createContext, useContext, useReducer, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_CONFIG from '../config/api';

const AuthContext = createContext();

const initialState = {
  user: null,
  token: sessionStorage.getItem('token') || localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  sessionExpired: false,
};

const authReducer = (state, action) => {
  console.log('🔄 Auth reducer action:', action.type, action.payload);
  
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

  console.log('🔍 AuthProvider - Current state:', state);

  // Configurar axios con la URL del backend
  useEffect(() => {
    console.log('🔧 Setting up axios with baseURL:', API_CONFIG.baseURL);
    axios.defaults.baseURL = API_CONFIG.baseURL;
  }, []);

  // Set up axios defaults
  useEffect(() => {
    if (state.token) {
      console.log('🔑 Setting Authorization header with token');
      axios.defaults.headers.common['Authorization'] = `Bearer ${state.token}`;
    } else {
      console.log('🔓 Removing Authorization header');
      delete axios.defaults.headers.common['Authorization'];
    }
  }, [state.token]);

  // Función para verificar autenticación
  const checkAuth = async () => {
    console.log('🔍 Checking authentication on app load...');
    
    // Intentar obtener token de sessionStorage primero (sesión temporal)
    let token = sessionStorage.getItem('token');
    let isSessionToken = true;
    
    // Si no hay token en sessionStorage, intentar localStorage (sesión persistente)
    if (!token) {
      token = localStorage.getItem('token');
      isSessionToken = false;
    }
    
    console.log('🎫 Token found:', token ? 'Yes' : 'No', 'Type:', isSessionToken ? 'session' : 'local');
    
    if (token) {
      try {
        console.log('🔍 Validating token with server...');
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await axios.get('/api/auth/profile');
        console.log('✅ Token validation successful:', response.data);
        
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
        console.error('❌ Token validation failed:', error.response?.data || error.message);
        // Limpiar tokens inválidos
        sessionStorage.removeItem('token');
        localStorage.removeItem('token');
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    } else {
      console.log('🚫 No token found, user not authenticated');
      dispatch({ type: 'LOGIN_FAILURE' });
    }
  };

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuth();
  }, []);

  // Manejar cierre de sesión automático cuando se cierra la página
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('🔄 Page unloading, cleaning session token');
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
            console.log('⏰ Session expired due to inactivity');
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
    console.log('🔐 Iniciando proceso de login...', {
      username,
      password: password ? '***' : 'undefined',
      rememberMe,
      timestamp: new Date().toISOString()
    });

    try {
      dispatch({ type: 'LOGIN_START' });
      // setLoading(true); // This line was removed from the new_code, so it's removed here.
      // setError(null); // This line was removed from the new_code, so it's removed here.

      console.log('📡 Enviando petición de login...');
      
      const response = await axios.post('/api/auth/login', {
        username,
        password,
        rememberMe
      });

      console.log('✅ Respuesta de login recibida:', {
        status: response.status,
        hasToken: !!response.data.token,
        hasUser: !!response.data.user,
        userRole: response.data.user?.role
      });

      const { token, user } = response.data;

      // Guardar token y datos del usuario
      if (rememberMe) {
        console.log('💾 Guardando sesión persistente en localStorage');
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('sessionType', 'persistente');
      } else {
        console.log('💾 Guardando sesión temporal en sessionStorage');
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('user', JSON.stringify(user));
        sessionStorage.setItem('sessionType', 'temporal');
      }

      // Configurar axios para futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      console.log('👤 Usuario autenticado:', {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email
      });

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, token },
      });

      toast.success(`Bienvenido, ${user.fullName}!`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error en login:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });

      const message = error.response?.data?.error || 'Error al iniciar sesión';
      toast.error(message);
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: message };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out user');
    // Limpiar todos los tokens
    sessionStorage.removeItem('token');
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    dispatch({ type: 'LOGOUT' });
    toast.success('Sesión cerrada exitosamente');
  };

  const updateUser = (userData) => {
    console.log('👤 Updating user data:', userData);
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
    checkAuth,
  };

  console.log('🎯 AuthProvider - Final state:', state);

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

// Exportar AuthContext para uso directo
export { AuthContext };
