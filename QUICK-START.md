# 🚀 Inicio Rápido - Sistema de Inventario de Joyería

## ⚡ Inicio Automático (Recomendado)

```bash
# Ejecutar el script de inicio automático
./start-system.sh
```

Este script automáticamente:
- ✅ Verifica que Node.js esté instalado
- ✅ Instala todas las dependencias
- ✅ Crea directorios necesarios
- ✅ Libera puertos ocupados
- ✅ Inicia backend y frontend
- ✅ Verifica que todo funcione correctamente

## 🔧 Inicio Manual

### 1. Instalar Dependencias
```bash
npm run install-all
```

### 2. Crear Directorio de Uploads
```bash
mkdir -p server/uploads
```

### 3. Iniciar el Sistema
```bash
npm run dev
```

## 🌐 Acceso al Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001

## 🔐 Credenciales de Acceso

- **Usuario**: `admin`
- **Contraseña**: `admin123`

## 📋 Funcionalidades Principales

### 🏠 Dashboard
- Estadísticas en tiempo real
- Gráficas de ventas
- Productos con stock bajo
- Resumen del negocio

### 📦 Gestión de Productos
- ✅ Agregar productos con imágenes
- ✅ Editar información
- ✅ Ajustar stock
- ✅ Categorías
- ✅ Búsqueda y filtros

### 🛒 Sistema de Ventas
- ✅ Crear nuevas ventas
- ✅ Selección de productos
- ✅ Cálculo automático
- ✅ Información del cliente
- ✅ Métodos de pago

### 📊 Reportes
- ✅ Ventas por período
- ✅ Inventario
- ✅ Productos más vendidos
- ✅ Gráficas interactivas

### 👥 Gestión de Usuarios
- ✅ Crear usuarios
- ✅ Editar perfiles
- ✅ Roles (Administrador/Vendedor)
- ✅ Restablecer contraseñas

## 🛠️ Comandos Útiles

```bash
# Iniciar solo el backend
npm run server

# Iniciar solo el frontend
npm run client

# Construir para producción
npm run build

# Instalar dependencias
npm run install-all
```

## 🔧 Solución de Problemas

### Puerto 5000 ocupado
El sistema usa automáticamente el puerto 5001 para evitar conflictos.

### Error de dependencias
```bash
# Limpiar e instalar de nuevo
rm -rf node_modules server/node_modules client/node_modules
npm run install-all
```

### Base de datos corrupta
```bash
# Eliminar y recrear
rm server/database.sqlite
npm run dev
```

## 📱 Características del Sistema

- 🎨 **Diseño Minimalista**: Estilo Apple con colores claros
- 📱 **Responsive**: Funciona en móviles y tablets
- ⚡ **Rápido**: Optimizado para rendimiento
- 🔒 **Seguro**: Autenticación JWT y validaciones
- 📊 **Reportes**: Gráficas y análisis completos
- 🛒 **Ventas**: Sistema completo de punto de venta
- 📦 **Inventario**: Control de stock automático

## 🎯 Próximos Pasos

1. **Inicia sesión** con las credenciales de administrador
2. **Explora el Dashboard** para ver las estadísticas
3. **Agrega productos** en la sección de Productos
4. **Crea una venta** en la sección de Ventas
5. **Revisa los reportes** para análisis del negocio

¡El sistema está listo para usar! 🎉
