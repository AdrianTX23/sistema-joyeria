const express = require('express');
const { getDatabase } = require('../database/init');
const moment = require('moment');

const router = express.Router();

// Get dashboard summary
router.get('/dashboard', (req, res) => {
  try {
    const db = getDatabase();
    
    // Get today's stats
    const todayQuery = `
      SELECT 
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_sale
      FROM sales 
      WHERE DATE(created_at) = DATE('now')
    `;

    // Get this month's stats
    const monthQuery = `
      SELECT 
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_sale
      FROM sales 
      WHERE created_at >= DATE('now', 'start of month')
    `;

    // Get low stock products
    const lowStockQuery = `
      SELECT COUNT(*) as count
      FROM products 
      WHERE stock_quantity <= min_stock_level
    `;

    // Get total products
    const totalProductsQuery = 'SELECT COUNT(*) as count FROM products';

    // Get total value of inventory
    const inventoryValueQuery = `
      SELECT SUM(stock_quantity * cost) as total_value
      FROM products
    `;

    db.get(todayQuery, (err, todayStats) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      db.get(monthQuery, (err, monthStats) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        db.get(lowStockQuery, (err, lowStockCount) => {
          if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
          }

          db.get(totalProductsQuery, (err, totalProducts) => {
            if (err) {
              db.close();
              return res.status(500).json({ error: 'Database error' });
            }

            db.get(inventoryValueQuery, (err, inventoryValue) => {
              db.close();
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }

              res.json({
                today: {
                  sales: todayStats.sales_count || 0,
                  revenue: parseFloat(todayStats.revenue || 0).toFixed(2),
                  averageSale: parseFloat(todayStats.avg_sale || 0).toFixed(2)
                },
                month: {
                  sales: monthStats.sales_count || 0,
                  revenue: parseFloat(monthStats.revenue || 0).toFixed(2),
                  averageSale: parseFloat(monthStats.avg_sale || 0).toFixed(2)
                },
                inventory: {
                  totalProducts: totalProducts.count || 0,
                  lowStockItems: lowStockCount.count || 0,
                  totalValue: parseFloat(inventoryValue.total_value || 0).toFixed(2)
                }
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales report by period
router.get('/sales', (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    let params = [];
    
    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params = [startDate, endDate];
    } else {
      switch (period) {
        case 'week':
          dateFilter = 'WHERE created_at >= DATE("now", "-7 days")';
          break;
        case 'month':
          dateFilter = 'WHERE created_at >= DATE("now", "-30 days")';
          break;
        case 'quarter':
          dateFilter = 'WHERE created_at >= DATE("now", "-90 days")';
          break;
        case 'year':
          dateFilter = 'WHERE created_at >= DATE("now", "-365 days")';
          break;
        default:
          dateFilter = 'WHERE created_at >= DATE("now", "-30 days")';
      }
    }

    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as sales_count,
        SUM(total_amount) as revenue,
        AVG(total_amount) as avg_sale,
        COUNT(DISTINCT user_id) as sellers_count
      FROM sales 
      ${dateFilter}
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;

    db.all(query, params, (err, salesData) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate totals
      const totals = salesData.reduce((acc, day) => {
        acc.totalSales += day.sales_count;
        acc.totalRevenue += parseFloat(day.revenue);
        acc.totalTransactions += day.sales_count;
        return acc;
      }, { totalSales: 0, totalRevenue: 0, totalTransactions: 0 });

      res.json({
        period,
        dateRange: { startDate, endDate },
        data: salesData,
        totals: {
          ...totals,
          totalRevenue: totals.totalRevenue.toFixed(2),
          averageSale: totals.totalSales > 0 ? (totals.totalRevenue / totals.totalSales).toFixed(2) : '0.00'
        }
      });
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory report
router.get('/inventory', (req, res) => {
  try {
    const { category = '', lowStock = false } = req.query;
    const db = getDatabase();
    
    let query = `
      SELECT 
        p.*,
        c.name as category_name,
        (p.stock_quantity * p.cost) as inventory_value,
        (p.stock_quantity * p.price) as retail_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    let params = [];

    if (category) {
      query += ' AND p.category_id = ?';
      params.push(category);
    }

    if (lowStock === 'true') {
      query += ' AND p.stock_quantity <= p.min_stock_level';
    }

    query += ' ORDER BY p.stock_quantity ASC';

    db.all(query, params, (err, products) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate summary
      const summary = products.reduce((acc, product) => {
        acc.totalItems += product.stock_quantity;
        acc.totalValue += parseFloat(product.inventory_value);
        acc.totalRetailValue += parseFloat(product.retail_value);
        acc.lowStockItems += product.stock_quantity <= product.min_stock_level ? 1 : 0;
        return acc;
      }, { totalItems: 0, totalValue: 0, totalRetailValue: 0, lowStockItems: 0 });

      res.json({
        products,
        summary: {
          ...summary,
          totalValue: summary.totalValue.toFixed(2),
          totalRetailValue: summary.totalRetailValue.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get product performance report
router.get('/products', (req, res) => {
  try {
    const { period = 'month', limit = 20 } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    
    switch (period) {
      case 'week':
        dateFilter = 'AND s.created_at >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'AND s.created_at >= DATE("now", "-30 days")';
        break;
      case 'quarter':
        dateFilter = 'AND s.created_at >= DATE("now", "-90 days")';
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
        p.stock_quantity,
        p.price,
        p.cost,
        c.name as category_name,
        COALESCE(SUM(si.quantity), 0) as units_sold,
        COALESCE(SUM(si.total_price), 0) as revenue,
        COALESCE(COUNT(DISTINCT s.id), 0) as sale_count,
        (p.stock_quantity * p.cost) as inventory_value,
        (p.stock_quantity * p.price) as retail_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id ${dateFilter}
      GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.price, p.cost, c.name
      ORDER BY units_sold DESC, revenue DESC
      LIMIT ?
    `;

    db.all(query, [parseInt(limit)], (err, products) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate summary
      const summary = products.reduce((acc, product) => {
        acc.totalRevenue += parseFloat(product.revenue);
        acc.totalUnitsSold += product.units_sold;
        acc.totalInventoryValue += parseFloat(product.inventory_value);
        acc.totalRetailValue += parseFloat(product.retail_value);
        return acc;
      }, { totalRevenue: 0, totalUnitsSold: 0, totalInventoryValue: 0, totalRetailValue: 0 });

      res.json({
        period,
        products,
        summary: {
          ...summary,
          totalRevenue: summary.totalRevenue.toFixed(2),
          totalInventoryValue: summary.totalInventoryValue.toFixed(2),
          totalRetailValue: summary.totalRetailValue.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Product performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category performance report
router.get('/categories', (req, res) => {
  try {
    const { period = 'month' } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    
    switch (period) {
      case 'week':
        dateFilter = 'AND s.created_at >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'AND s.created_at >= DATE("now", "-30 days")';
        break;
      case 'quarter':
        dateFilter = 'AND s.created_at >= DATE("now", "-90 days")';
        break;
      case 'year':
        dateFilter = 'AND s.created_at >= DATE("now", "-365 days")';
        break;
      default:
        dateFilter = 'AND s.created_at >= DATE("now", "-30 days")';
    }

    const query = `
      SELECT 
        c.id,
        c.name,
        COUNT(DISTINCT p.id) as product_count,
        COALESCE(SUM(si.quantity), 0) as units_sold,
        COALESCE(SUM(si.total_price), 0) as revenue,
        COALESCE(COUNT(DISTINCT s.id), 0) as sale_count,
        COALESCE(SUM(p.stock_quantity), 0) as current_stock,
        COALESCE(SUM(p.stock_quantity * p.cost), 0) as inventory_value
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    db.all(query, (err, categories) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate summary
      const summary = categories.reduce((acc, category) => {
        acc.totalRevenue += parseFloat(category.revenue);
        acc.totalUnitsSold += category.units_sold;
        acc.totalProducts += category.product_count;
        acc.totalInventoryValue += parseFloat(category.inventory_value);
        return acc;
      }, { totalRevenue: 0, totalUnitsSold: 0, totalProducts: 0, totalInventoryValue: 0 });

      res.json({
        period,
        categories,
        summary: {
          ...summary,
          totalRevenue: summary.totalRevenue.toFixed(2),
          totalInventoryValue: summary.totalInventoryValue.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Category performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get stock movements report
router.get('/stock-movements', (req, res) => {
  try {
    const { period = 'month', productId = '' } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    let productFilter = '';
    let params = [];
    
    switch (period) {
      case 'week':
        dateFilter = 'AND sm.created_at >= DATE("now", "-7 days")';
        break;
      case 'month':
        dateFilter = 'AND sm.created_at >= DATE("now", "-30 days")';
        break;
      case 'quarter':
        dateFilter = 'AND sm.created_at >= DATE("now", "-90 days")';
        break;
      case 'year':
        dateFilter = 'AND sm.created_at >= DATE("now", "-365 days")';
        break;
      default:
        dateFilter = 'AND sm.created_at >= DATE("now", "-30 days")';
    }

    if (productId) {
      productFilter = 'AND sm.product_id = ?';
      params.push(productId);
    }

    const query = `
      SELECT 
        sm.*,
        p.name as product_name,
        p.sku,
        u.full_name as user_name
      FROM stock_movements sm
      LEFT JOIN products p ON sm.product_id = p.id
      LEFT JOIN users u ON sm.user_id = u.id
      WHERE 1=1 ${dateFilter} ${productFilter}
      ORDER BY sm.created_at DESC
    `;

    db.all(query, params, (err, movements) => {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate summary
      const summary = movements.reduce((acc, movement) => {
        if (movement.movement_type === 'sale') {
          acc.totalSales += Math.abs(movement.quantity);
        } else if (movement.movement_type === 'adjustment') {
          acc.totalAdjustments += movement.quantity;
        } else if (movement.movement_type === 'initial') {
          acc.totalInitial += movement.quantity;
        }
        return acc;
      }, { totalSales: 0, totalAdjustments: 0, totalInitial: 0 });

      res.json({
        period,
        movements,
        summary
      });
    });
  } catch (error) {
    console.error('Stock movements error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export reports to CSV
router.get('/export', (req, res) => {
  try {
    const { type, period = 'month' } = req.query;
    const db = getDatabase();
    
    // Validaciones mejoradas
    if (!type) {
      return res.status(400).json({ error: 'Report type is required' });
    }

    const validTypes = ['sales', 'inventory', 'products', 'categories'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid report type. Valid types: sales, inventory, products, categories' });
    }

    const validPeriods = ['week', 'month', 'quarter', 'year'];
    if (type !== 'inventory' && !validPeriods.includes(period)) {
      return res.status(400).json({ error: 'Invalid period. Valid periods: week, month, quarter, year' });
    }

    let query = '';
    let filename = '';
    
    switch (type) {
      case 'sales':
        filename = `reporte-ventas-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            s.id,
            s.sale_number,
            s.customer_name,
            s.customer_email,
            s.total_amount,
            s.payment_method,
            s.created_at,
            u.full_name as seller_name
          FROM sales s
          LEFT JOIN users u ON s.user_id = u.id
          WHERE s.created_at >= DATE('now', '-30 days')
          ORDER BY s.created_at DESC
        `;
        break;
        
      case 'inventory':
        filename = `reporte-inventario-${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            p.id,
            p.name,
            p.sku,
            p.description,
            p.stock_quantity,
            p.min_stock_level,
            p.cost,
            p.price,
            c.name as category_name,
            (p.stock_quantity * p.cost) as inventory_value
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.stock_quantity ASC
        `;
        break;
        
      case 'products':
        filename = `reporte-productos-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            p.id,
            p.name,
            p.sku,
            p.description,
            p.stock_quantity,
            p.cost,
            p.price,
            c.name as category_name,
            COALESCE(SUM(si.quantity), 0) as units_sold,
            COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          LEFT JOIN sale_items si ON p.id = si.product_id
          LEFT JOIN sales s ON si.sale_id = s.id
          WHERE s.created_at >= DATE('now', '-30 days') OR s.created_at IS NULL
          GROUP BY p.id
          ORDER BY units_sold DESC
        `;
        break;
        
      case 'categories':
        filename = `reporte-categorias-${period}-${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            c.id,
            c.name,
            c.description,
            COUNT(p.id) as product_count,
            COALESCE(SUM(si.quantity), 0) as units_sold,
            COALESCE(SUM(si.quantity * si.unit_price), 0) as revenue,
            COALESCE(SUM(p.stock_quantity * p.cost), 0) as inventory_value
          FROM categories c
          LEFT JOIN products p ON c.id = p.category_id
          LEFT JOIN sale_items si ON p.id = si.product_id
          LEFT JOIN sales s ON si.sale_id = s.id
          WHERE s.created_at >= DATE('now', '-30 days') OR s.created_at IS NULL
          GROUP BY c.id
          ORDER BY revenue DESC
        `;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid report type' });
    }

    db.all(query, (err, rows) => {
      db.close();
      if (err) {
        console.error('Database error in export:', err);
        return res.status(500).json({ error: 'Database error during export' });
      }

      // Verificar si hay datos
      if (!rows || rows.length === 0) {
        return res.status(404).json({ error: 'No data found for the specified criteria' });
      }

      try {
        // Convert to CSV with mejor manejo de caracteres especiales
        let csv = '';
        
        // Headers
        const headers = Object.keys(rows[0]);
        const headerRow = headers.map(header => {
          // Escapar caracteres especiales en headers
          const escapedHeader = header.replace(/"/g, '""');
          return `"${escapedHeader}"`;
        });
        csv += headerRow.join(',') + '\n';
        
        // Data rows
        rows.forEach(row => {
          const values = headers.map(header => {
            const value = row[header];
            
            // Manejar diferentes tipos de datos
            if (value === null || value === undefined) {
              return '""';
            }
            
            const stringValue = String(value);
            
            // Escapar comillas y comas
            if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            
            return stringValue;
          });
          csv += values.join(',') + '\n';
        });

        // Verificar que el CSV no esté vacío
        if (!csv.trim()) {
          return res.status(500).json({ error: 'Generated CSV is empty' });
        }

        // Set headers for file download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Length', Buffer.byteLength(csv, 'utf8'));
        res.send(csv);
        
      } catch (csvError) {
        console.error('Error generating CSV:', csvError);
        return res.status(500).json({ error: 'Error generating CSV file' });
      }
    });
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
