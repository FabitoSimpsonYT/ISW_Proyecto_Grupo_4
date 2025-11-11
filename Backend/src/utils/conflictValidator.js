/**
 * Utilidad para validar conflictos de horarios
 * Previene que un profesor tenga múltiples eventos/evaluaciones/agendamientos en la misma hora
 */

/**
 * Parsea una fecha y hora en formato "YYYY-MM-DD HH:mm"
 * @param {string} dateTimeStr - Fecha y hora en formato "YYYY-MM-DD HH:mm"
 * @returns {Date} Objeto Date
 */
const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return null;
  
  // Soporta varios formatos: "2025-11-15 10:00", "2025-11-15T10:00", "2025-11-15"
  const parts = dateTimeStr.split(/[\s:T-]/);
  
  if (dateTimeStr.includes('-') && dateTimeStr.includes(':')) {
    // Formato con fecha y hora
    return new Date(dateTimeStr.replace(' ', 'T'));
  } else if (dateTimeStr.includes('-')) {
    // Solo fecha
    return new Date(dateTimeStr + 'T00:00:00');
  }
  
  return null;
};

/**
 * Verifica si dos rangos de tiempo se solapan
 * @param {Date} start1 - Inicio del primer rango
 * @param {Date} end1 - Fin del primer rango
 * @param {Date} start2 - Inicio del segundo rango
 * @param {Date} end2 - Fin del segundo rango
 * @returns {boolean} true si hay solapamiento
 */
const hasTimeConflict = (start1, end1, start2, end2) => {
  if (!start1 || !end1 || !start2 || !end2) return false;
  
  // Dos rangos se solapan si: start1 < end2 AND start2 < end1
  return start1 < end2 && start2 < end1;
};

/**
 * Busca conflictos de horario para un profesor
 * @param {number} profesorId - ID del profesor
 * @param {Date} startTime - Hora de inicio del nuevo evento
 * @param {Date} endTime - Hora de fin del nuevo evento
 * @param {Array} allItems - Lista de todos los eventos/evaluaciones/agendamientos
 * @param {number} excludeId - ID a excluir (para actualizaciones)
 * @returns {Object|null} Objeto con el conflicto encontrado o null
 */
export const findScheduleConflict = (
  profesorId,
  startTime,
  endTime,
  allItems = [],
  excludeId = null
) => {
  const newStart = parseDateTime(startTime);
  const newEnd = parseDateTime(endTime);
  
  if (!newStart || !newEnd) {
    return null; // No se puede validar sin horarios válidos
  }
  // Aplicar margen de 10 minutos alrededor del nuevo rango
  const MARGIN_MS = 10 * 60 * 1000; // 10 minutos
  const bufferedNewStart = new Date(newStart.getTime() - MARGIN_MS);
  const bufferedNewEnd = new Date(newEnd.getTime() + MARGIN_MS);

  for (const item of allItems) {
    // Saltar el mismo item (para actualizaciones)
    if (excludeId && item.id === excludeId) {
      continue;
    }
    
    // Verificar que sea del mismo profesor
    const itemProfessorId = item.profesor_id || item.creadaPor;
    if (itemProfessorId !== profesorId) {
      continue;
    }
    
    const itemStart = parseDateTime(item.start_time || item.fechaProgramada);
    const itemEnd = parseDateTime(item.end_time);

    // Si no tiene hora de fin (ej: evaluaciones), usar 1 hora como duración
    const finalItemEnd = itemEnd || (itemStart ? new Date(itemStart.getTime() + 3600000) : null);

    // Aplicar margen de 10 minutos al item existente
    const bufferedItemStart = itemStart ? new Date(itemStart.getTime() - MARGIN_MS) : null;
    const bufferedItemEnd = finalItemEnd ? new Date(finalItemEnd.getTime() + MARGIN_MS) : null;

    if (hasTimeConflict(bufferedNewStart, bufferedNewEnd, bufferedItemStart, bufferedItemEnd)) {
      return {
        conflictingItemId: item.id,
        conflictingItemTitle: item.title || item.titulo,
        conflictingItemStart: itemStart,
        conflictingItemEnd: finalItemEnd,
        conflictingItemType: item.type || 'evento'
      };
    }
  }
  
  return null;
};

/**
 * Valida y retorna mensaje de error si hay conflicto
 * @param {Object} conflict - Resultado de findScheduleConflict
 * @returns {string|null} Mensaje de error o null
 */
export const getConflictErrorMessage = (conflict) => {
  if (!conflict) return null;
  
  const startStr = conflict.conflictingItemStart?.toLocaleString('es-ES') || 'desconocida';
  const endStr = conflict.conflictingItemEnd?.toLocaleString('es-ES') || 'desconocida';
  
  return `No se puede crear esta actividad. Hay un conflicto de horario con "${conflict.conflictingItemTitle}" (${startStr} - ${endStr})`;
};

/**
 * Valida múltiples colecciones de items para encontrar conflictos
 * @param {number} profesorId - ID del profesor
 * @param {Date} startTime - Hora de inicio
 * @param {Date} endTime - Hora de fin
 * @param {Object} collections - Objeto con arrays: { eventos, evaluaciones, agendamientos }
 * @param {number} excludeId - ID a excluir
 * @returns {Object|null} Primer conflicto encontrado
 */
export const findConflictAcrossCollections = (
  profesorId,
  startTime,
  endTime,
  collections = {},
  excludeId = null
) => {
  // Buscar en eventos
  if (collections.eventos) {
    const conflict = findScheduleConflict(
      profesorId,
      startTime,
      endTime,
      collections.eventos,
      excludeId
    );
    if (conflict) {
      conflict.conflictingItemType = 'evento';
      return conflict;
    }
  }
  
  // Buscar en evaluaciones
  if (collections.evaluaciones) {
    const conflict = findScheduleConflict(
      profesorId,
      startTime,
      endTime,
      collections.evaluaciones,
      excludeId
    );
    if (conflict) {
      conflict.conflictingItemType = 'evaluación';
      return conflict;
    }
  }
  
  // Buscar en agendamientos
  if (collections.agendamientos) {
    const conflict = findScheduleConflict(
      profesorId,
      startTime,
      endTime,
      collections.agendamientos,
      excludeId
    );
    if (conflict) {
      conflict.conflictingItemType = 'agendamiento';
      return conflict;
    }
  }
  
  return null;
};

export default {
  findScheduleConflict,
  getConflictErrorMessage,
  findConflictAcrossCollections,
  parseDateTime,
  hasTimeConflict
};
