const express = require('express');
const { createBackup, restoreBackup, listBackups, verifyBackup } = require('../utils/backup');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Crear backup manual
router.post('/create', async (req, res) => {
  try {
    const result = await createBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        filename: result.filename
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error creando backup',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error en ruta de backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Listar backups disponibles
router.get('/list', async (req, res) => {
  try {
    const backups = await listBackups();
    
    res.json({
      success: true,
      backups: backups.map(backup => ({
        ...backup,
        size: formatFileSize(backup.size),
        created: backup.created.toISOString(),
        modified: backup.modified.toISOString()
      }))
    });
  } catch (error) {
    console.error('Error listando backups:', error);
    res.status(500).json({
      success: false,
      message: 'Error listando backups',
      error: error.message
    });
  }
});

// Verificar integridad de backup
router.get('/verify/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await verifyBackup(filename);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup verificado correctamente',
        size: formatFileSize(result.size)
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Backup corrupto o no encontrado',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error verificando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando backup',
      error: error.message
    });
  }
});

// Restaurar backup
router.post('/restore/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const result = await restoreBackup(filename);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup restaurado exitosamente',
        filename: filename
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error restaurando backup',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error restaurando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Obtener estadísticas de backup
router.get('/stats', async (req, res) => {
  try {
    const backups = await listBackups();
    const totalSize = backups.reduce((sum, backup) => sum + backup.size, 0);
    
    res.json({
      success: true,
      stats: {
        totalBackups: backups.length,
        totalSize: formatFileSize(totalSize),
        averageSize: formatFileSize(totalSize / Math.max(backups.length, 1)),
        oldestBackup: backups.length > 0 ? backups[backups.length - 1].created.toISOString() : null,
        newestBackup: backups.length > 0 ? backups[0].created.toISOString() : null
      }
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas',
      error: error.message
    });
  }
});

// Función para formatear tamaño de archivo
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = router;
