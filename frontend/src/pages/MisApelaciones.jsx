import { useEffect, useState } from "react";
import { getMisApelaciones } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";

export default function MisApelaciones() {
  const [apelaciones, setApelaciones] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [editMensaje, setEditMensaje] = useState("");
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

  const handleEditar = (apelacion) => {
    setEditingId(apelacion.id);
    setEditMensaje(apelacion.mensaje);
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setEditMensaje("");
  };

  const handleGuardarEdicion = async (id) => {
    // Aquí llamarías al servicio para actualizar
    console.log("Guardar edición:", id, editMensaje);
    // TODO: implementar servicio de actualización
    setEditingId(null);
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
              <th className="px-4 py-2 border">Fecha Citación</th>
              <th className="px-4 py-2 border">Acciones</th>
            </tr>
          </thead>

          <tbody>
            {apelaciones.map((a, index) => {
              const expanded = expandedRows[index];
              const esEditable = puedeEditarApelacion(a);
              const estadoColor = 
                a.estado === "aprobada" || a.estado === "citada" ? "text-green-600 font-semibold" :
                a.estado === "rechazada" ? "text-red-600 font-semibold" :
                "text-yellow-600 font-semibold";
              
              return (
                <tr
                  key={a.id}
                  className={`transition ${
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

                  {/* MENSAJE (Expandible o Editable) */}
                  <td
                    className="px-4 py-2 border max-w-[250px]"
                    onClick={() => toggleExpand(index)}
                  >
                    {editingId === a.id ? (
                      <textarea
                        value={editMensaje}
                        onChange={(e) => setEditMensaje(e.target.value)}
                        className="w-full p-2 border rounded"
                        rows={3}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : expanded ? (
                      <p className="cursor-pointer">{a.mensaje}</p>
                    ) : (
                      <p className="truncate cursor-pointer">{a.mensaje}</p>
                    )}
                  </td>

                  <td className={`px-4 py-2 border capitalize ${estadoColor}`}>
                    {a.estado}
                  </td>

                  {/* RESPUESTA DOCENTE (Expandible) */}
                  <td
                    className="px-4 py-2 border max-w-[250px] italic"
                    onClick={() => toggleExpand(index)}
                  >
                    {a.respuestaDocente?.trim() !== "" ? (
                      expanded ? (
                        <p className="cursor-pointer">{a.respuestaDocente}</p>
                      ) : (
                        <p className="truncate cursor-pointer">{a.respuestaDocente}</p>
                      )
                    ) : (
                      <span className="text-gray-400">Sin respuesta</span>
                    )}
                  </td>

                  {/* CORREO DEL PROFESOR */}
                  <td className="px-4 py-2 border">
                    {a.profesor?.email || "—"}
                  </td>

                  {/* FECHA CITACIÓN */}
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

                  {/* ACCIONES */}
                  <td className="px-4 py-2 border text-center">
                    {editingId === a.id ? (
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleGuardarEdicion(a.id)}
                          className="text-green-600 hover:text-green-800 text-sm font-semibold"
                        >
                          ✓ Guardar
                        </button>
                        <button
                          onClick={handleCancelarEdicion}
                          className="text-red-600 hover:text-red-800 text-sm font-semibold"
                        >
                          ✕ Cancelar
                        </button>
                      </div>
                    ) : esEditable ? (
                      <button
                        onClick={() => handleEditar(a)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-semibold"
                      >
                        ✏️ Editar
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">—</span>
                    )}
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
