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

// Middleware to authenticate JWT token
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
  console.log('🔐 Intento de login recibido:', {
    username: req.body.username || 'No proporcionado',
    email: req.body.email || 'No proporcionado',
    hasPassword: !!req.body.password,
    timestamp: new Date().toISOString(),
    body: { ...req.body, password: req.body.password ? '***' : 'undefined' }
  });

  try {
    const { username, email, password, rememberMe } = req.body;
    
    if (!username && !email) {
      console.log('❌ Login fallido: No se proporcionó username ni email');
      return res.status(400).json({ error: 'Se requiere username o email' });
    }
    
    if (!password) {
      console.log('❌ Login fallido: No se proporcionó contraseña');
      return res.status(400).json({ error: 'Se requiere contraseña' });
    }

    // Buscar usuario por username o email
    let searchField, searchValue;
    
    if (email) {
      searchField = 'email';
      searchValue = email;
    } else if (username) {
      searchField = 'username';
      searchValue = username;
    } else {
      console.log('❌ Login fallido: No se proporcionó username ni email');
      return res.status(400).json({ error: 'Se requiere username o email' });
    }
    
    console.log(`🔍 Buscando usuario por ${searchField}: ${searchValue}`);
    
    const db = getDatabase();
    const user = await new Promise((resolve, reject) => {
      db.get(
        `SELECT * FROM users WHERE ${searchField} = ?`,
        [searchValue],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      console.log(`❌ Usuario no encontrado: ${searchValue}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log(`✅ Usuario encontrado: ${user.username} (${user.role})`);

    // Verificar contraseña
    const isValidPassword = await bcrypt.compare(password, user.password);
    
    if (!isValidPassword) {
      console.log(`❌ Contraseña incorrecta para usuario: ${user.username}`);
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    console.log(`✅ Contraseña válida para usuario: ${user.username}`);

    // Generar token JWT
    const token = jwt.sign(
      { 
        userId: user.id, 
        username: user.username, 
        role: user.role,
        email: user.email 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log(`🎫 Token JWT generado para: ${user.username}`);

    // Respuesta exitosa
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        full_name: user.full_name
      },
      rememberMe: rememberMe || false
    });

    console.log(`✅ Login exitoso para: ${user.username} (${user.role})`);

  } catch (error) {
    console.error('❌ Error en login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Register route (only for administrators)
router.post('/register', authenticateToken, upload.single('profile_image'), async (req, res) => {
  try {
    if (req.user.role !== 'administrador') {
      return res.status(403).json({ error: 'Only administrators can create new users' });
    }

    const { username, email, password, fullName, role = 'vendedor', phone, address, bio } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (role !== 'vendedor' && role !== 'administrador') {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const db = getDatabase();
    await new Promise((resolve, reject) => {
      const insertQuery = `
        INSERT INTO users (username, email, password, full_name, role, phone, address, bio, profile_image) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const profileImagePath = req.file ? req.file.path : null;
      
      db.run(insertQuery, [
        username, 
        email, 
        hashedPassword, 
        fullName, 
        role, 
        phone || null, 
        address || null, 
        bio || null, 
        profileImagePath
      ], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const newUser = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role, full_name, phone, address, bio, profile_image FROM users WHERE username = ?',
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

    res.status(201).json({ 
      message: 'User created successfully',
      user: newUser 
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    console.log('👤 Obteniendo perfil de usuario:', req.user);
    
    const db = getDatabase();
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT id, username, email, role, full_name FROM users WHERE id = ?',
        [req.user.userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!user) {
      console.log('❌ Usuario no encontrado en BD');
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    console.log('✅ Perfil de usuario obtenido:', user);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        fullName: user.full_name
      }
    });
  } catch (error) {
    console.error('❌ Error obteniendo perfil:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Change password route
router.put('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    const db = getDatabase();
    const user = await new Promise((resolve, reject) => {
      db.get(
        'SELECT password FROM users WHERE id = ?',
        [req.user.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await new Promise((resolve, reject) => {
      db.run(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedNewPassword, req.user.id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users (only for administrators)
router.get('/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'administrador') {
      return res.status(403).json({ error: 'Only administrators can view all users' });
    }

    const db = getDatabase();
    const users = await new Promise((resolve, reject) => {
      db.all(
        'SELECT id, username, email, role, full_name, created_at FROM users ORDER BY created_at DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete user (only for administrators)
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'administrador') {
      return res.status(403).json({ error: 'Only administrators can delete users' });
    }

    const userId = parseInt(req.params.id);

    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const db = getDatabase();
    const result = await new Promise((resolve, reject) => {
      db.run(
        'DELETE FROM users WHERE id = ?',
        [userId],
        function(err) {
          if (err) reject(err);
          else resolve({ changes: this.changes });
        }
      );
    });

    if (result.changes === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = { router, authenticateToken };
