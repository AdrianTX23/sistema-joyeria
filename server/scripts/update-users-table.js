const sqlite3 = require('sqlite3').verbose();
const path = require('path');

async function updateUsersTable() {
  const dbPath = path.join(__dirname, '../database/jewelry_inventory.db');
  console.log('🗄️ Ruta de la BD:', dbPath);
  
  if (!require('fs').existsSync(dbPath)) {
    console.error('❌ Base de datos no encontrada');
    process.exit(1);
  }
  
  const db = new sqlite3.Database(dbPath);
  
  console.log('🔄 Actualizando tabla de usuarios...');
  
  try {
    // Verificar si los campos ya existen
    const tableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    const existingColumns = tableInfo.map(col => col.name);
    console.log('📋 Columnas existentes:', existingColumns);
    
    // Agregar nuevos campos si no existen
    const newFields = [
      { name: 'phone', type: 'TEXT' },
      { name: 'address', type: 'TEXT' },
      { name: 'bio', type: 'TEXT' },
      { name: 'profile_image', type: 'TEXT' }
    ];
    
    for (const field of newFields) {
      if (!existingColumns.includes(field.name)) {
        console.log(`➕ Agregando columna: ${field.name}`);
        await new Promise((resolve, reject) => {
          db.run(`ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`, (err) => {
            if (err) {
              console.error(`❌ Error agregando ${field.name}:`, err.message);
              reject(err);
            } else {
              console.log(`✅ Columna ${field.name} agregada`);
              resolve();
            }
          });
        });
      } else {
        console.log(`ℹ️ Columna ${field.name} ya existe`);
      }
    }
    
    console.log('✅ Tabla de usuarios actualizada correctamente');
    
    // Verificar la estructura final
    const finalTableInfo = await new Promise((resolve, reject) => {
      db.all("PRAGMA table_info(users)", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log('📋 Estructura final de la tabla users:');
    finalTableInfo.forEach(col => {
      console.log(`  - ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.pk ? 'PRIMARY KEY' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Error actualizando tabla de usuarios:', error);
  } finally {
    db.close();
    process.exit(0);
  }
}

updateUsersTable();
