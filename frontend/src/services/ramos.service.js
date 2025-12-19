import axios from './root.service.js';

export async function getRamosByCodigo(codigo) {
  try {
    const response = await axios.get(`/ramos/${codigo}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener ramo' };
  }
}

export async function getAllRamos() {
  try {
    const response = await axios.get('/ramos');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener ramos' };
  }
}

export async function createRamo(data) {
  try {
    const response = await axios.post('/ramos', data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear ramo' };
  }
}

export async function updateRamo(codigo, data) {
  try {
    const response = await axios.patch(`/ramos/${codigo}`, data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar ramo' };
  }
}

export async function deleteRamo(codigo) {
  try {
    const response = await axios.delete(`/ramos/${codigo}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar ramo' };
  }
}
