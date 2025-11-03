import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  getAllEvaluacionesService,
  getEvaluacionByIdService,
  createEvaluacionService,
  updateEvaluacionService,
  deleteEvaluacionService,
} from "../services/evaluacion.service.js";
import { createEvaluacionValidation, updateEvaluacionValidation } from "../validations/evaluacion.validation.js";

/**Obtener todas las evaluacionesDocente*/
export async function getEvaluaciones(req, res) {
  try {
    const user = req.user;
    const evaluaciones = await getAllEvaluacionesService(user);

    handleSuccess(res, 200, "Evaluacion obtenida exitosamente", { evaluaciones });
  } catch (error) {
      handleErrorServer(res, 500,"Error al obtener evaluaciones", error.message);
  }
}

/** Obtener una evaluación por ID*/
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

/**Crear una nueva evaluaciónes*/
export async function createEvaluacion(req, res) {
  try {
    const user = req.user;
    // Calculamos la fecha de mañana (00:00:00)
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

    const { titulo, fechaProgramada, ponderacion, contenidos, ramo_id } = req.body;

    const nuevaEvaluacion = await createEvaluacionService({
      titulo,
      fechaProgramada,
      ponderacion,
      contenidos,
      ramo_id,
      creadaPor: user.id,
      aplicada: false
    });

    handleSuccess(res, 201,"Evaluación creada exitosamente",{ evaluacion: nuevaEvaluacion });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear evaluación", error.message);
    res.status(500).json({message: error.message})
  }
}

/**  Actualizar una evaluación */
export async function updateEvaluacion(req, res) {
  try {
    const user = req.user;
    const { id } = req.params;
    const {error} = updateEvaluacionValidation.validate(req.body);
    if(error) return res.status(400).json({message: error.message});

    if (user.role !== "profesor") {
      return  handleErrorClient(res, 403, "Solo los profesor pueden modificar evaluaciones");
    }

    const { titulo, fechaProgramada, ponderacion, contenidos, pauta, aplicada } = req.body;

    const evaluacionActualizada=await updateEvaluacionService(id, {
      titulo,
      fechaProgramada,
      ponderacion,
      contenidos,
      pauta,
      aplicada,
      userId: user.id,
    });

    if (!evaluacionActualizada) {
      return  handleErrorClient(res, 404, "No se pudo actualizar la evaluación ");
    }

    handleSuccess(res, 200, "Evaluación actualizada exitosamente", { evaluacion: evaluacionActualizada });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar evaluación", error.message);
    res.status(500).json({message:error.messaje});
  }
}

/**Eliminar una evaluación */
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
    handleErrorServer(res,500, "Error al eliminar evaluación", error.message);
  }
}
