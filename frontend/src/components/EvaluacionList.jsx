import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteEvaluacion,
  getAllEvaluaciones,
  getEvaluacionesByCodigoRamo,
  updateEvaluacion,
} from "../services/evaluacion.service.js";
import { useAuth } from "../context/AuthContext.jsx";

function formatEstado(estado) {
  if (!estado) return "";
  const normalized = String(estado).toLowerCase();
  if (normalized === "pendiente") return "Pendiente";
  if (normalized === "aplicada") return "Aplicada";
  if (normalized === "finalizada") return "Finalizada";
  return estado;
}

function formatFecha(fecha, fechaProgramada) {
  return fecha || fechaProgramada || "";
}

function formatHorario(horaInicio, horaFin) {
  if (!horaInicio && !horaFin) return "";
  if (horaInicio && horaFin) return `${horaInicio} - ${horaFin}`;
  return horaInicio || horaFin;
}

export default function EvaluacionList({ onEdit, codigoRamo, onNuevaEvaluacion }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
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

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("¿Estás seguro de eliminar esta evaluación?");
    if (confirmDelete) {
      await deleteEvaluacion(id);
      setEvaluaciones(evaluaciones.filter((e) => e.id !== id));
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
      alert(msg);
    } finally {
      setPublishingId(null);
    }
  };

  const handleVerPauta = (ev) => {
    if (!ev?.id || !codigoRamo) return;
    navigate(`/evaluacion/${codigoRamo}/${ev.id}/pauta`);
  };

  const handleEvaluar = (ev) => {
    if (!ev?.id || !codigoRamo) return;
    navigate(`/evaluacion/${codigoRamo}/${ev.id}/evaluar`);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#143A80]">{titulo}</h2>
        {(user?.role === "profesor" || user?.role === "jefecarrera") && onNuevaEvaluacion && (
          <button
            onClick={onNuevaEvaluacion}
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition"
          >
            + Nueva Evaluación
          </button>
        )}
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
                        <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700">
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
    </div>
  );
}
