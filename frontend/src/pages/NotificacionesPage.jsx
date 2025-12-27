import { useEffect, useState } from "react";
import { getNotificaciones, marcarNotificacionLeida } from "../services/notificacionuno.service";
import { useNavbar } from "../context/NavbarContext";

const NotificacionesPage = () => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isNavbarOpen } = useNavbar();

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const data = await getNotificaciones();
      setNotificaciones(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err?.message || "Error al cargar notificaciones");
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeido = async (id) => {
    try {
      await marcarNotificacionLeida(id);
      setNotificaciones((prev) =>
        prev.map((notif) => (notif.id === id ? { ...notif, leido: true } : notif))
      );
    } catch (err) {
      console.error("Error al marcar como leído:", err);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'} p-8`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-gray-700">Cargando notificaciones...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'} p-8`}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12 text-red-600">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white px-8 py-6 rounded-t-2xl shadow-lg">
          <h1 className="text-3xl font-bold">Notificaciones</h1>
          <p className="text-white/80 mt-1">Revisa tus alertas y novedades</p>
        </div>

        {/* Contenido */}
        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          {notificaciones.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No tienes notificaciones</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-5 rounded-xl border ${
                    notif.leido
                      ? "bg-white border-gray-200"
                      : "bg-blue-50 border-blue-200"
                  } shadow-sm`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800">{notif.titulo}</h3>
                        {!notif.leido && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                            Nueva
                          </span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-2">{notif.mensaje}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {notif.fechaEnvio
                          ? new Date(notif.fechaEnvio).toLocaleString("es-ES")
                          : ""}
                      </p>
                    </div>

                    {!notif.leido && (
                      <button
                        onClick={() => marcarComoLeido(notif.id)}
                        className="px-4 py-2 bg-[#0E2C66] text-white rounded-lg hover:bg-[#1a3f8f] transition text-sm whitespace-nowrap"
                      >
                        Marcar como leído
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificacionesPage;
