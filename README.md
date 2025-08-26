# Sistema de Inventario y Ventas para Joyería

Un sistema web completo y responsive para la gestión de inventario y ventas de joyería, con un diseño minimalista inspirado en Apple.

## 🚀 Características

### Funcionalidades Principales
- **Gestión de Productos**: CRUD completo con imágenes, categorías y control de stock
- **Sistema de Ventas**: Registro de ventas con actualización automática de inventario
- **Control de Inventario**: Seguimiento de stock con alertas de stock bajo
- **Reportes Avanzados**: Gráficas y estadísticas diarias, semanales, mensuales y trimestrales
- **Gestión de Usuarios**: Roles de administrador y vendedor con permisos diferenciados
- **Interfaz Responsive**: Diseño adaptativo para desktop, tablet y móvil

### Características Técnicas
- **Frontend**: React 18 + TailwindCSS
- **Backend**: Node.js + Express
- **Base de Datos**: SQLite
- **Autenticación**: JWT con bcrypt
- **Gráficas**: Recharts para visualización de datos
- **Diseño**: Minimalista tipo Apple con colores claros y tipografía elegante

## 📋 Requisitos Previos

- Node.js (versión 16 o superior)
- npm o yarn

## 🛠️ Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd jewelry-inventory-system
   ```

2. **Instalar dependencias**
   ```bash
   npm run install-all
   ```

3. **Crear directorio de uploads**
   ```bash
   mkdir server/uploads
   ```

4. **Iniciar el servidor de desarrollo**
   ```bash
   npm run dev
   ```

El sistema estará disponible en:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

## 🔐 Credenciales por Defecto

Al instalar el sistema, se crea automáticamente un usuario administrador:

- **Usuario**: `admin`
- **Contraseña**: `admin123`
- **Email**: `admin@joyeria.com`

**⚠️ Importante**: Cambia la contraseña del administrador después del primer inicio de sesión.

## 📱 Uso del Sistema

### Dashboard
- Vista general del negocio con estadísticas en tiempo real
- Gráficas de ventas y productos más vendidos
- Alertas de stock bajo
- Acciones rápidas para crear ventas y productos

### Gestión de Productos
- **Agregar Productos**: Formulario completo con imagen, categoría, precio y stock
- **Editar Productos**: Modificar información existente
- **Control de Stock**: Ajustes manuales con historial de movimientos
- **Filtros**: Búsqueda por nombre, SKU, categoría y stock bajo

### Ventas
- **Nueva Venta**: Selección de productos con cálculo automático
- **Historial**: Lista de todas las ventas con filtros por fecha
- **Detalles**: Vista completa de cada venta con productos y cliente

### Reportes
- **Ventas**: Gráficas de tendencias y estadísticas por período
- **Inventario**: Valor total, productos en stock y alertas
- **Productos**: Rendimiento y análisis de ventas por producto
- **Categorías**: Distribución de ventas por categoría

### Usuarios (Solo Administradores)
- **Crear Usuarios**: Nuevos vendedores y administradores
- **Gestionar Roles**: Asignar permisos de administrador o vendedor
- **Restablecer Contraseñas**: Función de seguridad para administradores

## 🗄️ Estructura de la Base de Datos

### Tablas Principales
- **users**: Usuarios del sistema con roles
- **categories**: Categorías de productos
- **products**: Productos con información completa
- **sales**: Registro de ventas
- **sale_items**: Items individuales de cada venta
- **stock_movements**: Historial de movimientos de stock

## 🔧 Configuración

### Variables de Entorno
Crea un archivo `.env` en la carpeta `server/`:

```env
NODE_ENV=development
PORT=5000
JWT_SECRET=tu-clave-secreta-muy-segura
```

### Personalización
- **Colores**: Modifica `client/tailwind.config.js` para cambiar la paleta de colores
- **Categorías**: Las categorías por defecto se pueden modificar en `server/database/init.js`
- **Configuración de Base de Datos**: Ajusta la configuración en `server/database/init.js`

## 📊 Reportes Disponibles

### Ventas
- Ventas totales por período
- Ingresos y promedios
- Gráficas de tendencias
- Productos más vendidos

### Inventario
- Valor total del inventario
- Productos con stock bajo
- Distribución por categorías
- Historial de movimientos

### Productos
- Rendimiento por producto
- Análisis de ventas
- Rotación de inventario
- Margen de ganancia

## 🔒 Seguridad

- **Autenticación JWT**: Tokens seguros con expiración
- **Encriptación**: Contraseñas hasheadas con bcrypt
- **Validación**: Validación de datos en frontend y backend
- **Permisos**: Control de acceso basado en roles
- **Rate Limiting**: Protección contra ataques de fuerza bruta

## 🚀 Despliegue en Producción

### Preparación
1. Configurar variables de entorno para producción
2. Cambiar JWT_SECRET por una clave segura
3. Configurar CORS para el dominio de producción
4. Optimizar la base de datos

### Comandos de Despliegue
```bash
# Construir el frontend
npm run build

# Iniciar en producción
npm start
```

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de conexión a la base de datos**
   - Verificar que el directorio `server/database/` tenga permisos de escritura
   - Reiniciar el servidor

2. **Error de CORS**
   - Verificar la configuración en `server/index.js`
   - Asegurar que el frontend esté corriendo en el puerto correcto

3. **Error de autenticación**
   - Verificar que el token JWT sea válido
   - Limpiar el localStorage del navegador

4. **Imágenes no se cargan**
   - Verificar que el directorio `server/uploads/` exista
   - Comprobar permisos de escritura

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en el repositorio
- Contactar al equipo de desarrollo

---

**Desarrollado con ❤️ para joyerías elegantes**
