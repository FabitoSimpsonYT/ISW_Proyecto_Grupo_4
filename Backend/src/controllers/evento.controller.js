// src/controllers/evento.controller.js
import { query, getClient } from '../config/database.js';
import { notificarAlumnos as notificarAlumnosPorEmail } from '../services/notificacionuno.service.js';

class EventoController {
  // Crear evento
  crearEvento = async (req, res) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const {
        nombre,
        descripcion,
        estado = 'pendiente',
        comentario,
        tipoEvaluacion = 'escrita',
        tipoInscripcion = 'individual',
        numAlumnosOnline = null,
        tamanoGrupo = null,
        fechaInicio,
        fechaFin,
        tipoEvento,
        modalidad,
        linkOnline,
        ramoId,
        seccionId,
        duracionPorAlumno,
        cupoMaximo = 40,
        permiteParejas = false,
        sala
      } = req.body;

      const profesorId = req.user.id;

      if (!nombre || !fechaInicio || !fechaFin || !tipoEvento || !modalidad || !ramoId || !seccionId) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      }

      // Ajustes según tipo de inscripción
      if (tipoInscripcion === 'parejas') {
        permiteParejas = true;
      }

      let comentarioFinal = comentario || null;
      if (tipoInscripcion === 'grupos' && tamanoGrupo) {
        comentarioFinal = (comentarioFinal ? comentarioFinal + '\n' : '') + `grupo_size:${tamanoGrupo}`;
      }

      const result = await client.query(
        `INSERT INTO eventos 
        (nombre, descripcion, estado, comentario, fecha_inicio, fecha_fin, modalidad, link_online, 
         duracion_por_alumno, cupo_maximo, cupo_disponible, permite_parejas, sala, 
         tipo_evento_id, profesor_id, ramo_id, seccion_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *`,
        [nombre, descripcion, estado, comentarioFinal, fechaInicio, fechaFin, modalidad, linkOnline,
         duracionPorAlumno, cupoMaximo, cupoMaximo, permiteParejas, sala, tipoEvento, profesorId, ramoId, seccionId]
      );

      const evento = result.rows[0];

      // Si la evaluación es tipo 'escrita' inscribimos (o notificamos) automáticamente a los alumnos
      if (tipoEvaluacion === 'escrita') {
        try {
          let emailsRes;
          if (seccionId) {
            emailsRes = await client.query(
              `SELECT u.email FROM users u JOIN alumnos a ON a.id = u.id JOIN seccion_alumnos sa ON sa.alumno_id = a.id WHERE sa.seccion_id = $1`,
              [seccionId]
            );
          } else {
            emailsRes = await client.query(
              `SELECT u.email FROM users u JOIN alumnos a ON a.id = u.id JOIN seccion_alumnos sa ON sa.alumno_id = a.id JOIN secciones s ON s.id = sa.seccion_id WHERE s.ramo_id = $1`,
              [ramoId]
            );
          }

          const emails = emailsRes.rows.map(r => r.email).filter(Boolean);
          if (emails.length > 0) {
            await notificarAlumnosPorEmail(emails, `Nuevo evento: ${nombre}`, `Se ha creado el evento ${nombre} programado para ${fechaInicio}. Por favor revisa el sistema para más información.`, evento.id);
          }
        } catch (errNotify) {
          console.error('Error notificando alumnos para evento escrito:', errNotify);
          // no hacemos rollback por fallas en notificación
        }
      }

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        message: 'Evento creado exitosamente',
        data: evento
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creando evento:', error);
      res.status(500).json({ success: false, message: error.message || 'Error interno' });
    } finally {
      client.release();
    }
  };

  // Obtener eventos del profesor
  obtenerEventosProfesor = async (req, res) => {
    try {
      const profesorId = req.user.id;

      const result = await query(
        `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo AS ramo_codigo, r.nombre AS ramo_nombre, s.numero AS seccion_numero
         FROM eventos e
         JOIN tipos_eventos t ON e.tipo_evento_id = t.id
         LEFT JOIN ramos r ON e.ramo_id = r.id
         LEFT JOIN secciones s ON e.seccion_id = s.id
         WHERE e.profesor_id = $1
         ORDER BY e.fecha_inicio ASC`,
        [profesorId]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo eventos profesor:', error);
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  };

  // Obtener eventos del alumno
  obtenerEventosAlumno = async (req, res) => {
    try {
      const alumnoId = req.user.id;

      const result = await query(
        `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo AS ramo_codigo, r.nombre AS ramo_nombre, s.numero AS seccion_numero
         FROM eventos e
         JOIN tipos_eventos t ON e.tipo_evento_id = t.id
         LEFT JOIN ramos r ON e.ramo_id = r.id
         LEFT JOIN secciones s ON e.seccion_id = s.id
         JOIN seccion_alumnos sa ON sa.seccion_id = e.seccion_id
         WHERE sa.alumno_id = $1
         ORDER BY e.fecha_inicio ASC`,
        [alumnoId]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo eventos alumno:', error);
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  };

  // Actualizar evento
  actualizarEvento = async (req, res) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const profesorId = req.user.id;

      const check = await client.query('SELECT profesor_id FROM eventos WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado' });
      }
      if (check.rows[0].profesor_id !== profesorId && req.user.role !== 'jefe_carrera') {
        return res.status(403).json({ success: false, message: 'Sin permiso' });
      }

      const data = req.body;

      if (data.estado === 'cancelado' && (!data.comentario || data.comentario.trim() === '')) {
        return res.status(400).json({ success: false, message: 'Comentario obligatorio para cancelar' });
      }

      const fields = [];
      const values = [];
      let index = 1;

      if (data.nombre) { fields.push(`nombre = $${index++}`); values.push(data.nombre); }
      if (data.descripcion !== undefined) { fields.push(`descripcion = $${index++}`); values.push(data.descripcion); }
      if (data.estado) { fields.push(`estado = $${index++}`); values.push(data.estado); }
      if (data.comentario !== undefined) { fields.push(`comentario = $${index++}`); values.push(data.comentario); }
      if (data.fechaInicio) { fields.push(`fecha_inicio = $${index++}`); values.push(data.fechaInicio); }
      if (data.fechaFin) { fields.push(`fecha_fin = $${index++}`); values.push(data.fechaFin); }
      if (data.modalidad) { fields.push(`modalidad = $${index++}`); values.push(data.modalidad); }
      if (data.linkOnline !== undefined) { fields.push(`link_online = $${index++}`); values.push(data.linkOnline); }
      if (data.duracionPorAlumno !== undefined) { fields.push(`duracion_por_alumno = $${index++}`); values.push(data.duracionPorAlumno); }
      if (data.cupoMaximo !== undefined) { fields.push(`cupo_maximo = $${index++}`); values.push(data.cupoMaximo); fields.push(`cupo_disponible = $${index}`); values.push(data.cupoMaximo); index++; }
      if (data.permiteParejas !== undefined) { fields.push(`permite_parejas = $${index++}`); values.push(data.permiteParejas); }
      if (data.sala !== undefined) { fields.push(`sala = $${index++}`); values.push(data.sala); }
      if (data.tipoEvento) { fields.push(`tipo_evento_id = $${index++}`); values.push(data.tipoEvento); }

      if (fields.length === 0) {
        return res.status(400).json({ success: false, message: 'No hay datos para actualizar' });
      }

      values.push(id);

      const result = await client.query(
        `UPDATE eventos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${index} RETURNING *`,
        values
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Evento actualizado',
        data: result.rows[0]
      });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, message: error.message });
    } finally {
      client.release();
    }
  };

  // Eliminar evento
  eliminarEvento = async (req, res) => {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      const { id } = req.params;
      const profesorId = req.user.id;

      const check = await client.query('SELECT profesor_id FROM eventos WHERE id = $1', [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado' });
      }
      if (check.rows[0].profesor_id !== profesorId && req.user.role !== 'jefe_carrera') {
        return res.status(403).json({ success: false, message: 'Sin permiso' });
      }

      await client.query('DELETE FROM eventos WHERE id = $1', [id]);

      await client.query('COMMIT');

      res.json({ success: true, message: 'Evento eliminado' });
    } catch (error) {
      await client.query('ROLLBACK');
      res.status(500).json({ success: false, message: error.message });
    } finally {
      client.release();
    }
  };
}

export default new EventoController();