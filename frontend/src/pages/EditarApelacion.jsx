import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { getApelacionById, editarApelacion } from "../services/apelaciones.service";
import FormularioApelacion from "../components/FormularioApelacion";
import { useNavbar } from "../context/NavbarContext";

export default function EditarApelacion() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isNavbarOpen } = useNavbar();

  const [apelacion, setApelacion] = useState(null);
  const [errorMensaje, setErrorMensaje] = useState("");
  const [apelacionEditada, setApelacionEditada] = useState(false);

  // Cargar apelación
  useEffect(() => {
    async function load() {
      try {
        const res = await getApelacionById(id);
        setApelacion(res.data);
      } catch {
        setErrorMensaje("No se pudo cargar la apelación.");
      }
    }
    load();
  }, [id]);

  // Manejar edición
  const handleEditar = async (formData) => {
    setErrorMensaje("");
    setApelacionEditada(false);

    try {
      await editarApelacion(id, formData);
      setApelacionEditada(true);
    } catch (err) {
      const msg = err.data?.message || err.message || "Error al editar apelación.";
      setErrorMensaje(msg);
    }
  };

  if (!apelacion) return <p className="p-8">Cargando apelación...</p>;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? "ml-64" : "ml-0"} p-8`}
    >
      <div className="max-w-4xl mx-auto">
        {/* ENCABEZADO */}
        <div className="bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white px-8 py-6 rounded-t-2xl shadow-lg">
          <h1 className="text-3xl font-bold">Editar Apelación</h1>
          <p className="text-white/80 mt-1">
            Actualiza el formulario y envía tu apelación
          </p>
        </div>

        {/* CARD */}
        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          <FormularioApelacion
            modo="editar"
            apelacionInicial={apelacion}
            onSubmit={handleEditar}
          />

          {/* ✅ MENSAJE ÉXITO */}
          {apelacionEditada && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 font-semibold">
                Apelación editada correctamente
              </p>
              <p className="text-sm text-green-700">
                Los cambios fueron guardados con éxito.
              </p>
            </div>
          )}

          {/* ❌ MENSAJE ERROR */}
          {errorMensaje && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 font-semibold">
                Error al editar la apelación
              </p>
              <p className="text-sm text-red-700">{errorMensaje}</p>
            </div>
          )}

          {/* BOTÓN VOLVER */}
          <div className="flex justify-center mt-10">
            <button
              onClick={() => navigate("/apelaciones/mis")}
              className="bg-[#9cb0e5] text-[#0E2C66] px-8 py-2 rounded-full shadow hover:bg-[#8aa2d6] transition"
            >
              Volver a la bandeja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
