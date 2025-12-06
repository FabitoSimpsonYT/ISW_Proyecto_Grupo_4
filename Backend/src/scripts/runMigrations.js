import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIGRATIONS_PATH = path.join(__dirname, '..', 'migrations');

async function runMigrations() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const files = fs.readdirSync(MIGRATIONS_PATH)
      .filter(file => file.endsWith('.sql'))
      .sort();

    const { rows: executedMigrations } = await pool.query(
      'SELECT name FROM migrations'
    );
    const executedFiles = new Set(executedMigrations.map(m => m.name));

    for (const file of files) {
      if (!executedFiles.has(file)) {
        logger.info(`Ejecutando migración: ${file}`);
        
        const sql = fs.readFileSync(
          path.join(MIGRATIONS_PATH, file),
          'utf-8'
        );

        const client = await pool.connect();
        
        try {
          await client.query('BEGIN');
          
          await client.query(sql);
          
          await client.query(
            'INSERT INTO migrations (name) VALUES ($1)',
            [file]
          );
          
          await client.query('COMMIT');
          logger.info(`✅ Migración ${file} completada`);
        } catch (error) {
          await client.query('ROLLBACK');
          logger.error(`❌ Error en migración ${file}:`, error);
          throw error;
        } finally {
          client.release();
        }
      }
    }
    
    logger.info('✨ Todas las migraciones han sido ejecutadas');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

runMigrations();