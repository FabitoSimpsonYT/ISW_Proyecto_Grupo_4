export default function ResponderApelacion({
  apelacion,
  estado,
  setEstado,
  comentario,
  setComentario,
  fechaCitacion,
  setFechaCitacion,
  enviarRespuesta
}) {
  const requiereCitacion = 
    apelacion?.tipo === "inasistencia" && 
    apelacion?.subtipoInasistencia === "evaluacion";

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-[#AFCBFF]">
      <h3 className="text-2xl font-bold text-[#0E2C66] mb-4 border-b pb-2">
        Responder Apelación
      </h3>

      {/* DECISIÓN */}
      <div className="mb-4">
        <label className="block font-semibold text-[#0E2C66] mb-2">
          Decisión:
        </label>
        <select
          className="w-full p-3 border border-[#AFCBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D8BFF]"
          value={estado}
          onChange={(e) => setEstado(e.target.value)}
        >
          <option value="aprobada">✅ Aprobar</option>
          <option value="rechazada">❌ Rechazar</option>
          {requiereCitacion && <option value="citada">📅 Aprobar y Agendar Cita</option>}
        </select>
      </div>

      {/* MENSAJE SOLO SI APRUEBA */}
      {(estado === "aprobada" || estado === "citada") && (
        <div className="mb-4 bg-green-50 p-4 rounded-lg border border-green-200">
          <label className="block font-semibold text-[#0E2C66] mb-2">
            Mensaje de respuesta al alumno:
          </label>
          <textarea
            className="w-full p-3 border border-[#AFCBFF] rounded-lg h-32 focus:outline-none focus:ring-2 focus:ring-[#5D8BFF]"
            value={comentario}
            onChange={(e) => setComentario(e.target.value)}
            placeholder="Explica tu decisión al alumno..."
          />
          <p className="text-sm text-green-700 mt-2">
            ℹ️ Este mensaje será visible para el estudiante
          </p>
        </div>
      )}

      {/* MENSAJE DE RECHAZO */}
      {estado === "rechazada" && (
        <div className="mb-4 bg-red-50 p-4 rounded-lg border border-red-200">
          <p className="text-red-700 font-semibold">
            ⚠️ Al rechazar, NO podrás enviar un mensaje al alumno según las políticas.
          </p>
          <p className="text-sm text-red-600 mt-2">
            El alumno solo verá que su apelación fue rechazada sin comentarios adicionales.
          </p>
        </div>
      )}

      {/* FECHA DE CITACIÓN */}
      {estado === "citada" && (
        <div className="mb-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <label className="block font-semibold text-[#0E2C66] mb-2">
            📅 Fecha y hora de la citación:
          </label>
          <input
            type="datetime-local"
            className="w-full p-3 border border-[#AFCBFF] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5D8BFF]"
            value={fechaCitacion}
            onChange={(e) => setFechaCitacion(e.target.value)}
          />
          <p className="text-sm text-blue-700 mt-2">
            ℹ️ El alumno podrá editar su mensaje hasta 24 horas antes de la cita
          </p>
        </div>
      )}

      {/* AVISOS SEGÚN TIPO */}
      {apelacion && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-sm font-semibold text-gray-700">
            Tipo de apelación: <span className="capitalize">{apelacion.tipo}</span>
          </p>
          {apelacion.tipo === "evaluacion" && (
            <p className="text-sm text-gray-600 mt-1">
              📝 El alumno está apelando por una nota de evaluación
            </p>
          )}
          {apelacion.tipo === "inasistencia" && apelacion.subtipoInasistencia === "evaluacion" && (
            <p className="text-sm text-gray-600 mt-1">
              🔄 El alumno solicita reagendar una evaluación perdida
            </p>
          )}
          {apelacion.tipo === "inasistencia" && apelacion.subtipoInasistencia === "porcentaje" && (
            <p className="text-sm text-gray-600 mt-1">
              📊 El alumno justifica su porcentaje de inasistencia (&gt;51%)
            </p>
          )}
          {apelacion.tipo === "emergencia" && (
            <p className="text-sm text-gray-600 mt-1">
              🚨 Notificación de emergencia del estudiante
            </p>
          )}
        </div>
      )}

      {/* BOTÓN ENVIAR */}
      <button
        onClick={enviarRespuesta}
        className="w-full bg-[#0E2C66] text-white font-bold px-6 py-3 rounded-lg hover:bg-[#143D8C] transition shadow-lg"
      >
        {estado === "rechazada" ? "Rechazar Apelación" : "Enviar Respuesta y Aprobar"}
      </button>
    </div>
  );
}
