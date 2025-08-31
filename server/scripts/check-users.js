const { getDatabase } = require('../database/init');
const { getPostgresDatabase } = require('../database/postgres-init');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  console.log('🔍 Verificando usuarios en el sistema...');
  
  // Detectar qué base de datos usar
  const usePostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');
  
  if (usePostgres) {
    console.log('🗄️ Verificando usuarios en PostgreSQL...');
    await checkPostgresUsers();
  } else {
    console.log('🗄️ Verificando usuarios en SQLite...');
    await checkSQLiteUsers();
  }
}

async function checkPostgresUsers() {
  try {
    const pool = getPostgresDatabase();
    const client = await pool.connect();
    
    // Obtener todos los usuarios
    const result = await client.query('SELECT id, username, email, role, full_name, created_at FROM users ORDER BY id');
    
    console.log(`\n📊 Usuarios encontrados en PostgreSQL: ${result.rows.length}`);
    console.log('='.repeat(80));
    
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ID: ${user.id}`);
      console.log(`   Usuario: ${user.username}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Rol: ${user.role}`);
      console.log(`   Nombre: ${user.full_name}`);
      console.log(`   Creado: ${user.created_at}`);
      console.log('-'.repeat(40));
    });
    
    // Verificar usuario específico
    const genesisUser = result.rows.find(u => u.username === 'genesis0311');
    if (genesisUser) {
      console.log('✅ Usuario genesis0311 encontrado correctamente');
      console.log(`   Email: ${genesisUser.email}`);
      console.log(`   Rol: ${genesisUser.role}`);
    } else {
      console.log('❌ Usuario genesis0311 NO encontrado');
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error verificando usuarios en PostgreSQL:', error);
  }
}

async function checkSQLiteUsers() {
  try {
    const db = getDatabase();
    
    db.all('SELECT id, username, email, role, full_name, created_at FROM users ORDER BY id', (err, rows) => {
      if (err) {
        console.error('❌ Error consultando usuarios:', err);
        return;
      }
      
      console.log(`\n📊 Usuarios encontrados en SQLite: ${rows.length}`);
      console.log('='.repeat(80));
      
      rows.forEach((user, index) => {
        console.log(`${index + 1}. ID: ${user.id}`);
        console.log(`   Usuario: ${user.username}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   Rol: ${user.role}`);
        console.log(`   Nombre: ${user.full_name}`);
        console.log(`   Creado: ${user.created_at}`);
        console.log('-'.repeat(40));
      });
      
      // Verificar usuario específico
      const genesisUser = rows.find(u => u.username === 'genesis0311');
      if (genesisUser) {
        console.log('✅ Usuario genesis0311 encontrado correctamente');
        console.log(`   Email: ${genesisUser.email}`);
        console.log(`   Rol: ${genesisUser.role}`);
      } else {
        console.log('❌ Usuario genesis0311 NO encontrado');
      }
    });
    
  } catch (error) {
    console.error('❌ Error verificando usuarios en SQLite:', error);
  }
}

// Ejecutar verificación
checkUsers();
