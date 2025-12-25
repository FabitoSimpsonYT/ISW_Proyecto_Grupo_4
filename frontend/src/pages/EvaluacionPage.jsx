import { useEffect, useMemo, useState } from "react";
import EvaluacionList from "../components/EvaluacionList.jsx";
import EvaluacionForm from "../components/EvaluacionForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getMisRamos } from "../services/ramos.service.js";

export default function EvaluacionPage() {
  const defaultRamos = useMemo(
    () => [
      { nombre: "Ingeniería de Software", codigo: "ISW0101" },
      { nombre: "Ingeniería de Software", codigo: "INF1234" },
      { nombre: "Ingeniería de Software", codigo: "INF1232" },
    ],
    []
  );

  const [ramos, setRamos] = useState([]);
  const [isLoadingRamos, setIsLoadingRamos] = useState(false);
  const [errorRamos, setErrorRamos] = useState("");
  const [selectedRamo, setSelectedRamo] = useState(null);

  const [selectedEvaluacion, setSelectedEvaluacion] = useState(null);
  const [reload, setReload] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();

  const handleSaved = () => {
    setSelectedEvaluacion(null);
    setShowForm(false);
    setReload(!reload);
  };

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoadingRamos(true);
      setErrorRamos("");
      try {
        const data = await getMisRamos();
        if (!isMounted) return;
        // Filtrar solo los ramos dictados por el profesor (usuario actual)
        const arr = Array.isArray(data)
          ? data.filter(r => r.profesor && r.profesor.rut === user?.rut)
          : [];
        setRamos(arr);
      } catch (e) {
        if (!isMounted) return;
        setErrorRamos(e?.message || "Error al cargar ramos");
        setRamos([]);
      } finally {
        if (!isMounted) return;
        setIsLoadingRamos(false);
      }
    };
    load();
    return () => {
      isMounted = false;
    };
  }, [user]);
  const handleNuevaEvaluacion = () => {
    setSelectedEvaluacion(null);
    setShowForm(true);
  };

  const handleEdit = (ev) => {
    setSelectedEvaluacion(ev);
    setShowForm(true);
  };

  return (
    <div className="min-h-screen bg-[#e9f7fb]">
      <div>
        <div className="mx-auto max-w-6xl p-6">
        {!selectedRamo ? (
          <div className="space-y-6">
            {/* Encabezado expandido estilo Gestión de Usuarios, sin ícono */}
            <div className="mt-2">
              <div className="bg-[#143A80] rounded-lg px-6 py-4 w-full">
                <h1 className="text-3xl font-bold text-white">Mis Ramos</h1>
              </div>
              <p className="mt-2 text-[#143A80] font-medium">Selecciona un ramo para gestionar sus evaluaciones</p>
            </div>

            {errorRamos && (
              <div className="rounded-2xl border border-red-400 bg-red-100 p-4 text-red-700">
                {errorRamos}
              </div>
            )}

            {isLoadingRamos ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
                Cargando ramos…
              </div>
            ) : (
              <div className="space-y-5">
                {ramos.map((ramo) => (
                  <button
                    key={ramo.id || ramo.codigo}
                    onClick={() => handleSelectRamo(ramo)}
                    className="group w-full rounded-2xl border border-blue-200 bg-white p-6 text-left shadow hover:border-blue-400 transition"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-2xl font-semibold text-[#143A80]">{ramo.nombre}</div>
                        <div className="mt-1 text-sm font-medium text-blue-700">{ramo.codigo}</div>
                        <div className="mt-4 text-sm text-[#143A80]/70">Gestionar evaluaciones</div>
                      </div>

                      <div className="shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-100">
                          ›
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <button
              onClick={handleBackToRamos}
              className="text-blue-700 hover:text-blue-900 transition"
            >
              ✕
            </button>

            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-4xl font-bold text-[#113C63]">{tituloRamo.nombre}</h1>
                <div className="mt-1 text-sm font-medium text-blue-600">{tituloRamo.codigo}</div>
              </div>

              {(user?.role === "profesor" || user?.role === "jefecarrera") && (
                <button
                  onClick={handleNuevaEvaluacion}
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition"
                >
                  + Nueva Evaluación
                </button>
              )}
            </div>

            {!(user?.role === "profesor" || user?.role === "jefecarrera") && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                Solo profesores o jefes de carrera pueden crear o editar evaluaciones.
              </div>
            )}

            {(user?.role === "profesor" || user?.role === "jefecarrera") && showForm && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <EvaluacionForm
                  evaluacionEdit={selectedEvaluacion}
                  onSaved={handleSaved}
                  ramo={selectedRamo}
                  hideRamoFields
                />
              </div>
            )}

            <EvaluacionList
              onEdit={handleEdit}
              key={`${reload}-${selectedRamo?.codigo || ""}`}
              codigoRamo={selectedRamo?.codigo}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
