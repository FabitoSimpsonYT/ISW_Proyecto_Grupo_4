/**
 * Servicio de Notificaciones por Rol
 * Gestiona notificaciones específicas para Alumno, Profesor y Jefe Carrera
 */

import { AppDataSource } from "../config/configDB.js";
import { Notificacion } from "../entities/notificacionuno.entity.js";
import { User } from "../entities/user.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";
import { Evento } from "../entities/evento.entity.js";
import { Bloqueo } from "../entities/bloqueo.entity.js";
import { Alumno } from "../entities/alumno.entity.js";

const notificacionRepo = AppDataSource.getRepository(Notificacion);
const userRepo = AppDataSource.getRepository(User);

/**
 * ============================================
 * NOTIFICACIONES PARA ALUMNOS
 * ============================================
 */

/**
 * Notifica a alumnos cuando se aproxima un evento (3 días antes)
 * @param {number} eventoId - ID del evento
 * @param {Date} fechaEvento - Fecha del evento
 * @param {string} nombreEvento - Nombre del evento
 * @param {string} ramoNombre - Nombre del ramo
 * @param {number[]} alumnoIds - IDs de alumnos a notificar
 */
export const notificarEventoProximo = async (
  eventoId,
  fechaEvento,
  nombreEvento,
  ramoNombre,
  alumnoIds = []
) => {
  try {
    const diasFaltantes = Math.ceil(
      (new Date(fechaEvento) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (diasFaltantes <= 3 && diasFaltantes > 0) {
      const notificaciones = alumnoIds.map((alumnoId) =>
        notificacionRepo.create({
          titulo: `🗓️ Evento próximo: ${nombreEvento}`,
          mensaje: `El evento "${nombreEvento}" de ${ramoNombre} se realizará en ${diasFaltantes} días (${new Date(
            fechaEvento
          ).toLocaleDateString("es-ES")})`,
          tipo: "evento",
          usuario: { id: alumnoId },
        })
      );

      await notificacionRepo.save(notificaciones);
      console.log(
        `✓ Notificaciones de evento enviadas a ${notificaciones.length} alumnos`
      );
      return { success: true, count: notificaciones.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("notificarEventoProximo - Error:", error);
    throw error;
  }
};

/**
 * Notifica a alumnos cuando se añade una evaluación a su ramo
 * @param {number} evaluacionId - ID de la evaluación
 * @param {string} nombreEvaluacion - Nombre de la evaluación
 * @param {string} ramoNombre - Nombre del ramo
 * @param {Date} fechaEvaluacion - Fecha de la evaluación
 * @param {number[]} alumnoIds - IDs de alumnos inscritos en el ramo
 */
export const notificarEvaluacionNueva = async (
  evaluacionId,
  nombreEvaluacion,
  ramoNombre,
  fechaEvaluacion,
  alumnoIds = []
) => {
  try {
    const notificaciones = alumnoIds.map((alumnoId) =>
      notificacionRepo.create({
        titulo: `📋 Nueva evaluación: ${nombreEvaluacion}`,
        mensaje: `Se ha añadido una nueva evaluación "${nombreEvaluacion}" en ${ramoNombre}. Fecha: ${new Date(
          fechaEvaluacion
        ).toLocaleDateString("es-ES")}`,
        tipo: "evaluacion",
        usuario: { id: alumnoId },
        evaluacion: { id: evaluacionId },
      })
    );

    await notificacionRepo.save(notificaciones);
    console.log(
      `✓ Notificaciones de evaluación nueva enviadas a ${notificaciones.length} alumnos`
    );
    return { success: true, count: notificaciones.length };
  } catch (error) {
    console.error("notificarEvaluacionNueva - Error:", error);
    throw error;
  }
};

/**
 * Notifica a alumnos cuando se aproximan días bloqueados (7 días antes)
 * @param {Date} fechaInicio - Fecha de inicio del bloqueo
 * @param {Date} fechaFin - Fecha de fin del bloqueo
 * @param {string} motivo - Motivo del bloqueo
 * @param {number[]} alumnoIds - IDs de alumnos a notificar
 */
export const notificarDiasBloqueadosProximos = async (
  fechaInicio,
  fechaFin,
  motivo,
  alumnoIds = []
) => {
  try {
    const diasFaltantes = Math.ceil(
      (new Date(fechaInicio) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (diasFaltantes <= 7 && diasFaltantes > 0) {
      const fechaFormato = new Date(fechaInicio).toLocaleDateString("es-ES");

      const notificaciones = alumnoIds.map((alumnoId) =>
        notificacionRepo.create({
          titulo: `🚫 Días bloqueados próximamente`,
          mensaje: `Hay días bloqueados a partir del ${fechaFormato}. Motivo: ${motivo}. No podrás inscribir evaluaciones durante este período.`,
          tipo: "bloqueo",
          usuario: { id: alumnoId },
        })
      );

      await notificacionRepo.save(notificaciones);
      console.log(
        `✓ Notificaciones de bloqueo enviadas a ${notificaciones.length} alumnos`
      );
      return { success: true, count: notificaciones.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("notificarDiasBloqueadosProximos - Error:", error);
    throw error;
  }
};

/**
 * Notifica a un alumno sobre slots disponibles para una evaluación
 * @param {number} alumnoId - ID del alumno
 * @param {string} nombreEvaluacion - Nombre de la evaluación
 * @param {string} ramoNombre - Nombre del ramo
 * @param {number} slotsDisponibles - Cantidad de slots disponibles
 */
export const notificarSlotsDisponibles = async (
  alumnoId,
  nombreEvaluacion,
  ramoNombre,
  slotsDisponibles
) => {
  try {
    const notificacion = notificacionRepo.create({
      titulo: `✅ Slots disponibles: ${nombreEvaluacion}`,
      mensaje: `Hay ${slotsDisponibles} slot(s) disponible(s) para inscribirse en "${nombreEvaluacion}" de ${ramoNombre}. ¡Apúrate!`,
      tipo: "evaluacion",
      usuario: { id: alumnoId },
    });

    await notificacionRepo.save(notificacion);
    return { success: true };
  } catch (error) {
    console.error("notificarSlotsDisponibles - Error:", error);
    throw error;
  }
};

/**
 * ============================================
 * NOTIFICACIONES PARA PROFESOR Y JEFE CARRERA
 * ============================================
 */

/**
 * Notifica a profesor/jefe cuando se aproxima una evaluación (2 días antes)
 * @param {number} evaluacionId - ID de la evaluación
 * @param {string} nombreEvaluacion - Nombre de la evaluación
 * @param {string} ramoNombre - Nombre del ramo
 * @param {Date} fechaEvaluacion - Fecha de la evaluación
 * @param {number[]} profesorIds - IDs de profesores a notificar
 */
export const notificarEvaluacionProxima = async (
  evaluacionId,
  nombreEvaluacion,
  ramoNombre,
  fechaEvaluacion,
  profesorIds = []
) => {
  try {
    const diasFaltantes = Math.ceil(
      (new Date(fechaEvaluacion) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (diasFaltantes <= 2 && diasFaltantes > 0) {
      const notificaciones = profesorIds.map((profesorId) =>
        notificacionRepo.create({
          titulo: `📋 Evaluación próxima: ${nombreEvaluacion}`,
          mensaje: `La evaluación "${nombreEvaluacion}" de ${ramoNombre} se realizará en ${diasFaltantes} día(s) (${new Date(
            fechaEvaluacion
          ).toLocaleDateString("es-ES")}). Prepárate para ejecutarla.`,
          tipo: "evaluacion",
          usuario: { id: profesorId },
          evaluacion: { id: evaluacionId },
        })
      );

      await notificacionRepo.save(notificaciones);
      console.log(
        `✓ Notificaciones de evaluación próxima enviadas a ${notificaciones.length} profesores`
      );
      return { success: true, count: notificaciones.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("notificarEvaluacionProxima - Error:", error);
    throw error;
  }
};

/**
 * Notifica a profesor/jefe cuando se aproxima un evento (3 días antes)
 * @param {number} eventoId - ID del evento
 * @param {string} nombreEvento - Nombre del evento
 * @param {string} ramoNombre - Nombre del ramo
 * @param {Date} fechaEvento - Fecha del evento
 * @param {number[]} profesorIds - IDs de profesores a notificar
 */
export const notificarEventoProximoProfesor = async (
  eventoId,
  nombreEvento,
  ramoNombre,
  fechaEvento,
  profesorIds = []
) => {
  try {
    const diasFaltantes = Math.ceil(
      (new Date(fechaEvento) - new Date()) / (1000 * 60 * 60 * 24)
    );

    if (diasFaltantes <= 3 && diasFaltantes > 0) {
      const notificaciones = profesorIds.map((profesorId) =>
        notificacionRepo.create({
          titulo: `🗓️ Evento próximo: ${nombreEvento}`,
          mensaje: `El evento "${nombreEvento}" de ${ramoNombre} se realizará en ${diasFaltantes} días (${new Date(
            fechaEvento
          ).toLocaleDateString("es-ES")}). Asegúrate de estar disponible.`,
          tipo: "evento",
          usuario: { id: profesorId },
        })
      );

      await notificacionRepo.save(notificaciones);
      console.log(
        `✓ Notificaciones de evento próximo enviadas a ${notificaciones.length} profesores`
      );
      return { success: true, count: notificaciones.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("notificarEventoProximoProfesor - Error:", error);
    throw error;
  }
};

/**
 * Notifica cuando se acerca el final de la inscripción en slots
 * @param {string} nombreEvaluacion - Nombre de la evaluación
 * @param {string} ramoNombre - Nombre del ramo
 * @param {Date} fechaCierre - Fecha de cierre de inscripción
 * @param {number} alumnosInscritos - Cantidad de alumnos inscritos
 * @param {number} slotsDisponibles - Slots totales
 * @param {number[]} profesorIds - IDs de profesores
 */
export const notificarCierreInscripcionProxima = async (
  nombreEvaluacion,
  ramoNombre,
  fechaCierre,
  alumnosInscritos,
  slotsDisponibles,
  profesorIds = []
) => {
  try {
    const horasRestantes = Math.ceil(
      (new Date(fechaCierre) - new Date()) / (1000 * 60 * 60)
    );

    if (horasRestantes <= 24 && horasRestantes > 0) {
      const notificaciones = profesorIds.map((profesorId) =>
        notificacionRepo.create({
          titulo: `⏰ Cierre de inscripción próximo: ${nombreEvaluacion}`,
          mensaje: `La inscripción para "${nombreEvaluacion}" de ${ramoNombre} cerrará en ${horasRestantes} hora(s). Inscritos: ${alumnosInscritos}/${slotsDisponibles}`,
          tipo: "evaluacion",
          usuario: { id: profesorId },
        })
      );

      await notificacionRepo.save(notificaciones);
      return { success: true, count: notificaciones.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("notificarCierreInscripcionProxima - Error:", error);
    throw error;
  }
};

/**
 * ============================================
 * NOTIFICACIONES ADICIONALES SUGERIDAS
 * ============================================
 */

/**
 * Notifica cuando la inscripción de una evaluación se abre
 */
export const notificarAperturaInscripcion = async (
  evaluacionId,
  nombreEvaluacion,
  ramoNombre,
  alumnoIds = [],
  profesorIds = []
) => {
  try {
    const notificacionesAlumnos = alumnoIds.map((alumnoId) =>
      notificacionRepo.create({
        titulo: `🔓 Inscripción abierta: ${nombreEvaluacion}`,
        mensaje: `¡La inscripción para "${nombreEvaluacion}" de ${ramoNombre} ya está abierta! Apúrate a inscribirte.`,
        tipo: "evaluacion",
        usuario: { id: alumnoId },
        evaluacion: { id: evaluacionId },
      })
    );

    const notificacionesProfesores = profesorIds.map((profesorId) =>
      notificacionRepo.create({
        titulo: `🔓 Inscripción abierta: ${nombreEvaluacion}`,
        mensaje: `La inscripción para "${nombreEvaluacion}" de ${ramoNombre} ya está abierta.`,
        tipo: "evaluacion",
        usuario: { id: profesorId },
      })
    );

    await notificacionRepo.save([...notificacionesAlumnos, ...notificacionesProfesores]);
    return { success: true, count: notificacionesAlumnos.length + notificacionesProfesores.length };
  } catch (error) {
    console.error("notificarAperturaInscripcion - Error:", error);
    throw error;
  }
};

/**
 * Notifica cuando se publica la pauta de una evaluación
 */
export const notificarPautaPublicada = async (
  evaluacionId,
  nombreEvaluacion,
  ramoNombre,
  alumnoIds = []
) => {
  try {
    const notificaciones = alumnoIds.map((alumnoId) =>
      notificacionRepo.create({
        titulo: `📄 Pauta publicada: ${nombreEvaluacion}`,
        mensaje: `La pauta de "${nombreEvaluacion}" en ${ramoNombre} ya está disponible. ¡Revísala!`,
        tipo: "evaluacion",
        usuario: { id: alumnoId },
        evaluacion: { id: evaluacionId },
      })
    );

    await notificacionRepo.save(notificaciones);
    return { success: true, count: notificaciones.length };
  } catch (error) {
    console.error("notificarPautaPublicada - Error:", error);
    throw error;
  }
};

/**
 * Notifica cuando se publican calificaciones
 */
export const notificarCalificacionesPublicadas = async (
  evaluacionId,
  nombreEvaluacion,
  ramoNombre,
  alumnoIds = []
) => {
  try {
    const notificaciones = alumnoIds.map((alumnoId) =>
      notificacionRepo.create({
        titulo: `📊 Calificaciones publicadas: ${nombreEvaluacion}`,
        mensaje: `Las calificaciones de "${nombreEvaluacion}" en ${ramoNombre} ya están disponibles.`,
        tipo: "evaluacion",
        usuario: { id: alumnoId },
        evaluacion: { id: evaluacionId },
      })
    );

    await notificacionRepo.save(notificaciones);
    return { success: true, count: notificaciones.length };
  } catch (error) {
    console.error("notificarCalificacionesPublicadas - Error:", error);
    throw error;
  }
};

/**
 * Notifica sobre cambios de estado en apelaciones
 */
export const notificarCambioEstadoApelacion = async (
  alumnoId,
  nombreEvaluacion,
  nuevoEstado,
  comentario = ""
) => {
  try {
    const estadoTexto = {
      'pendiente': '⏳ En revisión',
      'aprobada': '✅ Aprobada',
      'rechazada': '❌ Rechazada',
      'en_revision': '⏳ En revisión'
    }[nuevoEstado] || nuevoEstado;

    const notificacion = notificacionRepo.create({
      titulo: `${estadoTexto}: Apelación en ${nombreEvaluacion}`,
      mensaje: `Tu apelación para "${nombreEvaluacion}" ha sido ${nuevoEstado}. ${comentario ? `Comentario: ${comentario}` : ''}`,
      tipo: "apelacion",
      usuario: { id: alumnoId },
    });

    await notificacionRepo.save(notificacion);
    return { success: true };
  } catch (error) {
    console.error("notificarCambioEstadoApelacion - Error:", error);
    throw error;
  }
};

/**
 * Notifica cuando hay solo X slots disponibles (stock bajo)
 */
export const notificarSlotsBajos = async (
  evaluacionId,
  nombreEvaluacion,
  ramoNombre,
  slotsRestantes,
  umbralAlerta = 2,
  alumnoIds = []
) => {
  try {
    if (slotsRestantes <= umbralAlerta && slotsRestantes > 0) {
      const notificaciones = alumnoIds.map((alumnoId) =>
        notificacionRepo.create({
          titulo: `⚠️ Pocos slots disponibles: ${nombreEvaluacion}`,
          mensaje: `¡Solo quedan ${slotsRestantes} slot(s) para inscribirse en "${nombreEvaluacion}" de ${ramoNombre}! Apúrate.`,
          tipo: "evaluacion",
          usuario: { id: alumnoId },
          evaluacion: { id: evaluacionId },
        })
      );

      await notificacionRepo.save(notificaciones);
      return { success: true, count: notificaciones.length };
    }

    return { success: true, count: 0 };
  } catch (error) {
    console.error("notificarSlotsBajos - Error:", error);
    throw error;
  }
};
