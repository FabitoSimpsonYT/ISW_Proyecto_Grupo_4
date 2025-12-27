import { AppDataSource } from "../config/configDb.js";
import { Notificacion } from "../entities/notificacionuno.entity.js";
import { User } from "../entities/user.entity.js";
import { In } from "typeorm";

const notificacionRepo = AppDataSource.getRepository(Notificacion);
const userRepo = AppDataSource.getRepository(User);

/**
 * Crea notificaciones para un listado de emails de alumnos.
 * - emails: array de strings (correos)
 * - titulo, mensaje: texto de la notificación
 * - evaluacionId: opcional id de evaluación asociada
 */
export const notificarAlumnos = async (emails = [], titulo, mensaje, evaluacionId = null) => {
  try {
    if (!Array.isArray(emails) || emails.length === 0) {
      console.warn("notificarAlumnos: lista de emails vacía");
      return { success: true, count: 0 };
    }

  
    const normalized = emails
      .filter(Boolean)
      .map((e) => String(e).trim().toLowerCase());

    console.log("notificarAlumnos - Emails recibidos:", emails);
    console.log("notificarAlumnos - Emails normalizados:", normalized);


    const alumnos = await userRepo.find({
      where: { email: In(normalized), role: "alumno" },
    });

    console.log("notificarAlumnos - Alumnos encontrados:", alumnos.map((a) => a.email));

    if (!alumnos || alumnos.length === 0) {
      console.warn("notificarAlumnos: no se encontraron alumnos para los emails proporcionados");
      return { success: true, count: 0 };
    }

    const notificaciones = alumnos.map((alumno) =>
      notificacionRepo.create({
        titulo,
        mensaje,
        evaluacion: evaluacionId ? { id: evaluacionId } : null,
        usuario: alumno,
      })
    );

    await notificacionRepo.save(notificaciones);
    console.log(`notificarAlumnos - Notificaciones creadas: ${notificaciones.length}`);
    return { success: true, count: notificaciones.length };
  } catch (error) {
    console.error("notificarAlumnos - Error:", error);
    return { error: "Error al enviar las notificaciones" };
  }
};


export const crearEvaluacionConNotificacion = async (evaluacionRepo, evaluacionData, emailsAlumnos) => {
  try {
    const evaluacion = await evaluacionRepo.save(evaluacionData);
    await notificarAlumnos(emailsAlumnos, "Nueva Evaluación Disponible", `Se ha creado una nueva evaluación: ${evaluacion.titulo || evaluacionData.titulo}`, evaluacion.id);
    return evaluacion;
  } catch (error) {
    console.error("crearEvaluacionConNotificacion - Error:", error);
    throw error;
  }
};

export const notificarEvaluacionYPauta = async (evaluacionId, pautaId, emailsAlumnos) => {
  return await notificarAlumnos(emailsAlumnos, "Evaluación y Pauta Disponibles", `Tu evaluación y pauta están listas para revisar.`, evaluacionId);
};
 
export const obtenerNotificacionesPorUsuario = async (usuarioId) => {
  console.log("obtenerNotificacionesPorUsuario - buscando para usuarioId:", usuarioId);
  return await notificacionRepo.find({
    where: { usuario: { id: usuarioId } },
    relations: ["evaluacion"],
    order: { fechaEnvio: "DESC" },
  });
};

export const marcarNotificacionComoLeida = async (id) => {
  const notificacion = await notificacionRepo.findOneBy({ id });
  if (!notificacion) return null;
  notificacion.leido = true;
  return await notificacionRepo.save(notificacion);
};