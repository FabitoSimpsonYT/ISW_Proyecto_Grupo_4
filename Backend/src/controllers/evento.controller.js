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
        fechaRangoInicio,
        fechaRangoFin,
        horaInicioDiaria,
        horaFinDiaria,
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

      // Resolver profesorId desde token, con fallback a búsqueda por RUT si el token viejo no incluye `id`
      let profesorId = req.user?.id;
      if (!profesorId) {
        const rutFromToken = req.user?.rut || req.user?.sub;
        if (rutFromToken) {
          try {
            const userRes = await client.query('SELECT id FROM users WHERE rut = $1 LIMIT 1', [rutFromToken]);
            if (userRes.rows.length > 0) {
              profesorId = userRes.rows[0].id;
            }
          } catch (errSearchUser) {
            console.error('Error buscando usuario por rut para profesorId fallback:', errSearchUser);
          }
        }
      }

      if (!profesorId) {
        return res.status(400).json({ success: false, message: 'No se pudo determinar el profesor (token inválido).' });
      }

      // Guardar valor original de ramoId para validaciones previas
      const ramoIdInput = ramoId;
      if (!nombre || !fechaInicio || !fechaFin || !tipoEvento || !modalidad || !ramoIdInput || !seccionId) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
      }

      // Resolver ramoId: puede venir como id numérico o como codigo (string). Asegurar que exista en tabla ramos.
      let ramoIdResolved = null;
      try {
        // Si viene numérico, intentar encontrar por id
        if (!isNaN(Number(ramoId))) {
          const rres = await client.query('SELECT id FROM ramos WHERE id = $1 LIMIT 1', [Number(ramoId)]);
          if (rres.rows.length > 0) ramoIdResolved = rres.rows[0].id;
        }

        // Si no resuelto, intentar buscar por codigo
        if (!ramoIdResolved) {
          const rres2 = await client.query('SELECT id FROM ramos WHERE codigo = $1 LIMIT 1', [ramoId]);
          if (rres2.rows.length > 0) ramoIdResolved = rres2.rows[0].id;
        }
      } catch (errFindRamo) {
        console.error('Error buscando ramo para crear evento:', errFindRamo);
      }

      if (!ramoIdResolved) {
        return res.status(400).json({ success: false, message: `Ramo no encontrado: ${ramoIdInput}` });
      }

      // Validar que la sección exista y pertenezca al ramo
      try {
        const sres = await client.query('SELECT id FROM secciones WHERE id = $1 AND ramo_id = $2 LIMIT 1', [Number(seccionId), ramoIdResolved]);
        if (sres.rows.length === 0) {
          return res.status(400).json({ success: false, message: `Sección ${seccionId} no pertenece al ramo seleccionado` });
        }
      } catch (errCheckSeccion) {
        console.error('Error validando sección para crear evento:', errCheckSeccion);
      }

      // Use ramoIdResolved como id final del ramo para inserción
      const ramoIdFinal = ramoIdResolved;

      // Ajustes según tipo de inscripción
      if (tipoInscripcion === 'parejas') {
        permiteParejas = true;
      }

      let comentarioFinal = comentario || null;
      if (tipoInscripcion === 'grupos' && tamanoGrupo) {
        comentarioFinal = (comentarioFinal ? comentarioFinal + '\n' : '') + `grupo_size:${tamanoGrupo}`;
      }

      // Usar placeholders secuenciales y explícitos para evitar desajustes en el número
      const result = await client.query(
        `INSERT INTO eventos 
        (nombre, descripcion, estado, comentario, fecha_inicio, fecha_fin, fecha_rango_inicio, fecha_rango_fin, 
         hora_inicio_diaria, hora_fin_diaria, modalidad, link_online, 
         duracion_por_alumno, cupo_maximo, cupo_disponible, permite_parejas, sala, 
         tipo_evento_id, profesor_id, ramo_id, seccion_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *`,
        [nombre, descripcion, estado, comentarioFinal, fechaInicio, fechaFin, 
         fechaRangoInicio || null, fechaRangoFin || null, horaInicioDiaria || null, horaFinDiaria || null,
         modalidad, linkOnline, duracionPorAlumno, cupoMaximo, cupoMaximo, permiteParejas, sala, 
         tipoEvento, profesorId, ramoIdFinal, seccionId]
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
              [ramoIdFinal]
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

      // Obtener eventos del profesor
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

      // Obtener slots para cada evento
      const eventosConSlots = await Promise.all(
        result.rows.map(async (evento) => {
          const slotsResult = await query(
            `SELECT 
              s.id, 
              s.evento_id, 
              DATE(s.fecha_hora_inicio) as fecha,
              TO_CHAR(s.fecha_hora_inicio, 'HH24:MI') as hora_inicio,
              TO_CHAR(s.fecha_hora_fin, 'HH24:MI') as hora_fin,
              s.disponible,
              s.alumno_id,
              u.id as alumno_id_user,
              u.nombres as alumno_nombres,
              u."apellidoPaterno",
              u."apellidoMaterno",
              u.rut as alumno_rut
             FROM slots s
             LEFT JOIN users u ON s.alumno_id = u.id
             WHERE s.evento_id = $1
             ORDER BY s.fecha_hora_inicio ASC`,
            [evento.id]
          );
          
          // Agrupar slots y sus alumnos
          const slotsMap = {};
          slotsResult.rows.forEach(row => {
            if (!slotsMap[row.id]) {
              slotsMap[row.id] = {
                id: row.id,
                evento_id: row.evento_id,
                fecha: row.fecha,
                hora_inicio: row.hora_inicio,
                hora_fin: row.hora_fin,
                disponible: row.disponible,
                bloqueado: false,
                capacidad_maxima: 1,
                inscriptos: []
              };
            }
            
            if (row.alumno_id_user) {
              slotsMap[row.id].inscriptos.push({
                id: row.alumno_id_user,
                nombres: row.alumno_nombres,
                apellidoPaterno: row.apellidoPaterno,
                apellidoMaterno: row.apellidoMaterno,
                rut: row.alumno_rut
              });
            }
          });
          
          const slotsTransformados = Object.values(slotsMap);
          
          return {
            ...evento,
            slots: slotsTransformados
          };
        })
      );

      res.json({
        success: true,
        data: eventosConSlots
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
      const alumnoRut = req.user?.rut || null;

      // ✅ MEJORADO: Mostrar eventos SOLO si:
      // 1. El alumno está inscrito en la SECCIÓN del evento
      // 2. El alumno está inscrito en el RAMO (a través de la sección)
      // 3. Para slots: debe estar inscrito en al menos 1 slot
      const result = await query(
        `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo AS ramo_codigo, r.nombre AS ramo_nombre, s.numero AS seccion_numero,
                CASE WHEN EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1 AND disponible = false) THEN true ELSE false END as alumno_inscrito
         FROM eventos e
         JOIN tipos_eventos t ON e.tipo_evento_id = t.id
         LEFT JOIN ramos r ON e.ramo_id = r.id
         LEFT JOIN secciones s ON e.seccion_id = s.id
         WHERE e.seccion_id IS NOT NULL
         AND e.ramo_id IS NOT NULL
         AND EXISTS(
           -- Verificar que el alumno está en la sección
           SELECT 1 FROM seccion_alumnos sa 
           WHERE sa.seccion_id = e.seccion_id 
           AND (sa.alumno_id = $1 OR EXISTS(SELECT 1 FROM users u WHERE u.rut = $2 AND u.id = sa.alumno_id))
         )
         AND EXISTS(
           -- Verificar que la sección pertenece al ramo
           SELECT 1 FROM secciones sec
           WHERE sec.id = e.seccion_id
           AND sec.ramo_id = e.ramo_id
         )
         ORDER BY e.fecha_inicio ASC`,
        [alumnoId, alumnoRut]
      );

      // Filtrar eventos:
      // - Si el evento tiene `duracion_por_alumno` (evaluación por slots): mostrar solo si alumno_inscrito = true
      // - En caso contrario (evaluación escrita/u otro): mostrar siempre
      const eventosFiltrados = result.rows.filter(e => {
        if (e.duracion_por_alumno && Number(e.duracion_por_alumno) > 0) {
          return e.alumno_inscrito === true;
        }
        return true;
      });

      res.json({
        success: true,
        data: eventosFiltrados
      });
    } catch (error) {
      console.error('Error obteniendo eventos alumno:', error);
      res.status(500).json({ success: false, message: 'Error interno' });
    }
  };

  // Obtener eventos disponibles para inscripción por slots (alumno)
  obtenerEventosDisponiblesSlots = async (req, res) => {
    try {
      const alumnoId = req.user.id;
      const alumnoRut = req.user?.rut || null;

      const isDev = process.env.NODE_ENV === 'development';

      // En development permitimos ver evaluaciones por slots aunque el alumno no esté en la sección
      if (isDev) {
        const q = `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo AS ramo_codigo, r.nombre AS ramo_nombre, s.numero AS seccion_numero,
                    CASE WHEN EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1) THEN true ELSE false END as alumno_inscrito
                   FROM eventos e
                   JOIN tipos_eventos t ON e.tipo_evento_id = t.id
                   LEFT JOIN ramos r ON e.ramo_id = r.id
                   LEFT JOIN secciones s ON e.seccion_id = s.id
                   WHERE e.duracion_por_alumno IS NOT NULL AND e.duracion_por_alumno > 0 AND NOT EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1)
                   ORDER BY e.fecha_inicio ASC`;

        const result = await query(q, [alumnoId]);
        return res.json({ success: true, data: result.rows, note: 'development bypass: mostrando eventos por slots sin validar sección' });
      }

      // Modo normal: mostrar solo eventos por slots pertenecientes a las secciones del alumno
      const result = await query(
        `SELECT e.*, t.nombre as tipo_nombre, t.color, r.codigo AS ramo_codigo, r.nombre AS ramo_nombre, s.numero AS seccion_numero,
                CASE WHEN EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1) THEN true ELSE false END as alumno_inscrito
         FROM eventos e
         JOIN tipos_eventos t ON e.tipo_evento_id = t.id
         LEFT JOIN ramos r ON e.ramo_id = r.id
         LEFT JOIN secciones s ON e.seccion_id = s.id
         JOIN seccion_alumnos sa ON sa.seccion_id = e.seccion_id
         WHERE (sa.alumno_id = $1 OR EXISTS(SELECT 1 FROM users u WHERE u.rut = $2 AND u.id = sa.alumno_id)) AND e.duracion_por_alumno IS NOT NULL AND e.duracion_por_alumno > 0 AND NOT EXISTS(SELECT 1 FROM slots WHERE evento_id = e.id AND alumno_id = $1)
         ORDER BY e.fecha_inicio ASC`,
        [alumnoId, alumnoRut]
      );

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error obteniendo eventos disponibles slots:', error);
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
      if (check.rows[0].profesor_id !== profesorId && req.user.role !== 'jefecarrera') {
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
      if (data.fechaRangoInicio) { fields.push(`fecha_rango_inicio = $${index++}`); values.push(data.fechaRangoInicio); }
      if (data.fechaRangoFin) { fields.push(`fecha_rango_fin = $${index++}`); values.push(data.fechaRangoFin); }
      if (data.horaInicioDiaria) { fields.push(`hora_inicio_diaria = $${index++}`); values.push(data.horaInicioDiaria); }
      if (data.horaFinDiaria) { fields.push(`hora_fin_diaria = $${index++}`); values.push(data.horaFinDiaria); }
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
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ success: false, message: 'ID del evento no especificado' });
      }

      console.log('[eliminarEvento] ID:', id, 'Usuario:', req.user?.id);

      // Obtener el evento
      const eventoRes = await client.query(
        'SELECT id, profesor_id FROM eventos WHERE id = $1',
        [id]
      );

      if (eventoRes.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Evento no encontrado' });
      }

      // Validar permiso
      const profesorId = req.user?.id;
      const eventoProfesorId = eventoRes.rows[0].profesor_id;

      if (profesorId !== eventoProfesorId && req.user?.role !== 'jefecarrera') {
        return res.status(403).json({ success: false, message: 'No tienes permiso' });
      }

      console.log('[eliminarEvento] Iniciando eliminación en cascada');

      // PASO 1: Obtener todos los IDs de slots del evento
      const slotsRes = await client.query(
        'SELECT id FROM slots WHERE evento_id = $1',
        [id]
      );
      const slotIds = slotsRes.rows.map(row => row.id);
      console.log('[eliminarEvento] Slots encontrados:', slotIds.length);

      // PASO 2: Eliminar cualquier relación con los slots (ej: bookings, inscripciones, etc)
      if (slotIds.length > 0) {
        // Crear placeholders para el query
        const placeholders = slotIds.map((_, i) => `$${i + 1}`).join(',');
        
        // Intentar eliminar bookings
        try {
          await client.query(`DELETE FROM bookings WHERE slot_id IN (${placeholders})`, slotIds);
          console.log('[eliminarEvento] Bookings eliminados');
        } catch (e) {
          console.log('[eliminarEvento] Bookings: tabla no existe o sin registros');
        }

        // Intentar eliminar inscripciones
        try {
          await client.query(`DELETE FROM inscripcion WHERE slot_id IN (${placeholders})`, slotIds);
          console.log('[eliminarEvento] Inscripciones eliminadas');
        } catch (e) {
          console.log('[eliminarEvento] Inscripciones: tabla no existe o sin registros');
        }

        // Intentar eliminar alumno_slots
        try {
          await client.query(`DELETE FROM alumno_slots WHERE slot_id IN (${placeholders})`, slotIds);
          console.log('[eliminarEvento] Alumno slots eliminados');
        } catch (e) {
          console.log('[eliminarEvento] Alumno slots: tabla no existe o sin registros');
        }
      }

      // PASO 3: Eliminar los slots
      await client.query('DELETE FROM slots WHERE evento_id = $1', [id]);
      console.log('[eliminarEvento] Slots eliminados');

      // PASO 4: Intentar eliminar pautas y sus relaciones
      try {
        await client.query('DELETE FROM pauta_evaluadas WHERE evento_id = $1', [id]);
        console.log('[eliminarEvento] Pautas evaluadas eliminadas');
      } catch (e) {
        console.log('[eliminarEvento] Pautas evaluadas: ' + e.message);
      }

      try {
        await client.query('DELETE FROM pautas WHERE evento_id = $1', [id]);
        console.log('[eliminarEvento] Pautas eliminadas');
      } catch (e) {
        console.log('[eliminarEvento] Pautas: ' + e.message);
      }

      // PASO 5: Eliminar bloqueos
      try {
        await client.query('DELETE FROM bloqueos WHERE evento_id = $1', [id]);
        console.log('[eliminarEvento] Bloqueos eliminados');
      } catch (e) {
        console.log('[eliminarEvento] Bloqueos: ' + e.message);
      }

      // PASO 6: Finalmente eliminar el evento
      const deleteRes = await client.query(
        'DELETE FROM eventos WHERE id = $1 RETURNING *',
        [id]
      );

      if (deleteRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: 'No se pudo eliminar el evento' });
      }

      console.log('[eliminarEvento] ✅ Evento eliminado exitosamente');

      return res.json({
        success: true,
        message: 'Evento eliminado correctamente',
        data: deleteRes.rows[0]
      });

    } catch (error) {
      console.error('[eliminarEvento] Error:', error.message);
      console.error('[eliminarEvento] Code:', error.code);
      console.error('[eliminarEvento] Detail:', error.detail);

      return res.status(500).json({
        success: false,
        message: error.message || 'Error al eliminar el evento'
      });

    } finally {
      client.release();
    }
  };
}

export default new EventoController();