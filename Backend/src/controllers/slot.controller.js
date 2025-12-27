// src/controllers/slot.controller.js
import { getClient } from "../config/database.js";

// Genera slots para un evento dado una duración en minutos
export const generarSlots = async (req, res) => {
  const client = await getClient();
  try {
    await client.query("BEGIN");

    const { eventoId } = req.params;
    // Accept multiple possible keys for duration to be robust
    const duracion = req.body.duracion ?? req.body.duracionPorAlumno ?? req.body.duracion_por_alumno;

    if (!duracion || isNaN(Number(duracion)) || Number(duracion) <= 0) {
      return res.status(400).json({ success: false, message: 'Duración inválida' });
    }

    const eventoRes = await client.query(
      'SELECT fecha_inicio, fecha_fin FROM eventos WHERE id = $1',
      [eventoId]
    );

    if (eventoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    const { fecha_inicio, fecha_fin } = eventoRes.rows[0];
    const durMs = Number(duracion) * 60 * 1000;

    // Validaciones simples para ayudar al frontend
    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ success: false, message: 'Evento sin rango de fechas (fecha_inicio/fecha_fin faltante)' });
    }

    const diffMs = new Date(fecha_fin) - new Date(fecha_inicio);
    if (diffMs <= 0) {
      return res.status(400).json({ success: false, message: 'Rango de fechas inválido: fecha_fin debe ser posterior a fecha_inicio' });
    }

    if (durMs > diffMs) {
      return res.status(400).json({ success: false, message: `La duración (${duracion} min) es mayor que el rango del evento` });
    }

    const slotsToInsert = [];
    let cursor = new Date(fecha_inicio);
    const end = new Date(fecha_fin);

    while (cursor < end) {
      const slotStart = new Date(cursor);
      const slotEnd = new Date(cursor.getTime() + durMs);
      if (slotEnd <= end) {
        slotsToInsert.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
      }
      cursor = new Date(cursor.getTime() + durMs);
    }

    const inserted = [];
    for (const s of slotsToInsert) {
      const ins = await client.query(
        `INSERT INTO slots (evento_id, fecha_hora_inicio, fecha_hora_fin, disponible) VALUES ($1, $2, $3, true) RETURNING *`,
        [eventoId, s.start, s.end]
      );
      inserted.push(ins.rows[0]);
    }

    await client.query('COMMIT');

    return res.status(201).json({ success: true, message: `${inserted.length} slots generados`, data: inserted });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error generarSlots:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const getSlotsEvento = async (req, res) => {
  const client = await getClient();
  try {
    const { eventoId } = req.params;

    const result = await client.query(
      `SELECT s.*, a.id as alumno_id, u.nombres, u."apellidoPaterno" as apellidoPaterno, u."apellidoMaterno" as apellidoMaterno
       FROM slots s
       LEFT JOIN alumnos a ON s.alumno_id = a.id
       LEFT JOIN users u ON a.id = u.id
       WHERE s.evento_id = $1
       ORDER BY s.fecha_hora_inicio ASC`,
      [eventoId]
    );

    const slots = result.rows.map(r => ({
      id: r.id,
      evento_id: r.evento_id,
      fecha_hora_inicio: r.fecha_hora_inicio,
      fecha_hora_fin: r.fecha_hora_fin,
      disponible: r.disponible,
      bloqueado: r.bloqueado === undefined ? false : r.bloqueado,
      alumno: r.alumno_id ? { id: r.alumno_id, nombres: r.nombres, apellidoPaterno: r.apellidoPaterno, apellidoMaterno: r.apellidoMaterno } : null
    }));

    return res.json({ success: true, data: slots });
  } catch (error) {
    console.error('Error getSlotsEvento:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const eliminarSlot = async (req, res) => {
  const client = await getClient();
  try {
    const { slotId } = req.params;
    const result = await client.query('DELETE FROM slots WHERE id = $1 RETURNING *', [slotId]);
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    return res.json({ success: true, message: 'Slot eliminado', data: result.rows[0] });
  } catch (error) {
    console.error('Error eliminarSlot:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const quitarAlumnoSlot = async (req, res) => {
  const client = await getClient();
  try {
    const { slotId } = req.params;
    const result = await client.query(
      `UPDATE slots SET alumno_id = NULL, disponible = true WHERE id = $1 RETURNING *`,
      [slotId]
    );
    if (result.rows.length === 0) return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    return res.json({ success: true, message: 'Alumno removido del slot', data: result.rows[0] });
  } catch (error) {
    console.error('Error quitarAlumnoSlot:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const bloquearSlot = async (req, res) => {
  const client = await getClient();
  try {
    const { slotId } = req.params;
    const { bloquear } = req.body;

    // If blocking, make it unavailable; if unblocking, make available only if no alumno
    if (bloquear) {
      const r = await client.query(`UPDATE slots SET disponible = false WHERE id = $1 RETURNING *`, [slotId]);
      if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Slot no encontrado' });
      return res.json({ success: true, message: 'Slot bloqueado', data: r.rows[0] });
    } else {
      // Only make disponible=true if alumno_id is null
      const r = await client.query(
        `UPDATE slots SET disponible = true WHERE id = $1 AND alumno_id IS NULL RETURNING *`,
        [slotId]
      );
      if (r.rows.length === 0) return res.status(404).json({ success: false, message: 'Slot no encontrado o está ocupado' });
      return res.json({ success: true, message: 'Slot desbloqueado', data: r.rows[0] });
    }
  } catch (error) {
    console.error('Error bloquearSlot:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const inscribirSlot = async (req, res) => {
  const client = await getClient();
  try {
    const { slotId } = req.params;
    const alumnoId = req.user?.id;

    if (!alumnoId) return res.status(401).json({ success: false, message: 'No autorizado' });

    const slotRes = await client.query('SELECT * FROM slots WHERE id = $1', [slotId]);
    if (slotRes.rows.length === 0) return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    const slot = slotRes.rows[0];

    if (!slot.disponible) return res.status(400).json({ success: false, message: 'Slot no disponible' });
    // assign
    const result = await client.query(
      `UPDATE slots SET alumno_id = $1, disponible = false WHERE id = $2 RETURNING *`,
      [alumnoId, slotId]
    );
    return res.json({ success: true, message: 'Inscrito en el slot correctamente', data: result.rows[0] });
  } catch (error) {
    console.error('Error inscribirSlot:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};