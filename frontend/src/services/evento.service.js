// src/services/evento.service.js
import api from './api.service';

// Para el profesor
export const getEventosProfesor = async () => {
  return await api('/eventos/profesor');
};

export const crearEvento = async (evento) => {
  return await api('/eventos', {
    method: 'POST',
    body: JSON.stringify(evento),
  });
};

export const actualizarEvento = async (id, evento) => {
  return await api(`/eventos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(evento),
  });
};

export const eliminarEvento = async (id) => {
  return await api(`/eventos/${id}`, {
    method: 'DELETE',
  });
};

// Para el alumno
export const getEventosAlumno = async () => {
  return await api('/eventos/alumno');
};

// Extra: obtener eventos disponibles para inscripción (slots)
export const getEventosDisponiblesParaSlot = async () => {
  return await api('/eventos/disponibles-slots');
};

// Tomar un slot (alumno)
export const tomarSlot = async (eventoId, slotId) => {
  return await api('/bookings', {
    method: 'POST',
    body: JSON.stringify({ eventoId, slotId }),
  });
};