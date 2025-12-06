const parseDateTime = (dateTimeStr) => {
  if (!dateTimeStr) return null;
  
  const parts = dateTimeStr.split(/[\s:T-]/);
  
  if (dateTimeStr.includes('-') && dateTimeStr.includes(':')) {
    return new Date(dateTimeStr.replace(' ', 'T'));
  } else if (dateTimeStr.includes('-')) {
    return new Date(dateTimeStr + 'T00:00:00');
  }
  
  return null;
};


const hasTimeConflict = (start1, end1, start2, end2) => {
  if (!start1 || !end1 || !start2 || !end2) return false;

  return start1 < end2 && start2 < end1;
};

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
    return null;
  }
  const MARGIN_MS = 10 * 60 * 1000;
  const bufferedNewStart = new Date(newStart.getTime() - MARGIN_MS);
  const bufferedNewEnd = new Date(newEnd.getTime() + MARGIN_MS);

  for (const item of allItems) {
    if (excludeId && item.id === excludeId) {
      continue;
    }
    
    const itemProfessorId = item.profesor_id || item.creadaPor;
    if (itemProfessorId !== profesorId) {
      continue;
    }
    
    const itemStart = parseDateTime(item.start_time || item.fechaProgramada);
    const itemEnd = parseDateTime(item.end_time);
    
    const finalItemEnd = itemEnd || (itemStart ? new Date(itemStart.getTime() + 3600000) : null);

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

export const getConflictErrorMessage = (conflict) => {
  if (!conflict) return null;
  
  const startStr = conflict.conflictingItemStart?.toLocaleString('es-ES') || 'desconocida';
  const endStr = conflict.conflictingItemEnd?.toLocaleString('es-ES') || 'desconocida';
  
  return `No se puede crear esta actividad. Hay un conflicto de horario con "${conflict.conflictingItemTitle}" (${startStr} - ${endStr})`;
};

export const findConflictAcrossCollections = (
  profesorId,
  startTime,
  endTime,
  collections = {},
  excludeId = null
) => {
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
