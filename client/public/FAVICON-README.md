# 🎨 Favicon de Joyería Elegante

## Descripción
Este favicon representa un anillo de joyería con una piedra preciosa central, diseñado específicamente para el sistema de inventario de joyería.

## Archivos de Favicon

### favicon.svg
- **Formato**: SVG (Vector)
- **Tamaño**: Escalable
- **Ventajas**: 
  - Se ve nítido en cualquier resolución
  - Tamaño de archivo pequeño
  - Compatible con navegadores modernos

### favicon-32x32.png
- **Formato**: PNG
- **Tamaño**: 32x32 píxeles
- **Uso**: Favicon estándar para navegadores

### favicon.ico
- **Formato**: ICO
- **Uso**: Compatibilidad con navegadores antiguos

## Diseño del Logo

### Elementos del Diseño:
1. **Fondo Circular**: Gris claro (#F3F4F6)
2. **Anillo**: Gris medio (#E5E7EB)
3. **Piedra Preciosa**: Púrpura (#8B5CF6)
4. **Diamantes Decorativos**: Dorado (#F59E0B)
5. **Brillo**: Blanco con transparencia

### Colores Utilizados:
- **Púrpura Principal**: #8B5CF6 (Piedra central)
- **Dorado**: #F59E0B (Diamantes decorativos)
- **Gris Claro**: #F3F4F6 (Fondo)
- **Gris Medio**: #E5E7EB (Anillo)
- **Gris Oscuro**: #6B7280 (Detalles)

## Generación de Favicons

### Método 1: Usando el Generador HTML
1. Abre `favicon-generator.html` en el navegador
2. Haz clic en "Generar Todos los Favicons"
3. Descarga los archivos PNG generados

### Método 2: Usando el Script Node.js
```bash
# Instalar dependencias (opcional)
npm install sharp canvas

# Ejecutar el generador
node generate-favicons.js
```

### Método 3: Herramientas Online
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [Favicon Generator](https://www.favicon-generator.org/)

## Implementación en HTML

```html
<!-- Favicon SVG (recomendado) -->
<link rel="icon" href="/favicon.svg" type="image/svg+xml" />

<!-- Favicon PNG -->
<link rel="icon" href="/favicon-32x32.png" sizes="32x32" />

<!-- Favicon ICO (compatibilidad) -->
<link rel="icon" href="/favicon.ico" />
```

## Características del Diseño

### Minimalista y Elegante
- Diseño limpio y profesional
- Colores suaves y elegantes
- Forma circular que se adapta bien a favicons

### Escalable
- El SVG se ve perfecto en cualquier tamaño
- Mantiene la calidad en dispositivos de alta resolución

### Temático
- Representa claramente el negocio de joyería
- Piedra preciosa central como elemento principal
- Diamantes decorativos que refuerzan la temática

## Personalización

Para personalizar el favicon:

1. **Cambiar Colores**: Modifica los valores hexadecimales en el SVG
2. **Cambiar Forma**: Ajusta los paths del SVG
3. **Agregar Elementos**: Incluye nuevos elementos SVG
4. **Cambiar Tamaño**: Modifica el viewBox del SVG

## Compatibilidad

- ✅ Chrome/Chromium
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Navegadores móviles
- ⚠️ Internet Explorer (limitado)

## Notas Técnicas

- El favicon SVG es la opción más moderna y eficiente
- Los navegadores antiguos usarán automáticamente el favicon.ico
- El archivo manifest.json incluye referencias a los favicons para PWA
