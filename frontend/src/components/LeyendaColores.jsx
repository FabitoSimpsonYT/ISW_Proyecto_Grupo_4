// src/components/LeyendaColores.jsx
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { getTiposEventos } from '../services/tipoEvento.service';
import { updateDynamicColorMap } from '../utils/colorMap';

export default function LeyendaColores() {
  const [tiposEventos, setTiposEventos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargarTipos = async () => {
      try {
        setLoading(true);
        const tipos = await getTiposEventos();
        console.log('✅ Tipos de eventos cargados:', tipos);
        const tiposArray = Array.isArray(tipos) ? tipos : [];
        setTiposEventos(tiposArray);
        // Actualizar el mapa de colores dinámico
        updateDynamicColorMap(tiposArray);
      } catch (err) {
        console.error('❌ Error cargando tipos:', err);
        setTiposEventos([]);
      } finally {
        setLoading(false);
      }
    };

    cargarTipos();
  }, []);

  const leyendaAdicional = [
    { nombre: 'Día Bloqueado', color: '#ef4444', emoji: '🚫' },
    { nombre: 'Hoy', color: '#06f0ff', emoji: '📌' },
  ];

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100 p-4 sm:p-6 mb-6"
      >
        <p className="text-center text-gray-600">Cargando leyenda...</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border-2 border-blue-100 p-4 sm:p-6 mb-6"
    >
      <h3 className="text-base sm:text-lg font-bold text-[#0E2C66] mb-3 sm:mb-4 flex items-center gap-2">
        🎨 Leyenda de Colores
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3">
        {/* Tipos de eventos dinámicos */}
        {tiposEventos.map((tipo, idx) => {
          // Usar el color directamente del tipo de evento
          const bgColor = tipo.color || '#3b82f6';
          return (
            <motion.div
              key={`tipo-${idx}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center gap-2 p-2 sm:p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-gray-300"
                style={{ backgroundColor: bgColor }}
              ></div>
              <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{tipo.nombre}</span>
            </motion.div>
          );
        })}

        {/* Elementos adicionales */}
        {leyendaAdicional.map((item, idx) => (
          <motion.div
            key={`adicional-${idx}`}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: (tiposEventos.length + idx) * 0.05 }}
            className="flex items-center gap-2 p-2 sm:p-3 bg-white rounded-lg border border-gray-200 hover:shadow-md transition"
          >
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 border-2 border-gray-300"
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">{item.nombre}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
