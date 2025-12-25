import axios from './root.service.js';
// Inscribir alumno en una sección
export async function inscribirAlumnoEnSeccion(codigoRamo, seccionId, rutAlumno) {
  try {
    const response = await axios.post(`/ramos/inscribir/${codigoRamo}/${seccionId}`, { rutAlumno });
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al inscribir alumno' };
  }
}


// Obtener alumnos inscritos en una sección
// Recibe codigoRamo y numeroSeccion
export async function getAlumnosBySeccion(codigoRamo, numeroSeccion) {
  try {
    const response = await axios.get(`/ramos/alumnos/${codigoRamo}/${numeroSeccion}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener alumnos de la sección' };
  }
}


export async function getRamosByCodigo(codigo) {
  try {
    const response = await axios.get(`/ramos/${codigo}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener ramo' };
  }
}

export async function getMisRamos() {
  try {
    const response = await axios.get("/ramos/misRamos");
    return response.data?.data || [];
  } catch (error) {
    throw error.response?.data || { message: "Error al obtener ramos" };
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

export async function createSeccion(data) {
  try {
    const response = await axios.post('/ramos/secciones', data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear sección' };
  }
}

export async function getSeccionesByRamo(codigoRamo) {
  try {
    const response = await axios.get(`/ramos/secciones/${codigoRamo}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener secciones del ramo' };
  }
}
