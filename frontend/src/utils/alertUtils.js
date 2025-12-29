import Swal from 'sweetalert2';

/**
 * Muestra una alerta de éxito
 * @param {string} title - Título de la alerta
 * @param {string} message - Mensaje de la alerta
 */
export const showSuccessAlert = (title, message = '') => {
  return Swal.fire({
    icon: 'success',
    title: title || 'Éxito',
    text: message,
    confirmButtonColor: '#10b981',
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Muestra una alerta de error
 * @param {string} title - Título de la alerta
 * @param {string} message - Mensaje de la alerta
 */
export const showErrorAlert = (title, message = '') => {
  return Swal.fire({
    icon: 'error',
    title: title || 'Error',
    text: message,
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Muestra una alerta de advertencia
 * @param {string} title - Título de la alerta
 * @param {string} message - Mensaje de la alerta
 */
export const showWarningAlert = (title, message = '') => {
  return Swal.fire({
    icon: 'warning',
    title: title || 'Advertencia',
    text: message,
    confirmButtonColor: '#f59e0b',
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Muestra una alerta de información
 * @param {string} title - Título de la alerta
 * @param {string} message - Mensaje de la alerta
 */
export const showInfoAlert = (title, message = '') => {
  return Swal.fire({
    icon: 'info',
    title: title || 'Información',
    text: message,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Aceptar',
  });
};

/**
 * Muestra una alerta de confirmación
 * @param {string} title - Título de la alerta
 * @param {string} message - Mensaje de la alerta
 * @param {string} confirmButtonText - Texto del botón confirmar
 * @param {string} cancelButtonText - Texto del botón cancelar
 */
export const showConfirmAlert = (title, message = '', confirmButtonText = 'Confirmar', cancelButtonText = 'Cancelar') => {
  return Swal.fire({
    icon: 'question',
    title: title || 'Confirmación',
    text: message,
    showCancelButton: true,
    confirmButtonColor: '#10b981',
    cancelButtonColor: '#ef4444',
    confirmButtonText: confirmButtonText,
    cancelButtonText: cancelButtonText,
  });
};

/**
 * Muestra una alerta genérica (simple mensaje)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de alerta ('success', 'error', 'warning', 'info')
 */
export const showAlert = (message, type = 'info') => {
  return Swal.fire({
    icon: type,
    title: message,
    confirmButtonColor: '#3b82f6',
    confirmButtonText: 'Aceptar',
  });
};
