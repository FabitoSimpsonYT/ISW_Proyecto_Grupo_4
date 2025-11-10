import { useEffect, useState } from "react";
import { getAllEvaluaciones, deleteEvaluacion } from "../services/evaluacion.service.js";

export default function EvaluacionList({ onEdit }) {
  const [evaluaciones, setEvaluaciones] = useState([]);

  const fetchData = async () => {
    const data = await getAllEvaluaciones();
    setEvaluaciones(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro de eliminar esta evaluación?");
    if (confirmDelete) {
      await deleteEvaluacion(id);
      setEvaluaciones(evaluaciones.filter((e) => e.id !== id));
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Lista de Evaluaciones</h2>

      {evaluaciones.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay evaluaciones registradas.</p>
      ) : (
        <ul className="space-y-3">
          {evaluaciones.map((ev) => (
            <li key={ev.id} className="border p-4 rounded-lg bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium text-lg">{ev.titulo}</h3>
                  <p className="text-gray-600">{ev.descripcion}</p>
                  <p className="text-sm text-gray-500">Fecha: {ev.fecha}</p>
                </div>
                <div className="shrink-0 ml-4">
                  <span
                    className={`inline-block px-2 py-1 rounded text-sm ${
                      ev.publicada
                        ? "bg-green-100 text-green-800"
                        : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    {ev.publicada ? "Publicada" : "No publicada"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition"
                  onClick={() => onEdit(ev)}
                >
                  Editar
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition"
                  onClick={() => handleDelete(ev.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
