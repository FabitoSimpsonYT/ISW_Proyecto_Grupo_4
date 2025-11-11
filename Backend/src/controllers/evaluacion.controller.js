import { handleSuccess, handleErrorClient, handleErrorServer, BadRequestError, NotFoundError, UnauthorizedError } from "../Handlers/responseHandlers.js";
import {
  getAllEvaluacionesService,
  getEvaluacionByIdService,
  createEvaluacionService,
  updateEvaluacionService,
  deleteEvaluacionService,
} from "../services/evaluacion.service.js";
import { createEvaluacionValidation, updateEvaluacionValidation } from "../validations/evaluacion.validation.js";
import { AppDataSource } from "../config/configDb.js";
import { Ramos } from "../entities/ramos.entity.js";


export async function getEvaluaciones(req, res) {
  try {
    const user = req.user;
    const evaluaciones = await getAllEvaluacionesService(user);

    handleSuccess(res, 200, "Evaluacion obtenida exitosamente", { evaluaciones });
  } catch (error) {
      if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
        return handleErrorClient(res, error.statusCode || 400, error.message);
      }
      handleErrorServer(res, 500,"Error al obtener evaluaciones", error.message);
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
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return handleErrorClient(res, error.statusCode || 400, error.message);
    }
    handleErrorServer(res, 500, "Error al obtener evaluación", error.message);
  }
}

import { syncEvaluacionWithEvent } from "../utils/evaluation-event.utils.js";
import { checkEventConflict } from "../services/conflictService.js";

export async function createEvaluacion(req, res) {
  try {
    const user = req.user;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const {error, value} = createEvaluacionValidation.validate(req.body, {
      context: { tomorrow }
    });
    if(error) {
      return res.status(400).json({message: error.message});
    }
    


    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo el profesor puede crear evaluaciones");
    }

    const { titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, codigoRamo } = value;

    if (!codigoRamo) {
      return handleErrorClient(res, 400, "El código del ramo es obligatorio");
    }

    console.log("Buscando ramo con código:", codigoRamo); 

    const ramosRepository = AppDataSource.getRepository(Ramos);
    const ramo = await ramosRepository.findOne({
      where: { codigo: codigoRamo },
      relations: ["profesor"]
    });

    if (!ramo) {
      return handleErrorClient(res, 404, `No se encontró ramo con código: ${codigoRamo}`);
    }

    console.log("Ramo encontrado:", ramo.id); // DEBUG


    const ramoProfesorId = ramo.profesor ? String(ramo.profesor.id) : null;
    const userIdStr = user && user.id ? String(user.id) : null;

    if (!ramo.profesor || ramoProfesorId !== userIdStr) {
      return handleErrorClient(res, 403, "El profesor autenticado no dicta este ramo");
    }

    const fechaEval = new Date(fechaProgramada);
    const fechaFin = new Date(fechaEval);
    fechaFin.setHours(fechaFin.getHours() + 2);


    const conflictCheck = await checkEventConflict(user.id, fechaEval.toISOString(), fechaFin.toISOString());
    if (conflictCheck && conflictCheck.hasConflict) {

      return handleErrorClient(res, 409, `Conflicto de horario: existe una actividad en el mismo rango horario.`);
    }

    const nuevaEvaluacion = await createEvaluacionService({
      titulo,
      fechaProgramada,
      horaInicio,
      horaFin,
      ponderacion,
      contenidos,
      ramo_id: ramo.id,
      creadaPor: user.id,
      aplicada: false
    });



    handleSuccess(res, 201,"Evaluación creada exitosamente",{ evaluacion: nuevaEvaluacion });
  } catch (error) {

    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return handleErrorClient(res, error.statusCode || 400, error.message);
    }
    handleErrorServer(res, 500, "Error al crear evaluación", error.message);
  }
}


export async function updateEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const { error, value } = updateEvaluacionValidation.validate(req.body);
    if (error) return res.status(400).json({ message: error.message });

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo los profesor pueden modificar evaluaciones");
    }

  const { titulo, fechaProgramada, horaInicio, horaFin, ponderacion, contenidos, codigoRamo, pauta, aplicada } = value;

    if (fechaProgramada) {
      const fechaEval = new Date(fechaProgramada);
      const fechaFin = new Date(fechaEval);
      fechaFin.setHours(fechaFin.getHours() + 2);

      const conflictCheck = await checkEventConflict(user.id, fechaEval.toISOString(), fechaFin.toISOString());
      if (conflictCheck && conflictCheck.hasConflict) {
        const remaining = conflictCheck.conflictingEvents.filter(c => String(c.evaluation_id) !== String(id));
        if (remaining.length > 0) {
          return handleErrorClient(res, 409, `Conflicto de horario: existe una actividad en el mismo rango horario.`);
        }
      }
    }

    const evaluacionActualizada = await updateEvaluacionService(id, {
      ...value,
      userId: user.id,
    });

    if (!evaluacionActualizada) {
      return  handleErrorClient(res, 404, "No se pudo actualizar la evaluación ");
    }

    handleSuccess(res, 200, "Evaluación actualizada exitosamente", { evaluacion: evaluacionActualizada });
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return handleErrorClient(res, error.statusCode || 400, error.message);
    }
    handleErrorServer(res, 500, "Error al actualizar evaluación", error.message);
  }
}


export async function deleteEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo el profesor puede eliminar evaluaciones");
    }

    const eliminada =await deleteEvaluacionService(id,user.id);

    if (!eliminada) {
      return  handleErrorClient(res, 404,"No se pudo eliminar la evaluación ");
    }

    handleSuccess(res, 200,"Evaluación eliminada exitosamente");
  } catch (error) {
    if (error instanceof BadRequestError || error instanceof NotFoundError || error instanceof UnauthorizedError) {
      return handleErrorClient(res, error.statusCode || 400, error.message);
    }
    handleErrorServer(res,500, "Error al eliminar evaluación", error.message);
  }
}
