// src/services/slot.service.js
import api from './api.service';

export const getSlotsEvento = async (eventoId) => {
  return await api(`/slots/${eventoId}`);
};

export const quitarAlumnoSlot = async (slotId) => {
  return await api(`/slots/slot/${slotId}/quitar-alumno`, { method: 'PATCH' });
};

export const bloquearSlot = async (slotId, bloquear) => {
  return await api(`/slots/slot/${slotId}/bloquear`, {
    method: 'PATCH',
    body: JSON.stringify({ bloquear })
  });
};

// Puedes agregar más adelante: moverAlumnoSlot, inscribirGrupo, etc.