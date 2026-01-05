import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getNotificaciones, marcarNotificacionLeida } from '../services/notificacionuno.service';
import DashboardProfesor from '../components/DashboardProfesor';
import ToastNotificationService from '../services/toastNotification.service';
import { FiX, FiCheckCircle, FiClock, FiBell } from 'react-icons/fi';

const Home = () => {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);

  // Obtener el usuario del localStorage si no está en el contexto
  const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userData?.role || 'alumno';

  // Saludo dinámico con hora
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? '¡Buenos días!' : horaActual < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
  
  // Nombre con fallback - mostrar primer nombre y apellido paterno
  const nombreMostrar = userData && userData.nombres 
    ? `${userData.nombres.split(' ')[0]} ${userData.apellidoPaterno || ''}`.trim()
    : 'Usuario invitado';

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const notifs = await getNotificaciones();
        const notifArray = Array.isArray(notifs) ? notifs : [];
        const unread = notifArray.filter((n) => n && n.leido === false).length;
        if (isMounted) {
          setNotificaciones(notifArray);
          setUnreadCount(unread);
        }
      } catch (e) {
        if (isMounted) {
          setNotificaciones([]);
          setUnreadCount(0);
        }
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const marcarComoVista = async (notificacionId) => {
    try {
      await marcarNotificacionLeida(notificacionId);
      
      // Actualizar localmente
      setNotificaciones(prev => 
        prev.map(n => n.id === notificacionId ? { ...n, leido: true } : n)
      );
      
      // Descontar del contador
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      ToastNotificationService.success('Notificación marcada como leída');
    } catch (error) {
      console.error('Error al marcar notificación:', error);
      ToastNotificationService.error('Error al marcar notificación');
    }
  };

  const marcarTodasComoVistas = async () => {
    try {
      const noLeidas = notificaciones.filter(n => !n.leido);
      
      await Promise.all(
        noLeidas.map(n => marcarNotificacionLeida(n.id))
      );
      
      // Actualizar localmente
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadCount(0);
      
      ToastNotificationService.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar todas:', error);
      ToastNotificationService.error('Error al marcar notificaciones');
    }
  };

  const BellIcon = ({ className = '' }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <>
      {/* Mostrar Dashboard para profesores y jefes de carrera */}
      {(userRole === 'profesor' || userRole === 'jefecarrera') && (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 ${isNavbarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          {/* Header con bienvenida personalizada mejorada */}
          <motion.div 
            className="bg-gradient-to-r from-[#1e3a5f] via-[#2d5a8c] to-[#1a3f8f] text-white shadow-xl w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1"
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 leading-tight">
                    {saludo}
                  </h1>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-100 mb-4">
                    {nombreMostrar}
                  </h2>
                  <p className="text-blue-200 text-sm sm:text-base max-w-lg">
                    {userRole === 'jefecarrera' 
                      ? '🎓 Coordina tu carrera académica y gestiona todas las evaluaciones'
                      : '📚 Gestiona tus evaluaciones y monitorea el desempeño de tus alumnos'}
                  </p>
                </motion.div>
                <motion.div 
                  className="hidden sm:block text-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                    <p className="text-blue-200 text-sm font-semibold mb-2">Fecha actual</p>
                    <p className="text-white text-lg font-bold">
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="transition-all duration-300">
            <DashboardProfesor />
          </div>
        </div>
      )}

      {/* Mostrar bienvenida para alumnos y otros */}
      {userRole !== 'profesor' && userRole !== 'jefecarrera' && (
        <div className={`relative min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4a6b] to-[#1e3a5f] flex items-center justify-center p-4 transition-all duration-300 ${isNavbarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          <button
            type="button"
            onClick={() => setModalNotificacionesAbierto(true)}
            className="fixed top-4 right-4 z-30 bg-blue-600 text-white rounded-full shadow-lg p-3 hover:bg-blue-700 transition"
            aria-label="Abrir notificaciones"
            title="Notificaciones"
          >
            <span className="relative block">
              <FiBell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs leading-5 text-center">
                  {unreadCount}
                </span>
              )}
            </span>
          </button>

          {/* Modal de Notificaciones */}
          <AnimatePresence>
            {modalNotificacionesAbierto && (
              <div 
                className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    setModalNotificacionesAbierto(false);
                  }
                }}
              >
                <motion.div
                  className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header del Modal */}
                  <div className="flex items-center justify-between p-6 border-b-2 border-gray-100 bg-white">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <FiBell className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">Notificaciones</h2>
                        <p className="text-xs text-gray-500">
                          {unreadCount > 0 ? `${unreadCount} sin leer` : 'Todo al día'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setModalNotificacionesAbierto(false)}
                      className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition"
                      title="Cerrar"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Acciones */}
                  {unreadCount > 0 && (
                    <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
                      <button
                        onClick={marcarTodasComoVistas}
                        className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2 hover:underline transition"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        Marcar todas como leídas
                      </button>
                    </div>
                  )}

                  {/* Lista de Notificaciones */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-2">
                    {notificaciones.length === 0 ? (
                      <div className="text-center py-16 flex flex-col items-center">
                        <FiBell className="w-20 h-20 text-gray-200 mx-auto mb-4" />
                        <p className="text-lg font-semibold text-gray-600 mb-2">No hay notificaciones</p>
                        <p className="text-sm text-gray-500">Cuando tengas notificaciones aparecerán aquí</p>
                      </div>
                    ) : (
                      notificaciones.map((notif, idx) => (
                        <motion.div
                          key={notif.id || idx}
                          className={`p-4 rounded-lg border transition ${
                            notif.leido
                              ? 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                          }`}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                        >
                          <div className="flex items-start gap-3">
                            {/* Icono */}
                            <div className="flex-shrink-0 mt-1">
                              {!notif.leido ? (
                                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                              ) : (
                                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                              )}
                            </div>
                            
                            {/* Contenido */}
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-semibold text-sm ${
                                notif.leido ? 'text-gray-600' : 'text-gray-900'
                              }`}>
                                {notif.titulo || 'Notificación'}
                              </h3>
                              <p className={`text-xs mt-1 line-clamp-2 ${
                                notif.leido ? 'text-gray-500' : 'text-gray-700'
                              }`}>
                                {notif.mensaje || notif.descripcion}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.createdAt || notif.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>

                            {/* Botón marcar */}
                            {!notif.leido && (
                              <button
                                onClick={() => marcarComoVista(notif.id)}
                                className="flex-shrink-0 w-8 h-8 bg-red-500 rounded-full hover:bg-red-600 transition flex items-center justify-center"
                                title="Marcar como leída"
                              >
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                              </button>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full transform transition-all">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] to-[#4a7ba7] mb-4">
                {saludo}
              </h1>
              
              <p className="text-2xl text-gray-700 font-semibold mb-8">
                {nombreMostrar}
              </p>

              <p className="text-gray-600 text-lg">
                Utiliza el menú lateral para acceder a las diferentes funcionalidades de la plataforma
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Home;