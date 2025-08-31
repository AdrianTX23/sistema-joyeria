const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

let supabase = null;

async function initSupabaseDatabase() {
  try {
    console.log('🗄️ Inicializando Supabase...');
    
    // Crear cliente de Supabase
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    );
    
    console.log('✅ Conectado a Supabase');
    
    // Crear tablas (usando SQL directo)
    await createTables();
    
    // Insertar datos por defecto
    await insertDefaultData();
    
    console.log('✅ Base de datos Supabase inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando Supabase:', error);
    throw error;
  }
}

async function createTables() {
  console.log('📝 Creando tablas...');
  
  // Crear tabla users
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'vendedor',
        full_name VARCHAR(100) NOT NULL,
        reset_token VARCHAR(255),
        reset_token_expiry TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  });

  // Crear tabla categories
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  });

  // Crear tabla products
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        sku VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        category_id INTEGER REFERENCES categories(id),
        price DECIMAL(10,2) NOT NULL,
        cost DECIMAL(10,2) NOT NULL,
        stock_quantity INTEGER NOT NULL DEFAULT 0,
        min_stock_level INTEGER DEFAULT 5,
        image_url TEXT,
        weight DECIMAL(8,3),
        dimensions VARCHAR(100),
        material VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  });

  // Crear tabla sales
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS sales (
        id SERIAL PRIMARY KEY,
        sale_number VARCHAR(50) UNIQUE NOT NULL,
        customer_name VARCHAR(100),
        customer_email VARCHAR(100),
        customer_phone VARCHAR(20),
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  });

  // Crear tabla sale_items
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS sale_items (
        id SERIAL PRIMARY KEY,
        sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        quantity INTEGER NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        total_price DECIMAL(10,2) NOT NULL
      )
    `
  });

  // Crear tabla stock_movements
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES products(id),
        movement_type VARCHAR(20) NOT NULL,
        quantity INTEGER NOT NULL,
        previous_stock INTEGER NOT NULL,
        new_stock INTEGER NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id),
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `
  });

  console.log('✅ Tablas creadas correctamente');
}

async function insertDefaultData() {
  console.log('📝 Insertando datos por defecto...');
  
  // Insertar categorías por defecto
  const { data: existingCategories } = await supabase
    .from('categories')
    .select('count');
  
  if (!existingCategories || existingCategories.length === 0) {
    const defaultCategories = [
      { name: 'Anillos', description: 'Anillos de diferentes estilos y materiales' },
      { name: 'Collares', description: 'Collares y gargantillas' },
      { name: 'Pendientes', description: 'Pendientes y aretes' },
      { name: 'Pulseras', description: 'Pulseras y brazaletes' },
      { name: 'Relojes', description: 'Relojes de lujo' },
      { name: 'Otros', description: 'Otros accesorios de joyería' }
    ];

    await supabase.from('categories').insert(defaultCategories);
    console.log('✅ Categorías por defecto insertadas');
  }

  // Insertar usuarios por defecto
  const { data: existingUsers } = await supabase
    .from('users')
    .select('count');
  
  if (!existingUsers || existingUsers.length === 0) {
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@joyeria.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'administrador',
        full_name: 'Administrador del Sistema'
      },
      {
        username: 'vendedor1',
        email: 'vendedor1@joyeria.com',
        password: bcrypt.hashSync('vendedor123', 10),
        role: 'vendedor',
        full_name: 'María González - Vendedora'
      },
      {
        username: 'vendedor2',
        email: 'vendedor2@joyeria.com',
        password: bcrypt.hashSync('vendedor123', 10),
        role: 'vendedor',
        full_name: 'Carlos Rodríguez - Vendedor'
      }
    ];

    await supabase.from('users').insert(defaultUsers);
    console.log('✅ Usuarios por defecto insertados');
  }
}

function getSupabaseDatabase() {
  if (!supabase) {
    throw new Error('Supabase not initialized. Call initSupabaseDatabase() first.');
  }
  return supabase;
}

module.exports = { 
  initSupabaseDatabase, 
  getSupabaseDatabase 
};
