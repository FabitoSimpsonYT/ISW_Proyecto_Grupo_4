import { useState } from "react";
import { crearApelacion } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";

export default function Apelaciones() {
  const [profesorCorreo, setProfesorCorreo] = useState("");
  const [tipo, setTipo] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [respuesta, setRespuesta] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("profesorCorreo", profesorCorreo);
  formData.append("tipo", tipo);
  formData.append("mensaje", mensaje);

  if (archivo) {
    formData.append("archivo", archivo);
  }

  const data = await crearApelacion(formData);
  setRespuesta(data);
};


  return (
    <div className="flex flex-col w-full ml-64 p-8 min-h-screen bg-[#E6F3FF]">

      {/* Título */}
      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Perfil de Alumno</h2>
      </div>

      {/* Línea superior */}
      <div className="w-full h-3 bg-[#9cb0e5] mb-2"></div>

      {/* CONTENEDOR DEL TÍTULO */}
      <div className="bg-white rounded-lg shadow border border-[#AFCBFF] px-4 py-2 mb-2">
        <h3 className="font-semibold text-lg text-[#0E2C66]">
          Crear Nueva Apelación:
        </h3>
      </div>

      {/* Línea inferior */}
      <div className="w-full h-3 bg-[#9cb0e5] mb-6"></div>

<form
  onSubmit={handleSubmit}
  className="bg-white p-8 rounded-2xl shadow-lg border border-[#AFCBFF] max-w-2xl space-y-6"
>
  {/* TÍTULO */}
  <h2 className="text-2xl font-bold text-[#0E2C66] border-b pb-3">
    Crear Apelación
  </h2>

  {/* CORREO DEL PROFESOR */}
  <div className="space-y-1">
    <label className="block font-semibold text-[#0E2C66]">
      Correo del Profesor:
    </label>
    <input
      className="w-full p-3 border border-[#AFCBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D8BFF] transition"
      value={profesorCorreo}
      onChange={(e) => setProfesorCorreo(e.target.value)}
      placeholder="Ej: profesor@duoc.cl"
    />
  </div>

  {/* TIPO */}
  <div className="space-y-1">
    <label className="block font-semibold text-[#0E2C66]">
      Tipo:
    </label>
    <select
      className="w-full p-3 border border-[#AFCBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D8BFF] transition"
      value={tipo}
      onChange={(e) => setTipo(e.target.value)}
    >
      <option value="">Selecciona...</option>
      <option value="emergencia">Emergencia</option>
      <option value="notas">Notas</option>
      <option value="inasistencia">Inasistencia</option>
    </select>
  </div>

  {/* MENSAJE */}
  <div className="space-y-1">
    <label className="block font-semibold text-[#0E2C66]">
      Mensaje:
    </label>
    <textarea
      className="w-full p-3 border border-[#AFCBFF] rounded-lg h-40 resize-none focus:outline-none focus:ring-2 focus:ring-[#5D8BFF] transition"
      value={mensaje}
      onChange={(e) => setMensaje(e.target.value)}
      placeholder="Escribe aquí tu apelación con todos los detalles..."
    />
  </div>

  {/* ARCHIVO ADJUNTO */}
  <div className="space-y-1">
    <label className="block font-semibold text-[#0E2C66]">
      Archivo adjunto (opcional):
    </label>

    <input
      type="file"
      onChange={(e) => setArchivo(e.target.files[0])}
      className="block w-full text-[#0E2C66]"
    />
  </div>

  {/* BOTONES */}
  <div className="flex justify-between items-center pt-4">
    {/* Botón Subir Archivo */}
    <button
      type="button"
      onClick={() => document.querySelector("input[type='file']").click()}
      className="px-4 py-2 bg-[#AFCBFF] text-[#0E2C66] font-semibold rounded-lg border border-[#0E2C66] hover:bg-[#8BB8FF] transition"
    >
      Subir Archivo
    </button>

    {/* Botón Enviar */}
    <button
      type="submit"
      className="px-6 py-2 bg-[#0E2C66] text-white font-bold rounded-lg hover:bg-[#143D8C] transition shadow"
    >
      Enviar Apelación
    </button>
  </div>
</form>

      {respuesta?.message && (
  <div className="mt-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded max-w-2xl">
    {respuesta.message}
  </div>
)}

      {/* VOLVER */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate("/apelaciones/mis")}
          className="bg-[#9cb0e5] text-[#0E2C66] px-6 py-2 rounded-full shadow hover:bg-[#8aa2d6] transition"
        >
          Volver a Mis Apelaciones
        </button>
      </div>
    </div>
  );
}
