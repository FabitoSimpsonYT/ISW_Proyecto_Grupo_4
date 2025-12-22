import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';

const Home = () => {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();

  // Obtener el usuario del localStorage si no está en el contexto
  const userData = user || JSON.parse(localStorage.getItem('user') || '{}');

  // Detectar género por el primer nombre (si termina en 'a' es femenino)
  const primerNombre = userData.nombres?.split(' ')[0] || '';
  const esFemenino = primerNombre.toLowerCase().endsWith('a');
  const saludo = esFemenino ? '¡Bienvenida!' : '¡Bienvenido!';

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4a6b] to-[#1e3a5f] flex items-center justify-center p-4 transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
      <div className="bg-white rounded-3xl shadow-2xl p-12 max-w-2xl w-full transform transition-all">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#1e3a5f] to-[#4a7ba7] mb-4">
            {saludo}
          </h1>
          
          <p className="text-2xl text-gray-700 font-semibold mb-8">
            {userData.nombres} {userData.apellidoPaterno}
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
