import { query, getClient } from '../config/database.js';

export const getTiposEventos = async (req, res, next) => {
  try {
    const { incluir_inactivos } = req.query;
    
    let sql = 'SELECT * FROM tipos_eventos';
    
    if (incluir_inactivos !== 'true') {
      sql += ' WHERE activo = true';
    }
    
    sql += ' ORDER BY nombre ASC';
    
    const result = await query(sql);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const createTipoEvento = async (req, res, next) => {
  try {
    const { nombre, descripcion, color, icono } = req.body;
    
    if (!nombre) {
      return res.status(400).json({ message: 'Nombre obligatorio' });
    }

    const result = await query(
      'INSERT INTO tipos_eventos (nombre, descripcion, color, icono) VALUES ($1, $2, $3, $4) RETURNING *',
      [nombre, descripcion, color || '#3b82f6', icono || '📅']
    );

    res.status(201).json({
      success: true,
      message: "Tipo creado",
      data: result.rows[0]
    });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(400).json({ message: "Nombre ya existe" });
    }
    next(error);
  }
};

export const updateTipoEvento = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { nombre, descripcion, color, icono } = req.body;

    if (!nombre) {
      return res.status(400).json({ message: 'Nombre obligatorio' });
    }

    const result = await client.query(
      'UPDATE tipos_eventos SET nombre = $1, descripcion = $2, color = $3, icono = $4, updated_at = CURRENT_TIMESTAMP WHERE id = $5 RETURNING *',
      [nombre, descripcion, color, icono, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tipo no encontrado" });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Tipo actualizado",
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteTipoEvento = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    // Validación: no eliminar si hay eventos asociados
    const check = await client.query(
      'SELECT COUNT(*) FROM eventos WHERE tipo_evento_id = $1',
      [id]
    );

    if (parseInt(check.rows[0].count) > 0) {
      return res.status(400).json({ message: "No se puede eliminar, hay eventos asociados" });
    }

    const result = await client.query(
      'DELETE FROM tipos_eventos WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Tipo no encontrado" });
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: "Tipo eliminado"
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};