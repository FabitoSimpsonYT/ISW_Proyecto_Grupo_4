import { handleSuccess, handleErrorClient, handleErrorServer} from "../Handlers/responseHandlers.js";
import {
  createPautaService,
  getPautaByIdService,
  getAllPautasService,
  updatePautaService,
  deletePautaService,
  getPautaByEvaluacionService,
  getPautaByEvaluacionIntegradoraService,
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

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores y jefes de carrera pueden crear pautas"
      );
    }

    const result = await createPautaService(req.body, evaluacionId ? parseInt(evaluacionId) : null, null);

    if(result.error) return  handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Pauta creada exitosamente", { pauta: result });
  } catch (error) {
    handleErrorServer(res, 500, "Errror al crear pauta", error.message);
  }
}

export async function createPautaIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores y jefes de carrera pueden crear pautas"
      );
    }

    const result = await createPautaService(req.body, null, evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null);

    if(result.error) return  handleErrorClient(res, 400, result.error);

    handleSuccess(res, 201, "Pauta integradora creada exitosamente", { pauta: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al crear pauta integradora", error.message);
  }
}

export async function updatePauta(req, res) {
  try {
    const {id} = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores y jefes de carrera pueden actualizar pautas"
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

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores y jefes de carrera pueden eliminar pautas"
      );
    }

    const result= await deletePautaService(id, user);

    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta eliminada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta", error.message);
  }
}

export async function getAllPautas(req, res) {
  try {
    const user = req.user;
    const pautas = await getAllPautasService(user);
    handleSuccess(res, 200, "Pautas obtenidas exitosamente", { pautas });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pautas", error.message);
  }
}

export async function getPautaIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId } = req.params;
    const user = req.user;

    const result = await getPautaIntegradoraService(evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null, user);

    if (result.error) return handleErrorClient(res, 404, result.error);

    handleSuccess(res, 200, "Pauta integradora obtenida exitosamente", { pauta: result });
  } catch (error) {
    console.error("Error en getPautaIntegradora:", error);
    handleErrorServer(res, 500, "Error al obtener pauta integradora", error.message);
  }
}

export async function updatePautaIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores y jefes de carrera pueden actualizar pautas"
      );
    }

    const result = await updatePautaIntegradoraService(
      evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null, 
      req.body, 
      user
    );

    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta integradora actualizada exitosamente", { pauta: result });
  } catch (error) {
    handleErrorServer(res, 500, "Error al actualizar pauta integradora", error.message);
  }
}

export async function deletePautaIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId } = req.params;
    const user = req.user;

    if (user.role !== "profesor" && user.role !== "jefecarrera") {
      return handleErrorClient(
        res,
        403,
        "Solo los profesores y jefes de carrera pueden eliminar pautas"
      );
    }

    const result = await deletePautaIntegradoraService(
      evaluacionIntegradoraId ? parseInt(evaluacionIntegradoraId) : null,
      user
    );

    if (result.error) return handleErrorClient(res, 400, result.error);

    handleSuccess(res, 200, "Pauta integradora eliminada exitosamente");
  } catch (error) {
    handleErrorServer(res, 500, "Error al eliminar pauta integradora", error.message);
  }
}

/**
 * GET /pauta/evaluacion/:evaluacionId
 * Obtener pauta por evaluación
 */
export async function getPautaByEvaluacion(req, res) {
  try {
    const { evaluacionId } = req.params;

    const pauta = await getPautaByEvaluacionService(parseInt(evaluacionId));

    if (!pauta) {
      return handleErrorClient(res, 404, "Pauta no encontrada para esta evaluación");
    }

    handleSuccess(res, 200, "Pauta obtenida exitosamente", { pauta });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pauta", error.message);
  }
}

/**
 * GET /pauta/evaluacion-integradora/:evaluacionIntegradoraId
 * Obtener pauta por evaluación integradora
 */
export async function getPautaByEvaluacionIntegradora(req, res) {
  try {
    const { evaluacionIntegradoraId } = req.params;

    const pauta = await getPautaByEvaluacionIntegradoraService(parseInt(evaluacionIntegradoraId));

    if (!pauta) {
      return handleErrorClient(res, 404, "Pauta no encontrada para esta evaluación integradora");
    }

    handleSuccess(res, 200, "Pauta obtenida exitosamente", { pauta });
  } catch (error) {
    handleErrorServer(res, 500, "Error al obtener pauta", error.message);
  }
}