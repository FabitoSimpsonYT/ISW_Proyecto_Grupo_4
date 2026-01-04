import { useState } from "react";
import cookies from "js-cookie";

export default function ApelacionInfo({ apelacion }) {
  const [modalOpen, setModalOpen] = useState(false);

  const API_URL = import.meta.env.VITE_BASE_URL;

  const fileUrl = apelacion.archivo
    ? `${API_URL}/apelaciones/${apelacion.id}/archivo`
    : null;

  const handleDescargar = async () => {
    if (!fileUrl) return;

    try {
      const token = cookies.get("jwt-auth");
      const response = await fetch(fileUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error al descargar archivo");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = apelacion.archivo || "archivo";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error descargando archivo:", error);
      alert("Error al descargar el archivo");
    }
  };


  const esImagen = apelacion.archivo?.match(/\.(jpg|jpeg|png|gif)$/i);
  const esPDF = apelacion.archivo?.match(/\.pdf$/i);

  return (
    <div>

      {/* ARCHIVO ADJUNTO (diseño compacto: miniatura a la izquierda, acciones a la derecha) */}
      {fileUrl && (
        <div className="mt-3 flex items-start gap-4">
          <div
            onClick={() => setModalOpen(true)}
            className="flex-shrink-0 w-36 h-36 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 transition shadow-sm flex items-center justify-center bg-white"
            title="Abrir vista previa"
          >
            {esImagen ? (
              <img src={fileUrl} alt="Vista previa" className="w-full h-full object-cover rounded" />
            ) : esPDF ? (
              <div className="flex items-center justify-center text-red-700">
                <span className="text-2xl">📄</span>
              </div>
            ) : (
              <div className="flex items-center justify-center text-gray-600">
                <span className="text-2xl">📎</span>
              </div>
            )}
          </div>

          <div className="flex-1">
            <p className="font-semibold flex items-center gap-2">
              <span className="text-xl">Archivo adjunto</span>
            </p>
            <p className="text-sm text-gray-600 mt-1">{apelacion.archivo}</p>

            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={handleDescargar}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Descargar
              </button>

              <button
                onClick={() => setModalOpen(true)}
                className="bg-gray-100 text-gray-800 px-3 py-2 rounded border hover:bg-gray-200"
              >
                Ver
              </button>
            </div>
          </div>
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
