import { useEffect, useState, useMemo } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getMisRamos, getProfesorByRut } from "../services/ramos.service.js";
import { getEvaluacionesByCodigoRamo, getPautaEvaluadaByAlumno, getPautaEvaluadaCompleta } from "../services/evaluacion.service.js";
import { getPromedioFinal } from "../services/alumnoPromedioRamo.service.js";
import { getEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { getPautaEvaluadaIntegradora } from "../services/pautaEvaluada.service.js";
import { BotonRetroalimentacion } from "../components/BotonRetroalimentacion.jsx";

export default function MisRamosNotasPage() {
  const [ramos, setRamos] = useState([]);
  const [isLoadingRamos, setIsLoadingRamos] = useState(false);
  const [errorRamos, setErrorRamos] = useState("");
  const [selectedRamo, setSelectedRamo] = useState(null);
  const [profesores, setProfesores] = useState({});
  const [isLoadingProfesor, setIsLoadingProfesor] = useState(false);
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [isLoadingEvaluaciones, setIsLoadingEvaluaciones] = useState(false);
  const [errorEvaluaciones, setErrorEvaluaciones] = useState("");
  const [notasAlumno, setNotasAlumno] = useState({});
  const [evaluacionIntegradora, setEvaluacionIntegradora] = useState(null);
  const [notaIntegradora, setNotaIntegradora] = useState(null);
  const [selectedPauta, setSelectedPauta] = useState(null);
  const [isLoadingPauta, setIsLoadingPauta] = useState(false);
  const [promedioRamo, setPromedioRamo] = useState(null);
  const [isLoadingPromedio, setIsLoadingPromedio] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Solo alumnos pueden ver esta página
  if (user && user.role !== "alumno") {
    return <Navigate to="/home" replace />;
  }

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setIsLoadingRamos(true);
      setErrorRamos("");
      try {
        const data = await getMisRamos();
        if (!isMounted) return;
        setRamos(Array.isArray(data) ? data : []);

        // Cargar información de profesores por RUT
        if (Array.isArray(data)) {
          const rutProfesorSet = new Set(
            data.map(r => r.rutProfesor).filter(Boolean)
          );
          
          for (const rut of rutProfesorSet) {
            try {
              const profesor = await getProfesorByRut(rut);
              if (isMounted) {
                setProfesores(prev => ({ ...prev, [rut]: profesor }));
              }
            } catch (err) {
              console.error(`Error al cargar profesor con RUT ${rut}:`, err);
            }
          }
        }
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

  const getProfesorNombre = (rutProfesor) => {
    if (!rutProfesor || !profesores[rutProfesor]) {
      return "Profesor no disponible";
    }
    const prof = profesores[rutProfesor];
    return `${prof.nombre} ${prof.apellidoPaterno} ${prof.apellidoMaterno}`;
  };

  const handleSelectRamo = async (ramo) => {
    setSelectedRamo(ramo);
    setIsLoadingEvaluaciones(true);
    setIsLoadingPromedio(true);
    setErrorEvaluaciones("");
    setNotasAlumno({});
    setPromedioRamo(null);
    setEvaluacionIntegradora(null);
    setNotaIntegradora(null);
    console.log("Seleccionando ramo:", ramo);
    try {
      const data = await getEvaluacionesByCodigoRamo(ramo.codigo);
      console.log("Evaluaciones cargadas:", data);
      if (Array.isArray(data)) {
        setEvaluaciones(data);
        
        // Cargar notas del alumno para cada evaluación
        for (const evaluacion of data) {
          try {
            // Obtener la pauta evaluada del alumno actual
            const pauta = await getPautaEvaluadaByAlumno(evaluacion.id, user.rut);
            console.log(`Pauta de evaluación ${evaluacion.id}:`, pauta);
            
            if (pauta) {
              setNotasAlumno(prev => ({ 
                ...prev, 
                [evaluacion.id]: pauta.notaFinal || null 
              }));
            }
          } catch (err) {
            console.error(`Error al cargar pauta de evaluación ${evaluacion.id}:`, err);
          }
        }
      } else {
        console.log("Data no es array:", data);
        setEvaluaciones([]);
      }

      // Cargar evaluación integradora si existe
      try {
        const integradora = await getEvaluacionIntegradora(ramo.codigo);
        if (integradora?.data) {
          setEvaluacionIntegradora(integradora.data);
          
          // Cargar nota de evaluación integradora
          try {
            const pautaIntegradora = await getPautaEvaluadaIntegradora(integradora.data.id, user.rut);
            console.log("Pauta integradora:", pautaIntegradora);
            if (pautaIntegradora) {
              setNotaIntegradora(pautaIntegradora.notaFinal || null);
            }
          } catch (err) {
            console.error("Error al cargar pauta integradora:", err);
            setNotaIntegradora(null);
          }
        }
      } catch (err) {
        console.error("Error al cargar evaluación integradora:", err);
        setEvaluacionIntegradora(null);
      }

      // Cargar promedio del ramo
      try {
        const promedio = await getPromedioFinal(ramo.codigo, user.rut);
        console.log("Promedio cargado:", promedio);
        setPromedioRamo(promedio.data || promedio);
      } catch (err) {
        console.error("Error al cargar promedio:", err);
        setPromedioRamo(null);
      }
    } catch (error) {
      console.error("Error al cargar evaluaciones:", error);
      setErrorEvaluaciones(error?.message || "Error al cargar evaluaciones");
      setEvaluaciones([]);
    } finally {
      setIsLoadingEvaluaciones(false);
      setIsLoadingPromedio(false);
    }
  };

  const handleBackToRamos = () => {
    setSelectedRamo(null);
    setEvaluaciones([]);
    setNotasAlumno({});
    setPromedioRamo(null);
    setEvaluacionIntegradora(null);
    setNotaIntegradora(null);
  };

  // Ordenar evaluaciones por fechaProgramada (más antiguo al más nuevo) e incluir integradora
  const evaluacionesOrdenadas = useMemo(() => {
    const todas = [...evaluaciones];
    
    // Agregar la evaluación integradora si existe
    if (evaluacionIntegradora) {
      todas.push({
        ...evaluacionIntegradora,
        esIntegradora: true,
        notaFinal: notaIntegradora
      });
    }
    
    return todas.sort((a, b) => {
      const dateA = new Date(a.fechaProgramada || a.fecha || 0).getTime();
      const dateB = new Date(b.fechaProgramada || b.fecha || 0).getTime();
      return dateA - dateB; // Orden ascendente (más antiguo primero)
    });
  }, [evaluaciones, evaluacionIntegradora, notaIntegradora]);

  const handleVerMasPauta = async (evaluacionId) => {
    setIsLoadingPauta(true);
    try {
      const evaluacion = evaluaciones.find(e => e.id === evaluacionId);
      
      // Cargar los detalles completos de la pauta evaluada
      const pautaCompleta = await getPautaEvaluadaCompleta(evaluacionId, user.rut);
      
      console.log("Pauta completa cargada:", pautaCompleta);
      
      // Construir tabla de criterios con puntajes
      let criteriosDesglose = [];
      if (pautaCompleta?.puntajesObtenidos && pautaCompleta?.idPauta) {
        // Los puntajes obtenidos vienen en un objeto {criterio: puntaje}
        criteriosDesglose = Object.entries(pautaCompleta.puntajesObtenidos).map(([criterio, puntajeObtenido]) => ({
          criterio,
          puntajeObtenido: parseFloat(puntajeObtenido) || 0
        }));
        console.log("Criterios desglose:", criteriosDesglose);
      }
      
      setSelectedPauta({
        evaluacion,
        pautaCompleta,
        criteriosDesglose
      });
    } catch (error) {
      console.error("Error al cargar pauta:", error);
      setSelectedPauta(null);
    } finally {
      setIsLoadingPauta(false);
    }
  };

  const handleVerMasPautaIntegradora = async () => {
    setIsLoadingPauta(true);
    try {
      // Recargar la evaluación integradora para obtener datos actualizados
      const evaluacionActualizada = await getEvaluacionIntegradora(selectedRamo.codigo);
      let integrador = evaluacionIntegradora;
      
      if (evaluacionActualizada?.data) {
        integrador = evaluacionActualizada.data;
        setEvaluacionIntegradora(evaluacionActualizada.data);
      }
      
      // Cargar los detalles completos de la pauta evaluada integradora
      const pautaCompleta = await getPautaEvaluadaIntegradora(integrador.id, user.rut);
      
      console.log("Pauta integradora completa cargada:", pautaCompleta);
      
      // Actualizar la nota integradora
      if (pautaCompleta?.notaFinal) {
        setNotaIntegradora(pautaCompleta.notaFinal);
      }
      
      // Construir tabla de criterios con puntajes
      let criteriosDesglose = [];
      if (pautaCompleta?.puntajesObtenidos && pautaCompleta?.idPauta) {
        // Los puntajes obtenidos vienen en un objeto {criterio: puntaje}
        criteriosDesglose = Object.entries(pautaCompleta.puntajesObtenidos).map(([criterio, puntajeObtenido]) => ({
          criterio,
          puntajeObtenido: parseFloat(puntajeObtenido) || 0
        }));
        console.log("Criterios desglose integradora:", criteriosDesglose);
      }
      
      setSelectedPauta({
        evaluacion: integrador,
        pautaCompleta,
        criteriosDesglose,
        esIntegradora: true,
        notaFinal: pautaCompleta?.notaFinal || null
      });
    } catch (error) {
      console.error("Error al cargar pauta integradora:", error);
      setSelectedPauta(null);
    } finally {
      setIsLoadingPauta(false);
    }
  };

  const handleClosePautaModal = () => {
    setSelectedPauta(null);
  };

  return (
    <div className="min-h-screen bg-[#e9f7fb]">
      <div>
        <div className="mx-auto max-w-6xl p-6">
          {!selectedRamo ? (
            <div className="space-y-6">
              {/* Encabezado */}
              <div className="mt-2">
                <div className="bg-[#143A80] rounded-lg px-6 py-4 w-full">
                  <h1 className="text-3xl font-bold text-white">Mis Ramos</h1>
                </div>
                <p className="mt-2 text-[#143A80] font-medium">
                  {user?.role === "alumno"
                    ? "Ramos en los que estás inscrito"
                    : "Ramos que dictás"}
                </p>
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
              ) : ramos.length === 0 ? (
                <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
                  No tienes ramos inscritos.
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
                          <div className="text-2xl font-semibold text-[#143A80]">
                            {ramo.nombre}
                          </div>
                          <div className="mt-1 text-sm font-medium text-blue-700">
                            {ramo.codigo}
                          </div>
                          {ramo.rutProfesor && (
                            <div className="mt-2 text-sm text-[#143A80]/70">
                              Profesor: {getProfesorNombre(ramo.rutProfesor)}
                            </div>
                          )}
                          <div className="mt-4 text-sm text-[#143A80]/70">
                            Ver detalles
                          </div>
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
                  <h1 className="text-4xl font-bold text-[#113C63]">
                    {selectedRamo?.nombre}
                  </h1>
                  <div className="mt-1 text-sm font-medium text-blue-600">
                    {selectedRamo?.codigo}
                  </div>
                  {selectedRamo?.rutProfesor && (
                    <div className="mt-2 text-sm text-[#113C63]/70">
                      Profesor: {getProfesorNombre(selectedRamo.rutProfesor)}
                    </div>
                  )}
                </div>
              </div>

              {/* Detalles del ramo */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRamo?.secciones && selectedRamo.secciones.length > 0 && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <h3 className="font-bold text-[#143A80] mb-3">Secciones</h3>
                    <div className="space-y-2">
                      {selectedRamo.secciones.map((seccion) => (
                        <div
                          key={seccion.id}
                          className="bg-white p-3 rounded-lg border border-blue-100"
                        >
                          <div className="font-semibold text-[#143A80]">
                            Sección {seccion.numero}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedRamo?.creditos && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
                    <h3 className="font-bold text-[#143A80] mb-3">Información</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="font-medium text-[#143A80]">Créditos:</span>{" "}
                        <span className="text-[#143A80]/70">
                          {selectedRamo.creditos}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tabla de Evaluaciones y Notas */}
              <div>
                <h3 className="text-xl font-bold text-[#143A80] mb-4">Evaluaciones y Notas</h3>
                
                {isLoadingEvaluaciones ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
                    Cargando evaluaciones…
                  </div>
                ) : errorEvaluaciones ? (
                  <div className="rounded-2xl border border-red-400 bg-red-100 p-4 text-red-700">
                    {errorEvaluaciones}
                  </div>
                ) : evaluaciones.length === 0 ? (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
                    No hay evaluaciones disponibles para este ramo.
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-blue-200 bg-white">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-[#143A80] text-white">
                          <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                          <th className="px-6 py-3 text-left font-semibold">Fecha Programada</th>
                          <th className="px-6 py-3 text-center font-semibold">Ponderación</th>
                          <th className="px-6 py-3 text-center font-semibold">Nota</th>
                          <th className="px-6 py-3 text-center font-semibold">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {evaluacionesOrdenadas.map((evaluacion) => {
                          const nota = evaluacion.esIntegradora ? notaIntegradora : notasAlumno[evaluacion.id];
                          
                          return (
                            <tr
                              key={evaluacion.id}
                              className={`border-b border-blue-200 hover:bg-blue-50 transition ${evaluacion.esIntegradora ? 'bg-blue-100 border-l-4 border-l-blue-700' : ''}`}
                            >
                              <td className="px-6 py-4 text-[#143A80] font-medium">
                                <div className="flex items-center gap-2">
                                  <span>{evaluacion.nombre || evaluacion.titulo}</span>
                                  {evaluacion.esIntegradora && <span className="text-xs font-bold text-blue-700 bg-blue-200 px-2 py-1 rounded">INTEGRADORA</span>}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-[#143A80]/70">
                                {evaluacion.fechaProgramada
                                  ? new Date(evaluacion.fechaProgramada).toLocaleDateString(
                                      "es-CL"
                                    )
                                  : "-"}
                              </td>
                              <td className="px-6 py-4 text-center font-semibold text-[#143A80]">
                                {evaluacion.ponderacion ? `${evaluacion.ponderacion}%` : "-"}
                              </td>
                              <td className="px-6 py-4 text-center">
                                {nota === null || nota === undefined ? (
                                  <span className="text-slate-500">—</span>
                                ) : (
                                  <button
                                    onClick={() => evaluacion.esIntegradora ? handleVerMasPautaIntegradora() : handleVerMasPauta(evaluacion.id)}
                                    className={`font-semibold px-3 py-1 rounded-lg transition ${
                                      parseFloat(nota) < 4.0 
                                        ? 'text-red-600 hover:bg-red-50' 
                                        : 'text-blue-600 hover:bg-blue-50'
                                    }`}
                                  >
                                    {parseFloat(nota).toFixed(1)}
                                  </button>
                                )}
                              </td>
                              <td className="px-6 py-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  {nota && (
                                    <button
                                      onClick={() => evaluacion.esIntegradora ? handleVerMasPautaIntegradora() : handleVerMasPauta(evaluacion.id)}
                                      className="inline-block px-4 py-2 rounded-lg font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                                    >
                                      Ver más
                                    </button>
                                  )}
                                  {nota && (
                                    <BotonRetroalimentacion
                                      codigoRamo={selectedRamo?.codigo}
                                      alumnoRut={user?.rut}
                                      evaluacionId={!evaluacion.esIntegradora ? evaluacion.id : null}
                                      evaluacionIntegradoraId={evaluacion.esIntegradora ? evaluacion.id : null}
                                      label="Chat"
                                      variante="mis-notas"
                                    />
                                  )}
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

              {/* Sección de Promedios */}
              {!isLoadingEvaluaciones && evaluaciones.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-xl font-bold text-[#143A80] mb-6">Resumen de Calificaciones</h3>
                  
                  {isLoadingPromedio ? (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
                      Cargando promedios…
                    </div>
                  ) : promedioRamo ? (
                    <div className="rounded-2xl bg-[#143A80] p-8 text-white">
                      <div className="grid grid-cols-3 gap-8">
                        {/* Promedio Parcial */}
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-blue-100 mb-4">Promedio Parcial</p>
                          {promedioRamo.promedioParcial !== null && promedioRamo.promedioParcial !== undefined ? (
                            <div className={`flex items-center justify-center w-20 h-20 rounded-lg font-bold text-white text-3xl ${
                              promedioRamo.promedioParcial < 4.0 ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              {promedioRamo.promedioParcial.toFixed(1)}
                            </div>
                          ) : (
                            <p className="text-3xl font-bold">—</p>
                          )}
                        </div>

                        {/* Evaluación Integradora */}
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-blue-100 mb-4">Evaluación Integradora</p>
                          {promedioRamo.notaIntegradora !== null && promedioRamo.notaIntegradora !== undefined ? (
                            <div className={`flex items-center justify-center w-20 h-20 rounded-lg font-bold text-white text-3xl ${
                              promedioRamo.notaIntegradora < 4.0 ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              {promedioRamo.notaIntegradora.toFixed(1)}
                            </div>
                          ) : (
                            <p className="text-3xl font-bold">—</p>
                          )}
                        </div>

                        {/* Promedio Final */}
                        <div className="flex flex-col items-center">
                          <p className="text-sm font-medium text-blue-100 mb-4">Promedio Final</p>
                          {promedioRamo.promedioFinal !== null && promedioRamo.promedioFinal !== undefined ? (
                            <div className={`flex items-center justify-center w-20 h-20 rounded-lg font-bold text-white text-3xl ${
                              promedioRamo.promedioFinal < 4.0 ? 'bg-red-500' : 'bg-green-500'
                            }`}>
                              {promedioRamo.promedioFinal.toFixed(1)}
                            </div>
                          ) : (
                            <p className="text-3xl font-bold">—</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6 text-blue-700">
                      Aún no hay promedio registrado.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de Pauta Evaluada */}
      {selectedPauta && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#143A80] text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Detalle de Evaluación</h2>
              <button
                onClick={handleClosePautaModal}
                className="text-white hover:bg-[#0f2a5a] p-2 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {isLoadingPauta ? (
              <div className="p-6 text-center">
                <p className="text-[#143A80]">Cargando detalles...</p>
              </div>
            ) : !selectedPauta.pautaCompleta ? (
              <div className="p-6">
                <p className="text-red-600">No hay pauta evaluada para esta evaluación</p>
              </div>
            ) : (
              <div className="p-6 space-y-6">
                {/* Información de la Evaluación */}
                <div>
                  <h3 className="text-lg font-bold text-[#143A80] mb-3">Evaluación</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div>
                      <span className="font-semibold text-[#143A80]">Nombre:</span>
                      <p className="text-[#143A80]/80">{selectedPauta.evaluacion?.nombre || selectedPauta.evaluacion?.titulo || "-"}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-[#143A80]">Tipo:</span>
                      <p className="text-[#143A80]/80">
                        {selectedPauta.esIntegradora ? "Evaluación Integradora" : "Evaluación Regular"}
                      </p>
                    </div>
                    <div>
                      <span className="font-semibold text-[#143A80]">Fecha Programada:</span>
                      <p className="text-[#143A80]/80">
                        {selectedPauta.evaluacion?.fechaProgramada
                          ? new Date(selectedPauta.evaluacion.fechaProgramada).toLocaleDateString("es-CL")
                          : "-"}
                      </p>
                    </div>
                    {selectedPauta.evaluacion?.fechaCierre && (
                      <div>
                        <span className="font-semibold text-[#143A80]">Fecha de Cierre:</span>
                        <p className="text-[#143A80]/80">
                          {new Date(selectedPauta.evaluacion.fechaCierre).toLocaleDateString("es-CL")}
                        </p>
                      </div>
                    )}
                    {selectedPauta.evaluacion?.descripcion && (
                      <div>
                        <span className="font-semibold text-[#143A80]">Descripción:</span>
                        <p className="text-[#143A80]/80">{selectedPauta.evaluacion.descripcion}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Calificación */}
                <div>
                  <h3 className="text-lg font-bold text-[#143A80] mb-3">Calificación</h3>
                  <div className="bg-green-50 rounded-lg p-6">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-sm text-[#143A80]/70 mb-2">Puntaje Obtenido</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {selectedPauta.pautaCompleta?.puntajesObtenidos
                            ? Math.round(Object.values(selectedPauta.pautaCompleta.puntajesObtenidos).reduce((sum, val) => sum + parseFloat(val || 0), 0))
                            : "-"}
                        </p>
                      </div>
                      <div className="text-center border-l border-l border-green-200">
                        <p className="text-sm text-[#143A80]/70 mb-2">Puntaje Total</p>
                        <p className="text-3xl font-bold text-blue-700">
                          {selectedPauta.pautaCompleta?.pauta?.distribucionPuntaje 
                            ? Math.round(Object.values(selectedPauta.pautaCompleta.pauta.distribucionPuntaje)
                                .reduce((sum, val) => sum + parseFloat(val || 0), 0))
                            : "-"}
                        </p>
                      </div>
                      <div className="text-center border-l border-green-200">
                        <p className="text-sm text-[#143A80]/70 mb-2">Nota Final</p>
                        <p className="text-3xl font-bold text-green-700">
                          {selectedPauta.notaFinal || 
                           selectedPauta.pautaCompleta?.calificacionFinal || 
                           selectedPauta.pautaCompleta?.nota || "-"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabla de Criterios con Puntajes */}
                {selectedPauta.pautaCompleta?.pauta?.distribucionPuntaje && (
                  <div>
                    <h3 className="text-lg font-bold text-[#143A80] mb-3">Desglose por Criterios</h3>
                    <div className="overflow-x-auto rounded-lg border border-blue-200 bg-white">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-[#143A80] text-white">
                            <th className="px-4 py-3 text-left font-semibold">Criterio</th>
                            <th className="px-4 py-3 text-center font-semibold">Puntaje Obtenido</th>
                            <th className="px-4 py-3 text-center font-semibold">Puntaje Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(selectedPauta.pautaCompleta.pauta.distribucionPuntaje).map(([criterio, puntajeTotal]) => {
                            const puntajeObtenido = selectedPauta.pautaCompleta.puntajesObtenidos?.[criterio] || 0;
                            return (
                              <tr
                                key={criterio}
                                className="border-b border-blue-200 hover:bg-blue-50 transition"
                              >
                                <td className="px-4 py-3 text-[#143A80] font-medium">{criterio}</td>
                                <td className="px-4 py-3 text-center">
                                  <span className="font-semibold text-blue-600">{Math.round(puntajeObtenido)}</span>
                                </td>
                                <td className="px-4 py-3 text-center text-[#143A80]/70">{Math.round(puntajeTotal)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Botón Cerrar */}
                <button
                  onClick={handleClosePautaModal}
                  className="w-full bg-[#143A80] text-white font-semibold py-3 rounded-lg hover:bg-[#0f2a5a] transition"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
