import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiAlertCircle, FiCheckCircle, FiX, FiClock, FiUsers, FiCalendar } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { AnimatedCard } from './AnimationComponents';

/**
 * Validador de conflictos para slots de evaluación
 * Verifica:
 * - Overlaps temporales
 * - Límites de cupo
 * - Restricciones por curso/sección
 * - Ventana de tiempo permitida
 */

export default function ValidadorSlots({ slot, usuarioId, ramoId, seccion, slotActuales = [] }) {
  const [conflictos, setConflictos] = useState([]);
  const [advertencias, setAdvertencias] = useState([]);
  const [esValido, setEsValido] = useState(true);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    validarSlot();
  }, [slot, usuarioId, ramoId, seccion, slotActuales]);

  const validarSlot = async () => {
    setCargando(true);
    const nuevosConflictos = [];
    const nuevasAdvertencias = [];

    try {
      // 1. Validar que el slot no esté lleno
      if (slot.inscriptos >= slot.capacidad) {
        nuevosConflictos.push({
          tipo: 'capacidad',
          mensaje: `Este slot está lleno (${slot.inscriptos}/${slot.capacidad} cupos)`,
          severidad: 'error',
        });
      } else if (slot.inscriptos >= slot.capacidad - 2) {
        nuevasAdvertencias.push({
          tipo: 'capacidad_baja',
          mensaje: `Solo quedan ${slot.capacidad - slot.inscriptos} cupo(s)`,
          severidad: 'warning',
        });
      }

      // 2. Validar sobreposición de horarios
      const horaInicio = new Date(`2000-01-01 ${slot.hora_inicio}`);
      const horaFin = new Date(`2000-01-01 ${slot.hora_fin}`);

      for (const slotExistente of slotActuales) {
        if (slotExistente.id === slot.id) continue; // Ignorar el mismo slot

        const horaInicioExistente = new Date(`2000-01-01 ${slotExistente.hora_inicio}`);
        const horaFinExistente = new Date(`2000-01-01 ${slotExistente.hora_fin}`);

        // Verificar overlap
        if (horaInicio < horaFinExistente && horaFin > horaInicioExistente) {
          nuevosConflictos.push({
            tipo: 'overlap_temporal',
            mensaje: `Conflicto con otro slot: ${slotExistente.hora_inicio} - ${slotExistente.hora_fin}`,
            severidad: 'error',
            detalles: slotExistente,
          });
        }
      }

      // 3. Validar restricciones por curso/sección
      if (slot.seccion && seccion && slot.seccion !== seccion) {
        nuevasAdvertencias.push({
          tipo: 'seccion_diferente',
          mensaje: `Este slot es para la sección ${slot.seccion}, tú estás en ${seccion}`,
          severidad: 'warning',
        });
      }

      // 4. Validar que la fecha sea válida
      const fechaSlot = new Date(slot.fecha);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);

      if (fechaSlot < hoy) {
        nuevosConflictos.push({
          tipo: 'fecha_pasada',
          mensaje: 'No puedes inscribirte en un slot de una fecha pasada',
          severidad: 'error',
        });
      }

      // 5. Validar ventana de tiempo permitida
      const ahora = new Date();
      const diferenciaDias = (fechaSlot - ahora) / (1000 * 60 * 60 * 24);

      if (diferenciaDias < 1) {
        nuevasAdvertencias.push({
          tipo: 'corto_plazo',
          mensaje: 'Este slot es en el corto plazo',
          severidad: 'info',
        });
      }

      if (diferenciaDias > 90) {
        nuevasAdvertencias.push({
          tipo: 'largo_plazo',
          mensaje: 'Este slot es para una fecha lejana',
          severidad: 'info',
        });
      }

      // 6. Validar confirmación (si aplica)
      if (slot.estado !== 'confirmado') {
        nuevasAdvertencias.push({
          tipo: 'estado',
          mensaje: `Este slot está ${slot.estado}. El profesor podría cancelarlo o modificarlo`,
          severidad: 'warning',
        });
      }

    } catch (error) {
      console.error('Error al validar slot:', error);
      nuevosConflictos.push({
        tipo: 'error_validacion',
        mensaje: 'Error al validar el slot',
        severidad: 'error',
      });
    } finally {
      setCargando(false);
      setConflictos(nuevosConflictos);
      setAdvertencias(nuevasAdvertencias);
      setEsValido(nuevosConflictos.length === 0);
    }
  };

  const getIconoBySeveridad = (severidad) => {
    switch (severidad) {
      case 'error':
        return <FiX className="text-red-600 w-5 h-5" />;
      case 'warning':
        return <FiAlertCircle className="text-yellow-600 w-5 h-5" />;
      default:
        return <FiCheckCircle className="text-blue-600 w-5 h-5" />;
    }
  };

  const getColorBySeveridad = (severidad) => {
    switch (severidad) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <motion.div className="space-y-4" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      {/* Resumen del Slot */}
      <AnimatedCard className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3">
            <FiCalendar className="text-blue-600 w-5 h-5" />
            <div className="text-sm">
              <p className="text-gray-600">Fecha</p>
              <p className="font-bold">{new Date(slot.fecha).toLocaleDateString('es-ES')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiClock className="text-blue-600 w-5 h-5" />
            <div className="text-sm">
              <p className="text-gray-600">Hora</p>
              <p className="font-bold">{slot.hora_inicio} - {slot.hora_fin}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <FiUsers className="text-blue-600 w-5 h-5" />
            <div className="text-sm">
              <p className="text-gray-600">Cupos</p>
              <p className="font-bold">{slot.capacidad - slot.inscriptos}/{slot.capacidad}</p>
            </div>
          </div>
          <div className="text-sm">
            <p className="text-gray-600">Estado</p>
            <p className="font-bold">
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                slot.estado === 'confirmado' ? 'bg-green-200 text-green-800' :
                slot.estado === 'tentativo' ? 'bg-yellow-200 text-yellow-800' :
                'bg-red-200 text-red-800'
              }`}>
                {slot.estado}
              </span>
            </p>
          </div>
        </div>
      </AnimatedCard>

      {/* Errores / Conflictos */}
      {conflictos.length > 0 && (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="font-bold text-red-700 flex items-center gap-2">
            <FiAlertCircle /> Conflictos Detectados
          </h3>
          {conflictos.map((conflicto, idx) => (
            <motion.div
              key={idx}
              className={`p-4 rounded-lg border-2 flex items-start gap-3 ${getColorBySeveridad(conflicto.severidad)}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              {getIconoBySeveridad(conflicto.severidad)}
              <div className="flex-1">
                <p className="font-semibold text-sm">{conflicto.mensaje}</p>
                {conflicto.detalles && (
                  <p className="text-xs text-gray-600 mt-1">
                    Conflicto con: {conflicto.detalles.fecha} {conflicto.detalles.hora_inicio}-{conflicto.detalles.hora_fin}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Advertencias */}
      {advertencias.length > 0 && (
        <motion.div className="space-y-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h3 className="font-bold text-yellow-700 flex items-center gap-2">
            <FiAlertCircle /> Advertencias
          </h3>
          {advertencias.map((advertencia, idx) => (
            <motion.div
              key={idx}
              className={`p-4 rounded-lg border-2 flex items-start gap-3 ${getColorBySeveridad(advertencia.severidad)}`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: idx * 0.1 }}
            >
              {getIconoBySeveridad(advertencia.severidad)}
              <p className="font-semibold text-sm flex-1">{advertencia.mensaje}</p>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Validación OK */}
      {esValido && conflictos.length === 0 && (
        <motion.div
          className="p-4 rounded-lg border-2 border-green-200 bg-green-50 flex items-center gap-3"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <FiCheckCircle className="text-green-600 w-5 h-5" />
          <p className="font-semibold text-green-700">¡Todo está correcto! Puedes inscribirte en este slot</p>
        </motion.div>
      )}

      {/* Información: Cargando */}
      {cargando && (
        <motion.div
          className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50 flex items-center gap-3"
          animate={{ opacity: [0.5, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="font-semibold text-blue-700">Validando...</p>
        </motion.div>
      )}
    </motion.div>
  );
}
