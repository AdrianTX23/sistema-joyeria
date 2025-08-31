const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Get all products with pagination and filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', lowStock = false } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE 1=1';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      countQuery += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (category) {
      query += ' AND p.category_id = ?';
      countQuery += ' AND p.category_id = ?';
      params.push(category);
      countParams.push(category);
    }

    if (lowStock === 'true') {
      query += ' AND p.stock_quantity <= p.min_stock_level';
      countQuery += ' AND p.stock_quantity <= p.min_stock_level';
    }

    query += ' ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const db = getDatabase();
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Database error getting product count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, products) => {
        if (err) {
          console.error('Database error getting products:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          products,
          pagination: {
            current: parseInt(page),
            total: Math.ceil(countResult.total / limit),
            totalItems: countResult.total,
            limit: parseInt(limit)
          }
        });
      });
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get(
      `SELECT p.*, c.name as category_name 
       FROM products p 
       LEFT JOIN categories c ON p.category_id = c.id 
       WHERE p.id = ?`,
      [id],
      (err, product) => {
        if (err) {
          console.error('Database error getting product:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json({ product });
      }
    );
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new product
router.post('/', authenticateToken, (req, res) => {
  try {
    const {
      sku,
      name,
      description,
      category_id,
      price,
      cost,
      stock_quantity,
      min_stock_level,
      weight,
      dimensions,
      material
    } = req.body;

    if (!sku || !name || !price || !cost) {
      return res.status(400).json({ error: 'SKU, name, price, and cost are required' });
    }

    const db = getDatabase();
    
    db.run(
      `INSERT INTO products (
        sku, name, description, category_id, price, cost, 
        stock_quantity, min_stock_level, weight, dimensions, material
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [sku, name, description, category_id, price, cost, stock_quantity || 0, min_stock_level || 5, weight, dimensions, material],
      function(err) {
        if (err) {
          console.error('Database error creating product:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'SKU already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        db.get(
          `SELECT p.*, c.name as category_name 
           FROM products p 
           LEFT JOIN categories c ON p.category_id = c.id 
           WHERE p.id = ?`,
          [this.lastID],
          (err, newProduct) => {
            if (err) {
              console.error('Database error getting new product:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Sincronizar la base de datos después de crear el producto
            // syncDatabase(); // This line was removed as per the edit hint
            
            res.status(201).json({ 
              message: 'Product created successfully',
              product: newProduct 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      description,
      category_id,
      price,
      cost,
      stock_quantity,
      min_stock_level,
      weight,
      dimensions,
      material
    } = req.body;

    if (!sku || !name || !price || !cost) {
      return res.status(400).json({ error: 'SKU, name, price, and cost are required' });
    }

    const db = getDatabase();
    
    db.run(
      `UPDATE products SET 
        sku = ?, name = ?, description = ?, category_id = ?, 
        price = ?, cost = ?, stock_quantity = ?, min_stock_level = ?, 
        weight = ?, dimensions = ?, material = ?, updated_at = CURRENT_TIMESTAMP 
       WHERE id = ?`,
      [sku, name, description, category_id, price, cost, stock_quantity, min_stock_level, weight, dimensions, material, id],
      function(err) {
        if (err) {
          console.error('Database error updating product:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'SKU already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'Product not found' });
        }

        db.get(
          `SELECT p.*, c.name as category_name 
           FROM products p 
           LEFT JOIN categories c ON p.category_id = c.id 
           WHERE p.id = ?`,
          [id],
          (err, updatedProduct) => {
            if (err) {
              console.error('Database error getting updated product:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
              message: 'Product updated successfully',
              product: updatedProduct 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stock quantity
router.patch('/:id/stock', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, type = 'adjustment', notes = '' } = req.body;

    if (typeof quantity !== 'number') {
      return res.status(400).json({ error: 'Quantity must be a number' });
    }

    const db = getDatabase();
    
    // Get current stock
    db.get('SELECT stock_quantity FROM products WHERE id = ?', [id], (err, product) => {
      if (err) {
        console.error('Database error getting product stock:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      const previousStock = product.stock_quantity;
      const newStock = Math.max(0, previousStock + quantity);

      // Update product stock
      db.run(
        'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStock, id],
        function(err) {
          if (err) {
            console.error('Database error updating product stock:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Record stock movement
          db.run(
            'INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [id, type, quantity, previousStock, newStock, req.user.id, notes],
            (err) => {
              if (err) {
                console.error('Database error recording stock movement:', err);
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({ 
                message: 'Stock updated successfully',
                previousStock,
                newStock,
                change: quantity
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete product
router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      if (err) {
        console.error('Database error deleting product:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product deleted successfully' });
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock movements for a product
router.get('/:id/stock-movements', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    db.all(
      `SELECT sm.*, u.full_name as user_name 
       FROM stock_movements sm 
       LEFT JOIN users u ON sm.user_id = u.id 
       WHERE sm.product_id = ? 
       ORDER BY sm.created_at DESC 
       LIMIT ? OFFSET ?`,
      [id, parseInt(limit), offset],
      (err, movements) => {
        if (err) {
          console.error('Database error getting stock movements:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        res.json({ movements });
      }
    );
  } catch (error) {
    console.error('Get stock movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Get total products and low stock count
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_products,
        SUM(stock_quantity) as total_stock,
        SUM(CASE WHEN stock_quantity <= min_stock_level THEN 1 ELSE 0 END) as low_stock_count,
        SUM(price * stock_quantity) as total_value
      FROM products
    `;

    // Get products by category
    const categoryQuery = `
      SELECT 
        c.name as category_name,
        COUNT(p.id) as product_count,
        SUM(p.stock_quantity) as total_stock
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      GROUP BY c.id, c.name
      ORDER BY product_count DESC
    `;

    db.get(summaryQuery, (err, summary) => {
      if (err) {
        console.error('Database error getting product summary:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(categoryQuery, (err, categories) => {
        if (err) {
          console.error('Database error getting category stats:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          summary: {
            totalProducts: summary.total_products || 0,
            totalStock: summary.total_stock || 0,
            lowStockCount: summary.low_stock_count || 0,
            totalValue: parseFloat(summary.total_value || 0).toFixed(2)
          },
          categories
        });
      });
    });
  } catch (error) {
    console.error('Product stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
