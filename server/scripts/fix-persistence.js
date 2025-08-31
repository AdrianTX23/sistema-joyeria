const { getDatabase, syncDatabase } = require('../database/init');
const path = require('path');
const fs = require('fs');

async function diagnosePersistence() {
  console.log('🔍 Diagnóstico de persistencia de base de datos...');
  
  const dbPath = path.join(__dirname, '..', 'database', 'jewelry_inventory.db');
  console.log('🗄️ Ruta de la BD:', dbPath);
  
  // Verificar si la base de datos existe
  if (fs.existsSync(dbPath)) {
    const stats = fs.statSync(dbPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`💾 Tamaño de la BD: ${fileSizeInMB} MB`);
    console.log(`📅 Última modificación: ${stats.mtime}`);
  } else {
    console.log('❌ La base de datos no existe');
    return;
  }
  
  try {
    const db = getDatabase();
    
    // Verificar configuración de la base de datos
    db.get('PRAGMA journal_mode', (err, result) => {
      if (err) {
        console.error('❌ Error obteniendo journal_mode:', err);
      } else {
        console.log(`📝 Journal mode: ${result.journal_mode}`);
      }
    });
    
    db.get('PRAGMA synchronous', (err, result) => {
      if (err) {
        console.error('❌ Error obteniendo synchronous:', err);
      } else {
        console.log(`🔄 Synchronous: ${result.synchronous}`);
      }
    });
    
    // Verificar datos en las tablas
    db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
      if (err) {
        console.error('❌ Error contando productos:', err);
      } else {
        console.log(`📦 Productos en BD: ${result.count}`);
      }
    });
    
    db.get('SELECT COUNT(*) as count FROM sales', (err, result) => {
      if (err) {
        console.error('❌ Error contando ventas:', err);
      } else {
        console.log(`💰 Ventas en BD: ${result.count}`);
      }
    });
    
    db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
      if (err) {
        console.error('❌ Error contando usuarios:', err);
      } else {
        console.log(`👥 Usuarios en BD: ${result.count}`);
      }
    });
    
    // Forzar sincronización
    console.log('🔄 Forzando sincronización...');
    syncDatabase();
    
    console.log('✅ Diagnóstico completado');
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnosePersistence();
