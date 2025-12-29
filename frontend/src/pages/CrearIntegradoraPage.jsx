import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { createEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { getMisRamos } from "../services/ramos.service.js";
import Swal from "sweetalert2";

export default function CrearIntegradoraPage() {
  const { codigoRamo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ramo, setRamo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    fechaProgramada: "",
    horaInicio: "",
    horaFin: "",
    puntajeTotal: "",
    contenidos: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Verificar permisos y cargar ramo
  useEffect(() => {
    const load = async () => {
      try {
        if (user?.role !== "profesor" && user?.role !== "jefecarrera") {
          Swal.fire("Error", "Solo profesores pueden crear evaluaciones", "error");
          navigate("/evaluaciones");
          return;
        }

        if (!codigoRamo) {
          navigate("/evaluaciones");
          return;
        }

        const ramos = await getMisRamos();
        const found = ramos.find(r => r.codigo === codigoRamo);
        
        if (!found) {
          Swal.fire("Error", "Ramo no encontrado", "error");
          navigate("/evaluaciones");
          return;
        }

        setRamo(found);
      } catch (err) {
        console.error("Error:", err);
        Swal.fire("Error", "Error al cargar datos", "error");
        navigate("/evaluaciones");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [codigoRamo, user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.fechaProgramada) {
      setError("La fecha programada es requerida");
      return;
    }

    if (!formData.puntajeTotal || formData.puntajeTotal <= 0) {
      setError("El puntaje total es requerido y debe ser mayor a 0");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const dataToSend = {
        ...formData,
        titulo: "Evaluación Integradora",
        ponderacion: 40,
      };

      const resultado = await createEvaluacionIntegradora(codigoRamo, dataToSend);

      if (resultado?.success) {
        Swal.fire(
          "Éxito",
          "Evaluación integradora creada correctamente",
          "success"
        ).then(() => {
          navigate("/evaluaciones");
        });
      } else {
        Swal.fire(
          "Error",
          resultado?.message || "No se pudo crear la evaluación",
          "error"
        );
        setError(resultado?.message || "No se pudo crear la evaluación");
      }
    } catch (err) {
      console.error("Error:", err);
      const errorMsg = err?.response?.data?.message || err?.message || "Error al crear";
      Swal.fire(
        "Error",
        errorMsg,
        "error"
      );
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#e9f7fb] flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#e9f7fb]">
      <div className="mx-auto max-w-2xl p-6">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/evaluaciones")}
            className="mb-4 text-blue-700 hover:text-blue-900 transition font-medium text-lg"
          >
            ← Volver
          </button>
          <h1 className="text-4xl font-bold text-[#113C63]">{ramo?.nombre}</h1>
          <div className="mt-1 text-sm font-medium text-blue-600">{ramo?.codigo}</div>
        </div>

        {/* Formulario */}
        <div className="rounded-2xl bg-white shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#143A80] mb-6">
            Crear Evaluación Integradora
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-2xl border border-red-400 bg-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="block text-sm font-medium text-[#143A80] mb-2">
                Fecha Programada *
              </label>
              <input
                type="date"
                name="fechaProgramada"
                value={formData.fechaProgramada}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                required
              />
            </div>

            {/* Horario */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#143A80] mb-2">
                  Hora Inicio
                </label>
                <input
                  type="time"
                  name="horaInicio"
                  value={formData.horaInicio}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#143A80] mb-2">
                  Hora Fin
                </label>
                <input
                  type="time"
                  name="horaFin"
                  value={formData.horaFin}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>

            {/* Puntaje Total */}
            <div>
              <label className="block text-sm font-medium text-[#143A80] mb-2">
                Puntaje Total *
              </label>
              <input
                type="number"
                name="puntajeTotal"
                value={formData.puntajeTotal}
                onChange={handleChange}
                min="1"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                placeholder="Ej: 100"
                required
              />
            </div>

            {/* Contenidos */}
            <div>
              <label className="block text-sm font-medium text-[#143A80] mb-2">
                Contenidos
              </label>
              <textarea
                name="contenidos"
                value={formData.contenidos}
                onChange={handleChange}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                placeholder="Describe los contenidos que se evaluarán en la evaluación integradora"
              />
            </div>

            {/* Info - Ponderación Fija */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>📋 Ponderación:</strong> La evaluación integradora tiene una ponderación fija del 40%.
              </p>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t">
              <button
                type="button"
                onClick={() => navigate("/evaluaciones")}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 disabled:opacity-50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-[#143A80] text-white font-semibold rounded-xl hover:bg-[#0f2d5f] disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    Creando...
                  </>
                ) : (
                  "Crear Evaluación Integradora"
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info útil */}
        <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">
          <h3 className="font-semibold text-[#143A80] mb-3">ℹ️ Información</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• La evaluación integradora es opcional y se puede crear para cualquier ramo</li>
            <li>• Solo los estudiantes que la rindan recibirán calificación</li>
            <li>• El promedio final se calcula como: (Promedio Parcial × 0.6) + (Integradora × 0.4)</li>
            <li>• Si no hay integradora, el promedio final es igual al promedio parcial</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
