import { useState } from "react";

export default function ApelacionInfo({ apelacion }) {
  const [modalOpen, setModalOpen] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const fileUrl = apelacion.archivo
    ? `${API_URL}/api/apelaciones/${apelacion.id}/archivo`
    : null;


  const esImagen = apelacion.archivo?.match(/\.(jpg|jpeg|png|gif)$/i);
  const esPDF = apelacion.archivo?.match(/\.pdf$/i);

  return (
    <div>

      {fileUrl && (
        <div className="mt-6">
          <p className="font-semibold flex items-center gap-2">
            <span className="text-xl">📎</span> Archivo adjunto:
          </p>

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

          <a
            href={fileUrl}
            download
            className="inline-block mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Descargar archivo
          </a>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="relative bg-white rounded-lg max-w-5xl w-[90%] max-h-[90%] p-6 overflow-auto shadow-xl">

            <button
              onClick={() => setModalOpen(false)}
              className="absolute top-3 right-3 text-gray-600 hover:text-black text-3xl"
            >
              ✖
            </button>

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
