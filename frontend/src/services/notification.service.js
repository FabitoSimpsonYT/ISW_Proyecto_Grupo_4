import socketService from './socket.service';
import toast from 'react-hot-toast';

class NotificationService {
  /**
   * Enviar una notificación (campana + toast)
   * @param {string} message - Mensaje de la notificación
   * @param {string} type - Tipo: 'info', 'success', 'warning', 'error'
   */
  static sendNotification(message, type = 'info') {
    // Enviar a campana por socket
    if (socketService.socket) {
      socketService.socket.emit('notification', { message, type });
    }
    
    // Mostrar toast
    this.showToast(message, type);
  }

  /**
   * Mostrar toast en la UI
   */
  static showToast(message, type = 'info') {
    const toastConfig = {
      duration: 4000,
      position: 'top-right',
    };

    switch (type) {
      case 'success':
        toast.success(message, toastConfig);
        break;
      case 'error':
        toast.error(message, toastConfig);
        break;
      case 'warning':
        toast(message, {
          ...toastConfig,
          icon: '⚠️',
        });
        break;
      case 'info':
      default:
        toast(message, toastConfig);
        break;
    }
  }

  /**
   * Enviar notificación de éxito
   */
  static success(message) {
    this.sendNotification(message, 'success');
  }

  /**
   * Enviar notificación de error
   */
  static error(message) {
    this.sendNotification(message, 'error');
  }

  /**
   * Enviar notificación de advertencia
   */
  static warning(message) {
    this.sendNotification(message, 'warning');
  }

  /**
   * Enviar notificación de información
   */
  static info(message) {
    this.sendNotification(message, 'info');
  }
}

export default NotificationService;
