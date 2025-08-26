// Configuración para el build en Vercel
const fs = require('fs');
const path = require('path');

// Crear archivo .env.production temporal
const envContent = `GENERATE_SOURCEMAP=false
CI=false
SKIP_PREFLIGHT_CHECK=true
REACT_APP_API_URL=https://your-vercel-domain.vercel.app/api
`;

const envPath = path.join(__dirname, 'client', '.env.production');

try {
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Archivo .env.production creado para el build');
} catch (error) {
  console.log('⚠️ No se pudo crear .env.production:', error.message);
}

console.log('✅ Configuración de build completada');
