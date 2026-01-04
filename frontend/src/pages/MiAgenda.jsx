// src/pages/MiAgenda.jsx
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { motion } from 'framer-motion';
import AgendaProfesor from '../components/AgendaProfesor';
import GestorRamosJefe from '../components/GestorRamosJefe';
import CalendarioAlumnoMejorado from '../components/CalendarioAlumnoMejorado';

export default function MiAgenda() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const userRole = user?.role;
  const [modoJefe, setModoJefe] = useState('evaluaciones'); // evaluaciones | gestionar-ramos

  console.log('📋 Usuario actual:', { user, userRole });

  const esProfesor = userRole === 'profesor';
  const esJefeCarrera = userRole === 'jefecarrera';
  const esAlumno = userRole === 'alumno';

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isNavbarOpen ? 'ml-0 sm:ml-64' : 'ml-0'}`}>
      <header className="bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8c] text-white shadow-lg">
        <div className="px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                {esProfesor ? '👨‍🏫 Gestión de Evaluaciones' : 
                 esJefeCarrera ? '🎓 Panel de Coordinación' : 
                 '👨‍🎓 Mis Evaluaciones'}
              </h1>
              <p className="text-xs sm:text-sm text-gray-300 truncate">{user?.email || 'Usuario'}</p>
            </div>

            {/* Selector de modo para jefe carrera */}
            {esJefeCarrera && (
              <motion.div 
                className="flex gap-1 sm:gap-2 bg-blue-900 rounded-lg p-1 w-full sm:w-auto flex-shrink-0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <motion.button
                  onClick={() => setModoJefe('evaluaciones')}
                  className={`px-2 sm:px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition ${
                    modoJefe === 'evaluaciones'
                      ? 'bg-blue-500 text-white'
                      : 'bg-transparent text-gray-300 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Profesor
                </motion.button>
                <motion.button
                  onClick={() => setModoJefe('gestionar-ramos')}
                  className={`px-2 sm:px-4 py-2 rounded-md font-semibold text-xs sm:text-sm transition ${
                    modoJefe === 'gestionar-ramos'
                      ? 'bg-blue-500 text-white'
                      : 'bg-transparent text-gray-300 hover:text-white'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Ramos
                </motion.button>
              </motion.div>
            )}
          </div>
        </div>
      </header>

      <div className="px-3 sm:px-4">
        {/* Modo Profesor */}
        {esProfesor && <AgendaProfesor />}

        {/* Modo Jefe Carrera */}
        {esJefeCarrera && (
          <>
            {modoJefe === 'evaluaciones' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <AgendaProfesor />
              </motion.div>
            )}

            {modoJefe === 'gestionar-ramos' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GestorRamosJefe jefeId={user?.id} />
              </motion.div>
            )}
          </>
        )}

        {/* Modo Alumno */}
        {esAlumno && <CalendarioAlumnoMejorado usuarioId={user?.id} />}
      </div>
    </div>
  );
}