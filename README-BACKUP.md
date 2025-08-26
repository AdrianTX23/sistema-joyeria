# 🛡️ Sistema de Backup Automático - Joyería Elegante

## 📋 Descripción

El Sistema de Backup Automático protege todos los datos de tu joyería con copias de seguridad automáticas, compresión inteligente y gestión de archivos optimizada.

## ✨ Características Principales

### 🔄 **Backup Automático**
- ✅ **Backup diario** a las 2:00 AM automáticamente
- ✅ **Compresión automática** para ahorrar espacio
- ✅ **Retención de 30 días** de backups
- ✅ **Notificaciones** de éxito/fallo
- ✅ **Verificación de integridad** de archivos

### 📊 **Gestión Inteligente**
- 📦 **Compresión GZIP** para optimizar almacenamiento
- 🧹 **Limpieza automática** de backups antiguos
- 📈 **Reportes detallados** de uso de espacio
- 🔍 **Verificación de integridad** de backups
- 📱 **Interfaz web** para gestión manual

### 🛡️ **Seguridad**
- 🔐 **Autenticación requerida** para todas las operaciones
- ⚠️ **Confirmación** antes de restaurar
- 📝 **Logs detallados** de todas las operaciones
- 🔄 **Backup de seguridad** antes de restaurar

## 🚀 Instalación y Configuración

### 1. **Configuración Automática**
```bash
# Ejecutar script de configuración
./server/scripts/setup-backup-cron.sh
```

### 2. **Configuración Manual (Alternativa)**
```bash
# Crear directorio de backups
mkdir -p server/backups

# Configurar cron job manualmente
crontab -e

# Agregar esta línea:
0 2 * * * /ruta/completa/al/proyecto/backup-daily.sh
```

## 📱 Uso del Sistema

### **Interfaz Web**
1. Accede a la sección **"Backup"** en el menú lateral
2. Visualiza estadísticas de backups
3. Crea backups manuales
4. Restaura backups cuando sea necesario
5. Verifica integridad de archivos

### **Comandos de Terminal**
```bash
# Crear backup manual
node -e "require('./server/utils/backup.js').createBackup()"

# Listar backups
node -e "require('./server/utils/backup.js').listBackups()"

# Verificar backup específico
node -e "require('./server/utils/backup.js').verifyBackup('backup-2025-01-15T02-00-00-000Z.sqlite')"
```

## 📊 API Endpoints

### **Crear Backup**
```http
POST /api/backup/create
Authorization: Bearer <token>
```

### **Listar Backups**
```http
GET /api/backup/list
Authorization: Bearer <token>
```

### **Verificar Backup**
```http
GET /api/backup/verify/:filename
Authorization: Bearer <token>
```

### **Restaurar Backup**
```http
POST /api/backup/restore/:filename
Authorization: Bearer <token>
```

### **Estadísticas**
```http
GET /api/backup/stats
Authorization: Bearer <token>
```

## 📁 Estructura de Archivos

```
server/
├── backups/                    # Directorio de backups
│   ├── backup-2025-01-15T02-00-00-000Z.sqlite.gz
│   ├── backup-2025-01-16T02-00-00-000Z.sqlite.gz
│   ├── backup-report.json      # Reporte de backups
│   └── backup.log             # Log de operaciones
├── utils/
│   └── backup.js              # Sistema de backup
├── routes/
│   └── backup.js              # API routes
└── scripts/
    └── setup-backup-cron.sh   # Script de configuración
```

## 🔧 Configuración Avanzada

### **Personalizar Configuración**
```javascript
// En server/utils/backup.js
class BackupSystem {
  constructor() {
    this.maxBackups = 30;        // Cambiar número de backups
    this.compressionEnabled = true; // Habilitar/deshabilitar compresión
  }
}
```

### **Cambiar Horario de Backup**
```bash
# Editar crontab
crontab -e

# Cambiar de 2:00 AM a 3:00 AM
0 3 * * * /ruta/al/backup-daily.sh
```

### **Backup en la Nube (Futuro)**
```javascript
// Integración con Google Drive, Dropbox, etc.
async uploadToCloud(backupPath) {
  // Implementar subida a la nube
}
```

## 📈 Monitoreo y Mantenimiento

### **Verificar Estado del Sistema**
```bash
# Ver logs de backup
tail -f server/backups/backup.log

# Verificar cron jobs
crontab -l

# Verificar espacio en disco
du -sh server/backups/
```

### **Limpieza Manual**
```bash
# Eliminar backups antiguos manualmente
find server/backups/ -name "backup-*.sqlite*" -mtime +30 -delete
```

## 🚨 Solución de Problemas

### **Error: "Backup vacío"**
- Verificar que la base de datos existe
- Comprobar permisos de escritura
- Revisar logs del sistema

### **Error: "No se pudo comprimir"**
- Verificar que gzip está instalado
- Comprobar espacio en disco
- Revisar permisos de archivos

### **Backup no se ejecuta automáticamente**
- Verificar configuración de cron
- Comprobar que el script es ejecutable
- Revisar logs del sistema

## 📞 Soporte

### **Comandos Útiles**
```bash
# Verificar configuración
crontab -l

# Ver logs en tiempo real
tail -f server/backups/backup.log

# Crear backup de prueba
node -e "require('./server/utils/backup.js').createBackup()"

# Verificar integridad de todos los backups
ls server/backups/backup-*.sqlite* | xargs -I {} node -e "require('./server/utils/backup.js').verifyBackup('{}')"
```

### **Contacto**
- 📧 Revisar logs del sistema
- 🔍 Verificar configuración de cron
- 📊 Monitorear uso de espacio

## 🎯 Beneficios

### **Para tu Negocio**
- 🛡️ **Protección total** de datos críticos
- ⚡ **Recuperación rápida** en caso de emergencia
- 💰 **Ahorro de costos** por pérdida de datos
- 🧠 **Tranquilidad mental** para ti y tu equipo

### **Técnicos**
- 🔄 **Automatización completa** sin intervención manual
- 📦 **Optimización de espacio** con compresión
- 📊 **Monitoreo detallado** de operaciones
- 🔐 **Seguridad robusta** con autenticación

---

**🎉 ¡Tu sistema de joyería ahora está completamente protegido con backups automáticos!**
