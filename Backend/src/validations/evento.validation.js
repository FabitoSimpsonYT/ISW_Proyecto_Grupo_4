// Backend/src/validations/eventoValidations.js

const validarFormatoFecha = (fecha) => {
  const regex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
  return regex.test(fecha);
};

const parsearFecha = (fechaStr) => {
  // Formato esperado: dd/mm/yyyy HH:MM
  const [fecha, hora] = fechaStr.split(' ');
  const [dia, mes, anio] = fecha.split('/');
  const [horas, minutos] = hora.split(':');
  
  return new Date(anio, mes - 1, dia, horas, minutos);
};

const validarDatosEvento = (data) => {
  const errores = [];

  // Validar nombre
  if (!data.nombre || data.nombre.trim().length === 0) {
    errores.push('El nombre del evento es obligatorio');
  }

  if (data.nombre && data.nombre.length > 200) {
    errores.push('El nombre del evento no puede exceder 200 caracteres');
  }

  // Validar descripción
  if (data.descripcion && data.descripcion.length > 1000) {
    errores.push('La descripción no puede exceder 1000 caracteres');
  }

  // Validar estado
  const estadosValidos = ['pendiente', 'confirmado', 'tentativo', 'cancelado'];
  if (data.estado && !estadosValidos.includes(data.estado)) {
    errores.push(`El estado debe ser uno de: ${estadosValidos.join(', ')}`);
  }

  // Validar tipo de evento
  const tiposValidos = ['evaluacion', 'reunion', 'clase'];
  if (!data.tipoEvento || !tiposValidos.includes(data.tipoEvento)) {
    errores.push(`El tipo de evento debe ser uno de: ${tiposValidos.join(', ')}`);
  }

  // Validar modalidad
  const modalidadesValidas = ['presencial', 'online'];
  if (!data.modalidad || !modalidadesValidas.includes(data.modalidad)) {
    errores.push(`La modalidad debe ser: ${modalidadesValidas.join(' o ')}`);
  }

  // Validar link para eventos online
  if (data.modalidad === 'online' && !data.linkOnline) {
    errores.push('Los eventos online requieren un link (Google Meet, Zoom, Discord)');
  }

  // Validar formato de link
  if (data.linkOnline) {
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(data.linkOnline)) {
      errores.push('El link debe ser una URL válida (https://...)');
    }
  }

  // Validar sala para eventos presenciales
  if (data.modalidad === 'presencial' && !data.sala) {
    errores.push('Los eventos presenciales requieren especificar una sala');
  }

  // Validar fechas
  if (!data.fechaInicio) {
    errores.push('La fecha de inicio es obligatoria');
  }

  if (!data.fechaFin) {
    errores.push('La fecha de fin es obligatoria');
  }

  if (data.fechaInicio && data.fechaFin) {
    const inicio = new Date(data.fechaInicio);
    const fin = new Date(data.fechaFin);

    if (fin <= inicio) {
      errores.push('La fecha de fin debe ser posterior a la fecha de inicio');
    }

    // Validar que no sea en el pasado
    if (inicio < new Date()) {
      errores.push('No se pueden crear eventos en el pasado');
    }

    // Validar duración mínima (al menos 5 minutos)
    const duracionMs = fin - inicio;
    const duracionMinutos = duracionMs / (1000 * 60);
    if (duracionMinutos < 5) {
      errores.push('El evento debe durar al menos 5 minutos');
    }
  }

  // Validar cupos
  if (data.cupoMaximo !== undefined) {
    if (data.cupoMaximo < 1) {
      errores.push('El cupo máximo debe ser al menos 1');
    }
    if (data.cupoMaximo > 1000) {
      errores.push('El cupo máximo no puede exceder 1000');
    }
  }

  // Validar duración por alumno
  if (data.duracionPorAlumno !== undefined) {
    if (data.duracionPorAlumno < 5) {
      errores.push('La duración por alumno debe ser al menos 5 minutos');
    }
    if (data.duracionPorAlumno > 240) {
      errores.push('La duración por alumno no puede exceder 240 minutos (4 horas)');
    }
  }

  // Validar IDs
  if (!data.ramoId) {
    errores.push('El ID del ramo es obligatorio');
  }

  if (!data.seccionId) {
    errores.push('El ID de la sección es obligatorio');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

const validarHorarioDisponible = (fechaInicio, modalidad) => {
  const hora = fechaInicio.getHours();
  const minutos = fechaInicio.getMinutes();
  const horaDecimal = hora + minutos / 60;

  if (modalidad === 'presencial') {
    // Presencial: 8:00 AM - 8:00 PM
    if (horaDecimal < 8 || horaDecimal >= 20) {
      return {
        valido: false,
        mensaje: 'Los eventos presenciales deben estar entre las 8:00 AM y 8:00 PM'
      };
    }
  } else if (modalidad === 'online') {
    // Online: 8:00 AM - 3:00 AM (del día siguiente)
    if (horaDecimal >= 3 && horaDecimal < 8) {
      return {
        valido: false,
        mensaje: 'Los eventos online deben estar entre las 8:00 AM y 3:00 AM'
      };
    }
  }

  return { valido: true };
};

const validarInscripcion = (data) => {
  const errores = [];

  if (!data.eventoId) {
    errores.push('El ID del evento es obligatorio');
  }

  if (data.parejaAlumnoEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.parejaAlumnoEmail)) {
    errores.push('El email de la pareja no es válido');
  }

  return {
    valido: errores.length === 0,
    errores
  };
};

module.exports = {
  validarFormatoFecha,
  parsearFecha,
  validarDatosEvento,
  validarHorarioDisponible,
  validarInscripcion
};