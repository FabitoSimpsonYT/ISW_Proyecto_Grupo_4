// src/services/bloqueo.service.js
import api from './api.service';

export const getBloqueos = async () => {
  return await api('/bloqueos');
};

export const crearBloqueo = async (bloqueo) => {
  return await api('/bloqueos', {
    method: 'POST',
    body: JSON.stringify(bloqueo)
  });
};

export const eliminarBloqueo = async (id) => {
  return await api(`/bloqueos/${id}`, { method: 'DELETE' });
};