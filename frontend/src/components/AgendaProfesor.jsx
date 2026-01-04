// src/components/AgendaProfesor.jsx
import { useState } from 'react';
import { motion } from 'framer-motion';
import CalendarioViewMejorado from './CalendarioViewMejorado';
import CrearEventoForm from './CrearEventoForm';
import GestionarTiposEventos from './GestionarTiposEventos';
import BloquearDiasMejorado from './BloquearDiasMejorado';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';

export default function AgendaProfesor() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const isJefe = user?.role === 'jefecarrera';

  const [vista, setVista] = useState('calendario'); // 'calendario', 'crear', 'tipos', 'bloqueos'
  const [eventoEnEdicion, setEventoEnEdicion] = useState(null);

  const abrirEdicionEvento = (evento) => {
    setEventoEnEdicion(evento);
    setVista('crear');
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 ${isNavbarOpen ? 'md:ml-0' : 'ml-0'}`}>
      {/* Contenido principal */}
      <div className={`max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-8 transition-all duration-300`}>
        {/* Pestañas superiores mejoradas */}
        <motion.div 
          className="flex flex-wrap gap-2 mb-6 sm:mb-8 justify-start overflow-x-auto pb-3 sm:pb-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.button
            onClick={() => setVista('calendario')}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition shadow-md whitespace-nowrap text-xs sm:text-base ${
              vista === 'calendario'
                ? 'bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="hidden sm:inline">📅 Calendario</span>
            <span className="sm:hidden">📅</span>
          </motion.button>

          <motion.button
            onClick={() => setVista('crear')}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition shadow-md whitespace-nowrap text-xs sm:text-base ${
              vista === 'crear'
                ? 'bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="hidden sm:inline">➕ Nueva Evaluación</span>
            <span className="sm:hidden">➕</span>
          </motion.button>

          <motion.button
            onClick={() => setVista('tipos')}
            className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition shadow-md whitespace-nowrap text-xs sm:text-base ${
              vista === 'tipos'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="hidden sm:inline">🎨 Tipos de Evento</span>
            <span className="sm:hidden">🎨</span>
          </motion.button>

          {/* Bloquear Días - solo jefe */}
          {isJefe && (
            <motion.button
              onClick={() => setVista('bloqueos')}
              className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold transition shadow-md whitespace-nowrap text-xs sm:text-base ${
                vista === 'bloqueos'
                  ? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="hidden sm:inline">🚫 Bloquear Días</span>
              <span className="sm:hidden">🚫</span>
            </motion.button>
          )}
        </motion.div>

        {/* Contenido principal */}
        <motion.div
          className="min-h-screen"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {vista === 'calendario' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
              <CalendarioViewMejorado onEditarEvento={abrirEdicionEvento} />
            </div>
          )}
          {vista === 'crear' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
              <CrearEventoForm 
                evento={eventoEnEdicion} 
                onSaved={() => { 
                  setEventoEnEdicion(null); 
                  setVista('calendario'); 
                }} 
              />
            </div>
          )}
          {vista === 'tipos' && (
            <GestionarTiposEventos />
          )}
          {vista === 'bloqueos' && isJefe && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6 md:p-8">
              <BloquearDiasMejorado />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}