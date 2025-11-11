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
    
    
    const fechaFin = new Date(fechaEval);
    fechaFin.setHours(fechaFin.getHours() + 2);


    const startTime = formatToCustomDate(fechaEval);
    const endTime = formatToCustomDate(fechaFin);

  if (isUpdate) {
      const existingEvent = await query(
        'SELECT id FROM events WHERE evaluation_id = $1',
        [evaluacion.id]
      );

      if (existingEvent.rows.length > 0) {
      
        try {
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
            evaluacion.ramo?.codigo || null,
            evaluacion.ramo?.seccion || null,
            existingEvent.rows[0].id
          ]
          );
          return existingEvent.rows[0];
        } catch (err) {
          if (err && err.code === '42P01') {
            console.warn('Tabla events no existe — omitiendo actualización de evento.');
            return null;
          }
          throw err;
        }
      }
    }

    // Crear nuevo evento
    try {
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
        (evaluacion.ramo?.codigo || null),
        (evaluacion.ramo?.seccion || null),
        1,
        false, 
        evaluacion.id,
        true  
      ]
    );
      return result.rows[0];
    } catch (err) {
      if (err && err.code === '42P01') {
        console.warn('Tabla events no existe — omitiendo creación de evento.');
        return null;
      }
      throw err;
    }
  } catch (error) {
    console.error('Error al sincronizar evaluación con evento:', error);
    throw error;
  }
}