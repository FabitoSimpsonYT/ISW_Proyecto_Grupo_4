import axios from "./root.service.js";

/**
 * Obtener RUT del token JWT almacenado en localStorage
 */
function getRutFromToken() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.rut || null;
    } catch (error) {
        console.error("Error al obtener RUT del token:", error);
        return null;
    }
}

/**
 * Crear pauta evaluada (respuesta del estudiante a la pauta)
 * POST /pauta-evaluadas/:evaluacionId/:pautaId
 */
export async function createPautaEvaluada(evaluacionId, pautaId, pautaEvaluadaData) {
    try {
        const response = await axios.post(`/pauta-evaluadas/${evaluacionId}/${pautaId}`, pautaEvaluadaData);
        return response.data?.data?.pautaEvaluada || response.data?.data || response.data;
    } catch (error) {
        console.error("Error al crear pauta evaluada:", error);
        throw error.response?.data || { message: "Error al crear la pauta evaluada" };
    }
}

/**
 * Obtener pauta evaluada por evaluación y alumno
 * GET /pauta-evaluadas/:evaluacionId/:alumnoRut
 */
export async function getPautaEvaluada(evaluacionId, alumnoRut) {
    try {
        const response = await axios.get(`/pauta-evaluadas/${evaluacionId}/${alumnoRut}`);
        const pautaEvaluada = response.data?.data?.pautaEvaluada || response.data?.data || null;
        return pautaEvaluada;
    } catch (error) {
        // Si es 404, retorna null (estudiante no evaluado aún)
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || { message: "Error al obtener la pauta evaluada" };
    }
}

/**
 * Actualizar pauta evaluada (reevaluación)
 * PATCH /pauta-evaluadas/:evaluacionId/:alumnoRut
 */
export async function updatePautaEvaluada(evaluacionId, alumnoRut, pautaEvaluadaData) {
    try {
        // Si no se proporciona RUT, extraerlo del token
        const rut = alumnoRut || getRutFromToken();
        if (!rut) {
            throw new Error("No se pudo obtener el RUT del usuario");
        }

        const response = await axios.patch(`/pauta-evaluadas/${evaluacionId}/${rut}`, pautaEvaluadaData);
        return response.data?.data?.pautaEvaluada || response.data?.data || response.data;
    } catch (error) {
        throw error.response?.data || { message: "Error al actualizar la pauta evaluada" };
    }
}

/**
 * Eliminar pauta evaluada
 * DELETE /pauta-evaluadas/:evaluacionId/:alumnoRut
 */
export async function deletePautaEvaluada(evaluacionId, alumnoRut) {
    try {
        const response = await axios.delete(`/pauta-evaluadas/${evaluacionId}/${alumnoRut}`);
        return response.data?.data || response.data;
    } catch (error) {
        throw error.response?.data || { message: "Error al eliminar la pauta evaluada" };
    }
}

/**
 * Obtener pauta evaluada integradora por evaluación integradora y alumno
 * GET /pauta-evaluadas-integradora/:evaluacionIntegradoraId/:alumnoRut
 */
export async function getPautaEvaluadaIntegradora(evaluacionIntegradoraId, alumnoRut) {
    try {
        const response = await axios.get(`/pauta-evaluadas-integradora/${evaluacionIntegradoraId}/${alumnoRut}`);
        const pautaEvaluada = response.data?.data?.pautaEvaluada || response.data?.data || null;
        return pautaEvaluada;
    } catch (error) {
        // Si es 404, retorna null (estudiante no evaluado aún)
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || { message: "Error al obtener la pauta evaluada integradora" };
    }
}

/**
 * Crear pauta evaluada integradora
 * POST /pauta-evaluadas-integradora/:evaluacionIntegradoraId/:pautaId
 */
export async function createPautaEvaluadaIntegradora(evaluacionIntegradoraId, pautaId, pautaEvaluadaData) {
    try {
        const response = await axios.post(`/pauta-evaluadas-integradora/${evaluacionIntegradoraId}/${pautaId}`, pautaEvaluadaData);
        return response.data?.data?.pautaEvaluada || response.data?.data || response.data;
    } catch (error) {
        console.error("Error al crear pauta evaluada integradora:", error);
        throw error.response?.data || { message: "Error al crear la pauta evaluada integradora" };
    }
}

/**
 * Actualizar pauta evaluada integradora (reevaluación)
 * PATCH /pauta-evaluadas-integradora/:evaluacionIntegradoraId/:alumnoRut
 */
export async function updatePautaEvaluadaIntegradora(evaluacionIntegradoraId, alumnoRut, pautaEvaluadaData) {
    try {
        const rut = alumnoRut || getRutFromToken();
        if (!rut) {
            throw new Error("No se pudo obtener el RUT del usuario");
        }

        const response = await axios.patch(`/pauta-evaluadas-integradora/${evaluacionIntegradoraId}/${rut}`, pautaEvaluadaData);
        return response.data?.data?.pautaEvaluada || response.data?.data || response.data;
    } catch (error) {
        throw error.response?.data || { message: "Error al actualizar la pauta evaluada integradora" };
    }
}
/**
 * Obtener pauta de evaluación
 * GET /pauta/by-evaluacion/:evaluacionId
 */
export async function getPautaByEvaluacion(evaluacionId) {
    try {
        const response = await axios.get(`/pauta/by-evaluacion/${evaluacionId}`);
        return response.data?.data?.pauta || null;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || { message: "Error al obtener la pauta" };
    }
}

/**
 * Obtener pauta de evaluación integradora
 * GET /pauta/by-evaluacion-integradora/:evaluacionIntegradoraId
 */
export async function getPautaByEvaluacionIntegradora(evaluacionIntegradoraId) {
    try {
        const response = await axios.get(`/pauta/by-evaluacion-integradora/${evaluacionIntegradoraId}`);
        return response.data?.data?.pauta || null;
    } catch (error) {
        if (error.response?.status === 404) {
            return null;
        }
        throw error.response?.data || { message: "Error al obtener la pauta" };
    }
}