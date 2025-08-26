#!/bin/bash

echo "🚀 Iniciando Sistema de Inventario de Joyería..."
echo "================================================"

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js no está instalado"
    echo "Por favor instala Node.js desde https://nodejs.org/"
    exit 1
fi

# Verificar si npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm no está instalado"
    exit 1
fi

echo "✅ Node.js y npm encontrados"

# Verificar si las dependencias están instaladas
if [ ! -d "node_modules" ] || [ ! -d "server/node_modules" ] || [ ! -d "client/node_modules" ]; then
    echo "📦 Instalando dependencias..."
    npm run install-all
fi

# Crear directorio de uploads si no existe
if [ ! -d "server/uploads" ]; then
    echo "📁 Creando directorio de uploads..."
    mkdir -p server/uploads
fi

# Verificar si los puertos están libres
echo "🔍 Verificando puertos..."

# Verificar puerto 5001 (backend)
if lsof -Pi :5001 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 5001 está en uso. Deteniendo proceso..."
    pkill -f "node.*server" || true
    sleep 2
fi

# Verificar puerto 3000 (frontend)
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Puerto 3000 está en uso. Deteniendo proceso..."
    pkill -f "react-scripts" || true
    sleep 2
fi

echo "✅ Puertos libres"

# Iniciar el sistema
echo "🚀 Iniciando el sistema..."
echo ""
echo "📊 Backend: http://localhost:5001"
echo "🌐 Frontend: http://localhost:3000"
echo ""
echo "🔐 Credenciales de acceso:"
echo "   Usuario: admin"
echo "   Contraseña: admin123"
echo ""
echo "⏳ Iniciando servicios..."

# Iniciar el sistema en segundo plano
npm run dev &

# Esperar un momento para que los servicios se inicien
echo "⏳ Esperando que los servicios se inicien..."
sleep 10

# Verificar que los servicios estén funcionando
echo "🔍 Verificando servicios..."

# Verificar backend
if curl -s http://localhost:5001/api/health > /dev/null; then
    echo "✅ Backend funcionando correctamente"
else
    echo "❌ Error: Backend no responde"
    exit 1
fi

# Verificar frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend funcionando correctamente"
else
    echo "❌ Error: Frontend no responde"
    exit 1
fi

echo ""
echo "🎉 ¡Sistema iniciado exitosamente!"
echo "================================================"
echo "🌐 Abre tu navegador y ve a: http://localhost:3000"
echo ""
echo "📋 Funcionalidades disponibles:"
echo "   • Dashboard con estadísticas"
echo "   • Gestión de productos"
echo "   • Sistema de ventas"
echo "   • Reportes y gráficas"
echo "   • Gestión de usuarios"
echo ""
echo "🛑 Para detener el sistema, presiona Ctrl+C"
echo ""

# Mantener el script ejecutándose
wait
