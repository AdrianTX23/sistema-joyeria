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

// Export sales to CSV
router.get('/export/sales', authenticateToken, (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const db = getDatabase();
    
    let dateFilter = '';
    let params = [];

    if (startDate && endDate) {
      dateFilter = 'WHERE DATE(s.created_at) BETWEEN ? AND ?';
      params = [startDate, endDate];
    }

    const query = `
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

    db.all(query, params, (err, sales) => {
      if (err) {
        console.error('Database error getting sales for export:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Generate CSV
      const csvHeader = 'Sale Number,Customer Name,Customer Email,Total Amount,Payment Method,Date,Seller\n';
      const csvData = sales.map(sale => 
        `"${sale.sale_number}","${sale.customer_name || ''}","${sale.customer_email || ''}","${sale.total_amount}","${sale.payment_method}","${sale.created_at}","${sale.seller_name || ''}"`
      ).join('\n');

      const csv = csvHeader + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-export.csv');
      res.send(csv);
    });
  } catch (error) {
    console.error('Export sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Export inventory to CSV
router.get('/export/inventory', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    const query = `
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

    db.all(query, (err, inventory) => {
      if (err) {
        console.error('Database error getting inventory for export:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      // Generate CSV
      const csvHeader = 'SKU,Name,Description,Category,Stock Quantity,Min Stock Level,Price,Cost,Total Value\n';
      const csvData = inventory.map(item => 
        `"${item.sku}","${item.name}","${item.description || ''}","${item.category || ''}","${item.stock_quantity}","${item.min_stock_level}","${item.price}","${item.cost}","${item.total_value}"`
      ).join('\n');

      const csv = csvHeader + csvData;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory-export.csv');
      res.send(csv);
    });
  } catch (error) {
    console.error('Export inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
