// src/services/tipoEvento.service.js
import api from './api.service';

export const getTiposEventos = async () => {
  return await api('/tipos-eventos');
};

export const crearTipoEvento = async (tipo) => {
  return await api('/tipos-eventos', {
    method: 'POST',
    body: JSON.stringify(tipo)
  });
};

export const actualizarTipoEvento = async (id, tipo) => {
  return await api(`/tipos-eventos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(tipo)
  });
};

export const eliminarTipoEvento = async (id) => {
  return await api(`/tipos-eventos/${id}`, { method: 'DELETE' });
};