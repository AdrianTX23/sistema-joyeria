#!/usr/bin/env node

const { initDatabase, closeDatabase } = require('./database/init');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Sistema de Joyería...');
console.log('📅 Fecha:', new Date().toISOString());
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
console.log('🔧 Puerto:', process.env.PORT || 5001);

// Verificar y crear directorios necesarios
const dirs = [
  './database',
  './backups',
  './uploads'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creando directorio: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Verificar la base de datos
const dbPath = path.join(__dirname, 'database', 'jewelry_inventory.db');
console.log('🗄️ Ruta de la BD:', dbPath);

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`💾 Base de datos existente: ${fileSizeInMB} MB`);
} else {
  console.log('📝 Base de datos no existe, se creará...');
}

// Función para iniciar el servidor
async function startServer() {
  try {
    console.log('🔧 Inicializando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos inicializada correctamente');
    
    // Importar y configurar Express después de la BD
    const app = require('./index');
    
    // Manejar señales de terminación
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
      closeDatabase();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
      closeDatabase();
      process.exit(0);
    });
    
    process.on('uncaughtException', (err) => {
      console.error('❌ Excepción no capturada:', err);
      closeDatabase();
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      closeDatabase();
      process.exit(1);
    });
    
    console.log('🎉 Servidor iniciado correctamente');
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
