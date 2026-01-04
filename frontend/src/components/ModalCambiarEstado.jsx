import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { FiX, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import ToastNotificationService from '../services/toastNotification.service';

const API_BASE = 'http://localhost:3000/api';

export default function ModalCambiarEstado({ isOpen, onClose, evaluacion, onEstadoActualizado }) {
  const [estado, setEstado] = useState('confirmado');
  const [motivo, setMotivo] = useState('');
  const [loading, setLoading] = useState(false);

  const estados = [
    { value: 'confirmado', label: 'Confirmado', color: 'bg-green-100 text-green-700', requiereMotivo: false },
    { value: 'cancelado', label: 'Cancelado', color: 'bg-red-100 text-red-700', requiereMotivo: true },
    { value: 'reagendar', label: 'Reagendar', color: 'bg-yellow-100 text-yellow-700', requiereMotivo: false },
    { value: 'pendiente', label: 'Pendiente', color: 'bg-gray-100 text-gray-700', requiereMotivo: false },
  ];

  const estadoSeleccionado = estados.find(e => e.value === estado);
  const requiereMotivo = estado === 'cancelado' || estado === 'reagendar';

  const handleCambiar = async () => {
    if (!evaluacion?.id) {
      ToastNotificationService.error('No se especificó la evaluación');
      return;
    }

    if (requiereMotivo && !motivo.trim()) {
      ToastNotificationService.error(`El estado "${estado}" requiere un comentario`);
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${API_BASE}/evaluaciones-estado/${evaluacion.id}/cambiar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          estado,
          motivo_cambio: motivo.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al cambiar estado');
      }

      ToastNotificationService.success('Estado actualizado exitosamente');
      // Disparar evento para que otros componentes se actualicen
      window.dispatchEvent(new Event('estadoEvaluacionActualizado'));
      onEstadoActualizado?.();
      handleClose();
    } catch (error) {
      console.error('Error:', error);
      ToastNotificationService.error('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEstado('confirmado');
    setMotivo('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Cambiar Estado</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {evaluacion && (
              <p className="text-sm text-gray-600 mb-6 bg-gray-50 p-3 rounded-lg">
                <strong>{evaluacion.titulo}</strong> - {evaluacion.ramo?.nombre || 'Sin ramo'}
              </p>
            )}

            {/* Selector de estados */}
            <div className="mb-6">
              <label className="block text-sm font-semibold mb-3">Nuevo Estado</label>
              <div className="space-y-2">
                {estados.map(e => (
                  <label
                    key={e.value}
                    className="flex items-center p-3 border-2 rounded-lg cursor-pointer transition"
                    style={{
                      borderColor: e.value === estado ? '#0E2C66' : '#e5e7eb',
                      backgroundColor: e.value === estado ? '#0E2C66/5' : 'transparent',
                    }}
                  >
                    <input
                      type="radio"
                      name="estado"
                      value={e.value}
                      checked={estado === e.value}
                      onChange={(ev) => setEstado(ev.target.value)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded-full border-2 border-gray-400 mr-3 flex items-center justify-center ${e.value === estado ? 'border-[#0E2C66] bg-[#0E2C66]' : ''}`}>
                      {e.value === estado && <div className="w-2 h-2 bg-white rounded-full" />}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-semibold ${e.color}`}>
                      {e.label}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Campo de comentario si es necesario */}
            {requiereMotivo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <label className="block text-sm font-semibold mb-2 flex items-center gap-2">
                  <FiAlertCircle className="w-4 h-4 text-red-600" />
                  Comentario (Obligatorio)
                </label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder={`Explica el motivo de la ${estado === 'cancelado' ? 'cancelación' : 'reagendación'}...`}
                  rows="4"
                  className="w-full px-4 py-3 border-2 border-red-600 rounded-lg focus:border-red-700 focus:outline-none transition resize-none"
                />
                <p className="text-xs text-red-600 mt-1">
                  * Campo requerido para estado {estado === 'cancelado' ? '"Cancelado"' : '"Reagendar"'}
                </p>
              </motion.div>
            )}

            {/* Botones */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCambiar}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-[#0E2C66] text-white font-semibold rounded-lg hover:bg-[#0a1f4d] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    Cambiar
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
