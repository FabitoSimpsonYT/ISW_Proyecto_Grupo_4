import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiAlertCircle,
  FiTrendingUp, FiBarChart2, FiEye, FiEdit, FiTrash2, FiDownload, FiPlus,
  FiCheck
} from 'react-icons/fi';
import ToastNotificationService from '../services/toastNotification.service';
import { AnimatedCard, AnimatedBadge } from './AnimationComponents';
import ModalCambiarEstado from './ModalCambiarEstado';
import notificacionesService from '../services/notificaciones.service';
import CrearEventoForm from './CrearEventoForm';

const API_BASE = 'http://localhost:3000/api';


export default function DashboardProfesor({ profesorId }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    totalEvaluaciones: 0,
    alumnosInscritos: 0,
    slotsTotales: 0,
    ocupacion: 0,
  });
  const [historialCambios, setHistorialCambios] = useState([]);
  const [filtroRamo, setFiltroRamo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [ramosUnicos, setRamosUnicos] = useState([]);
  const [estadosUnicos, setEstadosUnicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalEstadoAbierto, setModalEstadoAbierto] = useState(false);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [modalCrearAbierto, setModalCrearAbierto] = useState(false);

  useEffect(() => {
    cargarDatos();
    
    // Auto-actualizar cada 30 segundos
    const intervaloActualizacion = setInterval(() => {
      cargarDatos();
    }, 30000); // 30 segundos
    
    // Escuchar cambios de estado
    const handleEstadoActualizado = () => {
      cargarDatos();
    };
    window.addEventListener('estadoEvaluacionActualizado', handleEstadoActualizado);
    
    return () => {
      clearInterval(intervaloActualizacion);
      window.removeEventListener('estadoEvaluacionActualizado', handleEstadoActualizado);
    };
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token || !user.id) {
        ToastNotificationService.error('No hay sesión. Por favor inicia sesión');
        return;
      }

      // Obtener evaluaciones del profesor
      const response = await fetch(`${API_BASE}/evaluaciones`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar las evaluaciones');
      }

      const data = await response.json();
      const evaluacionesData = data.evaluaciones || [];

      // Procesar evaluaciones
      let totalInscritos = 0;
      let totalSlots = 0;
      let totalCupos = 0;

      const evaluacionesProcesadas = evaluacionesData.map(ev => {
        const slotCount = ev.slots?.length || 0;
        const inscritos = ev.slots?.reduce((sum, slot) => sum + (slot.inscriptos?.length || 0), 0) || 0;
        const cupos = ev.slots?.reduce((sum, slot) => sum + (slot.capacidadMaxima || 0), 0) || 0;

        totalSlots += slotCount;
        totalInscritos += inscritos;
        totalCupos += cupos;

        return {
          id: ev.id,
          titulo: ev.titulo,
          ramo: ev.codigo_ramo || 'Sin especificar',
          ramoId: ev.ramo_id,
          seccion: ev.seccion || 'Todas',
          estado: ev.estado || 'confirmado',
          slots: ev.slots || [],
          fechaCreacion: ev.createdAt || new Date(),
          ultimaModificacion: ev.updatedAt || new Date(),
          totalInscritos: inscritos,
          ocupacion: cupos > 0 ? Math.round((inscritos / cupos) * 100) : 0,
          createdBy: 'Yo',
        };
      });

      setEvaluaciones(evaluacionesProcesadas);

      // Extraer ramos únicos dinámicamente
      const ramosSet = new Set(evaluacionesProcesadas.map(ev => JSON.stringify({ id: ev.ramoId, nombre: ev.ramo })));
      const ramosArray = Array.from(ramosSet).map(r => JSON.parse(r));
      setRamosUnicos(ramosArray);

      // Extraer estados únicos dinámicamente
      const estadosSet = new Set(evaluacionesProcesadas.map(ev => ev.estado));
      const estadosArray = Array.from(estadosSet).sort();
      setEstadosUnicos(estadosArray);

      // Calcular estadísticas
      setEstadisticas({
        totalEvaluaciones: evaluacionesProcesadas.length,
        alumnosInscritos: totalInscritos,
        slotsTotales: totalSlots,
        ocupacion: totalCupos > 0 ? Math.round((totalInscritos / totalCupos) * 100) : 0,
      });

      // Cargar historial de cambios desde el usuario
      setHistorialCambios([
        {
          id: 1,
          tipo: 'evaluacion_creada',
          descripcion: `Cargaste ${evaluacionesProcesadas.length} evaluación(es)`,
          fecha: new Date(),
          detalles: `Total de inscritos: ${totalInscritos}`,
        },
      ]);

    } catch (error) {
      console.error('[DashboardProfesor] Error:', error);
      ToastNotificationService.error('Error al cargar las evaluaciones: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'confirmado':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'pendiente':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'reagendado':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'cancelado':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    }
  };

  const getColorTipoHis = (tipo) => {
    switch (tipo) {
      case 'evaluacion_creada':
        return 'bg-blue-50 border-blue-200';
      case 'slot_modificado':
        return 'bg-yellow-50 border-yellow-200';
      case 'alumno_inscrito':
        return 'bg-green-50 border-green-200';
      case 'evaluacion_confirmada':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const descargarReporte = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        ToastNotificationService.error('No hay sesión. Por favor inicia sesión');
        return;
      }

      toast.loading('Generando reporte...');

      // Llamar al endpoint para descargar el reporte
      const response = await fetch(`${API_BASE}/reportes/evaluaciones`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al descargar reporte');
      }

      // Convertir respuesta a blob
      const blob = await response.blob();

      // Crear URL temporal para descarga
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Reporte_Evaluaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.dismiss();
      ToastNotificationService.success('Reporte descargado exitosamente');
    } catch (error) {
      console.error('Error descargando reporte:', error);
      toast.dismiss();
      ToastNotificationService.error('Error al descargar reporte: ' + error.message);
    }
  };

  const finalizarEvaluacion = async (evaluacion) => {
    if (!evaluacion?.id) {
      ToastNotificationService.error('No se especificó la evaluación');
      return;
    }

    // Confirmar acción
    if (!window.confirm(`¿Estás seguro que deseas finalizar la evaluación "${evaluacion.titulo}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/evaluaciones-estado/${evaluacion.id}/cambiar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado: 'finalizada',
          motivo_cambio: 'Finalizado por profesor',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al finalizar evaluación');
      }

      ToastNotificationService.success('Evaluación finalizada exitosamente');
      cargarDatos();
    } catch (error) {
      console.error('Error:', error);
      ToastNotificationService.error('Error: ' + error.message);
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'evaluacion_creada':
        return <FiCheckCircle className="text-blue-600 w-4 h-4" />;
      case 'slot_modificado':
        return <FiEdit className="text-yellow-600 w-4 h-4" />;
      case 'alumno_inscrito':
        return <FiUsers className="text-green-600 w-4 h-4" />;
      case 'evaluacion_confirmada':
        return <FiCheckCircle className="text-purple-600 w-4 h-4" />;
      default:
        return <FiCalendar className="text-gray-600 w-4 h-4" />;
    }
  };

  const evaluacionesFiltradas = evaluaciones.filter((ev) => {
    const pasaRamo = filtroRamo === 'todos' || ev.ramoId.toString() === filtroRamo;
    const pasaEstado = filtroEstado === 'todos' || ev.estado === filtroEstado;
    return pasaRamo && pasaEstado;
  });

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Encabezado */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Dashboard de Evaluaciones</h1>
            <p className="text-xs sm:text-base text-gray-600 mt-2">Monitorea tus evaluaciones y estadísticas</p>
          </div>
          <motion.button
            onClick={() => setModalCrearAbierto(true)}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold flex items-center gap-2 shadow-lg whitespace-nowrap"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <FiPlus className="w-4 sm:w-5 h-4 sm:h-5" /> <span className="hidden sm:inline">Crear Evaluación</span><span className="sm:hidden">Crear</span>
          </motion.button>
        </motion.div>

        {/* Tarjetas de Estadísticas */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1, staggerChildren: 0.1 }}
        >
          {[
            {
              titulo: 'Evaluaciones Activas',
              valor: estadisticas.totalEvaluaciones,
              icon: FiBarChart2,
              color: 'bg-blue-100 text-blue-600',
            },
            {
              titulo: 'Alumnos Inscritos',
              valor: estadisticas.alumnosInscritos,
              icon: FiUsers,
              color: 'bg-green-100 text-green-600',
            },
            {
              titulo: 'Slots Totales',
              valor: estadisticas.slotsTotales,
              icon: FiCalendar,
              color: 'bg-purple-100 text-purple-600',
            },
            {
              titulo: 'Ocupación Promedio',
              valor: `${estadisticas.ocupacion}%`,
              icon: FiTrendingUp,
              color: 'bg-orange-100 text-orange-600',
            },
          ].map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * idx }}
              className={`${stat.color} rounded-lg p-3 sm:p-6 font-bold text-center`}
            >
              <stat.icon className="w-6 sm:w-8 h-6 sm:h-8 mx-auto mb-2 opacity-75" />
              <p className="text-xs sm:text-sm opacity-75">{stat.titulo}</p>
              <p className="text-2xl sm:text-3xl font-bold mt-1">{stat.valor}</p>
            </motion.div>
          ))}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Columna Principal: Evaluaciones */}
          <motion.div className="lg:col-span-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <AnimatedCard className="bg-white border-2 border-gray-200">
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-gray-200">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">Mis Evaluaciones</h2>
              </div>

              {/* Filtros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Ramo</label>
                  <select
                    value={filtroRamo}
                    onChange={(e) => setFiltroRamo(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 text-xs sm:text-base"
                  >
                    <option value="todos">Todos los ramos ({evaluaciones.length})</option>
                    {ramosUnicos.map((ramo) => (
                      <option key={ramo.id} value={ramo.id}>
                        {ramo.nombre} ({evaluaciones.filter(e => e.ramoId === ramo.id).length})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Estado</label>
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 sm:px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600 text-xs sm:text-base"
                  >
                    <option value="todos">Todos los estados ({evaluaciones.length})</option>
                    {estadosUnicos.map((estado) => (
                      <option key={estado} value={estado}>
                        {estado.charAt(0).toUpperCase() + estado.slice(1)} ({evaluaciones.filter(e => e.estado === estado).length})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lista de Evaluaciones */}
              <div className="space-y-3 sm:space-y-4">
                {evaluacionesFiltradas.length === 0 ? (
                  <motion.div
                    className="text-center py-12 sm:py-16"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="inline-block mb-3 sm:mb-4">
                      <FiAlertCircle className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300" />
                    </div>
                    <p className="text-base sm:text-xl font-semibold text-gray-600">No hay evaluaciones</p>
                    <p className="text-xs sm:text-base text-gray-500 mt-2">Crea tu primera evaluación para comenzar</p>
                  </motion.div>
                ) : (
                  evaluacionesFiltradas.map((evaluacion, idx) => (
                  <motion.div
                    key={evaluacion.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * idx }}
                    className="p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-400 transition"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-lg truncate">{evaluacion.titulo}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">{evaluacion.ramo} • Secciones: {evaluacion.seccion}</p>
                      </div>
                      <motion.div
                        className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border-2 shrink-0 ${getColorEstado(evaluacion.estado)}`}
                        whileHover={{ scale: 1.05 }}
                      >
                        {evaluacion.estado.charAt(0).toUpperCase() + evaluacion.estado.slice(1)}
                      </motion.div>
                    </div>

                    {/* Barra de ocupación */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-700">Ocupación: {evaluacion.ocupacion}%</span>
                        <span className="text-xs text-gray-600">{evaluacion.totalInscritos} inscritos</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          className={`h-2 rounded-full ${
                            evaluacion.ocupacion >= 90
                              ? 'bg-red-500'
                              : evaluacion.ocupacion >= 70
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${evaluacion.ocupacion}%` }}
                          transition={{ duration: 0.8, delay: 0.1 * idx }}
                        />
                      </div>
                    </div>

                    {/* Información de slots */}
                    <div className="grid grid-cols-3 gap-2 mb-3 text-xs">
                      {evaluacion.slots.slice(0, 3).map((slot, sidx) => (
                        <div key={sidx} className="bg-gray-50 p-2 rounded border-l-4 border-blue-500">
                          <p className="text-xs text-gray-600 truncate">
                            {new Date(slot.fecha).toLocaleDateString('es-ES')} {slot.hora_inicio}
                          </p>
                          <p className="text-xs font-bold text-blue-600">{slot.inscriptos}/{slot.capacidad}</p>
                        </div>
                      ))}
                    </div>

                    {/* Acciones */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 border-t-2 border-gray-100 pt-2 sm:pt-3">
                      <motion.button
                        className="px-2 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 font-semibold text-xs flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Ver detalles"
                      >
                        <FiEye className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Ver</span>
                      </motion.button>
                      <motion.button
                        className="px-2 py-1.5 sm:py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 font-semibold text-xs flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Editar"
                      >
                        <FiEdit className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Editar</span>
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setEvaluacionSeleccionada(evaluacion);
                          setModalEstadoAbierto(true);
                        }}
                        className="px-2 py-1.5 sm:py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 font-semibold text-xs flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Cambiar estado"
                      >
                        <FiAlertCircle className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Estado</span>
                      </motion.button>
                      <motion.button
                        onClick={() => finalizarEvaluacion(evaluacion)}
                        className="px-2 py-1.5 sm:py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 font-semibold text-xs flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Finalizar evaluación"
                        disabled={evaluacion.estado === 'finalizada'}
                      >
                        <FiCheck className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Cerrar</span>
                      </motion.button>
                      <motion.button
                        className="px-2 py-1.5 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-xs flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        title="Eliminar"
                      >
                        <FiTrash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                      </motion.button>
                    </div>
                  </motion.div>
                ))
                )}
              </div>
            </AnimatedCard>
          </motion.div>

          {/* Columna Lateral: Historial de Cambios */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <AnimatedCard className="bg-white border-2 border-gray-200 sticky top-6">
              <div className="mb-4 sm:mb-6 pb-4 sm:pb-6 border-b-2 border-gray-200">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">Historial de Cambios</h2>
                <p className="text-xs text-gray-600 mt-1">Auditoría de acciones</p>
              </div>

              <div className="space-y-2 sm:space-y-3 max-h-[300px] sm:max-h-[600px] overflow-y-auto">
                {historialCambios.map((cambio, idx) => (
                  <motion.div
                    key={cambio.id}
                    className={`p-2 sm:p-3 rounded-lg border-l-4 ${getColorTipoHis(cambio.tipo)}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.05 }}
                  >
                    <div className="flex items-start gap-2">
                      {getIconoTipo(cambio.tipo)}
                      <div className="flex-1 text-xs sm:text-sm">
                        <p className="font-semibold text-gray-900">{cambio.descripcion}</p>
                        <p className="text-xs text-gray-600 mt-1">{cambio.detalles}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {cambio.fecha.toLocaleDateString('es-ES')} {cambio.fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t-2 border-gray-200">
                <motion.button
                  onClick={descargarReporte}
                  className="w-full px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold text-xs sm:text-sm flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiDownload className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Descargar Reporte</span><span className="sm:hidden">Reporte</span>
                </motion.button>
              </div>
            </AnimatedCard>
          </motion.div>
        </div>
      </div>

      {/* Modal para cambiar estado */}
      <ModalCambiarEstado
        isOpen={modalEstadoAbierto}
        onClose={() => {
          setModalEstadoAbierto(false);
          setEvaluacionSeleccionada(null);
        }}
        evaluacion={evaluacionSeleccionada}
        onEstadoActualizado={() => cargarDatos()}
      />

      {/* Modal para crear evaluación */}
      {modalCrearAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto">
          <motion.div
            className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full m-4 max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Crear Nueva Evaluación</h2>
              <button
                onClick={() => setModalCrearAbierto(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
              >
                ✕
              </button>
            </div>
            <CrearEventoForm
              onSaved={() => {
                setModalCrearAbierto(false);
                cargarDatos();
                ToastNotificationService.success('Evaluación creada exitosamente');
              }}
            />
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

