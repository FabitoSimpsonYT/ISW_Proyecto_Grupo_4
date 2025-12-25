import { useState, useEffect } from "react";
import { useRef } from "react";


export default function FormularioApelacion({
  modo,
  apelacionInicial = null,
  onSubmit,
  loading = false,
}) {
  const esCrear = modo === "crear";
  const esEditar = modo === "editar";
  const esAlumno = esCrear || esEditar;
  const esProfesor = modo === "responder";
  const fileInputRef = useRef(null);


  const [profesorCorreo, setProfesorCorreo] = useState("");
  const [tipo, setTipo] = useState("");
  const [subtipoInasistencia, setSubtipoInasistencia] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [archivoExistente, setArchivoExistente] = useState(null);

  const [removeArchivo, setRemoveArchivo] = useState(false);

  const [estado, setEstado] = useState("");
  const [respuestaDocente, setRespuestaDocente] = useState("");
  const [fechaCitacion, setFechaCitacion] = useState("");

  const [apelacionCreada, setApelacionCreada] = useState(false);

  const apelacionResuelta =
  esProfesor &&
  (apelacionInicial?.estado === "aceptada" ||
   apelacionInicial?.estado === "rechazada");


useEffect(() => {
  if (!apelacionInicial) return;

  setProfesorCorreo(apelacionInicial.profesor?.email || "");
  setTipo(apelacionInicial.tipo || "");
  setSubtipoInasistencia(apelacionInicial.subtipoInasistencia || "");
  setMensaje(apelacionInicial.mensaje || "");

  setEstado(apelacionInicial.estado || "");
  setRespuestaDocente(apelacionInicial.respuestaDocente || "");

  if (apelacionInicial.fechaCitacion) {
    setFechaCitacion(apelacionInicial.fechaCitacion.slice(0, 16));
  }

  setArchivoExistente(apelacionInicial.archivo || null);
  setRemoveArchivo(false); 
}, [apelacionInicial]);


  const requiereCitacion =
    tipo === "inasistencia" && subtipoInasistencia === "evaluacion";

  const handleSubmit = (e) => {
    e.preventDefault();

    // ================== ALUMNO ==================
    if (esAlumno) {
      if (!mensaje.trim()) {
        alert("El mensaje es obligatorio.");
        return;
      }

      const formData = new FormData();

      if (esCrear) {
        formData.append("tipo", tipo);
        if (tipo === "inasistencia" && subtipoInasistencia) {
          formData.append("subtipoInasistencia", subtipoInasistencia);
        }
      }

      formData.append("mensaje", mensaje.trim());
      formData.append("profesorCorreo", profesorCorreo.trim());

      if (archivo) formData.append("archivo", archivo);

      onSubmit(formData);

      if (esCrear) setApelacionCreada(true);
      return;
    }

    // ================== PROFESOR ==================
    if (esProfesor) {
      if (!estado) {
        alert("Debes seleccionar un estado.");
        return;
      }

      if (estado === "rechazada" && !respuestaDocente.trim()) {
        alert("El rechazo requiere un mensaje obligatorio.");
        return;
      }

      if (estado === "cita" && !fechaCitacion) {
        alert("Debe indicar una fecha de citación.");
        return;
      }

      onSubmit({
        estado,
        respuestaDocente: respuestaDocente || null,
        fechaCitacion: estado === "cita" ? fechaCitacion : null,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* CORREO PROFESOR */}
      <div className="border-b border-gray-200 pb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Correo del Profesor
        </label>
        <input
          className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
          value={profesorCorreo}
          onChange={(e) => setProfesorCorreo(e.target.value)}
          disabled={esProfesor}
        />
      </div>

      {/* TIPO */}
      <div className="border-b border-gray-200 pb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Tipo
        </label>
        <select
          className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          disabled={esProfesor || esEditar}
        >
          <option value="">Selecciona...</option>
          <option value="evaluacion">Evaluación</option>
          <option value="inasistencia">Inasistencia</option>
          <option value="emergencia">Emergencia</option>
        </select>
      </div>

      {/* SUBTIPO */}
      {tipo === "inasistencia" && (
        <div className="border-b border-gray-200 pb-4">
          <label className="block text-sm font-semibold text-gray-600 mb-2">
            Motivo de Inasistencia
          </label>
          <select
            className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
            value={subtipoInasistencia}
            onChange={(e) => setSubtipoInasistencia(e.target.value)}
            disabled={esProfesor || esEditar}
          >
            <option value="">Selecciona...</option>
            <option value="evaluacion">Reagendar evaluación</option>
            <option value="porcentaje">Justificación porcentaje</option>
          </select>
        </div>
      )}

      {/* MENSAJE ALUMNO */}
      <div className="border-b border-gray-200 pb-4">
        <label className="block text-sm font-semibold text-gray-600 mb-2">
          Mensaje del Alumno
        </label>
        <textarea
          className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 h-32"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          disabled={esProfesor}
        />
      </div>

      {/* ARCHIVO */}
      {esAlumno && (
        <div className="pb-4 space-y-2">
          <label className="block text-sm font-semibold text-gray-600">
            Archivo adjunto
          </label>

          {/* INPUT FILE OCULTO */}
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => setArchivo(e.target.files[0])}
          />

          {/* ARCHIVO EXISTENTE */}
          {archivoExistente && !archivo && !removeArchivo && (
            <div
              className="bg-blue-50 border border-blue-200 text-blue-700 text-sm p-3 rounded space-y-2 cursor-pointer hover:bg-blue-100 transition"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex items-center gap-2">
                📎 <span className="underline">Archivo actual adjunto</span>
              </div>

              <button
                type="button"
                className="text-xs text-red-600 underline"
                onClick={(e) => {
                  e.stopPropagation();
                  setRemoveArchivo(true);
                }}
              >
                Quitar archivo
              </button>

              <span className="block text-xs text-blue-600">
                Haz clic aquí para seleccionar un nuevo archivo y reemplazarlo.
              </span>
            </div>
          )}

          {/* AVISO DE ELIMINACIÓN */}
          {removeArchivo && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded">
              ⚠️ El archivo será eliminado al guardar.
              <button
                type="button"
                className="block text-xs underline mt-1"
                onClick={() => setRemoveArchivo(false)}
              >
                Cancelar
              </button>
            </div>
          )}

          {/* SUBIR ARCHIVO NUEVO (CUANDO NO HAY EXISTENTE) */}
          {!archivoExistente && !removeArchivo && (
            <div
              className="border border-dashed border-gray-300 text-gray-600 text-sm p-3 rounded cursor-pointer hover:bg-gray-50"
              onClick={() => fileInputRef.current?.click()}
            >
              📎 Haz clic aquí para adjuntar un archivo
            </div>
          )}

          {/* AVISO DE REEMPLAZO */}
          {archivo && archivoExistente && (
            <p className="text-xs text-orange-600">
              ⚠️ El archivo actual será reemplazado.
            </p>
          )}

          {/* ARCHIVO SELECCIONADO */}
          {archivo && (
            <p className="text-xs text-green-700">
              Archivo seleccionado: <strong>{archivo.name}</strong>
            </p>
          )}
        </div>
      )}



      {/* ================== ESTADO Y RESPUESTA PROFESOR ================== */}
      {esProfesor && (
        <>
          {/* ESTADO */}
          <div className="border-b border-gray-200 pb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Estado
            </label>
            <select
              className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              disabled={apelacionResuelta}
            >
              <option value="">Selecciona...</option>
              <option value="revisada">Revisada</option>
              <option value="aceptada">Aceptada</option>
              <option value="rechazada">Rechazada</option>
              <option value="cita">Citación</option>
            </select>
          </div>

          {/* RESPUESTA DOCENTE */}
          <div className="border-b border-gray-200 pb-4">
            <label className="block text-sm font-semibold text-gray-600 mb-2">
              Respuesta del Docente
            </label>
            <textarea
              className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50 h-24"
              value={respuestaDocente}
              onChange={(e) => setRespuestaDocente(e.target.value)}
              disabled={apelacionResuelta}
            />
          </div>

          {/* FECHA DE CITACIÓN */}
          {estado === "cita" && (
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Fecha de citación
              </label>
              <input
                type="datetime-local"
                className="w-full p-3 rounded-lg border border-gray-300 bg-gray-50"
                value={fechaCitacion}
                onChange={(e) => setFechaCitacion(e.target.value)}
              />
            </div>
          )}
        </>
      )}

      {/* BOTÓN */}
      <div className="flex justify-end pt-6">
        <button
          type="submit"
          disabled={loading}
          className="bg-[#0E2C66] text-white px-8 py-2 rounded-full"
        >
          {esAlumno ? "Guardar" : "Guardar Respuesta"}
        </button>
      </div>
    </form>
  );
}
