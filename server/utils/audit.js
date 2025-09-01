const { getDatabase } = require('../database/init');

class AuditSystem {
  constructor() {
    this.db = null;
  }

  // Inicializar conexión a la base de datos
  getDatabase() {
    if (!this.db) {
      this.db = getDatabase();
    }
    return this.db;
  }

  // Registrar acción en el log de auditoría
  async logAction(tableName, recordId, action, oldValues, newValues, userId, req = null) {
    try {
      const db = this.getDatabase();
      
      const ipAddress = req ? req.ip : null;
      const userAgent = req ? req.get('User-Agent') : null;
      
      const oldValuesStr = oldValues ? JSON.stringify(oldValues) : null;
      const newValuesStr = newValues ? JSON.stringify(newValues) : null;
      
      return new Promise((resolve, reject) => {
        db.run(`
          INSERT INTO audit_log (
            table_name, record_id, action, old_values, new_values, 
            user_id, ip_address, user_agent
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          tableName, recordId, action, oldValuesStr, newValuesStr,
          userId, ipAddress, userAgent
        ], function(err) {
          if (err) {
            console.error('❌ Error logging audit action:', err);
            reject(err);
          } else {
            console.log(`📝 Audit log: ${action} on ${tableName}:${recordId} by user:${userId}`);
            resolve(this.lastID);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error in audit system:', error);
      // No fallar la operación principal por errores de auditoría
    }
  }

  // Registrar creación de registro
  async logCreate(tableName, recordId, newValues, userId, req = null) {
    return this.logAction(tableName, recordId, 'CREATE', null, newValues, userId, req);
  }

  // Registrar actualización de registro
  async logUpdate(tableName, recordId, oldValues, newValues, userId, req = null) {
    return this.logAction(tableName, recordId, 'UPDATE', oldValues, newValues, userId, req);
  }

  // Registrar eliminación de registro
  async logDelete(tableName, recordId, oldValues, userId, req = null) {
    return this.logAction(tableName, recordId, 'DELETE', oldValues, null, userId, req);
  }

  // Registrar soft delete
  async logSoftDelete(tableName, recordId, oldValues, userId, req = null) {
    return this.logAction(tableName, recordId, 'SOFT_DELETE', oldValues, null, userId, req);
  }

  // Obtener historial de auditoría
  async getAuditHistory(tableName = null, recordId = null, userId = null, limit = 100) {
    try {
      const db = this.getDatabase();
      
      let query = 'SELECT * FROM audit_log WHERE 1=1';
      let params = [];
      
      if (tableName) {
        query += ' AND table_name = ?';
        params.push(tableName);
      }
      
      if (recordId) {
        query += ' AND record_id = ?';
        params.push(recordId);
      }
      
      if (userId) {
        query += ' AND user_id = ?';
        params.push(userId);
      }
      
      query += ' ORDER BY created_at DESC LIMIT ?';
      params.push(limit);
      
      return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve(rows);
          }
        });
      });
    } catch (error) {
      console.error('❌ Error getting audit history:', error);
      return [];
    }
  }

  // Obtener estadísticas de auditoría
  async getAuditStats() {
    try {
      const db = this.getDatabase();
      
      const stats = await Promise.all([
        new Promise((resolve, reject) => {
          db.get('SELECT COUNT(*) as total FROM audit_log', (err, row) => {
            if (err) reject(err);
            else resolve(row.total);
          });
        }),
        new Promise((resolve, reject) => {
          db.get('SELECT COUNT(*) as total FROM audit_log WHERE action = "DELETE"', (err, row) => {
            if (err) reject(err);
            else resolve(row.total);
          });
        }),
        new Promise((resolve, reject) => {
          db.get('SELECT COUNT(*) as total FROM audit_log WHERE action = "SOFT_DELETE"', (err, row) => {
            if (err) reject(err);
            else resolve(row.total);
          });
        })
      ]);
      
      return {
        totalActions: stats[0] || 0,
        hardDeletes: stats[1] || 0,
        softDeletes: stats[2] || 0
      };
    } catch (error) {
      console.error('❌ Error getting audit stats:', error);
      return { totalActions: 0, hardDeletes: 0, softDeletes: 0 };
    }
  }
}

// Instancia singleton del sistema de auditoría
const auditSystem = new AuditSystem();

module.exports = auditSystem;
