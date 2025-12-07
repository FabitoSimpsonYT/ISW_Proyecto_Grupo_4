// Backend/src/entities/Evento.js
class Evento {
  constructor({
    id,
    nombre,
    descripcion,
    estado, // 'pendiente', 'confirmado', 'tentativo', 'cancelado'
    fechaInicio, // Date object
    fechaFin, // Date object
    tipoEvento, // 'evaluacion', 'reunion', 'clase'
    modalidad, // 'presencial', 'online'
    linkOnline,
    ramoId,
    seccionId,
    profesorId,
    duracionPorAlumno, // en minutos
    cupoMaximo,
    cupoDisponible,
    permiteParejas = false,
    sala,
    createdAt = new Date(),
    updatedAt = new Date()
  }) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.estado = estado;
    this.fechaInicio = fechaInicio;
    this.fechaFin = fechaFin;
    this.tipoEvento = tipoEvento;
    this.modalidad = modalidad;
    this.linkOnline = linkOnline;
    this.ramoId = ramoId;
    this.seccionId = seccionId;
    this.profesorId = profesorId;
    this.duracionPorAlumno = duracionPorAlumno;
    this.cupoMaximo = cupoMaximo;
    this.cupoDisponible = cupoDisponible;
    this.permiteParejas = permiteParejas;
    this.sala = sala;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Validar que el evento esté dentro del horario permitido
  validarHorario() {
    const horaInicio = this.fechaInicio.getHours();
    const horaFin = this.fechaFin.getHours();

    if (this.modalidad === 'presencial') {
      // Presencial: 8:00 AM - 8:00 PM
      if (horaInicio < 8 || horaFin > 20) {
        return { valido: false, mensaje: 'Los eventos presenciales deben estar entre las 8:00 AM y 8:00 PM' };
      }
    } else if (this.modalidad === 'online') {
      // Online: 8:00 AM - 3:00 AM del día siguiente
      if (horaInicio < 8 && horaInicio >= 3) {
        return { valido: false, mensaje: 'Los eventos online deben estar entre las 8:00 AM y 3:00 AM' };
      }
    }

    return { valido: true };
  }

  // Validar que tenga link si es online
  validarModalidad() {
    if (this.modalidad === 'online' && !this.linkOnline) {
      return { valido: false, mensaje: 'Los eventos online requieren un link (Google Meet, Zoom, Discord)' };
    }
    return { valido: true };
  }

  toJSON() {
    return {
      id: this.id,
      nombre: this.nombre,
      descripcion: this.descripcion,
      estado: this.estado,
      fechaInicio: this.fechaInicio,
      fechaFin: this.fechaFin,
      tipoEvento: this.tipoEvento,
      modalidad: this.modalidad,
      linkOnline: this.linkOnline,
      ramoId: this.ramoId,
      seccionId: this.seccionId,
      profesorId: this.profesorId,
      duracionPorAlumno: this.duracionPorAlumno,
      cupoMaximo: this.cupoMaximo,
      cupoDisponible: this.cupoDisponible,
      permiteParejas: this.permiteParejas,
      sala: this.sala,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

export default Evento;
