const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDatabase } = require('../database/init');

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
router.get('/', (req, res) => {
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
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, products) => {
        db.close();
        if (err) {
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

// Get single product by ID
router.get('/:id', (req, res) => {
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
        db.close();
        if (err) {
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
router.post('/', upload.single('image'), (req, res) => {
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

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const db = getDatabase();

    db.run(
      `INSERT INTO products (
        sku, name, description, category_id, price, cost, 
        stock_quantity, min_stock_level, image_url, weight, dimensions, material
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        sku, name, description, category_id || null, price, cost,
        stock_quantity || 0, min_stock_level || 5, imageUrl, weight, dimensions, material
      ],
      function(err) {
        if (err) {
          db.close();
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'SKU already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        // Record initial stock movement
        if (stock_quantity > 0) {
          db.run(
            `INSERT INTO stock_movements (
              product_id, movement_type, quantity, previous_stock, new_stock, user_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              this.lastID, 'initial', stock_quantity, 0, stock_quantity, 
              req.user?.id || 1, 'Initial stock entry'
            ]
          );
        }

        db.get(
          `SELECT p.*, c.name as category_name 
           FROM products p 
           LEFT JOIN categories c ON p.category_id = c.id 
           WHERE p.id = ?`,
          [this.lastID],
          (err, newProduct) => {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
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
router.put('/:id', upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const {
      sku,
      name,
      description,
      category_id,
      price,
      cost,
      min_stock_level,
      weight,
      dimensions,
      material
    } = req.body;

    if (!sku || !name || !price || !cost) {
      return res.status(400).json({ error: 'SKU, name, price, and cost are required' });
    }

    const db = getDatabase();
    
    // Get current product to check if image exists
    db.get('SELECT image_url FROM products WHERE id = ?', [id], (err, currentProduct) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }
      if (!currentProduct) {
        db.close();
        return res.status(404).json({ error: 'Product not found' });
      }

      const imageUrl = req.file ? `/uploads/${req.file.filename}` : currentProduct.image_url;

      db.run(
        `UPDATE products SET 
          sku = ?, name = ?, description = ?, category_id = ?, price = ?, cost = ?,
          min_stock_level = ?, image_url = ?, weight = ?, dimensions = ?, material = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          sku, name, description, category_id || null, price, cost,
          min_stock_level || 5, imageUrl, weight, dimensions, material, id
        ],
        function(err) {
          if (err) {
            db.close();
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
            [id],
            (err, updatedProduct) => {
              db.close();
              if (err) {
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
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update stock quantity
router.patch('/:id/stock', (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, movementType = 'adjustment', notes = '' } = req.body;

    if (quantity === undefined || quantity === null) {
      return res.status(400).json({ error: 'Quantity is required' });
    }

    const db = getDatabase();
    
    db.get('SELECT stock_quantity FROM products WHERE id = ?', [id], (err, product) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }
      if (!product) {
        db.close();
        return res.status(404).json({ error: 'Product not found' });
      }

      const previousStock = product.stock_quantity;
      const newStock = Math.max(0, previousStock + parseInt(quantity));

      db.run(
        'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [newStock, id],
        function(err) {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          // Record stock movement
          db.run(
            `INSERT INTO stock_movements (
              product_id, movement_type, quantity, previous_stock, new_stock, user_id, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              id, movementType, quantity, previousStock, newStock, 
              req.user?.id || 1, notes
            ],
            function(err) {
              if (err) {
                console.error('Error recording stock movement:', err);
              }

              db.get(
                'SELECT * FROM products WHERE id = ?',
                [id],
                (err, updatedProduct) => {
                  db.close();
                  if (err) {
                    return res.status(500).json({ error: 'Database error' });
                  }
                  res.json({ 
                    message: 'Stock updated successfully',
                    product: updatedProduct,
                    stockMovement: {
                      previousStock,
                      newStock,
                      change: quantity
                    }
                  });
                }
              );
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
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
      db.close();
      if (err) {
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
router.get('/:id/stock-movements', (req, res) => {
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
        db.close();
        if (err) {
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

module.exports = router;
