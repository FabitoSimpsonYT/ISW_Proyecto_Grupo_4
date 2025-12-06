import app from './app.js';
import config from './config/config.js';
import pool from './config/database.js';

const PORT = config.port;

const checkDatabaseConnection = async () => {
  try {
    await pool.query('SELECT NOW()');
    console.log('✅ Base de datos conectada');
  } catch (error) {
    console.error('❌ Error al conectar a la base de datos:', error);
    process.exit(1);
  }
};

const startServer = async () => {
  await checkDatabaseConnection();
  
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`📝 Ambiente: ${config.env}`);
    console.log(`🌐 Frontend URL: ${config.frontendUrl}`);
  });
};

startServer();

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM recibido, cerrando servidor...');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('👋 SIGINT recibido, cerrando servidor...');
  await pool.end();
  process.exit(0);
});