import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { addRetroalimentacionService, getRetroalimentacionesService } from "../services/retroalimentacion.service.js";
import { validateRetroalimentacion } from "../validations/retroalimentacion.validation.js";

export async function addRetroalimentacion(req, res) {
  try {
    const { error } = validateRetroalimentacion.validate(req.body);
    if (error) return handleErrorClient(res, 400, error.message);

    const { pautaId } = req.params;
    const user = req.user;

    const result = await addRetroalimentacionService(pautaId, req.body, user);
    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Retroalimentación agregada exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, "Error al agregar retroalimentación", error.message);
  }
}

export async function getRetroalimentaciones(req, res) {
  try {
    const { pautaId } = req.params;
    const user = req.user;

    const result = await getRetroalimentacionesService(pautaId, user);
    if (result.error) return handleErrorClient(res, 404, result.error);

    handleSuccess(res, 200, "Retroalimentaciones obtenidas exitosamente", result);
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener retroalimentaciones", error.message);
  }
}