import { query } from './src/config/database.js';
import fs from 'fs/promises';
import path from 'path';

async function runMigrations() {
  try {
    const migrationsDir = './migrations';
    const files = await fs.readdir(migrationsDir);
    const sqlFiles = files.filter(f => f.endsWith('.sql')).sort();
    
    for (const file of sqlFiles) {
      try {
        const filePath = path.join(migrationsDir, file);
        const sql = await fs.readFile(filePath, 'utf-8');
        
        console.log(`\n🔄 Ejecutando migración: ${file}`);
        const result = await query(sql);
        console.log(`✅ Migración completada: ${file}`);
      } catch (err) {
        // Algunas migraciones pueden fallar si ya existe la columna
        if (err.code === '42701' || err.code === '42P07') {
          console.log(`⚠️  Migración ya aplicada o columna existe: ${file}`);
        } else {
          console.error(`❌ Error en migración ${file}:`, err.message);
        }
      }
    }
    
    console.log('\n✅ Migraciones finalizadas');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

runMigrations();
