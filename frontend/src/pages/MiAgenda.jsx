// src/pages/MiAgenda.jsx
import { useAuth } from '../context/AuthContext';
import AgendaProfesor from '../components/AgendaProfesor';
import CalendarioAlumno from '../components/CalendarioAlumno';

export default function MiAgenda() {
  const { user } = useAuth();
  const userRole = user?.role || JSON.parse(localStorage.getItem('user') || '{}').role;

  console.log('📋 Usuario actual:', { user, userRole });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">
              {userRole === 'profesor' ? '👨‍🏫 Gestión de Evaluaciones' : '👨‍🎓 Mis Evaluaciones'}
            </h1>
            <p className="text-sm text-gray-300">{user?.email || 'Usuario'}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto">
        {userRole === 'profesor' ? <AgendaProfesor /> : <CalendarioAlumno />}
      </div>
    </div>
  );
}