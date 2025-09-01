const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/jewelry_inventory.db');

console.log('🧪 Probando endpoint de productos directamente...');

// Abrir la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error abriendo base de datos:', err.message);
    return;
  }
  
  console.log('✅ Base de datos abierta correctamente');
  
  // Simular la consulta del endpoint
  const query = `
    SELECT p.*, c.name as category_name 
    FROM products p 
    LEFT JOIN categories c ON p.category_id = c.id 
    ORDER BY p.created_at DESC
  `;
  
  console.log('🔍 Ejecutando consulta:', query);
  
  db.all(query, (err, rows) => {
    if (err) {
      console.error('❌ Error ejecutando consulta:', err.message);
      return;
    }
    
    console.log('📦 Productos encontrados:', rows.length);
    console.log('📊 Primeros 3 productos:');
    
    rows.slice(0, 3).forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   SKU: ${product.sku}`);
      console.log(`   Precio: $${product.price}`);
      console.log(`   Stock: ${product.stock_quantity}`);
      console.log(`   Categoría: ${product.category_name}`);
    });
    
    // Verificar estructura de respuesta
    if (rows.length > 0) {
      const sampleProduct = rows[0];
      console.log('\n🏗️ Estructura del primer producto:');
      console.log(Object.keys(sampleProduct));
    }
    
    // Cerrar la base de datos
    db.close((err) => {
      if (err) {
        console.error('❌ Error cerrando base de datos:', err.message);
      } else {
        console.log('✅ Base de datos cerrada');
      }
    });
  });
});
