/**
 * Servicio de Notificaciones Personalizadas por Rol
 * Maneja notificaciones diferentes según el tipo de usuario
 */

export class NotificacionesPersonalizadas {
  constructor(io) {
    this.io = io;
  }

  /**
   * Enviar notificación a un usuario específico
   * @param {number} userId - ID del usuario
   * @param {string} message - Mensaje de notificación
   * @param {string} type - Tipo: 'success', 'error', 'warning', 'info'
   * @param {object} data - Datos adicionales (ramo, fecha, etc)
   */
  enviarNotificacion(userId, message, type = 'info', data = {}) {
    if (!this.io) return;

    const notificacion = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date(),
      data
    };

    // Emitir a sala personal del usuario
    this.io.to(`user-${userId}`).emit('notification', notificacion);
  }

  /**
   * Notificación cuando se crea una inscripción a un ramo
   * PARA: Profesor
   * CUANDO: Un alumno se inscribe a su ramo
   */
  notificacionRamoInscrito(profesorId, nombreAlumno, nombreRamo, codigoRamo) {
    this.enviarNotificacion(
      profesorId,
      `Nuevo alumno inscrito: ${nombreAlumno} en ${nombreRamo}`,
      'info',
      {
        tipo: 'ramoInscrito',
        nombreAlumno,
        nombreRamo,
        codigoRamo,
        fecha: new Date()
      }
    );
  }

  /**
   * Notificación cuando se crean días bloqueados
   * PARA: Profesor y Alumno
   * CUANDO: Jefe carrera bloquea días
   */
  notificacionDiasBloqueados(usuarioIds, fechaInicio, fechaFin, razonesBloqueo = 'Bloqueado por jefatura') {
    const mensaje = `Días bloqueados: ${new Date(fechaInicio).toLocaleDateString('es-ES')} al ${new Date(fechaFin).toLocaleDateString('es-ES')}`;

    usuarioIds.forEach(userId => {
      this.enviarNotificacion(
        userId,
        mensaje,
        'warning',
        {
          tipo: 'diasBloqueados',
          fechaInicio,
          fechaFin,
          razon: razonesBloqueo,
          fecha: new Date()
        }
      );
    });
  }

  /**
   * Notificación de certamen creado
   * PARA: Alumno
   * CUANDO: Se crea una evaluación/certamen
   */
  notificacionCertamenCreado(alumnoId, nombreCertamen, nombreRamo, fecha, modalidad = 'presencial') {
    const fechaFormato = new Date(fecha).toLocaleDateString('es-ES', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    this.enviarNotificacion(
      alumnoId,
      `Nuevo ${nombreCertamen} en ${nombreRamo} (${fechaFormato})`,
      'info',
      {
        tipo: 'certamenCreado',
        nombreCertamen,
        nombreRamo,
        fecha,
        modalidad,
        horaCreacion: new Date()
      }
    );
  }

  /**
   * Notificación de certamen con slots disponibles
   * PARA: Alumno
   * CUANDO: Se abre inscripción de slots para una evaluación
   */
  notificacionSlotsCertamen(alumnoId, nombreCertamen, nombreRamo, cantidadSlots, fechaInicio) {
    this.enviarNotificacion(
      alumnoId,
      `${nombreCertamen} en ${nombreRamo}: ${cantidadSlots} slots disponibles`,
      'success',
      {
        tipo: 'slotsDisponibles',
        nombreCertamen,
        nombreRamo,
        cantidadSlots,
        fechaInicio,
        horaNotificacion: new Date()
      }
    );
  }

  /**
   * Notificación cuando se cancela un certamen
   * PARA: Alumno
   * CUANDO: Profesor cancela una evaluación
   */
  notificacionCertamenCancelado(alumnoId, nombreCertamen, nombreRamo, motivo = '') {
    let mensaje = `${nombreCertamen} en ${nombreRamo} ha sido cancelado`;
    if (motivo) {
      mensaje += ` - ${motivo}`;
    }

    this.enviarNotificacion(
      alumnoId,
      mensaje,
      'warning',
      {
        tipo: 'certamenCancelado',
        nombreCertamen,
        nombreRamo,
        motivo,
        fecha: new Date()
      }
    );
  }

  /**
   * Notificación cuando se reprograma un certamen
   * PARA: Alumno
   * CUANDO: Se cambia la fecha de un certamen
   */
  notificacionCertamenReprogramado(alumnoId, nombreCertamen, nombreRamo, fechaAnterior, fechaNueva, motivo = '') {
    const fechaAnt = new Date(fechaAnterior).toLocaleDateString('es-ES');
    const fechaNue = new Date(fechaNueva).toLocaleDateString('es-ES');

    let mensaje = `${nombreCertamen} (${nombreRamo}): Reprogramado de ${fechaAnt} a ${fechaNue}`;
    if (motivo) {
      mensaje += ` - ${motivo}`;
    }

    this.enviarNotificacion(
      alumnoId,
      mensaje,
      'info',
      {
        tipo: 'certamenReprogramado',
        nombreCertamen,
        nombreRamo,
        fechaAnterior,
        fechaNueva,
        motivo,
        fecha: new Date()
      }
    );
  }

  /**
   * Notificación cuando se califica un certamen
   * PARA: Alumno
   * CUANDO: Profesor publica calificaciones
   */
  notificacionCalificacionPublicada(alumnoId, nombreCertamen, nombreRamo, puntaje, notaFinal) {
    this.enviarNotificacion(
      alumnoId,
      `Calificación publicada: ${nombreCertamen} (${nombreRamo}) - Nota: ${notaFinal}`,
      'success',
      {
        tipo: 'calificacionPublicada',
        nombreCertamen,
        nombreRamo,
        puntaje,
        notaFinal,
        fecha: new Date()
      }
    );
  }

  /**
   * Notificación para profesor cuando se califica
   * PARA: Profesor
   * CUANDO: Sistema califica automáticamente o se revisan pautas
   */
  notificacionCalificacionesListas(profesorId, nombreCertamen, nombreRamo, cantidadAlumnos) {
    this.enviarNotificacion(
      profesorId,
      `Calificaciones listas para publicar: ${nombreCertamen} (${cantidadAlumnos} alumnos)`,
      'info',
      {
        tipo: 'calificacionesListas',
        nombreCertamen,
        nombreRamo,
        cantidadAlumnos,
        fecha: new Date()
      }
    );
  }

  /**
   * Notificación de apelación recibida
   * PARA: Profesor
   * CUANDO: Un alumno apela su calificación
   */
  notificacionApelacionRecibida(profesorId, nombreAlumno, nombreCertamen, nombreRamo) {
    this.enviarNotificacion(
      profesorId,
      `Apelación recibida: ${nombreAlumno} apela ${nombreCertamen} (${nombreRamo})`,
      'warning',
      {
        tipo: 'apelacionRecibida',
        nombreAlumno,
        nombreCertamen,
        nombreRamo,
        fecha: new Date()
      }
    );
  }

  /**
   * Notificación de resultado de apelación
   * PARA: Alumno
   * CUANDO: Profesor responde a apelación
   */
  notificacionResultadoApelacion(alumnoId, nombreCertamen, nombreRamo, resultado, notaNueva = null) {
    let mensaje = `Apelación resuelta: ${nombreCertamen} (${nombreRamo}) - ${resultado}`;
    if (notaNueva) {
      mensaje += ` - Nueva nota: ${notaNueva}`;
    }

    this.enviarNotificacion(
      alumnoId,
      mensaje,
      resultado.toLowerCase().includes('aprobada') ? 'success' : 'info',
      {
        tipo: 'resultadoApelacion',
        nombreCertamen,
        nombreRamo,
        resultado,
        notaNueva,
        fecha: new Date()
      }
    );
  }

  /**
   * Enviar notificación a múltiples usuarios (broadcast)
   * PARA: Jefe carrera - Anuncios generales
   */
  notificacionBroadcast(rol, mensaje, tipo = 'info', data = {}) {
    this.io.emit('notification-broadcast', {
      rol, // 'profesor', 'alumno', 'jefe', o 'todos'
      message: mensaje,
      type: tipo,
      timestamp: new Date(),
      data
    });
  }

  /**
   * Notificación de cambio de estado de evaluación
   * PARA: Alumno y Profesor
   * CUANDO: Se cambia el estado (confirmado, cancelado, reagendado)
   */
  notificacionCambioEstadoEvaluacion(usuarioIds, nombreEvaluacion, nombreRamo, estadoAnterior, estadoNuevo, motivo = '') {
    const mensaje = `${nombreEvaluacion} (${nombreRamo}): Estado cambió de ${estadoAnterior} a ${estadoNuevo}`;

    usuarioIds.forEach(userId => {
      const tipo = estadoNuevo === 'cancelado' ? 'warning' : 'info';
      
      this.enviarNotificacion(
        userId,
        motivo ? `${mensaje} - ${motivo}` : mensaje,
        tipo,
        {
          tipo: 'cambioEstadoEvaluacion',
          nombreEvaluacion,
          nombreRamo,
          estadoAnterior,
          estadoNuevo,
          motivo,
          fecha: new Date()
        }
      );
    });
  }

  /**
   * Notificación de recordatorio de evaluación próxima
   * PARA: Alumno y Profesor
   * CUANDO: Es 24h antes de una evaluación
   */
  notificacionRecordatorioEvaluacion(usuarioIds, nombreEvaluacion, nombreRamo, fechaHora, horasRestantes) {
    const mensaje = `Recordatorio: ${nombreEvaluacion} (${nombreRamo}) en ${horasRestantes} horas`;

    usuarioIds.forEach(userId => {
      this.enviarNotificacion(
        userId,
        mensaje,
        'warning',
        {
          tipo: 'recordatorioEvaluacion',
          nombreEvaluacion,
          nombreRamo,
          fechaHora,
          horasRestantes,
          fecha: new Date()
        }
      );
    });
  }
}

export default NotificacionesPersonalizadas;
