import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { createPautaEvaluadaService, getPautaEvaluadaService, updatePautaEvaluadaService, deletePautaEvaluadaService } from "../services/pautaEvaluada.service.js";
import { createPautaEvaluadaValidation, updatePautaEvaluadaValidation } from "../validations/pautaEvaluada.validation.js";
import { AppDataSource } from "../config/configDb.js";
import { Pauta } from "../entities/pauta.entity.js";

const pautaRepository = AppDataSource.getRepository(Pauta);

/**
 * Valida que los puntajes obtenidos tengan las mismas claves que la distribución de puntos
 * y que no excedan los valores máximos asignados
 */
function validatePuntajesVsDistribucion(puntajesObtenidos, distribucionPuntaje) {
  const puntajesKeys = Object.keys(puntajesObtenidos || {}).sort();
  const distribucionKeys = Object.keys(distribucionPuntaje || {}).sort();

  // Comparar arrays de claves
  if (puntajesKeys.length !== distribucionKeys.length) {
    return {
      error: true,
      message: `Los puntajes obtenidos deben tener exactamente ${distribucionKeys.length} criterios. Encontrados: ${puntajesKeys.length}`,
      expected: distribucionKeys,
      received: puntajesKeys
    };
  }

  // Verificar que todas las claves coincidan
  for (let i = 0; i < puntajesKeys.length; i++) {
    if (puntajesKeys[i] !== distribucionKeys[i]) {
      return {
        error: true,
        message: `Las claves de los puntajes no coinciden con la distribución. Se esperaba "${distribucionKeys[i]}" pero se encontró "${puntajesKeys[i]}"`,
        expected: distribucionKeys,
        received: puntajesKeys
      };
    }
  }

  // Verificar que cada puntaje no exceda el máximo asignado
  for (const criterio of distribucionKeys) {
    const puntajeObtenido = Number(puntajesObtenidos[criterio]) || 0;
    const puntajeMaximo = Number(distribucionPuntaje[criterio]) || 0;

    if (puntajeObtenido > puntajeMaximo) {
      return {
        error: true,
        message: `El puntaje obtenido en "${criterio}" (${puntajeObtenido}) no puede ser mayor al máximo asignado (${puntajeMaximo})`
      };
    }
  }

  return { error: false };
}

export async function createPautaEvaluada(req, res) {
  try {
    const { error } = createPautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { evaluacionId, pautaId } = req.params;
    const { alumnoRut, puntajes_obtenidos } = req.body;
    const user = req.user;

    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo el profesor puede registrar una pauta evaluada");
    }

    // Obtener la pauta para validar que los puntajes coincidan con la distribución
    const pauta = await pautaRepository.findOneBy({ id: parseInt(pautaId) });
    if (!pauta) return handleErrorClient(res, 400, "Pauta no encontrada");

    // Validar que los puntajes obtenidos coincidan con la distribución de puntos
    const validationResult = validatePuntajesVsDistribucion(puntajes_obtenidos, pauta.distribucionPuntaje);
    if (validationResult.error) {
      return handleErrorClient(res, 400, validationResult.message);
    }

    const result = await createPautaEvaluadaService(evaluacionId, pautaId, alumnoRut, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Pauta evaluada creada exitosamente", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear pauta evaluada", error.message);
  }
}

export async function getPautaEvaluada(req, res) {
  try {
    const { evaluacionId, alumnoRut } = req.params;
    const result = await getPautaEvaluadaService(evaluacionId, alumnoRut);
    if (result.error) return handleErrorClient(res, 404, result.error);
    handleSuccess(res, 200, "Pauta evaluada obtenida", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pauta evaluada", error.message);
  }
}

export async function updatePautaEvaluada(req, res) {
  try {
    const { error } = updatePautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { evaluacionId, alumnoRut } = req.params;
    const { puntajes_obtenidos } = req.body;
    const user = req.user;

    // Si se proporcionan puntajes_obtenidos, validar que coincidan con la distribución
    if (puntajes_obtenidos) {
      // Primero obtener la pautaEvaluada para acceder a la pauta
      const result = await getPautaEvaluadaService(evaluacionId, alumnoRut);
      if (result.error) return handleErrorClient(res, 404, result.error);

      const distribucion = result.pauta?.distribucionPuntaje || {};
      const validationResult = validatePuntajesVsDistribucion(puntajes_obtenidos, distribucion);
      if (validationResult.error) {
        return handleErrorClient(res, 400, validationResult.message);
      }
    }

    const result = await updatePautaEvaluadaService(evaluacionId, alumnoRut, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta evaluada actualizada", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar pauta evaluada", error.message);
  }
}

export async function deletePautaEvaluada(req, res) {
  try {
    const { evaluacionId, alumnoRut } = req.params;
    const user = req.user;

    const result = await deletePautaEvaluadaService(evaluacionId, alumnoRut, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, result.message, {});
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta evaluada", error.message);
  }
}
