import axios from './root.service.js';

export async function getNotificaciones() {
  try {
    const response = await axios.get('/notificaciones');
    return response.data?.data || [];
  } catch (error) {
    throw error.response?.data || { message: 'Error al cargar notificaciones' };
  }
}

export async function marcarNotificacionLeida(id) {
  try {
    const response = await axios.patch(`/notificaciones/${id}/leer`);
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al marcar notificación como leída' };
  }
}

/**
 * Obtiene notificaciones sin leer del usuario actual
 */
export async function getNotificacionesSinLeer() {
  try {
    const response = await axios.get('/notificaciones/sin-leer');
    return response.data?.data || [];
  } catch (error) {
    throw error.response?.data || { message: 'Error al cargar notificaciones sin leer' };
  }
}

/**
 * Obtiene notificaciones filtradas por tipo
 * @param {string} tipo - Tipo de notificación: 'evaluacion', 'bloqueo', 'evento', 'apelacion', etc
 */
export async function getNotificacionesPorTipo(tipo) {
  try {
    const response = await axios.get(`/notificaciones/tipo/${tipo}`);
    return response.data?.data || [];
  } catch (error) {
    throw error.response?.data || { message: `Error al cargar notificaciones de tipo ${tipo}` };
  }
}

/**
 * Marca todas las notificaciones como leídas
 */
export async function marcarTodoComoLeido() {
  try {
    const response = await axios.patch('/notificaciones/marcar-todo/leido');
    return response.data?.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al marcar notificaciones como leídas' };
  }
}
