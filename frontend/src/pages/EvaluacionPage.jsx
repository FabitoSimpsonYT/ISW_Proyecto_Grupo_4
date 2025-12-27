import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import EvaluacionList from "../components/EvaluacionList.jsx";
import EvaluacionForm from "../components/EvaluacionForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { getMisRamos } from "../services/ramos.service.js";

export default function EvaluacionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Solo profesores y jefes de carrera pueden ver esta página
  if (user && user.role !== "profesor" && user.role !== "jefecarrera" && user.role !== "admin") {
    return <Navigate to="/home" replace />;
  }

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

  // Al inicio del componente, si hay un query param ramo, selecciona ese ramo automáticamente:
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const codigoRamo = params.get("ramo");
    if (codigoRamo && ramos.length > 0) {
      const found = ramos.find(r => r.codigo === codigoRamo);
      if (found) setSelectedRamo(found);
    }
  }, [location.search, ramos]);

  const handleNuevaEvaluacion = () => {
    try {
      setSelectedEvaluacion(null);
      setShowForm(true);
    } catch (error) {
      console.error("Error en handleNuevaEvaluacion:", error);
    }
  };

  const handleEdit = (ev) => {
    setSelectedEvaluacion(ev);
    setShowForm(true);
  };

  const handleSelectRamo = (ramo) => {
    setSelectedRamo(ramo);
    navigate(`/evaluaciones?ramo=${ramo.codigo}`);
  };

  const handleBackToRamos = () => {
    setSelectedRamo(null);
    setSelectedEvaluacion(null);
    setShowForm(false);
    navigate("/evaluaciones");
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
                    type="button"
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
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <button
                  type="button"
                  onClick={handleBackToRamos}
                  className="mb-3 text-blue-700 hover:text-blue-900 transition font-medium"
                >
                  ← Volver
                </button>
                <h1 className="text-4xl font-bold text-[#113C63]">{selectedRamo?.nombre}</h1>
                <div className="mt-1 text-sm font-medium text-blue-600">{selectedRamo?.codigo}</div>
              </div>
            </div>

            {!(user?.role === "profesor" || user?.role === "jefecarrera") && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-blue-700">
                Solo profesores o jefes de carrera pueden crear o editar evaluaciones.
              </div>
            )}

            {(user?.role === "profesor" || user?.role === "jefecarrera") && showForm && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <h2 className="text-xl font-bold text-[#143A80]">
                    {selectedEvaluacion ? "Editar Evaluación" : "Nueva Evaluación"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-red-600 hover:text-red-800 font-bold text-xl"
                  >
                    ✕
                  </button>
                </div>
                <EvaluacionForm
                  evaluacionEdit={selectedEvaluacion}
                  onSaved={handleSaved}
                  ramo={selectedRamo}
                  hideRamoFields
                  isIntegradora={selectedEvaluacion?.esIntegradora || false}
                />
              </div>
            )}

            <EvaluacionList
              onEdit={handleEdit}
              key={`${reload}-${selectedRamo?.codigo || ""}`}
              codigoRamo={selectedRamo?.codigo}
              onNuevaEvaluacion={handleNuevaEvaluacion}
            />
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
