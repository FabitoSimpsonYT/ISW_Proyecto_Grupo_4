import { useEffect, useState } from "react";
import { getMisApelaciones } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";

export default function MisApelaciones() {
  const [apelaciones, setApelaciones] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
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

  if (apelaciones === null)
    return (
      <div className="p-6 bg-[#e9f7fb] min-h-screen ml-[250px] flex flex-col items-center justify-center">
        <p className="text-[#0E2C66] text-xl mb-6">
          Cargando...
        </p>
        </div>);

  if (apelaciones.length === 0) {
    return (
      <div className="p-6 bg-[#e9f7fb] min-h-screen ml-[250px] flex flex-col items-center justify-center">
        <p className="text-[#0E2C66] text-xl mb-6">
          Aún no has hecho una apelación
        </p>

          {user?.role === "alumno" && (
            <button
              onClick={() => navigate("/apelaciones")}
              className="bg-[#0E2C66] text-white px-8 py-2 rounded-full shadow hover:bg-[#143A80] transition"
            >
              Crear Apelación
            </button>
          )}
      </div>
    );
  }

  return (
    <div className="p-6 bg-[#e9f7fb] min-h-screen ml-[250px]">

      {/* Título */}
      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Perfil de Alumno</h2>
      </div>


      {/* Línea separadora */}
      <div className="mt-6 bg-white h-4 rounded"></div>

      <h3 className="mt-6 text-xl font-semibold ml-2">Mis apelaciones:</h3>
      <div className="mt-2 bg-[#d5e8f6] h-3 rounded"></div>

      {/* TABLA */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden mr-8">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#e2ebff] text-gray-700">
              <th className="px-4 py-2 border">Tipo</th>
              <th className="px-4 py-2 border">Mensaje</th>
              <th className="px-4 py-2 border">Estado</th>
              <th className="px-4 py-2 border">Respuesta</th>
              <th className="px-4 py-2 border">Profesor</th>
              <th className="px-4 py-2 border">Cit./Límite</th>
            </tr>
          </thead>

          <tbody>
            {apelaciones.map((a, index) => {
              const expanded = expandedRows[index];
              return (
                <tr
                  key={a.id}
                  className={`cursor-pointer transition ${
                    index % 2 === 0 ? "bg-[#f4f8ff]" : "bg-white"
                  } hover:bg-[#dbe7ff]`}
                >
                  <td className="px-4 py-2 border font-semibold">{a.tipo}</td>

                  {/* MENSAJE (Expandible) */}
                  <td
                    className="px-4 py-2 border max-w-[250px]"
                    onClick={() => toggleExpand(index)}
                  >
                    {expanded ? (
                      <p>{a.mensaje}</p>
                    ) : (
                      <p className="truncate">{a.mensaje}</p>
                    )}
                  </td>

                  <td className="px-4 py-2 border capitalize">{a.estado}</td>

                  {/* RESPUESTA DOCENTE (Expandible) */}
                  <td
                    className="px-4 py-2 border max-w-[250px] italic"
                    onClick={() => toggleExpand(index)}
                  >
                    {a.respuestaDocente?.trim() !== "" ? (
                      expanded ? (
                        <p>{a.respuestaDocente}</p>
                      ) : (
                        <p className="truncate">{a.respuestaDocente}</p>
                      )
                    ) : (
                      "—"
                    )}
                  </td>

                  {/* CORREO DEL PROFESOR */}
                  <td className="px-4 py-2 border">
                    {a.profesor?.email || "—"}
                  </td>

                  {/* FECHAS */}
                  <td className="px-4 py-2 border">
                    {a.fechaCitacion || a.fechaLimiteEdicion ? (
                    new Date(a.fechaCitacion || a.fechaLimiteEdicion).toLocaleString("es-CL", {
                    dateStyle: "short",
                    timeStyle: "short",
                    })) : ("—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* BOTÓN DE CREACIÓN */}
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
