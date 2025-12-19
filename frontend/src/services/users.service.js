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
