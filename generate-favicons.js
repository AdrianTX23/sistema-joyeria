const fs = require('fs');
const path = require('path');

// SVG del logo de joyería
const logoSVG = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Fondo circular -->
  <circle cx="16" cy="16" r="16" fill="#F3F4F6"/>
  
  <!-- Anillo de joyería -->
  <path d="M8 16C8 11.5817 11.5817 8 16 8C20.4183 8 24 11.5817 24 16C24 20.4183 20.4183 24 16 24C11.5817 24 8 20.4183 8 16Z" fill="#E5E7EB"/>
  
  <!-- Piedra preciosa central -->
  <path d="M14 14L16 12L18 14L16 16L14 14Z" fill="#8B5CF6"/>
  <path d="M14 18L16 16L18 18L16 20L14 18Z" fill="#8B5CF6"/>
  <path d="M12 16L14 14L16 16L14 18L12 16Z" fill="#8B5CF6"/>
  <path d="M18 16L16 14L18 12L20 14L18 16Z" fill="#8B5CF6"/>
  
  <!-- Brillo en la piedra -->
  <circle cx="15" cy="15" r="1" fill="#FFFFFF" opacity="0.8"/>
  
  <!-- Detalles del anillo -->
  <path d="M10 16C10 12.6863 12.6863 10 16 10C19.3137 10 22 12.6863 22 16C22 19.3137 19.3137 22 16 22C12.6863 22 10 19.3137 10 16Z" stroke="#6B7280" stroke-width="0.5" fill="none"/>
  
  <!-- Pequeños diamantes alrededor -->
  <path d="M16 6L17 7L16 8L15 7L16 6Z" fill="#F59E0B"/>
  <path d="M16 24L17 25L16 26L15 25L16 24Z" fill="#F59E0B"/>
  <path d="M26 16L25 17L24 16L25 15L26 16Z" fill="#F59E0B"/>
  <path d="M6 16L5 17L4 16L5 15L6 16Z" fill="#F59E0B"/>
</svg>`;

// Función para generar favicon PNG usando Canvas API
function generateFaviconPNG() {
  const { createCanvas } = require('canvas');
  
  const sizes = [16, 32, 48, 64, 128, 256];
  const publicDir = path.join(__dirname, 'client', 'public');
  
  sizes.forEach(size => {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Crear imagen desde SVG
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, size, size);
      
      // Guardar como PNG
      const buffer = canvas.toBuffer('image/png');
      const filename = `favicon-${size}x${size}.png`;
      fs.writeFileSync(path.join(publicDir, filename), buffer);
      console.log(`✅ Generado: ${filename}`);
    };
    
    // Convertir SVG a data URL
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(logoSVG).toString('base64')}`;
    img.src = svgDataUrl;
  });
}

// Función alternativa usando sharp si está disponible
function generateFaviconWithSharp() {
  try {
    const sharp = require('sharp');
    const publicDir = path.join(__dirname, 'client', 'public');
    
    const sizes = [16, 32, 48, 64, 128, 256];
    
    sizes.forEach(size => {
      sharp(Buffer.from(logoSVG))
        .resize(size, size)
        .png()
        .toFile(path.join(publicDir, `favicon-${size}x${size}.png`))
        .then(() => {
          console.log(`✅ Generado: favicon-${size}x${size}.png`);
        })
        .catch(err => {
          console.error(`❌ Error generando favicon-${size}x${size}.png:`, err);
        });
    });
  } catch (error) {
    console.log('Sharp no está disponible, usando método alternativo...');
    generateFaviconPNG();
  }
}

// Función principal
function main() {
  console.log('🎨 Generando favicons para Joyería Elegante...');
  
  try {
    generateFaviconWithSharp();
  } catch (error) {
    console.log('Usando método alternativo...');
    generateFaviconPNG();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main();
}

module.exports = { generateFaviconPNG, generateFaviconWithSharp };
