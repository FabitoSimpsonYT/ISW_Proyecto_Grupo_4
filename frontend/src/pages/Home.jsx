import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { useNavigate } from 'react-router-dom';
import { getNotificaciones } from '../services/notificacionuno.service';

const Home = () => {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  // Obtener el usuario del localStorage si no está en el contexto
  const userData = user || JSON.parse(localStorage.getItem('user') || '{}');

  // Saludo inclusivo
  const saludo = '¡Bienvenid@!';
  
  // Nombre con fallback - mostrar primer nombre y apellido paterno
  const nombreMostrar = userData && userData.nombres 
    ? `${userData.nombres.split(' ')[0]} ${userData.apellidoPaterno || ''}`.trim()
    : 'Usuario invitado';

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      try {
        const notificaciones = await getNotificaciones();
        const unread = Array.isArray(notificaciones)
          ? notificaciones.filter((n) => n && n.leido === false).length
          : 0;
        if (isMounted) setUnreadCount(unread);
      } catch (e) {
        if (isMounted) setUnreadCount(0);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  const BellIcon = ({ className = '' }) => (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm6-6V11a6 6 0 0 0-5-5.9V4a1 1 0 0 0-2 0v1.1A6 6 0 0 0 6 11v5l-2 2v1h16v-1l-2-2Z"
        fill="currentColor"
      />
    </svg>
  );

  return (
    <div className={`relative min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4a6b] to-[#1e3a5f] flex items-center justify-center p-4 transition-all duration-300 ${isNavbarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
      <button
        type="button"
        onClick={() => navigate('/notificaciones')}
        className="fixed top-4 right-4 z-30 bg-white text-[#0E2C66] rounded-lg shadow-lg p-3 hover:bg-gray-50 transition"
        aria-label="Abrir notificaciones"
        title="Notificaciones"
      >
        <span className="relative block">
          <BellIcon className="w-6 h-6" />
          {unreadCount > 0 && (
            <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 rounded-full bg-red-600 text-white text-xs leading-5 text-center">
              {unreadCount}
            </span>
          )}
        </span>
      </button>

      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full transform transition-all">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] to-[#4a7ba7] mb-4">
            {saludo}
          </h1>
          
          <p className="text-2xl text-gray-700 font-semibold mb-8">
            {nombreMostrar}
          </p>

          <p className="text-gray-600 text-lg">
            Utiliza el menú lateral para acceder a las diferentes funcionalidades de la plataforma
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;