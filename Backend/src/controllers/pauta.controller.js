import { handleSuccess, handleErrorClient, handleErrorServer} from "../Handlers/responseHandlers.js";
import {
  createPautaService,
  getPautaByIdService,
  updatePautaService,
  deletePautaService,
} from "../services/pauta.service.js";

export async function getPautaById(req, res) {
  try {
    const {id} = req.params;
    const user = req.user;

    const result = await getPautaByIdService(id, user);

    if (result.error) return handleErrorClient(res, 404, result.error);

    handleSuccess(res, 200, "Pauta obtenida exitosamente", { pauta: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pauta", error.message);
  }
}

export async function createPauta(req, res) {
  try {
    const { evaluacionId } = req.params;
    const user = req.user;

    if (user.role !== "profesor") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesor pueden crear pautas"
      );
    }

    // Permitir crear pauta sin evaluacionId
    const result = await createPautaService(req.body, evaluacionId || null);

    if(result.error) return  handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Pauta creada exitosamente", { pauta: result });
  } catch (error) {
    handleErrorServer(res, 500, "Errror al crear pauta", error.message);
  }
}

export async function updatePauta(req, res) {
  try {
    const {id} = req.params;
    const user = req.user;

    if (user.role !== "profesor") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesor pueden actualizar pautas"
      );
    }

    const result =await updatePautaService(id, req.body, user);

    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta actualizada exitosamente", { pauta: result });
  } catch (error) {
    handleErrorServer(res, 500, "Errror al actualizar pauta", error.message);
  }
}
export async function deletePauta(req, res) {
  try {
    const {id} = req.params;
    const user = req.user;

    if (user.role !== "profesor") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores pueden eliminar pautas"
      );
    }

    const result= await deletePautaService(id, user);

    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta eliminada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta", error.message);
  }
}