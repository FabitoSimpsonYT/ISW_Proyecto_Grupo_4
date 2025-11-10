import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { createPautaEvaluadaService, getPautaEvaluadaService, updatePautaEvaluadaService, deletePautaEvaluadaService } from "../services/pautaEvaluada.service.js";
import { createPautaEvaluadaValidation, updatePautaEvaluadaValidation } from "../validations/pautaEvaluada.validation.js";

export async function createPautaEvaluada(req, res) {
  try {
    const { error } = createPautaEvaluadaValidation.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

  const { evaluacionId } = req.params;
    const user = req.user;

    if (user.role !== "profesor") {
      return handleErrorClient(res, 403, "Solo el profesor puede registrar una pauta evaluada");
    }

    const result = await createPautaEvaluadaService(evaluacionId, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Pauta evaluada creada exitosamente", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear pauta evaluada", error.message);
  }
}

export async function getPautaEvaluada(req, res) {
  try {
    const { id } = req.params;
    const result = await getPautaEvaluadaService(id);
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

    const { id } = req.params;
    const user = req.user;

    const result = await updatePautaEvaluadaService(id, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta evaluada actualizada", { pautaEvaluada: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar pauta evaluada", error.message);
  }
}

export async function deletePautaEvaluada(req, res) {
  try {
    const { id } = req.params;
    const user = req.user;

    const result = await deletePautaEvaluadaService(id, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, result.message, {});
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta evaluada", error.message);
  }
}
