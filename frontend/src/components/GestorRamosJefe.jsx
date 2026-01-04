import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiBook, FiUsers, FiCalendar, FiSettings, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { AnimatedCard } from './AnimationComponents';

/**
 * Gestor de Ramos para Jefe de Carrera
 * Permite al jefe de carrera:
 * - Ver listado de ramos y profesores
 * - Actuar como profesor para crear evaluaciones
 * - Supervisar evaluaciones de todos los profesores
 * - Reasignar cupos
 * - Abrir nuevas evaluaciones si faltan profesores
 */

export default function GestorRamosJefe({ jefeId }) {
  const [ramos, setRamos] = useState([]);
  const [ramoSeleccionado, setRamoSeleccionado] = useState(null);
  const [modo, setModo] = useState('visualizar'); // visualizar | crear | supervisar
  const [cargando, setCargando] = useState(true);
  const [actividadReciente, setActividadReciente] = useState([]);

  useEffect(() => {
    cargarRamos();
  }, []);

  const cargarRamos = async () => {
    setCargando(true);
    try {
      // Aquí iría la llamada a API para obtener ramos y sus profesores
      // const response = await fetch(`/api/carrera/ramos`);
      // const data = await response.json();

      setRamos([
        {
          id: 1,
          codigo: 'DER-101',
          nombre: 'Derecho Civil I',
          profesores: [
            { id: 1, nombre: 'Dr. Juan García', evaluacionesActivas: 2, estudiantesAsignados: 45 },
            { id: 2, nombre: 'Dra. Marta Pérez', evaluacionesActivas: 1, estudiantesAsignados: 30 },
          ],
          evaluacionesTotales: 3,
          alumnosTotales: 75,
          estado: 'activo',
        },
        {
          id: 2,
          codigo: 'DER-102',
          nombre: 'Derecho Penal I',
          profesores: [
            { id: 3, nombre: 'Dr. Carlos Rodríguez', evaluacionesActivas: 2, estudiantesAsignados: 50 },
          ],
          evaluacionesTotales: 2,
          alumnosTotales: 50,
          estado: 'activo',
        },
        {
          id: 3,
          codigo: 'DER-103',
          nombre: 'Derecho Laboral I',
          profesores: [],
          evaluacionesTotales: 0,
          alumnosTotales: 40,
          estado: 'sin_evaluaciones',
        },
      ]);

      setActividadReciente([
        { id: 1, tipo: 'evaluacion_creada', profesor: 'Dr. Juan García', ramo: 'Derecho Civil I', mensaje: 'Creó evaluación de Derecho Civil', hace: '2 horas' },
        { id: 2, tipo: 'alumno_inscrito', profesor: 'Sistema', ramo: 'Derecho Penal I', mensaje: '12 estudiantes se inscribieron', hace: '4 horas' },
        { id: 3, tipo: 'slot_lleno', profesor: 'Dra. Marta Pérez', ramo: 'Derecho Civil I', mensaje: 'Un slot se completó', hace: '6 horas' },
      ]);
    } catch (error) {
      console.error('Error cargando ramos:', error);
      toast.error('Error al cargar los ramos');
    } finally {
      setCargando(false);
    }
  };

  const actuarComoProfesor = (ramo) => {
    setRamoSeleccionado(ramo);
    setModo('crear');
    toast.success(`Actuando como profesor para ${ramo.nombre}`);
  };

  const supervisarRamo = (ramo) => {
    setRamoSeleccionado(ramo);
    setModo('supervisar');
  };

  const getColorEstado = (estado) => {
    switch (estado) {
      case 'activo':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'sin_evaluaciones':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'pausado':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getIconoTipo = (tipo) => {
    switch (tipo) {
      case 'evaluacion_creada':
        return <FiCheckCircle className="text-green-600 w-4 h-4" />;
      case 'alumno_inscrito':
        return <FiUsers className="text-blue-600 w-4 h-4" />;
      case 'slot_lleno':
        return <FiAlertCircle className="text-yellow-600 w-4 h-4" />;
      default:
        return <FiCalendar className="text-gray-600 w-4 h-4" />;
    }
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Cargando ramos...</p>
        </div>
      </div>
    );
  }

  if (modo === 'crear' && ramoSeleccionado) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setModo('visualizar')}
            className="mb-6 px-4 py-2 rounded-lg bg-white border-2 border-gray-300 hover:bg-gray-50 transition font-semibold"
          >
            ← Volver
          </button>

          <AnimatedCard className="bg-white border-2 border-blue-400">
            <div className="mb-6 pb-6 border-b-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Crear Evaluación como Profesor
              </h2>
              <p className="text-gray-600 mt-1">
                Actuando como profesor para: <span className="font-bold">{ramoSeleccionado.nombre}</span>
              </p>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r-lg">
              <p className="text-sm font-semibold text-blue-900">
                ⚠️ Nota: Como jefe de carrera, estás actuando en nombre de un profesor. 
                Asegúrate de tener su autorización para crear esta evaluación.
              </p>
            </div>

            <form className="space-y-6">
              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Título de la Evaluación
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Evaluación Parcial I"
                    className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Profesor Responsable
                  </label>
                  <select className="w-full px-4 py-2 rounded-lg border-2 border-gray-300 focus:border-blue-600">
                    <option>Selecciona un profesor</option>
                    {ramoSeleccionado.profesores.map((prof) => (
                      <option key={prof.id} value={prof.id}>
                        {prof.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Fecha</label>
                  <input type="date" className="w-full px-4 py-2 rounded-lg border-2 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hora Inicio</label>
                  <input type="time" className="w-full px-4 py-2 rounded-lg border-2 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duración (min)</label>
                  <input type="number" placeholder="90" className="w-full px-4 py-2 rounded-lg border-2 border-gray-300" />
                </div>
              </div>

              {/* Cupos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Cupos Totales</label>
                  <input type="number" placeholder="25" className="w-full px-4 py-2 rounded-lg border-2 border-gray-300" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Secciones (separadas por coma)</label>
                  <input type="text" placeholder="A, B, C" className="w-full px-4 py-2 rounded-lg border-2 border-gray-300" />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200">
                <button
                  type="button"
                  onClick={() => setModo('visualizar')}
                  className="px-6 py-3 rounded-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-100 font-semibold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-semibold transition ml-auto"
                >
                  Crear Evaluación
                </button>
              </div>
            </form>
          </AnimatedCard>
        </div>
      </motion.div>
    );
  }

  if (modo === 'supervisar' && ramoSeleccionado) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 p-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <div className="max-w-6xl mx-auto">
          <button
            onClick={() => setModo('visualizar')}
            className="mb-6 px-4 py-2 rounded-lg bg-white border-2 border-gray-300 hover:bg-gray-50 transition font-semibold"
          >
            ← Volver
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Profesores */}
            <AnimatedCard className="bg-white border-2 border-purple-400 lg:col-span-1">
              <h3 className="font-bold text-lg mb-4">Profesores</h3>
              <div className="space-y-3">
                {ramoSeleccionado.profesores.map((prof) => (
                  <motion.div
                    key={prof.id}
                    className="p-3 bg-purple-50 rounded-lg border-2 border-purple-200 hover:border-purple-400 transition cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    <p className="font-semibold text-gray-900">{prof.nombre}</p>
                    <div className="text-xs text-gray-600 mt-2 space-y-1">
                      <p>📋 {prof.evaluacionesActivas} evaluaciones</p>
                      <p>👥 {prof.estudiantesAsignados} estudiantes</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>

            {/* Estadísticas */}
            <AnimatedCard className="bg-white border-2 border-purple-400 lg:col-span-2">
              <h3 className="font-bold text-lg mb-4">Información del Ramo</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Evaluaciones Activas</p>
                  <p className="text-3xl font-bold text-blue-600">{ramoSeleccionado.evaluacionesTotales}</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-gray-600 text-sm">Alumnos Totales</p>
                  <p className="text-3xl font-bold text-green-600">{ramoSeleccionado.alumnosTotales}</p>
                </div>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </motion.div>
    );
  }

  // Vista principal: Listado de ramos
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Encabezado */}
        <motion.div className="mb-8" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Gestión de Ramos</h1>
          <p className="text-gray-600">Supervisa evaluaciones y actúa como profesor cuando sea necesario</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Principal: Ramos */}
          <motion.div className="lg:col-span-2 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {ramos.map((ramo, idx) => (
              <motion.div
                key={ramo.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <AnimatedCard className={`bg-white border-2 ${
                  ramo.estado === 'sin_evaluaciones' ? 'border-yellow-400' : 'border-gray-200'
                }`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">{ramo.nombre}</h3>
                      <p className="text-sm text-gray-600">{ramo.codigo}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${getColorEstado(ramo.estado)}`}>
                      {ramo.estado.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Profesores */}
                  <div className="mb-4 pb-4 border-b-2 border-gray-100">
                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <FiUsers className="w-4 h-4" /> Profesores
                    </p>
                    {ramo.profesores.length > 0 ? (
                      <div className="space-y-2">
                        {ramo.profesores.map((prof) => (
                          <div key={prof.id} className="text-sm text-gray-600 flex items-center gap-3">
                            <div className="w-2 h-2 bg-blue-600 rounded-full" />
                            <span>{prof.nombre}</span>
                            <span className="ml-auto text-xs text-gray-500">
                              {prof.evaluacionesActivas} evaluaciones
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                        Sin profesores asignados para evaluaciones
                      </p>
                    )}
                  </div>

                  {/* Estadísticas */}
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Evaluaciones</p>
                      <p className="text-lg font-bold text-blue-600">{ramo.evaluacionesTotales}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Alumnos</p>
                      <p className="text-lg font-bold text-green-600">{ramo.alumnosTotales}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Cobertura</p>
                      <p className="text-lg font-bold text-purple-600">
                        {ramo.profesores.length > 0 ? '100%' : '0%'}
                      </p>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-2">
                    {ramo.estado === 'sin_evaluaciones' && (
                      <motion.button
                        onClick={() => actuarComoProfesor(ramo)}
                        className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-semibold transition flex items-center justify-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <FiAlertCircle className="w-4 h-4" /> Crear Evaluación
                      </motion.button>
                    )}
                    <motion.button
                      onClick={() => supervisarRamo(ramo)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <FiSettings className="w-4 h-4" /> Supervisar
                    </motion.button>
                  </div>
                </AnimatedCard>
              </motion.div>
            ))}
          </motion.div>

          {/* Columna Lateral: Actividad Reciente */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
            <AnimatedCard className="bg-white border-2 border-gray-200 sticky top-6">
              <h3 className="font-bold text-lg mb-4">Actividad Reciente</h3>
              <div className="space-y-3">
                {actividadReciente.map((actividad, idx) => (
                  <motion.div
                    key={actividad.id}
                    className="pb-3 border-b-2 border-gray-100 last:border-0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + idx * 0.1 }}
                  >
                    <div className="flex items-start gap-3">
                      {getIconoTipo(actividad.tipo)}
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{actividad.mensaje}</p>
                        <p className="text-xs text-gray-600 mt-1">{actividad.ramo}</p>
                        <p className="text-xs text-gray-500 mt-1">{actividad.hace}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatedCard>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
