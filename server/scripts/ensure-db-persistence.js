#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Configuración de la base de datos
const dbPath = path.join(__dirname, '../database/jewelry_inventory.db');
const dbDir = path.dirname(dbPath);

console.log('🔍 Verificando persistencia de la base de datos...');
console.log('📁 Directorio de la BD:', dbDir);
console.log('🗄️ Ruta de la BD:', dbPath);

// Verificar si el directorio existe
if (!fs.existsSync(dbDir)) {
  console.log('📁 Creando directorio de la base de datos...');
  fs.mkdirSync(dbDir, { recursive: true });
  console.log('✅ Directorio creado');
} else {
  console.log('✅ Directorio de la BD existe');
}

// Verificar si la base de datos existe
const dbExists = fs.existsSync(dbPath);
console.log('📁 Base de datos existe:', dbExists);

if (dbExists) {
  // Verificar el tamaño de la base de datos
  const stats = fs.statSync(dbPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`💾 Tamaño de la BD: ${fileSizeInMB} MB`);
  
  // Verificar permisos de escritura
  try {
    fs.accessSync(dbPath, fs.constants.R_OK | fs.constants.W_OK);
    console.log('✅ Permisos de lectura/escritura OK');
  } catch (err) {
    console.error('❌ Error de permisos:', err.message);
  }
  
  // Verificar integridad de la base de datos
  const db = new sqlite3.Database(dbPath);
  
  db.get("PRAGMA integrity_check", (err, row) => {
    if (err) {
      console.error('❌ Error verificando integridad:', err);
    } else {
      console.log('🔍 Resultado de integridad:', row.integrity_check);
      if (row.integrity_check === 'ok') {
        console.log('✅ Base de datos íntegra');
      } else {
        console.log('⚠️ Problemas de integridad detectados');
      }
    }
    
    // Verificar tablas existentes
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error obteniendo tablas:', err);
      } else {
        console.log('📊 Tablas encontradas:', tables.length);
        tables.forEach(table => {
          console.log(`  - ${table.name}`);
        });
      }
      
      // Verificar datos en las tablas principales
      const checkTable = (tableName, description) => {
        db.get(`SELECT COUNT(*) as count FROM ${tableName}`, (err, row) => {
          if (err) {
            console.log(`❌ Error verificando ${tableName}:`, err.message);
          } else {
            console.log(`📊 ${description}: ${row.count} registros`);
          }
        });
      };
      
      checkTable('users', 'Usuarios');
      checkTable('categories', 'Categorías');
      checkTable('products', 'Productos');
      checkTable('sales', 'Ventas');
      
      // Cerrar conexión
      db.close((err) => {
        if (err) {
          console.error('❌ Error cerrando BD:', err);
        } else {
          console.log('✅ Conexión cerrada');
        }
        
        console.log('\n🎯 Resumen de verificación:');
        console.log(`📁 BD existe: ${dbExists}`);
        console.log(`💾 Tamaño: ${fileSizeInMB} MB`);
        console.log('✅ Verificación completada');
      });
    });
  });
  
} else {
  console.log('⚠️ La base de datos no existe. Se creará al iniciar el servidor.');
}

// Verificar variables de entorno
console.log('\n🌍 Variables de entorno:');
console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
console.log('PORT:', process.env.PORT || '5001');

// Verificar directorio de trabajo
console.log('\n📂 Directorio de trabajo actual:', process.cwd());

// Verificar espacio en disco
try {
  const stats = fs.statfsSync(dbDir);
  const freeSpaceGB = (stats.bavail * stats.bsize / (1024 * 1024 * 1024)).toFixed(2);
  console.log(`💽 Espacio libre en disco: ${freeSpaceGB} GB`);
} catch (err) {
  console.log('⚠️ No se pudo verificar espacio en disco:', err.message);
}

console.log('\n✅ Verificación de persistencia completada');
