const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool = null;

async function initPostgresDatabase() {
  try {
    console.log('🗄️ Inicializando PostgreSQL...');
    
    // Crear pool de conexiones
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    // Verificar conexión
    const client = await pool.connect();
    console.log('✅ Conectado a PostgreSQL');
    
    // Crear tablas
    await createTables(client);
    
    // Insertar datos por defecto
    await insertDefaultData(client);
    
    client.release();
    console.log('✅ Base de datos PostgreSQL inicializada correctamente');
    
  } catch (error) {
    console.error('❌ Error inicializando PostgreSQL:', error);
    throw error;
  }
}

async function createTables(client) {
  console.log('📝 Creando tablas...');
  
  // Tabla users
  await client.query(`
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
  `);

  // Tabla categories
  await client.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) UNIQUE NOT NULL,
      description TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Tabla products
  await client.query(`
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
  `);

  // Tabla sales
  await client.query(`
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
  `);

  // Tabla sale_items
  await client.query(`
    CREATE TABLE IF NOT EXISTS sale_items (
      id SERIAL PRIMARY KEY,
      sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id INTEGER NOT NULL REFERENCES products(id),
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL
    )
  `);

  // Tabla stock_movements
  await client.query(`
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
  `);

  // Crear índices
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
  await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');

  console.log('✅ Tablas creadas correctamente');
}

async function insertDefaultData(client) {
  console.log('📝 Insertando datos por defecto...');
  
  // Verificar si ya existen categorías
  const categoryResult = await client.query('SELECT COUNT(*) FROM categories');
  if (parseInt(categoryResult.rows[0].count) === 0) {
    const defaultCategories = [
      { name: 'Anillos', description: 'Anillos de diferentes estilos y materiales' },
      { name: 'Collares', description: 'Collares y gargantillas' },
      { name: 'Pendientes', description: 'Pendientes y aretes' },
      { name: 'Pulseras', description: 'Pulseras y brazaletes' },
      { name: 'Relojes', description: 'Relojes de lujo' },
      { name: 'Otros', description: 'Otros accesorios de joyería' }
    ];

    for (const category of defaultCategories) {
      await client.query(
        'INSERT INTO categories (name, description) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING',
        [category.name, category.description]
      );
    }
    console.log('✅ Categorías por defecto insertadas');
  }

  // Verificar si ya existen usuarios
  const userResult = await client.query('SELECT COUNT(*) FROM users');
  if (parseInt(userResult.rows[0].count) === 0) {
    const defaultUsers = [
      {
        username: 'admin',
        email: 'admin@joyeria.com',
        password: bcrypt.hashSync('admin123', 10),
        role: 'administrador',
        full_name: 'Administrador del Sistema'
      },
      {
        username: 'genesis0311',
        email: 'genesisbarcelo15@gmail.com',
        password: bcrypt.hashSync('Genesis0311', 10),
        role: 'administrador',
        full_name: 'Genesis Barceló - Administradora'
      }
    ];

    for (const user of defaultUsers) {
      await client.query(
        'INSERT INTO users (username, email, password, role, full_name) VALUES ($1, $2, $3, $4, $5) ON CONFLICT (username) DO NOTHING',
        [user.username, user.email, user.password, user.role, user.full_name]
      );
    }
    console.log('✅ Usuarios por defecto insertados');
  }
}

function getPostgresDatabase() {
  if (!pool) {
    throw new Error('PostgreSQL not initialized. Call initPostgresDatabase() first.');
  }
  return pool;
}

async function closePostgresDatabase() {
  if (pool) {
    await pool.end();
    console.log('✅ PostgreSQL connection closed');
  }
}

module.exports = { 
  initPostgresDatabase, 
  getPostgresDatabase, 
  closePostgresDatabase 
};
