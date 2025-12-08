import { useEffect, useState } from "react";
import { getMisApelaciones } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";

export default function MisApelaciones() {
  const [apelaciones, setApelaciones] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const result = await getMisApelaciones();
      setApelaciones(result.data || []);
    }
    load();
  }, []);

  if (apelaciones === null)
    return <p className="text-white">Cargando apelaciones...</p>;

  if (apelaciones.length === 0)
    return <p className="text-[#0E2C66] ml-64 p-6">No tienes apelaciones.</p>;

  return (
    <div className="flex flex-col w-full ml-64 p-8 min-h-screen bg-[#E6F3FF]">

      {/* ENCABEZADO */}
      <div className="bg-[#173b61] text-white p-6 rounded-lg shadow mb-6">
        <h2 className="text-2xl font-bold">Texto de prueba: Perfil de Alumno</h2>
      </div>

      {/* Línea superior */}
      <div className="w-full h-3 bg-[#9cb0e5] mb-2"></div>

      {/* Contenedor blanco del título */}
      <div className="bg-white rounded-lg shadow border border-[#AFCBFF] px-4 py-2 mb-2">
        <h3 className="font-semibold text-lg text-[#0E2C66]">
          Bandeja de entrada:
        </h3>
      </div>

      {/* Línea inferior */}
      <div className="w-full h-3 bg-[#9cb0e5] mb-6"></div>

      {/* TABLA */}
      <div className="bg-white rounded-lg shadow border border-[#AFCBFF] p-4 w-full">
        <table className="w-full border-collapse">
          <tbody>
            {apelaciones.map((a, i) => (
              <tr key={i} className="border-b border-[#AFCBFF]">

                <td className="p-3 border border-[#d0ddff] bg-[#E8F0FF] font-semibold">
                  {a.tipo}
                </td>

                <td className="p-3 border border-[#AFCBFF] bg-[#ffffff]">
                  {a.mensaje}
                </td>

                <td className="p-3 border border-[#AFCBFF] bg-[#E8F0FF]">
                  {a.estado}
                </td>

                <td className="p-3 border border-[#AFCBFF] bg-[#ffffff] italic">
                  {a.respuestaDocente?.trim() !== "" ? a.respuestaDocente : "—"}
                </td>

                <td className="p-3 border border-[#AFCBFF] bg-[#E8F0FF]">
                  {(a.fechaCitacion || a.fechaLimiteEdicion)
                    ? new Date(a.fechaCitacion || a.fechaLimiteEdicion).toLocaleDateString()
                    : "—"}
                </td>

              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* BOTÓN */}
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
