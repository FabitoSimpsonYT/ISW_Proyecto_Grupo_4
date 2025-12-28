// src/services/evento.service.js
const { query } = require('../config/database.js');

module.exports = {
  // ===== EVENTOS =====

  // Obtener todos los eventos de un profesor
  getEventosProfesor: async (profesorId) => {
    const result = await query(
      `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo as ramo_codigo
       FROM eventos e 
       JOIN tipos_eventos t ON e.tipo_evento_id = t.id 
       JOIN ramos r ON e.ramo_id = r.id
       WHERE e.profesor_id = $1 
       ORDER BY e.fecha_inicio ASC`,
      [profesorId]
    );
    return result.rows;
  },

  // Obtener todos los eventos de un alumno (basados en su sección)
  getEventosAlumno: async (alumnoId) => {
    const result = await query(
      `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo as ramo_codigo
       FROM eventos e 
       JOIN tipos_eventos t ON e.tipo_evento_id = t.id 
       JOIN ramos r ON e.ramo_id = r.id
       JOIN seccion_alumnos sa ON sa.seccion_id = e.seccion_id
       WHERE sa.alumno_id = $1
       ORDER BY e.fecha_inicio ASC`,
      [alumnoId]
    );
    return result.rows;
  },

  // Obtener evento por ID
  getEventoById: async (eventoId) => {
    const result = await query(
      `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo as ramo_codigo, r.nombre as ramo_nombre
       FROM eventos e
       JOIN tipos_eventos t ON e.tipo_evento_id = t.id
       JOIN ramos r ON e.ramo_id = r.id
       WHERE e.id = $1`,
      [eventoId]
    );
    return result.rows[0];
  },

  // Crear evento
  crearEvento: async (eventoData) => {
    const {
      nombre,
      descripcion,
      estado,
      fecha_inicio,
      fecha_fin,
      modalidad,
      tipo_evento_id,
      profesor_id,
      ramo_id,
      seccion_id,
      cupo_maximo,
      permit_parejas,
      sala
    } = eventoData;

    const result = await query(
      `INSERT INTO eventos (nombre, descripcion, estado, fecha_inicio, fecha_fin, modalidad, tipo_evento_id, profesor_id, ramo_id, seccion_id, cupo_maximo, cupo_disponible, permit_parejas, sala, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [nombre, descripcion, estado, fecha_inicio, fecha_fin, modalidad, tipo_evento_id, profesor_id, ramo_id, seccion_id, cupo_maximo, permit_parejas, sala]
    );

    return result.rows[0];
  },

  // Actualizar evento
  updateEvento: async (eventoId, eventoData) => {
    const setClauses = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(eventoData)) {
      setClauses.push(`${key} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    values.push(eventoId);
    const setSql = setClauses.join(', ');

    const result = await query(
      `UPDATE eventos SET ${setSql}, updated_at = NOW() WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0];
  },

  // Eliminar evento
  deleteEvento: async (eventoId) => {
    // Primero eliminar slots asociados
    await query(`DELETE FROM slots WHERE evento_id = $1`, [eventoId]);
    
    // Luego eliminar evento
    await query(`DELETE FROM eventos WHERE id = $1`, [eventoId]);
    return true;
  },

  // ===== SLOTS =====

  // Generar slots automáticos para un evento
  getGenerarSlots: async (eventoId, duracionMinutos = 30) => {
    const evento = await module.exports.getEventoById(eventoId);
    if (!evento) throw new Error('Evento no encontrado');

    const fechaInicio = new Date(evento.fecha_inicio);
    const fechaFin = new Date(evento.fecha_fin);
    const slots = [];

    let slotInicio = new Date(fechaInicio);
    while (slotInicio < fechaFin) {
      const slotFin = new Date(slotInicio.getTime() + duracionMinutos * 60000);
      if (slotFin <= fechaFin) {
        slots.push({
          fecha_hora_inicio: slotInicio.toISOString(),
          fecha_hora_fin: slotFin.toISOString(),
          evento_id: eventoId,
          disponible: true
        });
      }
      slotInicio = slotFin;
    }

    return slots;
  },

  // Obtener slots de un evento
  getSlotsEvento: async (eventoId) => {
    const result = await query(
      `SELECT s.*, u.nombres, u.apellido_paterno
       FROM slots s
       LEFT JOIN users u ON s.alumno_id = u.id
       WHERE s.evento_id = $1
       ORDER BY s.fecha_hora_inicio ASC`,
      [eventoId]
    );
    return result.rows;
  },

  // Obtener slots disponibles de un evento
  getSlotsDisponibles: async (eventoId) => {
    const result = await query(
      `SELECT * FROM slots
       WHERE evento_id = $1 AND disponible = true
       ORDER BY fecha_hora_inicio ASC`,
      [eventoId]
    );
    return result.rows;
  },

  // Crear slots para un evento
  crearSlotsEvento: async (eventoId, slots) => {
    try {
      for (const slot of slots) {
        await query(
          `INSERT INTO slots (evento_id, fecha_hora_inicio, fecha_hora_fin, disponible)
           VALUES ($1, $2, $3, $4)`,
          [eventoId, slot.fecha_hora_inicio, slot.fecha_hora_fin, true]
        );
      }
      return true;
    } catch (error) {
      console.error('Error creando slots:', error);
      throw error;
    }
  },

  // Inscribir alumno en un slot
  inscribirEnSlot: async (slotId, alumnoId) => {
    const slot = await query(
      `SELECT * FROM slots WHERE id = $1`,
      [slotId]
    );

    if (!slot.rows[0] || !slot.rows[0].disponible) {
      throw new Error('Slot no disponible');
    }

    await query(
      `UPDATE slots SET alumno_id = $1, disponible = false WHERE id = $2`,
      [alumnoId, slotId]
    );

    return true;
  },

  // Quitar alumno de un slot
  quitarAlumnoDeSlot: async (slotId) => {
    await query(
      `UPDATE slots SET alumno_id = NULL, disponible = true WHERE id = $1`,
      [slotId]
    );
    return true;
  },

  // Eliminar un slot
  eliminarSlot: async (slotId) => {
    await query(
      `DELETE FROM slots WHERE id = $1`,
      [slotId]
    );
    return true;
  }
};