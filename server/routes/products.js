const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('./auth');
const auditSystem = require('../utils/audit');

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

// Test endpoint to verify backend is working
router.get('/test', (req, res) => {
  console.log('🧪 Test endpoint /api/products/test called');
  res.json({ 
    message: 'Products backend is working',
    timestamp: new Date().toISOString(),
    database: process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'
  });
});

// Get all products with pagination and filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '', sortBy = 'name', sortOrder = 'ASC' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT p.*, c.name as category_name 
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      WHERE p.is_deleted = 0
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM products p WHERE p.is_deleted = 0';
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

    // Validar y sanitizar sortBy y sortOrder
    const allowedSortFields = ['name', 'sku', 'price', 'stock_quantity', 'created_at'];
    const allowedSortOrders = ['ASC', 'DESC'];
    
    if (!allowedSortFields.includes(sortBy)) sortBy = 'name';
    if (!allowedSortOrders.includes(sortOrder.toUpperCase())) sortOrder = 'ASC';
    
    query += ` ORDER BY p.${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);

    const db = getDatabase();
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Database error getting products count:', err);
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
       WHERE p.id = ? AND p.is_deleted = 0`,
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
router.post('/', authenticateToken, async (req, res) => {
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
      return res.status(400).json({ error: 'SKU, name, price and cost are required' });
    }

    const db = getDatabase();
    
    // Verificar que el SKU no exista (incluyendo productos eliminados)
    db.get('SELECT id FROM products WHERE sku = ?', [sku], async (err, existingProduct) => {
      if (err) {
        console.error('Database error checking SKU:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (existingProduct) {
        return res.status(400).json({ error: 'SKU already exists' });
      }

      // Crear el producto
      db.run(
        `INSERT INTO products (
          sku, name, description, category_id, price, cost, 
          stock_quantity, min_stock_level, weight, dimensions, material
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [sku, name, description, category_id, price, cost, stock_quantity || 0, min_stock_level || 5, weight, dimensions, material],
        async function(err) {
          if (err) {
            console.error('Database error creating product:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          const productId = this.lastID;
          
          // Registrar en auditoría
          try {
            await auditSystem.logCreate('products', productId, {
              sku, name, description, category_id, price, cost, stock_quantity, min_stock_level
            }, req.user.userId, req);
          } catch (auditError) {
            console.warn('Audit logging failed:', auditError);
          }

          // Obtener el producto creado
          db.get(
            `SELECT p.*, c.name as category_name 
             FROM products p 
             LEFT JOIN categories c ON p.category_id = c.id 
             WHERE p.id = ?`,
            [productId],
            (err, newProduct) => {
              if (err) {
                console.error('Database error getting created product:', err);
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
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update product
router.put('/:id', authenticateToken, async (req, res) => {
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
      return res.status(400).json({ error: 'SKU, name, price and cost are required' });
    }

    const db = getDatabase();
    
    // Obtener valores anteriores para auditoría
    db.get('SELECT * FROM products WHERE id = ? AND is_deleted = 0', [id], async (err, oldProduct) => {
      if (err) {
        console.error('Database error getting old product:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!oldProduct) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Verificar que el SKU no exista en otros productos
      db.get('SELECT id FROM products WHERE sku = ? AND id != ? AND is_deleted = 0', [sku, id], async (err, existingProduct) => {
        if (err) {
          console.error('Database error checking SKU:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        
        if (existingProduct) {
          return res.status(400).json({ error: 'SKU already exists' });
        }

        // Actualizar el producto
        db.run(
          `UPDATE products SET 
            sku = ?, name = ?, description = ?, category_id = ?, price = ?, cost = ?,
            stock_quantity = ?, min_stock_level = ?, weight = ?, dimensions = ?, material = ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE id = ? AND is_deleted = 0`,
          [sku, name, description, category_id, price, cost, stock_quantity, min_stock_level, weight, dimensions, material, id],
          async function(err) {
            if (err) {
              console.error('Database error updating product:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: 'Product not found or no changes made' });
            }

            // Registrar en auditoría
            try {
              await auditSystem.logUpdate('products', id, oldProduct, {
                sku, name, description, category_id, price, cost, stock_quantity, min_stock_level
              }, req.user.userId, req);
            } catch (auditError) {
              console.warn('Audit logging failed:', auditError);
            }

            // Obtener el producto actualizado
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
      });
    });
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

    // Get current stock
    const db = getDatabase();
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
            function(err) {
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

// Soft delete product (NO ELIMINA DATOS REALES)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Obtener el producto antes de marcarlo como eliminado
    db.get('SELECT * FROM products WHERE id = ? AND is_deleted = 0', [id], async (err, product) => {
      if (err) {
        console.error('Database error getting product:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!product) {
        return res.status(404).json({ error: 'Product not found' });
      }

      // Verificar que no tenga ventas activas
      db.get('SELECT COUNT(*) as count FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE si.product_id = ? AND s.is_deleted = 0', [id], async (err, salesResult) => {
        if (err) {
          console.error('Database error checking sales:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (salesResult.count > 0) {
          return res.status(400).json({ 
            error: 'Cannot delete product that has active sales. Consider archiving instead.' 
          });
        }

        // Marcar como eliminado (SOFT DELETE)
        db.run(
          'UPDATE products SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?',
          [req.user.userId, id],
          async function(err) {
            if (err) {
              console.error('Database error soft deleting product:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: 'Product not found' });
            }

            // Registrar en auditoría
            try {
              await auditSystem.logSoftDelete('products', id, product, req.user.userId, req);
            } catch (auditError) {
              console.warn('Audit logging failed:', auditError);
            }

            res.json({ 
              message: 'Product archived successfully (soft deleted)',
              productId: id,
              archivedAt: new Date().toISOString()
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Soft delete product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore soft deleted product
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Obtener el producto eliminado
    db.get('SELECT * FROM products WHERE id = ? AND is_deleted = 1', [id], async (err, product) => {
      if (err) {
        console.error('Database error getting deleted product:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!product) {
        return res.status(404).json({ error: 'Deleted product not found' });
      }

      // Restaurar el producto
      db.run(
        'UPDATE products SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL WHERE id = ?',
        [id],
        async function(err) {
          if (err) {
            console.error('Database error restoring product:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (this.changes === 0) {
            return res.status(404).json({ error: 'Product not found' });
          }

          // Registrar en auditoría
          try {
            await auditSystem.logAction('products', id, 'RESTORE', product, { ...product, is_deleted: 0 }, req.user.userId, req);
          } catch (auditError) {
            console.warn('Audit logging failed:', auditError);
          }

          res.json({ 
            message: 'Product restored successfully',
            productId: id,
            restoredAt: new Date().toISOString()
          });
        }
      );
    });
  } catch (error) {
    console.error('Restore product error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get archived products (soft deleted)
router.get('/archived/list', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    const query = `
      SELECT p.*, c.name as category_name, u.username as deleted_by_user
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      LEFT JOIN users u ON p.deleted_by = u.id
      WHERE p.is_deleted = 1
      ORDER BY p.deleted_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_deleted = 1';
    
    db.get(countQuery, (err, countResult) => {
      if (err) {
        console.error('Database error getting archived products count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, [parseInt(limit), offset], (err, products) => {
        if (err) {
          console.error('Database error getting archived products:', err);
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
    console.error('Get archived products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Permanent delete (SOLO PARA ADMINISTRADORES Y SOLO DESPUÉS DE VERIFICACIÓN)
router.delete('/:id/permanent', authenticateToken, async (req, res) => {
  try {
    // Verificar que sea administrador
    if (req.user.role !== 'administrador') {
      return res.status(403).json({ error: 'Only administrators can permanently delete products' });
    }

    const { id } = req.params;
    const { confirmation, reason } = req.body;

    if (!confirmation || confirmation !== 'PERMANENTLY_DELETE_PRODUCT') {
      return res.status(400).json({ 
        error: 'Confirmation required. Send "PERMANENTLY_DELETE_PRODUCT" to confirm.' 
      });
    }

    if (!reason || reason.length < 10) {
      return res.status(400).json({ 
        error: 'Reason for permanent deletion is required (minimum 10 characters)' 
      });
    }

    const db = getDatabase();

    // Verificar que el producto esté soft deleted
    db.get('SELECT * FROM products WHERE id = ? AND is_deleted = 1', [id], async (err, product) => {
      if (err) {
        console.error('Database error getting product:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!product) {
        return res.status(404).json({ error: 'Soft deleted product not found' });
      }

      // Verificar que no tenga ventas históricas
      db.get('SELECT COUNT(*) as count FROM sale_items WHERE product_id = ?', [id], async (err, salesResult) => {
        if (err) {
          console.error('Database error checking sales history:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        if (salesResult.count > 0) {
          return res.status(400).json({ 
            error: 'Cannot permanently delete product with sales history. Keep it archived.' 
          });
        }

        // Crear backup antes de eliminar permanentemente
        try {
          await auditSystem.logAction('products', id, 'PERMANENT_DELETE', product, null, req.user.userId, req);
        } catch (auditError) {
          console.warn('Audit logging failed:', auditError);
        }

        // Eliminar permanentemente
        db.run('DELETE FROM products WHERE id = ?', [id], function(err) {
          if (err) {
            console.error('Database error permanently deleting product:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({ 
            message: 'Product permanently deleted',
            productId: id,
            deletedAt: new Date().toISOString(),
            reason: reason
          });
        });
      });
    });
  } catch (error) {
    console.error('Permanent delete product error:', error);
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

    const db = getDatabase();
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
