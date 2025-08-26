// Configuración de Email - Copia este archivo como email.config.js y configura tus credenciales

module.exports = {
  // Configuración de Gmail
  email: {
    service: 'gmail',
    auth: {
      user: 'tu-email@gmail.com',
      pass: 'tu-contraseña-de-aplicación' // Usa contraseña de aplicación, no tu contraseña normal
    }
  },
  
  // URL del frontend
  frontendUrl: 'http://localhost:3000',
  
  // Configuración de JWT
  jwtSecret: 'your-secret-key-change-in-production'
};

/*
INSTRUCCIONES PARA CONFIGURAR GMAIL:

1. Ve a tu cuenta de Google
2. Activa la verificación en dos pasos
3. Ve a "Contraseñas de aplicación"
4. Genera una nueva contraseña para "Correo"
5. Usa esa contraseña en lugar de tu contraseña normal

ALTERNATIVAS:
- Outlook: service: 'outlook'
- Yahoo: service: 'yahoo'
- Otros: Configuración SMTP personalizada
*/
