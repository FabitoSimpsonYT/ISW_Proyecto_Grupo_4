import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getApelacionesProfesor,
  eliminarApelacion
} from "../services/apelaciones.service";
import { useNavbar } from "../context/NavbarContext";

export default function ApelacionesProfesor() {
  const [apelaciones, setApelaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();


  useEffect(() => {
    const cargarApelaciones = async () => {
      try {
        const res = await getApelacionesProfesor();
        if (res?.data) setApelaciones(res.data);
      } catch (error) {
        console.error("Error cargando apelaciones", error);
      } finally {
        setLoading(false);
      }
    };

    cargarApelaciones();
  }, []);


  const handleEliminar = async (id) => {
    const confirmar = window.confirm(
      "¿Estás seguro de que deseas eliminar esta apelación?"
    );

    if (!confirmar) return;

    try {
      await eliminarApelacion(id);
      setApelaciones((prev) => prev.filter((apel) => apel.id !== id));
    } catch (error) {
      console.error("Error al eliminar apelación", error);
      alert("No se pudo eliminar la apelación.");
    }
  };

  if (loading) return <p>Cargando apelaciones...</p>;

  return (
    <div
      className={`p-6 bg-[#e9f7fb] min-h-screen transition-all duration-300 ${
        isNavbarOpen ? "ml-64" : "ml-0"
      }`}
    >

      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Bandeja de entrada</h2>
      </div>


      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden mr-8 ml-2">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#e2ebff] text-gray-700">
              <th className="px-4 py-2 border">Tipo</th>
              <th className="px-4 py-2 border">Mensaje</th>
              <th className="px-4 py-2 border">Estado</th>
              <th className="px-4 py-2 border">Alumno</th>
              <th className="px-4 py-2 border">Fecha creación</th>
              <th className="px-4 py-2 border">Última actualización</th>
              <th className="px-4 py-2 border">Citación</th>
              <th className="px-2 py-2 border w-6"></th>
            </tr>
          </thead>

          <tbody>
            {apelaciones.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4 text-gray-500">
                  No tienes apelaciones de tus alumnos.
                </td>
              </tr>
            )}

            {apelaciones.map((apel, index) => {
              const estado = apel.estado?.toLowerCase();

              const estadoColor =
                estado === "aceptada" || estado === "cita"
                  ? "text-green-600 font-semibold"
                  : estado === "rechazada"
                  ? "text-red-600 font-semibold"
                  : "text-yellow-600 font-semibold";

              const requiereCitacion =
                apel.tipo === "inasistencia" &&
                apel.subtipoInasistencia === "evaluacion";

              const puedeEliminar =
                estado === "pendiente" || estado === "revisada";

              return (
                <tr
                  key={apel.id}
                  onClick={() =>
                    navigate(`/profesor/apelacion/${apel.id}`)
                  }
                  className={`group cursor-pointer transition ${
                    index % 2 === 0 ? "bg-[#f4f8ff]" : "bg-white"
                  } hover:bg-[#dbe7ff]`}
                >

                  <td className="px-4 py-2 border capitalize">
                    {apel.tipo}
                    {apel.subtipoInasistencia && (
                      <span className="text-xs block text-gray-600">
                        (
                        {apel.subtipoInasistencia === "evaluacion"
                          ? "Reagendar"
                          : "Justificación"}
                        )
                      </span>
                    )}
                  </td>


                  <td className="px-4 py-2 border truncate max-w-[220px]">
                    {apel.mensaje}
                  </td>

                  <td className={`px-4 py-2 border capitalize ${estadoColor}`}>
                    {estado === "aceptada" && "Aprobada"}
                    {estado === "rechazada" && "Rechazada"}
                    {estado === "revisada" && "Revisada"}
                    {estado === "pendiente" && "Pendiente"}
                    {estado === "cita" && "Citada"}

                    {requiereCitacion && estado === "pendiente" && (
                      <span className="block text-xs text-blue-600">
                        🔄 Requiere cita
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-2 border">
                    {apel.alumno?.email || "Desconocido"}
                  </td>

                  <td className="px-4 py-2 border">
                    {new Date(apel.creadoEl).toLocaleString("es-CL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-4 py-2 border">
                    {(["pendiente", "cita", "revisada"].includes(apel.estado?.toLowerCase())) ? (
                      new Date(apel.actualizadoEl).toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    ) : "—"}
                  </td>
                  <td className="px-4 py-2 border">
                    {apel.fechaCitacion ? (
                      new Date(apel.fechaCitacion).toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    ) : requiereCitacion && estado === "aceptada" ? (
                      <span className="text-orange-600 text-sm">
                        ⚠️ Falta agendar
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>

                  <td className="px-2 py-2 border text-center">
                    {puedeEliminar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminar(apel.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 text-xs hover:text-red-700 transition"
                        title="Eliminar apelación"
                      >
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
