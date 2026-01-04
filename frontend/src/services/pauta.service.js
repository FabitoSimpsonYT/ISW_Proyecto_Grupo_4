import axios from "./root.service.js";

/**
 * Obtener todas las pautas 
 */
export async function getAllPautas(){
      try {
        const response = await axios.get('/pauta');
        return Array.isArray(response.data) ? response.data : (response.data?.data || []);
      } catch (error) {
        console.error('Error al obtener las pautas:', error);
        return [];
      }
}
/**
 * Obtener una pauta por id
 */
export async function getPautaById(id) {
   try {
    const response = await axios.get(`/pauta/${id}`);
    return response.data?.data?.pauta || response.data;
   } catch (error) {
      throw error.response?.data || {message: 'Error al obtener la pauta'};
   }
}


/**
 * Crear pauta 
 */
export async function createPauta(pautaData, evaluacionId) {
  try {
    const url = evaluacionId ? `/pauta/${evaluacionId}` : '/pauta';
    const response = await axios.post(url, pautaData);
    return response.data?.data?.pauta || response.data;
  } catch (error) {
    throw error.response?.data || {message:'Error al crear la pauta'};
  }
}

/**
 * Crear pauta para evaluación integradora
 */
export async function createPautaIntegradora(pautaData, evaluacionIntegradoraId) {
  try {
    const url = `/pauta/integradora/${evaluacionIntegradoraId}`;
    const response = await axios.post(url, pautaData);
    return response.data?.data?.pauta || response.data;
  } catch (error) {
    throw error.response?.data || {message:'Error al crear la pauta integradora'};
  }
}

/**
 * Obtener pauta integradora por evaluacionIntegradoraId
 */
export async function getPautaIntegradora(evaluacionIntegradoraId) {
  try {
    const response = await axios.get(`/pauta/integradora/${evaluacionIntegradoraId}`);
    const pauta = response.data?.data?.pauta || response.data?.pauta || response.data;
    return pauta;
  } catch (error) {
    throw error.response?.data || {message: 'Error al obtener la pauta integradora'};
  }
}

/**
 * Actualizar una pauta
 */
export async function updatePauta(id, pautaData) {
   try {
    const response = await axios.patch(`/pauta/${id}`, pautaData);
    return response.data;
   } catch (error) {
     throw error.response?.data || {message:'Error al actualizar la pauta'};
   }
}

/**
 * Actualizar pauta integradora
 */
export async function updatePautaIntegradora(evaluacionIntegradoraId, pautaData) {
  try {
    const response = await axios.patch(`/pauta/integradora/${evaluacionIntegradoraId}`, pautaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || {message: 'Error al actualizar la pauta integradora'};
  }
}

/**
 * Publicar una pauta
 */
export async function publishPauta(id) {
  try {
    const response = await axios.patch(`/pauta/${id}/publicar`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al publicar la pauta' };
  }
}

/**
 * Publicar pauta integradora por evaluacionIntegradoraId
 */
export async function publishPautaIntegradora(evaluacionIntegradoraId) {
  try {
    const response = await axios.patch(`/pauta/integradora/${evaluacionIntegradoraId}/publicar`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al publicar la pauta integradora' };
  }
}

/**
 * Eliminar pauta
 */
export async function deletePauta(id) {
  try {
    const response = await axios.delete(`/pauta/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || {message:'Error al eliminar la pauta'};
  }
}

/**
 * Eliminar pauta integradora
 */
export async function deletePautaIntegradora(evaluacionIntegradoraId) {
  try {
    const response = await axios.delete(`/pauta/integradora/${evaluacionIntegradoraId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || {message: 'Error al eliminar la pauta integradora'};
  }
}