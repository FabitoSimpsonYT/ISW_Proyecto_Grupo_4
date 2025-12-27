// src/components/AgendaProfesor.jsx
import { useState } from 'react';
import CalendarioView from './CalendarioView';
import CrearEventoForm from './CrearEventoForm';
import GestionTiposEventos from './GestionTiposEventos';
import BloquearDias from './BloquearDias';
import GestionarSlots from './GestionarSlots'; // ← NUEVA IMPORTACIÓN
import { useAuth } from '../context/AuthContext';

export default function AgendaProfesor() {
  const { user } = useAuth();
  const isJefe = user?.role === 'jefecarrera' || user?.role === 'jefe_carrera';

  const [vista, setVista] = useState('calendario'); // 'calendario', 'crear', 'tipos', 'bloqueos', 'slots'
  const [eventoEnEdicion, setEventoEnEdicion] = useState(null);

  const abrirEdicionEvento = (evento) => {
    setEventoEnEdicion(evento);
    setVista('crear');
  };

  return (
    <div className="p-8">
      {/* Pestañas superiores - EXACTAMENTE como en tu captura + nuevas sutiles */}
      <div className="flex flex-wrap gap-4 mb-8 justify-start">
        <button
          onClick={() => setVista('calendario')}
          className={`px-8 py-3 rounded-lg font-medium transition shadow-md ${
            vista === 'calendario'
              ? 'bg-[#0E2C66] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📅 Mi Calendario
        </button>
        <button
          onClick={() => setVista('crear')}
          className={`px-8 py-3 rounded-lg font-medium transition shadow-md ${
            vista === 'crear'
              ? 'bg-[#0E2C66] text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ➕ Crear Evento
        </button>

        {/* Pestaña Tipos de Evento */}
        <button
          onClick={() => setVista('tipos')}
          className="px-8 py-3 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 font-medium shadow-md"
        >
          🎨 Tipos de Evento
        </button>

        {/* NUEVA PESTAÑA: Gestionar Slots - para profesor y jefe */}
        <button
          onClick={() => setVista('slots')}
          className="px-8 py-3 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 font-medium shadow-md"
        >
          🕐 Gestionar Slots
        </button>

        {/* Bloquear Días - solo jefe */}
        {isJefe && (
          <button
            onClick={() => setVista('bloqueos')}
            className="px-8 py-3 rounded-lg bg-orange-100 text-orange-800 hover:bg-orange-200 font-medium shadow-md"
          >
            🚫 Bloquear Días
          </button>
        )}
      </div>

      {/* Contenido principal */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 min-h-screen">
        {vista === 'calendario' && <CalendarioView onEditarEvento={abrirEdicionEvento} />}
        {vista === 'crear' && <CrearEventoForm evento={eventoEnEdicion} onSaved={() => { setEventoEnEdicion(null); setVista('calendario'); }} />}
        {vista === 'tipos' && <GestionTiposEventos />}
        {vista === 'slots' && <GestionarSlots />} {/* ← NUEVA VISTA */}
        {vista === 'bloqueos' && isJefe && <BloquearDias />}
      </div>
    </div>
  );
}