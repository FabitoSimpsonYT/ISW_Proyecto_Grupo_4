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