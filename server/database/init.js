const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'jewelry_inventory.db');
const db = new sqlite3.Database(dbPath);

async function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
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
          console.error('Error creating users table:', err);
        } else {
          console.log('✅ Users table created successfully');
          

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
      `);

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
      `);

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
      `);

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
      `);

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
      `);

      // Insert default categories
      const defaultCategories = [
        { name: 'Anillos', description: 'Anillos de diferentes estilos y materiales' },
        { name: 'Collares', description: 'Collares y gargantillas' },
        { name: 'Pendientes', description: 'Pendientes y aretes' },
        { name: 'Pulseras', description: 'Pulseras y brazaletes' },
        { name: 'Relojes', description: 'Relojes de lujo' },
        { name: 'Otros', description: 'Otros accesorios de joyería' }
      ];

      const insertCategory = db.prepare('INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)');
      defaultCategories.forEach(category => {
        insertCategory.run(category.name, category.description);
      });
      insertCategory.finalize();

      // Create default admin user
      const defaultPassword = bcrypt.hashSync('admin123', 10);
      db.run(`
        INSERT OR IGNORE INTO users (username, email, password, role, full_name)
        VALUES ('admin', 'admin@joyeria.com', ?, 'administrador', 'Administrador del Sistema')
      `, [defaultPassword]);

      // Create indexes for better performance
      db.run('CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku)');
      db.run('CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(created_at)');
      db.run('CREATE INDEX IF NOT EXISTS idx_sale_items_sale ON sale_items(sale_id)');
      db.run('CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id)');

      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  });
}

function getDatabase() {
  return new sqlite3.Database(dbPath);
}

module.exports = { initDatabase, getDatabase };
