import { useState } from "react";

export default function ApelacionInfo({ apelacion }) {
  const [modalOpen, setModalOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  // URL REAL al archivo
  const fileUrl = `${API_URL}/uploads/${apelacion.archivo}`;

  const esImagen = apelacion.archivo?.match(/\.(jpg|jpeg|png|gif)$/i);
  const esPDF = apelacion.archivo?.match(/\.pdf$/i);

  return (
    <div>
      <p><strong>Enviado por:</strong> {apelacion.alumno?.email}</p>
      <p><strong>Tipo:</strong> {apelacion.tipo}</p>
      <p><strong>Estado actual:</strong> {apelacion.estado}</p>

      <hr className="my-4" />

      <p className="text-lg font-semibold">Mensaje del alumno:</p>
      <p className="bg-[#f2f7ff] p-4 rounded border mt-2">{apelacion.mensaje}</p>

      {/* ARCHIVO ADJUNTO */}
      {apelacion.archivo && (
        <div className="mt-6">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-xl">📎</span> Archivo adjunto:
          </p>

          {/* PREVIEW BOX */}
          <div
            onClick={() => setModalOpen(true)}
            className="mt-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-100 transition shadow-sm w-fit"
          >
            {esImagen && (
              <img
                src={fileUrl}
                alt="Vista previa"
                className="w-40 h-40 object-cover rounded"
              />
            )}

            {esPDF && (
              <div className="bg-red-100 text-red-700 px-4 py-2 rounded flex items-center gap-2">
                📄 Ver PDF
              </div>
            )}

            {!esImagen && !esPDF && (
              <div className="bg-gray-200 px-4 py-2 rounded text-gray-700">
                📄 Archivo disponible
              </div>
            )}
          </div>

          {/* DESCARGAR */}
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Descargar archivo
          </a>
        </div>
      )}

      {/* MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-5xl w-[90%] max-h-[90%] p-6 overflow-auto shadow-xl">

            {/* BOTÓN CERRAR */}
            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-3xl"
            >
              ✖
            </button>

            {/* CONTENIDO DEL MODAL */}
            {esImagen && (
              <img
                src={fileUrl}
                alt="Archivo adjunto"
                className="max-h-[80vh] mx-auto rounded shadow"
              />
            )}

            {esPDF && (
              <iframe
                src={fileUrl}
                className="w-full h-[80vh] border rounded"
                title="PDF adjunto"
              ></iframe>
            )}

            {!esImagen && !esPDF && (
              <p className="text-center text-gray-600">No es posible previsualizar este tipo de archivo.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
