import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  FiEdit, FiTrash2, FiUsers, FiClock, FiMapPin, FiLock, FiUnlock,
  FiArrowRight, FiPlus, FiChevronDown, FiX, FiFilter
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import Swal from 'sweetalert2';
import { getEventosProfesor, eliminarEvento } from '../services/evento.service';
import apiRoot from '../services/root.service';

export default function GestionarSlotsProfesor() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [slotsFiltrados, setSlotsFiltrados] = useState([]);
  const [evaluacionSeleccionada, setEvaluacionSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [modalMoverAbierto, setModalMoverAbierto] = useState(false);
  const [slotSeleccionado, setSlotSeleccionado] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [fechasExpandidas, setFechasExpandidas] = useState({});
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [panelEvaluacionesAbierto, setPanelEvaluacionesAbierto] = useState(false);

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  useEffect(() => {
    // Listener para cuando se crea/actualiza un evento
    const handleEventosUpdated = () => {
      cargarEvaluaciones();
    };

    window.addEventListener('eventosUpdated', handleEventosUpdated);

    return () => {
      window.removeEventListener('eventosUpdated', handleEventosUpdated);
    };
  }, []);

  // Expandir fechas cuando se selecciona una evaluación
  useEffect(() => {
    if (evaluacionSeleccionada && slotsFiltrados.length > 0) {
      const agrupadosFechas = {};
      slotsFiltrados.forEach(slot => {
        const fecha = new Date(slot.fecha).toLocaleDateString('es-ES');
        if (!agrupadosFechas[fecha]) {
          agrupadosFechas[fecha] = [];
        }
        agrupadosFechas[fecha].push(slot);
      });
      const nuevasFechas = {};
      Object.keys(agrupadosFechas).forEach(fecha => {
        nuevasFechas[fecha] = true;
      });
      setFechasExpandidas(nuevasFechas);
    }
  }, [evaluacionSeleccionada]);

  const cargarEvaluaciones = async () => {
    setCargando(true);
    try {
      const data = await getEventosProfesor();
      console.log('[GestionarSlotsProfesor] Datos recibidos del API:', data);
      const evalsArray = Array.isArray(data) ? data : (data?.data || []);
      console.log('[GestionarSlotsProfesor] Array de eventos:', evalsArray);
      
      // Filtrar solo evaluaciones que tienen slots
      const evalsConSlots = evalsArray.filter(ev => ev.slots && ev.slots.length > 0);
      console.log('[GestionarSlotsProfesor] Eventos con slots:', evalsConSlots);
      
      setEvaluaciones(evalsConSlots);

      // Por defecto, mostrar slots de la primera evaluación
      if (evalsConSlots.length > 0) {
        setEvaluacionSeleccionada(evalsConSlots[0]);
        setSlotsFiltrados(evalsConSlots[0].slots || []);
      }
    } catch (error) {
      console.error('[GestionarSlotsProfesor] Error:', error);
      toast.error(error.message || 'Error al cargar evaluaciones');
    } finally {
      setCargando(false);
    }
  };

  const handleSeleccionarEvaluacion = (evaluacion) => {
    setEvaluacionSeleccionada(evaluacion);
    setFiltroEstado('todos');
    setSlotsFiltrados(evaluacion.slots || []);
  };

  // Aplicar filtro según estado
  const aplicarFiltro = (slots, estado) => {
    if (estado === 'todos') return slots;
    if (estado === 'libres') return slots.filter(s => s.disponible && (!s.inscriptos || s.inscriptos.length === 0));
    if (estado === 'ocupados') return slots.filter(s => s.inscriptos && s.inscriptos.length > 0);
    if (estado === 'bloqueados') return slots.filter(s => !s.disponible);
    return slots;
  };

  const handleCambiarFiltro = (estado) => {
    setFiltroEstado(estado);
    const slotsOriginales = evaluacionSeleccionada?.slots || [];
    setSlotsFiltrados(aplicarFiltro(slotsOriginales, estado));
  };

  // Agrupar slots por fecha
  const agruparSlotsPorFecha = (slots) => {
    const agrupados = {};
    slots.forEach(slot => {
      const fecha = new Date(slot.fecha).toLocaleDateString('es-ES');
      if (!agrupados[fecha]) {
        agrupados[fecha] = [];
      }
      agrupados[fecha].push(slot);
    });
    return agrupados;
  };

  const toggleFecha = (fecha) => {
    setFechasExpandidas(prev => ({
      ...prev,
      [fecha]: !prev[fecha]
    }));
  };

  const bloquearSlot = async (slotId) => {
    const confirm = await Swal.fire({
      title: '¿Bloquear slot?',
      text: 'Los alumnos no podrán inscribirse en este slot',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, bloquear',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiRoot({
        url: `/slots/${slotId}/bloquear`,
        method: 'PUT',
        data: { bloquear: true },
      });

      toast.success('Slot bloqueado');
      cargarEvaluaciones();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al bloquear el slot');
    }
  };

  const desbloquearSlot = async (slotId) => {
    try {
      await apiRoot({
        url: `/slots/${slotId}/desbloquear`,
        method: 'PUT',
        data: { bloquear: false },
      });

      toast.success('Slot desbloqueado');
      cargarEvaluaciones();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al desbloquear el slot');
    }
  };

  const eliminarAlumnoDelSlot = async (slotId, alumnoId) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar alumno?',
      text: 'El alumno será removido de este slot',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiRoot({
        url: `/slots/${slotId}/alumnos/${alumnoId}`,
        method: 'DELETE',
      });

      toast.success('Alumno eliminado del slot');
      cargarEvaluaciones();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el alumno');
    }
  };

  const moverAlumnoAOtroSlot = async (alumnoId, slotOrigenId, slotDestinoId) => {
    if (slotOrigenId === slotDestinoId) {
      toast.error('Selecciona un slot diferente');
      return;
    }

    try {
      // Eliminar del slot origen
      await apiRoot({
        url: `/slots/${slotOrigenId}/alumnos/${alumnoId}`,
        method: 'DELETE',
      });

      // Agregar al slot destino
      await apiRoot({
        url: `/slots/${slotDestinoId}/alumnos`,
        method: 'POST',
        data: { alumnoId },
      });

      toast.success('Alumno movido correctamente');
      setModalMoverAbierto(false);
      cargarEvaluaciones();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al mover el alumno');
    }
  };

  const eliminarSlot = async (slot) => {
    // Verificar si el slot tiene alumnos inscritos
    if (slot.inscriptos && slot.inscriptos.length > 0) {
      Swal.fire({
        title: 'No se puede eliminar',
        text: 'Este slot tiene alumnos inscritos. Debes eliminarlos primero.',
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: '¿Eliminar slot?',
      html: `<div style="text-align: left;">
        <p><strong>Fecha:</strong> ${new Date(slot.fecha).toLocaleDateString('es-ES')}</p>
        <p><strong>Hora:</strong> ${slot.hora_inicio} - ${slot.hora_fin}</p>
        <p style="color: #ef4444; margin-top: 10px;"><strong>⚠️ Esta acción no se puede deshacer</strong></p>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#ef4444',
    });

    if (!confirm.isConfirmed) return;

    try {
      await apiRoot({
        url: `/slots/${slot.id}`,
        method: 'DELETE',
      });

      toast.success('Slot eliminado correctamente');
      cargarEvaluaciones();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el slot');
    }
  };

  const eliminarEvaluacionCompleta = async (evaluacion) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar evaluación completa?',
      html: `<div style="text-align: left;">
        <p><strong>Nombre:</strong> ${evaluacion.nombre}</p>
        <p><strong>Ramo:</strong> ${evaluacion.ramo_codigo || evaluacion.ramo_nombre}</p>
        <p><strong>Slots:</strong> ${evaluacion.slots?.length || 0}</p>
        <div style="background-color: #fee2e2; border-left: 4px solid #ef4444; padding: 10px; margin-top: 15px; border-radius: 4px;">
          <p style="margin: 0; color: #7f1d1d;"><strong>⚠️ Se eliminarán todos los slots asociados</strong></p>
          <p style="margin: 5px 0 0 0; color: #7f1d1d; font-size: 12px;">Esta acción no se puede deshacer</p>
        </div>
      </div>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar evaluación',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#dc2626',
    });

    if (!confirm.isConfirmed) return;

    try {
      await eliminarEvento(evaluacion.id);
      toast.success('Evaluación eliminada correctamente');
      cargarEvaluaciones();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la evaluación');
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Cargando slots...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-3 sm:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-6 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Gestionar Slots</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">Administra los slots de tus evaluaciones</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Panel de Evaluaciones - Colapsable en mobile */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className={`lg:col-span-1 bg-white rounded-lg shadow-lg p-4 sm:p-6 border-2 border-gray-200 max-h-[600px] overflow-y-auto ${
              panelEvaluacionesAbierto ? 'fixed lg:static inset-0 lg:inset-auto z-40 rounded-none lg:rounded-lg' : 'hidden lg:block'
            }`}
          >
            <div className="flex items-center justify-between mb-4 lg:mb-0">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Evaluaciones</h2>
              <button
                onClick={() => setPanelEvaluacionesAbierto(false)}
                className="lg:hidden text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2">
              {evaluaciones.length === 0 ? (
                <p className="text-gray-500 text-sm">No hay evaluaciones</p>
              ) : (
                evaluaciones.map((ev) => (
                  <motion.button
                    key={ev.id}
                    onClick={() => {
                      handleSeleccionarEvaluacion(ev);
                      setPanelEvaluacionesAbierto(false);
                    }}
                    className={`w-full p-3 rounded-lg text-left transition ${
                      evaluacionSeleccionada?.id === ev.id
                        ? 'bg-blue-600 text-white border-2 border-blue-700'
                        : 'bg-gray-100 text-gray-900 border-2 border-gray-200 hover:border-blue-400'
                    }`}
                    whileHover={{ x: 4 }}
                  >
                    <p className="font-semibold text-xs sm:text-sm">{ev.nombre}</p>
                    <p className="text-xs opacity-75 mt-1">{ev.ramo_codigo}</p>
                    <p className="text-xs opacity-75">{ev.slots?.length || 0} slots</p>
                  </motion.button>
                ))
              )}
            </div>
          </motion.div>

          {/* Botón para abrir panel en mobile */}
          {!evaluacionSeleccionada && (
            <motion.button
              onClick={() => setPanelEvaluacionesAbierto(true)}
              className="lg:hidden col-span-1 bg-blue-600 text-white rounded-lg shadow-lg p-4 font-semibold text-center hover:bg-blue-700 transition text-sm sm:text-base"
            >
              👈 Ver Evaluaciones
            </motion.button>
          )}

          {/* Panel Principal: Slots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 bg-white rounded-lg shadow-lg p-4 sm:p-6 border-2 border-gray-200"
          >
            {evaluacionSeleccionada ? (
              <>
                <div className="mb-6 pb-6 border-b-2 border-gray-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">
                        {evaluacionSeleccionada.nombre}
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">{evaluacionSeleccionada.ramo_codigo} • {evaluacionSeleccionada.slots?.length || 0} slots totales</p>
                    </div>
                    <motion.button
                      onClick={() => eliminarEvaluacionCompleta(evaluacionSeleccionada)}
                      className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-semibold flex items-center gap-2 text-xs sm:text-sm whitespace-nowrap transition w-full sm:w-auto justify-center sm:justify-start"
                      whileHover={{ scale: 1.02 }}
                      title="Eliminar toda la evaluación y sus slots"
                    >
                      <FiTrash2 className="w-4 sm:w-5 h-4 sm:h-5" /> <span className="hidden sm:inline">Eliminar Evaluación</span><span className="sm:hidden">Eliminar</span>
                    </motion.button>
                  </div>

                  {/* Filtro de estado */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mt-4">
                    <div className="flex items-center gap-2">
                      <FiFilter className="w-4 sm:w-5 h-4 sm:h-5 text-gray-700" />
                      <span className="font-semibold text-xs sm:text-sm text-gray-700">Filtrar:</span>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-wrap">
                      {[
                        { value: 'todos', label: '📊 Todos', color: 'bg-gray-100 text-gray-900 border-gray-300' },
                        { value: 'libres', label: '🟢 Libres', color: 'bg-green-100 text-green-900 border-green-300' },
                        { value: 'ocupados', label: '🟡 Ocupados', color: 'bg-yellow-100 text-yellow-900 border-yellow-300' },
                        { value: 'bloqueados', label: '🔴 Bloqueados', color: 'bg-red-100 text-red-900 border-red-300' },
                      ].map(filtro => (
                        <motion.button
                          key={filtro.value}
                          onClick={() => handleCambiarFiltro(filtro.value)}
                          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm border-2 transition ${
                            filtroEstado === filtro.value
                              ? filtro.color + ' border-opacity-100'
                              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                          }`}
                          whileHover={{ scale: 1.05 }}
                        >
                          {filtro.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                </div>

                {slotsFiltrados.length === 0 ? (
                  <div className="text-center py-8 sm:py-12">
                    <FiClock className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-sm sm:text-lg">No hay slots para esta evaluación</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {Object.entries(agruparSlotsPorFecha(slotsFiltrados)).map(([fecha, slotsDelDia]) => (
                      <div key={fecha}>
                        <motion.button
                          onClick={() => toggleFecha(fecha)}
                          className="w-full text-base sm:text-lg font-bold text-gray-900 mb-3 pb-2 border-b-2 border-blue-400 flex items-center justify-between hover:bg-gray-50 p-2 sm:p-3 rounded-lg transition"
                        >
                          <span className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                            📅 <span className="truncate text-sm sm:text-base">{fecha}</span>
                            <span className="text-xs sm:text-sm font-normal text-gray-600 whitespace-nowrap">({slotsDelDia.length})</span>
                          </span>
                          <motion.div
                            animate={{ rotate: fechasExpandidas[fecha] ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-shrink-0"
                          >
                            <FiChevronDown className="w-4 sm:w-5 h-4 sm:h-5 text-blue-600" />
                          </motion.div>
                        </motion.button>
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{
                            opacity: fechasExpandidas[fecha] ? 1 : 0,
                            height: fechasExpandidas[fecha] ? 'auto' : 0,
                          }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-3 sm:space-y-4 mt-3">
                            {slotsDelDia.map((slot, idx) => (
                            <motion.div
                        key={slot.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className={`border-2 rounded-lg p-3 sm:p-5 transition ${
                          !slot.disponible ? 'border-red-300 bg-red-50' : slot.inscriptos?.length > 0 ? 'border-yellow-300 bg-yellow-50' : 'border-green-300 bg-green-50'
                        }`}
                      >
                        {/* Indicador de estado */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            {!slot.disponible ? (
                              <span className="px-2 sm:px-3 py-1 bg-red-200 text-red-800 rounded-full text-xs font-bold flex items-center gap-1">
                                <FiLock className="w-3 h-3" /> BLOQUEADO
                              </span>
                            ) : slot.inscriptos?.length > 0 ? (
                              <span className="px-2 sm:px-3 py-1 bg-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
                                OCUPADO
                              </span>
                            ) : (
                              <span className="px-2 sm:px-3 py-1 bg-green-200 text-green-800 rounded-full text-xs font-bold">
                                DISPONIBLE
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Encabezado del Slot */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg flex-shrink-0">
                              <FiClock className="text-blue-600 w-4 sm:w-5 h-4 sm:h-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs sm:text-sm text-gray-900 truncate">
                                {new Date(slot.fecha).toLocaleDateString('es-ES')} • {slot.hora_inicio} - {slot.hora_fin}
                              </p>
                              <p className="text-xs text-gray-600">{slot.capacidad_maxima || slot.capacidadMaxima} cupos</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                            {!slot.disponible ? (
                              <motion.button
                                onClick={() => desbloquearSlot(slot.id)}
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 font-semibold text-xs sm:text-sm flex items-center gap-1"
                                whileHover={{ scale: 1.02 }}
                              >
                                <FiLock className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Desbloquear</span>
                              </motion.button>
                            ) : (
                              <motion.button
                                onClick={() => bloquearSlot(slot.id)}
                                className="px-2 sm:px-3 py-1 sm:py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold text-xs sm:text-sm flex items-center gap-1"
                                whileHover={{ scale: 1.02 }}
                              >
                                <FiUnlock className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Bloquear</span>
                              </motion.button>
                            )}
                            <motion.button
                              onClick={() => eliminarSlot(slot)}
                              disabled={slot.inscriptos && slot.inscriptos.length > 0}
                              className={`px-2 sm:px-3 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm flex items-center gap-1 transition ${
                                slot.inscriptos && slot.inscriptos.length > 0
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                                  : 'bg-red-100 text-red-700 hover:bg-red-200'
                              }`}
                              whileHover={!(slot.inscriptos && slot.inscriptos.length > 0) ? { scale: 1.02 } : {}}
                              title={slot.inscriptos && slot.inscriptos.length > 0 ? 'No se puede eliminar: hay alumnos inscritos' : 'Eliminar este slot'}
                            >
                              <FiTrash2 className="w-3 sm:w-4 h-3 sm:h-4" /> <span className="hidden sm:inline">Eliminar</span>
                            </motion.button>
                          </div>
                        </div>

                        {/* Ocupación */}
                        <div className="mb-3 sm:mb-4">
                          <div className="flex justify-between text-xs sm:text-sm mb-2">
                            <span className="font-semibold text-gray-700">Ocupación</span>
                            <span className="text-gray-600">
                              {slot.inscriptos?.length || 0} / {slot.capacidad_maxima || slot.capacidadMaxima}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <motion.div
                              className="bg-blue-600 h-2 rounded-full"
                              initial={{ width: 0 }}
                              animate={{
                                width: `${Math.min(
                                  ((slot.inscriptos?.length || 0) / (slot.capacidad_maxima || slot.capacidadMaxima)) * 100,
                                  100
                                )}%`,
                              }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>

                        {/* Alumnos */}
                        {slot.inscriptos && slot.inscriptos.length > 0 ? (
                          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                            <p className="font-semibold text-xs sm:text-sm text-gray-900 mb-2 sm:mb-3 flex items-center gap-2">
                              <FiUsers className="w-3 sm:w-4 h-3 sm:h-4" /> Alumnos inscritos ({slot.inscriptos.length})
                            </p>
                            <div className="space-y-2">
                              {slot.inscriptos.map((alumno) => (
                                <div
                                  key={alumno.id}
                                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 bg-white p-2 sm:p-3 rounded-lg border border-gray-200"
                                >
                                  <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-xs sm:text-sm text-gray-900 truncate">
                                      {alumno.nombres} {alumno.apellidoPaterno}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">{alumno.rut}</p>
                                  </div>
                                  <div className="flex items-center gap-1 flex-shrink-0">
                                    <motion.button
                                      onClick={() => {
                                        setAlumnoSeleccionado(alumno);
                                        setSlotSeleccionado(slot);
                                        setModalMoverAbierto(true);
                                      }}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                                      whileHover={{ scale: 1.05 }}
                                      title="Mover a otro slot"
                                    >
                                      <FiArrowRight className="w-3 h-3" />
                                    </motion.button>
                                    <motion.button
                                      onClick={() => eliminarAlumnoDelSlot(slot.id, alumno.id)}
                                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200"
                                      whileHover={{ scale: 1.05 }}
                                      title="Eliminar del slot"
                                    >
                                      <FiTrash2 className="w-3 h-3" />
                                    </motion.button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 text-center">
                            <p className="text-gray-500 text-xs sm:text-sm">Sin alumnos inscritos</p>
                          </div>
                        )}
                      </motion.div>
                            ))}
                          </div>
                        </motion.div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Selecciona una evaluación para ver sus slots</p>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* Modal Mover Alumno */}
      {modalMoverAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            className="bg-white rounded-lg shadow-2xl p-4 sm:p-6 max-w-sm w-full"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                Mover alumno
              </h3>
              <button
                onClick={() => {
                  setModalMoverAbierto(false);
                  setAlumnoSeleccionado(null);
                  setSlotSeleccionado(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 sm:w-6 h-5 sm:h-6" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs sm:text-sm font-semibold text-gray-900 truncate">
                {alumnoSeleccionado?.nombres} {alumnoSeleccionado?.apellidoPaterno}
              </p>
              <p className="text-xs text-gray-600 mt-1 truncate">{alumnoSeleccionado?.rut}</p>
            </div>

            <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
              Selecciona el slot destino:
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {slotsFiltrados.map((slot) => (
                <motion.button
                  key={slot.id}
                  onClick={() => moverAlumnoAOtroSlot(
                    alumnoSeleccionado.id,
                    slotSeleccionado.id,
                    slot.id
                  )}
                  disabled={slot.id === slotSeleccionado.id}
                  className={`w-full p-2 sm:p-3 rounded-lg text-left text-xs sm:text-sm transition ${
                    slot.id === slotSeleccionado.id
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-50 text-gray-900 border border-gray-200 hover:border-blue-400 hover:bg-blue-50'
                  }`}
                  whileHover={slot.id !== slotSeleccionado.id ? { x: 4 } : {}}
                >
                  <p className="font-semibold truncate">
                    {new Date(slot.fecha).toLocaleDateString('es-ES')} • {slot.hora_inicio}
                  </p>
                  <p className="text-xs opacity-75">
                    {slot.inscriptos?.length || 0} / {slot.capacidad_maxima || slot.capacidadMaxima} cupos
                  </p>
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={() => {
                setModalMoverAbierto(false);
                setAlumnoSeleccionado(null);
                setSlotSeleccionado(null);
              }}
              className="w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-900 rounded-lg hover:bg-gray-400 font-semibold text-xs sm:text-sm"
              whileHover={{ scale: 1.02 }}
            >
              Cancelar
            </motion.button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
