import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { useNavigate } from 'react-router-dom';
import { getNotificaciones } from '../services/notificacionuno.service';
import DashboardProfesor from '../components/DashboardProfesor';
import {
  FiBell, FiCalendar, FiCheckCircle, FiAlertCircle,
  FiArrowRight, FiClock, FiUsers, FiBook
} from 'react-icons/fi';
import toast from 'react-hot-toast';

const HomeV2 = () => {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [proximasEvaluaciones, setProximasEvaluaciones] = useState([]);

  const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userData?.role || 'alumno';

  const nombreMostrar = userData && userData.nombres
    ? `${userData.nombres.split(' ')[0]} ${userData.apellidoPaterno || ''}`.trim()
    : 'Usuario invitado';

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const notif = await getNotificaciones();
        if (isMounted) {
          setNotificaciones(Array.isArray(notif) ? notif.slice(0, 5) : []);
          const unread = Array.isArray(notif)
            ? notif.filter((n) => n && n.leido === false).length
            : 0;
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

  // Mostrar dashboard para profesores
  if (userRole === 'profesor' || userRole === 'jefecarrera') {
    return (
      <div className={`transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
        <DashboardProfesor />
      </div>
    );
  }

  // Home mejorada para alumnos
  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
      {/* Botón Notificaciones Flotante */}
      <motion.button
        onClick={() => navigate('/notificaciones')}
        className="fixed top-4 sm:top-6 right-4 sm:right-6 z-40 bg-gradient-to-br from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl p-3 sm:p-4 hover:shadow-2xl transition"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <span className="relative block">
          <FiBell className="w-5 sm:w-6 h-5 sm:h-6" />
          {unreadCount > 0 && (
            <motion.span
              className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 min-w-[20px] sm:min-w-[24px] h-5 sm:h-6 px-1 sm:px-1.5 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
            >
              {unreadCount}
            </motion.span>
          )}
        </span>
      </motion.button>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-12">
        {/* Encabezado Bienvenida */}
        <motion.div
          className="mb-8 sm:mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-2 sm:mb-3">
            ¡Hola, {nombreMostrar}! 👋
          </h1>
          <p className="text-sm sm:text-lg text-gray-600">
            Bienvenido a tu plataforma de evaluaciones
          </p>
        </motion.div>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Tarjeta Principal - Acciones Rápidas */}
          <motion.div
            className="lg:col-span-2 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 border-2 border-blue-100"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Acciones Rápidas</h2>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4">
              {[
                {
                  titulo: 'Mi Agenda',
                  icono: FiCalendar,
                  color: 'from-blue-500 to-blue-600',
                  path: '/mi-agenda',
                  desc: 'Ver evaluaciones'
                },
                ...(userRole === 'alumno' ? [{
                  titulo: 'Inscribirse',
                  icono: FiCheckCircle,
                  color: 'from-emerald-500 to-emerald-600',
                  path: '/inscribir-evaluaciones',
                  desc: 'Registrarse'
                }] : []),
                {
                  titulo: 'Mis Notas',
                  icono: FiBook,
                  color: 'from-purple-500 to-purple-600',
                  path: '/mis-ramos-notas',
                  desc: 'Ver calificaciones'
                },
              ].map((item, idx) => {
                const Icon = item.icono;
                return (
                  <motion.button
                    key={idx}
                    onClick={() => navigate(item.path)}
                    className={`bg-gradient-to-br ${item.color} text-white rounded-xl sm:rounded-2xl p-3 sm:p-6 text-left hover:shadow-lg transition group text-xs sm:text-sm`}
                    whileHover={{ y: -4 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <Icon className="w-6 sm:w-8 h-6 sm:h-8 mb-2 sm:mb-3 group-hover:scale-110 transition" />
                    <p className="font-bold text-xs sm:text-sm">{item.titulo}</p>
                    <p className="text-xs opacity-90 hidden sm:block">{item.desc}</p>
                    <FiArrowRight className="w-3 sm:w-4 h-3 sm:h-4 mt-2 group-hover:translate-x-1 transition" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Tarjeta Lateral - Estadísticas */}
          <motion.div
            className="bg-gradient-to-br from-indigo-600 to-blue-600 text-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6">Tu Progreso</h2>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs sm:text-sm font-semibold">Evaluaciones Pendientes</span>
                  <span className="text-xl sm:text-2xl font-bold">5</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Promedio General</span>
                  <span className="text-2xl font-bold">5.8 / 7.0</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div className="bg-white h-2 rounded-full" style={{ width: `${(5.8 / 7) * 100}%` }} />
                </div>
              </div>

              <div className="pt-6 border-t border-white/20">
                <p className="text-xs opacity-75">Última actualización: Hoy</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Tarjeta Notificaciones */}
        {notificaciones.length > 0 && (
          <motion.div
            className="bg-white rounded-3xl shadow-xl p-8 border-2 border-amber-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FiBell className="text-amber-600 w-6 h-6" />
                Notificaciones Recientes
              </h2>
              <motion.button
                onClick={() => navigate('/notificaciones')}
                className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-1"
                whileHover={{ x: 4 }}
              >
                Ver todas <FiArrowRight className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {notificaciones.slice(0, 4).map((notif, idx) => (
                  <motion.div
                    key={notif.id || idx}
                    className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl border border-gray-200 hover:bg-gray-100 transition"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + idx * 0.05 }}
                  >
                    <FiAlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 text-sm">{notif.titulo || 'Notificación'}</p>
                      <p className="text-gray-600 text-xs mt-1 line-clamp-2">{notif.mensaje || notif.descripcion}</p>
                    </div>
                    {!notif.leido && (
                      <div className="w-2 h-2 bg-red-600 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.div>
        )}

        {/* Tarjeta Info */}
        <motion.div
          className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-3xl border-2 border-green-200 p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex items-start gap-4">
            <FiCheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="font-bold text-gray-900 mb-2">💡 Consejo del Día</h3>
              <p className="text-gray-700">
                Revisa tu agenda regularmente para no perderte de ninguna evaluación. Marca recordatorios en tu calendario.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default HomeV2;
