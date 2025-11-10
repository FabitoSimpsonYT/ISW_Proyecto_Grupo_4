import { useState } from "react";
import { getProfile } from "../services/profile.service.js";
import { createPauta } from "../services/pauta.service.js";
import { useAuth } from "../context/AuthContext.jsx";
import Navbar from "../components/Navbar.jsx";

const Home = () => {
  const [profileData, setProfileData] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [criterios, setCriterios] = useState("");
  const [distribucion, setDistribucion] = useState("");
  const [publicada, setPublicada] = useState(false);
  const [pautaResult, setPautaResult] = useState(null);

  const { user } = useAuth();

  /** Obtener perfil */
  const handleGetProfile = async () => {
    try {
      const res = await getProfile();

      if (res && (res.status === "Success" || res.data)) {
        const payload = res.data || res;
        const userData = payload.userData || payload.user || payload;
        setProfileData({ message: res.message, user: userData });
      } else {
        setProfileData({ error: res.message || "No se pudo obtener el perfil" });
      }
    } catch (error) {
      console.error("Error al obtener perfil:", error);
      setProfileData({ error: "Error al obtener perfil" });
    }
  };

  /**  Crear pauta */
  const handleCrearPauta = async (e) => {
    e.preventDefault();
    setPautaResult(null);

    try {
      let distribucionParsed = distribucion;

      try {
        distribucionParsed = JSON.parse(distribucion);
      } catch (_) {}

      const payload = {
        criterios,
        distribucionPuntaje: distribucionParsed,
        publicada,
      };

      const res = await createPauta(payload);

      if (res && (res.status === "Success" || res.data)) {
        setPautaResult({ success: true, data: res.data || res });
        setCriterios("");
        setDistribucion("");
        setPublicada(false);
      } else {
        setPautaResult({
          success: false,
          message: res.message || "Error al crear pauta",
        });
      }
    } catch (error) {
      console.error("Error crear pauta:", error);
      setPautaResult({
        success: false,
        message: error?.message || "Error al crear pauta",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">

      {/*  NAVBAR arriba de todo */}
      <Navbar
        onCrearPauta={() => setShowForm((prev) => !prev)}
        onVerPerfil={handleGetProfile}
      />

      <div className="flex flex-col justify-center items-center py-10 px-4 gap-6">
        <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* --- Tarjeta Perfil --- */}
          <div className="bg-white rounded-xl shadow-xl p-4 relative">
            <h2 className="text-2xl font-bold text-gray-900">
              Perfil del Usuario
            </h2>

            {profileData && (
              <div className="mt-4 bg-gray-50 p-4 rounded-lg border text-sm">
                {profileData.error ? (
                  <p className="text-red-600 font-semibold">{profileData.error}</p>
                ) : (
                  <>
                    <p className="font-semibold text-gray-700">{profileData.message}</p>
                    <pre className="text-xs text-gray-700 overflow-auto mt-2">
                      {JSON.stringify(profileData.user, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}
          </div>

          {/* --- Tarjeta Crear pauta (solo profesor) --- */}
          {user && user.role === "profesor" ? (
            <div className="bg-white rounded-xl shadow-xl p-4 relative">

              <h2 className="text-2xl font-bold text-gray-900">
                Gestión de Pautas
              </h2>

              {showForm && (
                <form
                  onSubmit={handleCrearPauta}
                  className="space-y-3 bg-gray-50 rounded-lg p-4 border border-gray-200 mt-4"
                >
                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Criterios
                    </label>
                    <input
                      value={criterios}
                      onChange={(e) => setCriterios(e.target.value)}
                      required
                      className="w-full mt-1 p-2 border rounded text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700">
                      Distribución puntaje (JSON)
                    </label>
                    <textarea
                      value={distribucion}
                      onChange={(e) => setDistribucion(e.target.value)}
                      placeholder='{"item1":3,"item2":7}'
                      className="w-full mt-1 p-2 border rounded h-24 text-sm"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={publicada}
                      onChange={(e) => setPublicada(e.target.checked)}
                    />
                    Publicada
                  </label>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 text-sm"
                  >
                    Enviar
                  </button>

                  {pautaResult && (
                    <div
                      className={`mt-2 p-2 rounded text-sm ${
                        pautaResult.success
                          ? "bg-green-50 border border-green-200"
                          : "bg-red-50 border border-red-200"
                      }`}
                    >
                      {pautaResult.success ? (
                        <>
                          <p className="font-semibold text-green-700">
                             Pauta creada exitosamente
                          </p>
                          <pre className="text-xs mt-1">
                            {JSON.stringify(pautaResult.data, null, 2)}
                          </pre>
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
            <p className="text-sm text-center text-gray-600">
              Solo profesores pueden crear pautas.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
