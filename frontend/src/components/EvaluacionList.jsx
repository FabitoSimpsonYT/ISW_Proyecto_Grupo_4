import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorAlert, showConfirmAlert } from "@/utils/alertUtils";
import {
  deleteEvaluacion,
  getAllEvaluaciones,
  getEvaluacionesByCodigoRamo,
  updateEvaluacion,
} from "../services/evaluacion.service.js";
import { getEvaluacionIntegradora, deleteEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { useAuth } from "../context/AuthContext.jsx";
import { calcularPromediosRamo, createPromedioParcial, createPromedioFinal, calcularPromediosParcial, calcularPromediosFinal } from "../services/alumnoPromedioRamo.service.js";
import Swal from "sweetalert2";

function formatEstado(estado) {
  if (!estado) return "";
  const normalized = String(estado).toLowerCase();
  if (normalized === "pendiente") return "Pendiente";
  if (normalized === "aplicada") return "Aplicada";
  if (normalized === "finalizada") return "Finalizada";
  return estado;
}

function formatFecha(fecha, fechaProgramada) {
  const fechaStr = fecha || fechaProgramada || "";
  if (!fechaStr) return "";
  
  // Si viene en formato ISO (YYYY-MM-DD), convertir a DD/MM/YYYY
  if (fechaStr.includes("-")) {
    const parts = fechaStr.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
  }
  
  // Si viene en formato DD/MM/YYYY, devolverlo tal cual
  if (fechaStr.includes("/")) {
    return fechaStr;
  }
  
  return fechaStr;
}

function formatHorario(horaInicio, horaFin) {
  if (!horaInicio && !horaFin) return "";
  if (horaInicio && horaFin) return `${horaInicio} - ${horaFin}`;
  return horaInicio || horaFin;
}

export default function EvaluacionList({ onEdit, codigoRamo, onNuevaEvaluacion }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [evaluacionIntegradora, setEvaluacionIntegradora] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const [calculandoPromedios, setCalculandoPromedios] = useState(false);
  const [calculandoPromedioParcial, setCalculandoPromedioParcial] = useState(false);
  const [calculandoPromedioFinal, setCalculandoPromedioFinal] = useState(false);
  const [creadoIntegradora, setCreadoIntegradora] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching evaluaciones para codigoRamo:", codigoRamo);
      const data = codigoRamo
        ? await getEvaluacionesByCodigoRamo(codigoRamo)
        : await getAllEvaluaciones();
      console.log("Datos recibidos:", data);
      
      // Verificar si ya existe evaluación integradora
      if (codigoRamo) {
        try {
          const integradora = await getEvaluacionIntegradora(codigoRamo);
          if (integradora?.data) {
            setEvaluacionIntegradora(integradora.data);
            setCreadoIntegradora(true);
          } else {
            setEvaluacionIntegradora(null);
            setCreadoIntegradora(false);
          }
        } catch (err) {
          setEvaluacionIntegradora(null);
          setCreadoIntegradora(false);
        }
      }
      setEvaluaciones(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("Error fetching evaluaciones:", e);
      setEvaluaciones([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [codigoRamo]);

  const total = evaluaciones.length;

  const titulo = useMemo(() => {
    return codigoRamo ? `Evaluaciones (${total})` : `Lista de Evaluaciones (${total})`;
  }, [codigoRamo, total]);

  // Ordenar evaluaciones por fechaProgramada (más antiguo al más nuevo)
  const evaluacionesOrdenadas = useMemo(() => {
    return [...evaluaciones].sort((a, b) => {
      const dateA = new Date(a.fechaProgramada || a.fecha || 0).getTime();
      const dateB = new Date(b.fechaProgramada || b.fecha || 0).getTime();
      return dateA - dateB; // Orden ascendente (más antiguo primero)
    });
  }, [evaluaciones]);

  const handleDelete = async (id, isIntegradora = false) => {
    const result = await showConfirmAlert(
      "¿Está seguro?",
      "¿Estás seguro de eliminar esta evaluación? Se eliminarán también todas las pautas y pautas evaluadas asociadas.",
      "Eliminar",
      "Cancelar"
    );
    if (result.isConfirmed) {
      try {
        if (isIntegradora) {
          await deleteEvaluacionIntegradora(id);
          setEvaluacionIntegradora(null);
        } else {
          await deleteEvaluacion(id);
          setEvaluaciones(evaluaciones.filter((e) => e.id !== id));
        }
        showSuccessAlert('Evaluación eliminada', 'La evaluación y todas sus pautas asociadas han sido eliminadas correctamente.');
      } catch (error) {
        showErrorAlert('Error', `Error al eliminar evaluación: ${error.message || 'Intenta nuevamente'}`);
      }
    }
  };

  const handleTogglePublicacion = async (ev) => {
    if (!ev?.id) return;
    const current = Boolean(ev.publicada || ev.pautaPublicada);
    const next = !current;

    setPublishingId(ev.id);
    try {
      await updateEvaluacion(ev.id, { pautaPublicada: next });
      setEvaluaciones((prev) =>
        prev.map((x) => (x.id === ev.id ? { ...x, pautaPublicada: next } : x))
      );
    } catch (e) {
      const msg = e?.message || e?.error || "No se pudo actualizar la publicación";
      showErrorAlert("Error", msg);
    } finally {
      setPublishingId(null);
    }
  };

  const handleVerPauta = (ev) => {
    if (!ev?.id || !codigoRamo) return;
    navigate(`/evaluacion/${codigoRamo}/${ev.id}/pauta`);
  };

  const handleVerPautaIntegradora = (ev) => {
    if (!ev?.id || !codigoRamo) return;
    // Si tiene idPauta, es edición; si no, es creación
    if (ev.idPauta) {
      navigate(`/evaluacion/${codigoRamo}/${ev.id}/pauta`);
    } else {
      navigate(`/evaluacion/${codigoRamo}/${ev.id}/pauta?new=true`);
    }
  };

  const handleEvaluar = (ev) => {
    if (!ev?.id || !codigoRamo) return;
    navigate(`/evaluacion/${codigoRamo}/${ev.id}/evaluar`);
  };

  const handleEvaluarIntegradora = (ev) => {
    if (!ev?.id || !codigoRamo) return;
    navigate(`/evaluacion/${codigoRamo}/evaluar-integradora/${ev.id}`);
  };

  const handleCalcularPromedioParcial = async () => {
    if (!codigoRamo) {
      Swal.fire("Aviso", "Selecciona un ramo primero", "info");
      return;
    }

    try {
      setCalculandoPromedioParcial(true);
      console.log("📊 Calculando promedio parcial para todos en ramo:", codigoRamo);
      const resultado = await calcularPromediosParcial(codigoRamo);
      setCalculandoPromedioParcial(false);
      
      console.log("✅ Resultado:", resultado);
      const message = resultado?.data?.message || "Promedio parcial calculado exitosamente";
      
      // Verificar si hay errores en la respuesta
      if (resultado?.data?.hasErrors) {
        Swal.fire({
          icon: 'error',
          title: 'Error en Ponderaciones',
          html: `<div style="text-align: left;">${message.replace(/\n/g, '<br>')}</div>`,
          confirmButtonText: 'Entendido'
        });
      } else {
        Swal.fire(
          "Cálculo Completado",
          message,
          "success"
        );
      }
    } catch (error) {
      setCalculandoPromedioParcial(false);
      console.error("❌ Error al calcular promedio parcial:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Error al calcular promedio parcial";
      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `<div style="text-align: left;">${errorMsg.replace(/\n/g, '<br>')}</div>`,
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleCalcularPromedioFinal = async () => {
    if (!codigoRamo) {
      Swal.fire("Aviso", "Selecciona un ramo primero", "info");
      return;
    }

    try {
      setCalculandoPromedioFinal(true);
      console.log("📊 Calculando promedio final para todos en ramo:", codigoRamo);
      const resultado = await calcularPromediosFinal(codigoRamo);
      setCalculandoPromedioFinal(false);
      
      console.log("✅ Resultado:", resultado);
      const message = resultado?.data?.message || "Promedio final calculado exitosamente";
      
      // Verificar si hay errores en la respuesta
      if (resultado?.data?.hasErrors) {
        Swal.fire({
          icon: 'error',
          title: 'Error en Ponderaciones',
          html: `<div style="text-align: left;">${message.replace(/\n/g, '<br>')}</div>`,
          confirmButtonText: 'Entendido'
        });
      } else {
        Swal.fire(
          "Cálculo Completado",
          message,
          "success"
        );
      }
    } catch (error) {
      setCalculandoPromedioFinal(false);
      console.error("❌ Error al calcular promedio final:", error);
      const errorMsg = error?.response?.data?.message || error?.message || "Error al calcular promedio final";
      Swal.fire({
        icon: 'error',
        title: 'Error',
        html: `<div style="text-align: left;">${errorMsg.replace(/\n/g, '<br>')}</div>`,
        confirmButtonText: 'Entendido'
      });
    }
  };

  const handleCrearIntegradora = () => {
    if (!codigoRamo) {
      Swal.fire("Aviso", "Selecciona un ramo primero", "info");
      return;
    }
    navigate(`/evaluacion/${codigoRamo}/crear-integradora`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#143A80]">{titulo}</h2>
        <div className="flex gap-2">
          {(user?.role === "profesor" || user?.role === "jefecarrera") && (
            <button
              onClick={handleCrearIntegradora}
              disabled={creadoIntegradora || isLoading}
              className={`rounded-xl px-4 py-2 text-sm font-semibold text-white transition flex items-center gap-2 ${
                creadoIntegradora 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
              title={creadoIntegradora ? "Evaluación integradora ya existe" : "Crear evaluación integradora"}
            >
              {creadoIntegradora ? (
                <>
                  ✓ Integradora Creada
                </>
              ) : (
                <>
                  📋 Crear Integradora
                </>
              )}
            </button>
          )}
          {(user?.role === "profesor" || user?.role === "jefecarrera") && (
            <>
              <button
                onClick={handleCalcularPromedioParcial}
                disabled={calculandoPromedioParcial || isLoading || evaluaciones.length === 0}
                className="rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:grayscale disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white disabled:text-gray-600 transition flex items-center gap-2"
              >
                {calculandoPromedioParcial ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    Calculando...
                  </>
                ) : (
                  <>
                    📊 Calcular Promedio Parcial
                  </>
                )}
              </button>
              <button
                onClick={handleCalcularPromedioFinal}
                disabled={calculandoPromedioFinal || isLoading || evaluaciones.length === 0}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:grayscale disabled:cursor-not-allowed px-4 py-2 text-sm font-semibold text-white disabled:text-gray-600 transition flex items-center gap-2"
              >
                {calculandoPromedioFinal ? (
                  <>
                    <span className="inline-block animate-spin">⟳</span>
                    Calculando...
                  </>
                ) : (
                  <>
                    📊 Calcular Promedio Final
                  </>
                )}
              </button>
            </>
          )}
          {(user?.role === "profesor" || user?.role === "jefecarrera") && onNuevaEvaluacion && (
            <button
              onClick={onNuevaEvaluacion}
              className="rounded-xl bg-[#113C63] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0D2D4A] transition"
            >
              + Nueva Evaluación
            </button>
          )}
        </div>
      </div>

      {isLoading && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
          Cargando evaluaciones…
        </div>
      )}

      {!isLoading && evaluaciones.length === 0 ? (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
          No hay evaluaciones registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-blue-200 bg-[#113C63]">
              <tr className="text-white">
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Horario</th>
                <th className="px-4 py-3 font-semibold">Pond.</th>
                <th className="px-4 py-3 font-semibold">Publicación</th>
                <th className="px-4 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-blue-100">
              {evaluacionesOrdenadas.map((ev) => {
                const publicada = Boolean(ev.publicada || ev.pautaPublicada);
                const estado = formatEstado(ev.estado);
                const fecha = formatFecha(ev.fecha, ev.fechaProgramada);
                const horario = formatHorario(ev.horaInicio, ev.horaFin);
                const ponderacion = (typeof ev.ponderacion !== "undefined" && ev.ponderacion !== null)
                  ? `${ev.ponderacion}%`
                  : "";

                return (
                  <tr key={ev.id} className="text-blue-900 hover:bg-blue-50">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-[#143A80]">{ev.titulo}</div>
                      {(ev.descripcion || ev.contenidos) && (
                        <div className="mt-1 max-w-[520px] text-xs text-blue-700/70">
                          {ev.descripcion || ev.contenidos}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {estado ? (
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                          ev.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                          ev.estado === "aplicada" ? "bg-green-100 text-green-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {estado}
                        </span>
                      ) : (
                        <span className="text-blue-300">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {fecha ? <span>{fecha}</span> : <span className="text-blue-300">—</span>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {horario ? <span>{horario}</span> : <span className="text-blue-300">—</span>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {ponderacion ? <span>{ponderacion}</span> : <span className="text-blue-300">—</span>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span
                        className={
                          publicada
                            ? "inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                            : "inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                        }
                      >
                        {publicada ? "Publicada" : "No publicada"}
                      </span>
                    </td>

                    <td className="px-4 py-3 align-top">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className={`rounded-lg text-white px-3 py-2 text-xs font-bold transition-colors ${
                            ev.idPauta ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                          onClick={() => handleVerPauta(ev)}
                          title={ev.idPauta ? "Editar pauta de evaluación" : "Crear pauta de evaluación"}
                        >
                          {ev.idPauta ? 'Editar Pauta' : 'Crear Pauta'}
                        </button>
                        <button
                          className="rounded-lg bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-xs font-bold transition-colors"
                          onClick={() => handleEvaluar(ev)}
                          title="Evaluar"
                        >
                          Evaluar
                        </button>
                        <button
                          className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-bold transition-colors"
                          onClick={() => onEdit(ev)}
                          title="Editar evaluación"
                        >
                          Editar
                        </button>
                        <button
                          className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-xs font-bold transition-colors"
                          onClick={() => handleDelete(ev.id)}
                          title="Eliminar evaluación"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Tabla de Evaluación Integradora */}
      {creadoIntegradora && evaluacionIntegradora && (
        <div>
          <h2 className="text-2xl font-bold text-[#143A80] mb-4">Evaluación Integradora</h2>
          <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white shadow">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-blue-200 bg-[#113C63]">
                <tr className="text-white">
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold">Fecha</th>
                  <th className="px-4 py-3 font-semibold">Horario</th>
                  <th className="px-4 py-3 font-semibold">Pond.</th>
                  <th className="px-4 py-3 font-semibold">Publicación</th>
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-blue-100">
                <tr className="text-blue-900 hover:bg-blue-50">
                  <td className="px-4 py-3 align-top">
                    <div className="font-semibold text-[#143A80]">{evaluacionIntegradora.titulo}</div>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                      evaluacionIntegradora.estado === "pendiente" ? "bg-yellow-100 text-yellow-800" :
                      evaluacionIntegradora.estado === "aplicada" ? "bg-green-100 text-green-800" :
                      "bg-blue-100 text-blue-800"
                    }`}>
                      {formatEstado(evaluacionIntegradora.estado)}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span>{formatFecha(evaluacionIntegradora.fecha, evaluacionIntegradora.fechaProgramada)}</span>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span>{formatHorario(evaluacionIntegradora.horaInicio, evaluacionIntegradora.horaFin)}</span>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span>{evaluacionIntegradora.ponderacion}%</span>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <span className={
                      evaluacionIntegradora.pautaPublicada
                        ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700"
                        : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700"
                    }>
                      {evaluacionIntegradora.pautaPublicada ? "Publicada" : "No publicada"}
                    </span>
                  </td>

                  <td className="px-4 py-3 align-top">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={`rounded-lg text-white px-3 py-2 text-xs font-bold transition-colors ${
                          evaluacionIntegradora.idPauta ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-blue-500 hover:bg-blue-600'
                        }`}
                        onClick={() => handleVerPautaIntegradora(evaluacionIntegradora)}
                        title={evaluacionIntegradora.idPauta ? "Editar pauta de evaluación" : "Crear pauta de evaluación"}
                      >
                        {evaluacionIntegradora.idPauta ? 'Editar Pauta' : 'Crear Pauta'}
                      </button>
                      <button
                        className="rounded-lg bg-green-500 hover:bg-green-600 text-white px-3 py-2 text-xs font-bold transition-colors"
                        onClick={() => handleEvaluarIntegradora(evaluacionIntegradora)}
                        title="Evaluar"
                      >
                        Evaluar
                      </button>
                      <button
                        className="rounded-lg bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 text-xs font-bold transition-colors"
                        onClick={() => onEdit({ ...evaluacionIntegradora, esIntegradora: true })}
                        title="Editar evaluación"
                      >
                        Editar
                      </button>
                      <button
                        className="rounded-lg bg-red-500 hover:bg-red-600 text-white px-3 py-2 text-xs font-bold transition-colors"
                        onClick={() => handleDelete(evaluacionIntegradora.id, true)}
                        title="Eliminar evaluación"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
