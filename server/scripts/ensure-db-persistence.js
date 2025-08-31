#!/usr/bin/env node

const { getDatabase, syncDatabase } = require('../database/init');
const path = require('path');
const fs = require('fs');

async function ensurePersistence() {
  console.log('🔧 Configurando persistencia de base de datos...');
  
  try {
    const db = getDatabase();
    
    // Configurar SQLite para máxima persistencia
    console.log('📝 Configurando SQLite para persistencia...');
    
    // Cambiar a modo DELETE para mejor compatibilidad con sistemas de archivos efímeros
    db.run('PRAGMA journal_mode = DELETE', (err) => {
      if (err) {
        console.error('❌ Error configurando journal_mode:', err);
      } else {
        console.log('✅ Journal mode configurado a DELETE');
      }
    });
    
    // Configurar synchronous a FULL para máxima seguridad
    db.run('PRAGMA synchronous = FULL', (err) => {
      if (err) {
        console.error('❌ Error configurando synchronous:', err);
      } else {
        console.log('✅ Synchronous configurado a FULL');
      }
    });
    
    // Configurar cache size
    db.run('PRAGMA cache_size = 10000', (err) => {
      if (err) {
        console.error('❌ Error configurando cache_size:', err);
      } else {
        console.log('✅ Cache size configurado');
      }
    });
    
    // Configurar temp store
    db.run('PRAGMA temp_store = MEMORY', (err) => {
      if (err) {
        console.error('❌ Error configurando temp_store:', err);
      } else {
        console.log('✅ Temp store configurado');
      }
    });
    
    // Habilitar foreign keys
    db.run('PRAGMA foreign_keys = ON', (err) => {
      if (err) {
        console.error('❌ Error configurando foreign_keys:', err);
      } else {
        console.log('✅ Foreign keys habilitados');
      }
    });
    
    // Forzar checkpoint
    db.run('PRAGMA wal_checkpoint(TRUNCATE)', (err) => {
      if (err) {
        console.error('❌ Error forzando checkpoint:', err);
      } else {
        console.log('✅ Checkpoint forzado');
      }
    });
    
    // Verificar configuración
    setTimeout(() => {
      console.log('🔍 Verificando configuración...');
      
      db.get('PRAGMA journal_mode', (err, result) => {
        if (err) {
          console.error('❌ Error verificando journal_mode:', err);
        } else {
          console.log(`📝 Journal mode actual: ${result.journal_mode}`);
        }
      });
      
      db.get('PRAGMA synchronous', (err, result) => {
        if (err) {
          console.error('❌ Error verificando synchronous:', err);
        } else {
          console.log(`🔄 Synchronous actual: ${result.synchronous}`);
        }
      });
      
      // Verificar datos existentes
      db.get('SELECT COUNT(*) as count FROM products', (err, result) => {
        if (err) {
          console.error('❌ Error contando productos:', err);
        } else {
          console.log(`📦 Productos en BD: ${result.count}`);
        }
      });
      
      db.get('SELECT COUNT(*) as count FROM sales', (err, result) => {
        if (err) {
          console.error('❌ Error contando ventas:', err);
        } else {
          console.log(`💰 Ventas en BD: ${result.count}`);
        }
      });
      
      console.log('✅ Configuración de persistencia completada');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error configurando persistencia:', error);
  }
}

// Ejecutar configuración
ensurePersistence();
