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

async function getUniqueAlumnoEmailsByRamoId(ramoId) {
  if (!ramoId) return [];
  const { AppDataSource } = await import("../config/configDb.js");
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
    const { id } = req.params;
    const user = req.user;

    const isNumericId = /^\d+$/.test(String(id));
    if (isNumericId) {
      const evaluacion = await getEvaluacionByIdService(id, user);
      if (!evaluacion) {
        return handleErrorClient(res, 404, "Evaluación no encontrada");
      }
      return handleSuccess(res, 200, "Evaluación obtenida exitosamente", { evaluacion });
    }

    const codigoRamo = String(id).trim();
    const evaluaciones = await getEvaluacionesByCodigoRamoService(codigoRamo, user);
    if (!evaluaciones) {
      return handleErrorClient(res, 404, "Ramo no encontrado");
    }

    return handleSuccess(res, 200, "Evaluaciones obtenidas exitosamente", { evaluaciones });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener evaluación", error.message);
  }
}

import { syncEvaluacionWithEvent } from "../utils/evaluation-event.utils.js";

export async function createEvaluacion(req, res) {
  try {
    const user = req.user;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const {error} = createEvaluacionValidation.validate(req.body, {
      context: { tomorrow }
    });
    if(error) return res.status(400).json({message: error.message});

    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo el profesor puede crear evaluaciones");
    }

    const { titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, ramo_id, codigoRamo, puntajeTotal, pautaPublicada } = req.body;

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
    handleErrorServer(res, 500, "Error al crear evaluación", error.message);
    res.status(500).json({message: error.message})
  }
}

export async function updateEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const {error} = updateEvaluacionValidation.validate(req.body);
    if(error) return res.status(400).json({message: error.message});

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo los profesor pueden modificar evaluaciones");
    }

    const { titulo, fechaProgramada, ponderacion, contenidos, pauta, aplicada, puntajeTotal, pautaPublicada } = req.body;

    
    let wasPublished = false;
    let ramoIdForNotif = null;
    try {
      const { AppDataSource } = await import("../config/configDb.js");
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
      userId: user.id,
    });

    if (!evaluacionActualizada) {
      return  handleErrorClient(res, 404, "No se pudo actualizar la evaluación");
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
    handleErrorServer(res, 500, "Error al actualizar evaluación", error.message);
    res.status(500).json({message:error.messaje});
  }
}

export async function deleteEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo el profesor puede eliminar evaluaciones");
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