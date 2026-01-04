/* src/controllers/slot.controller.js */
import { getClient } from "../config/database.js";
import { notificarInscripcionSlotConEmail } from "../services/notificacionesConEmail.service.js";
import { AppDataSource } from "../config/configDB.js";

// Genera slots para un evento dado una duraciÃ³n en minutos
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
      'SELECT fecha_rango_inicio, fecha_rango_fin, hora_inicio_diaria, hora_fin_diaria, fecha_inicio, fecha_fin FROM eventos WHERE id = $1',
      [eventoId]
    );

    if (eventoRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    const evento = eventoRes.rows[0];
    
    // Para eventos de slots, usar fecha_rango_inicio/fin y horas diarias
    // Para eventos regulares, usar fecha_inicio/fin
    const fechaInicio = evento.fecha_rango_inicio || evento.fecha_inicio;
    const fechaFin = evento.fecha_rango_fin || evento.fecha_fin;
    const horaInicio = evento.hora_inicio_diaria || '08:00';
    const horaFin = evento.hora_fin_diaria || '21:00';

    const durMs = Number(duracion) * 60 * 1000;

    // Validaciones simples para ayudar al frontend
    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ success: false, message: 'Evento sin rango de fechas (fecha_inicio/fecha_fin faltante)' });
    }

    const diffMs = new Date(fechaFin) - new Date(fechaInicio);
    if (diffMs <= 0) {
      return res.status(400).json({ success: false, message: 'Rango de fechas inválido: fecha_fin debe ser posterior a fecha_inicio' });
    }

    if (durMs > 24 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: `La duración (${duracion} min) no puede ser mayor a 24 horas` });
    }

    const slotsToInsert = [];
    
    // Iterar por cada día del rango
    let currentDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    
    // Normalizar las fechas para evitar problemas de zona horaria
    currentDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);

    while (currentDate <= endDate) {
      // Para cada día, generar slots desde horaInicio hasta horaFin
      const [startHour, startMin] = horaInicio.split(':').map(Number);
      const [endHour, endMin] = horaFin.split(':').map(Number);
      
      let slotTime = new Date(currentDate);
      slotTime.setHours(startHour, startMin, 0, 0);
      
      const dayEnd = new Date(currentDate);
      dayEnd.setHours(endHour, endMin, 0, 0);

      while (slotTime < dayEnd) {
        const slotStart = new Date(slotTime);
        const slotEnd = new Date(slotTime.getTime() + durMs);
        
        // No generar slots que se salgan del horario del día
        if (slotEnd <= dayEnd) {
          slotsToInsert.push({ 
            start: slotStart.toISOString(), 
            end: slotEnd.toISOString() 
          });
        }
        
        slotTime = new Date(slotEnd);
      }

      // Pasar al siguiente día
      currentDate = new Date(currentDate.getTime() + 24 * 60 * 60 * 1000);
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
    // Soportar tanto /slot/:slotId como /:slotId
    const { slotId, id } = req.params;
    const idSlot = slotId || id;

    if (!idSlot) {
      return res.status(400).json({ success: false, message: 'ID del slot no especificado' });
    }

    const result = await client.query('DELETE FROM slots WHERE id = $1 RETURNING *', [idSlot]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    }
    return res.json({ success: true, message: 'Slot eliminado correctamente', data: result.rows[0] });
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
    const slotId = parseInt(req.params.slotId, 10);
    const bloquear = req.body.bloquear !== undefined ? req.body.bloquear : true;

    console.log('[bloquearSlot] slotId:', slotId, 'bloquear:', bloquear, 'body:', req.body);

    if (isNaN(slotId)) {
      return res.status(400).json({ success: false, message: 'slotId inválido' });
    }

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
    console.error('Error bloquearSlot:', error.message, error.stack);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

export const inscribirSlot = async (req, res) => {
  const client = await getClient();
  try {
    // Parsear y validar slotId desde params
    const slotIdRaw = req.params?.slotId;
    const alumnoIdRaw = req.user?.id;

    const slotIdInt = slotIdRaw !== undefined && slotIdRaw !== null ? parseInt(slotIdRaw, 10) : NaN;
    if (isNaN(slotIdInt)) {
      return res.status(400).json({ success: false, message: 'slotId inválido (debe ser un número entero)' });
    }

    const alumnoId = parseInt(alumnoIdRaw, 10);
    if (isNaN(alumnoId)) {
      return res.status(401).json({ success: false, message: 'No autorizado' });
    }

    await client.query('BEGIN');

    // Lock the slot row to avoid race conditions
    const slotRes = await client.query('SELECT * FROM slots WHERE id = $1 FOR UPDATE', [slotIdInt]);
    if (slotRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    }
    const slot = slotRes.rows[0];

    if (!slot.disponible) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Slot no disponible' });
    }

    // Permitir que el alumno cambie de slot: primero desinscribir del slot anterior
    const slotAnterior = await client.query(
      `SELECT id FROM slots WHERE evento_id = $1 AND alumno_id = $2 LIMIT 1`,
      [slot.evento_id, alumnoId]
    );
    
    if (slotAnterior.rows.length > 0) {
      // El alumno ya estaba inscrito en otro slot, desinscribir
      await client.query(
        `UPDATE slots SET alumno_id = NULL, disponible = true WHERE id = $1`,
        [slotAnterior.rows[0].id]
      );
    }

    const result = await client.query(
      `UPDATE slots SET alumno_id = $1, disponible = false WHERE id = $2 RETURNING *`,
      [alumnoId, slotIdInt]
    );

    await client.query('COMMIT');

    const assigned = result.rows[0];
    // 📧 Enviar email de confirmación de inscripción
    try {
      const eventoRes = await client.query(
        'SELECT e.nombre, e.sala, e.modalidad, r.nombre as ramoNombre, r.codigo FROM eventos e LEFT JOIN ramos r ON e.ramo_id = r.id WHERE e.id = $1',
        [assigned.evento_id]
      );
      
      if (eventoRes.rows.length > 0) {
        const evento = eventoRes.rows[0];
        const userRes = await client.query('SELECT nombres, email FROM users WHERE id = $1', [alumnoId]);
        const usuario = userRes.rows[0];

        if (usuario?.email) {
          const horaInicio = new Date(assigned.fecha_hora_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const horaFin = new Date(assigned.fecha_hora_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
          const fechaSlot = new Date(assigned.fecha_hora_inicio);

          await notificarInscripcionSlotConEmail({
            alumnoId,
            ramoNombre: evento.ramoNombre || 'Ramo',
            codigoRamo: evento.codigo || '',
            evaluacionNombre: evento.nombre,
            fechaSlot,
            horaInicio,
            horaFin,
            sala: evento.sala || 'Por definir',
            nombreProfesor: 'Profesor',
            instrucciones: 'Por favor, recuerda llegar 10 minutos antes de tu hora asignada.',
          });
          console.log(`✅ Email de confirmación enviado a ${usuario.email}`);
        }
      }
    } catch (emailError) {
      console.warn('⚠️  Error enviando email de inscripción:', emailError.message);
    }
    return res.json({
      success: true,
      message: 'InscripciÃ³n aceptada',
      data: {
        slot: assigned,
        horario: { inicio: assigned.fecha_hora_inicio, fin: assigned.fecha_hora_fin },
        evento_id: assigned.evento_id
      }
    });
  } catch (error) {
    try { await client.query('ROLLBACK'); } catch (e) {}
    console.error('Error inscribirSlot:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// Controlador para eliminar un alumno específico del slot
export const eliminarAlumnoDelSlot = async (req, res) => {
  const client = await getClient();
  try {
    const { slotId, alumnoId } = req.params;

    // Validar que el alumno en el slot es el que se intenta eliminar
    const slotRes = await client.query('SELECT * FROM slots WHERE id = $1', [slotId]);
    if (slotRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    }

    const slot = slotRes.rows[0];
    if (slot.alumno_id !== parseInt(alumnoId)) {
      return res.status(400).json({ success: false, message: 'El alumno no está inscrito en este slot' });
    }

    const result = await client.query(
      `UPDATE slots SET alumno_id = NULL, disponible = true WHERE id = $1 RETURNING *`,
      [slotId]
    );

    return res.json({ success: true, message: 'Alumno removido del slot', data: result.rows[0] });
  } catch (error) {
    console.error('Error eliminarAlumnoDelSlot:', error);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};

// Controlador para agregar un alumno a un slot (usado por profesor)
export const agregarAlumnoASlot = async (req, res) => {
  const client = await getClient();
  try {
    const slotId = parseInt(req.params.slotId, 10);
    const { alumnoId } = req.body;

    console.log('[agregarAlumnoASlot] slotId:', slotId, 'alumnoId:', alumnoId);

    if (!alumnoId || isNaN(slotId)) {
      return res.status(400).json({ success: false, message: 'alumnoId y slotId requeridos' });
    }

    // Validar que el slot existe
    const slotRes = await client.query('SELECT * FROM slots WHERE id = $1', [slotId]);
    if (slotRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Slot no encontrado' });
    }

    const slot = slotRes.rows[0];

    const result = await client.query(
      `UPDATE slots SET alumno_id = $1, disponible = false WHERE id = $2 RETURNING *`,
      [parseInt(alumnoId, 10), slotId]
    );

    return res.json({ success: true, message: 'Alumno agregado al slot', data: result.rows[0] });
  } catch (error) {
    console.error('Error agregarAlumnoASlot:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};
<<<<<<< HEAD

// Crear un slot individual manualmente
export const crearSlotIndividual = async (req, res) => {
  const client = await getClient();
  try {
    const { eventoId, fechaHoraInicio, fechaHoraFin } = req.body;

    if (!eventoId || !fechaHoraInicio || !fechaHoraFin) {
      return res.status(400).json({ success: false, message: 'eventoId, fechaHoraInicio y fechaHoraFin son requeridos' });
    }

    // Validar que el evento existe
    const eventoRes = await client.query('SELECT id FROM eventos WHERE id = $1', [eventoId]);
    if (eventoRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Evento no encontrado' });
    }

    // Validar que las fechas sean válidas
    const inicio = new Date(fechaHoraInicio);
    const fin = new Date(fechaHoraFin);

    if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) {
      return res.status(400).json({ success: false, message: 'Fechas inválidas' });
    }

    if (fin <= inicio) {
      return res.status(400).json({ success: false, message: 'La hora de fin debe ser posterior a la de inicio' });
    }

    // Crear el slot
    const result = await client.query(
      `INSERT INTO slots (evento_id, fecha_hora_inicio, fecha_hora_fin, disponible) 
       VALUES ($1, $2, $3, true) 
       RETURNING *`,
      [eventoId, fechaHoraInicio, fechaHoraFin]
    );

    return res.status(201).json({ 
      success: true, 
      message: 'Slot creado exitosamente', 
      data: result.rows[0] 
    });
  } catch (error) {
    console.error('Error crearSlotIndividual:', error.message);
    return res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
};
=======
>>>>>>> 235ac91d7ef2c47d55753f14ff7f1316b51f7726
