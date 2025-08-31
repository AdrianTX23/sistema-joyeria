const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function backupToGoogleDrive() {
  try {
    console.log('🔄 Iniciando backup automático...');
    
    const dbPath = path.join(__dirname, '..', 'database', 'jewelry_inventory.db');
    const backupDir = path.join(__dirname, '..', 'backups');
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const backupPath = path.join(backupDir, `backup-${timestamp}.db`);
    
    // Crear directorio de backups si no existe
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Copiar base de datos
    await execAsync(`cp "${dbPath}" "${backupPath}"`);
    console.log(`✅ Backup creado: ${backupPath}`);
    
    // Comprimir backup
    const compressedPath = `${backupPath}.gz`;
    await execAsync(`gzip -f "${backupPath}"`);
    console.log(`✅ Backup comprimido: ${compressedPath}`);
    
    // Subir a Google Drive (requiere rclone configurado)
    try {
      await execAsync(`rclone copy "${compressedPath}" gdrive:joyeria-backups/`);
      console.log('✅ Backup subido a Google Drive');
      
      // Limpiar archivo local después de subir
      fs.unlinkSync(compressedPath);
      console.log('✅ Archivo local limpiado');
      
    } catch (error) {
      console.log('⚠️ No se pudo subir a Google Drive (rclone no configurado)');
      console.log('💡 Para configurar: rclone config');
    }
    
  } catch (error) {
    console.error('❌ Error en backup automático:', error);
  }
}

// Ejecutar backup cada 30 minutos
setInterval(backupToGoogleDrive, 30 * 60 * 1000);

// Ejecutar backup inicial
backupToGoogleDrive();

module.exports = { backupToGoogleDrive };
