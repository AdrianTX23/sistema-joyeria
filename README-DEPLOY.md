# 🚀 Guía de Deploy - Sistema de Joyería en Vercel

## 🌐 **Paso a Paso para Subir a Vercel**

### **1. Crear Cuenta en GitHub**

1. Ve a [github.com](https://github.com)
2. Crea una cuenta gratuita
3. Crea un nuevo repositorio llamado `sistema-joyeria`

### **2. Subir Código a GitHub**

```bash
# En tu terminal (ya ejecutado):
git remote add origin https://github.com/TU-USUARIO/sistema-joyeria.git
git branch -M main
git push -u origin main
```

### **3. Crear Cuenta en Vercel**

1. Ve a [vercel.com](https://vercel.com)
2. Haz clic en "Sign Up"
3. Selecciona "Continue with GitHub"
4. Autoriza a Vercel

### **4. Importar Proyecto en Vercel**

1. En el dashboard de Vercel, haz clic en "New Project"
2. Selecciona tu repositorio `sistema-joyeria`
3. Vercel detectará automáticamente la configuración

### **5. Configurar Variables de Entorno**

En Vercel, ve a tu proyecto → Settings → Environment Variables:

```
NODE_ENV=production
JWT_SECRET=tu-super-secreto-muy-largo-y-complejo-cambiar-en-produccion
FRONTEND_URL=https://tu-app.vercel.app
CORS_ORIGIN=https://tu-app.vercel.app
```

### **6. Deploy Automático**

1. Haz clic en "Deploy"
2. Vercel construirá automáticamente tu proyecto
3. ¡Listo! Tu app estará en línea

---

## 🔧 **Configuración Específica**

### **Archivos Importantes:**

#### **vercel.json** (Ya creado)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "server/index.js",
      "use": "@vercel/node"
    },
    {
      "src": "client/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "server/index.js"
    },
    {
      "src": "/(.*)",
      "dest": "client/build/$1"
    }
  ]
}
```

#### **.gitignore** (Ya creado)
```
node_modules/
.env
server/database/*.db
server/backups/
```

---

## 🌍 **URLs de tu Aplicación**

### **Después del Deploy:**
- **Frontend:** `https://tu-app.vercel.app`
- **API:** `https://tu-app.vercel.app/api`
- **Admin:** `https://tu-app.vercel.app` (login)

### **Credenciales de Acceso:**
- **Usuario:** `admin`
- **Contraseña:** `admin123`

---

## 🔒 **Seguridad en Producción**

### **Cambiar Credenciales:**
1. Accede a tu aplicación
2. Ve a "Usuarios"
3. Edita el usuario admin
4. Cambia la contraseña

### **Variables de Entorno Importantes:**
- `JWT_SECRET`: Cambia por un secreto largo y complejo
- `NODE_ENV`: Debe ser `production`

---

## 📊 **Monitoreo**

### **Vercel Dashboard:**
- **Analytics:** Visitas y rendimiento
- **Functions:** Logs de la API
- **Deployments:** Historial de deploys

### **Logs en Tiempo Real:**
```bash
# En Vercel Dashboard → Functions → View Function Logs
```

---

## 🔄 **Actualizaciones**

### **Deploy Automático:**
- Cada vez que hagas `git push` a GitHub
- Vercel detectará cambios automáticamente
- Deployará la nueva versión

### **Deploy Manual:**
1. Ve a Vercel Dashboard
2. Selecciona tu proyecto
3. Haz clic en "Redeploy"

---

## 🛠️ **Solución de Problemas**

### **Error: Build Failed**
```bash
# Verificar logs en Vercel Dashboard
# Problemas comunes:
# - Dependencias faltantes
# - Variables de entorno no configuradas
```

### **Error: API No Responde**
```bash
# Verificar:
# 1. Variables de entorno configuradas
# 2. Rutas en vercel.json correctas
# 3. Base de datos inicializada
```

### **Error: Base de Datos**
```bash
# SQLite funciona en Vercel
# Los datos se mantienen entre deploys
# Para persistencia a largo plazo, considerar PostgreSQL
```

---

## 📱 **Dominio Personalizado (Opcional)**

### **Configurar Dominio:**
1. Ve a Vercel Dashboard → Settings → Domains
2. Agrega tu dominio personalizado
3. Configura DNS según instrucciones

### **Subdominio Gratuito:**
- `https://tu-app.vercel.app` (automático)
- `https://sistema-joyeria.vercel.app` (personalizable)

---

## 🎯 **Ventajas de Vercel**

### **✅ Gratis para Siempre:**
- **Hobby Plan:** 100GB bandwidth/mes
- **Funciones serverless:** 100GB-hours/mes
- **Deploy automático:** Ilimitado

### **✅ Características:**
- **SSL/HTTPS:** Automático
- **CDN global:** Muy rápido
- **Preview deployments:** Para testing
- **Analytics:** Básicos incluidos

### **✅ Escalabilidad:**
- **Auto-scaling:** Automático
- **Edge functions:** Muy rápidas
- **Serverless:** Sin servidor que mantener

---

## 🚀 **¡Tu Sistema Está Listo!**

### **Después del Deploy:**
1. ✅ **Accede** a tu aplicación
2. ✅ **Cambia** las credenciales admin
3. ✅ **Agrega** tus primeros productos
4. ✅ **Registra** tus primeras ventas
5. ✅ **Genera** reportes

### **URL Final:**
```
https://tu-app.vercel.app
```

### **Soporte:**
- 📧 **Email:** soporte@tuempresa.com
- 📱 **WhatsApp:** +1234567890
- 🌐 **Documentación:** README.md

---

## 🎉 **¡Felicidades!**

Tu sistema de joyería está ahora:
- 🌐 **En línea** y accesible desde cualquier lugar
- 🔒 **Seguro** con HTTPS
- 📱 **Responsive** para todos los dispositivos
- 🔄 **Automático** con deploys automáticos
- 📊 **Monitoreado** con analytics

**¡Tu negocio está listo para crecer! 💎**
