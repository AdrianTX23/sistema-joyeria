const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('./auth');
const auditSystem = require('../utils/audit');

const router = express.Router();

// Generate unique sale number
function generateSaleNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SALE-${timestamp.slice(-6)}-${random}`;
}

// Get all sales with pagination and filters
router.get('/', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate = '', endDate = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, u.full_name as user_name 
      FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE s.is_deleted = 0
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM sales s WHERE s.is_deleted = 0';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' AND (s.customer_name LIKE ? OR s.customer_email LIKE ? OR s.sale_number LIKE ?)';
      countQuery += ' AND (s.customer_name LIKE ? OR s.customer_email LIKE ? OR s.sale_number LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (startDate) {
      query += ' AND DATE(s.created_at) >= ?';
      countQuery += ' AND DATE(s.created_at) >= ?';
      params.push(startDate);
      countParams.push(startDate);
    }

    if (endDate) {
      query += ' AND DATE(s.created_at) <= ?';
      countQuery += ' AND DATE(s.created_at) <= ?';
      params.push(endDate);
      countParams.push(endDate);
    }

    query += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const db = getDatabase();
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        console.error('Database error getting sales count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, sales) => {
        if (err) {
          console.error('Database error getting sales:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          sales,
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
    console.error('Get sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single sale with items
router.get('/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Get sale details
    db.get(
      `SELECT s.*, u.full_name as user_name 
       FROM sales s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.id = ? AND s.is_deleted = 0`,
      [id],
      (err, sale) => {
        if (err) {
          console.error('Database error getting sale:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!sale) {
          return res.status(404).json({ error: 'Sale not found' });
        }

        // Get sale items
        db.all(
          `SELECT si.*, p.name as product_name, p.sku 
           FROM sale_items si 
           LEFT JOIN products p ON si.product_id = p.id 
           WHERE si.sale_id = ?`,
          [id],
          (err, items) => {
            if (err) {
              console.error('Database error getting sale items:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({ 
              sale: { ...sale, items } 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Get sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new sale
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      payment_method,
      items
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'At least one item is required' });
    }

    const db = getDatabase();
    
    // Calculate total amount
    const total_amount = items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);
    
    // Generate sale number
    const sale_number = generateSaleNumber();

    // Insert sale
    db.run(
      `INSERT INTO sales (
        sale_number, customer_name, customer_email, customer_phone, 
        total_amount, payment_method, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [sale_number, customer_name, customer_email, customer_phone, total_amount, payment_method, req.user.userId],
      async function(err) {
        if (err) {
          console.error('Database error creating sale:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        const sale_id = this.lastID;
        let itemsInserted = 0;
        let hasError = false;

        // Insert sale items and update stock
        items.forEach((item, index) => {
          // Insert sale item
          db.run(
            'INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?)',
            [sale_id, item.product_id, item.quantity, item.unit_price, item.unit_price * item.quantity],
            function(err) {
              if (err) {
                console.error('Database error inserting sale item:', err);
                hasError = true;
                return;
              }

              // Update product stock
              db.run(
                'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?',
                [item.quantity, item.product_id],
                function(err) {
                  if (err) {
                    console.error('Database error updating product stock:', err);
                    hasError = true;
                    return;
                  }

                  // Record stock movement
                  db.run(
                    'INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [item.product_id, 'sale', -item.quantity, item.quantity, 0, req.user.userId, `Sale ${sale_number}`],
                    (err) => {
                      if (err) {
                        console.error('Database error recording stock movement:', err);
                      }
                    }
                  );

                  itemsInserted++;
                  if (itemsInserted === items.length) {
                    if (hasError) {
                      return res.status(500).json({ error: 'Error creating sale' });
                    }

                    // Registrar en auditoría
                    try {
                      auditSystem.logCreate('sales', sale_id, {
                        sale_number, customer_name, customer_email, total_amount, payment_method, items
                      }, req.user.userId, req);
                    } catch (auditError) {
                      console.warn('Audit logging failed:', auditError);
                    }

                    // Get complete sale with items
                    db.get(
                      `SELECT s.*, u.full_name as user_name 
                       FROM sales s 
                       LEFT JOIN users u ON s.user_id = u.id 
                       WHERE s.id = ?`,
                      [sale_id],
                      (err, sale) => {
                        if (err) {
                          console.error('Database error getting created sale:', err);
                          return res.status(500).json({ error: 'Database error' });
                        }

                        db.all(
                          `SELECT si.*, p.name as product_name, p.sku 
                           FROM sale_items si 
                           LEFT JOIN products p ON si.product_id = p.id 
                           WHERE si.sale_id = ?`,
                          [sale_id],
                          (err, saleItems) => {
                            if (err) {
                              console.error('Database error getting sale items:', err);
                              return res.status(500).json({ error: 'Database error' });
                            }

                            res.status(201).json({ 
                              message: 'Sale created successfully',
                              sale: { ...sale, items: saleItems }
                            });
                          }
                        );
                      }
                    );
                  }
                }
              );
            }
          );
        });
      }
    );
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Soft delete sale (NO ELIMINA DATOS REALES)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    if (!reason || reason.length < 10) {
      return res.status(400).json({ 
        error: 'Reason for deletion is required (minimum 10 characters)' 
      });
    }

    const db = getDatabase();

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Get sale details before deletion
      db.get(
        'SELECT * FROM sales WHERE id = ? AND is_deleted = 0',
        [id],
        async (err, sale) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: 'Database error' });
          }

          if (!sale) {
            db.run('ROLLBACK');
            return res.status(404).json({ error: 'Sale not found' });
          }

          // Get sale items
          db.all(
            'SELECT * FROM sale_items WHERE sale_id = ?',
            [id],
            async (err, items) => {
              if (err) {
                db.run('ROLLBACK');
                return res.status(500).json({ error: 'Database error' });
              }

              if (items.length === 0) {
                db.run('ROLLBACK');
                return res.status(404).json({ error: 'Sale not found' });
              }

              let itemsProcessed = 0;
              let hasError = false;

              // Restore stock for each item
              items.forEach(item => {
                db.run(
                  'UPDATE products SET stock_quantity = stock_quantity + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                  [item.quantity, item.product_id],
                  function(err) {
                    if (err) {
                      hasError = true;
                      db.run('ROLLBACK');
                      return res.status(500).json({ error: 'Database error' });
                    }

                    // Record stock restoration
                    db.run(
                      'INSERT INTO stock_movements (product_id, movement_type, quantity, previous_stock, new_stock, user_id, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
                      [item.product_id, 'sale_cancellation', item.quantity, 0, item.quantity, req.user.userId, `Sale ${sale.sale_number} cancelled - stock restored`],
                      (err) => {
                        if (err) {
                          console.warn('Error recording stock restoration:', err);
                        }
                      }
                    );

                    itemsProcessed++;
                    
                    if (itemsProcessed === items.length && !hasError) {
                      // Mark sale as deleted (SOFT DELETE)
                      db.run(
                        'UPDATE sales SET is_deleted = 1, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?',
                        [req.user.userId, id],
                        function(err) {
                          if (err) {
                            db.run('ROLLBACK');
                            return res.status(500).json({ error: 'Database error' });
                          }

                          // Registrar en auditoría
                          try {
                            auditSystem.logSoftDelete('sales', id, { ...sale, items }, req.user.userId, req);
                          } catch (auditError) {
                            console.warn('Audit logging failed:', auditError);
                          }

                          db.run('COMMIT');
                          res.json({ 
                            message: 'Sale cancelled and archived successfully (soft deleted)',
                            saleId: id,
                            archivedAt: new Date().toISOString(),
                            reason: reason,
                            stockRestored: items.length
                          });
                        }
                      );
                    }
                  }
                );
              });
            }
          );
        }
      );
    });
  } catch (error) {
    console.error('Soft delete sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Restore soft deleted sale
router.post('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    // Get the deleted sale
    db.get('SELECT * FROM sales WHERE id = ? AND is_deleted = 1', [id], async (err, sale) => {
      if (err) {
        console.error('Database error getting deleted sale:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!sale) {
        return res.status(404).json({ error: 'Deleted sale not found' });
      }

      // Check if products have enough stock
      db.all('SELECT * FROM sale_items WHERE sale_id = ?', [id], async (err, items) => {
        if (err) {
          console.error('Database error getting sale items:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        let canRestore = true;
        let stockIssues = [];

        // Check stock availability
        for (const item of items) {
          db.get('SELECT stock_quantity FROM products WHERE id = ?', [item.product_id], (err, product) => {
            if (err || !product) {
              canRestore = false;
              stockIssues.push(`Product ${item.product_id} not found`);
              return;
            }

            if (product.stock_quantity < item.quantity) {
              canRestore = false;
              stockIssues.push(`Insufficient stock for product ${item.product_id}`);
            }
          });
        }

        if (!canRestore) {
          return res.status(400).json({ 
            error: 'Cannot restore sale due to insufficient stock',
            issues: stockIssues
          });
        }

        // Restore the sale
        db.run(
          'UPDATE sales SET is_deleted = 0, deleted_at = NULL, deleted_by = NULL WHERE id = ?',
          [id],
          async function(err) {
            if (err) {
              console.error('Database error restoring sale:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: 'Sale not found' });
            }

            // Restore stock
            items.forEach(item => {
              db.run(
                'UPDATE products SET stock_quantity = stock_quantity - ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                [item.quantity, item.product_id],
                (err) => {
                  if (err) {
                    console.warn('Error updating stock for restored sale:', err);
                  }
                }
              );
            });

            // Registrar en auditoría
            try {
              await auditSystem.logAction('sales', id, 'RESTORE', sale, { ...sale, is_deleted: 0 }, req.user.userId, req);
            } catch (auditError) {
              console.warn('Audit logging failed:', auditError);
            }

            res.json({ 
              message: 'Sale restored successfully',
              saleId: id,
              restoredAt: new Date().toISOString()
            });
          }
        );
      });
    });
  } catch (error) {
    console.error('Restore sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get archived sales (soft deleted)
router.get('/archived/list', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    const db = getDatabase();
    
    const query = `
      SELECT s.*, u.full_name as user_name, u2.username as deleted_by_user
      FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      LEFT JOIN users u2 ON s.deleted_by = u2.id
      WHERE s.is_deleted = 1
      ORDER BY s.deleted_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const countQuery = 'SELECT COUNT(*) as total FROM sales WHERE is_deleted = 1';
    
    db.get(countQuery, (err, countResult) => {
      if (err) {
        console.error('Database error getting archived sales count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, [parseInt(limit), offset], (err, sales) => {
        if (err) {
          console.error('Database error getting archived sales:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          sales,
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
    console.error('Get archived sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales statistics
router.get('/stats/summary', authenticateToken, (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    
    switch (period) {
      case 'week':
        dateFilter = 'AND created_at >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'AND created_at >= DATE("now", "-30 days")';
        break;
      case 'quarter':
        dateFilter = 'AND created_at >= DATE("now", "-90 days")';
        break;
      case 'year':
        dateFilter = 'AND created_at >= DATE("now", "-365 days")';
        break;
      default:
        dateFilter = 'AND created_at >= DATE("now", "-30 days")';
    }

    // Get sales summary (only active sales)
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_sale,
        COUNT(DISTINCT customer_email) as unique_customers
      FROM sales 
      WHERE is_deleted = 0 ${dateFilter}
    `;

    // Get sales by payment method
    const paymentQuery = `
      SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(total_amount) as total
      FROM sales 
      WHERE is_deleted = 0 ${dateFilter}
      GROUP BY payment_method
      ORDER BY total DESC
    `;

    // Get recent sales
    const recentQuery = `
      SELECT 
        s.id, s.sale_number, s.customer_name, s.total_amount, s.created_at,
        u.full_name as user_name
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.is_deleted = 0 ${dateFilter}
      ORDER BY s.created_at DESC
      LIMIT 5
    `;

    db.get(summaryQuery, (err, summary) => {
      if (err) {
        console.error('Database error getting sales summary:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(paymentQuery, (err, paymentMethods) => {
        if (err) {
          console.error('Database error getting payment methods:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        db.all(recentQuery, (err, recentSales) => {
          if (err) {
            console.error('Database error getting recent sales:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            period,
            summary: {
              totalSales: summary.total_sales || 0,
              totalRevenue: parseFloat(summary.total_revenue || 0).toFixed(2),
              averageSale: parseFloat(summary.avg_sale || 0).toFixed(2),
              uniqueCustomers: summary.unique_customers || 0
            },
            paymentMethods,
            recentSales
          });
        });
      });
    });
  } catch (error) {
    console.error('Sales stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top selling products
router.get('/stats/top-products', authenticateToken, (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    
    switch (period) {
      case 'week':
        dateFilter = 'AND s.created_at >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'AND s.created_at >= DATE("now", "-30 days")';
        break;
      case 'year':
        dateFilter = 'AND s.created_at >= DATE("now", "-365 days")';
        break;
      default:
        dateFilter = 'AND s.created_at >= DATE("now", "-30 days")';
    }

    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        SUM(si.quantity) as total_quantity,
        SUM(si.total_price) as total_revenue,
        COUNT(DISTINCT s.id) as sale_count
      FROM sale_items si
      JOIN sales s ON si.sale_id = s.id
      JOIN products p ON si.product_id = p.id
      WHERE s.is_deleted = 0 AND p.is_deleted = 0 ${dateFilter}
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity DESC
      LIMIT ?
    `;

    db.all(query, [parseInt(limit)], (err, products) => {
      if (err) {
        console.error('Database error getting top products:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ products });
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
