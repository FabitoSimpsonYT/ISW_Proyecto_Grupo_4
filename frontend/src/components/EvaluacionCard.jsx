import { motion } from 'framer-motion';
import { FiCalendar, FiClock, FiMapPin, FiUsers, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

export const EvaluacionCard = ({ evento, onInscribir }) => {
  const estado = evento.cupo_disponible > 0 ? 'available' : 'full';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)' }}
      className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100"
    >
      {/* Header con gradiente */}
      <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-500" />
      
      <div className="p-6">
        {/* Título */}
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-800 flex-1">{evento.nombre || evento.titulo}</h3>
          <motion.div
            className={`px-3 py-1 rounded-full text-sm font-semibold ${
              estado === 'available'
                ? 'bg-green-100 text-green-700 flex items-center gap-1'
                : 'bg-red-100 text-red-700 flex items-center gap-1'
            }`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {estado === 'available' ? (
              <>
                <FiCheckCircle className="w-4 h-4" />
                Disponible
              </>
            ) : (
              <>
                <FiAlertCircle className="w-4 h-4" />
                Lleno
              </>
            )}
          </motion.div>
        </div>

        {/* Descripción */}
        {evento.descripcion && (
          <p className="text-gray-600 text-sm mb-4 italic">{evento.descripcion}</p>
        )}

        {/* Información en grid */}
        <div className="grid grid-cols-2 gap-4 mb-4 py-4 border-y border-gray-100">
          {evento.fecha_inicio && (
            <div className="flex items-center gap-3">
              <FiCalendar className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Fecha</p>
                <p className="text-sm font-semibold text-gray-800">
                  {new Date(evento.fecha_inicio).toLocaleDateString('es-CL')}
                </p>
              </div>
            </div>
          )}
          
          {evento.duracion_por_alumno && (
            <div className="flex items-center gap-3">
              <FiClock className="w-5 h-5 text-orange-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Duración</p>
                <p className="text-sm font-semibold text-gray-800">{evento.duracion_por_alumno} min</p>
              </div>
            </div>
          )}

          {evento.sala && (
            <div className="flex items-center gap-3">
              <FiMapPin className="w-5 h-5 text-red-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Ubicación</p>
                <p className="text-sm font-semibold text-gray-800">{evento.sala}</p>
              </div>
            </div>
          )}

          {evento.cupo_disponible !== undefined && (
            <div className="flex items-center gap-3">
              <FiUsers className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="text-xs text-gray-500">Cupos</p>
                <p className="text-sm font-semibold text-gray-800">{evento.cupo_disponible}</p>
              </div>
            </div>
          )}
        </div>

        {/* Botón de inscripción */}
        <motion.button
          onClick={() => {
            if (estado === 'available') {
              onInscribir(evento);
            } else {
              toast.error('No hay cupos disponibles');
            }
          }}
          disabled={estado === 'full'}
          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            estado === 'available'
              ? 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white'
              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
          }`}
          whileHover={estado === 'available' ? { scale: 1.02 } : {}}
          whileTap={estado === 'available' ? { scale: 0.98 } : {}}
        >
          {estado === 'available' ? 'Inscribirse' : 'Lleno'}
        </motion.button>
      </div>
    </motion.div>
  );
};

export default EvaluacionCard;
