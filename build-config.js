// Configuración para el build en Vercel
const fs = require('fs');
const path = require('path');

// Crear archivo .env.production temporal
const envContent = `GENERATE_SOURCEMAP=false
CI=false
SKIP_PREFLIGHT_CHECK=true
`;

fs.writeFileSync(path.join(__dirname, 'client', '.env.production'), envContent);

console.log('✅ Archivo .env.production creado para el build');
