import { useEffect, useState } from "react";
import { getMisApelaciones } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";

export default function MisApelaciones() {
  const [apelaciones, setApelaciones] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const result = await getMisApelaciones();
      setApelaciones(result.data || []);
    }
    load();
  }, []);

  const toggleExpand = (index) => {
    setExpandedRows((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const puedeEditarApelacion = (apelacion) => {
    if (apelacion.estado !== "citada") return false;
    if (!apelacion.fechaCitacion) return false;
    
    const ahora = new Date();
    const citacion = new Date(apelacion.fechaCitacion);
    const horasRestantes = (citacion - ahora) / (1000 * 60 * 60);
    
    return horasRestantes >= 24;
  };



  if (apelaciones === null)
    return (
      <div className={`p-6 bg-[#e9f7fb] min-h-screen transition-all duration-300 flex flex-col items-center justify-center ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
        <p className="text-[#0E2C66] text-xl mb-6">
          Cargando...
        </p>
        </div>);

  if (apelaciones.length == 0) {
    return (
      <div className={`p-6 bg-[#e9f7fb] min-h-screen transition-all duration-300 flex flex-col items-center justify-center ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
        <p className="text-[#0E2C66] text-xl mb-6">
          Aún no has creado una apelación
        </p>
        <button
          onClick={() => navigate("/apelaciones")}
          className="bg-[#0E2C66] text-white px-8 py-2 rounded-full shadow hover:bg-[#143A80] transition"
        >
          Crear Apelación
        </button>
      </div>
    );
  }

  return (
    <div className={`p-6 bg-[#e9f7fb] min-h-screen transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>

      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Mis Apelaciones</h2>
      </div>

      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden mr-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#e2ebff] text-gray-700">
              <th className="px-4 py-2 border">Tipo</th>
              <th className="px-4 py-2 border">Mensaje</th>
              <th className="px-4 py-2 border">Estado</th>
              <th className="px-4 py-2 border">Respuesta</th>
              <th className="px-4 py-2 border">Profesor</th>
              <th className="px-4 py-2 border">Fecha Citación</th>
              <th className="px-2 py-2 border w-20"></th>

            </tr>
          </thead>

          <tbody>
            {apelaciones.map((a, index) => {
              const expanded = expandedRows[index];
              const esEditable = puedeEditarApelacion(a);
              const estadoColor = 
                a.estado === "aceptada" || a.estado === "cita" ? "text-green-600 font-semibold" :
                a.estado === "rechazada" ? "text-red-600 font-semibold" :
                "text-yellow-600 font-semibold";
              
              return (
              <tr
                key={a.id}
                 onClick={() =>
                    navigate(`/apelaciones/${a.id}/editar`)}

                className={`group transition ${
                  index % 2 === 0 ? "bg-[#f4f8ff]" : "bg-white"
                } hover:bg-[#dbe7ff]`}
              >
                <td className="px-4 py-2 border font-semibold capitalize">
                  {a.tipo}
                  {a.subtipoInasistencia && (
                    <span className="text-xs block text-gray-600">
                      ({a.subtipoInasistencia === "evaluacion" ? "Reagendar" : "Justificación"})
                    </span>
                  )}
                </td>

                <td
                  className="px-4 py-2 border max-w-[250px] cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(index);
                  }}
                >
                  <p className={expanded ? "" : "truncate"}>
                    {a.mensaje}
                  </p>
                </td>

                <td className={`px-4 py-2 border capitalize ${estadoColor}`}>
                  {a.estado}
                </td>

                <td
                  className="px-4 py-2 border max-w-[250px] italic"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(index);
                  }}
                >
                  {a.respuestaDocente?.trim() ? (
                    expanded ? (
                      <p>{a.respuestaDocente}</p>
                    ) : (
                      <p className="truncate">{a.respuestaDocente}</p>
                    )
                  ) : (
                    <span className="text-gray-400">Sin respuesta</span>
                  )}
                </td>

                <td className="px-4 py-2 border">
                  {a.profesor?.email || "—"}
                </td>

                <td className="px-4 py-2 border">
                  {a.fechaCitacion ? (
                    <>
                      {new Date(a.fechaCitacion).toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                      {esEditable && (
                        <span className="block text-xs text-green-600 mt-1">
                          ✓ Editable
                        </span>
                      )}
                      {!esEditable && a.estado === "citada" && (
                        <span className="block text-xs text-red-600 mt-1">
                          ⚠️ Menos de 24h
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>

                <td className="px-2 py-2 border text-center">
                  {esEditable && (
                    <button
                      onClick={(e) => {
                        console.log("CLICK EDITAR", a.id);
                        navigate(`/apelaciones/${a.id}/editar`);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs hover:text-blue-800 transition"
                      title="Editar apelación"
                    >
                      ✎
                    </button>
                  )}
                </td>
              </tr>

              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center mt-6">
        <button
          onClick={() => navigate("/apelaciones")}
          className="bg-[#0E2C66] text-white px-8 py-2 rounded-full shadow hover:bg-[#143A80] transition"
        >
          Crear Apelación
        </button>
      </div>
    </div>
  );
}
