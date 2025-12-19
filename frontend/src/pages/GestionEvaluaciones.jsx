// src/pages/GestionEvaluacionesPage.jsx
import { useState } from 'react';
import AgendaAlumno from '../components/AgendaAlumno';
import AgendaProfesor from '../components/AgendaProfesor';
import ChatWebSocket from '../components/ChatWebSocket';

export default function GestionEvaluacionesPage() {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [mostrarChat, setMostrarChat] = useState(false);
  const [chatEventoId, setChatEventoId] = useState(null);
  const [chatRamoId, setChatRamoId] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const abrirChat = (eventoId, ramoId) => {
    setChatEventoId(eventoId);
    setChatRamoId(ramoId);
    setMostrarChat(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {user.role === 'profesor' ? '👨‍🏫 Gestión de Evaluaciones - Profesor' : '👨‍🎓 Mi Agenda de Evaluaciones'}
              </h1>
              <p className="text-sm text-gray-300">{user.email}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMostrarChat(!mostrarChat)}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg flex items-center gap-2"
              >
                💬 Chat
                {mostrarChat && <span className="text-xs">(Abierto)</span>}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Agenda Principal */}
          <div className={`${mostrarChat ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {user.role === 'profesor' ? (
              <AgendaProfesor onAbrirChat={abrirChat} />
            ) : (
              <AgendaAlumno onAbrirChat={abrirChat} />
            )}
          </div>

          {/* Chat */}
          {mostrarChat && (
            <div className="lg:col-span-1">
              <div className="sticky top-4">
                {chatEventoId && chatRamoId ? (
                  <ChatWebSocket eventoId={chatEventoId} ramoId={chatRamoId} />
                ) : (
                  <div className="bg-white rounded-lg shadow p-6 text-center">
                    <p className="text-gray-500 mb-4">Selecciona un evento para abrir el chat</p>
                    <button
                      onClick={() => setMostrarChat(false)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cerrar
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Indicador de funcionalidades */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 text-xs max-w-xs">
        <h4 className="font-bold mb-2">✅ Funcionalidades Activas:</h4>
        <ul className="space-y-1 text-gray-600">
          <li>✅ Crear/Editar/Eliminar eventos</li>
          <li>✅ Slots automáticos</li>
          <li>✅ Inscripción individual/pareja/grupo</li>
          <li>✅ Validación de conflictos</li>
          <li>✅ Sistema de cupos</li>
          <li>✅ Días feriados</li>
          <li>✅ Chat WebSocket</li>
          <li>✅ Notificaciones email</li>
          <li>✅ Calendario interactivo</li>
          <li>✅ Autenticación JWT</li>
        </ul>
      </div>
    </div>
  );
}