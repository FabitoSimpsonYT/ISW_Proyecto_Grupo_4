import api from './api.service';

// Obtener todos los slots de un evento específico
export const getSlotsEvento = async (eventoId) => {
  return await api(`/slots/${eventoId}`);
};

// Inscribir al alumno logueado en un slot
export const inscribirSlot = async (slotId) => {
  try {
    return await api(`/slots/slot/${slotId}/inscribir`, {
      method: 'POST'
    });
  } catch (error) {
    console.error('[inscribirSlot] Error:', error.response?.data || error.message);
    throw new Error(
      error.response?.data?.message || 
      error.response?.data?.error || 
      'Error al inscribirse en el slot'
    );
  }
};

// ✅ ESTA ES LA FUNCIÓN QUE TE DABA ERROR
// Profesor: Bloquear o desbloquear un slot
export const bloquearSlot = async (slotId, bloquear) => {
  return await api(`/slots/slot/${slotId}/bloquear`, {
    method: 'PATCH',
    body: JSON.stringify({ bloquear })
  });
};

// Profesor: Quitar al alumno de un slot (liberarlo)
export const quitarAlumnoSlot = async (slotId) => {
  return await api(`/slots/slot/${slotId}/quitar-alumno`, {
    method: 'PATCH'
  });
};

// Profesor: Mover un alumno de un horario a otro
export const moverAlumnoSlot = async (fromSlotId, toSlotId) => {
  return await api(`/slots/mover`, {
    method: 'POST',
    body: JSON.stringify({ fromSlotId, toSlotId })
  });
};

// Generar slots masivamente para un evento
export const generarSlots = async (eventoId, duracion) => {
  return await api(`/slots/${eventoId}/generar`, {
    method: 'POST',
    body: JSON.stringify({ duracion: Number(duracion) })
  });
};