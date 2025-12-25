import api from './api.service';

export const inscribirAlumno = async (payload) => {
  return await api('/inscripciones', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const cancelarInscripcion = async (id) => {
  return await api(`/inscripciones/${id}`, { method: 'DELETE' });
};

export const obtenerMisInscripciones = async () => {
  return await api('/inscripciones/mis-inscripciones');
};
