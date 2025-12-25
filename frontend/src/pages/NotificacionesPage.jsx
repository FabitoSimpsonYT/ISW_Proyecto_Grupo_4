import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";

const NotificacionesPage = () => {
  const { user } = useAuth();
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchNotificaciones();
  }, []);

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:3000/api/notificaciones", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al cargar notificaciones");
      }

      const data = await response.json();
      setNotificaciones(data);
    } catch (err) {
      console.error("Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const marcarComoLeido = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:3000/api/notificaciones/${id}/marcar-leido`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        setNotificaciones(
          notificaciones.map((notif) =>
            notif.id === id ? { ...notif, leido: true } : notif
          )
        );
      }
    } catch (err) {
      console.error("Error al marcar como leído:", err);
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando notificaciones...</div>;
  if (error) return <div className="p-6 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Notificaciones</h1>

        {notificaciones.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notificaciones.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 rounded-lg border-l-4 ${
                  notif.leido
                    ? "bg-white border-gray-300"
                    : "bg-blue-50 border-blue-500"
                } shadow`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{notif.titulo}</h3>
                    <p className="text-gray-600 mt-2">{notif.mensaje}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notif.fecha_creacion).toLocaleDateString("es-ES")}
                    </p>
                  </div>
                  {!notif.leido && (
                    <button
                      onClick={() => marcarComoLeido(notif.id)}
                      className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm whitespace-nowrap"
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
  );
};

export default NotificacionesPage;
