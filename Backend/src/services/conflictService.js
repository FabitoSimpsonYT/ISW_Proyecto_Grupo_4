import { query } from '../config/database.js';

/**
 * Verifica conflictos de horario para un profesor
 */
export const checkEventConflict = async (professorId, startTime, endTime, excludeEventId = null) => {
  try {
    let sql = `
      SELECT id, title, start_time, end_time
      FROM events
      WHERE professor_id = $1
      AND status != 'cancelado'
      AND (
        (start_time, end_time) OVERLAPS ($2::timestamp, $3::timestamp)
      )
    `;
    
    const params = [professorId, startTime, endTime];
    
    if (excludeEventId) {
      sql += ` AND id != $4`;
      params.push(excludeEventId);
    }
    
    const result = await query(sql, params);
    
    return {
      hasConflict: result.rows.length > 0,
      conflictingEvents: result.rows
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
              COUNT(b.id) FILTER (WHERE b.status = 'confirmada') as current_bookings
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
    
    // Verificar si el evento está disponible
    if (!event.is_available) {
      return {
        available: false,
        message: 'Este evento no está disponible para reservas'
      };
    }
    
    // Verificar si el evento está cancelado
    if (event.status === 'cancelado') {
      return {
        available: false,
        message: 'Este evento ha sido cancelado'
      };
    }
    
    // Verificar si el evento ya pasó
    if (new Date(event.start_time) < new Date()) {
      return {
        available: false,
        message: 'Este evento ya ha pasado'
      };
    }
    
    // Verificar cupos disponibles
    if (event.current_bookings >= event.max_bookings) {
      return {
        available: false,
        message: 'No hay cupos disponibles para este evento'
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