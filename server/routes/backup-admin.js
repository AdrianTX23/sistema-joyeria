const express = require('express');
const { getDatabase } = require('../database/init');
const { authenticateToken } = require('./auth');
const backupManager = require('../utils/backup-manager');
const auditSystem = require('../utils/audit');
const cloudBackupSystem = require('../utils/cloud-backup');

const router = express.Router();

// Middleware para verificar que sea administrador
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'administrador') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Obtener estado del sistema de backup
router.get('/status', authenticateToken, requireAdmin, (req, res) => {
  try {
    const status = backupManager.getStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('Error getting backup status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Crear backup manual
router.post('/create', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const backupResult = await backupManager.createManualBackup();
    
    // Registrar en auditoría
    try {
      await auditSystem.logAction('backup', 0, 'MANUAL_BACKUP', null, backupResult, req.user.userId, req);
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Manual backup created successfully',
      backup: backupResult
    });
  } catch (error) {
    console.error('Error creating manual backup:', error);
    res.status(500).json({ error: 'Failed to create backup' });
  }
});

// Obtener lista de backups disponibles
router.get('/list', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const backups = await cloudBackupSystem.getAvailableBackups();
    res.json({
      success: true,
      backups: backups
    });
  } catch (error) {
    console.error('Error getting backup list:', error);
    res.status(500).json({ error: 'Failed to get backup list' });
  }
});

// Verificar integridad de backups
router.post('/verify', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const verificationResult = await backupManager.verifyBackups();
    
    // Registrar en auditoría
    try {
      await auditSystem.logAction('backup', 0, 'VERIFY_BACKUPS', null, verificationResult, req.user.userId, req);
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Backup verification completed',
      result: verificationResult
    });
  } catch (error) {
    console.error('Error verifying backups:', error);
    res.status(500).json({ error: 'Failed to verify backups' });
  }
});

// Restaurar desde backup
router.post('/restore/:filename', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { filename } = req.params;
    const { confirmation } = req.body;
    
    if (!confirmation || confirmation !== 'CONFIRM_RESTORE') {
      return res.status(400).json({ 
        error: 'Confirmation required. Send "CONFIRM_RESTORE" to confirm.' 
      });
    }
    
    await backupManager.restoreFromBackup(filename);
    
    // Registrar en auditoría
    try {
      await auditSystem.logAction('backup', 0, 'RESTORE_FROM_BACKUP', null, { filename }, req.user.userId, req);
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Backup restored successfully',
      filename: filename
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

// Obtener estadísticas de backup
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await backupManager.getBackupStats();
    res.json({
      success: true,
      stats: stats
    });
  } catch (error) {
    console.error('Error getting backup stats:', error);
    res.status(500).json({ error: 'Failed to get backup stats' });
  }
});

// Obtener historial de auditoría
router.get('/audit', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { table = null, recordId = null, userId = null, limit = 100 } = req.query;
    
    const auditHistory = await auditSystem.getAuditHistory(table, recordId, userId, limit);
    const auditStats = await auditSystem.getAuditStats();
    
    res.json({
      success: true,
      audit: {
        history: auditHistory,
        stats: auditStats
      }
    });
  } catch (error) {
    console.error('Error getting audit history:', error);
    res.status(500).json({ error: 'Failed to get audit history' });
  }
});

// Obtener auditoría específica por tabla
router.get('/audit/:table', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { table } = req.params;
    const { limit = 100 } = req.query;
    
    const auditHistory = await auditSystem.getAuditHistory(table, null, null, limit);
    
    res.json({
      success: true,
      table: table,
      audit: auditHistory
    });
  } catch (error) {
    console.error('Error getting table audit:', error);
    res.status(500).json({ error: 'Failed to get table audit' });
  }
});

// Obtener auditoría de un registro específico
router.get('/audit/:table/:recordId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { table, recordId } = req.params;
    
    const auditHistory = await auditSystem.getAuditHistory(table, recordId, null, 50);
    
    res.json({
      success: true,
      table: table,
      recordId: recordId,
      audit: auditHistory
    });
  } catch (error) {
    console.error('Error getting record audit:', error);
    res.status(500).json({ error: 'Failed to get record audit' });
  }
});

// Obtener auditoría de un usuario específico
router.get('/audit/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 100 } = req.query;
    
    const auditHistory = await auditSystem.getAuditHistory(null, null, userId, limit);
    
    res.json({
      success: true,
      userId: userId,
      audit: auditHistory
    });
  } catch (error) {
    console.error('Error getting user audit:', error);
    res.status(500).json({ error: 'Failed to get user audit' });
  }
});

// Exportar auditoría a CSV
router.get('/audit/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { table = null, startDate = null, endDate = null } = req.query;
    
    let query = 'SELECT * FROM audit_log WHERE 1=1';
    let params = [];
    
    if (table) {
      query += ' AND table_name = ?';
      params.push(table);
    }
    
    if (startDate) {
      query += ' AND DATE(created_at) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND DATE(created_at) <= ?';
      params.push(endDate);
    }
    
    query += ' ORDER BY created_at DESC';
    
    const db = getDatabase();
    
    db.all(query, params, (err, auditData) => {
      if (err) {
        console.error('Database error getting audit data:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      
      if (!auditData || auditData.length === 0) {
        return res.status(404).json({ error: 'No audit data found' });
      }
      
      // Generate CSV
      const csvHeader = 'ID,Table,Record ID,Action,Old Values,New Values,User ID,IP Address,User Agent,Timestamp\n';
      const csvData = auditData.map(row => 
        `"${row.id}","${row.table_name}","${row.record_id}","${row.action}","${row.old_values || ''}","${row.new_values || ''}","${row.user_id}","${row.ip_address || ''}","${row.user_agent || ''}","${row.created_at}"`
      ).join('\n');
      
      const csv = csvHeader + csvData;
      const filename = `audit_log_${table || 'all'}_${new Date().toISOString().split('T')[0]}.csv`;
      
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    });
    
  } catch (error) {
    console.error('Error exporting audit:', error);
    res.status(500).json({ error: 'Failed to export audit' });
  }
});

// Configurar sistema de backup
router.put('/config', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { backupInterval, maxBackups, cloudBackupEnabled } = req.body;
    
    // Validar parámetros
    if (backupInterval && (backupInterval < 1 || backupInterval > 168)) {
      return res.status(400).json({ error: 'Backup interval must be between 1 and 168 hours' });
    }
    
    if (maxBackups && (maxBackups < 1 || maxBackups > 1000)) {
      return res.status(400).json({ error: 'Max backups must be between 1 and 1000' });
    }
    
    // Aplicar configuración
    if (backupInterval) {
      backupManager.backupInterval = backupInterval * 60 * 60 * 1000; // convertir a milisegundos
    }
    
    if (maxBackups) {
      backupManager.maxBackups = maxBackups;
    }
    
    // Registrar en auditoría
    try {
      await auditSystem.logAction('backup', 0, 'UPDATE_CONFIG', null, { backupInterval, maxBackups, cloudBackupEnabled }, req.user.userId, req);
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Backup configuration updated',
      config: {
        backupInterval: backupManager.backupInterval / (60 * 60 * 1000), // convertir a horas
        maxBackups: backupManager.maxBackups
      }
    });
    
  } catch (error) {
    console.error('Error updating backup config:', error);
    res.status(500).json({ error: 'Failed to update backup configuration' });
  }
});

// Detener sistema de backup
router.post('/stop', authenticateToken, requireAdmin, async (req, res) => {
  try {
    backupManager.stop();
    
    // Registrar en auditoría
    try {
      await auditSystem.logAction('backup', 0, 'STOP_SYSTEM', null, null, req.user.userId, req);
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Backup system stopped'
    });
  } catch (error) {
    console.error('Error stopping backup system:', error);
    res.status(500).json({ error: 'Failed to stop backup system' });
  }
});

// Reiniciar sistema de backup
router.post('/restart', authenticateToken, requireAdmin, async (req, res) => {
  try {
    backupManager.stop();
    setTimeout(() => {
      backupManager.start();
    }, 1000);
    
    // Registrar en auditoría
    try {
      auditSystem.logAction('backup', 0, 'RESTART_SYSTEM', null, null, req.user.userId, req);
    } catch (auditError) {
      console.warn('Audit logging failed:', auditError);
    }
    
    res.json({
      success: true,
      message: 'Backup system restarting'
    });
  } catch (error) {
    console.error('Error restarting backup system:', error);
    res.status(500).json({ error: 'Failed to restart backup system' });
  }
});

module.exports = router;
