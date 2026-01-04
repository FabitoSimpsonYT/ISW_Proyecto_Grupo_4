// Servicio para comentarios asociados a una pauta evaluada
// Usar el cliente axios con baseURL configurado
import apiClient from './root.service.js';

const BASE_URL = '/comentarios-pauta';

export const crearComentarioPauta = async (pautaEvaluadaId, data) => {
  try {
    const response = await apiClient.post(`${BASE_URL}/${pautaEvaluadaId}`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear comentario' };
  }
};

export const obtenerComentariosPauta = async (pautaEvaluadaId) => {
  try {
    const response = await apiClient.get(`${BASE_URL}/${pautaEvaluadaId}`);
    return response.data;
  } catch (error) {
    // Si no hay comentarios, algunos backends responden 404 o 204; devolvemos lista vacía silenciosamente
    if (error.response?.status === 404 || error.response?.status === 204) {
      return { comentarios: [] };
    }
    throw error.response?.data || { message: 'Error al obtener comentarios' };
  }
};

export const eliminarComentarioPauta = async (comentarioId) => {
  try {
    const response = await apiClient.delete(`${BASE_URL}/${comentarioId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar comentario' };
  }
};
