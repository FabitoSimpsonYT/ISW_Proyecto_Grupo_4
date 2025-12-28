import api from './api.service';

const BASE_URL = '/retroalimentacion';

/**
 * Crear mensaje de retroalimentación
 */
export const crearRetroalimentacion = async (data) => {
  try {
    const response = await api.post(`${BASE_URL}/mensaje/crear`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear retroalimentación' };
  }
};

/**
 * Obtener mensajes de retroalimentación
 */
export const obtenerMensajes = async (alumnoRut, ramoId, evaluacionId = null, evaluacionIntegradoraId = null) => {
  try {
    let url = `${BASE_URL}/mensajes/${alumnoRut}/${ramoId}`;
    const params = new URLSearchParams();

    if (evaluacionId) params.append('evaluacionId', evaluacionId);
    if (evaluacionIntegradoraId) params.append('evaluacionIntegradoraId', evaluacionIntegradoraId);

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await api.get(url);
    return response.data; // Already contains { mensajes: [...] }
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener mensajes' };
  }
};

/**
 * Marcar mensajes como vistos
 */
export const marcarComoVistos = async (alumnoRut, ramoId, evaluacionId = null, evaluacionIntegradoraId = null) => {
  try {
    const response = await api.patch(`${BASE_URL}/mensajes/${alumnoRut}/${ramoId}/marcar-vistos`, {
      evaluacionId,
      evaluacionIntegradoraId,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al marcar como visto' };
  }
};

/**
 * Obtener conversaciones del profesor
 */
export const obtenerConversaciones = async (ramoId) => {
  try {
    const response = await api.get(`${BASE_URL}/conversaciones/${ramoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener conversaciones' };
  }
};

/**
 * Obtener mensajes no vistos del alumno
 */
export const obtenerNoVistos = async (ramoId) => {
  try {
    const response = await api.get(`${BASE_URL}/no-vistos/${ramoId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener mensajes no vistos' };
  }
};
