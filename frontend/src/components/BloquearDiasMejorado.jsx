import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiCalendar, FiTrash2, FiPlus, FiAlertCircle, FiCheckCircle,
  FiX, FiClock, FiEdit2, FiFileText
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { getBloqueos, crearBloqueo, eliminarBloqueo } from '../services/bloqueo.service.js';
import { showSuccessAlertEnhanced, showErrorAlertEnhanced, showConfirmAlertEnhanced } from '../utils/enhancedAlerts';

export default function BloquearDiasMejorado() {
  const [bloqueos, setBloqueos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  const [formData, setFormData] = useState({
    fechaInicio: '',
    fechaFin: '',
    razon: ''
  });

  const [editandoId, setEditandoId] = useState(null);

  useEffect(() => {
    cargarBloqueos();
  }, []);

  const cargarBloqueos = async () => {
    setCargando(true);
    try {
      const res = await getBloqueos();
      setBloqueos(res?.data || res || []);
    } catch (err) {
      console.error('Error:', err);
      toast.error('Error al cargar bloqueos');
      setBloqueos([]);
    } finally {
      setCargando(false);
    }
  };

  const validarFormulario = () => {
    if (!formData.fechaInicio) {
      toast.error('Debes especificar una fecha de inicio');
      return false;
    }
    if (!formData.fechaFin) {
      toast.error('Debes especificar una fecha de fin');
      return false;
    }
    if (!formData.razon.trim()) {
      toast.error('Debes especificar el motivo del bloqueo');
      return false;
    }

    const inicio = new Date(formData.fechaInicio);
    const fin = new Date(formData.fechaFin);

    if (fin < inicio) {
      toast.error('La fecha de fin debe ser posterior o igual a la de inicio');
      return false;
    }

    return true;
  };

  const handleCrear = async (e) => {
    e.preventDefault();
    if (!validarFormulario()) return;

    setCreando(true);
    try {
      await crearBloqueo({
        fechaInicio: formData.fechaInicio,
        fechaFin: formData.fechaFin,
        razon: formData.razon
      });

      showSuccessAlertEnhanced(
        '✅ Bloqueo Creado',
        `<div style="text-align: left;">
          <p style="margin-bottom: 12px;">El período ha sido bloqueado exitosamente.</p>
          <div style="background: #f0f4ff; padding: 12px; border-radius: 6px; border-left: 4px solid #667eea;">
            <p style="margin: 0 0 8px 0; font-weight: bold;">📅 Rango de fechas:</p>
            <p style="margin: 0 0 8px 0; font-size: 14px;">${new Date(formData.fechaInicio).toLocaleDateString('es-ES')} hasta ${new Date(formData.fechaFin).toLocaleDateString('es-ES')}</p>
            <p style="margin: 0 0 8px 0; font-weight: bold;">📌 Motivo:</p>
            <p style="margin: 0; font-size: 14px;">${formData.razon}</p>
          </div>
        </div>`
      );
      
      setFormData({ fechaInicio: '', fechaFin: '', razon: '' });
      setMostrarFormulario(false);
      await cargarBloqueos();
    } catch (err) {
      showErrorAlertEnhanced(
        '❌ Error al Crear Bloqueo',
        `<p>${err.message || 'No se pudo crear el bloqueo. Por favor intenta de nuevo.'}</p>`
      );
    } finally {
      setCreando(false);
    }
  };

  const handleEliminar = async (id, razon, fechaInicio, fechaFin) => {
    const result = await showConfirmAlertEnhanced(
      '⚠️ Eliminar Bloqueo',
      `<div style="text-align: left;">
        <p style="margin-bottom: 12px;">¿Estás seguro de que deseas eliminar este bloqueo? Esta acción no se puede deshacer.</p>
        <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #f59e0b;">
          <p style="margin: 0 0 8px 0; font-weight: bold;">📌 Motivo:</p>
          <p style="margin: 0 0 8px 0; font-size: 14px;">${razon}</p>
          <p style="margin: 0 0 8px 0; font-weight: bold;">📅 Rango:</p>
          <p style="margin: 0; font-size: 14px;">${new Date(fechaInicio).toLocaleDateString('es-ES')} - ${new Date(fechaFin).toLocaleDateString('es-ES')}</p>
        </div>
      </div>`,
      '🗑️ Eliminar',
      'Cancelar'
    );

    if (!result.isConfirmed) return;

    try {
      await eliminarBloqueo(id);
      showSuccessAlertEnhanced(
        '✅ Bloqueo Eliminado',
        '<p>El bloqueo ha sido eliminado exitosamente.</p>'
      );
      await cargarBloqueos();
    } catch (err) {
      showErrorAlertEnhanced(
        '❌ Error al Eliminar',
        `<p>${err.message || 'No se pudo eliminar el bloqueo. Por favor intenta de nuevo.'}</p>`
      );
    }
  };

  const bloqueosFiltrados = bloqueos.filter(b =>
    b.razon.toLowerCase().includes(busqueda.toLowerCase())
  );

  const calcularDias = (inicio, fin) => {
    const start = new Date(inicio);
    const end = new Date(fin);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="mt-4 text-gray-600">Cargando bloqueos...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-3 sm:px-4 py-4 sm:py-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-5xl mx-auto">
        {/* Encabezado */}
        <motion.div className="mb-6 sm:mb-8" initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">🚫 Gestionar Días Bloqueados</h1>
          <p className="text-xs sm:text-sm text-gray-600">Bloquea fechas cuando no haya evaluaciones disponibles</p>
        </motion.div>

        {/* Botón Crear + Búsqueda */}
        <motion.div
          className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col gap-3 sm:gap-4 items-stretch sm:items-center sm:justify-between">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar por motivo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition text-xs sm:text-sm"
              />
            </div>

            {/* Botón Crear */}
            <motion.button
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
              className="px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:shadow-lg transition flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm sm:w-auto w-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiPlus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden sm:inline">Crear</span> Bloqueo
            </motion.button>
          </div>

          {/* Contador */}
          <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600">
            Total de bloqueos: <span className="font-bold text-red-600">{bloqueos.length}</span>
          </p>
        </motion.div>

        {/* Formulario */}
        <AnimatePresence>
          {mostrarFormulario && (
            <motion.div
              className="bg-white rounded-2xl shadow-lg border-2 border-red-200 p-4 sm:p-8 mb-6 sm:mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Nuevo Bloqueo de Días</h2>

              <form onSubmit={handleCrear} className="space-y-4 sm:space-y-6">
                {/* Grid de inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  {/* Fecha Inicio */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition text-xs sm:text-sm"
                      required
                    />
                  </div>

                  {/* Fecha Fin */}
                  <div>
                    <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      Fecha de Fin *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition text-xs sm:text-sm"
                      required
                    />
                  </div>
                </div>

                {/* Duración */}
                {formData.fechaInicio && formData.fechaFin && (
                  <motion.div
                    className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 flex items-center gap-3"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <FiClock className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-gray-700">
                      <span className="font-bold text-blue-600">
                        {calcularDias(formData.fechaInicio, formData.fechaFin)}
                      </span>
                      {' '}día(s) de bloqueo
                    </p>
                  </motion.div>
                )}

                {/* Razón */}
                <div>
                  <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3 flex items-center gap-2">
                    <FiFileText className="w-4 h-4" />
                    Motivo del Bloqueo *
                  </label>
                  <textarea
                    value={formData.razon}
                    onChange={(e) => setFormData({ ...formData, razon: e.target.value })}
                    placeholder="Ej: Vacaciones académicas, Mantenimiento del sistema, etc."
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 rounded-lg border-2 border-gray-300 focus:border-blue-500 focus:outline-none transition resize-none text-xs sm:text-sm"
                    rows="3"
                    maxLength="200"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">{formData.razon.length}/200 caracteres</p>
                </div>

                {/* Botones */}
                <div className="flex gap-2 sm:gap-4 pt-4">
                  <motion.button
                    type="submit"
                    disabled={creando}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg font-bold hover:shadow-lg disabled:opacity-50 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    {creando ? 'Creando...' : 'Crear'}
                  </motion.button>
                  <motion.button
                    type="button"
                    onClick={() => {
                      setMostrarFormulario(false);
                      setFormData({ fechaInicio: '', fechaFin: '', razon: '' });
                    }}
                    className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition flex items-center justify-center gap-2 text-xs sm:text-sm"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <FiX className="w-4 h-4" />
                    Cancelar
                  </motion.button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lista de Bloqueos */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 sm:space-y-4"
        >
          <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">Bloqueos Activos ({bloqueosFiltrados.length})</h2>

          <AnimatePresence mode="wait">
            {bloqueosFiltrados.length > 0 ? (
              bloqueosFiltrados.map((bloqueo, idx) => {
                const inicio = new Date(bloqueo.fechaInicio);
                const fin = new Date(bloqueo.fechaFin);
                const dias = calcularDias(bloqueo.fechaInicio, bloqueo.fechaFin);

                return (
                  <motion.div
                    key={bloqueo.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: idx * 0.05 }}
                    whileHover={{ x: 8 }}
                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition border-l-4 border-red-600 p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-3 break-words">{bloqueo.razon}</h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 text-xs sm:text-sm">
                          <div>
                            <p className="text-gray-600 text-xs font-semibold">Desde</p>
                            <p className="text-gray-900 font-bold">
                              {inicio.toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs font-semibold">Hasta</p>
                            <p className="text-gray-900 font-bold">
                              {fin.toLocaleDateString('es-ES')}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600 text-xs font-semibold">Duración</p>
                            <motion.p
                              className="text-red-600 font-bold"
                              initial={{ scale: 0.8 }}
                              animate={{ scale: 1 }}
                            >
                              {dias} día(s)
                            </motion.p>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        onClick={() => handleEliminar(bloqueo.id, bloqueo.razon, bloqueo.fecha_inicio, bloqueo.fecha_fin)}
                        className="px-3 sm:px-4 py-2 bg-red-100 text-red-700 rounded-lg font-bold hover:bg-red-200 transition flex items-center justify-center gap-2 flex-shrink-0 text-xs sm:text-sm w-full sm:w-auto whitespace-nowrap"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Eliminar</span>
                      </motion.button>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div
                className="text-center py-8 sm:py-12 bg-white rounded-2xl border-2 border-gray-200"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <FiAlertCircle className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
                <h3 className="text-base sm:text-lg font-bold text-gray-600 mb-2">No hay bloqueos</h3>
                <p className="text-xs sm:text-sm text-gray-500">
                  {bloqueos.length === 0 ? 'Crea tu primer bloqueo de días' : 'No coinciden con tu búsqueda'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
