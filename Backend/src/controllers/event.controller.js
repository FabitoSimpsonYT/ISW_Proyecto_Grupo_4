// src/controllers/eventController.js
import { query, getClient } from '../config/database.js';
import { checkEventConflict } from '../services/conflictService.js';
import { createNotification, sendEventChangeEmail } from '../services/notificationService.js';
import { parseCustomDateFormat, formatToCustomDate } from '../utils/date.utils.js';

export const createEvent = async (req, res, next) => {
  try {
    const professorId = req.user.id;
    const { title, description, event_type, start_time, end_time, status, location, course, section, max_bookings } = req.body;
    
    // Convertir fechas al formato de la base de datos
    const parsedStartTime = parseCustomDateFormat(start_time);
    const parsedEndTime = parseCustomDateFormat(end_time);
    
    // Verificar conflictos de horario
    const conflict = await checkEventConflict(professorId, parsedStartTime, parsedEndTime);
    
    if (conflict.hasConflict) {
      return res.status(400).json({
        success: false,
        message: 'Conflicto de horario detectado',
        conflicts: conflict.conflictingEvents.map(event => ({
          ...event,
          start_time: formatToCustomDate(new Date(event.start_time)),
          end_time: formatToCustomDate(new Date(event.end_time))
        }))
      });
    }
    
    // Crear evento
    const result = await query(
      `INSERT INTO events (professor_id, title, description, event_type, start_time, end_time, status, location, course, section, max_bookings)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [professorId, title, description, event_type, parsedStartTime, parsedEndTime, status || 'tentativo', location, course, section, max_bookings || 1]
    );
    
    // Registrar en auditoría
    await query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [professorId, 'CREATE_EVENT', 'event', result.rows[0].id, JSON.stringify(result.rows[0])]
    );
    
    // Formatear las fechas en la respuesta
    const eventData = {
      ...result.rows[0],
      start_time: formatToCustomDate(new Date(result.rows[0].start_time)),
      end_time: formatToCustomDate(new Date(result.rows[0].end_time))
    };

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: eventData
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req, res, next) => {
  try {
    const { start_date, end_date, course, section, status, available_only } = req.query;
    
    let sql = `
      SELECT 
        e.*,
        u.first_name as professor_first_name,
        u.last_name as professor_last_name,
        COUNT(b.id) FILTER (WHERE b.status = 'confirmada') as current_bookings
      FROM events e
      JOIN users u ON e.professor_id = u.id
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;
    
    if (start_date) {
      const parsedStartDate = parseCustomDateFormat(start_date);
      sql += ` AND e.start_time >= $${paramCount}`;
      params.push(parsedStartDate);
      paramCount++;
    }
    
    if (end_date) {
      sql += ` AND e.end_time <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    if (course) {
      sql += ` AND e.course = $${paramCount}`;
      params.push(course);
      paramCount++;
    }
    
    if (section) {
      sql += ` AND e.section = $${paramCount}`;
      params.push(section);
      paramCount++;
    }
    
    if (status) {
      sql += ` AND e.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (available_only === 'true') {
      sql += ` AND e.is_available = true AND e.status != 'cancelado'`;
    }
    
    // Si es alumno, solo mostrar eventos disponibles
    if (req.user.role === 'alumno') {
      sql += ` AND e.is_available = true AND e.status != 'cancelado' AND e.start_time > NOW()`;
    }
    
    // Si es profesor, solo sus eventos
    if (req.user.role === 'profesor') {
      sql += ` AND e.professor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    
    sql += ` GROUP BY e.id, u.first_name, u.last_name ORDER BY e.start_time ASC`;
    
    const result = await query(sql, params);
    
    // Formatear las fechas en la respuesta
    const formattedEvents = result.rows.map(event => ({
      ...event,
      start_time: formatToCustomDate(new Date(event.start_time)),
      end_time: formatToCustomDate(new Date(event.end_time))
    }));

    res.json({
      success: true,
      count: result.rows.length,
      data: formattedEvents
    });
  } catch (error) {
    next(error);
  }
};

export const getEvent = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
        e.*,
        u.first_name as professor_first_name,
        u.last_name as professor_last_name,
        u.email as professor_email,
        COUNT(b.id) FILTER (WHERE b.status = 'confirmada') as current_bookings
      FROM events e
      JOIN users u ON e.professor_id = u.id
      LEFT JOIN bookings b ON e.id = b.event_id
      WHERE e.id = $1
      GROUP BY e.id, u.first_name, u.last_name, u.email`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    // Formatear las fechas en la respuesta
    const eventData = {
      ...result.rows[0],
      start_time: formatToCustomDate(new Date(result.rows[0].start_time)),
      end_time: formatToCustomDate(new Date(result.rows[0].end_time))
    };

    res.json({
      success: true,
      data: eventData
    });
  } catch (error) {
    next(error);
  }
};

export const updateEvent = async (req, res, next) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const updates = req.body;
    
    // Obtener evento actual
    const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [id]);
    
    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    const currentEvent = eventResult.rows[0];
    
    // Verificar permisos
    if (req.user.role === 'profesor' && currentEvent.professor_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para editar este evento'
      });
    }
    
    // Si se cambian fechas, verificar conflictos
    if (updates.start_time || updates.end_time) {
      const newStartTime = updates.start_time ? parseCustomDateFormat(updates.start_time) : currentEvent.start_time;
      const newEndTime = updates.end_time ? parseCustomDateFormat(updates.end_time) : currentEvent.end_time;
      
      const conflict = await checkEventConflict(currentEvent.professor_id, newStartTime, newEndTime, id);
      
      if (conflict.hasConflict) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          success: false,
          message: 'Conflicto de horario detectado',
          conflicts: conflict.conflictingEvents
        });
      }
    }
    
    // Construir query de actualización
    const fields = [];
    const values = [];
    let paramCount = 1;
    
    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });
    
    if (fields.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }
    
    values.push(id);
    
    const result = await client.query(
      `UPDATE events SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    // Registrar auditoría
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, 'UPDATE_EVENT', 'event', id, JSON.stringify(currentEvent), JSON.stringify(result.rows[0])]
    );
    
    // Notificar a estudiantes con reservas si hay cambios importantes
    if (updates.start_time || updates.end_time || updates.location || updates.status) {
      const bookingsResult = await client.query(
        `SELECT b.*, u.email, u.first_name, u.last_name
         FROM bookings b
         JOIN users u ON b.student_id = u.id
         WHERE b.event_id = $1 AND b.status = 'confirmada'`,
        [id]
      );
      
      const changes = [];
      if (updates.start_time || updates.end_time) changes.push('horario');
      if (updates.location) changes.push('ubicación');
      if (updates.status) changes.push('estado');
      
      for (const booking of bookingsResult.rows) {
        await createNotification(
          booking.student_id,
          'cambio',
          'Cambio en evento',
          `El evento "${result.rows[0].title}" ha sido modificado`,
          id,
          booking.id
        );
        
        await sendEventChangeEmail(
          booking.email,
          `${booking.first_name} ${booking.last_name}`,
          result.rows[0],
          changes.join(', ')
        );
      }
    }
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Evento actualizado exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const deleteEvent = async (req, res, next) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Obtener evento
    const eventResult = await client.query('SELECT * FROM events WHERE id = $1', [id]);
    
    if (eventResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Evento no encontrado'
      });
    }
    
    const event = eventResult.rows[0];
    
    // Verificar permisos
    if (req.user.role === 'profesor' && event.professor_id !== req.user.id) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este evento'
      });
    }
    
    // Cancelar reservas activas y notificar
    const bookingsResult = await client.query(
      `SELECT b.*, u.email, u.first_name, u.last_name
       FROM bookings b
       JOIN users u ON b.student_id = u.id
       WHERE b.event_id = $1 AND b.status = 'confirmada'`,
      [id]
    );
    
    for (const booking of bookingsResult.rows) {
      await createNotification(
        booking.student_id,
        'cancelacion',
        'Evento cancelado',
        `El evento "${event.title}" ha sido cancelado`,
        id,
        booking.id
      );
    }
    
    // Eliminar evento (las reservas se eliminan en cascada)
    await client.query('DELETE FROM events WHERE id = $1', [id]);
    
    // Registrar auditoría
    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, 'DELETE_EVENT', 'event', id, JSON.stringify(event)]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Evento eliminado exitosamente'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};