import { query, getClient } from '../config/database.js';

export const crearBloqueo = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    // Aceptar tanto snake_case como camelCase
    const fecha_inicio = req.body.fecha_inicio || req.body.fechaInicio;
    const fecha_fin = req.body.fecha_fin || req.body.fechaFin;
    const razon = req.body.razon || req.body.motivo;

    if (!fecha_inicio || !fecha_fin) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: "Fechas obligatorias" });
    }

    const result = await client.query(
      `INSERT INTO bloqueos (fecha_inicio, fecha_fin, razon, created_by) VALUES ($1, $2, $3, $4) RETURNING id, fecha_inicio, fecha_fin, razon, created_by, created_at`,
      [fecha_inicio, fecha_fin, razon, req.user.id]
    );

    const bloqueo = result.rows[0];
    const userRes = await client.query('SELECT id, nombres, "apellidoPaterno", "apellidoMaterno", email FROM users WHERE id = $1 LIMIT 1', [bloqueo.created_by]);
    const creador = userRes.rows[0] || null;

    await client.query('COMMIT');

    const payload = {
      id: bloqueo.id,
      fecha_inicio: bloqueo.fecha_inicio,
      fecha_fin: bloqueo.fecha_fin,
      fechaInicio: bloqueo.fecha_inicio,
      fechaFin: bloqueo.fecha_fin,
      razon: bloqueo.razon,
      created_by: bloqueo.created_by,
      creador,
      created_at: bloqueo.created_at
    };

    res.status(201).json({ success: true, message: 'Bloqueo creado', data: payload });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    next(error);
  } finally {
    client.release();
  }
};

export const getBloqueos = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT b.id, b.fecha_inicio, b.fecha_fin, b.razon, b.created_by, b.created_at,
              u.nombres, u."apellidoPaterno", u."apellidoMaterno", u.email
       FROM bloqueos b
       LEFT JOIN users u ON u.id = b.created_by
       ORDER BY b.fecha_inicio ASC`
    );

    const mapped = result.rows.map(r => ({
      id: r.id,
      fecha_inicio: r.fecha_inicio,
      fecha_fin: r.fecha_fin,
      fechaInicio: r.fecha_inicio,
      fechaFin: r.fecha_fin,
      razon: r.razon,
      created_by: r.created_by,
      creador: r.nombres ? { id: r.created_by, nombres: r.nombres, apellidoPaterno: r.apellidoPaterno, apellidoMaterno: r.apellidoMaterno, email: r.email } : null,
      created_at: r.created_at
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
};

export const eliminarBloqueo = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;

    const result = await client.query('DELETE FROM bloqueos WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: "Bloqueo no encontrado" });
    }

    await client.query('COMMIT');

    res.json({ success: true, message: "Bloqueo eliminado" });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    next(error);
  } finally {
    client.release();
  }
};