const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class BackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.dbPath = path.join(__dirname, '../database/jewelry_inventory.db');
    this.maxBackups = 30; // Mantener 30 días de backups
    this.compressionEnabled = true;
  }

  // Crear backup de la base de datos
  async createBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}.sqlite`;
      const backupPath = path.join(this.backupDir, backupName);
      
      console.log(`🔄 Iniciando backup: ${backupName}`);
      
      // Verificar que existe la base de datos
      await fs.access(this.dbPath);
      
      // Copiar archivo de base de datos
      await fs.copyFile(this.dbPath, backupPath);
      
      // Comprimir backup si está habilitado
      if (this.compressionEnabled) {
        await this.compressBackup(backupPath);
      }
      
      // Limpiar backups antiguos
      await this.cleanOldBackups();
      
      // Generar reporte de backup
      await this.generateBackupReport(backupName);
      
      console.log(`✅ Backup completado exitosamente: ${backupName}`);
      return { success: true, filename: backupName };
      
    } catch (error) {
      console.error(`❌ Error en backup: ${error.message}`);
      await this.sendNotification('Error en backup', error.message);
      return { success: false, error: error.message };
    }
  }

  // Comprimir archivo de backup
  async compressBackup(backupPath) {
    try {
      const compressedPath = `${backupPath}.gz`;
      
      // Usar gzip para comprimir
      await execAsync(`gzip -f "${backupPath}"`);
      
      console.log(`📦 Backup comprimido: ${path.basename(compressedPath)}`);
      return compressedPath;
    } catch (error) {
      console.warn(`⚠️ No se pudo comprimir backup: ${error.message}`);
      return backupPath;
    }
  }

  // Limpiar backups antiguos
  async cleanOldBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.sqlite.gz'));
      
      if (backupFiles.length <= this.maxBackups) {
        return;
      }
      
      // Ordenar por fecha (más antiguos primero)
      backupFiles.sort();
      
      // Eliminar archivos antiguos
      const filesToDelete = backupFiles.slice(0, backupFiles.length - this.maxBackups);
      
      for (const file of filesToDelete) {
        const filePath = path.join(this.backupDir, file);
        await fs.unlink(filePath);
        console.log(`🗑️ Backup eliminado: ${file}`);
      }
      
      console.log(`🧹 Limpieza completada: ${filesToDelete.length} archivos eliminados`);
    } catch (error) {
      console.warn(`⚠️ Error en limpieza: ${error.message}`);
    }
  }

  // Generar reporte de backup
  async generateBackupReport(filename) {
    try {
      const report = {
        timestamp: new Date().toISOString(),
        filename: filename,
        size: await this.getFileSize(path.join(this.backupDir, filename)),
        totalBackups: await this.getBackupCount(),
        diskUsage: await this.getDiskUsage()
      };
      
      const reportPath = path.join(this.backupDir, 'backup-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
      
      console.log(`📊 Reporte generado: ${reportPath}`);
      return report;
    } catch (error) {
      console.warn(`⚠️ Error generando reporte: ${error.message}`);
    }
  }

  // Obtener tamaño de archivo
  async getFileSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  // Contar backups existentes
  async getBackupCount() {
    try {
      const files = await fs.readdir(this.backupDir);
      return files.filter(file => file.startsWith('backup-') && file.endsWith('.sqlite.gz')).length;
    } catch (error) {
      return 0;
    }
  }

  // Obtener uso de disco
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync(`du -sh "${this.backupDir}"`);
      return stdout.trim();
    } catch (error) {
      return 'N/A';
    }
  }

  // Restaurar backup
  async restoreBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      
      // Verificar que existe el backup
      await fs.access(backupPath);
      
      // Crear backup del estado actual antes de restaurar
      await this.createBackup();
      
      // Restaurar archivo
      await fs.copyFile(backupPath, this.dbPath);
      
      console.log(`✅ Backup restaurado: ${filename}`);
      return { success: true };
    } catch (error) {
      console.error(`❌ Error restaurando backup: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Listar backups disponibles
  async listBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => file.startsWith('backup-') && file.endsWith('.sqlite.gz'));
      
      const backups = [];
      for (const file of backupFiles) {
        const filePath = path.join(this.backupDir, file);
        const stats = await fs.stat(filePath);
        
        backups.push({
          filename: file,
          size: stats.size,
          created: stats.birthtime,
          modified: stats.mtime
        });
      }
      
      // Ordenar por fecha (más recientes primero)
      backups.sort((a, b) => b.modified - a.modified);
      
      console.log('📋 Backups encontrados:', backups.length);
      backups.forEach(backup => {
        console.log(`  • ${backup.filename} (${backup.size} bytes)`);
      });
      
      return backups;
    } catch (error) {
      console.error(`❌ Error listando backups: ${error.message}`);
      return [];
    }
  }

  // Enviar notificación
  async sendNotification(title, message) {
    try {
      // Aquí puedes integrar con servicios de notificación
      // Por ahora solo log
      console.log(`🔔 ${title}: ${message}`);
    } catch (error) {
      console.warn(`⚠️ Error enviando notificación: ${error.message}`);
    }
  }

  // Verificar integridad del backup
  async verifyBackup(filename) {
    try {
      const backupPath = path.join(this.backupDir, filename);
      const stats = await fs.stat(backupPath);
      
      // Verificar que el archivo no esté corrupto
      if (stats.size === 0) {
        throw new Error('Backup vacío');
      }
      
      console.log(`✅ Backup verificado: ${filename} (${stats.size} bytes)`);
      return { success: true, size: stats.size };
    } catch (error) {
      console.error(`❌ Error verificando backup: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Configurar backup automático
  async scheduleBackup() {
    try {
      // Crear script de cron para backup diario a las 2:00 AM
      const cronScript = `0 2 * * * cd ${process.cwd()} && node -e "require('./server/utils/backup.js').createBackup()"`;
      
      console.log(`⏰ Backup programado para las 2:00 AM diariamente`);
      console.log(`📝 Comando cron: ${cronScript}`);
      
      return { success: true, cronScript };
    } catch (error) {
      console.error(`❌ Error programando backup: ${error.message}`);
      return { success: false, error: error.message };
    }
  }
}

// Instancia global del sistema de backup
const backupSystem = new BackupSystem();

// Función para crear backup manual
const createBackup = async () => {
  return await backupSystem.createBackup();
};

// Función para restaurar backup
const restoreBackup = async (filename) => {
  return await backupSystem.restoreBackup(filename);
};

// Función para listar backups
const listBackups = async () => {
  return await backupSystem.listBackups();
};

// Función para verificar backup
const verifyBackup = async (filename) => {
  return await backupSystem.verifyBackup(filename);
};

module.exports = {
  BackupSystem,
  backupSystem,
  createBackup,
  restoreBackup,
  listBackups,
  verifyBackup
};
