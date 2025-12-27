import axios from './root.service.js';

/**
 * Crear evaluación integradora
 */
export async function createEvaluacionIntegradora(codigoRamo, data) {
  try {
    const response = await axios.post(
      `/evaluacion-integradora/${codigoRamo}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error creando evaluación integradora:', error);
    const errorData = error.response?.data || { message: "Error al crear evaluación integradora" };
    const errorObj = new Error(errorData.message || errorData.error || "Error al crear evaluación integradora");
    throw errorObj;
  }
}

/**
 * Obtener evaluación integradora de un ramo
 */
export async function getEvaluacionIntegradora(codigoRamo) {
  try {
    const response = await axios.get(
      `/evaluacion-integradora/${codigoRamo}`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo evaluación integradora:', error);
    throw error;
  }
}

/**
 * Actualizar evaluación integradora
 */
export async function updateEvaluacionIntegradora(evaluacionId, data) {
  try {
    const response = await axios.patch(
      `/evaluacion-integradora/${evaluacionId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error actualizando evaluación integradora:', error);
    const errorData = error.response?.data || { message: "Error al actualizar evaluación integradora" };
    const errorObj = new Error(errorData.message || errorData.error || "Error al actualizar evaluación integradora");
    throw errorObj;
  }
}

/**
 * Eliminar evaluación integradora
 */
export async function deleteEvaluacionIntegradora(evaluacionId) {
  try {
    const response = await axios.delete(
      `/evaluacion-integradora/${evaluacionId}`
    );
    return response.data;
  } catch (error) {
    console.error('Error eliminando evaluación integradora:', error);
    throw error;
  }
}

/**
 * Obtener pautas de una evaluación integradora
 */
export async function getPautasIntegradora(evaluacionIntegradoraId) {
  try {
    const response = await axios.get(
      `/evaluacion-integradora/${evaluacionIntegradoraId}/pautas`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo pautas integradoras:', error);
    throw error;
  }
}

/**
 * Crear pauta integradora para un alumno
 */
export async function createPautaIntegradora(evaluacionIntegradoraId, alumnoRut, data) {
  try {
    const response = await axios.post(
      `/evaluacion-integradora/${evaluacionIntegradoraId}/pauta/${alumnoRut}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error creando pauta integradora:', error);
    throw error;
  }
}

/**
 * Actualizar pauta integradora
 */
export async function updatePautaIntegradora(pautaIntegradoraId, data) {
  try {
    const response = await axios.patch(
      `/evaluacion-integradora/pauta/${pautaIntegradoraId}`,
      data
    );
    return response.data;
  } catch (error) {
    console.error('Error actualizando pauta integradora:', error);
    throw error;
  }
}

/**
 * Obtener nota integradora de un alumno
 */
export async function getNotaIntegradora(codigoRamo, alumnoRut) {
  try {
    const response = await axios.get(
      `/evaluacion-integradora/${codigoRamo}/alumno/${alumnoRut}/nota`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo nota integradora:', error);
    throw error;
  }
}
