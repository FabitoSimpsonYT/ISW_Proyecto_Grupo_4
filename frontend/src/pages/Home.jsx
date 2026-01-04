import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getNotificaciones } from '../services/notificacionuno.service';
import DashboardProfesor from '../components/DashboardProfesor';

const Home = () => {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);

  // Obtener el usuario del localStorage si no está en el contexto
  const userData = user || JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = userData?.role || 'alumno';

  // Saludo dinámico con hora
  const horaActual = new Date().getHours();
  const saludo = horaActual < 12 ? '¡Buenos días!' : horaActual < 18 ? '¡Buenas tardes!' : '¡Buenas noches!';
  
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
    <>
      {/* Mostrar Dashboard para profesores y jefes de carrera */}
      {(userRole === 'profesor' || userRole === 'jefecarrera') && (
        <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 transition-all duration-300 ${isNavbarOpen ? 'md:ml-64' : 'md:ml-0'}`}>
          {/* Header con bienvenida personalizada mejorada */}
          <motion.div 
            className="bg-gradient-to-r from-[#1e3a5f] via-[#2d5a8c] to-[#1a3f8f] text-white shadow-xl w-full"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="flex-1"
                >
                  <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-3 leading-tight">
                    {saludo}
                  </h1>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-100 mb-4">
                    {nombreMostrar}
                  </h2>
                  <p className="text-blue-200 text-sm sm:text-base max-w-lg">
                    {userRole === 'jefecarrera' 
                      ? '🎓 Coordina tu carrera académica y gestiona todas las evaluaciones'
                      : '📚 Gestiona tus evaluaciones y monitorea el desempeño de tus alumnos'}
                  </p>
                </motion.div>
                <motion.div 
                  className="hidden sm:block text-right"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/20">
                    <p className="text-blue-200 text-sm font-semibold mb-2">Fecha actual</p>
                    <p className="text-white text-lg font-bold">
                      {new Date().toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          <div className="transition-all duration-300">
            <DashboardProfesor />
          </div>
        </div>
      )}

      {/* Mostrar bienvenida para alumnos y otros */}
      {userRole !== 'profesor' && userRole !== 'jefecarrera' && (
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
      )}
    </>
  );
};

export default Home;