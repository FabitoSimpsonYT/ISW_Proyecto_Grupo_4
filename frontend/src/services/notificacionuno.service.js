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
