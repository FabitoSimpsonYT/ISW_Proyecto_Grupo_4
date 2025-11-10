// src/utils/date.utils.js

/**
 * Convierte una fecha en formato DD-MM-YY HH:mm o DD/MM/YY HH:mm a objeto Date
 * @param {string} dateString - Fecha en formato DD-MM-YY HH:mm o DD/MM/YY HH:mm
 * @returns {Date} Objeto Date
 */
export const parseCustomDateFormat = (dateString) => {
  // Reemplazar / por - para tener un formato consistente
  const normalized = dateString.replace(/\//g, '-');
  const [datePart, timePart] = normalized.split(' ');
  const [day, month, year] = datePart.split('-');
  const [hours, minutes] = timePart.split(':');
  
  // Añadir 2000 al año ya que viene en formato YY
  const fullYear = 2000 + parseInt(year);
  
  // Crear objeto Date (meses en JavaScript son 0-based)
  return new Date(fullYear, parseInt(month) - 1, parseInt(day), parseInt(hours), parseInt(minutes));
};

/**
 * Formatea una fecha a DD-MM-YY HH:mm
 * @param {Date} date - Objeto Date
 * @returns {string} Fecha formateada
 */
export const formatToCustomDate = (date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${day}-${month}-${year} ${hours}:${minutes}`;
};