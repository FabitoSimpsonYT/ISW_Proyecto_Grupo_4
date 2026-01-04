import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_key_isw_2024';

class NotificacionesHandler {
  constructor() {
    // Estructura: { userId: [{ tipo, mensaje, datos, timestamp }] }
    this.notificaciones = new Map();
    // Estructura: { userId: socket }
    this.usuariosConectados = new Map();
  }

  initialize(io) {
    io.on("connection", (socket) => {
      console.log(`[Notificaciones WebSocket] Usuario conectado: ${socket.id}`);

      // Conectar usuario a sala de notificaciones
      socket.on("join-notificaciones", async (data) => {
        try {
          const { token, userId: userIdFromFrontend } = data;

          if (!token) {
            socket.emit("error", { message: "Token requerido" });
            return;
          }

          let user;
          try {
            user = jwt.verify(token, JWT_SECRET);
            const userId = userIdFromFrontend || user.id;
            
            // Unirse a sala personal
            const sala = `user-${userId}`;
            socket.join(sala);
            
            // Guardar conexión
            this.usuariosConectados.set(userId, socket);
            
            console.log(`✓ Usuario ${userId} conectado a notificaciones (socket: ${socket.id})`);

            // Enviar notificaciones pendientes
            this.enviarNotificacionesPendientes(io, userId);

          } catch (err) {
            console.error('❌ Error verificando token:', err.message);
            socket.emit("error", { message: "Token inválido" });
          }
        } catch (error) {
          console.error('❌ Error en join-notificaciones:', error);
          socket.emit("error", { message: error.message });
        }
      });

      socket.on("disconnect", () => {
        console.log(`[Notificaciones WebSocket] Usuario desconectado: ${socket.id}`);
        // Limpiar conexión
        for (const [userId, userSocket] of this.usuariosConectados.entries()) {
          if (userSocket.id === socket.id) {
            this.usuariosConectados.delete(userId);
            console.log(`✓ Conexión de usuario ${userId} removida`);
          }
        }
      });
    });
  }

  // Notificar creación de evaluación
  notificarEvaluacionCreada(io, evaluacion, alumnosANotificar) {
    const notificacion = {
      tipo: 'evaluacion.creada',
      titulo: 'Nueva Evaluación',
      mensaje: `Se ha creado una nueva evaluación: ${evaluacion.titulo}`,
      datos: {
        evaluacionId: evaluacion.id,
        titulo: evaluacion.titulo,
        ramo: evaluacion.codigoRamo,
        fecha: evaluacion.fechaProgramada,
        horaInicio: evaluacion.horaInicio,
      },
      timestamp: new Date(),
      leida: false,
    };

    alumnosANotificar.forEach(alumnoId => {
      this.guardarNotificacion(alumnoId, notificacion);
      const sala = `user-${alumnoId}`;
      io.to(sala).emit('notificacion-nueva', notificacion);
    });

    console.log(`✓ Notificación de evaluación creada enviada a ${alumnosANotificar.length} alumnos`);
  }

  // Notificar modificación de evaluación
  notificarEvaluacionModificada(io, evaluacion, alumnosANotificar, cambios) {
    const notificacion = {
      tipo: 'evaluacion.modificada',
      titulo: 'Evaluación Modificada',
      mensaje: `La evaluación "${evaluacion.titulo}" ha sido modificada`,
      datos: {
        evaluacionId: evaluacion.id,
        titulo: evaluacion.titulo,
        cambios: cambios,
        fecha: evaluacion.fechaProgramada,
        horaInicio: evaluacion.horaInicio,
      },
      timestamp: new Date(),
      leida: false,
    };

    alumnosANotificar.forEach(alumnoId => {
      this.guardarNotificacion(alumnoId, notificacion);
      const sala = `user-${alumnoId}`;
      io.to(sala).emit('notificacion-nueva', notificacion);
    });

    console.log(`✓ Notificación de evaluación modificada enviada a ${alumnosANotificar.length} alumnos`);
  }

  // Notificar cancelación de evaluación
  notificarEvaluacionCancelada(io, evaluacion, alumnosANotificar) {
    const notificacion = {
      tipo: 'evaluacion.cancelada',
      titulo: 'Evaluación Cancelada',
      mensaje: `La evaluación "${evaluacion.titulo}" ha sido cancelada`,
      datos: {
        evaluacionId: evaluacion.id,
        titulo: evaluacion.titulo,
        razon: 'Cancelado por el profesor',
      },
      timestamp: new Date(),
      leida: false,
    };

    alumnosANotificar.forEach(alumnoId => {
      this.guardarNotificacion(alumnoId, notificacion);
      const sala = `user-${alumnoId}`;
      io.to(sala).emit('notificacion-nueva', notificacion);
    });

    console.log(`✓ Notificación de evaluación cancelada enviada a ${alumnosANotificar.length} alumnos`);
  }

  // Notificar inscripción de alumno a slot
  notificarAlumnoInscritoSlot(io, alumnoId, evaluacion, slot) {
    const notificacion = {
      tipo: 'alumno.inscrito-slot',
      titulo: 'Inscripción Confirmada',
      mensaje: `Te has inscrito en el slot de "${evaluacion.titulo}"`,
      datos: {
        evaluacionId: evaluacion.id,
        slotId: slot.id,
        titulo: evaluacion.titulo,
        fecha: slot.fecha,
        horaInicio: slot.horaInicio,
        horaFin: slot.horaFin,
        capacidad: slot.capacidadMaxima,
        inscritos: slot.inscritos?.length || 0,
      },
      timestamp: new Date(),
      leida: false,
    };

    this.guardarNotificacion(alumnoId, notificacion);
    const sala = `user-${alumnoId}`;
    io.to(sala).emit('notificacion-nueva', notificacion);

    console.log(`✓ Notificación de inscripción enviada a alumno ${alumnoId}`);
  }

  // Notificar slot abierto
  notificarSlotAbierto(io, evaluacion, alumnosANotificar, slot) {
    const notificacion = {
      tipo: 'slot.abierto',
      titulo: 'Nuevo Slot Disponible',
      mensaje: `Se ha abierto un nuevo slot para "${evaluacion.titulo}"`,
      datos: {
        evaluacionId: evaluacion.id,
        slotId: slot.id,
        titulo: evaluacion.titulo,
        fecha: slot.fecha,
        horaInicio: slot.horaInicio,
        horaFin: slot.horaFin,
        capacidad: slot.capacidadMaxima,
      },
      timestamp: new Date(),
      leida: false,
    };

    alumnosANotificar.forEach(alumnoId => {
      this.guardarNotificacion(alumnoId, notificacion);
      const sala = `user-${alumnoId}`;
      io.to(sala).emit('notificacion-nueva', notificacion);
    });

    console.log(`✓ Notificación de slot abierto enviada a ${alumnosANotificar.length} alumnos`);
  }

  // Notificar recordatorio de evaluación próxima
  notificarRecordatorioProximo(io, alumnoId, evaluacion, slot) {
    const notificacion = {
      tipo: 'recordatorio.proximo',
      titulo: 'Recordatorio: Evaluación Próxima',
      mensaje: `Tienes una evaluación próxima: "${evaluacion.titulo}"`,
      datos: {
        evaluacionId: evaluacion.id,
        slotId: slot.id,
        titulo: evaluacion.titulo,
        fecha: slot.fecha,
        horaInicio: slot.horaInicio,
        horasRestantes: this.calcularHorasRestantes(slot.fecha, slot.horaInicio),
      },
      timestamp: new Date(),
      leida: false,
      urgencia: 'alta',
    };

    this.guardarNotificacion(alumnoId, notificacion);
    const sala = `user-${alumnoId}`;
    io.to(sala).emit('notificacion-nueva', notificacion);

    console.log(`✓ Notificación de recordatorio enviada a alumno ${alumnoId}`);
  }

  // Notificar cambio de horario confirmado
  notificarCambioHorarioConfirmado(io, alumnoId, evaluacion, slotAnterior, slotNuevo) {
    const notificacion = {
      tipo: 'cambio.horario-confirmado',
      titulo: 'Cambio de Horario Confirmado',
      mensaje: `Tu horario en "${evaluacion.titulo}" ha sido modificado`,
      datos: {
        evaluacionId: evaluacion.id,
        slotAnterior: {
          fecha: slotAnterior.fecha,
          horaInicio: slotAnterior.horaInicio,
          horaFin: slotAnterior.horaFin,
        },
        slotNuevo: {
          fecha: slotNuevo.fecha,
          horaInicio: slotNuevo.horaInicio,
          horaFin: slotNuevo.horaFin,
        },
      },
      timestamp: new Date(),
      leida: false,
    };

    this.guardarNotificacion(alumnoId, notificacion);
    const sala = `user-${alumnoId}`;
    io.to(sala).emit('notificacion-nueva', notificacion);

    console.log(`✓ Notificación de cambio de horario enviada a alumno ${alumnoId}`);
  }

  // Métodos auxiliares
  guardarNotificacion(usuarioId, notificacion) {
    if (!this.notificaciones.has(usuarioId)) {
      this.notificaciones.set(usuarioId, []);
    }
    const notificacionConId = {
      ...notificacion,
      id: `notif-${usuarioId}-${Date.now()}-${Math.random()}`,
    };
    this.notificaciones.get(usuarioId).push(notificacionConId);
    
    // Mantener solo las últimas 50 notificaciones
    if (this.notificaciones.get(usuarioId).length > 50) {
      this.notificaciones.get(usuarioId).shift();
    }
  }

  enviarNotificacionesPendientes(io, usuarioId) {
    const notificaciones = this.notificaciones.get(usuarioId) || [];
    if (notificaciones.length > 0) {
      const sala = `user-${usuarioId}`;
      io.to(sala).emit('notificaciones-pendientes', notificaciones);
      console.log(`✓ Enviadas ${notificaciones.length} notificaciones pendientes a usuario ${usuarioId}`);
    }
  }

  calcularHorasRestantes(fecha, horaInicio) {
    const ahora = new Date();
    const evaluacion = new Date(`${fecha}T${horaInicio}`);
    return Math.max(0, Math.round((evaluacion - ahora) / (1000 * 60 * 60)));
  }

  marcarComoLeida(usuarioId, notificacionId) {
    const notificaciones = this.notificaciones.get(usuarioId);
    if (notificaciones) {
      const notif = notificaciones.find(n => n.id === notificacionId);
      if (notif) {
        notif.leida = true;
      }
    }
  }

  obtenerNotificacionesUsuario(usuarioId) {
    return this.notificaciones.get(usuarioId) || [];
  }
}

export default new NotificacionesHandler();
