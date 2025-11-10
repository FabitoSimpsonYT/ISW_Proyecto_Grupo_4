import { query } from '../config/database.js';

/**
 * Verifica conflictos de horario para un profesor
 */
export const checkEventConflict = async (professorId, startTime, endTime, excludeEventId = null) => {
  try {
    let sql = `
      SELECT 
        e.id, 
        e.title, 
        e.start_time, 
        e.end_time, 
        e.is_blocked, 
        e.evaluation_id,
        e.professor_id,
        e.course,
        e.section,
        u.first_name as professor_first_name,
        u.last_name as professor_last_name,
        ev.titulo as evaluation_title
      FROM events e
      LEFT JOIN users u ON e.professor_id = u.id
      LEFT JOIN evaluaciones ev ON e.evaluation_id = ev.id
      WHERE (
        -- Verificar conflictos con otros eventos del mismo profesor
        (e.professor_id = $1 AND e.status != 'cancelado')
        OR
        -- Verificar conflictos con evaluaciones (de cualquier profesor)
        (e.is_blocked = true OR e.evaluation_id IS NOT NULL)
      )
      AND (
        (e.start_time, e.end_time) OVERLAPS ($2::timestamp, $3::timestamp)
      )
    `;
    
    const params = [professorId, startTime, endTime];
    
    if (excludeEventId) {
      sql += ` AND e.id != $4`;
      params.push(excludeEventId);
    }
    
    const result = await query(sql, params);
    
    const conflicts = result.rows.map(event => {
      const eventDate = new Date(event.start_time);
      const formattedDate = eventDate.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const formattedTime = `${eventDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} - ${
        new Date(event.end_time).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      }`;

      let conflictMessage = '';
      if (event.is_blocked || event.evaluation_id) {
        conflictMessage = `⚠️ Horario no disponible: Existe una evaluación "${event.evaluation_title || event.title}"
programada para el ${formattedDate}
🕒 Horario: ${formattedTime}
📚 Curso: ${event.course} sección ${event.section}${
          event.professor_id !== professorId 
            ? `\n👨‍🏫 Profesor: ${event.professor_first_name} ${event.professor_last_name}`
            : ''
        }`;
      } else {
        conflictMessage = `⚠️ Horario ocupado: Ya tienes un evento "${event.title}"
programado para el ${formattedDate}
🕒 Horario: ${formattedTime}`;
      }

      return {
        ...event,
        conflict_reason: conflictMessage,
        conflict_type: event.is_blocked || event.evaluation_id ? 'evaluation_conflict' : 'schedule_conflict',
        formatted_date: formattedDate,
        formatted_time: formattedTime
      };
    });

    return {
      hasConflict: conflicts.length > 0,
      conflictingEvents: conflicts
    };
  } catch (error) {
    throw new Error(`Error checking event conflict: ${error.message}`);
  }
};

/**
 * Verifica la disponibilidad de un evento para reservas
 */
export const checkEventAvailability = async (eventId) => {
  try {
    const result = await query(
      `SELECT e.*, 
              COUNT(b.id) FILTER (WHERE b.status = 'confirmada') as current_bookings,
              CASE 
                WHEN e.is_blocked = true THEN 'Este horario está reservado para una evaluación'
                WHEN e.evaluation_id IS NOT NULL THEN 'Este horario corresponde a una evaluación programada'
                ELSE NULL
              END as blocked_reason
       FROM events e
       LEFT JOIN bookings b ON e.id = b.event_id
       WHERE e.id = $1
       GROUP BY e.id`,
      [eventId]
    );
    
    if (result.rows.length === 0) {
      return {
        available: false,
        message: 'Evento no encontrado'
      };
    }
    
    const event = result.rows[0];
    
    // Verificar si está bloqueado por una evaluación
    if (event.is_blocked) {
      const evaluationInfo = await query(
        `SELECT e.titulo, u.first_name, u.last_name 
         FROM evaluaciones e 
         JOIN users u ON e.creadaPor = u.id 
         WHERE e.id = $1`,
        [event.evaluation_id]
      );
      
      const evalInfo = evaluationInfo.rows[0];
      return {
        available: false,
        message: `Horario reservado para evaluación: "${evalInfo.titulo}" con ${evalInfo.first_name} ${evalInfo.last_name}`,
        type: 'evaluation_block'
      };
    }

    // Verificar si el evento está disponible
    if (!event.is_available) {
      return {
        available: false,
        message: 'Este horario no está disponible para reservas',
        type: 'unavailable'
      };
    }
    
    // Verificar si el evento está cancelado
    if (event.status === 'cancelado') {
      return {
        available: false,
        message: 'Este horario ha sido cancelado',
        type: 'cancelled'
      };
    }
    
    // Verificar si el evento ya pasó
    if (new Date(event.start_time) < new Date()) {
      const fechaEvento = new Date(event.start_time).toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      return {
        available: false,
        message: `Este horario ya ha pasado (${fechaEvento})`,
        type: 'past'
      };
    }
    
    // Verificar cupos disponibles
    if (event.current_bookings >= event.max_bookings) {
      return {
        available: false,
        message: `Horario completo (${event.current_bookings}/${event.max_bookings} cupos ocupados)`,
        type: 'full'
      };
    }
    
    return {
      available: true,
      event: event
    };
  } catch (error) {
    throw new Error(`Error checking event availability: ${error.message}`);
  }
};

/**
 * Verifica conflictos de horario para un estudiante
 */
export const checkStudentBookingConflict = async (studentId, startTime, endTime, excludeBookingId = null) => {
  try {
    let sql = `
      SELECT b.id, e.title, e.start_time, e.end_time
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      WHERE b.student_id = $1
      AND b.status = 'confirmada'
      AND e.status != 'cancelado'
      AND (
        (e.start_time, e.end_time) OVERLAPS ($2::timestamp, $3::timestamp)
      )
    `;
    
    const params = [studentId, startTime, endTime];
    
    if (excludeBookingId) {
      sql += ` AND b.id != $4`;
      params.push(excludeBookingId);
    }
    
    const result = await query(sql, params);
    
    return {
      hasConflict: result.rows.length > 0,
      conflictingBookings: result.rows
    };
  } catch (error) {
    throw new Error(`Error checking student booking conflict: ${error.message}`);
  }
};

/**
 * Verifica límites de reservas por curso/sección
 */
export const checkBookingLimits = async (studentId, courseId, sectionId) => {
  try {
    const result = await query(
      `SELECT COUNT(*) as booking_count
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.student_id = $1
       AND b.status = 'confirmada'
       AND e.course = $2
       AND e.section = $3`,
      [studentId, courseId, sectionId]
    );
    
    // Puedes ajustar este límite según tus necesidades
    const BOOKING_LIMIT = 3;
    
    return {
      hasReachedLimit: result.rows[0].booking_count >= BOOKING_LIMIT,
      currentCount: result.rows[0].booking_count,
      limit: BOOKING_LIMIT
    };
  } catch (error) {
    throw new Error(`Error checking booking limits: ${error.message}`);
  }
};