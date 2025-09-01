const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Get dashboard summary
router.get('/dashboard', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    // Get total products
    db.get('SELECT COUNT(*) as total FROM products', (err, productsResult) => {
      if (err) {
        console.error('Database error getting products count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Get low stock products
      db.get('SELECT COUNT(*) as total FROM products WHERE stock_quantity <= min_stock_level', (err, lowStockResult) => {
        if (err) {
          console.error('Database error getting low stock count:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Get total sales today
        db.get('SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM sales WHERE DATE(created_at) = DATE("now")', (err, todaySalesResult) => {
          if (err) {
            console.error('Database error getting today sales:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          // Get total sales this month
          db.get('SELECT COUNT(*) as total, SUM(total_amount) as revenue FROM sales WHERE created_at >= DATE("now", "start of month")', (err, monthSalesResult) => {
            if (err) {
              console.error('Database error getting month sales:', err);
              return res.status(500).json({ error: 'Database error' });
            }

            // Get recent sales
            db.all('SELECT * FROM sales ORDER BY created_at DESC LIMIT 5', (err, recentSales) => {
              if (err) {
                console.error('Database error getting recent sales:', err);
                return res.status(500).json({ error: 'Database error' });
              }

              // Get top products
              db.all(`
                SELECT p.name, p.sku, SUM(si.quantity) as total_sold
                FROM sale_items si
                JOIN products p ON si.product_id = p.id
                JOIN sales s ON si.sale_id = s.id
                WHERE s.created_at >= DATE("now", "-30 days")
                GROUP BY p.id, p.name, p.sku
                ORDER BY total_sold DESC
                LIMIT 5
              `, (err, topProducts) => {
                if (err) {
                  console.error('Database error getting top products:', err);
                  return res.status(500).json({ error: 'Database error' });
                }

                res.json({
                  summary: {
                    totalProducts: productsResult.total || 0,
                    lowStockProducts: lowStockResult.total || 0,
                    todaySales: todaySalesResult.total || 0,
                    todayRevenue: parseFloat(todaySalesResult.revenue || 0).toFixed(2),
                    monthSales: monthSalesResult.total || 0,
                    monthRevenue: parseFloat(monthSalesResult.revenue || 0).toFixed(2)
                  },
                  recentSales,
                  topProducts
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Dashboard report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales report
router.get('/sales', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    let groupClause = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(created_at) BETWEEN ? AND ?';
      params = [startDate, endDate];
    }

    switch (groupBy) {
      case 'day':
        groupClause = 'DATE(created_at)';
        break;
      case 'week':
        groupClause = 'strftime("%Y-%W", created_at)';
        break;
      case 'month':
        groupClause = 'strftime("%Y-%m", created_at)';
        break;
      default:
        groupClause = 'DATE(created_at)';
    }

    const query = `
      SELECT 
        ${groupClause} as period,
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_sale
      FROM sales 
      ${dateFilter}
      GROUP BY ${groupClause}
      ORDER BY period DESC
    `;

    db.all(query, params, (err, salesData) => {
      if (err) {
        console.error('Database error getting sales report:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      res.json({ salesData });
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory report
router.get('/inventory', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
      SELECT 
        p.id,
        p.name,
        p.sku,
        p.stock_quantity,
        p.min_stock_level,
        p.price,
        c.name as category_name,
        (p.price * p.stock_quantity) as total_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      ORDER BY p.stock_quantity ASC
    `;

    db.all(query, (err, inventoryData) => {
      if (err) {
        console.error('Database error getting inventory report:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      const lowStockItems = inventoryData.filter(item => item.stock_quantity <= item.min_stock_level);
      const totalValue = inventoryData.reduce((sum, item) => sum + parseFloat(item.total_value || 0), 0);

      res.json({
        inventoryData,
        summary: {
          totalItems: inventoryData.length,
          lowStockItems: lowStockItems.length,
          totalValue: totalValue.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Unified export route
router.get('/export', authenticateToken, (req, res) => {
  try {
    const { type, period, startDate, endDate } = req.query;
    const db = getDatabase();
    
    if (!type) {
      return res.status(400).json({ error: 'Type parameter is required' });
    }

    let dateFilter = '';
    let params = [];
    let query = '';
    let csvHeader = '';
    let fileName = '';

    switch (type) {
      case 'sales':
        // Date filter for sales
        if (startDate && endDate) {
          dateFilter = 'WHERE DATE(s.created_at) BETWEEN ? AND ?';
          params = [startDate, endDate];
        } else {
          // Default period filter
          switch (period) {
            case 'week':
              dateFilter = 'WHERE s.created_at >= DATE("now", "-7 days")';
              break;
            case 'month':
              dateFilter = 'WHERE s.created_at >= DATE("now", "-30 days")';
              break;
            case 'quarter':
              dateFilter = 'WHERE s.created_at >= DATE("now", "-90 days")';
              break;
            case 'year':
              dateFilter = 'WHERE s.created_at >= DATE("now", "-365 days")';
              break;
            default:
              dateFilter = 'WHERE s.created_at >= DATE("now", "-30 days")';
          }
        }

        query = `
          SELECT 
            s.sale_number,
            s.customer_name,
            s.customer_email,
            s.total_amount,
            s.payment_method,
            s.created_at,
            u.full_name as seller_name
          FROM sales s
          LEFT JOIN users u ON s.user_id = u.id
          ${dateFilter}
          ORDER BY s.created_at DESC
        `;

        csvHeader = 'Número de Venta,Cliente,Email,Total,Método de Pago,Fecha,Vendedor\n';
        fileName = `ventas_${period || 'personalizado'}_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'inventory':
        query = `
          SELECT 
            p.sku,
            p.name,
            p.description,
            c.name as category,
            p.stock_quantity,
            p.min_stock_level,
            p.price,
            p.cost,
            (p.price * p.stock_quantity) as total_value
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.name
        `;

        csvHeader = 'SKU,Nombre,Descripción,Categoría,Stock,Mínimo,Precio,Costo,Valor Total\n';
        fileName = `inventario_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'products':
        query = `
          SELECT 
            p.sku,
            p.name,
            p.description,
            c.name as category,
            p.stock_quantity,
            p.price,
            p.cost,
            p.created_at
          FROM products p
          LEFT JOIN categories c ON p.category_id = c.id
          ORDER BY p.name
        `;

        csvHeader = 'SKU,Nombre,Descripción,Categoría,Stock,Precio,Costo,Fecha Creación\n';
        fileName = `productos_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      case 'categories':
        query = `
          SELECT 
            c.name,
            COUNT(p.id) as product_count,
            SUM(COALESCE(si.quantity, 0)) as units_sold,
            SUM(COALESCE(si.total_price, 0)) as revenue,
            COUNT(DISTINCT s.id) as sale_count
          FROM categories c
          LEFT JOIN products p ON c.id = p.category_id
          LEFT JOIN sale_items si ON p.id = si.product_id
          LEFT JOIN sales s ON si.sale_id = s.id
          GROUP BY c.id, c.name
          ORDER BY revenue DESC
        `;

        csvHeader = 'Categoría,Productos,Unidades Vendidas,Ingresos,Total Ventas\n';
        fileName = `categorias_${new Date().toISOString().split('T')[0]}.csv`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    db.all(query, params, (err, data) => {
      if (err) {
        console.error(`Database error getting ${type} for export:`, err);
        return res.status(500).json({ error: 'Database error' });
      }

      if (!data || data.length === 0) {
        return res.status(404).json({ error: 'No data found for export' });
      }

      // Generate CSV
      const csvData = data.map(row => {
        return Object.values(row).map(value => 
          `"${value || ''}"`
        ).join(',');
      }).join('\n');

      const csv = csvHeader + csvData;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.send(csv);
    });

  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



// Get product performance report
router.get('/products', authenticateToken, (req, res) => {
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
        COALESCE(COUNT(DISTINCT s.id), 0) as sale_count
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id ${dateFilter}
      GROUP BY p.id, p.name, p.sku, p.stock_quantity, p.price, p.cost, c.name
      ORDER BY units_sold DESC, revenue DESC
      LIMIT ?
    `;

    db.all(query, [parseInt(limit)], (err, products) => {
      if (err) {
        console.error('Database error getting product performance:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate summary
      const summary = products.reduce((acc, product) => {
        acc.totalRevenue += parseFloat(product.revenue || 0);
        acc.totalUnitsSold += parseInt(product.units_sold || 0);
        return acc;
      }, { totalRevenue: 0, totalUnitsSold: 0 });

      res.json({
        period,
        products,
        summary: {
          ...summary,
          totalRevenue: summary.totalRevenue.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Product performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get category performance report
router.get('/categories', authenticateToken, (req, res) => {
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
        COALESCE(COUNT(DISTINCT s.id), 0) as sale_count
      FROM categories c
      LEFT JOIN products p ON c.id = p.category_id
      LEFT JOIN sale_items si ON p.id = si.product_id
      LEFT JOIN sales s ON si.sale_id = s.id ${dateFilter}
      GROUP BY c.id, c.name
      ORDER BY revenue DESC
    `;

    db.all(query, (err, categories) => {
      if (err) {
        console.error('Database error getting category performance:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Calculate summary
      const summary = categories.reduce((acc, category) => {
        acc.totalRevenue += parseFloat(category.revenue || 0);
        acc.totalUnitsSold += parseInt(category.units_sold || 0);
        acc.totalProducts += parseInt(category.product_count || 0);
        return acc;
      }, { totalRevenue: 0, totalUnitsSold: 0, totalProducts: 0 });

      res.json({
        period,
        categories,
        summary: {
          ...summary,
          totalRevenue: summary.totalRevenue.toFixed(2)
        }
      });
    });
  } catch (error) {
    console.error('Category performance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
