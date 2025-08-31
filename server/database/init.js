const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const fs = require('fs');

// Asegurar que el directorio de la base de datos existe
const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = process.env.DB_PATH || path.join(__dirname, 'jewelry_inventory.db');
console.log('🗄️ Database path:', dbPath);

// Verificar si la base de datos existe
const dbExists = fs.existsSync(dbPath);
console.log('📁 Database exists:', dbExists);

let db = null;
let isInitializing = false;
let initPromise = null;

async function initDatabase() {
  // Si ya se está inicializando, esperar a que termine
  if (isInitializing) {
    return initPromise;
  }

  // Si ya está inicializada, retornar
  if (db) {
    return Promise.resolve();
  }

  isInitializing = true;
  initPromise = new Promise((resolve, reject) => {
    // Crear conexión a la base de datos
    db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening database:', err);
        isInitializing = false;
        reject(err);
        return;
      }
      console.log('✅ Connected to SQLite database');
    });

    // Configurar la base de datos para mejor rendimiento usando PRAGMA
    db.serialize(() => {
      // Configuraciones de rendimiento y concurrencia
      db.run('PRAGMA journal_mode = WAL'); // Write-Ahead Logging para mejor concurrencia
      db.run('PRAGMA busy_timeout = 30000'); // Timeout de 30 segundos
      db.run('PRAGMA synchronous = NORMAL'); // Balance entre rendimiento y seguridad
      db.run('PRAGMA cache_size = 10000'); // Cache de 10MB
      db.run('PRAGMA temp_store = MEMORY'); // Tablas temporales en memoria
      db.run('PRAGMA foreign_keys = ON'); // Habilitar foreign keys

      // Create users table
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL DEFAULT 'vendedor',
          full_name TEXT NOT NULL,
          reset_token TEXT,
          reset_token_expiry DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating users table:', err);
        } else {
          console.log('✅ Users table created/verified successfully');
        }
      });

      // Create categories table
      db.run(`
        CREATE TABLE IF NOT EXISTS categories (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating categories table:', err);
        } else {
          console.log('✅ Categories table created/verified successfully');
        }
      });

      // Create products table
      db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sku TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          category_id INTEGER,
          price DECIMAL(10,2) NOT NULL,
          cost DECIMAL(10,2) NOT NULL,
          stock_quantity INTEGER NOT NULL DEFAULT 0,
          min_stock_level INTEGER DEFAULT 5,
          image_url TEXT,
          weight DECIMAL(8,3),
          dimensions TEXT,
          material TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (category_id) REFERENCES categories (id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating products table:', err);
        } else {
          console.log('✅ Products table created/verified successfully');
        }
      });

      // Create sales table
      db.run(`
        CREATE TABLE IF NOT EXISTS sales (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_number TEXT UNIQUE NOT NULL,
          customer_name TEXT,
          customer_email TEXT,
          customer_phone TEXT,
          total_amount DECIMAL(10,2) NOT NULL,
          payment_method TEXT NOT NULL,
          user_id INTEGER NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating sales table:', err);
        } else {
          console.log('✅ Sales table created/verified successfully');
        }
      });

      // Create sale_items table
      db.run(`
        CREATE TABLE IF NOT EXISTS sale_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sale_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          unit_price DECIMAL(10,2) NOT NULL,
          total_price DECIMAL(10,2) NOT NULL,
          FOREIGN KEY (sale_id) REFERENCES sales (id),
          FOREIGN KEY (product_id) REFERENCES products (id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating sale_items table:', err);
        } else {
          console.log('✅ Sale_items table created/verified successfully');
        }
      });

      // Create stock_movements table for inventory tracking
      db.run(`
        CREATE TABLE IF NOT EXISTS stock_movements (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          product_id INTEGER NOT NULL,
          movement_type TEXT NOT NULL,
          quantity INTEGER NOT NULL,
          previous_stock INTEGER NOT NULL,
          new_stock INTEGER NOT NULL,
          user_id INTEGER NOT NULL,
          notes TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (product_id) REFERENCES products (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) {
          console.error('❌ Error creating stock_movements table:', err);
        } else {
          console.log('✅ Stock_movements table created/verified successfully');
        }
      });

      // Insert default categories only if they don't exist
      const defaultCategories = [
        { name: 'Anillos', description: 'Anillos de diferentes estilos y materiales' },
        { name: 'Collares', description: 'Collares y gargantillas' },
        { name: 'Pendientes', description: 'Pendientes y aretes' },
        { name: 'Pulseras', description: 'Pulseras y brazaletes' },
        { name: 'Relojes', description: 'Relojes de lujo' },
        { name: 'Otros', description: 'Otros accesorios de joyería' }
      ];

      // Verificar si ya existen categorías
      db.get('SELECT COUNT(*) as count FROM categories', (err, row) => {
        if (err) {
          console.error('❌ Error checking categories:', err);
        } else {
          const categoryCount = row.count;
          console.log(`📊 Found ${categoryCount} existing categories`);
          
          if (categoryCount === 0) {
            console.log('📝 Inserting default categories...');
            const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
            defaultCategories.forEach(category => {
              insertCategory.run(category.name, category.description);
            });
            insertCategory.finalize();
            console.log('✅ Default categories inserted');
          } else {
            console.log('✅ Categories already exist, skipping insertion');
          }
        }
      });

      // Create default users only if they don't exist
      const defaultUsers = [
        {
          username: 'admin',
          email: 'admin@joyeria.com',
          password: 'admin123',
          role: 'administrador',
          full_name: 'Administrador del Sistema'
        },
        {
          username: 'genesis0311',
          email: 'genesisbarcelo15@gmail.com',
          password: 'Genesis0311',
          role: 'administrador',
          full_name: 'Genesis Barceló - Administradora'
        }
      ];

      // Verificar si ya existen usuarios
      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (err) {
          console.error('❌ Error checking users:', err);
        } else {
          const userCount = row.count;
          console.log(`👥 Found ${userCount} existing users`);
          
          if (userCount === 0) {
            console.log('📝 Creating default users...');
            
            defaultUsers.forEach(user => {
              const hashedPassword = bcrypt.hashSync(user.password, 10);
              db.run(`
                INSERT INTO users (username, email, password, role, full_name)
                VALUES (?, ?, ?, ?, ?)
              `, [user.username, user.email, hashedPassword, user.role, user.full_name], (err) => {
                if (err) {
                  console.error(`❌ Error creating user ${user.username}:`, err);
                } else {
                  console.log(`✅ User ${user.username} created successfully`);
                  console.log(`🔑 ${user.full_name} credentials: ${user.username} / ${user.password}`);
                }
              });
            });
            
            console.log('✅ All default users created');
          } else {
            console.log('✅ Users already exist, skipping insertion');
          }
        }
      });

      // Create indexes for better performance
      console.log('📈 Creating database indexes...');
      db.run('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
      db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)');
      db.run('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)');
      console.log('✅ Database indexes created');

      // Verificar el tamaño de la base de datos
      setTimeout(() => {
        const stats = fs.statSync(dbPath);
        const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`💾 Database size: ${fileSizeInMB} MB`);
        
        isInitializing = false;
        resolve();
      }, 1000);
    });
  });

  return initPromise;
}

function getDatabase() {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Función para cerrar la base de datos
function closeDatabase() {
  if (db) {
    try {
      db.close((err) => {
        if (err) {
          console.error('❌ Error closing database:', err);
        } else {
          console.log('✅ Database connection closed');
          db = null;
        }
      });
    } catch (error) {
      console.error('❌ Error in closeDatabase:', error);
    }
  }
}

// Función para forzar la sincronización de la base de datos
function syncDatabase() {
  if (db) {
    try {
      db.run('PRAGMA wal_checkpoint(TRUNCATE)');
      console.log('✅ Database synchronized');
    } catch (error) {
      console.error('❌ Error syncing database:', error);
    }
  }
}

// Manejar señales de terminación para cerrar la base de datos correctamente
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, closing database...');
  closeDatabase();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, closing database...');
  closeDatabase();
  process.exit(0);
});

module.exports = { initDatabase, getDatabase, closeDatabase, syncDatabase };
