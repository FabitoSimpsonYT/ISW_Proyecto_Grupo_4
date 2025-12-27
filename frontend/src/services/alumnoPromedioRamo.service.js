import axios from './root.service.js';

/**
 * Obtiene todos los promedios de un alumno en todos sus ramos
 * @param {string} alumnoRut - RUT del alumno
 * @returns {Promise} Array de promedios en todos los ramos
 */
export async function getPromediosByAlumno(alumnoRut) {
  try {
    const response = await axios.get(
      `/promedios/alumno/${alumnoRut}`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo promedios del alumno:', error);
    throw error;
  }
}

/**
 * Obtiene el promedio final de un alumno en un ramo
 * @param {string} codigoRamo - Código del ramo
 * @param {string} alumnoRut - RUT del alumno
 * @returns {Promise} Respuesta con promedio final, promedio oficial y estado
 */
export async function getPromedioFinal(codigoRamo, alumnoRut) {
  try {
    const response = await axios.get(
      `/promedios/${codigoRamo}/alumno/${alumnoRut}/promedio`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo promedio final:', error);
    throw error;
  }
}

/**
 * Calcula y guarda el promedio parcial de un alumno en un ramo
 * @param {string} codigoRamo - Código del ramo
 * @param {string} alumnoRut - RUT del alumno
 * @returns {Promise} Respuesta con promedio parcial guardado
 */
export async function createPromedioParcial(codigoRamo, alumnoRut) {
  try {
    const response = await axios.post(
      `/promedios/${codigoRamo}/alumno/${alumnoRut}/parcial`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error creando promedio parcial:', error);
    throw error;
  }
}

/**
 * Calcula y crea el promedio final de un alumno en un ramo (con integradora si existe)
 * Requiere que ya exista un promedio parcial
 * @param {string} codigoRamo - Código del ramo
 * @param {string} alumnoRut - RUT del alumno
 * @returns {Promise} Respuesta con promedio final creado
 */
export async function createPromedioFinal(codigoRamo, alumnoRut) {
  try {
    const response = await axios.post(
      `/promedios/${codigoRamo}/alumno/${alumnoRut}/final`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error creando promedio final:', error);
    throw error;
  }
}

/**
 * Actualiza el promedio final cuando cambia una nota
 * @param {string} codigoRamo - Código del ramo
 * @param {string} alumnoRut - RUT del alumno
 * @returns {Promise} Respuesta con promedio actualizado
 */
export async function updatePromedioFinal(codigoRamo, alumnoRut) {
  try {
    const response = await axios.patch(
      `/promedios/${codigoRamo}/alumno/${alumnoRut}`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error actualizando promedio final:', error);
    throw error;
  }
}

/**
 * Obtiene los promedios de todos los alumnos en un ramo (solo profesor)
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise} Array de promedios con alumno, nota y estado
 */
export async function getPromediosPorRamo(codigoRamo) {
  try {
    const response = await axios.get(
      `/promedios/${codigoRamo}/promedios`
    );
    return response.data;
  } catch (error) {
    console.error('Error obteniendo promedios del ramo:', error);
    throw error;
  }
}

/**
 * Calcula promedios finales para todos los alumnos inscritos en un ramo
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise} Resultado del cálculo bulk
 */
export async function calcularPromediosRamo(codigoRamo) {
  try {
    const response = await axios.post(
      `/promedios/${codigoRamo}/calcular-todos`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error calculando promedios del ramo:', error);
    throw error;
  }
}

/**
 * Calcula promedio PARCIAL para todos los alumnos inscritos en un ramo
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise} Resultado del cálculo bulk de parciales
 */
export async function calcularPromediosParcial(codigoRamo) {
  try {
    const response = await axios.post(
      `/promedios/${codigoRamo}/calcular-todos-parcial`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error calculando promedios parciales del ramo:', error);
    throw error;
  }
}

/**
 * Calcula promedio FINAL para todos los alumnos inscritos en un ramo (con integradora si existe)
 * @param {string} codigoRamo - Código del ramo
 * @returns {Promise} Resultado del cálculo bulk de finales
 */
export async function calcularPromediosFinal(codigoRamo) {
  try {
    const response = await axios.post(
      `/promedios/${codigoRamo}/calcular-todos-final`,
      {}
    );
    return response.data;
  } catch (error) {
    console.error('Error calculando promedios finales del ramo:', error);
    throw error;
  }
}
