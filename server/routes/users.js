const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../database/init');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Multer configuration for profile image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/profiles');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

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

// Create new user (for administrators)
router.post('/', upload.single('profile_image'), async (req, res) => {
  try {
    const { username, email, password, fullName, role = 'vendedor', phone, address, bio } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Todos los campos marcados con * son requeridos' });
    }

    // Validate role
    if (!['vendedor', 'administrador', 'inventario'].includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const db = getDatabase();
    
    // Check if username or email already exists
    const existingUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [username, email],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existingUser) {
      return res.status(400).json({ error: 'El nombre de usuario o email ya existe' });
    }

    // Hash password
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const insertQuery = `
      INSERT INTO users (username, email, password, full_name, role, phone, address, bio, profile_image, is_active, created_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const profileImagePath = req.file ? req.file.path : null;
    const now = new Date().toISOString();
    
    await new Promise((resolve, reject) => {
      db.run(insertQuery, [
        username, 
        email, 
        hashedPassword, 
        fullName, 
        role, 
        phone || null, 
        address || null, 
        bio || null, 
        profileImagePath,
        1, // is_active
        now // created_at
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
    });

    // Get the created user
    const newUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role, full_name, phone, address, bio, profile_image, is_active, created_at FROM users WHERE username = ?',
        [username],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // Add full URL to profile image
    if (newUser.profile_image) {
      newUser.profile_image = `/uploads/profiles/${path.basename(newUser.profile_image)}`;
    }

    console.log('✅ Usuario creado exitosamente:', newUser.username);
    
    res.status(201).json({ 
      message: 'Usuario creado exitosamente',
      user: newUser 
    });
  } catch (error) {
    console.error('❌ Error creando usuario:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Get all users (admin only)
router.get('/', authenticateToken, requireAdmin, (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = 'SELECT id, username, email, role, full_name, phone, address, bio, profile_image, created_at, updated_at FROM users WHERE 1=1';
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
        console.error('Database error getting user count:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(query, params, (err, users) => {
        if (err) {
          console.error('Database error getting users:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Add full URL to profile images
        users = users.map(user => ({
          ...user,
          profile_image: user.profile_image ? `/uploads/profiles/${path.basename(user.profile_image)}` : null
        }));

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
      'SELECT id, username, email, role, full_name, phone, address, bio, profile_image, created_at, updated_at FROM users WHERE id = ?',
      [id],
      (err, user) => {
        if (err) {
          console.error('Database error getting user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        // Add full URL to profile image
        if (user.profile_image) {
          user.profile_image = `/uploads/profiles/${path.basename(user.profile_image)}`;
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
router.put('/:id', authenticateToken, requireAdmin, upload.single('profile_image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, fullName, role, phone, address, bio } = req.body;

    if (!username || !email || !fullName || !role) {
      return res.status(400).json({ error: 'Required fields are missing' });
    }

    if (role !== 'vendedor' && role !== 'administrador') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const db = getDatabase();
    
    // First, get the current user to check if we need to delete old profile image
    db.get('SELECT profile_image FROM users WHERE id = ?', [id], (err, currentUser) => {
      if (err) {
        console.error('Database error getting current user:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!currentUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Handle profile image
      let profileImagePath = currentUser.profile_image;
      if (req.file) {
        // Delete old profile image if it exists
        if (currentUser.profile_image) {
          const oldImagePath = path.join(__dirname, '..', currentUser.profile_image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        profileImagePath = req.file.path;
      }

      // Update user with new data
      const updateQuery = `
        UPDATE users 
        SET username = ?, email = ?, full_name = ?, role = ?, phone = ?, address = ?, bio = ?, 
            profile_image = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      db.run(updateQuery, [username, email, fullName, role, phone || null, address || null, bio || null, profileImagePath, id], function(err) {
        if (err) {
          console.error('Database error updating user:', err);
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        // Get updated user
        db.get(
          'SELECT id, username, email, role, full_name, phone, address, bio, profile_image, created_at, updated_at FROM users WHERE id = ?',
          [id],
          (err, updatedUser) => {
            if (err) {
              console.error('Database error getting updated user:', err);
              return res.status(500).json({ error: 'Database error' });
            }
            
            // Add full URL to profile image
            if (updatedUser.profile_image) {
              updatedUser.profile_image = `/uploads/profiles/${path.basename(updatedUser.profile_image)}`;
            }
            
            res.json({ 
              message: 'User updated successfully',
              user: updatedUser 
            });
          }
        );
      });
    });
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
    
    // First, get the user to delete their profile image
    db.get('SELECT profile_image FROM users WHERE id = ?', [id], (err, user) => {
      if (err) {
        console.error('Database error getting user for deletion:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Delete profile image if it exists
      if (user.profile_image) {
        const imagePath = path.join(__dirname, '..', user.profile_image);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      // Delete user from database
      db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
          console.error('Database error deleting user:', err);
          return res.status(500).json({ error: 'Database error' });
        }
        if (this.changes === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
      });
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
        if (err) {
          console.error('Database error resetting password:', err);
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
      SELECT id, username, email, role, full_name, profile_image, created_at
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `;

    db.all(roleStatsQuery, (err, roleStats) => {
      if (err) {
        console.error('Database error getting role stats:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.all(recentUsersQuery, (err, recentUsers) => {
        if (err) {
          console.error('Database error getting recent users:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        // Add full URLs to profile images
        recentUsers = recentUsers.map(user => ({
          ...user,
          profile_image: user.profile_image ? `/uploads/profiles/${path.basename(user.profile_image)}` : null
        }));

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
        console.error('Database error getting sales stats:', err);
        return res.status(500).json({ error: 'Database error' });
      }

      db.get(movementsQuery, [id], (err, movementStats) => {
        if (err) {
          console.error('Database error getting movement stats:', err);
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
