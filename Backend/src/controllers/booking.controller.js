import { query, getClient } from '../config/database.js';
import { checkEventAvailability, checkStudentBookingConflict } from '../services/conflictService.js';
import { createNotification, sendBookingConfirmationEmail, sendBookingCancellationEmail } from '../services/notificationService.js';

export const createBooking = async (req, res, next) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const studentId = req.user.id;
    const { event_id, notes } = req.body;
    
    
    const availability = await checkEventAvailability(event_id);
    
    if (!availability.available) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: availability.message
      });
    }
    
    const event = availability.event;
    
  
    const existingBooking = await client.query(
      'SELECT id FROM bookings WHERE event_id = $1 AND student_id = $2',
      [event_id, studentId]
    );
    
    if (existingBooking.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Ya tienes una reserva para este evento'
      });
    }
    
 
    const conflict = await checkStudentBookingConflict(
      studentId,
      event.start_time,
      event.end_time
    );
    
    if (conflict.hasConflict) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Tienes otra reserva en ese horario',
        conflicts: conflict.conflictingBookings
      });
    }
    

    const bookingResult = await client.query(
      `INSERT INTO bookings (event_id, student_id, notes, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [event_id, studentId, notes, 'confirmada']
    );
    
    const booking = bookingResult.rows[0];
    

    await client.query(
      `UPDATE events 
       SET current_bookings = current_bookings + 1,
           is_available = CASE 
             WHEN current_bookings + 1 >= max_bookings THEN false 
             ELSE true 
           END
       WHERE id = $1`,
      [event_id]
    );
    

    const professorResult = await client.query(
      'SELECT email, first_name, last_name FROM users WHERE id = $1',
      [event.professor_id]
    );
    
    const studentResult = await client.query(
      'SELECT email, first_name, last_name FROM users WHERE id = $1',
      [studentId]
    );
    
    const professor = professorResult.rows[0];
    const student = studentResult.rows[0];

    await createNotification(
      studentId,
      'reserva',
      'Reserva confirmada',
      `Tu reserva para "${event.title}" ha sido confirmada`,
      event_id,
      booking.id
    );
    
    await createNotification(
      event.professor_id,
      'reserva',
      'Nueva reserva',
      `${student.first_name} ${student.last_name} ha reservado "${event.title}"`,
      event_id,
      booking.id
    );

    await sendBookingConfirmationEmail(
      student.email,
      `${student.first_name} ${student.last_name}`,
      {
        ...event,
        professor_name: `${professor.first_name} ${professor.last_name}`
      }
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values)
       VALUES ($1, $2, $3, $4, $5)`,
      [studentId, 'CREATE_BOOKING', 'booking', booking.id, JSON.stringify(booking)]
    );
    
    await client.query('COMMIT');
    
    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: booking
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const getBookings = async (req, res, next) => {
  try {
    const { status, start_date, end_date } = req.query;
    
    let sql = `
      SELECT 
        b.*,
        e.title as event_title,
        e.start_time,
        e.end_time,
        e.location,
        e.course,
        e.section,
        e.event_type,
        u_student.first_name as student_first_name,
        u_student.last_name as student_last_name,
        u_student.email as student_email,
        u_professor.first_name as professor_first_name,
        u_professor.last_name as professor_last_name,
        u_professor.email as professor_email
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u_student ON b.student_id = u_student.id
      JOIN users u_professor ON e.professor_id = u_professor.id
      WHERE 1=1
    `;
    
    const params = [];
    let paramCount = 1;

    if (req.user.role === 'alumno') {
      sql += ` AND b.student_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    } else if (req.user.role === 'profesor') {
      sql += ` AND e.professor_id = $${paramCount}`;
      params.push(req.user.id);
      paramCount++;
    }
    
    if (status) {
      sql += ` AND b.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }
    
    if (start_date) {
      sql += ` AND e.start_time >= $${paramCount}`;
      params.push(start_date);
      paramCount++;
    }
    
    if (end_date) {
      sql += ` AND e.end_time <= $${paramCount}`;
      params.push(end_date);
      paramCount++;
    }
    
    sql += ` ORDER BY e.start_time DESC`;
    
    const result = await query(sql, params);
    
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    next(error);
  }
};

export const getBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const result = await query(
      `SELECT 
        b.*,
        e.title as event_title,
        e.start_time,
        e.end_time,
        e.location,
        e.course,
        e.section,
        e.event_type,
        e.status as event_status,
        u_student.first_name as student_first_name,
        u_student.last_name as student_last_name,
        u_student.email as student_email,
        u_professor.first_name as professor_first_name,
        u_professor.last_name as professor_last_name,
        u_professor.email as professor_email
      FROM bookings b
      JOIN events e ON b.event_id = e.id
      JOIN users u_student ON b.student_id = u_student.id
      JOIN users u_professor ON e.professor_id = u_professor.id
      WHERE b.id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }
    
    const booking = result.rows[0];

    if (req.user.role === 'alumno' && booking.student_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver esta reserva'
      });
    }
    
    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
};

export const updateBooking = async (req, res, next) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { status, notes } = req.body;

    const bookingResult = await client.query(
      `SELECT b.*, e.professor_id, e.title as event_title, e.start_time, e.end_time
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.id = $1`,
      [id]
    );
    
    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'Reserva no encontrada'
      });
    }
    
    const booking = bookingResult.rows[0];
    

    const canUpdate = 
      req.user.role === 'coordinador' ||
      req.user.role === 'jefe_carrera' ||
      (req.user.role === 'alumno' && booking.student_id === req.user.id) ||
      (req.user.role === 'profesor' && booking.professor_id === req.user.id);
    
    if (!canUpdate) {
      await client.query('ROLLBACK');
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar esta reserva'
      });
    }

    const result = await client.query(
      `UPDATE bookings 
       SET status = COALESCE($1, status),
           notes = COALESCE($2, notes)
       WHERE id = $3
       RETURNING *`,
      [status, notes, id]
    );
    

    if (status === 'cancelada' && booking.status !== 'cancelada') {
      await client.query(
        `UPDATE events 
         SET current_bookings = GREATEST(0, current_bookings - 1),
             is_available = true
         WHERE id = $1`,
        [booking.event_id]
      );

      const studentResult = await client.query(
        'SELECT email, first_name, last_name FROM users WHERE id = $1',
        [booking.student_id]
      );
      
      const student = studentResult.rows[0];

      await createNotification(
        booking.student_id,
        'cancelacion',
        'Reserva cancelada',
        `Tu reserva para "${booking.event_title}" ha sido cancelada`,
        booking.event_id,
        id
      );
      
      await sendBookingCancellationEmail(
        student.email,
        `${student.first_name} ${student.last_name}`,
        booking
      );
    }
    

    await client.query(
      `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, old_values, new_values)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.id, 'UPDATE_BOOKING', 'booking', id, JSON.stringify(booking), JSON.stringify(result.rows[0])]
    );
    
    await client.query('COMMIT');
    
    res.json({
      success: true,
      message: 'Reserva actualizada exitosamente',
      data: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    req.body = { status: 'cancelada' };
    await updateBooking(req, res, next);
  } catch (error) {
    next(error);
  }
};
