import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getNotificaciones, marcarNotificacionLeida } from "../services/notificacionuno.service";

const NotificacionesModal = ({ open, onClose }) => {
  const [notificaciones, setNotificaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const modalRef = useRef();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) fetchNotificaciones();
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onClose]);

  const fetchNotificaciones = async () => {
    try {
      setLoading(true);
      const data = await getNotificaciones();
      setNotificaciones(data);
    } catch (err) {
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
      // Silenciar error
    }
  };

  const handleNotificacionClick = async (notif) => {
    // Marcar como leída
    if (!notif.leido) {
      await marcarComoLeido(notif.id);
    }
    
    // Derivar navegación según tipo de notificación
    if ((notif.tipo === "comentario" || notif.tipo === "comentario_alumno") && notif.metadata) {
      try {
        const metadata = typeof notif.metadata === 'string' ? JSON.parse(notif.metadata) : notif.metadata;
        const codigoRamo = metadata.codigoRamo;
        const evaluacionId = metadata.evaluacionId;
        const evaluacionIntegradoraId = metadata.evaluacionIntegradoraId;

        onClose(); // Cerrar el modal antes de navegar

        // Alumno: ir a sus evaluaciones del ramo
        if (notif.tipo === "comentario" && codigoRamo) {
          navigate(`/alumno/evaluaciones/${codigoRamo}`);
          return;
        }

        // Profesor: ir a la evaluación correspondiente
        if (notif.tipo === "comentario_alumno" && codigoRamo) {
          if (evaluacionId) {
            navigate(`/evaluacion/${codigoRamo}/${evaluacionId}/evaluar`);
            return;
          }
          if (evaluacionIntegradoraId) {
            navigate(`/evaluacion/${codigoRamo}/evaluar-integradora/${evaluacionIntegradoraId}`);
            return;
          }
        }
      } catch (err) {
        console.error("Error al parsear metadata de notificación:", err);
      }
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
      <div
        ref={modalRef}
        className="w-full max-w-md bg-white rounded-xl shadow-2xl border border-gray-200 mt-16 mr-4 pointer-events-auto animate-fade-in"
        style={{ maxHeight: "80vh", overflowY: "auto" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-bold text-gray-800">Notificaciones</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-center text-gray-500 py-8">Cargando notificaciones...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-8">{error}</div>
          ) : notificaciones.length === 0 ? (
            <div className="text-center text-gray-500 py-8">No tienes notificaciones</div>
          ) : (
            <div className="space-y-3">
              {notificaciones.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => handleNotificacionClick(notif)}
                  className={`p-4 rounded-lg border ${notif.leido ? "bg-white border-gray-200" : "bg-blue-50 border-blue-200"} shadow-sm ${(notif.tipo === "comentario" || notif.tipo === "comentario_alumno") ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-800 text-base">{notif.titulo}</h3>
                        {!notif.leido && (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Nueva</span>
                        )}
                      </div>
                      <p className="text-gray-700 mt-1 text-sm">{notif.mensaje}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {notif.fechaEnvio ? new Date(notif.fechaEnvio).toLocaleString("es-ES") : ""}
                      </p>
                      {notif.tipo === "comentario" && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          👆 Haz clic para ver tus evaluaciones
                        </p>
                      )}
                      {notif.tipo === "comentario_alumno" && (
                        <p className="text-xs text-blue-600 mt-2 font-medium">
                          👆 Haz clic para abrir la evaluación
                        </p>
                      )}
                    </div>
                    {!notif.leido && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          marcarComoLeido(notif.id);
                        }}
                        className="ml-2 px-3 py-1 bg-[#0E2C66] text-white rounded-lg hover:bg-[#1a3f8f] transition text-xs whitespace-nowrap"
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

export default NotificacionesModal;
