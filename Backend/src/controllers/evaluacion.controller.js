import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  getAllEvaluacionesService,
  getEvaluacionByIdService,
  getEvaluacionesByCodigoRamoService,
  createEvaluacionService,
  updateEvaluacionService,
  deleteEvaluacionService,
} from "../services/evaluacion.service.js";
import { createEvaluacionValidation, updateEvaluacionValidation } from "../validations/evaluacion.validation.js";
import { notificarAlumnos } from "../services/notificacionuno.service.js";
import { sendEmail } from "../config/email.js";
import { renderNotificationEmail } from "../utils/emailTemplate.js";

function buildDisplayName(person) {
  const parts = [person?.nombres, person?.apellidoPaterno, person?.apellidoMaterno]
    .map((value) => String(value || "").trim())
    .filter(Boolean);
  return parts.join(" ").trim();
}

async function resolveInstructorIdentity(reqUser) {
  const tokenEmail = String(reqUser?.email || "").trim();
  const tokenName = String(reqUser?.nombres || "").trim();
  const tokenHasLastName = Boolean(reqUser?.apellidoPaterno || reqUser?.apellidoMaterno);
  const nameFromToken = tokenHasLastName ? buildDisplayName(reqUser) : tokenName;

  if (tokenHasLastName || !reqUser?.id) {
    return { name: nameFromToken, email: tokenEmail };
  }

  try {
    const { AppDataSource } = await import("../config/configDB.js");
    const { User } = await import("../entities/user.entity.js");
    const userRepository = AppDataSource.getRepository(User);
    const dbUser = await userRepository.findOne({ where: { id: Number(reqUser.id) } });

    const nameFromDb = buildDisplayName(dbUser);
    const emailFromDb = String(dbUser?.email || "").trim();

    return {
      name: nameFromDb || nameFromToken,
      email: tokenEmail || emailFromDb,
    };
  } catch (error) {
    console.warn(
      "No se pudo resolver el nombre completo del docente desde BD:",
      error?.message || error
    );
    return { name: nameFromToken, email: tokenEmail };
  }
}

function formatDateTimeForEmail(value) {
  const date = value instanceof Date ? value : new Date(value ?? Date.now());
  try {
    return new Intl.DateTimeFormat("es-CL", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Santiago",
    }).format(date);
  } catch {
    return date.toLocaleString("es-CL");
  }
}

async function sendEmailToMany(recipients, subject, html) {
  const emails = [...new Set((recipients || []).map((e) => String(e).trim()).filter(Boolean))];
  if (emails.length === 0) return { sent: 0, failed: 0 };

  const results = await Promise.allSettled(emails.map((email) => sendEmail(email, subject, html)));
  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.length - sent;
  return { sent, failed };
}

async function getUniqueAlumnoEmailsByRamoId(ramoId) {
  if (!ramoId) return [];
  const { AppDataSource } = await import("../config/configDB.js");
  const { Ramos } = await import("../entities/ramos.entity.js");

  const ramoRepo = AppDataSource.getRepository(Ramos);
  const ramo = await ramoRepo.findOne({
    where: { id: ramoId },
    relations: ["secciones", "secciones.alumnos", "secciones.alumnos.user"],
  });

  const emails = [];
  if (ramo?.secciones?.length) {
    ramo.secciones.forEach((seccion) => {
      if (seccion?.alumnos?.length) {
        seccion.alumnos.forEach((alumno) => {
          if (alumno?.user?.email) emails.push(alumno.user.email);
        });
      }
    });
  }

  return [...new Set(emails.map((e) => String(e).trim()).filter(Boolean))];
}

export async function getEvaluaciones(req, res) {
  try {
    const user = req.user;
    const evaluaciones = await getAllEvaluacionesService(user);
    handleSuccess(res, 200, "Evaluacion obtenida exitosamente", { evaluaciones });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener evaluaciones", error.message);
  }
}

export async function getEvaluacionById(req, res) {
  try {
    const { codigoRamo, idEvaluacion } = req.params;
    const user = req.user;

    console.log("getEvaluacionById recibido con codigoRamo:", codigoRamo, "idEvaluacion:", idEvaluacion);

    // Si hay idEvaluacion, retorna una evaluación específica
    if (idEvaluacion) {
      console.log("Buscando evaluación específica con id:", idEvaluacion);
      const evaluacion = await getEvaluacionByIdService(idEvaluacion, user);
      if (!evaluacion) {
        return handleErrorClient(res, 404, "Evaluación no encontrada");
      }
      return handleSuccess(res, 200, "Evaluación obtenida exitosamente", { evaluacion });
    }

    // Si no hay idEvaluacion, retorna todas las evaluaciones del ramo
    console.log("Buscando todas las evaluaciones para codigoRamo:", codigoRamo);
    const evaluaciones = await getEvaluacionesByCodigoRamoService(codigoRamo, user);
    console.log("Evaluaciones encontradas:", evaluaciones);
    
    if (!evaluaciones) {
      return handleErrorClient(res, 404, "Ramo no encontrado");
    }

    return handleSuccess(res, 200, "Evaluaciones obtenidas exitosamente", { evaluaciones });
  } catch (error) {
    console.error("Error en getEvaluacionById:", error);
    handleErrorServer(res, 500, "Error al obtener evaluación", error.message);
  }
}

import { syncEvaluacionWithEvent } from "../utils/evaluation-event.utils.js";
// createEvaluacion
export async function createEvaluacion(req, res) {
  try {
    const user = req.user;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    console.log("Datos recibidos:", req.body);
    
    const {error} = createEvaluacionValidation.validate(req.body, {
      context: { tomorrow }
    });
    if(error) {
      console.error("Error de validación:", error.message);
      return res.status(400).json({message: error.message});
    }

    // Validar que la suma de ponderaciones no exceda 100
    const { codigoRamo, ponderacion } = req.body;
    if (codigoRamo && ponderacion) {
      try {
        const { AppDataSource } = await import("../config/configDB.js");
        const { Evaluacion } = await import("../entities/evaluaciones.entity.js");
        const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
        
        // Obtener todas las evaluaciones del ramo (excluyendo integradoras)
        const evaluacionesExistentes = await evaluacionRepo.find({
          where: { codigoRamo }
        });
        
        const sumaPonderaciones = evaluacionesExistentes.reduce((sum, ev) => sum + (ev.ponderacion || 0), 0) + ponderacion;
        
        if (sumaPonderaciones > 100) {
          return handleErrorClient(res, 400, `La suma de ponderaciones no puede exceder 100%. Actualmente sería ${sumaPonderaciones}%`);
        }
      } catch (e) {
        console.error("Error al validar ponderaciones:", e);
      }
    }

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(res, 403, "Solo el profesor o jefe de carrera puede crear evaluaciones");
    }

    const { titulo, fechaProgramada, horaInicio, horaFin, contenidos, ramo_id, puntajeTotal, pautaPublicada } = req.body;

    console.log("Creando evaluación con datos:", {
      titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, ramo_id, codigoRamo, puntajeTotal
    });

    const nuevaEvaluacion = await createEvaluacionService({
      titulo,
      fechaProgramada,
      horaInicio,
      horaFin,
      ponderacion,
      contenidos,
      ramo_id,
      codigoRamo,
      puntajeTotal,
      pautaPublicada,
      creadaPor: user.id,
      aplicada: false,
    });

    console.log("Evaluación creada:", nuevaEvaluacion);

    await syncEvaluacionWithEvent(nuevaEvaluacion, user, false);

    
    if (Boolean(nuevaEvaluacion?.pautaPublicada)) {
      try {
        const ramoId = nuevaEvaluacion?.ramo?.id;
        const uniqueEmails = await getUniqueAlumnoEmailsByRamoId(ramoId);

        if (uniqueEmails.length > 0) {
          await notificarAlumnos(
            uniqueEmails,
            "Evaluación publicada",
            `Se publicó la evaluación: "${nuevaEvaluacion.titulo || titulo}". Ya puedes revisarla.`,
            nuevaEvaluacion.id
          );
          console.log(` ${uniqueEmails.length} alumnos notificados por publicación de evaluación`);

          try {
            const evalTitulo = nuevaEvaluacion.titulo || titulo || "(sin título)";
            const publicadoEl = formatDateTimeForEmail(
              nuevaEvaluacion?.updated_at || nuevaEvaluacion?.created_at || new Date()
            );
            const subject = `Certamen publicado: ${evalTitulo}`;
            const instructor = await resolveInstructorIdentity(req.user || user);
            const profesorNombre = instructor.name;
            const profesorEmail = instructor.email;
            const cursoNombre = nuevaEvaluacion?.ramo
              ? `${nuevaEvaluacion.ramo.nombre} (${nuevaEvaluacion.ramo.codigo || codigoRamo || ""})`
              : (codigoRamo ? `(${codigoRamo})` : "");
            const html = renderNotificationEmail({
              title: "Certamen publicado",
              preheader: `Se publicó el certamen: ${evalTitulo}.`,
              lines: [
                `Se publicó el certamen: ${evalTitulo}.`,
                `Publicado el: ${publicadoEl}`,
                "Ya puedes revisarlo en el sistema.",
              ],
              badgeText: evalTitulo,
              instructorName: profesorNombre,
              instructorEmail: profesorEmail,
              courseName: cursoNombre,
            });
            const { sent, failed } = await sendEmailToMany(uniqueEmails, subject, html);
            console.log(`Emails por evaluación publicada (creación): enviados=${sent}, fallidos=${failed}`);
          } catch (emailError) {
            console.warn(
              "No se pudieron enviar emails (evaluación publicada - creación):",
              emailError?.message || emailError
            );
          }
        } else {
          console.log("notificarAlumnos: lista de emails vacía para evaluación publicada (creación)");
        }
      } catch (notifError) {
        console.warn(
          " No se pudieron notificar los alumnos (evaluación publicada):",
          notifError.message || notifError
        );
      }
    }

    handleSuccess(res, 201, "Evaluación creada exitosamente", { evaluacion: nuevaEvaluacion });
  } catch (error) {
    console.error("Error al crear evaluación:", error);
    handleErrorServer(res, 500, "Error al crear evaluación", error.message);
  }
}

export async function updateEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    
    // Validación condicional: solo validar la fecha si se proporciona
    const validationSchema = updateEvaluacionValidation;
    const { error } = validationSchema.validate(req.body);
    
    
    if (error) {
      
      if (error.details && error.details.some(d => d.context.key === 'fechaProgramada') && !req.body.fechaProgramada) {
       
      } else {
        return res.status(400).json({message: error.message});
      }
    }

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return  handleErrorClient(res, 403, "Solo el profesor o jefe de carrera puede modificar evaluaciones");
    }

    const { titulo, fechaProgramada, ponderacion, contenidos, pauta, aplicada, puntajeTotal, pautaPublicada, estado } = req.body;

    // Validar que la suma de ponderaciones no exceda 100 si se está actualizando la ponderación
    if (ponderacion) {
      try {
        const { AppDataSource } = await import("../config/configDB.js");
        const { Evaluacion } = await import("../entities/evaluaciones.entity.js");
        const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
        
        // Obtener la evaluación actual para conocer su codigoRamo y ponderación actual
        const evaluacionActual = await evaluacionRepo.findOne({ where: { id: Number(id) } });
        if (evaluacionActual) {
          const codigoRamo = evaluacionActual.codigoRamo;
          
          // Obtener todas las evaluaciones del ramo (excluyendo la actual)
          const evaluacionesExistentes = await evaluacionRepo.find({
            where: { codigoRamo }
          });
          
          const sumaPonderacionesOtras = evaluacionesExistentes
            .filter(ev => ev.id !== Number(id))
            .reduce((sum, ev) => sum + (ev.ponderacion || 0), 0);
          
          const sumaPonderaciones = sumaPonderacionesOtras + ponderacion;
          
          if (sumaPonderaciones > 100) {
            return handleErrorClient(res, 400, `La suma de ponderaciones no puede exceder 100%. Actualmente sería ${sumaPonderaciones}%`);
          }
        }
      } catch (e) {
        console.error("Error al validar ponderaciones en update:", e);
      }
    }
    
    let wasPublished = false;
    let ramoIdForNotif = null;
    try {
      const { AppDataSource } = await import("../config/configDB.js");
      const { Evaluacion } = await import("../entities/evaluaciones.entity.js");
      const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
      const before = await evaluacionRepo.findOne({ where: { id: Number(id) }, relations: ["ramo"] });
      wasPublished = Boolean(before?.pautaPublicada);
      ramoIdForNotif = before?.ramo?.id ?? null;
    } catch (e) {
      
    }

    const evaluacionActualizada = await updateEvaluacionService(id, {
      titulo,
      fechaProgramada,
      ponderacion,
      contenidos,
      pauta,
      aplicada,
      puntajeTotal,
      pautaPublicada,
      estado,
      userId: user.id,
    });

    if (!evaluacionActualizada) {
      return  handleErrorClient(res, 404, "No se pudo actualizar la evaluación");
    }

    // Eliminar pautas evaluadas relacionadas a la pauta de la evaluación
    try {
      const { AppDataSource } = await import("../config/configDB.js");
      const { Evaluacion } = await import("../entities/evaluaciones.entity.js");
      const { Pauta } = await import("../entities/pauta.entity.js");
      const pautaEvaluadaRepository = AppDataSource.getRepository(require("../entities/pautaEvaluada.entity.js").PautaEvaluada);
      const pautaRepository = AppDataSource.getRepository(Pauta);
      const evaluacionRepo = AppDataSource.getRepository(Evaluacion);
      const evaluacionActual = await evaluacionRepo.findOne({ where: { id: Number(id) } });
      if (evaluacionActual && evaluacionActual.idPauta) {
        await pautaEvaluadaRepository.delete({ pauta: { id: evaluacionActual.idPauta } });
        await pautaRepository.delete({ id: evaluacionActual.idPauta });
      }
    } catch (err) {
      console.error("Error eliminando pautas evaluadas y pauta relacionada:", err);
    }

    const isNowPublished = Boolean(evaluacionActualizada?.pautaPublicada);
    if (!wasPublished && isNowPublished) {
      try {
        const uniqueEmails = await getUniqueAlumnoEmailsByRamoId(ramoIdForNotif);
        if (uniqueEmails.length > 0) {
          await notificarAlumnos(
            uniqueEmails,
            "Evaluación publicada",
            `Se publicó la evaluación: "${evaluacionActualizada.titulo || titulo}". Ya puedes revisarla.`,
            evaluacionActualizada.id
          );
          console.log(`${uniqueEmails.length} alumnos notificados por publicación de evaluación`);

          try {
            const evalTitulo = evaluacionActualizada.titulo || titulo || "(sin título)";
            const publicadoEl = formatDateTimeForEmail(evaluacionActualizada?.updated_at || new Date());
            const subject = `Certamen publicado: ${evalTitulo}`;
            const instructor = await resolveInstructorIdentity(req.user || user);
            const profesorNombre = instructor.name;
            const profesorEmail = instructor.email;
            const cursoNombre = evaluacionActualizada?.ramo
              ? `${evaluacionActualizada.ramo.nombre} (${evaluacionActualizada.ramo.codigo || ""})`
              : "";
            const html = renderNotificationEmail({
              title: "Certamen publicado",
              preheader: `Se publicó el certamen: ${evalTitulo}.`,
              lines: [
                `Se publicó el certamen: ${evalTitulo}.`,
                `Publicado el: ${publicadoEl}`,
                "Ya puedes revisarlo en el sistema.",
              ],
              badgeText: evalTitulo,
              instructorName: profesorNombre,
              instructorEmail: profesorEmail,
              courseName: cursoNombre,
            });
            const { sent, failed } = await sendEmailToMany(uniqueEmails, subject, html);
            console.log(`Emails por evaluación publicada (update): enviados=${sent}, fallidos=${failed}`);
          } catch (emailError) {
            console.warn(
              "No se pudieron enviar emails (evaluación publicada - update):",
              emailError?.message || emailError
            );
          }
        }
      } catch (notifError) {
        console.warn(
          "No se pudieron notificar los alumnos (publicación evaluación):",
          notifError.message || notifError
        );
      }
    }

    handleSuccess(res, 200, "Evaluación actualizada exitosamente", { evaluacion: evaluacionActualizada });
  } catch (error) {
    console.error("Error al actualizar evaluación:", error);
    handleErrorServer(res, 500, "Error al actualizar evaluación", error.message);
  }
}

export async function deleteEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return  handleErrorClient(res, 403, "Solo el profesor o jefe de carrera puede eliminar evaluaciones");
    }

    const eliminada = await deleteEvaluacionService(id, user.id);

    if (!eliminada) {
      return  handleErrorClient(res, 404, "No se pudo eliminar la evaluación");
    }

    handleSuccess(res, 200, "Evaluación eliminada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar evaluación", error.message);
  }
}