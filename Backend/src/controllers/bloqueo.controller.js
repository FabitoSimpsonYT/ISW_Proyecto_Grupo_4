import { query, getClient } from '../config/database.js';

export const crearBloqueo = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    if (req.user.role !== 'jefe_carrera') {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const { fecha_inicio, fecha_fin, razon } = req.body;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ message: "Fechas obligatorias" });
    }

    const result = await client.query(
      'INSERT INTO bloqueos (fecha_inicio, fecha_fin, razon, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [fecha_inicio, fecha_fin, razon, req.user.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: "Bloqueo creado",
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getBloqueos = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM bloqueos ORDER BY fecha_inicio ASC');
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const eliminarBloqueo = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    if (req.user.role !== 'jefe_carrera') {
      return res.status(403).json({ message: "Acceso denegado" });
    }

    const { id } = req.params;

    const result = await client.query('DELETE FROM bloqueos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Bloqueo no encontrado" });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Bloqueo eliminado"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};