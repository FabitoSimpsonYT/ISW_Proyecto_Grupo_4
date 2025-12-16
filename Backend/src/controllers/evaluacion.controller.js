import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  getAllEvaluacionesService,
  getEvaluacionByIdService,
  createEvaluacionService,
  updateEvaluacionService,
  deleteEvaluacionService,
} from "../services/evaluacion.service.js";
import { createEvaluacionValidation, updateEvaluacionValidation } from "../validations/evaluacion.validation.js";
import { notificarAlumnos } from "../services/notificacionuno.service.js";

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
    const evaluacion = await getEvaluacionByIdService(id, user);
    if (!evaluacion) {
      return handleErrorClient(res, 404, "Evaluación no encontrada");
    }
    handleSuccess(res, 200, "Evaluación obtenida exitosamente", { evaluacion });
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

    const { titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, ramo_id, codigoRamo, puntajeTotal } = req.body;

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
      creadaPor: user.id,
      aplicada: false,
    });

    await syncEvaluacionWithEvent(nuevaEvaluacion, user, false);

    // 🔔 NOTIFICAR A LOS ALUMNOS DEL RAMO
    try {
      const { AppDataSource } = await import("../config/configDb.js");
      const { Ramos } = await import("../entities/ramos.entity.js");

      const ramoRepo = AppDataSource.getRepository(Ramos);
      const ramo = await ramoRepo.findOne({
        where: { id: nuevaEvaluacion.ramo.id },
        relations: ["secciones", "secciones.alumnos", "secciones.alumnos.user"],
      });

      const emails = [];
      if (ramo && ramo.secciones && ramo.secciones.length > 0) {
        ramo.secciones.forEach((seccion) => {
          if (seccion.alumnos && seccion.alumnos.length > 0) {
            seccion.alumnos.forEach((alumno) => {
              if (alumno.user && alumno.user.email) emails.push(alumno.user.email);
            });
          }
        });
      }

      const uniqueEmails = [...new Set(emails)];

      if (uniqueEmails.length > 0) {
        await notificarAlumnos(
          uniqueEmails,
          "Nueva Evaluación Disponible",
          `Se ha creado una nueva evaluación: "${titulo}". Revisa los detalles y prepárate.`,
          nuevaEvaluacion.id
        );
        console.log(`✅ ${uniqueEmails.length} alumnos notificados sobre nueva evaluación`);
      } else {
        console.log("notificarAlumnos: lista de emails vacía para nueva evaluación");
      }
    } catch (notifError) {
      console.warn("⚠️ Advertencia: No se pudieron notificar los alumnos:", notifError.message || notifError);
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

    const { titulo, fechaProgramada, ponderacion, contenidos, pauta, aplicada, puntajeTotal } = req.body;

    const evaluacionActualizada = await updateEvaluacionService(id, {
      titulo,
      fechaProgramada,
      ponderacion,
      contenidos,
      pauta,
      aplicada,
      puntajeTotal,
      userId: user.id,
    });

    if (!evaluacionActualizada) {
      return  handleErrorClient(res, 404, "No se pudo actualizar la evaluación");
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