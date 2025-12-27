import { query } from '../config/database.js';

export const getTipos = async () => {
  const result = await query('SELECT * FROM tipos_eventos WHERE activo = true ORDER BY nombre');
  return result.rows;
};

// ... otras funciones CRUD