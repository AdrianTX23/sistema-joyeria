const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../database/jewelry_inventory.db');

console.log('🔍 Agregando productos de muestra...');

const sampleProducts = [
  {
    sku: 'AN001',
    name: 'Anillo de Diamante Clásico',
    description: 'Anillo elegante con diamante central de 0.5 quilates, montura en oro blanco 14k',
    category_id: 1,
    price: 2500.00,
    cost: 1800.00,
    stock_quantity: 15,
    min_stock_level: 5,
    material: 'Oro blanco 14k, Diamante',
    weight: 3.2
  },
  {
    sku: 'CO002',
    name: 'Collar de Perlas Cultivadas',
    description: 'Collar de perlas cultivadas de agua dulce, longitud 18 pulgadas',
    category_id: 2,
    price: 450.00,
    cost: 280.00,
    stock_quantity: 8,
    min_stock_level: 3,
    material: 'Perlas cultivadas, Plata 925',
    weight: 12.5
  },
  {
    sku: 'BR003',
    name: 'Brazalete de Oro Amarillo',
    description: 'Brazalete de oro amarillo 18k con diseño trenzado, ajustable',
    category_id: 3,
    price: 1200.00,
    cost: 850.00,
    stock_quantity: 12,
    min_stock_level: 4,
    material: 'Oro amarillo 18k',
    weight: 8.7
  },
  {
    sku: 'AR004',
    name: 'Aretes de Zafiro Azul',
    description: 'Aretes con zafiros azules naturales, montura en oro blanco 14k',
    category_id: 4,
    price: 850.00,
    cost: 520.00,
    stock_quantity: 6,
    min_stock_level: 2,
    material: 'Oro blanco 14k, Zafiro azul',
    weight: 2.1
  },
  {
    sku: 'RE005',
    name: 'Reloj de Lujo Suizo',
    description: 'Reloj automático suizo con cronógrafo, caja de acero inoxidable',
    category_id: 5,
    price: 3200.00,
    cost: 2100.00,
    stock_quantity: 4,
    min_stock_level: 2,
    material: 'Acero inoxidable, Cristal de zafiro',
    weight: 85.0
  },
  {
    sku: 'PI006',
    name: 'Pendiente de Esmeralda',
    description: 'Pendiente con esmeralda colombiana, montura en oro amarillo 18k',
    category_id: 1,
    price: 1800.00,
    cost: 1100.00,
    stock_quantity: 3,
    min_stock_level: 1,
    material: 'Oro amarillo 18k, Esmeralda',
    weight: 4.8
  },
  {
    sku: 'PU007',
    name: 'Pulsera de Plata con Charms',
    description: 'Pulsera de plata 925 con charms personalizables',
    category_id: 3,
    price: 180.00,
    cost: 95.00,
    stock_quantity: 25,
    min_stock_level: 8,
    material: 'Plata 925, Charms de plata',
    weight: 15.2
  },
  {
    sku: 'TI008',
    name: 'Tiara de Cristal Swarovski',
    description: 'Tiara elegante con cristales Swarovski, perfecta para eventos especiales',
    category_id: 6,
    price: 650.00,
    cost: 380.00,
    stock_quantity: 7,
    min_stock_level: 3,
    material: 'Plata 925, Cristal Swarovski',
    weight: 22.0
  }
];

// Abrir la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Error abriendo base de datos:', err.message);
    return;
  }
  
  console.log('✅ Base de datos abierta correctamente');
  
  // Verificar si ya hay productos
  db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
    if (err) {
      console.error('❌ Error contando productos:', err.message);
      return;
    }
    
    if (result.count > 1) {
      console.log('✅ Ya hay productos en la base de datos, saltando inserción');
      db.close();
      return;
    }
    
    console.log('📦 Insertando productos de muestra...');
    
    // Insertar productos uno por uno
    let inserted = 0;
    const total = sampleProducts.length;
    
    sampleProducts.forEach((product, index) => {
      const sql = `
        INSERT INTO products (
          sku, name, description, category_id, price, cost, 
          stock_quantity, min_stock_level, material, weight, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;
      
      const params = [
        product.sku,
        product.name,
        product.description,
        product.category_id,
        product.price,
        product.cost,
        product.stock_quantity,
        product.min_stock_level,
        product.material,
        product.weight
      ];
      
      db.run(sql, params, function(err) {
        if (err) {
          console.error(`❌ Error insertando producto ${product.sku}:`, err.message);
        } else {
          inserted++;
          console.log(`✅ Producto ${product.sku} insertado (${inserted}/${total})`);
        }
        
        // Si es el último producto, cerrar la base de datos
        if (inserted === total || index === total - 1) {
          console.log(`\n🎉 Proceso completado: ${inserted} productos insertados`);
          
          // Verificar el total final
          db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
            if (err) {
              console.error('❌ Error contando productos final:', err.message);
            } else {
              console.log(`📊 Total de productos en BD: ${result.count}`);
            }
            
            db.close((err) => {
              if (err) {
                console.error('❌ Error cerrando base de datos:', err.message);
              } else {
                console.log('✅ Base de datos cerrada');
              }
            });
          });
        }
      });
    });
  });
});
