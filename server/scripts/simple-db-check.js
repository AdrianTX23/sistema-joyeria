const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/jewelry_inventory.db');

console.log('🔍 Verificando base de datos SQLite...');
console.log('📁 Ruta:', dbPath);

// Verificar si el archivo existe
const fs = require('fs');
if (fs.existsSync(dbPath)) {
  console.log('✅ Archivo de base de datos existe');
  
  const stats = fs.statSync(dbPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`💾 Tamaño: ${fileSizeInMB} MB`);
  
  // Intentar abrir la base de datos
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('❌ Error abriendo base de datos:', err.message);
      return;
    }
    
    console.log('✅ Base de datos abierta correctamente');
    
    // Verificar tablas
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error obteniendo tablas:', err.message);
        return;
      }
      
      console.log('📋 Tablas encontradas:', tables.map(t => t.name));
      
      // Verificar productos
      db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
        if (err) {
          console.error('❌ Error contando productos:', err.message);
        } else {
          console.log('📦 Productos en BD:', result.count);
        }
      });
      
      // Verificar categorías
      db.get('SELECT COUNT(*) as count FROM categories', (err, result) => {
        if (err) {
          console.error('❌ Error contando categorías:', err.message);
        } else {
          console.log('🏷️ Categorías en BD:', result.count);
        }
      });
      
      // Verificar usuarios
      db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) {
          console.error('❌ Error contando usuarios:', err.message);
        } else {
          console.log('👥 Usuarios en BD:', result.count);
        }
      });
      
      // Verificar estructura de productos
      db.all("PRAGMA table_info(products)", (err, columns) => {
        if (err) {
          console.error('❌ Error obteniendo estructura de productos:', err.message);
        } else {
          console.log('🏗️ Estructura de tabla productos:');
          columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'not null' : 'nullable'})`);
          });
        }
        
        // Cerrar la base de datos
        db.close((err) => {
          if (err) {
            console.error('❌ Error cerrando base de datos:', err.message);
          } else {
            console.log('✅ Base de datos cerrada');
          }
        });
      });
    });
  });
  
} else {
  console.log('❌ Archivo de base de datos NO existe');
}
