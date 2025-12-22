import { useState } from "react";
import { crearApelacion } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";

export default function Apelaciones() {
  const [profesorCorreo, setProfesorCorreo] = useState("");
  const [tipo, setTipo] = useState("");
  const [subtipoInasistencia, setSubtipoInasistencia] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [respuesta, setRespuesta] = useState(null);
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("profesorCorreo", profesorCorreo);
  formData.append("tipo", tipo);
  
  if (tipo === "inasistencia" && subtipoInasistencia) {
    formData.append("subtipoInasistencia", subtipoInasistencia);
  }
  
  formData.append("mensaje", mensaje);

  if (archivo) {
    formData.append("archivo", archivo);
  }

  const data = await crearApelacion(formData);
  setRespuesta(data);
  
  // Limpiar formulario si fue exitoso
  if (data?.message) {
    setProfesorCorreo("");
    setTipo("");
    setSubtipoInasistencia("");
    setMensaje("");
    setArchivo(null);
  }
};


  return (
    <div className={`flex flex-col w-full p-8 min-h-screen bg-[#E6F3FF] transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>

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
      Tipo de Apelación:
    </label>
    <select
      className="w-full p-3 border border-[#AFCBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D8BFF] transition"
      value={tipo}
      onChange={(e) => {
        setTipo(e.target.value);
        setSubtipoInasistencia(""); // Limpiar subtipo al cambiar tipo
      }}
    >
      <option value="">Selecciona...</option>
      <option value="evaluacion">📝 Evaluación (Nota)</option>
      <option value="inasistencia">📅 Inasistencia</option>
      <option value="emergencia">🚨 Emergencia</option>
    </select>
    
    {tipo === "evaluacion" && (
      <p className="text-sm text-gray-600 mt-2">
        ℹ️ Disponible para apelar notas con tus profesores de ramo
      </p>
    )}
    {tipo === "inasistencia" && (
      <p className="text-sm text-gray-600 mt-2">
        ℹ️ Para justificar inasistencias a evaluaciones o exceso de faltas
      </p>
    )}
    {tipo === "emergencia" && (
      <p className="text-sm text-gray-600 mt-2">
        ℹ️ Notificación urgente disponible en cualquier momento
      </p>
    )}
  </div>

  {/* SUBTIPO INASISTENCIA */}
  {tipo === "inasistencia" && (
    <div className="space-y-1 bg-blue-50 p-4 rounded-lg border border-blue-200">
      <label className="block font-semibold text-[#0E2C66]">
        Motivo de Inasistencia:
      </label>
      <select
        className="w-full p-3 border border-[#AFCBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D8BFF] transition"
        value={subtipoInasistencia}
        onChange={(e) => setSubtipoInasistencia(e.target.value)}
        required
      >
        <option value="">Selecciona el motivo...</option>
        <option value="evaluacion">🔄 Inasistencia a Evaluación (Reagendar)</option>
        <option value="porcentaje">📊 Porcentaje de Inasistencia Superior al 51%</option>
      </select>
      
      {subtipoInasistencia === "evaluacion" && (
        <p className="text-sm text-green-700 mt-2 bg-green-50 p-2 rounded">
          ✅ Podrás reagendar la evaluación con tu profesor si es aprobada
        </p>
      )}
      {subtipoInasistencia === "porcentaje" && (
        <p className="text-sm text-orange-700 mt-2 bg-orange-50 p-2 rounded">
          ⚠️ Esta es una carta de justificación al profesor
        </p>
      )}
    </div>
  )}

  {/* MENSAJE */}
  <div className="space-y-1">
    <label className="block font-semibold text-[#0E2C66]">
      Mensaje de Justificación:
    </label>
    <textarea
      className="w-full p-3 border border-[#AFCBFF] rounded-lg h-40 resize-none focus:outline-none focus:ring-2 focus:ring-[#5D8BFF] transition"
      value={mensaje}
      onChange={(e) => setMensaje(e.target.value)}
      placeholder="Explica detalladamente tu situación. Sé claro y específico..."
      required
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
  <div className={`mt-6 border px-4 py-3 rounded max-w-2xl ${
    respuesta.state === "Success" 
      ? "bg-green-100 border-green-400 text-green-700"
      : "bg-red-100 border-red-400 text-red-700"
  }`}>
    <p className="font-semibold">{respuesta.message}</p>
    {respuesta.state === "Success" && (
      <p className="text-sm mt-2">
        Tu apelación ha sido enviada correctamente. El profesor la revisará pronto.
      </p>
    )}
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
