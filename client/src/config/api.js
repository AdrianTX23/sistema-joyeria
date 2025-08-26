// Configuración del API
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '' // Use relative URLs in production since frontend and backend are on same domain
  : (process.env.REACT_APP_API_URL || 'http://localhost:5001');

export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export default API_CONFIG;
