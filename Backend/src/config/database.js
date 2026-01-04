import pg from 'pg';
import config from './config.js';
import { HOST, DB_PORT, DB_USERNAME, PASSWORD, DATABASE } from './configEnv.js';

const { Pool } = pg;

// Usar configEnv como fallback si config.js tiene valores undefined
const dbConfig = {
  host: config.db.host || HOST || 'localhost',
  port: config.db.port || DB_PORT || 5432,
  database: config.db.database || DATABASE || 'test3',
  user: config.db.user || DB_USERNAME || 'postgres',
  password: config.db.password || PASSWORD || 'casa5235',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);

pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en PostgreSQL:', err);
  process.exit(-1);
});

export const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Ejecutada query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Error en query:', error);
    throw error;
  }
};

export const getClient = async () => {
  const client = await pool.connect();
  const query = client.query.bind(client);
  const release = client.release.bind(client);
  
  const timeout = setTimeout(() => {
    console.error('Cliente no liberado después de 5 segundos');
  }, 5000);
  
  client.release = () => {
    clearTimeout(timeout);
    return release();
  };
  
  return client;
};

export default pool;