import { useState } from 'react';
import { getProfile } from '../services/profile.service.js';
import { createPauta } from '../services/pauta.service.js';
import { useAuth } from '../context/AuthContext.jsx';

const Home = () => {
  const [profileData, setProfileData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [criterios, setCriterios] = useState('');
  const [distribucion, setDistribucion] = useState('');
  const [publicada, setPublicada] = useState(false);
  const [evaluacionId, setEvaluacionId] = useState('');
  const [pautaResult, setPautaResult] = useState(null);
  const { user } = useAuth();

  const handleGetProfile = async () => {
    try {
      const res = await getProfile();
      // res tiene la forma { message, data, status }
      if (res && (res.status === 'Success' || res.data)) {
        // la API retorna en data el objeto con message y userData
        const payload = res.data || res;
        // si existe userData dentro de data
        const user = payload.userData || payload.user || payload;
        setProfileData({ message: res.message, user });
      } else {
        setProfileData({ error: res.message || 'No se pudo obtener el perfil' });
      }
    } catch (error) {
      console.error('Error al obtener perfil:', error);
      setProfileData({ error: 'Error al obtener perfil' });
    }
  };

  const handleCrearPauta = async (e) => {
    e.preventDefault();
    setPautaResult(null);
    try {
      // intentar parsear distribucion a JSON si viene como texto
      let distribucionParsed = distribucion;
      try {
        distribucionParsed = JSON.parse(distribucion);
      } catch (err) {
        // si falla, dejar tal cual (el backend espera json en este campo)
      }

      const payload = {
        criterios,
        distribucionPuntaje: distribucionParsed,
        publicada,
      };

      // si se entregó evaluacionId, agregarlo en la ruta será manejado por el servicio
      const res = await createPauta(payload);
      if (res && (res.status === 'Success' || res.data)) {
        setPautaResult({ success: true, data: res.data || res });
        // limpiar formulario
        setCriterios('');
        setDistribucion('');
        setPublicada(false);
        setEvaluacionId('');
      } else {
        setPautaResult({ success: false, message: res.message || 'Error al crear pauta' });
      }
    } catch (error) {
      console.error('Error crear pauta:', error);
      setPautaResult({ success: false, message: error?.message || 'Error al crear pauta' });
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 flex items-center justify-center p-4">
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
            {profileData.error ? (
              <p className="text-red-600 font-semibold">{profileData.error}</p>
            ) : (
              <>
                <p className="font-semibold text-gray-700">{profileData.message}</p>
                <pre className="text-sm text-gray-700 overflow-auto mt-4">{JSON.stringify(profileData.user, null, 2)}</pre>
              </>
            )}
          </div>
        )}
        {/* Crear pauta (solo profesores) */}
        {user && user.role === 'profesor' ? (
          <div className="mt-8">
            <button
              onClick={() => setShowForm((s) => !s)}
              className="w-full mb-4 bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg"
            >
              {showForm ? 'Ocultar formulario crear pauta' : 'Crear nueva pauta'}
            </button>

            {showForm && (
              <form onSubmit={handleCrearPauta} className="space-y-4 bg-gray-50 rounded-xl p-6 border border-gray-200">
                <div>
                  <label className="block text-sm font-semibold text-gray-700">Criterios</label>
                  <input value={criterios} onChange={(e) => setCriterios(e.target.value)} required className="w-full mt-2 p-2 border rounded" />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700">Distribución puntaje (JSON)</label>
                  <textarea value={distribucion} onChange={(e) => setDistribucion(e.target.value)} placeholder='e.g. {"item1":3,"item2":7}' className="w-full mt-2 p-2 border rounded h-28" />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={publicada} onChange={(e) => setPublicada(e.target.checked)} />
                    <span className="text-sm">Publicada</span>
                  </label>
                  <input value={evaluacionId} onChange={(e) => setEvaluacionId(e.target.value)} placeholder="Evaluación ID (opcional)" className="ml-auto p-2 border rounded" />
                </div>

                <div className="flex gap-4">
                  <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded">Enviar</button>
                  <button type="button" onClick={() => { setShowForm(false); setPautaResult(null); }} className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 rounded">Cancelar</button>
                </div>

                {pautaResult && (
                  <div className={`mt-4 p-3 rounded ${pautaResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                    {pautaResult.success ? (
                      <>
                        <p className="font-semibold text-green-700">Pauta creada exitosamente</p>
                        <pre className="text-sm text-gray-700 mt-2">{JSON.stringify(pautaResult.data, null, 2)}</pre>
                      </>
                    ) : (
                      <p className="text-red-700 font-semibold">{pautaResult.message}</p>
                    )}
                  </div>
                )}
              </form>
            )}
          </div>
        ) : (
          <p className="mt-6 text-sm text-gray-600">Solo profesores pueden crear pautas.</p>
        )}
      </div>
    </div>
  );
};

export default Home;
