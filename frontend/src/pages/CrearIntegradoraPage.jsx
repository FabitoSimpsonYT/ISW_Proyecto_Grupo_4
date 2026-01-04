import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { createEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { getEvaluacionesByCodigoRamo } from "../services/evaluacion.service.js";
import { getMisRamos } from "../services/ramos.service.js";
import CustomDatePicker from "../components/CustomDatePicker.jsx";
import CustomTimePicker from "../components/CustomTimePicker.jsx";
import Swal from "sweetalert2";

export default function CrearIntegradoraPage() {
  const { codigoRamo } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ramo, setRamo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [evaluacionMasReciente, setEvaluacionMasReciente] = useState(null);
  const [formData, setFormData] = useState({
    fechaProgramada: "",
    horaInicio: "",
    horaFin: "",
    puntajeTotal: "",
    contenidos: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const normalizeToDateOnly = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const str = String(value);
    const clean = str.includes("T") ? str.split("T")[0] : str;
    const parts = clean.split("-");
    if (parts.length === 3) {
      const [yyyy, mm, dd] = parts.map(Number);
      if (Number.isFinite(yyyy) && Number.isFinite(mm) && Number.isFinite(dd)) {
        const d = new Date(yyyy, mm - 1, dd);
        return Number.isNaN(d.getTime()) ? null : d;
      }
    }
    return null;
  };

  const getFechaEvaluacion = (ev) => {
    if (!ev) return null;
    const raw = ev.fechaProgramada || ev.fecha;
    return normalizeToDateOnly(raw);
  };

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

        // Cargar evaluaciones para encontrar la más reciente (cualquier tipo) del mismo ramo
        try {
          const evaluaciones = await getEvaluacionesByCodigoRamo(codigoRamo);
          if (Array.isArray(evaluaciones) && evaluaciones.length > 0) {
            const conFecha = evaluaciones
              .map(ev => ({ ...ev, _fechaObj: getFechaEvaluacion(ev) }))
              .filter(ev => ev._fechaObj);

            if (conFecha.length > 0) {
              const masReciente = conFecha.reduce((max, ev) =>
                ev._fechaObj > max._fechaObj ? ev : max
              );
              setEvaluacionMasReciente(masReciente);
            }
          }
        } catch (err) {
          console.error("Error al cargar evaluaciones:", err);
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

    // Validar que la fecha sea al menos un día después de la evaluación más reciente del ramo
    if (evaluacionMasReciente) {
      const fechaIntegradora = normalizeToDateOnly(formData.fechaProgramada);
      const fechaMasReciente = getFechaEvaluacion(evaluacionMasReciente);

      if (fechaMasReciente && fechaIntegradora) {
        const fechaLimite = new Date(fechaMasReciente);
        fechaLimite.setDate(fechaLimite.getDate() + 1);

        if (fechaIntegradora < fechaLimite) {
          setError(`La fecha debe ser al menos un día después de la evaluación más reciente (${fechaLimite.toLocaleDateString('es-ES')})`);
          return;
        }
      }
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

      // Si la llamada no lanzó error, asumimos éxito (algunos backends no envían success:true)
      Swal.fire(
        "Éxito",
        resultado?.message || "Evaluación integradora creada correctamente",
        "success"
      ).then(() => {
        navigate("/evaluaciones");
      });
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
        <div className="rounded-2xl border border-blue-200 bg-transparent p-4">
          <div className="flex items-center justify-between gap-4 mb-4 bg-[#113C63] text-white px-4 py-3 rounded-xl">
            <h2 className="text-xl font-bold">
              Crear Evaluación Integradora
            </h2>
            <button
              type="button"
              onClick={() => navigate("/evaluaciones")}
              className="text-white hover:text-red-200 font-bold text-xl"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 border rounded bg-transparent space-y-5">
            {error && (
              <div className="rounded-2xl border border-red-400 bg-red-100 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* Fecha */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Fecha Programada: *</label>
              {evaluacionMasReciente && getFechaEvaluacion(evaluacionMasReciente) && (() => {
                const base = getFechaEvaluacion(evaluacionMasReciente);
                const limite = new Date(base);
                limite.setDate(limite.getDate() + 1);
                return (
                  <p className="text-sm text-blue-600 mb-2">
                    Debe ser al menos un día después de {limite.toLocaleDateString('es-ES')}
                  </p>
                );
              })()}
              <CustomDatePicker
                value={formData.fechaProgramada}
                onChange={(date) => {
                  setFormData({ ...formData, fechaProgramada: date });
                }}
              />
            </div>

            {/* Horario */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Hora Inicio:</label>
                <CustomTimePicker
                  value={formData.horaInicio}
                  onChange={(time) => {
                    setFormData({ ...formData, horaInicio: time });
                  }}
                />
              </div>
              <div>
                <label className="block mb-1 font-semibold text-gray-700">Hora Fin:</label>
                <CustomTimePicker
                  value={formData.horaFin}
                  onChange={(time) => {
                    setFormData({ ...formData, horaFin: time });
                  }}
                />
              </div>
            </div>

            {/* Puntaje Total */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Puntaje Total: *</label>
              <input
                type="text"
                name="puntajeTotal"
                value={formData.puntajeTotal}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '' || /^\d*\.?\d*$/.test(value)) {
                    handleChange(e);
                  }
                }}
                className="border p-2 w-full rounded transition border-gray-300 focus:border-blue-500"
                placeholder="Ej: 100"
                required
              />
            </div>

            {/* Contenidos */}
            <div>
              <label className="block mb-1 font-semibold text-gray-700">Contenidos:</label>
              <textarea
                name="contenidos"
                value={formData.contenidos}
                onChange={handleChange}
                className="border p-2 w-full rounded min-h-[100px] transition border-gray-300 focus:border-blue-500"
                placeholder="Describe los contenidos que se evaluarán en la evaluación integradora"
              />
            </div>

            {/* Info - Ponderación Fija */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                <strong>📋 Ponderación:</strong> La evaluación integradora tiene una ponderación fija del 40%.
              </p>
            </div>

            {/* Botón Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded font-semibold transition ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed text-gray-600"
                  : "text-white hover:shadow-lg"
              }`}
              style={{
                backgroundColor: isSubmitting ? undefined : '#143A80',
              }}
              onMouseEnter={(e) => !isSubmitting && (e.target.style.backgroundColor = '#0E2C66')}
              onMouseLeave={(e) => !isSubmitting && (e.target.style.backgroundColor = '#143A80')}
            >
              {isSubmitting
                ? ("Guardando...")
                : "Crear Evaluación Integradora"}
            </button>
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
