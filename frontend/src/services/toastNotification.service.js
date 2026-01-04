import toast from 'react-hot-toast';

/**
 * Servicio centralizado para notificaciones con React Hot Toast y Campana
 * Proporciona métodos simples para mostrar notificaciones en toda la aplicación
 */
class ToastNotificationService {
  /**
   * Mostrar notificación de éxito
   * @param {string} message - Mensaje a mostrar
   * @param {object} options - Opciones de configuración (duración, posición, etc.)
   */
  static success(message, options = {}) {
    return toast.success(message, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  }

  /**
   * Mostrar notificación de error
   * @param {string} message - Mensaje a mostrar
   * @param {object} options - Opciones de configuración
   */
  static error(message, options = {}) {
    return toast.error(message, {
      duration: 5000,
      position: 'top-right',
      ...options,
    });
  }

  /**
   * Mostrar notificación informativa
   * @param {string} message - Mensaje a mostrar
   * @param {object} options - Opciones de configuración
   */
  static info(message, options = {}) {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      ...options,
    });
  }

  /**
   * Mostrar notificación de advertencia
   * @param {string} message - Mensaje a mostrar
   * @param {object} options - Opciones de configuración
   */
  static warning(message, options = {}) {
    return toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: '⚠️',
      ...options,
    });
  }

  /**
   * Mostrar notificación personalizada
   * @param {string} message - Mensaje a mostrar
   * @param {string} type - Tipo de notificación (success, error, info, warning)
   * @param {object} options - Opciones de configuración
   */
  static notify(message, type = 'info', options = {}) {
    switch (type) {
      case 'success':
        return this.success(message, options);
      case 'error':
        return this.error(message, options);
      case 'warning':
        return this.warning(message, options);
      case 'info':
      default:
        return this.info(message, options);
    }
  }

  /**
   * Mostrar notificación de carga
   * @param {string} message - Mensaje a mostrar
   * @param {object} options - Opciones de configuración
   */
  static loading(message, options = {}) {
    return toast.loading(message, {
      duration: Infinity,
      position: 'top-right',
      ...options,
    });
  }

  /**
   * Mostrar notificación personalizada con elemento JSX/React
   * @param {element} element - Elemento React a mostrar
   * @param {object} options - Opciones de configuración
   */
  static custom(element, options = {}) {
    return toast.custom(element, {
      duration: 4000,
      position: 'top-right',
      ...options,
    });
  }

  /**
   * Eliminar una notificación específica
   * @param {string} toastId - ID de la notificación a eliminar
   */
  static dismiss(toastId) {
    if (toastId) {
      toast.dismiss(toastId);
    } else {
      toast.dismiss();
    }
  }

  /**
   * Mostrar confirmación con opciones
   * Útil para operaciones que requieren confirmación
   * @param {string} message - Mensaje de confirmación
   * @param {function} onConfirm - Función a ejecutar si confirma
   * @param {function} onCancel - Función a ejecutar si cancela
   */
  static confirm(message, onConfirm, onCancel) {
    // Usar SweetAlert2 en lugar de toast para confirmaciones (mejor UX)
    const Swal = window.Swal;
    if (Swal) {
      Swal.fire({
        title: '¿Confirmar?',
        text: message,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3b82f6',
        cancelButtonColor: '#ef4444',
        confirmButtonText: 'Confirmar',
        cancelButtonText: 'Cancelar',
      }).then((result) => {
        if (result.isConfirmed) {
          onConfirm?.();
        } else if (result.isDismissed) {
          onCancel?.();
        }
      });
    } else {
      // Fallback simple si SweetAlert no está disponible
      if (window.confirm(message)) {
        onConfirm?.();
      } else {
        onCancel?.();
      }
    }
  }
}

export default ToastNotificationService;
