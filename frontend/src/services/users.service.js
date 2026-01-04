import axios from './root.service.js';

// Admin
export async function getAllAdmins() {
  try {
    const response = await axios.get('/admin');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener admins' };
  }
}

export async function createAdmin(data) {
  try {
    const response = await axios.post('/admin', data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear admin' };
  }
}

// Profesor
export async function getAllProfesores() {
  try {
    const response = await axios.get('/profesores');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener profesores' };
  }
}

export async function createProfesor(data) {
  try {
    const response = await axios.post('/profesores', data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear profesor' };
  }
}

export async function getProfesorById(id) {
  try {
    const response = await axios.get(`/profesores/${id}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener profesor' };
  }
}

export async function getProfesorByRut(rut) {
  try {
    const response = await axios.get(`/profesores/rut/${rut}`);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener profesor' };
  }
}

// Alumno
export async function getAllAlumnos() {
  try {
    const response = await axios.get('/alumnos');
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al obtener alumnos' };
  }
}

export async function createAlumno(data) {
  try {
    const response = await axios.post('/alumnos', data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al crear alumno' };
  }
}

// Promociones
export async function promoverProfesorAJefeCarrera(rutProfesor) {
  try {
    const response = await axios.post('/admin/promover', { rutProfesor });
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al promover profesor' };
  }
}

export async function degradarJefeCarreraAProfesor() {
  try {
    const response = await axios.post('/admin/degradar', {});
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al degradar jefe de carrera' };
  }
}

export async function getJefeCarreraActual() {
  try {
    const response = await axios.get('/admin/jefe-carrera');
    return response.data.data;
  } catch (error) {
    // Retornar null en lugar de lanzar error si no hay jefe de carrera
    if (error.response?.status === 404) {
      return null;
    }
    throw error.response?.data || { message: 'Error al obtener jefe de carrera actual' };
  }
}

// Obtener todos los usuarios
export async function getAllUsers() {
  try {
    const [admins, profesores, alumnos] = await Promise.all([
      getAllAdmins().catch(() => []),
      getAllProfesores().catch(() => []),
      getAllAlumnos().catch(() => [])
    ]);

    return {
      admins,
      profesores,
      alumnos
    };
  } catch (error) {
    throw error;
  }
}

// Eliminar usuarios
export async function deleteAdmin(id) {
  try {
    const response = await axios.delete(`/admin/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar admin' };
  }
}

export async function deleteProfesor(id) {
  try {
    const response = await axios.delete(`/profesores/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar profesor' };
  }
}

export async function deleteAlumno(id) {
  try {
    const response = await axios.delete(`/alumnos/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al eliminar alumno' };
  }
}

// Actualizar usuarios
export async function updateAdmin(id, data) {
  try {
    const response = await axios.patch(`/admin/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar admin' };
  }
}

export async function updateProfesor(id, data) {
  try {
    const response = await axios.patch(`/profesores/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar profesor' };
  }
}

export async function updateAlumno(id, data) {
  try {
    const response = await axios.patch(`/alumnos/${id}`, data);
    return response.data.data;
  } catch (error) {
    throw error.response?.data || { message: 'Error al actualizar alumno' };
  }
}
