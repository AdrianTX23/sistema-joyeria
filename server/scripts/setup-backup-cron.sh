#!/bin/bash

# Script para configurar backup automático
echo "🔧 Configurando Sistema de Backup Automático..."

# Obtener el directorio actual del proyecto
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
echo "📁 Directorio del proyecto: $PROJECT_DIR"

# Crear script de backup
BACKUP_SCRIPT="$PROJECT_DIR/backup-daily.sh"
cat > "$BACKUP_SCRIPT" << 'EOF'
#!/bin/bash

# Script de backup diario
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

# Crear backup usando Node.js
node -e "
const { createBackup } = require('./server/utils/backup.js');
createBackup().then(result => {
  if (result.success) {
    console.log('✅ Backup automático completado:', result.filename);
  } else {
    console.error('❌ Error en backup automático:', result.error);
  }
}).catch(error => {
  console.error('❌ Error ejecutando backup:', error);
});
"

# Log del backup
echo "$(date): Backup automático ejecutado" >> "$PROJECT_DIR/server/backups/backup.log"
EOF

# Hacer el script ejecutable
chmod +x "$BACKUP_SCRIPT"

# Crear entrada en crontab para backup diario a las 2:00 AM
CRON_JOB="0 2 * * * $BACKUP_SCRIPT"

# Verificar si ya existe la entrada en crontab
if crontab -l 2>/dev/null | grep -q "$BACKUP_SCRIPT"; then
    echo "⚠️  El backup automático ya está configurado"
else
    # Agregar la entrada al crontab
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Backup automático configurado para las 2:00 AM diariamente"
fi

# Crear directorio de backups si no existe
mkdir -p "$PROJECT_DIR/server/backups"

# Crear archivo de log
touch "$PROJECT_DIR/server/backups/backup.log"

# Configurar permisos
chmod 755 "$PROJECT_DIR/server/backups"
chmod 644 "$PROJECT_DIR/server/backups/backup.log"

echo "📋 Configuración completada:"
echo "   • Script de backup: $BACKUP_SCRIPT"
echo "   • Directorio de backups: $PROJECT_DIR/server/backups"
echo "   • Log de backups: $PROJECT_DIR/server/backups/backup.log"
echo "   • Cron job: $CRON_JOB"
echo ""
echo "🔍 Para verificar la configuración:"
echo "   crontab -l"
echo ""
echo "📊 Para ver logs de backup:"
echo "   tail -f $PROJECT_DIR/server/backups/backup.log"
echo ""
echo "🎉 ¡Sistema de backup automático configurado exitosamente!"
