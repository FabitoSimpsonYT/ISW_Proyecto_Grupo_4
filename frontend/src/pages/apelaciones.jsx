import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useNavbar } from "../context/NavbarContext";
import FormularioApelacion from "../components/FormularioApelacion";
import { crearApelacion } from "../services/apelaciones.service";

export default function Apelaciones() {
  const navigate = useNavigate();
  const { isNavbarOpen } = useNavbar();

  const [apelacionCreada, setApelacionCreada] = useState(false);
  const [errorMensaje, setErrorMensaje] = useState("");

  const handleCrear = async (formData) => {
    setApelacionCreada(false);
    setErrorMensaje("");

    try {
      await crearApelacion(formData);
      setApelacionCreada(true);
    } catch (error) {
  console.error(error);

  const status = error.status;
  const msg = error.data?.message || error.message;

  if (status === 400) {
    setErrorMensaje(msg || "Los datos enviados no son válidos.");
  } else if (status === 401) {
    setErrorMensaje("No tienes sesión activa.");
  } else if (status === 403) {
    setErrorMensaje("No tienes permisos para crear esta apelación.");
  } else if (status === 404) {
    setErrorMensaje("Profesor no encontrado.");
  } else if (status >= 500) {
    setErrorMensaje("Error interno del servidor.");
  } else {
    setErrorMensaje(msg || "Ocurrió un error inesperado.");
  }
}

  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? "ml-64" : "ml-0"} p-8`}
    >
      <div className="max-w-4xl mx-auto">

        <div className="bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white px-8 py-6 rounded-t-2xl shadow-lg">
          <h1 className="text-3xl font-bold">Crear Apelación</h1>
          <p className="text-white/80 mt-1">
            Completa el formulario para enviar tu apelación
          </p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          <FormularioApelacion
            modo="crear"
            onSubmit={handleCrear}
          />
        {apelacionCreada && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-semibold">
              Apelación creada correctamente
            </p>
            <p className="text-sm text-green-700">
              Su apelación fue enviada y está en espera de revisión por el profesor.
            </p>
          </div>
        )}

        {errorMensaje && (
          <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-semibold">
              Error al crear la apelación
            </p>
            <p className="text-sm text-red-700">
              {errorMensaje}
            </p>
          </div>
        )}
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
