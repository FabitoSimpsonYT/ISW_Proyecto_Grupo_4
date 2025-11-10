import { query } from '../config/database.js';
import { formatToCustomDate } from './date.utils.js';

/**
 * Crea o actualiza un evento asociado a una evaluación
 * @param {Object} evaluacion - La evaluación
 * @param {Object} user - El usuario (profesor)
 * @param {boolean} isUpdate - Si es una actualización o creación
 * @returns {Promise<Object>} El evento creado o actualizado
 */
export async function syncEvaluacionWithEvent(evaluacion, user, isUpdate = false) {
  try {
    const fechaEval = new Date(evaluacion.fechaProgramada);
    
    // Configurar hora de fin (por defecto 2 horas después)
    const fechaFin = new Date(fechaEval);
    fechaFin.setHours(fechaFin.getHours() + 2);

    // Formatear fechas al formato requerido
    const startTime = formatToCustomDate(fechaEval);
    const endTime = formatToCustomDate(fechaFin);

    if (isUpdate) {
      // Buscar si ya existe un evento para esta evaluación
      const existingEvent = await query(
        'SELECT id FROM events WHERE evaluation_id = $1',
        [evaluacion.id]
      );

      if (existingEvent.rows.length > 0) {
        // Actualizar evento existente
        await query(
          `UPDATE events 
           SET title = $1, 
               description = $2,
               start_time = $3,
               end_time = $4,
               status = $5,
               course = $6,
               section = $7
           WHERE id = $8`,
          [
            `Evaluación: ${evaluacion.titulo}`,
            `Contenidos: ${evaluacion.contenidos}\nPonderación: ${evaluacion.ponderacion}%`,
            fechaEval,
            fechaFin,
            evaluacion.estado === 'PROGRAMADA' ? 'confirmado' : 'tentativo',
            evaluacion.ramo.codigo,
            evaluacion.ramo.seccion,
            existingEvent.rows[0].id
          ]
        );
        return existingEvent.rows[0];
      }
    }

    // Crear nuevo evento
    const result = await query(
      `INSERT INTO events (
        professor_id, 
        title, 
        description, 
        event_type,
        start_time,
        end_time,
        status,
        course,
        section,
        max_bookings,
        is_available,
        evaluation_id,
        is_blocked
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        user.id,
        `Evaluación: ${evaluacion.titulo}`,
        `Contenidos: ${evaluacion.contenidos}\nPonderación: ${evaluacion.ponderacion}%`,
        'evaluacion',
        fechaEval,
        fechaFin,
        evaluacion.estado === 'PROGRAMADA' ? 'confirmado' : 'tentativo',
        evaluacion.ramo.codigo,
        evaluacion.ramo.seccion,
        1,
        false, // No disponible para reservas generales
        evaluacion.id,
        true  // Bloqueado por evaluación
      ]
    );

    return result.rows[0];
  } catch (error) {
    console.error('Error al sincronizar evaluación con evento:', error);
    throw error;
  }
}