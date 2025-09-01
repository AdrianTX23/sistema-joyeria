const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { executeQuerySingle, executeCommand } = require('../database/db-adapter');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

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
    username: req.body.username,
    email: req.body.email,
    timestamp: new Date().toISOString()
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
    const searchField = username ? 'username' : 'email';
    const searchValue = username || email;
    
    console.log(`🔍 Buscando usuario por ${searchField}: ${searchValue}`);
    
    const user = await executeQuerySingle(
      `SELECT * FROM users WHERE ${searchField} = ?`,
      [searchValue]
    );

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

    await executeCommand(
      'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, fullName, role]
    );

    const newUser = await executeQuerySingle(
      'SELECT id, username, email, role, full_name FROM users WHERE username = ?',
      [username]
    );

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
    
    const user = await executeQuerySingle(
      'SELECT id, username, email, role, full_name FROM users WHERE id = ?',
      [req.user.userId]
    );

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

    const user = await executeQuerySingle(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await executeCommand(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedNewPassword, req.user.id]
    );

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

    const users = await executeQuerySingle(
      'SELECT id, username, email, role, full_name, created_at FROM users ORDER BY created_at DESC'
    );

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

    const result = await executeCommand(
      'DELETE FROM users WHERE id = ?',
      [userId]
    );

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
