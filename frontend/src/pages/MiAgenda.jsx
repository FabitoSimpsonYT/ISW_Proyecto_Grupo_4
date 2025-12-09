// src/pages/MiAgenda.jsx
import { useAuth } from '../context/AuthContext';
import AgendaProfesor from '../components/AgendaProfesor';
import CalendarioAlumno from '../components/CalendarioAlumno';

export default function MiAgenda() {
  const { user } = useAuth();
  const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}').role;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  console.log('📋 Usuario actual:', { user, userRole });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold">
                {userRole === 'profesor' ? '👨‍🏫 Gestión de Evaluaciones' : '👨‍🎓 Mis Evaluaciones'}
              </h1>
              <p className="text-sm text-gray-300">{user?.email || 'Usuario'}</p>
            </div>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg flex items-center gap-2"
            >
              🚪 Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto">
        {userRole === 'profesor' ? <AgendaProfesor /> : <CalendarioAlumno />}
      </div>

      {/* Indicador funcionalidades */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 text-xs max-w-xs">
        <h4 className="font-bold mb-2">✅ Sistema Completo:</h4>
        <ul className="space-y-1 text-gray-600">
          <li>✅ Crear/Editar/Eliminar eventos</li>
          <li>✅ Slots automáticos</li>
          <li>✅ Inscripción individual/pareja/grupo</li>
          <li>✅ Validación de conflictos</li>
          <li>✅ Sistema de cupos</li>
          <li>✅ Días feriados</li>
          <li>✅ Notificaciones email</li>
          <li>✅ Calendario interactivo</li>
        </ul>
      </div>
    </div>
  );
}