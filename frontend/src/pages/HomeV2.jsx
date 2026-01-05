import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { useNavigate } from 'react-router-dom';
import { getNotificaciones, marcarNotificacionLeida } from '../services/notificacionuno.service';
import { getEventosAlumno } from '../services/evento.service';
import { getPromediosByAlumno } from '../services/alumnoPromedioRamo.service';
import DashboardProfesor from '../components/DashboardProfesor';
import {
  FiBell, FiCalendar, FiCheckCircle, FiAlertCircle,
  FiArrowRight, FiClock, FiUsers, FiBook, FiX
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import ToastNotificationService from '../services/toastNotification.service';

const HomeV2 = () => {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [notificaciones, setNotificaciones] = useState([]);
  const [proximasEvaluaciones, setProximasEvaluaciones] = useState([]);
  const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
  const [estadisticasAlumno, setEstadisticasAlumno] = useState({
    pendientes: 0,
    avance: 0,
    promedio: null,
    totalEventos: 0,
  });
  const [cargandoAlumno, setCargandoAlumno] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(null);

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

      if (userRole !== 'alumno') return;

      setCargandoAlumno(true);
      try {
        const [eventosResp, promediosResp] = await Promise.all([
          getEventosAlumno(),
          userData?.rut ? getPromediosByAlumno(userData.rut) : Promise.resolve(null),
        ]);

        const eventosRaw = eventosResp?.data || eventosResp?.eventos || eventosResp || [];
        const eventos = Array.isArray(eventosRaw?.data) ? eventosRaw.data : (Array.isArray(eventosRaw) ? eventosRaw : []);
        const eventosOrdenados = [...eventos].sort((a, b) => {
          const fechaA = new Date(a.fecha_inicio || a.fecha || a.fecha_inicio_evento || a.created_at || Date.now());
          const fechaB = new Date(b.fecha_inicio || b.fecha || b.fecha_inicio_evento || b.created_at || Date.now());
          return fechaA - fechaB;
        });

        const ahora = Date.now();
        const proximos = eventosOrdenados.filter((ev) => {
          const fecha = ev.fecha_inicio || ev.fecha || ev.fecha_inicio_evento;
          if (!fecha) return false;
          return new Date(fecha).getTime() >= ahora;
        });

        if (isMounted) {
          setProximasEvaluaciones(proximos.slice(0, 3).map((ev) => ({
            id: ev.id,
            titulo: ev.nombre || ev.titulo || 'Evaluación',
            ramo: ev.ramo_nombre || ev.ramo_codigo || 'Ramo sin nombre',
            fecha: ev.fecha_inicio || ev.fecha || ev.fecha_inicio_evento,
            estado: ev.estado || ev.estado_evaluacion || 'confirmado',
          })));

          const pendientes = proximos.length;
          const totalEventos = eventosOrdenados.length;
          const completadas = Math.max(totalEventos - pendientes, 0);
          const avance = totalEventos ? Math.round((completadas / totalEventos) * 100) : 0;

          let promedio = null;
          if (promediosResp) {
            const listaPromedios = promediosResp?.data?.promedios || promediosResp?.promedios || promediosResp?.data || [];
            if (Array.isArray(listaPromedios) && listaPromedios.length) {
              const notas = listaPromedios
                .map((p) => p.promedioFinal ?? p.promedio_final ?? p.promedio ?? p.promedioParcial ?? p.nota ?? p.promedio_oficial)
                .map((n) => Number(n))
                .filter((n) => !Number.isNaN(n));
              if (notas.length) {
                promedio = +(notas.reduce((acc, val) => acc + val, 0) / notas.length).toFixed(1);
              }
            }
          }

          setEstadisticasAlumno({
            pendientes,
            avance,
            promedio,
            totalEventos,
          });
          setUltimaActualizacion(new Date());
        }
      } catch (error) {
        if (isMounted) {
          setProximasEvaluaciones([]);
          setEstadisticasAlumno({ pendientes: 0, avance: 0, promedio: null, totalEventos: 0 });
        }
        toast.error(error?.message || 'No se pudieron cargar tus evaluaciones');
      } finally {
        if (isMounted) setCargandoAlumno(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [userRole, userData?.rut]);

  const marcarComoVista = async (notificacionId) => {
    try {
      await marcarNotificacionLeida(notificacionId);
      
      setNotificaciones(prev => 
        prev.map(n => n.id === notificacionId ? { ...n, leido: true } : n)
      );
      
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
      
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
      setUnreadCount(0);
      
      ToastNotificationService.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('Error al marcar todas:', error);
      ToastNotificationService.error('Error al marcar notificaciones');
    }
  };

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
        onClick={() => setModalNotificacionesAbierto(true)}
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
                  <span className="text-xl sm:text-2xl font-bold">{estadisticasAlumno.pendientes}</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${estadisticasAlumno.avance}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold">Promedio General</span>
                  <span className="text-2xl font-bold">
                    {estadisticasAlumno.promedio !== null ? `${estadisticasAlumno.promedio} / 7.0` : 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-white h-2 rounded-full transition-all"
                    style={{ width: `${estadisticasAlumno.promedio ? (estadisticasAlumno.promedio / 7) * 100 : 0}%` }}
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-white/20">
                <p className="text-xs opacity-75">
                  {cargandoAlumno
                    ? 'Actualizando...'
                    : `Última actualización: ${ultimaActualizacion ? ultimaActualizacion.toLocaleString('es-ES') : '—'}`}
                </p>
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
                onClick={() => {
                  console.log('Botón Ver todas clickeado');
                  console.log('Estado actual modalNotificacionesAbierto:', modalNotificacionesAbierto);
                  setModalNotificacionesAbierto(true);
                  console.log('Modal estado cambiado a true');
                }}
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


            {proximasEvaluaciones.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">Próximas evaluaciones</h3>
                  <motion.span
                    className="text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {proximasEvaluaciones.length} en agenda
                  </motion.span>
                </div>
                <div className="space-y-3">
                  {proximasEvaluaciones.map((ev) => (
                    <motion.div
                      key={ev.id}
                      className="flex items-center justify-between bg-blue-50 rounded-xl p-3 border border-blue-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">{ev.titulo}</p>
                        <p className="text-xs text-gray-600">{ev.ramo}</p>
                      </div>
                      <div className="text-right text-xs text-blue-700 font-semibold flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        {ev.fecha ? new Date(ev.fecha).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) : 'Fecha por definir'}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
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
    </div>
  );
};

export default HomeV2;
