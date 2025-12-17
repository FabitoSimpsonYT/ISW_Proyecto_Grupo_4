export default function ResponderApelacion({
  estado,
  setEstado,
  comentario,
  setComentario,
  fechaLimiteEdicion,
  setFechaLimiteEdicion,
  enviarRespuesta
}) {
  return (
    <div>
      <h3 className="text-xl font-semibold mb-2">Responder apelación</h3>

      <label className="block font-medium">Nuevo estado:</label>
      <select
        className="mt-1 p-2 border rounded w-full"
        value={estado}
        onChange={(e) => setEstado(e.target.value)}
      >
        <option value="aceptada">Aceptada</option>
        <option value="rechazada">Rechazada</option>
      </select>

      <label className="block mt-4 font-medium">Comentario del profesor:</label>
      <textarea
        className="mt-1 p-2 border rounded w-full h-32"
        value={comentario}
        onChange={(e) => setComentario(e.target.value)}
      />

      {estado === "aceptada" && (
        <>
          <label className="block mt-4 font-medium">Fecha límite de edición:</label>
          <input
            type="datetime-local"
            className="mt-1 p-2 border rounded w-full"
            value={fechaLimiteEdicion}
            onChange={(e) => setFechaLimiteEdicion(e.target.value)}
          />
        </>
      )}

      <button
        onClick={enviarRespuesta}
        className="mt-4 bg-[#113C63] text-white px-6 py-2 rounded hover:bg-[#0d2f4d] transition"
      >
        Enviar respuesta
      </button>
    </div>
    
  );
}
