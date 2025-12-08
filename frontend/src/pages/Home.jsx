import { useState } from 'react';
import { getProfile } from '../services/profile.service.js';
import Navbar from '../components/Navbar.jsx';

const Home = () => {
  const [profileData, setProfileData] = useState(null);

  const handleGetProfile = async () => {
    console.log('Obtener perfil');

    try {
      const data = await getProfile();   // 👈 LLAMA AL SERVICIO
      console.log("Perfil recibido:", data);

      setProfileData(data);              // 👈 LO MUESTRA EN PANTALLA
    } catch (error) {
      console.error("Error al obtener el perfil:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex">

      {/* NAVBAR LATERAL IZQUIERDA */}
      <Navbar 
        onCrearPauta={() => console.log("Crear pauta")}
        onVerPerfil={() => console.log("Ver perfil")}
        onApelaciones={() => navigate("/apelaciones")}
      />

      {/* CONTENIDO PRINCIPAL */}
      <div className="flex-1 ml-64">
        <div className="flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 w-full max-w-2xl transform transition-all hover:scale-105">

            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
              Página de Inicio
            </h1>

            <button 
              onClick={handleGetProfile} 
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-purple-300"
            >
              Obtener Perfil
            </button>

            {profileData && (
              <div className="mt-8 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <pre className="text-sm text-gray-700 overflow-auto">
                  {JSON.stringify(profileData, null, 2)}
                </pre>
              </div>
            )}

          </div>
        </div>
      </div>

    </div>
  );
};

export default Home;
