import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit2, FiTrash2, FiX, FiCheck } from 'react-icons/fi';
import ToastNotificationService from '../services/toastNotification.service';
import cookies from 'js-cookie';
import { getTiposEventos } from '../services/tipoEvento.service';
import Swal from 'sweetalert2';
import NotificationService from '../services/notification.service';

const API_BASE = 'http://localhost:3000/api';

const COLORES_PREDEFINIDOS = [
  '#FF5733', '#33FF57', '#3357FF', '#FF33F0', '#F0FF33',
  '#33FFF0', '#FF8333', '#33FF8D', '#8333FF', '#FFB533',
];

export default function GestionarTiposEventos() {
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);
  const [formData, setFormData] = useState({ nombre: '', descripcion: '', color: '#4F46E5' });
  const [buscador, setBuscador] = useState('');

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    setCargando(true);
    try {
      const tipos = await getTiposEventos();
      console.log('📚 Tipos cargados desde servicio:', tipos);
      setTipos(Array.isArray(tipos) ? tipos : []);
    } catch (error) {
      console.error('Error:', error);
      ToastNotificationService.error('Error al cargar tipos de eventos');
    } finally {
      setCargando(false);
    }
  };

  const abrirModal = (tipo = null) => {
    if (tipo) {
      setTipoEditando(tipo);
      setFormData({ nombre: tipo.nombre, descripcion: tipo.descripcion || '', color: tipo.color || '#4F46E5' });
    } else {
      setTipoEditando(null);
      setFormData({ nombre: '', descripcion: '', color: '#4F46E5' });
    }
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTipoEditando(null);
    setFormData({ nombre: '', descripcion: '', color: '#4F46E5' });
  };

  const guardar = async () => {
    if (!formData.nombre.trim()) {
      ToastNotificationService.error('El nombre es obligatorio');
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(formData.color)) {
      ToastNotificationService.error('El color debe ser válido');
      return;
    }

    try {
      const token = cookies.get('jwt-auth');
      if (!token) {
        ToastNotificationService.error('Sesión expirada');
        return;
      }

      const url = tipoEditando 
        ? `${API_BASE}/tipos-eventos/${tipoEditando.id}`
        : `${API_BASE}/tipos-eventos`;
      
      const method = tipoEditando ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      ToastNotificationService.success(tipoEditando ? 'Tipo actualizado' : 'Tipo creado');
      NotificationService.success(tipoEditando ? 'Tipo de evento actualizado exitosamente' : 'Tipo de evento creado exitosamente');
      cerrarModal();
      cargarTipos();
    } catch (error) {
      console.error('Error:', error);
      ToastNotificationService.error('Error: ' + error.message);
    }
  };

  const eliminar = async (tipo) => {
    const result = await Swal.fire({
      title: 'Eliminar Tipo de Evento',
      html: `<p style="text-align: left; margin: 10px 0;"><strong>¿Estás seguro de que deseas eliminar este tipo de evento?</strong></p>
             <div style="background-color: #f0f0f0; border-left: 4px solid #667eea; padding: 10px; margin: 10px 0; text-align: left;">
               <p style="margin: 5px 0;"><strong>Nombre:</strong> ${tipo.nombre}</p>
               <p style="margin: 5px 0;"><strong>Descripción:</strong> ${tipo.descripcion || 'N/A'}</p>
               <p style="margin: 5px 0;"><strong>Color:</strong> <span style="display: inline-block; width: 20px; height: 20px; background-color: ${tipo.color}; border-radius: 3px; vertical-align: middle;"></span></p>
             </div>
             <p style="color: #ef4444; margin-top: 10px;"><strong>⚠️ Esta acción no se puede deshacer</strong></p>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true,
    });

    if (!result.isConfirmed) return;

    try {
      const token = cookies.get('jwt-auth');
      const response = await fetch(`${API_BASE}/tipos-eventos/${tipo.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      await Swal.fire({
        title: '¡Eliminado!',
        text: 'El tipo de evento ha sido eliminado correctamente.',
        icon: 'success',
        confirmButtonColor: '#10b981',
      });

      NotificationService.success('Tipo de evento eliminado correctamente');
      cargarTipos();
    } catch (error) {
      console.error('Error:', error);
      NotificationService.error('No se pudo eliminar el tipo de evento');
      await Swal.fire({
        title: 'Error',
        text: 'Error: ' + error.message,
        icon: 'error',
        confirmButtonColor: '#ef4444',
      });
    }
  };

  const tiposFiltrados = tipos.filter(t =>
    t.nombre.toLowerCase().includes(buscador.toLowerCase()) ||
    (t.descripcion && t.descripcion.toLowerCase().includes(buscador.toLowerCase()))
  );

  if (cargando) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando tipos de eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 px-3 sm:px-4 py-4 sm:py-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div className="mb-6 sm:mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">Gestionar Tipos de Eventos</h1>
          <p className="text-xs sm:text-sm text-gray-600">Crea, edita y elimina tipos de eventos para tus evaluaciones</p>
        </motion.div>

        {/* Barra de herramientas */}
        <motion.div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-4 sm:mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <input
            type="text"
            placeholder="Buscar tipos..."
            value={buscador}
            onChange={(e) => setBuscador(e.target.value)}
            className="flex-1 px-3 sm:px-4 py-2 sm:py-3 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-xs sm:text-sm"
          />
          <motion.button
            onClick={() => abrirModal()}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 whitespace-nowrap text-xs sm:text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <FiPlus /> <span className="hidden sm:inline">Nuevo</span> Tipo
          </motion.button>
        </motion.div>

        {/* Tabla de tipos */}
        <motion.div className="bg-white rounded-xl shadow-lg overflow-hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {tiposFiltrados.length === 0 ? (
            <div className="p-4 sm:p-8 text-center text-gray-500">
              <p className="text-sm sm:text-lg">No hay tipos de eventos {buscador ? 'que coincidan con la búsqueda' : ''}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700">Nombre</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 hidden sm:table-cell">Descripción</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-left font-semibold text-gray-700 hidden md:table-cell">Color</th>
                    <th className="px-3 sm:px-6 py-3 sm:py-4 text-right font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tiposFiltrados.map((tipo, idx) => (
                    <motion.tr
                      key={tipo.id}
                      className="border-b border-gray-200 hover:bg-gray-50 transition"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <td className="px-3 sm:px-6 py-3 sm:py-4 font-semibold text-gray-900">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-6 h-6 rounded border-2 border-gray-300 flex-shrink-0"
                            style={{ backgroundColor: tipo.color || '#4F46E5' }}
                          />
                          <span className="truncate">{tipo.nombre}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-gray-600 hidden sm:table-cell text-xs sm:text-sm truncate">
                        {tipo.descripcion || '—'}
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 hidden md:table-cell">
                        <span className="text-xs text-gray-600 font-mono">{tipo.color}</span>
                      </td>
                      <td className="px-3 sm:px-6 py-3 sm:py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <motion.button
                            onClick={() => abrirModal(tipo)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            title="Editar"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            onClick={() => eliminar(tipo)}
                            className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition flex-shrink-0"
                            whileHover={{ scale: 1.1 }}
                            title="Eliminar"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modalAbierto && (
          <motion.div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl p-4 sm:p-8 max-w-md w-full"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
            >
              <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {tipoEditando ? 'Editar Tipo' : 'Nuevo Tipo'}
                </h2>
                <button onClick={cerrarModal} className="p-1 hover:bg-gray-100 rounded-lg flex-shrink-0">
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none text-xs sm:text-sm"
                    placeholder="Ej: Evaluación Parcial"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-600 focus:outline-none resize-none text-xs sm:text-sm"
                    placeholder="Descripción opcional..."
                    rows="3"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Color</label>
                  <div className="flex gap-2 mb-3 flex-wrap">
                    {COLORES_PREDEFINIDOS.map(color => (
                      <motion.button
                        key={color}
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-7 h-7 sm:w-8 sm:h-8 rounded border-2 transition flex-shrink-0 ${
                          formData.color === color ? 'border-gray-900 ring-2 ring-gray-900' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        whileHover={{ scale: 1.2 }}
                      />
                    ))}
                  </div>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 rounded-lg cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex gap-2 sm:gap-3 mt-4 sm:mt-6">
                <button
                  onClick={cerrarModal}
                  className="flex-1 px-3 sm:px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 text-xs sm:text-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={guardar}
                  className="flex-1 px-3 sm:px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <FiCheck className="w-4 h-4" /> Guardar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
