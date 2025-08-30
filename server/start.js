#!/usr/bin/env node

const { initDatabase, closeDatabase } = require('./database/init');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Sistema de Joyería...');
console.log('📅 Fecha:', new Date().toISOString());
console.log('🌍 Entorno:', process.env.NODE_ENV || 'development');
console.log('🔧 Puerto:', process.env.PORT || 5001);

// Verificar y crear directorios necesarios
const dirs = [
  './database',
  './backups',
  './uploads'
];

dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`📁 Creando directorio: ${dir}`);
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Verificar la base de datos
const dbPath = path.join(__dirname, 'database', 'jewelry_inventory.db');
console.log('🗄️ Ruta de la BD:', dbPath);

if (fs.existsSync(dbPath)) {
  const stats = fs.statSync(dbPath);
  const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`💾 Base de datos existente: ${fileSizeInMB} MB`);
} else {
  console.log('📝 Base de datos no existe, se creará...');
}

// Función para iniciar el servidor
async function startServer() {
  try {
    console.log('🔧 Inicializando base de datos...');
    await initDatabase();
    console.log('✅ Base de datos inicializada correctamente');
    
    // Importar Express y configurar el servidor
    const express = require('express');
    const cors = require('cors');
    const helmet = require('helmet');
    const rateLimit = require('express-rate-limit');
    
    // Import routes
    const { router: authRoutes } = require('./routes/auth');
    const productRoutes = require('./routes/products');
    const saleRoutes = require('./routes/sales');
    const reportRoutes = require('./routes/reports');
    const userRoutes = require('./routes/users');
    const categoryRoutes = require('./routes/categories');
    const backupRoutes = require('./routes/backup');

    const app = express();
    const PORT = process.env.PORT || 5001;

    // Security middleware
    app.use(helmet());

    // Trust proxy for rate limiting
    app.set('trust proxy', 1);

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use(limiter);

    // CORS configuration
    app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? true // Allow all origins in production since frontend and backend are on same domain
        : ['http://localhost:3000'],
      credentials: true
    }));

    // Body parsing middleware
    app.use(express.json({ limit: '10mb' }));
    app.use(express.urlencoded({ extended: true }));

    // Static files
    app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

    // API Routes
    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/sales', saleRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/backup', backupRoutes);

    // Health check endpoint
    app.get('/api/health', (req, res) => {
      res.json({ status: 'OK', message: 'Jewelry Inventory System API is running' });
    });

    // Serve static files from React build in production
    if (process.env.NODE_ENV === 'production') {
      // Serve static files from the React build directory
      const buildPath = path.join(__dirname, '../client/build');
      console.log('📁 Serving static files from:', buildPath);
      
      // Serve static files (CSS, JS, images, etc.)
      app.use(express.static(buildPath));
      
      // Handle React routing, return all requests to React app
      app.get('*', (req, res) => {
        console.log('🌐 Request for:', req.path);
        
        // Don't serve index.html for API routes
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API route not found' });
        }
        
        const indexPath = path.join(buildPath, 'index.html');
        console.log('📄 Serving index.html from:', indexPath);
        
        res.sendFile(indexPath, (err) => {
          if (err) {
            console.error('❌ Error serving index.html:', err);
            res.status(500).send('Error loading application');
          } else {
            console.log('✅ Successfully served index.html for:', req.path);
          }
        });
      });
    }

    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
      });
    });

    // 404 handler (only for development)
    if (process.env.NODE_ENV !== 'production') {
      app.use('*', (req, res) => {
        res.status(404).json({ error: 'Route not found' });
      });
    }

    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 API available at http://localhost:${PORT}/api`);
      console.log('🎉 Servidor iniciado correctamente');
    });
    
    // Manejar señales de terminación
    process.on('SIGINT', () => {
      console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');
      closeDatabase();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
      closeDatabase();
      process.exit(0);
    });
    
    process.on('uncaughtException', (err) => {
      console.error('❌ Excepción no capturada:', err);
      closeDatabase();
      process.exit(1);
    });
    
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Promesa rechazada no manejada:', reason);
      closeDatabase();
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
