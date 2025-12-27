// src/services/booking.service.js
import api from './api.service';

export const getSlotsDisponibles = async (eventoId) => {
  return await api(`/bookings/slots/${eventoId}`);
};

export const tomarSlot = async (eventoId, slotId) => {
  return await api('/bookings', {
    method: 'POST',
    body: JSON.stringify({ event_id: eventoId, slot_id: slotId })
  });
};