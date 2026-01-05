import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import EvaluacionList from "../components/EvaluacionList.jsx";
import EvaluacionForm from "../components/EvaluacionForm.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavbar } from "../context/NavbarContext.jsx";
import { getMisRamos } from "../services/ramos.service.js";

export default function EvaluacionPage() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
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
  const [selectedPeriodo, setSelectedPeriodo] = useState("");

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

  // Extraer períodos únicos de los ramos (formato YYYY-P)
  const periodosUnicos = useMemo(() => {
    const periodos = new Set();
    ramos.forEach(ramo => {
      // El código viene en formato 620515-2025-2, extraer año-período
      const partes = ramo.codigo?.split('-');
      if (partes && partes.length >= 3) {
        const yearPeriod = `${partes[1]}-${partes[2]}`;
        periodos.add(yearPeriod);
      }
    });
    return Array.from(periodos).sort().reverse();
  }, [ramos]);

  // Establecer el período más reciente por defecto
  useEffect(() => {
    if (periodosUnicos.length > 0 && !selectedPeriodo) {
      setSelectedPeriodo(periodosUnicos[0]); // El primero es el más reciente (ya ordenado en reversa)
    }
  }, [periodosUnicos]);

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

  // Filtrar ramos por período seleccionado
  const ramosFiltrados = useMemo(() => {
    if (!selectedPeriodo) return ramos;
    return ramos.filter(ramo => {
      const partes = ramo.codigo?.split('-');
      if (partes && partes.length >= 3) {
        const yearPeriod = `${partes[1]}-${partes[2]}`;
        return yearPeriod === selectedPeriodo;
      }
      return false;
    });
  }, [ramos, selectedPeriodo]);

  return (
    <div className={`min-h-screen bg-[#e9f7fb] transition-all duration-300 ${isNavbarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
      <div>
        <div className="mx-auto max-w-6xl p-3 md:p-6">
        {!selectedRamo ? (
          <div className="space-y-4 md:space-y-6">
            {/* Encabezado expandido estilo Gestión de Usuarios, sin ícono */}
            <div className="mt-2">
              <div className="bg-[#143A80] rounded-lg px-4 md:px-6 py-3 md:py-4 w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
                <h1 className="text-xl md:text-3xl font-bold text-white">Mis Ramos</h1>
                {periodosUnicos.length > 0 && (
                  <select
                    value={selectedPeriodo}
                    onChange={(e) => setSelectedPeriodo(e.target.value)}
                    className="w-full md:w-auto px-3 md:px-4 py-2 rounded-lg text-sm md:text-base font-medium bg-white text-[#143A80] border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer"
                  >
                    <option value="">Todos los períodos</option>
                    {periodosUnicos.map(periodo => (
                      <option key={periodo} value={periodo}>
                        {periodo}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <p className="mt-2 text-xs md:text-base text-[#143A80] font-medium">Selecciona un ramo para gestionar sus evaluaciones</p>
            </div>

            {errorRamos && (
              <div className="rounded-xl md:rounded-2xl border border-red-400 bg-red-100 p-3 md:p-4 text-xs md:text-base text-red-700">
                {errorRamos}
              </div>
            )}

            {isLoadingRamos ? (
              <div className="rounded-xl md:rounded-2xl border border-blue-200 bg-blue-50 p-4 md:p-6 text-xs md:text-base text-blue-700">
                Cargando ramos…
              </div>
            ) : (
              <div className="space-y-3 md:space-y-5">
                {ramosFiltrados.map((ramo) => (
                  <button
                    type="button"
                    key={ramo.id || ramo.codigo}
                    onClick={() => handleSelectRamo(ramo)}
                    className="group w-full rounded-xl md:rounded-2xl border border-blue-200 bg-white p-4 md:p-6 text-left shadow hover:border-blue-400 transition"
                  >
                    <div className="flex items-start justify-between gap-3 md:gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="text-lg md:text-2xl font-semibold text-[#143A80] truncate">{ramo.nombre}</div>
                        <div className="mt-1 text-xs md:text-sm font-medium text-blue-700">{ramo.codigo}</div>
                        <div className="mt-2 md:mt-4 text-xs md:text-sm text-[#143A80]/70">Gestionar evaluaciones</div>
                      </div>

                      <div className="shrink-0">
                        <div className="flex h-8 md:h-10 w-8 md:w-10 items-center justify-center rounded-lg md:rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-100 text-lg md:text-2xl">
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
          <div className="space-y-4 md:space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-4">
              <div className="flex-1 w-full">
                <button
                  type="button"
                  onClick={handleBackToRamos}
                  className="mb-2 md:mb-3 text-blue-700 hover:text-blue-900 transition font-medium text-sm md:text-base"
                >
                  ← Volver
                </button>
                <h1 className="text-2xl md:text-4xl font-bold text-[#113C63]">{selectedRamo?.nombre}</h1>
                <div className="mt-1 text-xs md:text-sm font-medium text-blue-600">{selectedRamo?.codigo}</div>
              </div>
            </div>

            {!(user?.role === "profesor" || user?.role === "jefecarrera") && (
              <div className="rounded-lg md:rounded-2xl border border-blue-200 bg-blue-50 p-3 md:p-4 text-xs md:text-base text-blue-700">
                Solo profesores o jefes de carrera pueden crear o editar evaluaciones.
              </div>
            )}

            {(user?.role === "profesor" || user?.role === "jefecarrera") && showForm && (
              <div className="rounded-lg md:rounded-2xl border border-blue-200 bg-transparent p-3 md:p-4">
                <div className="flex items-center justify-between gap-2 md:gap-4 mb-3 md:mb-4 bg-[#113C63] text-white px-3 md:px-4 py-2 md:py-3 rounded-lg md:rounded-xl">
                  <h2 className="text-sm md:text-xl font-bold">
                    {selectedEvaluacion ? "Editar Evaluación" : "Nueva Evaluación"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="text-white hover:text-red-200 font-bold text-lg md:text-xl"
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
