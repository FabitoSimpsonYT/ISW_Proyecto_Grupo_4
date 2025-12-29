import { AppDataSource } from "../config/configDb.js";
import { Brackets, In } from "typeorm";
import { Notificacion } from "../entities/notificacionuno.entity.js";
import { User } from "../entities/user.entity.js";
import { Alumno } from "../entities/alumno.entity.js";
import { Evaluacion } from "../entities/evaluaciones.entity.js";

const notificacionRepo = AppDataSource.getRepository(Notificacion);
const userRepo = AppDataSource.getRepository(User);
const alumnoRepo = AppDataSource.getRepository(Alumno);
const evaluacionRepo = AppDataSource.getRepository(Evaluacion);

const backfillNotificacionesEvaluacionesPublicadasParaAlumno = async (usuarioId, notificacionesExistentes = []) => {
  const user = await userRepo.findOne({ where: { id: usuarioId } });
  if (!user || user.role !== "alumno") {
    console.log("backfillNotificaciones: omitido (no es alumno)", { usuarioId, role: user?.role });
    return { created: 0 };
  }

  const alumno = await alumnoRepo.findOne({
    where: { id: usuarioId },
    relations: ["secciones", "secciones.ramo"],
  });

  if (!alumno) {
    console.log("backfillNotificaciones: no existe Alumno para usuarioId", usuarioId);
    return { created: 0 };
  }

  const ramoIds = (alumno?.secciones || [])
    .map((s) => s?.ramo?.id)
    .map((id) => Number(id))
    .filter((id) => Number.isFinite(id));

  const ramoCodigos = (alumno?.secciones || [])
    .map((s) => s?.ramo?.codigo)
    .filter(Boolean)
    .map((c) => String(c).trim())
    .filter((c) => c.length > 0);


  // Nota: actualmente el backend permite que un alumno vea TODAS las evaluaciones publicadas
  // (ver getAllEvaluacionesService en evaluacion.service.js). Si el alumno no tiene ramos/secciones,
  // igual generamos notificaciones desde todas las evaluaciones publicadas.
  const shouldUseAllPublished = ramoIds.length === 0 && ramoCodigos.length === 0;
  if (shouldUseAllPublished) {
    console.log("backfillNotificaciones: alumno sin ramos -> usando todas las evaluaciones publicadas", {
      usuarioId,
    });
  }

  const qb = evaluacionRepo.createQueryBuilder("e").where("e.pautaPublicada = :pub", { pub: true });

  if (!shouldUseAllPublished) {
    qb.andWhere(
      new Brackets((q) => {
        let hasAny = false;
        if (ramoIds.length > 0) {
          q.where("e.ramo_id IN (:...ramoIds)", { ramoIds });
          hasAny = true;
        }
        if (ramoCodigos.length > 0) {
          if (hasAny) q.orWhere("e.codigoRamo IN (:...ramoCodigos)", { ramoCodigos });
          else q.where("e.codigoRamo IN (:...ramoCodigos)", { ramoCodigos });
        }
      })
    );
  }

  const evaluacionesPublicadas = await qb
    .orderBy("e.created_at", "DESC")
    .getMany();

  console.log("backfillNotificaciones: evaluaciones publicadas encontradas", {
    usuarioId,
    count: evaluacionesPublicadas?.length ?? 0,
  });

  if (!evaluacionesPublicadas?.length) return { created: 0 };

  const existentesEvalIds = new Set(
    (notificacionesExistentes || [])
      .map((n) => n?.evaluacion?.id)
      .filter((id) => Number.isInteger(id))
  );

  const nuevas = evaluacionesPublicadas
    .filter((ev) => !existentesEvalIds.has(ev.id))
    .map((ev) =>
      notificacionRepo.create({
        titulo: "Evaluación publicada",
        mensaje: `Se publicó la evaluación: "${ev.titulo}". Ya puedes revisarla.`,
        evaluacion: { id: ev.id },
        usuario: { id: usuarioId },
      })
    );

  if (nuevas.length === 0) return { created: 0 };

  await notificacionRepo.save(nuevas);
  console.log("backfillNotificaciones: notificaciones insertadas", { usuarioId, created: nuevas.length });
  return { created: nuevas.length };
};

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

export const notificarPautaEvaluada = async (alumnoEmail, evaluacionTitulo, ramoNombre, tipo = 'creacion') => {
  try {
    const titulo = tipo === 'actualizacion' 
      ? `Pauta evaluada actualizada: ${evaluacionTitulo}`
      : `Pauta evaluada creada: ${evaluacionTitulo}`;
    
    const mensaje = tipo === 'actualizacion'
      ? `Tu pauta evaluada de ${ramoNombre} - ${evaluacionTitulo} ha sido actualizada.`
      : `Se ha registrado tu pauta evaluada de ${ramoNombre} - ${evaluacionTitulo}.`;
    
    return await notificarAlumnos([alumnoEmail], titulo, mensaje);
  } catch (error) {
    console.error("notificarPautaEvaluada - Error:", error);
    return { error: "Error al enviar notificación de pauta evaluada" };
  }
};
 
export const obtenerNotificacionesPorUsuario = async (usuarioId) => {
  console.log("obtenerNotificacionesPorUsuario - buscando para usuarioId:", usuarioId);
  let notificaciones = await notificacionRepo.find({
    where: { usuario: { id: usuarioId } },
    relations: ["evaluacion"],
    order: { fechaEnvio: "DESC" },
  });

  try {
    const { created } = await backfillNotificacionesEvaluacionesPublicadasParaAlumno(usuarioId, notificaciones);
    if (created > 0) {
      notificaciones = await notificacionRepo.find({
        where: { usuario: { id: usuarioId } },
        relations: ["evaluacion"],
        order: { fechaEnvio: "DESC" },
      });
    }
  } catch (e) {
    console.warn("obtenerNotificacionesPorUsuario - backfill omitido por error:", e?.message || e);
  }

  return notificaciones;
};

export const marcarNotificacionComoLeida = async (id) => {
  const notificacion = await notificacionRepo.findOneBy({ id });
  if (!notificacion) return null;
  notificacion.leido = true;
  return await notificacionRepo.save(notificacion);
};