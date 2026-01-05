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
    console.log('[ramos.service] GET /ramos/misRamos iniciando');
    const response = await axios.get("/ramos/misRamos");
    console.log('[ramos.service] GET /ramos/misRamos status:', response.status);
    console.log('[ramos.service] GET /ramos/misRamos payload:', response.data);
    return response.data?.data || [];
  } catch (error) {
    console.error('[ramos.service] Error GET /ramos/misRamos:', error?.response?.data || error);
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
    // Se espera que data incluya el campo codigoRamo
    const response = await axios.post(`/ramos/secciones/${data.codigoRamo}`, data);
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

export async function getProfesorByRut(rut) {
  try {
    const response = await axios.get(`/profile/${rut}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener profesor' };
  }
}
export async function getRamosByAnioPeriodo(anio, periodo) {
  try {
    const response = await axios.get(`/ramos/filtrar/periodo?anio=${anio}&periodo=${periodo}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al filtrar ramos' };
  }
}

export async function getMisRamosByAnioPeriodo(anio, periodo) {
  try {
    const response = await axios.get(`/ramos/misRamos/filtrar?anio=${anio}&periodo=${periodo}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al filtrar mis ramos' };
  }
}

export async function deleteSeccion(seccionId, codigoRamo) {
  try {
    const response = await axios.delete(`/ramos/secciones/${codigoRamo}/${seccionId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar sección' };
  }
}

// Función helper para formatear el código del ramo con año y periodo
export function formatCodigoRamo(ramo) {
  if (!ramo) return '';

  // Si el código ya viene en formato completo (CCC...-YYYY-P), respétalo
  if (ramo.codigo && ramo.codigo.split('-').length >= 3) {
    return ramo.codigo;
  }

  // Si no, construye usando anio y periodo cuando estén disponibles
  if (ramo.codigo && ramo.anio && ramo.periodo) {
    return `${ramo.codigo}-${ramo.anio}-${ramo.periodo}`;
  }

  return ramo.codigo || '';
}