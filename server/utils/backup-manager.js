const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const cloudBackupSystem = require('./cloud-backup');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.dbPath = path.join(__dirname, '../database/jewelry_inventory.db');
    this.isRunning = false;
    this.lastBackup = null;
    this.backupInterval = 60 * 60 * 1000; // 1 hora
    this.maxBackups = 24; // 24 backups (1 día)
    this.backupTimer = null;
  }

  // Iniciar el sistema de backup automático
  start() {
    if (this.isRunning) {
      console.log('⚠️ Backup manager already running');
      return;
    }

    console.log('🚀 Starting automatic backup system...');
    this.isRunning = true;

    // Crear primer backup inmediatamente
    this.createBackup();

    // Programar backups automáticos
    this.scheduleNextBackup();

    // Programar limpieza diaria
    this.scheduleCleanup();
  }

  // Detener el sistema de backup
  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Backup manager not running');
      return;
    }

    console.log('🛑 Stopping automatic backup system...');
    this.isRunning = false;

    if (this.backupTimer) {
      clearTimeout(this.backupTimer);
      this.backupTimer = null;
    }
  }

  // Programar próximo backup
  scheduleNextBackup() {
    if (!this.isRunning) return;

    this.backupTimer = setTimeout(async () => {
      try {
        await this.createBackup();
        this.scheduleNextBackup(); // Programar siguiente
      } catch (error) {
        console.error('❌ Error in scheduled backup:', error);
        // Reintentar en 5 minutos si falla
        setTimeout(() => this.scheduleNextBackup(), 5 * 60 * 1000);
      }
    }, this.backupInterval);
  }

  // Crear backup completo
  async createBackup() {
    if (this.isRunning && this.lastBackup && 
        Date.now() - this.lastBackup < this.backupInterval) {
      console.log('⏰ Skipping backup - too soon since last backup');
      return;
    }

    try {
      console.log('🔄 Creating automatic backup...');
      
      // Verificar que existe la base de datos
      await fs.access(this.dbPath);
      
      // Crear backup local
      const backupResult = await cloudBackupSystem.createBackup();
      
      if (backupResult.success) {
        this.lastBackup = Date.now();
        console.log('✅ Automatic backup completed successfully');
        
        // Notificar éxito
        await this.notifyBackupSuccess(backupResult);
      } else {
        throw new Error(backupResult.error);
      }
      
    } catch (error) {
      console.error('❌ Error in automatic backup:', error);
      await this.notifyBackupFailure(error);
      
      // Reintentar en 15 minutos
      if (this.isRunning) {
        setTimeout(() => this.createBackup(), 15 * 60 * 1000);
      }
    }
  }

  // Crear backup manual
  async createManualBackup() {
    try {
      console.log('🔄 Creating manual backup...');
      
      const backupResult = await cloudBackupSystem.createBackup();
      
      if (backupResult.success) {
        this.lastBackup = Date.now();
        console.log('✅ Manual backup completed successfully');
        return backupResult;
      } else {
        throw new Error(backupResult.error);
      }
      
    } catch (error) {
      console.error('❌ Error in manual backup:', error);
      throw error;
    }
  }

  // Programar limpieza diaria
  scheduleCleanup() {
    // Ejecutar limpieza cada día a las 2:00 AM
    const now = new Date();
    const nextCleanup = new Date(now);
    nextCleanup.setDate(nextCleanup.getDate() + 1);
    nextCleanup.setHours(2, 0, 0, 0);
    
    const timeUntilCleanup = nextCleanup.getTime() - now.getTime();
    
    setTimeout(async () => {
      await this.cleanupOldBackups();
      this.scheduleCleanup(); // Programar siguiente limpieza
    }, timeUntilCleanup);
  }

  // Limpiar backups antiguos
  async cleanupOldBackups() {
    try {
      console.log('🧹 Starting backup cleanup...');
      
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('backup-') && file.endsWith('.sqlite.gz')
      );
      
      if (backupFiles.length <= this.maxBackups) {
        console.log('✅ No cleanup needed');
        return;
      }
      
      // Ordenar por fecha (más antiguos primero)
      backupFiles.sort();
      
      // Eliminar archivos antiguos
      const filesToDelete = backupFiles.slice(0, backupFiles.length - this.maxBackups);
      
      for (const file of filesToDelete) {
        const filePath = path.join(this.backupDir, file);
        await fs.unlink(filePath);
        console.log(`🗑️ Old backup deleted: ${file}`);
      }
      
      console.log(`🧹 Cleanup completed: ${filesToDelete.length} files deleted`);
      
    } catch (error) {
      console.error('❌ Error in backup cleanup:', error);
    }
  }

  // Verificar integridad de backups
  async verifyBackups() {
    try {
      console.log('🔍 Verifying backup integrity...');
      
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('backup-') && file.endsWith('.sqlite.gz')
      );
      
      let validBackups = 0;
      let corruptedBackups = 0;
      
      for (const file of backupFiles) {
        try {
          const filePath = path.join(this.backupDir, file);
          const isValid = await cloudBackupSystem.verifyBackupIntegrity(filePath);
          
          if (isValid) {
            validBackups++;
          } else {
            corruptedBackups++;
            console.warn(`⚠️ Corrupted backup detected: ${file}`);
          }
        } catch (error) {
          corruptedBackups++;
          console.error(`❌ Error verifying backup ${file}:`, error);
        }
      }
      
      console.log(`✅ Backup verification completed: ${validBackups} valid, ${corruptedBackups} corrupted`);
      
      // Si hay backups corruptos, crear uno nuevo
      if (corruptedBackups > 0) {
        console.log('🔄 Creating new backup due to corruption...');
        await this.createBackup();
      }
      
      return { validBackups, corruptedBackups };
      
    } catch (error) {
      console.error('❌ Error verifying backups:', error);
      throw error;
    }
  }

  // Obtener estadísticas de backup
  async getBackupStats() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('backup-') && file.endsWith('.sqlite.gz')
      );
      
      let totalSize = 0;
      const backupDetails = [];
      
      for (const file of backupFiles) {
        try {
          const filePath = path.join(this.backupDir, file);
          const stats = await fs.stat(filePath);
          totalSize += stats.size;
          
          backupDetails.push({
            filename: file,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          });
        } catch (error) {
          console.warn(`⚠️ Error getting stats for ${file}:`, error);
        }
      }
      
      return {
        totalBackups: backupFiles.length,
        totalSize: totalSize,
        lastBackup: this.lastBackup,
        isRunning: this.isRunning,
        backupDetails: backupDetails.sort((a, b) => b.modified - a.modified)
      };
      
    } catch (error) {
      console.error('❌ Error getting backup stats:', error);
      throw error;
    }
  }

  // Restaurar desde backup
  async restoreFromBackup(backupFilename) {
    try {
      console.log(`🔄 Restoring from backup: ${backupFilename}`);
      
      const backupPath = path.join(this.backupDir, backupFilename);
      
      // Verificar que el backup existe
      await fs.access(backupPath);
      
      // Crear backup del estado actual antes de restaurar
      await this.createManualBackup();
      
      // Restaurar desde el backup
      await cloudBackupSystem.restoreBackup(backupPath);
      
      console.log('✅ Backup restored successfully');
      
    } catch (error) {
      console.error('❌ Error restoring from backup:', error);
      throw error;
    }
  }

  // Notificar éxito del backup
  async notifyBackupSuccess(backupResult) {
    try {
      // Aquí puedes implementar notificaciones por email, Slack, etc.
      console.log('📧 Backup success notification sent');
      
      // Ejemplo: enviar a sistema de monitoreo
      if (process.env.MONITORING_WEBHOOK) {
        const payload = {
          event: 'backup_success',
          timestamp: new Date().toISOString(),
          filename: backupResult.filename,
          size: backupResult.size
        };
        
        // Enviar webhook
        // await fetch(process.env.MONITORING_WEBHOOK, { method: 'POST', body: JSON.stringify(payload) });
      }
      
    } catch (error) {
      console.warn('⚠️ Error sending backup success notification:', error);
    }
  }

  // Notificar fallo del backup
  async notifyBackupFailure(error) {
    try {
      // Aquí puedes implementar notificaciones de error
      console.log('📧 Backup failure notification sent');
      
      // Ejemplo: enviar alerta crítica
      if (process.env.ALERT_WEBHOOK) {
        const payload = {
          event: 'backup_failure',
          timestamp: new Date().toISOString(),
          error: error.message,
          stack: error.stack
        };
        
        // Enviar webhook de alerta
        // await fetch(process.env.ALERT_WEBHOOK, { method: 'POST', body: JSON.stringify(payload) });
      }
      
    } catch (notifyError) {
      console.warn('⚠️ Error sending backup failure notification:', notifyError);
    }
  }

  // Obtener estado del sistema
  getStatus() {
    return {
      isRunning: this.isRunning,
      lastBackup: this.lastBackup,
      nextBackup: this.lastBackup ? this.lastBackup + this.backupInterval : null,
      backupInterval: this.backupInterval,
      maxBackups: this.maxBackups
    };
  }
}

// Instancia singleton del backup manager
const backupManager = new BackupManager();

module.exports = backupManager;
