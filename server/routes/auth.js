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

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const db = getDatabase();
    
    db.get(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username],
      async (err, user) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
          db.close();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        
        if (!isValidPassword) {
          db.close();
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { 
            id: user.id, 
            username: user.username, 
            role: user.role,
            fullName: user.full_name 
          },
          JWT_SECRET,
          { expiresIn: '24h' }
        );

        db.close();
        
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            fullName: user.full_name
          }
        });
      }
    );
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register route (only for administrators)
router.post('/register', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'administrador') {
      return res.status(403).json({ error: 'Only administrators can create new users' });
    }

    const { username, email, password, fullName, role = 'vendedor' } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'vendedor' && role !== 'administrador') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const db = getDatabase();

    db.run(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, fullName, role],
      function(err) {
        if (err) {
          db.close();
          if (err.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: 'Database error' });
        }

        db.get(
          'SELECT id, username, email, role, full_name FROM users WHERE id = ?',
          [this.lastID],
          (err, newUser) => {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ 
              message: 'User created successfully',
              user: newUser 
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/profile', authenticateToken, (req, res) => {
  try {
    const db = getDatabase();
    
    db.get(
      'SELECT id, username, email, role, full_name, created_at FROM users WHERE id = ?',
      [req.user.id],
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
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Change password
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required' });
    }

    const db = getDatabase();
    
    db.get(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id],
      async (err, user) => {
        if (err) {
          db.close();
          return res.status(500).json({ error: 'Database error' });
        }

        const isValidPassword = await bcrypt.compare(currentPassword, user.password);
        
        if (!isValidPassword) {
          db.close();
          return res.status(400).json({ error: 'Current password is incorrect' });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        
        db.run(
          'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [hashedNewPassword, req.user.id],
          function(err) {
            db.close();
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            res.json({ message: 'Password updated successfully' });
          }
        );
      }
    );
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, authenticateToken };
