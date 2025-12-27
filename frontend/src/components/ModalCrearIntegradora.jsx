import { useState } from "react";
import Swal from "sweetalert2";
import { createEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";

export default function ModalCrearIntegradora({ codigoRamo, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: "Evaluación Integradora",
    fechaProgramada: "",
    horaInicio: "",
    horaFin: "",
    ponderacion: 40,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "ponderacion" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.titulo || !formData.fechaProgramada) {
      Swal.fire("Error", "Completa el título y la fecha", "error");
      return;
    }

    try {
      setLoading(true);
      const resultado = await createEvaluacionIntegradora(codigoRamo, formData);

      if (resultado?.success) {
        Swal.fire("Éxito", "Evaluación integradora creada", "success");
        setFormData({
          titulo: "Evaluación Integradora",
          fechaProgramada: "",
          horaInicio: "",
          horaFin: "",
          ponderacion: 40,
        });
        onSuccess?.();
        onClose();
      } else {
        Swal.fire("Error", resultado?.message || "No se pudo crear", "error");
      }
    } catch (error) {
      console.error("Error:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Error al crear";
      Swal.fire("Error", errorMsg, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-6 py-4">
          <h2 className="text-2xl font-bold text-white">Crear Evaluación Integradora</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-[#143A80] mb-2">
              Título
            </label>
            <input
              type="text"
              name="titulo"
              value={formData.titulo}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              placeholder="Evaluación Integradora"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#143A80] mb-2">
              Fecha Programada
            </label>
            <input
              type="date"
              name="fechaProgramada"
              value={formData.fechaProgramada}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-[#143A80] mb-2">
                Hora Inicio
              </label>
              <input
                type="time"
                name="horaInicio"
                value={formData.horaInicio}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-[#143A80] mb-2">
                Hora Fin
              </label>
              <input
                type="time"
                name="horaFin"
                value={formData.horaFin}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-[#143A80] mb-2">
              Ponderación (%)
            </label>
            <input
              type="number"
              name="ponderacion"
              value={formData.ponderacion}
              onChange={handleChange}
              min="1"
              max="100"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin">⟳</span>
                  Creando...
                </>
              ) : (
                "Crear"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
