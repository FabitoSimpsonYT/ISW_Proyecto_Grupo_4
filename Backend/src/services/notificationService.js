import { query } from '../config/database.js';
import { sendEmail } from '../config/email.js';
import { formatDate } from '../utils/helper.utils.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Crear una nueva notificación
 */
export const createNotification = async (userId, type, title, message, eventId = null, bookingId = null) => {
  try {
    const result = await query(
      `INSERT INTO notifications 
       (user_id, type, title, message, event_id, booking_id, read, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())
       RETURNING *`,
      [userId, type, title, message, eventId, bookingId]
    );
    
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating notification:', error);
    throw new Error(`Error creating notification: ${error.message}`);
  }
};

/**
 * Enviar email de confirmación de reserva
 */
export const sendBookingConfirmationEmail = async (userEmail, userName, event) => {
  const subject = `Confirmación de reserva: ${event.title}`;
  const html = `
    <h2>Confirmación de Reserva</h2>
    <p>Hola ${userName},</p>
    <p>Tu reserva ha sido confirmada para el siguiente evento:</p>
    <ul>
      <li><strong>Evento:</strong> ${event.title}</li>
      <li><strong>Fecha:</strong> ${formatDate(event.start_time)}</li>
      <li><strong>Hora:</strong> ${formatDate(event.start_time, 'HH:mm')} - ${formatDate(event.end_time, 'HH:mm')}</li>
      <li><strong>Ubicación:</strong> ${event.location}</li>
      <li><strong>Profesor:</strong> ${event.professor_name}</li>
    </ul>
    <p>Por favor, asegúrate de llegar puntualmente.</p>
  `;
  
  try {
    await sendEmail(userEmail, subject, html);
  } catch (error) {
    logger.error('Error sending booking confirmation email:', error);
    // No lanzamos el error para no interrumpir el flujo principal
  }
};

/**
 * Enviar email de cancelación de reserva
 */
export const sendBookingCancellationEmail = async (userEmail, userName, booking) => {
  const subject = `Cancelación de reserva: ${booking.event_title}`;
  const html = `
    <h2>Cancelación de Reserva</h2>
    <p>Hola ${userName},</p>
    <p>Tu reserva para el siguiente evento ha sido cancelada:</p>
    <ul>
      <li><strong>Evento:</strong> ${booking.event_title}</li>
      <li><strong>Fecha:</strong> ${formatDate(booking.start_time)}</li>
      <li><strong>Hora:</strong> ${formatDate(booking.start_time, 'HH:mm')} - ${formatDate(booking.end_time, 'HH:mm')}</li>
    </ul>
  `;
  
  try {
    await sendEmail(userEmail, subject, html);
  } catch (error) {
    logger.error('Error sending booking cancellation email:', error);
  }
};

/**
 * Enviar email de cambios en el evento
 */
export const sendEventChangeEmail = async (userEmail, userName, event, changedFields) => {
  const subject = `Cambios en el evento: ${event.title}`;
  const html = `
    <h2>Cambios en el Evento</h2>
    <p>Hola ${userName},</p>
    <p>Se han realizado cambios en el evento "${event.title}".</p>
    <p>Los siguientes campos han sido modificados: ${changedFields}</p>
    <p>Detalles actualizados del evento:</p>
    <ul>
      <li><strong>Fecha:</strong> ${formatDate(event.start_time)}</li>
      <li><strong>Hora:</strong> ${formatDate(event.start_time, 'HH:mm')} - ${formatDate(event.end_time, 'HH:mm')}</li>
      <li><strong>Ubicación:</strong> ${event.location}</li>
      <li><strong>Estado:</strong> ${event.status}</li>
    </ul>
  `;
  
  try {
    await sendEmail(userEmail, subject, html);
  } catch (error) {
    logger.error('Error sending event change email:', error);
  }
};

/**
 * Enviar recordatorios de eventos
 */
export const sendEventReminders = async () => {
  try {
    // Obtener eventos próximos (24 horas)
    const result = await query(
      `SELECT 
        e.id as event_id,
        e.title,
        e.start_time,
        e.end_time,
        e.location,
        b.id as booking_id,
        u.id as user_id,
        u.email,
        u.first_name,
        u.last_name
       FROM events e
       JOIN bookings b ON e.id = b.event_id
       JOIN users u ON b.student_id = u.id
       WHERE e.start_time BETWEEN NOW() AND NOW() + INTERVAL '24 hours'
       AND e.status = 'confirmado'
       AND b.status = 'confirmada'
       AND b.reminder_sent = false`
    );
    
    for (const booking of result.rows) {
      // Crear notificación
      await createNotification(
        booking.user_id,
        'recordatorio',
        'Recordatorio de evento',
        `Recordatorio: Tienes "${booking.title}" mañana a las ${formatDate(booking.start_time, 'HH:mm')}`,
        booking.event_id,
        booking.booking_id
      );
      
      // Enviar email
      const subject = `Recordatorio: ${booking.title}`;
      const html = `
        <h2>Recordatorio de Evento</h2>
        <p>Hola ${booking.first_name},</p>
        <p>Te recordamos que tienes un evento programado para mañana:</p>
        <ul>
          <li><strong>Evento:</strong> ${booking.title}</li>
          <li><strong>Fecha:</strong> ${formatDate(booking.start_time)}</li>
          <li><strong>Hora:</strong> ${formatDate(booking.start_time, 'HH:mm')} - ${formatDate(booking.end_time, 'HH:mm')}</li>
          <li><strong>Ubicación:</strong> ${booking.location}</li>
        </ul>
      `;
      
      try {
        await sendEmail(booking.email, subject, html);
        
        // Marcar recordatorio como enviado
        await query(
          'UPDATE bookings SET reminder_sent = true WHERE id = $1',
          [booking.booking_id]
        );
      } catch (error) {
        logger.error(`Error sending reminder for booking ${booking.booking_id}:`, error);
      }
    }
  } catch (error) {
    logger.error('Error in send event reminders:', error);
    throw new Error(`Error sending event reminders: ${error.message}`);
  }
};