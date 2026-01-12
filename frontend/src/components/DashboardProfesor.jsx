import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import {
  FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiAlertCircle,
  FiTrendingUp, FiBarChart2, FiEye, FiEdit, FiTrash2, FiDownload, FiPlus,
  FiCheck, FiBell, FiX
} from 'react-icons/fi';
import ToastNotificationService from '../services/toastNotification.service';
import { AnimatedCard, AnimatedBadge } from './AnimationComponents';
import ModalCambiarEstado from './ModalCambiarEstado';
import { getNotificaciones, marcarNotificacionLeida } from '../services/notificacionuno.service';
import CrearEventoForm from './CrearEventoForm';
import { getMisRamos } from '../services/ramos.service';
import { getEvaluacionesByCodigoRamo } from '../services/evaluacion.service';
import { getEvaluacionIntegradora } from '../services/evaluacionIntegradora.service';
import api from '../services/root.service';
import { useAuth } from '../context/AuthContext';
import cookies from 'js-cookie';

export default function DashboardProfesor({ profesorId }) {
  const { user: authUser } = useAuth(); // Obtener usuario del contexto
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [cargandoRamos, setCargandoRamos] = useState(false);
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
  const [modalNotificacionesAbierto, setModalNotificacionesAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [contadorNoVistas, setContadorNoVistas] = useState(0);

  useEffect(() => {
    cargarDatos();
    cargarNotificaciones();
    
    // Auto-actualizar cada 30 segundos
    const intervaloActualizacion = setInterval(() => {
      cargarDatos();
      cargarNotificaciones();
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

  // Recalcular estadísticas cuando cambien las evaluaciones o los filtros
  useEffect(() => {
    calcularEstadisticas();
  }, [evaluaciones, filtroRamo]);

  const cargarNotificaciones = async () => {
    try {
      const token = cookies.get('jwt-auth');
      if (!token) return;

      const response = await getNotificaciones();
      const notifs = Array.isArray(response) ? response : response?.data || [];
      
      setNotificaciones(notifs);
      
      // Contar las no vistas
      const noVistas = notifs.filter(n => !n.leido).length;
      setContadorNoVistas(noVistas);
      
      console.log('[DashboardProfesor] Notificaciones cargadas:', notifs.length, 'No vistas:', noVistas);
    } catch (error) {
      console.error('[DashboardProfesor] Error al cargar notificaciones:', error);
    }
  };

  const marcarComoVista = async (notificacionId) => {
    try {
      await marcarNotificacionLeida(notificacionId);
      
      // Actualizar localmente
      setNotificaciones(prev => 
        prev.map(n => n.id === notificacionId ? { ...n, leido: true } : n)
      );
      
      // Descontar del contador
      setContadorNoVistas(prev => Math.max(0, prev - 1));
      
      ToastNotificationService.success('Notificación marcada como leída');
    } catch (error) {
      console.error('[DashboardProfesor] Error al marcar notificación:', error);
      ToastNotificationService.error('Error al marcar notificación');
    }
  };

  const marcarTodasComoVistas = async () => {
    try {
      const noVistas = notificaciones.filter(n => !n.leido);
      
      await Promise.all(
        noVistas.map(n => marcarNotificacionLeida(n.id))
      );
      
      // Actualizar localmente
      setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));
      setContadorNoVistas(0);
      
      ToastNotificationService.success('Todas las notificaciones marcadas como leídas');
    } catch (error) {
      console.error('[DashboardProfesor] Error al marcar todas:', error);
      ToastNotificationService.error('Error al marcar notificaciones');
    }
  };

  const cargarDatos = async () => {
    console.log('[DashboardProfesor] ========== INICIANDO cargarDatos() ==========');
    setCargando(true);
    try {
      // Obtener token de cookies y usuario de sessionStorage (como AuthContext)
      const token = cookies.get('jwt-auth');
      const storedUser = sessionStorage.getItem('usuario');
      const user = storedUser ? JSON.parse(storedUser) : null;
      
      console.log('[DashboardProfesor] Token existe:', !!token);
      console.log('[DashboardProfesor] User data:', user);
      console.log('[DashboardProfesor] User ID:', user?.id);
      console.log('[DashboardProfesor] AuthContext user:', authUser);
      
      if (!token || !user?.id) {
        console.error('[DashboardProfesor] ❌ Falta token o user.id - ABORTANDO');
        ToastNotificationService.error('No hay sesión. Por favor inicia sesión');
        return;
      }

      console.log('[DashboardProfesor] ✅ Sesión válida - Iniciando carga de datos para profesor:', user.rut);

      // Obtener ramos del profesor usando el servicio
      setCargandoRamos(true);
      let ramos = [];
      try {
        const ramosData = await getMisRamos();
        console.log('[DashboardProfesor] Ramos obtenidos (raw):', ramosData);
        const ramosNormalizados = Array.isArray(ramosData)
          ? ramosData
          : Array.isArray(ramosData?.data)
            ? ramosData.data
            : Array.isArray(ramosData?.data?.ramos)
              ? ramosData.data.ramos
              : [];
        ramos = ramosNormalizados.filter(Boolean);
        console.log('[DashboardProfesor] Total ramos normalizados:', ramos.length);
      } catch (error) {
        console.error('[DashboardProfesor] Error al obtener ramos:', error);
        ramos = [];
      } finally {
        setCargandoRamos(false);
      }

      // Cargar evaluaciones de cada ramo
      let todasLasEvaluaciones = [];

      // Usar los ramos para poblar el selector aun si no hay evaluaciones
      const ramosSelector = ramos.map(r => ({ id: r.codigo, nombre: r.nombre, codigo: r.codigo }));
      if (ramosSelector.length) {
        setRamosUnicos(ramosSelector);
        console.log('[DashboardProfesor] Ramos únicos seteados:', ramosSelector.length, ramosSelector);
      }

      for (const ramo of ramos) {
        try {
          console.log(`[DashboardProfesor] Cargando evaluaciones para ramo ${ramo.codigo}...`);
          const evaluacionesRamo = await getEvaluacionesByCodigoRamo(ramo.codigo);
          console.log(`[DashboardProfesor] Evaluaciones obtenidas para ${ramo.codigo}:`, evaluacionesRamo);

          // Procesar evaluaciones normales
          const evaluacionesProcesadas = (Array.isArray(evaluacionesRamo) ? evaluacionesRamo : []).map(ev => {
            const slotCount = ev.slots?.length || 0;
            const inscritos = ev.slots?.reduce((sum, slot) => sum + (slot.inscriptos?.length || 0), 0) || 0;
            const cupos = ev.slots?.reduce((sum, slot) => sum + (slot.capacidadMaxima || 0), 0) || 0;

            return {
              id: ev.id,
              titulo: ev.titulo || ev.nombre,
              ramo: ramo.codigo,
              ramoId: ramo.codigo,
              ramo_codigo: ramo.codigo,
              ramo_nombre: ramo.nombre,
              seccion: ev.seccion || 'Todas',
              estado: (ev.estado || 'confirmado').toLowerCase(),
              slots: ev.slots || [],
              fechaCreacion: ev.createdAt || ev.fechaCreacion || new Date(),
              ultimaModificacion: ev.updatedAt || ev.fechaCreacion || new Date(),
              totalInscritos: inscritos,
              ocupacion: cupos > 0 ? Math.round((inscritos / cupos) * 100) : 0,
              createdBy: 'Yo',
              slotCount: slotCount,
              cupos: cupos,
              esIntegradora: false,
            };
          });

          todasLasEvaluaciones = [...todasLasEvaluaciones, ...evaluacionesProcesadas];
          console.log(`[DashboardProfesor] Total evaluaciones normales hasta ahora: ${todasLasEvaluaciones.length}`);

          // Intentar cargar evaluación integradora para este ramo
          try {
            const integradoras = await getEvaluacionIntegradora(ramo.codigo);
            console.log(`[DashboardProfesor] Integradora para ${ramo.codigo}:`, integradoras);

            if (integradoras?.data) {
              const integradora = integradoras.data;
              todasLasEvaluaciones.push({
                id: `integradora_${integradora.id}`,
                titulo: integradora.titulo || 'Evaluación Integradora',
                ramo: ramo.codigo,
                ramoId: ramo.codigo,
                ramo_codigo: ramo.codigo,
                ramo_nombre: ramo.nombre,
                seccion: 'Todas',
                estado: (integradora.estado || 'pendiente').toLowerCase(),
                slots: [],
                fechaCreacion: integradora.createdAt || new Date(),
                ultimaModificacion: integradora.updatedAt || new Date(),
                totalInscritos: 0,
                ocupacion: 0,
                createdBy: 'Yo',
                slotCount: 0,
                cupos: 0,
                esIntegradora: true,
              });
              console.log(`[DashboardProfesor] Integradora agregada para ${ramo.codigo}`);
            }
          } catch (integError) {
            console.log(`[DashboardProfesor] No hay integradora para ${ramo.codigo}:`, integError);
          }
        } catch (error) {
          console.error(`[DashboardProfesor] Error cargando evaluaciones para ramo ${ramo.codigo}:`, error);
        }
      }

      console.log('[DashboardProfesor] Total evaluaciones cargadas:', todasLasEvaluaciones.length);
      setEvaluaciones(todasLasEvaluaciones);

      // Extraer ramos únicos dinámicamente desde evaluaciones (fallback si no hubo ramos)
      const ramosSet = new Set(todasLasEvaluaciones.map(ev => JSON.stringify({ 
        id: ev.ramo_codigo || ev.ramoId, 
        nombre: ev.ramo_nombre || ev.ramo,
        codigo: ev.ramo_codigo || ev.ramo
      })));
      const ramosArray = Array.from(ramosSet).map(r => JSON.parse(r)).filter(r => r.id);
      if (ramosArray.length) {
        setRamosUnicos(ramosArray);
        console.log('[DashboardProfesor] Ramos únicos extraídos desde evaluaciones:', ramosArray.length);
      }

      // Extraer estados únicos dinámicamente
      const estadosSet = new Set(todasLasEvaluaciones.map(ev => ev.estado));
      const estadosArray = Array.from(estadosSet).sort();
      setEstadosUnicos(estadosArray);

      // Cargar historial de cambios
      setHistorialCambios([
        {
          id: 1,
          tipo: 'evaluacion_creada',
          descripcion: `Cargaste ${todasLasEvaluaciones.length} evaluación(es)`,
          fecha: new Date(),
          detalles: `Total de inscritos: ${todasLasEvaluaciones.reduce((sum, e) => sum + e.totalInscritos, 0)}`,
        },
      ]);

    } catch (error) {
      console.error('[DashboardProfesor] Error:', error);
      ToastNotificationService.error('Error al cargar las evaluaciones: ' + error.message);
    } finally {
      setCargando(false);
    }
  };

  // Función para calcular estadísticas basadas en filtros
  const calcularEstadisticas = () => {
    const evaluacionesFiltradas = evaluaciones.filter((ev) => {
      const pasaRamo = filtroRamo === 'todos' || ev.ramoId?.toString() === filtroRamo;
      return pasaRamo;
    });

    console.log('[DashboardProfesor] Evaluaciones filtradas por ramo:', evaluacionesFiltradas);

    // Evaluaciones activas: estados pendiente o publicado (normales + integradoras)
    const evaluacionesActivas = evaluacionesFiltradas.filter(ev => {
      const estado = ev.estado?.toLowerCase() || 'pendiente';
      return estado === 'pendiente' || estado === 'publicado';
    });

    console.log('[DashboardProfesor] Evaluaciones activas:', evaluacionesActivas);

    // Último evento (solo evaluaciones no integradoras) con slots
    const evaluacionesNormales = evaluacionesFiltradas.filter(ev => !ev.esIntegradora && (ev.slots?.length || 0) > 0);
    const ultimoEvento = evaluacionesNormales.length > 0 
      ? evaluacionesNormales.reduce((max, ev) => {
          const fechaMax = new Date(max.fechaCreacion || max.ultimaModificacion);
          const fechaCurrent = new Date(ev.fechaCreacion || ev.ultimaModificacion);
          return fechaCurrent > fechaMax ? ev : max;
        })
      : null;

    console.log('[DashboardProfesor] Último evento:', ultimoEvento);

    let alumnosInscritos = 0;
    let slotsTotales = 0;
    let ocupacionPromedio = 0;

    if (ultimoEvento) {
      slotsTotales = ultimoEvento.slots?.length || 0;
      alumnosInscritos = ultimoEvento.slots?.reduce((sum, slot) => sum + (slot.inscriptos?.length || 0), 0) || 0;
      
      // Calcular ocupación promedio de los slots del último evento
      if (ultimoEvento.slots && ultimoEvento.slots.length > 0) {
        const ocupaciones = ultimoEvento.slots.map(slot => {
          const inscritos = slot.inscriptos?.length || 0;
          const capacidad = slot.capacidad_maxima || slot.capacidadMaxima || slot.capacidad || 0;
          return capacidad > 0 ? (inscritos / capacidad) * 100 : 0;
        });
        ocupacionPromedio = Math.round(ocupaciones.reduce((a, b) => a + b, 0) / ocupaciones.length);
      }
    }

    console.log('[DashboardProfesor] Estadísticas calculadas:', {
      totalEvaluaciones: evaluacionesActivas.length,
      alumnosInscritos,
      slotsTotales,
      ocupacion: ocupacionPromedio,
    });

    setEstadisticas({
      totalEvaluaciones: evaluacionesActivas.length,
      alumnosInscritos: alumnosInscritos,
      slotsTotales: slotsTotales,
      ocupacion: ocupacionPromedio,
    });
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
      toast.loading('Generando reporte...');

      const userData = JSON.parse(sessionStorage.getItem('usuario') || '{}');
      const userRole = userData?.role;

      console.log('[DashboardProfesor] Descargando reporte - Rol:', userRole);

      // Usar el mismo endpoint para ambos roles - el backend generará reportes según el rol
      const response = await api.get('/reportes/evaluaciones', {
        responseType: 'blob',
      });

      const blob = response.data;

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
      
      // Manejar errores específicos
      if (error.response?.status === 403) {
        ToastNotificationService.error('No tienes permiso para descargar reportes');
      } else if (error.response?.status === 404) {
        ToastNotificationService.error('El servicio de reportes no está disponible');
      } else {
        ToastNotificationService.error('Error al descargar reporte: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const finalizarEvaluacion = async (evaluacion) => {
    if (!evaluacion?.id) {
      ToastNotificationService.error('No se especificó la evaluación');
      return;
    }

    // Confirmar acción con SweetAlert2
    const result = await Swal.fire({
      icon: 'question',
      title: 'Finalizar Evaluación',
      html: `¿Estás seguro que deseas finalizar la evaluación <strong>"${evaluacion.titulo}"</strong>?<br><br>Esta acción no se puede deshacer.`,
      showCancelButton: true,
      confirmButtonColor: '#3b82f6',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      showClass: {
        popup: 'animate__animated animate__fadeInDown'
      },
      hideClass: {
        popup: 'animate__animated animate__fadeOutUp'
      }
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      await api.put(`/evaluaciones-estado/${evaluacion.id}/cambiar`, {
        estado: 'finalizada',
        motivo_cambio: 'Finalizado por profesor',
      });

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
    const ramoValor = ev.ramoId || ev.ramo_codigo || ev.ramo;
    const pasaRamo = filtroRamo === 'todos' || (ramoValor && String(ramoValor) === String(filtroRamo));
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
          <div className="flex items-center gap-3">
            {/* Botón de Notificaciones */}
            <motion.button
              onClick={() => setModalNotificacionesAbierto(true)}
              className="relative px-4 py-3 bg-white text-gray-700 rounded-lg hover:bg-gray-100 border-2 border-gray-300 shadow-md"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiBell className="w-5 h-5" />
              {contadorNoVistas > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {contadorNoVistas}
                </span>
              )}
            </motion.button>
            
            <motion.button
              onClick={() => setModalCrearAbierto(true)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold flex items-center gap-2 shadow-lg whitespace-nowrap"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <FiPlus className="w-4 sm:w-5 h-4 sm:h-5" /> <span className="hidden sm:inline">Crear Evaluación</span><span className="sm:hidden">Crear</span>
            </motion.button>
          </div>
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

        <div className="w-full">
          {/* Sección: Evaluaciones */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
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
                    <option value="todos">{cargandoRamos ? 'Cargando ramos...' : `Todos los ramos (${evaluaciones.length})`}</option>
                    {ramosUnicos.map((ramo) => (
                      <option key={ramo.id} value={ramo.id}>
                        {ramo.nombre} ({evaluaciones.filter(e => String(e.ramoId || e.ramo_codigo || e.ramo) === String(ramo.id)).length})
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

      {/* Modal de Notificaciones */}
      {modalNotificacionesAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden flex flex-col"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
          >
            {/* Header del Modal */}
            <div className="flex items-center justify-between p-6 border-b-2 border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <FiBell className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Notificaciones</h2>
                  <p className="text-sm text-gray-600">
                    {contadorNoVistas > 0 ? `${contadorNoVistas} sin leer` : 'Todo al día'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalNotificacionesAbierto(false)}
                className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-200 rounded-lg transition"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* Acciones */}
            {contadorNoVistas > 0 && (
              <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                <button
                  onClick={marcarTodasComoVistas}
                  className="text-sm text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-2"
                >
                  <FiCheckCircle className="w-4 h-4" />
                  Marcar todas como vistas
                </button>
              </div>
            )}

            {/* Lista de Notificaciones */}
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {notificaciones.length === 0 ? (
                <div className="text-center py-12">
                  <FiBell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-xl font-semibold text-gray-600">No hay notificaciones</p>
                  <p className="text-sm text-gray-500 mt-2">Cuando tengas notificaciones aparecerán aquí</p>
                </div>
              ) : (
                notificaciones.map((notif) => (
                  <motion.div
                    key={notif.id}
                    className={`p-4 rounded-lg border-2 transition ${
                      notif.vista
                        ? 'bg-white border-gray-200'
                        : 'bg-blue-50 border-blue-300 shadow-md'
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {!notif.vista && (
                            <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                          )}
                          <h3 className={`font-bold ${notif.vista ? 'text-gray-700' : 'text-gray-900'}`}>
                            {notif.titulo}
                          </h3>
                        </div>
                        <p className={`text-sm ${notif.vista ? 'text-gray-500' : 'text-gray-700'} mb-2`}>
                          {notif.mensaje}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FiClock className="w-3 h-3" />
                            {new Date(notif.createdAt).toLocaleDateString('es-ES')} {new Date(notif.createdAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {notif.tipo && (
                            <span className="px-2 py-1 bg-gray-200 rounded text-gray-700 font-semibold">
                              {notif.tipo}
                            </span>
                          )}
                        </div>
                      </div>
                      {!notif.vista && (
                        <button
                          onClick={() => marcarComoVista(notif.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-semibold flex items-center gap-1 shrink-0"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          Marcar
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
    </motion.div>
  );
}

