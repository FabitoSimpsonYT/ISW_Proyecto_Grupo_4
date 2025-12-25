import { useEffect, useMemo, useState } from "react";
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

export default function EvaluacionList({ onEdit, codigoRamo }) {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [publishingId, setPublishingId] = useState(null);
  const { user } = useAuth();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const data = codigoRamo
        ? await getEvaluacionesByCodigoRamo(codigoRamo)
        : await getAllEvaluaciones();
      setEvaluaciones(Array.isArray(data) ? data : []);
    } catch (e) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">{titulo}</h2>

      {isLoading && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white/80">
          Cargando evaluaciones…
        </div>
      )}

      {!isLoading && evaluaciones.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-white/70">
          No hay evaluaciones registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-sky-400/30 bg-gradient-to-b from-slate-900/60 to-slate-950/60 shadow">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-white/10 bg-white/5">
              <tr className="text-white/80">
                <th className="px-4 py-3 font-semibold">Título</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Horario</th>
                <th className="px-4 py-3 font-semibold">Pond.</th>
                <th className="px-4 py-3 font-semibold">Publicación</th>
                {user?.role === "profesor" && (
                  <th className="px-4 py-3 font-semibold">Acciones</th>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-white/10">
              {evaluaciones.map((ev) => {
                const publicada = Boolean(ev.publicada || ev.pautaPublicada);
                const estado = formatEstado(ev.estado);
                const fecha = formatFecha(ev.fecha, ev.fechaProgramada);
                const horario = formatHorario(ev.horaInicio, ev.horaFin);
                const ponderacion = (typeof ev.ponderacion !== "undefined" && ev.ponderacion !== null)
                  ? `${ev.ponderacion}%`
                  : "";

                return (
                  <tr key={ev.id} className="text-white/80 hover:bg-white/5">
                    <td className="px-4 py-3 align-top">
                      <div className="font-semibold text-white">{ev.titulo}</div>
                      {(ev.descripcion || ev.contenidos) && (
                        <div className="mt-1 max-w-[520px] text-xs text-white/60">
                          {ev.descripcion || ev.contenidos}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {estado ? (
                        <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/85">
                          {estado}
                        </span>
                      ) : (
                        <span className="text-white/40">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {fecha ? <span>{fecha}</span> : <span className="text-white/40">—</span>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {horario ? <span>{horario}</span> : <span className="text-white/40">—</span>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      {ponderacion ? <span>{ponderacion}</span> : <span className="text-white/40">—</span>}
                    </td>

                    <td className="px-4 py-3 align-top">
                      <span
                        className={
                          publicada
                            ? "inline-flex items-center rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-200"
                            : "inline-flex items-center rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200"
                        }
                      >
                        {publicada ? "Publicada" : "No publicada"}
                      </span>
                    </td>

                    {user?.role === "profesor" && (
                      <td className="px-4 py-3 align-top">
                        <div className="flex gap-2">
                          <button
                            className={
                              publicada
                                ? "rounded-lg bg-amber-500/15 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-500/25 transition"
                                : "rounded-lg bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 transition"
                            }
                            disabled={publishingId === ev.id}
                            onClick={() => handleTogglePublicacion(ev)}
                            title={publicada ? "Despublicar evaluación" : "Publicar evaluación"}
                          >
                            {publishingId === ev.id ? "Guardando…" : (publicada ? "Despublicar" : "Publicar")}
                          </button>
                          <button
                            className="rounded-lg bg-blue-600/80 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition"
                            onClick={() => onEdit(ev)}
                          >
                            Editar
                          </button>
                          <button
                            className="rounded-lg bg-rose-700/40 px-3 py-2 text-xs font-semibold text-rose-200 hover:bg-rose-700/55 transition"
                            onClick={() => handleDelete(ev.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
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
