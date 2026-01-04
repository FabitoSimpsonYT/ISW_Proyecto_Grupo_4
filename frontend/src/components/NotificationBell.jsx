import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiX, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import socketService from '../services/socket.service';
import NotificationService from '../services/notification.service';
import { getNotificaciones, marcarNotificacionLeida, marcarTodoComoLeido } from '../services/notificacionuno.service';
import '../styles/NotificationBell.css';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!user || !socketService.socket) return;

    // Cargar notificaciones desde BD al montar
    loadNotificationsFromDB();

    // Escuchar eventos de notificación desde el servidor
    const handleNotification = (data) => {
      const newNotification = {
        id: Date.now(),
        message: data.message || 'Nueva notificación',
        type: data.type || 'info',
        titulo: data.titulo || 'Notificación',
        mensaje: data.mensaje || data.message,
        data: data.data || {},
        timestamp: new Date(),
        read: false,
        leido: false,
      };
      
      // Agregar a la lista de notificaciones de la campana
      setNotifications((prev) => [newNotification, ...prev]);
      setHasUnread(true);
      
      // Mostrar también como toast
      NotificationService.showToast(newNotification.message, newNotification.type);
    };

    socketService.socket.on('notification', handleNotification);

    // Limpiar listener
    return () => {
      socketService.socket?.off('notification', handleNotification);
    };
  }, [user]);

  const loadNotificationsFromDB = async () => {
    try {
      const data = await getNotificaciones();
      if (Array.isArray(data)) {
        const formatted = data.map((notif) => ({
          id: notif.id,
          message: notif.mensaje || notif.titulo,
          titulo: notif.titulo,
          mensaje: notif.mensaje,
          type: notif.tipo || 'info',
          timestamp: new Date(notif.fechaEnvio),
          read: notif.leido,
          leido: notif.leido,
          ...notif,
        }));
        setNotifications(formatted);
        // Si hay notificaciones sin leer, mostrar badge
        const hasSinLeer = formatted.some((n) => !n.leido);
        setHasUnread(hasSinLeer);
      }
    } catch (error) {
      console.error('Error loading notifications from DB:', error);
    }
  };

  const handleDeleteNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (notifications.length === 1) {
      setHasUnread(false);
    }
  };

  const handleMarkAsRead = async () => {
    setHasUnread(false);
  };

  const handleClearAll = async () => {
    try {
      await marcarTodoComoLeido();
      setNotifications([]);
      setHasUnread(false);
    } catch (error) {
      console.error('Error clearing all notifications:', error);
    }
  };

  const handleShowMore = () => {
    setIsOpen(false);
    navigate('/notificaciones');
  };

  const bellVariants = {
    shake: {
      rotate: [0, -12, 12, -12, 12, -8, 8, -4, 4, 0],
      x: [0, -3, 3, -3, 3, -2, 2, -1, 1, 0],
      transition: { duration: 0.8, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" },
    },
    idle: {
      rotate: 0,
      x: 0,
    },
  };

  const drawerVariants = {
    hidden: { opacity: 0, x: -20, y: -10 },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { type: 'spring', stiffness: 300, damping: 30 },
    },
    exit: { opacity: 0, x: -20, y: -10 },
  };

  const notificationVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: -20 },
  };

  if (!user) return null;

  return (
    <div className="notification-bell-container">
      <motion.button
        variants={bellVariants}
        animate={hasUnread ? 'shake' : 'idle'}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) handleMarkAsRead();
        }}
        className={`notification-bell ${hasUnread ? 'has-unread' : ''}`}
        aria-label="Notificaciones"
      >
        <FiBell size={24} />
        {hasUnread && <span className="notification-badge"></span>}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="notification-overlay"
            />

            {/* Drawer */}
            <motion.div
              variants={drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="notification-drawer"
            >
              {/* Header */}
              <div className="notification-header">
                <h3 className="notification-title">Notificaciones</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="notification-close-btn"
                  aria-label="Cerrar"
                >
                  <FiX size={20} />
                </button>
              </div>

              {/* Notifications List */}
              <div className="notification-list">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    <p>No hay notificaciones</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {notifications.slice(0, 10).map((notification, index) => (
                      <motion.div
                        key={notification.id}
                        variants={notificationVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        className={`notification-item notification-${notification.type}`}
                      >
                        <div className="notification-content">
                          <p className="notification-message">{notification.message}</p>
                          <span className="notification-time">
                            {notification.timestamp.toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteNotification(notification.id)}
                          className="notification-delete-btn"
                          aria-label="Eliminar"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="notification-footer">
                  {notifications.length > 10 && (
                    <button onClick={handleShowMore} className="notification-show-more-btn">
                      Mostrar más
                    </button>
                  )}
                  <button onClick={handleClearAll} className="notification-clear-btn">
                    Limpiar todo
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationBell;
