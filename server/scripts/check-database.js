const { getDatabase } = require('../database/init');
const { getPostgresDatabase } = require('../database/postgres-init');

async function checkDatabase() {
  console.log('🔍 Verificando estado de la base de datos...');
  
  // Detectar qué base de datos usar
  const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgres');
  
  if (usePostgres) {
    console.log('🗄️ Usando PostgreSQL...');
    await checkPostgresDatabase();
  } else {
    console.log('🗄️ Usando SQLite...');
    await checkSQLiteDatabase();
  }
}

async function checkPostgresDatabase() {
  try {
    const pool = getPostgresDatabase();
    const client = await pool.connect();
    
    console.log('✅ Conectado a PostgreSQL');
    
    // Verificar tablas
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Tablas encontradas:', tablesResult.rows.map(r => r.table_name));
    
    // Verificar productos
    const productsResult = await client.query('SELECT COUNT(*) as count FROM products');
    console.log('📦 Productos en BD:', productsResult.rows[0].count);
    
    // Verificar categorías
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log('🏷️ Categorías en BD:', categoriesResult.rows[0].count);
    
    // Verificar usuarios
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log('👥 Usuarios en BD:', usersResult.rows[0].count);
    
    // Verificar estructura de productos
    const productStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'products'
      ORDER BY ordinal_position
    `);
    
    console.log('🏗️ Estructura de tabla productos:');
    productStructure.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error verificando PostgreSQL:', error);
  }
}

async function checkSQLiteDatabase() {
  try {
    const db = getDatabase();
    
    // Verificar tablas
    db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
      if (err) {
        console.error('❌ Error obteniendo tablas:', err);
        return;
      }
      
      console.log('📋 Tablas encontradas:', tables.map(t => t.name));
      
      // Verificar productos
      db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
        if (err) {
          console.error('❌ Error contando productos:', err);
        } else {
          console.log('📦 Productos en BD:', result.count);
        }
      });
      
      // Verificar categorías
      db.get('SELECT COUNT(*) as count FROM categories', (err, result) => {
        if (err) {
          console.error('❌ Error contando categorías:', err);
        } else {
          console.log('🏷️ Categorías en BD:', result.count);
        }
      });
      
      // Verificar usuarios
      db.get('SELECT COUNT(*) as count FROM users', (err, result) => {
        if (err) {
          console.error('❌ Error contando usuarios:', err);
        } else {
          console.log('👥 Usuarios en BD:', result.count);
        }
      });
      
      // Verificar estructura de productos
      db.all("PRAGMA table_info(products)", (err, columns) => {
        if (err) {
          console.error('❌ Error obteniendo estructura de productos:', err);
        } else {
          console.log('🏗️ Estructura de tabla productos:');
          columns.forEach(col => {
            console.log(`  - ${col.name}: ${col.type} (${col.notnull ? 'not null' : 'nullable'})`);
          });
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error verificando SQLite:', error);
  }
}

// Ejecutar verificación
checkDatabase();
