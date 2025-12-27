import axios from './root.service.js';

export async function getBloqueos() {
  try {
    const response = await axios.get('/bloqueos');
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener bloqueos' };
  }
}

export async function crearBloqueo(data) {
  try {
    const response = await axios.post('/bloqueos', data);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear bloqueo' };
  }
}

export async function eliminarBloqueo(id) {
  try {
    const response = await axios.delete(`/bloqueos/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar bloqueo' };
  }
}
