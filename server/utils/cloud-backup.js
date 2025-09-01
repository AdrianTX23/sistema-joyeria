const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class CloudBackupSystem {
  constructor() {
    this.backupDir = path.join(__dirname, '../backups');
    this.dbPath = path.join(__dirname, '../database/jewelry_inventory.db');
    this.maxLocalBackups = 10;
    this.cloudBackupEnabled = process.env.CLOUD_BACKUP_ENABLED === 'true';
    this.backupInterval = process.env.BACKUP_INTERVAL || 24; // horas
  }

  // Crear backup completo con verificación
  async createBackup() {
    try {
      console.log('🔄 Iniciando backup completo...');
      
      // Verificar que existe la base de datos
      await fs.access(this.dbPath);
      
      // Crear backup local
      const localBackup = await this.createLocalBackup();
      
      // Crear backup en la nube si está habilitado
      if (this.cloudBackupEnabled) {
        await this.createCloudBackup(localBackup.path);
      }
      
      // Limpiar backups locales antiguos
      await this.cleanOldLocalBackups();
      
      console.log('✅ Backup completo finalizado');
      return localBackup;
      
    } catch (error) {
      console.error('❌ Error en backup completo:', error);
      throw error;
    }
  }

  // Crear backup local
  async createLocalBackup() {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupName = `backup-${timestamp}.sqlite`;
      const backupPath = path.join(this.backupDir, backupName);
      
      console.log(`📁 Creando backup local: ${backupName}`);
      
      // Copiar archivo de base de datos
      await fs.copyFile(this.dbPath, backupPath);
      
      // Verificar integridad del backup
      const isBackupValid = await this.verifyBackupIntegrity(backupPath);
      
      if (!isBackupValid) {
        await fs.unlink(backupPath);
        throw new Error('Backup integrity check failed');
      }
      
      // Comprimir backup
      const compressedPath = await this.compressBackup(backupPath);
      
      // Eliminar archivo sin comprimir
      await fs.unlink(backupPath);
      
      // Generar checksum
      const checksum = await this.generateChecksum(compressedPath);
      
      // Guardar metadata del backup
      const metadata = {
        filename: path.basename(compressedPath),
        path: compressedPath,
        size: (await fs.stat(compressedPath)).size,
        checksum: checksum,
        timestamp: timestamp,
        type: 'local'
      };
      
      await this.saveBackupMetadata(metadata);
      
      console.log(`✅ Backup local creado: ${path.basename(compressedPath)}`);
      return metadata;
      
    } catch (error) {
      console.error('❌ Error creando backup local:', error);
      throw error;
    }
  }

  // Crear backup en la nube
  async createCloudBackup(localBackupPath) {
    try {
      console.log('☁️ Iniciando backup en la nube...');
      
      // Aquí puedes integrar con servicios como:
      // - Google Drive API
      // - Dropbox API
      // - AWS S3
      // - Azure Blob Storage
      
      // Por ahora, simulamos el proceso
      console.log('⚠️ Cloud backup not implemented yet');
      
      // En producción, implementar aquí la lógica de subida a la nube
      
    } catch (error) {
      console.error('❌ Error en backup en la nube:', error);
      // No fallar el backup local por errores en la nube
    }
  }

  // Verificar integridad del backup
  async verifyBackupIntegrity(backupPath) {
    try {
      // Verificar que el archivo existe y tiene tamaño
      const stats = await fs.stat(backupPath);
      if (stats.size === 0) {
        return false;
      }
      
      // Verificar que es un archivo SQLite válido
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      
      try {
        // Intentar abrir la base de datos con sqlite3
        await execAsync(`sqlite3 "${backupPath}" "SELECT 1;"`);
        return true;
      } catch (error) {
        console.warn('⚠️ Backup integrity check failed:', error.message);
        return false;
      }
      
    } catch (error) {
      console.error('❌ Error verificando integridad:', error);
      return false;
    }
  }

  // Comprimir backup
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

  // Generar checksum del archivo
  async generateChecksum(filePath) {
    try {
      const { stdout } = await execAsync(`sha256sum "${filePath}"`);
      return stdout.split(' ')[0];
    } catch (error) {
      console.warn('⚠️ No se pudo generar checksum:', error.message);
      return null;
    }
  }

  // Guardar metadata del backup
  async saveBackupMetadata(metadata) {
    try {
      const metadataPath = path.join(this.backupDir, 'backups-metadata.json');
      
      let existingMetadata = [];
      try {
        const existingData = await fs.readFile(metadataPath, 'utf8');
        existingMetadata = JSON.parse(existingData);
      } catch (error) {
        // Archivo no existe, crear nuevo
      }
      
      existingMetadata.push(metadata);
      
      // Mantener solo los últimos 100 backups en metadata
      if (existingMetadata.length > 100) {
        existingMetadata = existingMetadata.slice(-100);
      }
      
      await fs.writeFile(metadataPath, JSON.stringify(existingMetadata, null, 2));
      
    } catch (error) {
      console.warn('⚠️ No se pudo guardar metadata del backup:', error.message);
    }
  }

  // Limpiar backups locales antiguos
  async cleanOldLocalBackups() {
    try {
      const files = await fs.readdir(this.backupDir);
      const backupFiles = files.filter(file => 
        file.startsWith('backup-') && file.endsWith('.sqlite.gz')
      );
      
      if (backupFiles.length <= this.maxLocalBackups) {
        return;
      }
      
      // Ordenar por fecha (más antiguos primero)
      backupFiles.sort();
      
      // Eliminar archivos antiguos
      const filesToDelete = backupFiles.slice(0, backupFiles.length - this.maxLocalBackups);
      
      for (const file of filesToDelete) {
        const filePath = path.join(this.backupDir, file);
        await fs.unlink(filePath);
        console.log(`🗑️ Backup local eliminado: ${file}`);
      }
      
      console.log(`🧹 Limpieza local completada: ${filesToDelete.length} archivos eliminados`);
      
    } catch (error) {
      console.warn(`⚠️ Error en limpieza local: ${error.message}`);
    }
  }

  // Restaurar backup
  async restoreBackup(backupPath) {
    try {
      console.log(`🔄 Restaurando backup: ${path.basename(backupPath)}`);
      
      // Verificar que el backup existe
      await fs.access(backupPath);
      
      // Crear backup del estado actual antes de restaurar
      await this.createLocalBackup();
      
      // Descomprimir si es necesario
      let sourcePath = backupPath;
      if (backupPath.endsWith('.gz')) {
        sourcePath = backupPath.replace('.gz', '');
        await execAsync(`gunzip -f "${backupPath}"`);
      }
      
      // Restaurar base de datos
      await fs.copyFile(sourcePath, this.dbPath);
      
      // Verificar integridad de la base restaurada
      const isRestoredValid = await this.verifyBackupIntegrity(this.dbPath);
      
      if (!isRestoredValid) {
        throw new Error('Restored database integrity check failed');
      }
      
      console.log('✅ Backup restaurado exitosamente');
      
      // Limpiar archivo temporal
      if (sourcePath !== backupPath) {
        await fs.unlink(sourcePath);
      }
      
    } catch (error) {
      console.error('❌ Error restaurando backup:', error);
      throw error;
    }
  }

  // Obtener lista de backups disponibles
  async getAvailableBackups() {
    try {
      const metadataPath = path.join(this.backupDir, 'backups-metadata.json');
      
      try {
        const data = await fs.readFile(metadataPath, 'utf8');
        return JSON.parse(data);
      } catch (error) {
        return [];
      }
      
    } catch (error) {
      console.error('❌ Error obteniendo backups disponibles:', error);
      return [];
    }
  }

  // Programar backups automáticos
  scheduleAutomaticBackups() {
    if (this.backupInterval <= 0) {
      console.log('⏰ Backups automáticos deshabilitados');
      return;
    }
    
    const intervalMs = this.backupInterval * 60 * 60 * 1000; // convertir a milisegundos
    
    console.log(`⏰ Programando backups automáticos cada ${this.backupInterval} horas`);
    
    setInterval(async () => {
      try {
        await this.createBackup();
      } catch (error) {
        console.error('❌ Error en backup automático:', error);
      }
    }, intervalMs);
  }
}

// Instancia singleton del sistema de backup en la nube
const cloudBackupSystem = new CloudBackupSystem();

module.exports = cloudBackupSystem;
