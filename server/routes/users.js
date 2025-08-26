const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDatabase } = require('../database/init');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is administrator
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Access denied. Administrator privileges required.' });
  }
  next();
};

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, username, email, role, full_name, created_at, updated_at FROM users WHERE 1=1';
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    let params = [];
    let countParams = [];

    if (search) {
      query += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      countQuery += ' AND (username LIKE ? OR email LIKE ? OR full_name LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
      countParams.push(searchParam, searchParam, searchParam);
    }

    if (role) {
      query += ' AND role = ?';
      countQuery += ' AND role = ?';
      params.push(role);
      countParams.push(role);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    const db = getDatabase();
    
    db.get(countQuery, countParams, (err, countResult) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, users) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          users,
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
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single user (admin only)
router.get('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const db = getDatabase();
    
    db.get(
      'SELECT id, username, email, role, full_name, created_at, updated_at FROM users WHERE id = ?',
      [id],
      (err, user) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
      }
    );
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, role } = req.body;

    if (!username || !email || !fullName || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'vendedor' && role !== 'administrador') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const db = getDatabase();
    
    db.run(
      'UPDATE users SET username = ?, email = ?, full_name = ?, role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [username, email, fullName, role, id],
      function(err) {
        if (err) {
          db.close();
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          db.close();
          return res.status(404).json({ error: 'User not found' });
        }

        db.get(
          'SELECT id, username, email, role, full_name, created_at, updated_at FROM users WHERE id = ?',
          [id],
          (err, updatedUser) => {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ 
              message: 'User updated successfully',
              user: updatedUser 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting self
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = getDatabase();
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      db.close();
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ message: 'User deleted successfully' });
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset user password (admin only)
router.post('/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const db = getDatabase();
    
    db.run(
      'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, id],
      function(err) {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'Password reset successfully' });
      }
    );
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user statistics (admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, (req, res) => {
  try {
    const db = getDatabase();
    
    // Get total users by role
    const roleStatsQuery = `
      SELECT role, COUNT(*) as count
      FROM users
      GROUP BY role
    `;

    // Get recent users
    const recentUsersQuery = `
      SELECT id, username, email, role, full_name, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `;

    db.all(roleStatsQuery, (err, roleStats) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(recentUsersQuery, (err, recentUsers) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        const totalUsers = roleStats.reduce((sum, stat) => sum + stat.count, 0);
        const adminCount = roleStats.find(stat => stat.role === 'administrador')?.count || 0;
        const sellerCount = roleStats.find(stat => stat.role === 'vendedor')?.count || 0;

        res.json({
          summary: {
            totalUsers,
            adminCount,
            sellerCount
          },
          roleStats,
          recentUsers
        });
      });
    });
  } catch (error) {
    console.error('User stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user activity (admin only)
router.get('/:id/activity', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
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

    // Get sales by user
    const salesQuery = `
      SELECT 
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        AVG(total_amount) as avg_sale
      FROM sales 
      WHERE user_id = ? ${dateFilter}
    `;

    // Get stock movements by user
    const movementsQuery = `
      SELECT 
        COUNT(*) as total_movements,
        SUM(CASE WHEN movement_type = 'sale' THEN 1 ELSE 0 END) as sales_movements,
        SUM(CASE WHEN movement_type = 'adjustment' THEN 1 ELSE 0 END) as adjustment_movements
      FROM stock_movements 
      WHERE user_id = ? ${dateFilter}
    `;

    db.get(salesQuery, [id], (err, salesStats) => {
      if (err) {
        db.close();
        return res.status(500).json({ error: 'Database error' });
      }

      db.get(movementsQuery, [id], (err, movementStats) => {
        db.close();
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          period,
          sales: {
            totalSales: salesStats.total_sales || 0,
            totalRevenue: parseFloat(salesStats.total_revenue || 0).toFixed(2),
            averageSale: parseFloat(salesStats.avg_sale || 0).toFixed(2)
          },
          movements: {
            totalMovements: movementStats.total_movements || 0,
            salesMovements: movementStats.sales_movements || 0,
            adjustmentMovements: movementStats.adjustment_movements || 0
          }
        });
      });
    });
  } catch (error) {
    console.error('User activity error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



module.exports = router;
