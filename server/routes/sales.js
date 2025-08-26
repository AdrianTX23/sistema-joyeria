const express = require('express');
const { getDatabase } = require('../database/init');
const moment = require('moment');

const router = express.Router();

// Generate unique sale number
function generateSaleNumber() {
  const timestamp = Date.now().toString();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `SALE-${timestamp.slice(-6)}-${random}`;
}

// Get all sales with pagination and filters
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate = '', endDate = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT s.*, u.full_name as seller_name 
      FROM sales s 
      LEFT JOIN users u ON s.user_id = u.id 
      WHERE 1=1
    `;
    let countQuery = 'SELECT COUNT(*) as total FROM sales s WHERE 1=1';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' AND (s.sale_number LIKE ? OR s.customer_name LIKE ? OR s.customer_email LIKE ?)';
      countQuery += ' AND (s.sale_number LIKE ? OR s.customer_name LIKE ? OR s.customer_email LIKE ?)';
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
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, sales) => {
        db.close();
        if (err) {
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

// Get single sale by ID with items
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    // Get sale details
    db.get(
      `SELECT s.*, u.full_name as seller_name 
       FROM sales s 
       LEFT JOIN users u ON s.user_id = u.id 
       WHERE s.id = ?`,
      [id],
      (err, sale) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }
        if (!sale) {
          db.close();
          return res.status(404).json({ error: 'Sale not found' });
        }

        // Get sale items
        db.all(
          `SELECT si.*, p.name as product_name, p.sku, p.image_url 
           FROM sale_items si 
           LEFT JOIN products p ON si.product_id = p.id 
           WHERE si.sale_id = ?`,
          [id],
          (err, items) => {
            db.close();
            if (err) {
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
router.post('/', (req, res) => {
  try {
    const {
      customer_name,
      customer_email,
      customer_phone,
      payment_method,
      items
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Sale must have at least one item' });
    }

    if (!payment_method) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const saleNumber = generateSaleNumber();
    const db = getDatabase();

    // Calculate total amount
    let totalAmount = 0;
    for (const item of items) {
      totalAmount += item.quantity * item.unit_price;
    }

    // Start transaction
    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Create sale record
      db.run(
        `INSERT INTO sales (
          sale_number, customer_name, customer_email, customer_phone, 
          total_amount, payment_method, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          saleNumber, customer_name || null, customer_email || null, 
          customer_phone || null, totalAmount, payment_method, req.user?.id || 1
        ],
        function(err) {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          const saleId = this.lastID;
          let itemsProcessed = 0;
          let hasError = false;

          // Process each item
          items.forEach((item, index) => {
            // Check stock availability
            db.get(
              'SELECT stock_quantity, name FROM products WHERE id = ?',
              [item.product_id],
              (err, product) => {
                if (err || !product) {
                  hasError = true;
                  db.run('ROLLBACK');
                  db.close();
                  return res.status(400).json({ error: `Product not found: ${item.product_id}` });
                }

                if (product.stock_quantity < item.quantity) {
                  hasError = true;
                  db.run('ROLLBACK');
                  db.close();
                  return res.status(400).json({ 
                    error: `Insufficient stock for ${product.name}. Available: ${product.stock_quantity}, Requested: ${item.quantity}` 
                  });
                }

                // Insert sale item
                db.run(
                  `INSERT INTO sale_items (
                    sale_id, product_id, quantity, unit_price, total_price
                  ) VALUES (?, ?, ?, ?, ?)`,
                  [
                    saleId, item.product_id, item.quantity, 
                    item.unit_price, item.quantity * item.unit_price
                  ],
                  function(err) {
                    if (err) {
                      hasError = true;
                      db.run('ROLLBACK');
                      db.close();
                      return res.status(500).json({ error: 'Database error' });
                    }

                    // Update product stock
                    const newStock = product.stock_quantity - item.quantity;
                    db.run(
                      'UPDATE products SET stock_quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                      [newStock, item.product_id],
                      function(err) {
                        if (err) {
                          hasError = true;
                          db.run('ROLLBACK');
                          db.close();
                          return res.status(500).json({ error: 'Database error' });
                        }

                        // Record stock movement
                        db.run(
                          `INSERT INTO stock_movements (
                            product_id, movement_type, quantity, previous_stock, new_stock, user_id, notes
                          ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                          [
                            item.product_id, 'sale', -item.quantity, product.stock_quantity, newStock,
                            req.user?.id || 1, `Sale ${saleNumber}`
                          ]
                        );

                        itemsProcessed++;
                        
                        // If all items processed, commit transaction
                        if (itemsProcessed === items.length && !hasError) {
                          db.run('COMMIT');
                          
                          // Get complete sale with items
                          db.get(
                            `SELECT s.*, u.full_name as seller_name 
                             FROM sales s 
                             LEFT JOIN users u ON s.user_id = u.id 
                             WHERE s.id = ?`,
                            [saleId],
                            (err, sale) => {
                              if (err) {
                                db.close();
                                return res.status(500).json({ error: 'Database error' });
                              }

                              db.all(
                                `SELECT si.*, p.name as product_name, p.sku, p.image_url 
                                 FROM sale_items si 
                                 LEFT JOIN products p ON si.product_id = p.id 
                                 WHERE si.sale_id = ?`,
                                [saleId],
                                (err, saleItems) => {
                                  db.close();
                                  if (err) {
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
              }
            );
          });
        }
      );
    });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales statistics
router.get('/stats/summary', (req, res) => {
  try {
    const { period = 'today' } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    let params = [];
    
    switch (period) {
      case 'today':
        dateFilter = 'WHERE DATE(created_at) = DATE("now")';
        break;
      case 'week':
        dateFilter = 'WHERE created_at >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'WHERE created_at >= DATE("now", "-30 days")';
        break;
      case 'year':
        dateFilter = 'WHERE created_at >= DATE("now", "-365 days")';
        break;
      default:
        dateFilter = 'WHERE DATE(created_at) = DATE("now")';
    }

    const query = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as average_sale,
        MIN(total_amount) as min_sale,
        MAX(total_amount) as max_sale
      FROM sales 
      ${dateFilter}
    `;

    db.get(query, params, (err, stats) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({
        period,
        stats: {
          totalSales: stats.total_sales || 0,
          totalRevenue: parseFloat(stats.total_revenue || 0).toFixed(2),
          averageSale: parseFloat(stats.average_sale || 0).toFixed(2),
          minSale: parseFloat(stats.min_sale || 0).toFixed(2),
          maxSale: parseFloat(stats.max_sale || 0).toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Get sales stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top selling products
router.get('/stats/top-products', (req, res) => {
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
      WHERE 1=1 ${dateFilter}
      GROUP BY p.id, p.name, p.sku
      ORDER BY total_quantity DESC
      LIMIT ?
    `;

    db.all(query, [parseInt(limit)], (err, products) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      
      res.json({ products });
    });
  } catch (error) {
    console.error('Get top products error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete sale (with stock restoration)
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();

    db.serialize(() => {
      db.run('BEGIN TRANSACTION');

      // Get sale items
      db.all(
        'SELECT * FROM sale_items WHERE sale_id = ?',
        [id],
        (err, items) => {
          if (err) {
            db.run('ROLLBACK');
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          if (items.length === 0) {
            db.run('ROLLBACK');
            db.close();
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
                  db.close();
                  return res.status(500).json({ error: 'Database error' });
                }

                itemsProcessed++;
                
                if (itemsProcessed === items.length && !hasError) {
                  // Delete sale items
                  db.run('DELETE FROM sale_items WHERE sale_id = ?', [id], function(err) {
                    if (err) {
                      db.run('ROLLBACK');
                      db.close();
                      return res.status(500).json({ error: 'Database error' });
                    }

                    // Delete sale
                    db.run('DELETE FROM sales WHERE id = ?', [id], function(err) {
                      if (err) {
                        db.run('ROLLBACK');
                        db.close();
                        return res.status(500).json({ error: 'Database error' });
                      }

                      db.run('COMMIT');
                      db.close();
                      res.json({ message: 'Sale deleted successfully' });
                    });
                  });
                }
              }
            );
          });
        }
      );
    });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
