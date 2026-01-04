import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiAlertCircle, FiBell, FiFilter } from 'react-icons/fi';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import cookies from 'js-cookie';
import { useAuth } from '../context/AuthContext';
import { AnimatedCard, AnimatedBadge } from './AnimationComponents';
import notificacionesService from '../services/notificaciones.service';
import { showMultipleEventsAlert, showEmptyDayAlert, showBlockedDayAlert, showCalendarEventAlert } from '../utils/enhancedAlerts';
import LeyendaColores from './LeyendaColores';

const API_BASE = 'http://localhost:3000/api';

/**
 * Calendario mejorado para estudiantes
 * Muestra:
 * - Evaluaciones con estados
 * - Slot disponibles
 * - Notificaciones de cambios
 * - Filtros por ramo/estado
 */

export default function CalendarioAlumnoMejorado({ usuarioId }) {
  const { user } = useAuth();
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRamo, setFiltroRamo] = useState('todos');
  const [ramos, setRamos] = useState([]);
  const [vistaActual, setVistaActual] = useState('lista'); // lista | calendario
  const [cargando, setCargando] = useState(true);
  const [notificaciones, setNotificaciones] = useState([]);
  const [mesActual, setMesActual] = useState(new Date().getMonth());
  const [anoActual, setAnoActual] = useState(new Date().getFullYear());
  const [bloqueos, setBloqueos] = useState([]);

  useEffect(() => {
    cargarDatos();
    // Simular WebSocket para notificaciones
    configurarNotificaciones();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const token = cookies.get('jwt-auth');
      
      if (!token) {
        toast.error('No hay sesión. Por favor inicia sesión');
        return;
      }

      // Obtener EVENTOS del alumno (filtrados por ramos inscritos)
      const response = await fetch(`${API_BASE}/eventos/alumno`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar los eventos');
      }

      const eventosData = await response.json();
      const eventos = Array.isArray(eventosData) ? eventosData : eventosData.data || [];
      
      console.log('Eventos recibidos del alumno:', eventos);

      // Procesar eventos para el alumno
      const evaluacionesAlumno = eventos.map(ev => ({
        id: ev.id,
        nombre: ev.nombre,
        titulo: ev.nombre,
        ramo: ev.ramo_nombre || ev.ramo_codigo || 'Sin especificar',
        ramo_nombre: ev.ramo_nombre,
        ramo_codigo: ev.ramo_codigo,
        ramoId: ev.ramo_id,
        profesor: ev.profesor || 'No especificado',
        estado: 'disponible',
        fecha: ev.fecha_inicio,
        fecha_inicio: ev.fecha_inicio,
        fecha_fin: ev.fecha_fin,
        slots: ev.slots || [],
        modalidad: ev.modalidad || 'presencial',
        estado_evaluacion: ev.estado || 'confirmado',
        tipo: ev.tipo_nombre || 'Evento',
        tipo_nombre: ev.tipo_nombre,
        descripcion: ev.descripcion,
        sala: ev.sala,
        comentario: ev.comentario,
      }));

      setEvaluaciones(evaluacionesAlumno);

      // Obtener ramos únicos (SOLO los ramos donde el alumno tiene eventos)
      const eventosArray = Array.isArray(eventosData) ? eventosData : (eventosData?.data || []);
      const ramosUnicos = [...new Set(eventosArray.map(e => e.ramo_id))].map((ramoId, idx) => {
        const evento = eventosArray.find(e => e.ramo_id === ramoId);
        return {
          id: ramoId,
          nombre: evento?.ramo_nombre || evento?.ramo_codigo || 'Sin nombre',
          codigo: evento?.ramo_codigo,
        };
      }).filter(r => r.id);

      setRamos(ramosUnicos);

      // Cargar bloqueos
      try {
        const responseBloqueos = await fetch(`${API_BASE}/bloqueos`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (responseBloqueos.ok) {
          const bloqueosData = await responseBloqueos.json();
          setBloqueos(Array.isArray(bloqueosData.data) ? bloqueosData.data : Array.isArray(bloqueosData) ? bloqueosData : []);
        }
      } catch (error) {
        console.error('Error cargando bloqueos:', error);
        setBloqueos([]);
      }

    } catch (error) {
      console.error('Error cargando evaluaciones:', error);
      toast.error('Error al cargar las evaluaciones: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  const configurarNotificaciones = () => {
    // Inicializar WebSocket para notificaciones
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (token && user.id) {
      // Cargar del localStorage primero
      notificacionesService.cargarDelLocalStorage();
      setNotificaciones(notificacionesService.obtenerNotificaciones());
      
      // Conectar al WebSocket
      notificacionesService.inicializarWebSocket(user.id, token);
    }
  };

  const evaluacionesFiltradas = evaluaciones.filter((ev) => {
    const pasaFiltroEstado = filtroEstado === 'todos' || ev.estado_evaluacion === filtroEstado;
    const pasaFiltroRamo = filtroRamo === 'todos' || String(ev.ramoId) === String(filtroRamo);
    return pasaFiltroEstado && pasaFiltroRamo;
  });

  const getEstadoColor = (estado) => {
    switch (estado) {
      case 'inscrito':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'disponible':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'proxima':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pasada':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case 'inscrito':
        return <FiCheckCircle className="w-5 h-5" />;
      case 'disponible':
        return <FiBell className="w-5 h-5" />;
      case 'proxima':
        return <FiAlertCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  const getTiempoRestante = (fecha) => {
    const ahora = new Date();
    const diferencia = fecha - ahora;
    const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
    
    if (dias < 0) return 'Pasado';
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `en ${dias} días`;
  };

  // Obtener evaluaciones por día
  const getEvaluacionesPorDia = (dia, mes, ano) => {
    return evaluaciones.filter(ev => {
      if (!ev.fecha_inicio) return false;
      const fecha = new Date(ev.fecha_inicio);
      // Comparar componentes de fecha para evitar problemas de timezone
      return fecha.getUTCDate() === dia && 
             fecha.getUTCMonth() === mes && 
             fecha.getUTCFullYear() === ano;
    });
  };

  // Obtener primer día del mes (0 = lunes, 6 = domingo)
  const getPrimerDia = () => {
    const fecha = new Date(anoActual, mesActual, 1);
    const diaSemana = fecha.getDay();
    return diaSemana === 0 ? 6 : diaSemana - 1; // Convertir a 0 = lunes
  };

  // Obtener número de días del mes
  const getDiasDelMes = () => {
    return new Date(anoActual, mesActual + 1, 0).getDate();
  };

  // Cambiar mes
  const cambiarMes = (incremento) => {
    const newDate = new Date(anoActual, mesActual + incremento, 1);
    setMesActual(newDate.getMonth());
    setAnoActual(newDate.getFullYear());
  };

  // Obtener nombre del mes
  const getNombreMes = () => {
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return meses[mesActual];
  };

  // Verificar si un día está bloqueado
  const estaBloqueado = (dia, mes, ano) => {
    const fecha = new Date(ano, mes, dia);
    return bloqueos.some((b) => {
      const fechaInicio = new Date(b.fecha_inicio);
      const fechaFin = new Date(b.fecha_fin);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  };

  // Obtener información del bloqueo
  const obtenerBloqueo = (dia, mes, ano) => {
    const fecha = new Date(ano, mes, dia);
    return bloqueos.find((b) => {
      const fechaInicio = new Date(b.fecha_inicio);
      const fechaFin = new Date(b.fecha_fin);
      return fecha >= fechaInicio && fecha <= fechaFin;
    });
  };

  // Mostrar detalles del día (todas las evaluaciones)
  const mostrarDetallesDia = (dia, mes, ano) => {
    const evaluacionesDia = getEvaluacionesPorDia(dia, mes, ano);
    const fecha = new Date(ano, mes, dia);

    // Verificar si está bloqueado
    const bloqueoDia = obtenerBloqueo(dia, mes, ano);
    if (bloqueoDia) {
      showBlockedDayAlert(fecha, bloqueoDia.razon || 'No especificada', `Este día está completamente bloqueado para operaciones.`);
      return;
    }

    if (evaluacionesDia.length === 0) {
      showEmptyDayAlert(dia, fecha);
      return;
    }

    // Si hay evaluaciones - para alumno sin botones de editar/eliminar
    const esProfesor = user?.role === 'profesor' || user?.role === 'jefecarrera';
    showMultipleEventsAlert(dia, fecha, evaluacionesDia, {
      mostrarBotones: esProfesor
    });
  };

  const mostrarDetallesEvaluacion = (evaluacion) => {
    showCalendarEventAlert({
      ...evaluacion,
      fechaDia: evaluacion.fecha,
      hora_inicio: evaluacion.horaInicio || '08:00',
      hora_fin: evaluacion.horaFin || '09:00',
      ramo_nombre: evaluacion.ramo,
      tipo_nombre: evaluacion.tipo
    }, {
      width: '700px'
    });
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <motion.div
          className="mb-8"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Mi Calendario de Evaluaciones</h1>
          <p className="text-gray-600">Gestiona tus evaluaciones y slots disponibles</p>
        </motion.div>

        {/* Notificaciones */}
        {notificaciones.length > 0 && (
          <motion.div className="mb-6 space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {notificaciones.map((notif, idx) => (
              <motion.div
                key={notif.id}
                className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-r-lg flex items-start gap-4"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: idx * 0.1 }}
              >
                <FiBell className="text-blue-600 w-5 h-5 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-semibold text-blue-900">{notif.mensaje}</p>
                  <p className="text-xs text-blue-700 mt-1">{notif.ramo}</p>
                </div>
                <button className="text-blue-600 hover:text-blue-800 text-sm font-semibold">Descartar</button>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Controles de Filtro y Vista */}
        <motion.div
          className="mb-6 bg-white rounded-lg shadow-md p-6 border-2 border-gray-200"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {/* Filtro Estado */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <FiFilter /> Estado
              </label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 transition"
              >
                <option value="todos">Todos los estados</option>
                <option value="inscrito">Inscritos</option>
                <option value="disponible">Disponibles</option>
                <option value="proxima">Próximos</option>
              </select>
            </div>

            {/* Filtro Ramo */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Ramo</label>
              <select
                value={filtroRamo}
                onChange={(e) => setFiltroRamo(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 transition"
              >
                <option value="todos">Todos los ramos</option>
                {ramos.map((ramo) => (
                  <option key={ramo.id} value={ramo.id}>
                    {ramo.nombre}
                  </option>
                ))}
              </select>
            </div>

            {/* Vista */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Vista</label>
              <div className="flex gap-2">
                {['lista', 'calendario'].map((vista) => (
                  <motion.button
                    key={vista}
                    onClick={() => setVistaActual(vista)}
                    className={`px-4 py-2 rounded-lg font-semibold transition ${
                      vistaActual === vista
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {vista.charAt(0).toUpperCase() + vista.slice(1)}
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contenido */}
        {cargando ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-gray-600">Cargando evaluaciones...</p>
          </div>
        ) : vistaActual === 'calendario' ? (
          // Vista Calendario - estilo profesor
          <motion.div
            className="w-full bg-white rounded-lg shadow-lg p-8 border-2 border-gray-300"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Leyenda de colores */}
            <LeyendaColores />

            {/* Navegación de mes */}
            <div className="flex items-center justify-between mb-8">
              <motion.button
                onClick={() => cambiarMes(-1)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-bold text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ←
              </motion.button>
              <h2 className="text-3xl font-bold text-gray-900">{getNombreMes()} de {anoActual}</h2>
              <motion.button
                onClick={() => cambiarMes(1)}
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition font-bold text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                →
              </motion.button>
            </div>

            {/* Encabezados de días */}
            <div className="grid grid-cols-7 gap-3 mb-4">
              {['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'].map(dia => (
                <div key={dia} className="text-center font-bold text-gray-600 py-3 text-sm">
                  {dia}
                </div>
              ))}
            </div>

            {/* Grid de días */}
            <div className="grid grid-cols-7 gap-3">
              {/* Días vacíos del inicio del mes */}
              {Array(getPrimerDia()).fill(null).map((_, idx) => (
                <div key={`empty-${idx}`}></div>
              ))}

              {/* Días del mes */}
              {Array(getDiasDelMes()).fill(null).map((_, idx) => {
                const dia = idx + 1;
                const evaluacionesDia = getEvaluacionesPorDia(dia, mesActual, anoActual);
                const bloqueado = estaBloqueado(dia, mesActual, anoActual);
                const hoy = new Date();
                const esHoy = dia === hoy.getDate() && mesActual === hoy.getMonth() && anoActual === hoy.getFullYear();

                return (
                  <motion.button
                    key={dia}
                    onClick={() => mostrarDetallesDia(dia, mesActual, anoActual)}
                    className={`h-24 rounded-lg font-bold transition flex flex-col items-center justify-center p-2 cursor-pointer border-2 ${
                      bloqueado
                        ? 'bg-gradient-to-br from-red-200 to-red-100 border-red-500 text-red-900 hover:shadow-lg'
                        : esHoy
                        ? 'bg-gradient-to-br from-blue-100 to-blue-50 border-blue-500 text-blue-900'
                        : evaluacionesDia.length > 0
                        ? 'bg-gradient-to-br from-purple-100 to-purple-50 border-purple-500 text-purple-900 hover:shadow-md'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="text-2xl font-bold">{dia}</span>
                    {bloqueado && (
                      <span className="text-xs font-bold mt-1 text-red-600 flex items-center gap-1">
                        🚫 BLOQUEADO
                      </span>
                    )}
                    {!bloqueado && evaluacionesDia.length > 0 && (
                      <span className="text-xs font-bold mt-2 text-purple-700">
                        {evaluacionesDia.length} eval{evaluacionesDia.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : evaluacionesFiltradas.length === 0 ? (
          <motion.div
            className="text-center py-12 bg-white rounded-lg border-2 border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 text-lg">No hay evaluaciones que mostrar</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {evaluacionesFiltradas.map((evaluacion, idx) => {
              const fecha = new Date(evaluacion.fecha_inicio || evaluacion.fecha);
              const horaInicio = evaluacion.fecha_inicio ? new Date(evaluacion.fecha_inicio).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
              const horaFin = evaluacion.fecha_fin ? new Date(evaluacion.fecha_fin).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : 'N/A';
              
              return (
                <motion.div
                  key={evaluacion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white border-2 rounded-lg p-4 hover:shadow-lg transition overflow-hidden"
                  style={{ borderColor: '#667eea' }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Nombre y Tipo */}
                    <div className="md:col-span-2">
                      <div className="flex items-start gap-3">
                        <div
                          className="w-4 h-4 rounded-full mt-1 flex-shrink-0"
                          style={{ backgroundColor: '#667eea' }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 text-lg truncate">{evaluacion.nombre || evaluacion.titulo}</h3>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Tipo:</span> {evaluacion.tipo || 'Evaluación'}
                          </p>
                          <p className="text-sm text-gray-600">
                            <span className="font-semibold">Ramo:</span> {evaluacion.ramo_nombre || evaluacion.ramo || 'N/A'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Fecha y Hora */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fecha y Hora</p>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-gray-900">
                          📅 {fecha.toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' })}
                        </p>
                        <p className="text-sm text-gray-600">
                          🕐 {horaInicio} - {horaFin}
                        </p>
                      </div>
                    </div>

                    {/* Detalles */}
                    <div>
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Detalles</p>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            evaluacion.modalidad === 'presencial'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {evaluacion.modalidad === 'presencial' ? '🏢 Presencial' : '💻 Online'}
                          </span>
                        </div>
                        {evaluacion.sala && (
                          <p className="text-xs text-gray-600">
                            🏛️ Sala: {evaluacion.sala}
                          </p>
                        )}
                        {evaluacion.profesor && (
                          <p className="text-xs text-gray-600">
                            👨‍🏫 {evaluacion.profesor}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Mi Slot (si estoy inscrito) */}
                    {evaluacion.miSlot && (
                      <div className="md:col-span-2 lg:col-span-4 bg-green-50 border-2 border-green-200 rounded-lg p-3">
                        <p className="text-xs font-semibold text-green-700 uppercase mb-1">✅ Mi Inscripción</p>
                        <p className="text-sm font-semibold text-green-800">
                          {new Date(evaluacion.miSlot.fecha).toLocaleDateString('es-ES')} - {evaluacion.miSlot.hora_inicio?.substring(0, 5)} hrs
                        </p>
                      </div>
                    )}

                    {/* Botón Ver Detalles - Centrado y Grande */}
                    <div className="md:col-span-2 lg:col-span-4 flex pt-2 border-t border-gray-200">
                      <motion.button
                        onClick={() => mostrarDetallesEvaluacion(evaluacion)}
                        className="w-full px-4 py-3 bg-blue-500 text-white rounded-lg text-base font-semibold hover:bg-blue-600 transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        👁️ Ver Detalles
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
