import api from './api.service';

// Obtener evaluaciones disponibles para inscribirse (slots)
export const getEvaluacionesDisponiblesSlots = async () => {
  return await api('/eventos/alumno/disponibles-slots');
};
