import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import {
  createEvaluacionIntegradoraService,
  getEvaluacionIntegradoraService,
  updateEvaluacionIntegradoraService,
  deleteEvaluacionIntegradoraService,
  createPautaIntegradoraService,
  updatePautaIntegradoraService,
  getPautasIntegradorasService,
  getNotaIntegradoraAlumnoService,
} from "../services/evaluacionIntegradora.service.js";

/**
 * POST /evaluacion-integradora/:codigoRamo
 * Crear evaluación integradora
 */
export async function createEvaluacionIntegradora(req, res) {
  try {
    const { codigoRamo } = req.params;
    const user = req.user;

    // Validar que solo profesores y jefes de carrera puedan crear
    if (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin") {
      return handleErrorClient(res, 403, "No tiene permiso para crear evaluación integradora");
    }

    // Validar formato de horas si se proporcionan
    const horaPattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (req.body.horaInicio && !horaPattern.test(req.body.horaInicio)) {
      return handleErrorClient(res, 400, "La hora de inicio debe estar en formato HH:mm (ej: 10:30)");
    }
    if (req.body.horaFin && !horaPattern.test(req.body.horaFin)) {
      return handleErrorClient(res, 400, "La hora de fin debe estar en formato HH:mm (ej: 11:30)");
    }

    const resultado = await createEvaluacionIntegradoraService(codigoRamo, req.body);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 201, "Evaluación integradora creada exitosamente", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear evaluación integradora", error.message);
  }
}

/**
 * GET /evaluacion-integradora/:codigoRamo
 * Obtener evaluación integradora de un ramo
 */
export async function getEvaluacionIntegradora(req, res) {
  try {
    const { codigoRamo } = req.params;

    const resultado = await getEvaluacionIntegradoraService(codigoRamo);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Evaluación integradora obtenida", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener evaluación integradora", error.message);
  }
}

/**
 * PATCH /evaluacion-integradora/:evaluacionId
 * Actualizar evaluación integradora
 */
export async function updateEvaluacionIntegradora(req, res) {
  try {
    const { evaluacionId } = req.params;
    const user = req.user;

    // Validar permiso
    if (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin") {
      return handleErrorClient(res, 403, "No tiene permiso para actualizar");
    }

    // Validar formato de horas si se proporcionan
    const horaPattern = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (req.body.horaInicio && !horaPattern.test(req.body.horaInicio)) {
      return handleErrorClient(res, 400, "La hora de inicio debe estar en formato HH:mm (ej: 10:30)");
    }
    if (req.body.horaFin && !horaPattern.test(req.body.horaFin)) {
      return handleErrorClient(res, 400, "La hora de fin debe estar en formato HH:mm (ej: 11:30)");
    }

    const resultado = await updateEvaluacionIntegradoraService(evaluacionId, req.body);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Evaluación integradora actualizada", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar evaluación integradora", error.message);
  }
}

/**
 * DELETE /evaluacion-integradora/:evaluacionId
 * Eliminar evaluación integradora
 */
export async function deleteEvaluacionIntegradora(req, res) {
  try {
    const { evaluacionId } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin") {
      return handleErrorClient(res, 403, "No tiene permiso para eliminar");
    }

    const resultado = await deleteEvaluacionIntegradoraService(evaluacionId);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Evaluación integradora eliminada");
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar evaluación integradora", error.message);
  }
}

/**
 * POST /evaluacion-integradora/:evaluacionIntegradoraId/pauta/:alumnoRut
 * Crear pauta evaluada integradora
 */
export async function createPautaIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId, alumnoRut } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin") {
      return handleErrorClient(res, 403, "No tiene permiso");
    }

    const resultado = await createPautaIntegradoraService(evaluacionIntegradoraId, alumnoRut, req.body);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 201, "Pauta integradora creada", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear pauta integradora", error.message);
  }
}

/**
 * PATCH /evaluacion-integradora/pauta/:pautaIntegradoraId
 * Actualizar pauta evaluada integradora
 */
export async function updatePautaIntegradora(req, res) {
  try {
    const { pautaIntegradoraId } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin") {
      return handleErrorClient(res, 403, "No tiene permiso");
    }

    const resultado = await updatePautaIntegradoraService(pautaIntegradoraId, req.body);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Pauta integradora actualizada", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar pauta integradora", error.message);
  }
}

/**
 * GET /evaluacion-integradora/:evaluacionIntegradoraId/pautas
 * Obtener todas las pautas de una evaluación integradora
 */
export async function getPautasIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId } = req.params;

    const resultado = await getPautasIntegradorasService(evaluacionIntegradoraId);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Pautas obtenidas", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pautas", error.message);
  }
}

/**
 * GET /evaluacion-integradora/:codigoRamo/alumno/:alumnoRut/nota
 * Obtener nota integradora de un alumno
 */
export async function getNotaIntegradoraAlumno(req, res) {
  try {
    const { codigoRamo, alumnoRut } = req.params;
    const user = req.user;

    // Validar que el alumno solo vea su propia nota
    if (user.role === "alumno" && user.rut !== alumnoRut) {
      return handleErrorClient(res, 403, "No tiene permiso");
    }

    const resultado = await getNotaIntegradoraAlumnoService(codigoRamo, alumnoRut);

    if (resultado.error) {
      return handleErrorClient(res, 400, resultado.error);
    }

    handleSuccess(res, 200, "Nota integradora obtenida", resultado.data);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener nota integradora", error.message);
  }
}
