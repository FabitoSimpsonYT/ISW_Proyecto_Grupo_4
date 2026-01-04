import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { showErrorAlert, showSuccessAlert } from "@/utils/alertUtils";
import { getEvaluacionById } from "../services/evaluacion.service.js";
import { getEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { getAlumnosBySeccion, getSeccionesByRamo } from "../services/ramos.service.js";
import { getPautaById } from "../services/pauta.service.js";
import { createPautaEvaluada, updatePautaEvaluada, getPautaEvaluada, getPautaEvaluadaIntegradora, createPautaEvaluadaIntegradora, updatePautaEvaluadaIntegradora } from "../services/pautaEvaluada.service.js";
import { ModalRetroalimentacion } from "../components/ModalRetroalimentacion.jsx";
import ComentariosPauta from "../components/ComentariosPauta.jsx";
import { useAuth } from "../context/AuthContext.jsx";

export default function EvaluarPage() {
    const { codigoRamo, idEvaluacion } = useParams();
    const ramoId = codigoRamo; // ramoId es igual a codigoRamo
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    
    // Detectar si es evaluación integradora
    const isIntegradora = location.pathname.includes('evaluar-integradora');
    
    const [evaluacion, setEvaluacion] = useState(null);
    const [ramoNombre, setRamoNombre] = useState(null);
    const [estudiantes, setEstudiantes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [estudianteSeleccionado, setEstudianteSeleccionado] = useState(null);
    const [pauta, setPauta] = useState(null);
    const [puntajesObtenidos, setPuntajesObtenidos] = useState({});
    const [modalRetroalimentacionOpen, setModalRetroalimentacionOpen] = useState(false);
    const [estudianteRetroalimentacion, setEstudianteRetroalimentacion] = useState(null);
    const [modalComentariosOpen, setModalComentariosOpen] = useState(false);
    const [pautaComentariosId, setPautaComentariosId] = useState(null);
    const [alumnoComentarios, setAlumnoComentarios] = useState(null);
    const [pautaDetalle, setPautaDetalle] = useState(null);
    const [pautaDetalleLoading, setPautaDetalleLoading] = useState(false);
    const [editandoPautaComentarios, setEditandoPautaComentarios] = useState(false);
    const [puntajesComentarios, setPuntajesComentarios] = useState({});


    useEffect(() => {
        const loadData = async () => {
            try {
                // Cargar evaluación (regular o integradora)
                let evalData;
                if (isIntegradora) {
                    const response = await getEvaluacionIntegradora(codigoRamo);
                    evalData = response?.data || response;
                    console.log("Evaluación integradora cargada:", evalData);
                } else {
                    evalData = await getEvaluacionById(codigoRamo, idEvaluacion);
                    console.log("Evaluación regular cargada:", evalData);
                }
                
                if (!evalData) {
                    setError("No se pudo cargar la evaluación");
                    setLoading(false);
                    return;
                }
                
                setEvaluacion(evalData);
                
                // Cargar pauta si existe
                if (evalData?.idPauta) {
                    const pautaData = await getPautaById(evalData.idPauta);
                    console.log("Pauta cargada:", pautaData);
                    // Convertir distribucionPuntaje a array si es necesario
                    if (pautaData?.distribucionPuntaje && typeof pautaData.distribucionPuntaje === 'object' && !Array.isArray(pautaData.distribucionPuntaje)) {
                        pautaData.criteriosPuntaje = Object.entries(pautaData.distribucionPuntaje).map(([nombre, puntaje]) => ({ nombre, puntaje }));
                    } else if (!pautaData.criteriosPuntaje) {
                        pautaData.criteriosPuntaje = [];
                    }
                    setPauta(pautaData);
                }
                
                // Cargar secciones del ramo
                const secciones = await getSeccionesByRamo(codigoRamo);
                console.log("Secciones cargadas:", secciones);
                
                // Cargar estudiantes de cada sección
                const allEstudiantes = [];
                
                for (const seccion of secciones) {
                    try {
                        const alumnos = await getAlumnosBySeccion(codigoRamo, seccion.numero);
                        console.log(`Alumnos de sección ${seccion.numero}:`, alumnos);
                        
                        if (alumnos && Array.isArray(alumnos)) {
                            alumnos.forEach(alumno => {
                                allEstudiantes.push({
                                    ...alumno,
                                    seccion: seccion.nombre || seccion.numero,
                                });
                            });
                        }
                    } catch (err) {
                        console.error(`Error cargando alumnos de sección ${seccion.numero}:`, err);
                    }
                }
                
                // Ordenar por sección primero, luego alfabéticamente por apellido paterno
                allEstudiantes.sort((a, b) => {
                    // Primero ordenar por sección
                    const seccionA = a.seccion?.toString() || '';
                    const seccionB = b.seccion?.toString() || '';
                    const seccionCompare = seccionA.localeCompare(seccionB);
                    
                    if (seccionCompare !== 0) {
                        return seccionCompare;
                    }
                    
                    // Si están en la misma sección, ordenar por apellido paterno
                    const apellidoA = a.apellidoPaterno?.toLowerCase() || '';
                    const apellidoB = b.apellidoPaterno?.toLowerCase() || '';
                    return apellidoA.localeCompare(apellidoB);
                });
                
                // Cargar notas para cada estudiante
                for (const estudiante of allEstudiantes) {
                    try {
                        // Usar el servicio correcto dependiendo del tipo de evaluación
                        const evaluacionId = isIntegradora ? evalData.id : idEvaluacion;
                        let pautaEvaluada;
                        
                        if (isIntegradora) {
                            pautaEvaluada = await getPautaEvaluadaIntegradora(evaluacionId, estudiante.rut);
                        } else {
                            pautaEvaluada = await getPautaEvaluada(evaluacionId, estudiante.rut);
                        }
                        
                        if (pautaEvaluada) {
                            estudiante.pautaEvaluadaId = pautaEvaluada.id;
                            if (pautaEvaluada.notaFinal) {
                                estudiante.nota = pautaEvaluada.notaFinal;
                            }
                        }
                    } catch (err) {
                        console.error(`Error cargando nota para ${estudiante.rut}:`, err);
                    }
                }
                
                console.log("Estudiantes ordenados con notas:", allEstudiantes);
                setEstudiantes(allEstudiantes);
            } catch (err) {
                console.error("Error cargando datos:", err);
                setError("Error al cargar los datos");
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [codigoRamo, idEvaluacion, isIntegradora]);

    // Cargar nombre del ramo cuando sea integradora
    useEffect(() => {
        if (isIntegradora && codigoRamo) {
            const loadRamo = async () => {
                try {
                    const secciones = await getSeccionesByRamo(codigoRamo);
                    if (secciones && secciones.length > 0) {
                        setRamoNombre(secciones[0].ramo?.nombre);
                    }
                } catch (err) {
                    console.error("Error cargando nombre del ramo:", err);
                }
            };
            loadRamo();
        }
    }, [isIntegradora, codigoRamo]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-xl text-gray-600">Cargando...</div>
            </div>
        );
    }

    const handleEvaluar = async (estudiante) => {
        setEstudianteSeleccionado(estudiante);
        
        // Si fue evaluado antes, cargar los datos existentes
        if (estudiante.nota) {
            try {
                let pautaExistente;
                
                // Usar la función correcta según el tipo de evaluación
                if (isIntegradora) {
                    pautaExistente = await getPautaEvaluadaIntegradora(evaluacion?.id, estudiante.rut);
                } else {
                    pautaExistente = await getPautaEvaluada(evaluacion?.id, estudiante.rut);
                }
                
                console.log("Pauta existente:", pautaExistente);
                
                if (pautaExistente && pautaExistente.puntajesObtenidos) {
                    setPuntajesObtenidos(pautaExistente.puntajesObtenidos);
                }
            } catch (error) {
                console.error("Error cargando pauta existente:", error);
            }
        }
    };

    const handleCerrarFormulario = () => {
        setEstudianteSeleccionado(null);
        setPuntajesObtenidos({});
    };

    const handleChangePuntaje = (criterio, valor, puntajeMax) => {
        const numValue = parseFloat(valor);
        // Solo permitir números no negativos y no mayores al puntaje máximo
        if (valor === '' || (numValue >= 0 && numValue <= puntajeMax && !isNaN(numValue))) {
            setPuntajesObtenidos({
                ...puntajesObtenidos,
                [criterio]: valor === '' ? 0 : numValue
            });
        }
    };

    const handlePreventArrowChange = (event) => {
        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
            event.preventDefault();
        }
    };

    const handleGuardarEvaluacion = async () => {
        try {
            // Completar criterios faltantes con 0
            const puntajesCompletos = {};
            if (pauta?.criteriosPuntaje) {
                pauta.criteriosPuntaje.forEach((criterio) => {
                    puntajesCompletos[criterio.nombre] = puntajesObtenidos[criterio.nombre] || 0;
                });
            }

            // Solo enviar alumnoRut y puntajes_obtenidos (observaciones eliminadas)
            console.log("Estudiante seleccionado completo:", estudianteSeleccionado);
            const pautaEvaluadaData = {
                alumnoRut: estudianteSeleccionado.rut,
                puntajes_obtenidos: puntajesCompletos
            };

            console.log("Guardando pauta evaluada:", pautaEvaluadaData);
            
            let result;
            
            // Si el estudiante ya fue evaluado, usar PATCH (reevaluación)
            if (estudianteSeleccionado.nota) {
                console.log("Reevaluando estudiante");
                if (isIntegradora) {
                    result = await updatePautaEvaluadaIntegradora(evaluacion?.id, estudianteSeleccionado.rut, pautaEvaluadaData);
                } else {
                    result = await updatePautaEvaluada(evaluacion?.id, estudianteSeleccionado.rut, pautaEvaluadaData);
                }
            } else {
                // Si es primera evaluación, usar POST
                console.log("Primera evaluación del estudiante");
                if (isIntegradora) {
                    result = await createPautaEvaluadaIntegradora(evaluacion?.id, pauta?.id, pautaEvaluadaData);
                } else {
                    result = await createPautaEvaluada(evaluacion?.id, pauta?.id, pautaEvaluadaData);
                }
            }
            
            console.log("Pauta evaluada guardada:", result);
            
            // Actualizar la tabla automáticamente con la nueva nota
            if (result && result.notaFinal) {
                setEstudiantes(prevEstudiantes =>
                    prevEstudiantes.map(est =>
                        est.id === estudianteSeleccionado.id
                            ? { ...est, nota: result.notaFinal, pautaEvaluadaId: result.id }
                            : est
                    )
                );
            }
            
            showSuccessAlert("Éxito", "Evaluación guardada exitosamente");
            handleCerrarFormulario();
        } catch (error) {
            console.error("Error al guardar evaluación:", error);
            showErrorAlert("Error", "Error al guardar la evaluación: " + (error?.message || "Error desconocido"));
        }
    };

    const calcularNota = (puntajes = puntajesObtenidos) => {
        const puntajeTotal = evaluacion?.puntajeTotal || (pauta?.criteriosPuntaje?.reduce((sum, c) => sum + c.puntaje, 0) || 1);
        const puntajeObtenido = Object.values(puntajes).reduce((sum, p) => sum + p, 0);
        const porcentaje = (puntajeObtenido / puntajeTotal) * 100;
        
        let nota;
        if (porcentaje < 51) {
            // Escalar de 1 a 4.0 para 0% a 51%
            nota = 1 + (porcentaje / 51) * 3;
        } else {
            // Escalar de 4.0 a 7 para 51% a 100%
            nota = 4 + ((porcentaje - 51) / 49) * 3;
        }
        
        // Redondear a 1 decimal
        return (Math.round(nota * 10) / 10).toFixed(1);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex justify-center">
            <div className="p-4 md:p-8 w-full max-w-4xl">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 border-l-4 border-indigo-600">
                        <button
                            onClick={() => navigate(-1)}
                            className="mb-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition"
                        >
                            ← Volver
                        </button>
                        <h1 className="text-4xl font-bold text-gray-800 mb-2">
                            Evaluar: {evaluacion?.titulo}
                        </h1>
                        <p className="text-gray-600">
                            Selecciona un estudiante para evaluar
                        </p>
                        {evaluacion && (
                            <div className="mt-4 p-4 bg-green-50 rounded-xl border border-green-200">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold text-green-700">Ramo:</span> {isIntegradora ? ramoNombre : evaluacion.ramo?.nombre}
                                </p>
                                <p className="text-sm text-gray-700 mt-2">
                                    <span className="font-semibold text-green-700">Puntaje Total:</span> {evaluacion.puntajeTotal}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-red-600">
                            <p className="text-red-600 font-medium">{error}</p>
                        </div>
                    )}

                    {/* Tabla de estudiantes */}
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-blue-200">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-[#113C63] text-white">
                                    <tr>
                                        <th className="px-6 py-4 text-center font-semibold w-12">#</th>
                                        <th className="px-6 py-4 text-left font-semibold">Alumno</th>
                                        <th className="px-6 py-4 text-left font-semibold">RUT</th>
                                        <th className="px-6 py-4 text-left font-semibold">Sección</th>
                                        <th className="px-6 py-4 text-center font-semibold">Notas</th>
                                        <th className="px-6 py-4 text-center font-semibold">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-blue-100">
                                    {estudiantes.length > 0 ? (
                                        estudiantes.map((estudiante, index) => (
                                            <tr key={estudiante.id} className="text-slate-700 hover:bg-blue-50 transition">
                                                <td className="px-6 py-4 text-center text-slate-700 font-semibold">{index + 1}</td>
                                                <td className="px-6 py-4 text-slate-700">{estudiante.apellidoPaterno} {estudiante.apellidoMaterno}, {estudiante.nombres}</td>
                                                <td className="px-6 py-4 text-slate-700 font-mono text-sm">{estudiante.rut}</td>
                                                <td className="px-6 py-4 text-slate-700">{estudiante.seccion}</td>
                                                <td className="px-6 py-4 text-center">
                                                    {estudiante.nota === null || estudiante.nota === undefined ? (
                                                        <span className="text-slate-500">—</span>
                                                    ) : parseFloat(estudiante.nota) < 4.0 ? (
                                                        <span className="font-semibold text-red-600">{parseFloat(estudiante.nota).toFixed(1)}</span>
                                                    ) : (
                                                        <span className="font-semibold text-blue-600">{parseFloat(estudiante.nota).toFixed(1)}</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex gap-2 justify-center items-center">
                                                        <button
                                                            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition"
                                                            onClick={() => handleEvaluar(estudiante)}
                                                        >
                                                            {estudiante.nota ? "Reevaluar" : "Evaluar"}
                                                        </button>
                                                        {estudiante.nota && estudiante.pautaEvaluadaId && (
                                                            <button
                                                                className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm transition border border-slate-200"
                                                                onClick={async () => {
                                                                    setPautaComentariosId(estudiante.pautaEvaluadaId);
                                                                    setAlumnoComentarios(estudiante);
                                                                    setPautaDetalleLoading(true);
                                                                    setModalComentariosOpen(true);
                                                                    try {
                                                                        const detalle = isIntegradora
                                                                            ? await getPautaEvaluadaIntegradora(evaluacion?.id, estudiante.rut)
                                                                            : await getPautaEvaluada(evaluacion?.id, estudiante.rut);
                                                                        setPautaDetalle(detalle);
                                                                        setPuntajesComentarios(detalle?.puntajesObtenidos || {});
                                                                        setEditandoPautaComentarios(false);
                                                                    } catch (e) {
                                                                        console.error("Error cargando pauta evaluada:", e);
                                                                        setPautaDetalle(null);
                                                                    } finally {
                                                                        setPautaDetalleLoading(false);
                                                                    }
                                                                }}
                                                            >
                                                                Ver más
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-slate-500">
                                                No hay estudiantes registrados en las secciones
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Modal de evaluación */}
                    {estudianteSeleccionado && pauta && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ghost-scroll">
                                <div className="sticky top-0 bg-[#113C63] text-white px-6 py-4 flex items-center justify-between border-b border-blue-200">
                                    <div>
                                        <h2 className="text-2xl font-bold">Evaluar Estudiante</h2>
                                        <p className="text-sm text-blue-100 mt-1">{estudianteSeleccionado.apellidoPaterno} {estudianteSeleccionado.apellidoMaterno}, {estudianteSeleccionado.nombres}</p>
                                    </div>
                                    <button
                                        onClick={handleCerrarFormulario}
                                        className="text-white hover:text-red-300 text-2xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Información del estudiante */}
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-600 font-semibold">RUT</p>
                                                <p className="text-slate-800 font-mono">{estudianteSeleccionado.rut}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 font-semibold">Sección</p>
                                                <p className="text-slate-800">{estudianteSeleccionado.seccion}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Información de la evaluación */}
                                    <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                                        <p className="text-sm text-slate-600 font-semibold">Evaluación</p>
                                        <p className="text-slate-800">{evaluacion?.titulo}</p>
                                    </div>

                                    {/* Tabla de distribución de puntaje */}
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800 mb-4">Distribución de Puntaje</h3>
                                        <div className="overflow-x-auto rounded-xl border border-blue-200">
                                            <table className="w-full">
                                                <thead className="bg-[#113C63] text-white">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left font-semibold">Criterio</th>
                                                        <th className="px-4 py-3 text-center font-semibold w-32">Puntaje Máximo</th>
                                                        <th className="px-4 py-3 text-center font-semibold w-40">Puntaje Obtenido</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-blue-100">
                                                    {pauta.criteriosPuntaje && pauta.criteriosPuntaje.length > 0 ? (
                                                        pauta.criteriosPuntaje.map((criterio, idx) => (
                                                            <tr key={idx} className="text-slate-700 hover:bg-blue-50 transition">
                                                                <td className="px-4 py-3 text-slate-800">{criterio.nombre}</td>
                                                                <td className="px-4 py-3 text-center text-slate-700 font-semibold">{criterio.puntaje}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max={criterio.puntaje}
                                                                        step="0.1"
                                                                        value={puntajesObtenidos[criterio.nombre] === 0 || puntajesObtenidos[criterio.nombre] === undefined ? '' : puntajesObtenidos[criterio.nombre]}
                                                                        onChange={(e) => handleChangePuntaje(criterio.nombre, e.target.value, criterio.puntaje)}
                                                                        onKeyDown={handlePreventArrowChange}
                                                                        placeholder="0"
                                                                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                    />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="px-4 py-6 text-center text-slate-500">
                                                                No hay criterios en la pauta
                                                            </td>
                                                        </tr>
                                                    )}
                                                    {pauta.criteriosPuntaje && pauta.criteriosPuntaje.length > 0 && (
                                                        <tr className="bg-blue-100 border-t-2 border-blue-300">
                                                            <td className="px-4 py-3 text-slate-800 font-bold">Total</td>
                                                            <td className="px-4 py-3 text-center text-slate-800 font-bold">
                                                                {pauta.criteriosPuntaje.reduce((sum, criterio) => sum + Number(criterio.puntaje || 0), 0).toFixed(1)}
                                                            </td>
                                                            <td className="px-4 py-3 text-center text-slate-800 font-bold">
                                                                {Object.values(puntajesObtenidos).reduce((sum, val) => sum + Number(val || 0), 0).toFixed(1)}
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Resumen de puntaje */}
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-slate-600 font-semibold">Puntaje Total Máximo</p>
                                                <p className="text-2xl font-bold text-slate-800">{evaluacion?.puntajeTotal || (pauta?.criteriosPuntaje?.reduce((sum, c) => sum + c.puntaje, 0) || 0)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 font-semibold">Puntaje Obtenido</p>
                                                <p className="text-2xl font-bold text-blue-600">{Object.values(puntajesObtenidos).reduce((sum, p) => sum + p, 0).toFixed(1)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-slate-600 font-semibold">Nota Final</p>
                                                <p className="text-2xl font-bold text-blue-600">{calcularNota()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botones de acción */}
                                    <div className="flex gap-4 justify-end pt-4 border-t border-slate-200">
                                        <button
                                            onClick={handleCerrarFormulario}
                                            className="px-6 py-2 text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-50 font-semibold transition"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleGuardarEvaluacion}
                                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                                        >
                                            Guardar Evaluación
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {estudianteSeleccionado && !pauta && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="text-3xl">⚠️</div>
                                    <h2 className="text-xl font-bold text-slate-800">Sin Pauta</h2>
                                </div>
                                <p className="text-slate-600 mb-6">
                                    No hay una pauta de evaluación asociada a este certamen. Por favor, crea una pauta antes de evaluar.
                                </p>
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleCerrarFormulario}
                                        className="flex-1 px-4 py-2 bg-slate-200 text-slate-800 rounded-lg hover:bg-slate-300 font-semibold transition"
                                    >
                                        Cerrar
                                    </button>
                                    <button
                                        onClick={() => navigate(`/evaluacion/${codigoRamo}/${idEvaluacion}/pauta`)}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition"
                                    >
                                        Crear Pauta
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Modal de Retroalimentación */}
                    {modalRetroalimentacionOpen && estudianteRetroalimentacion && (
                        <ModalRetroalimentacion
                            isOpen={modalRetroalimentacionOpen}
                            onClose={() => {
                                setModalRetroalimentacionOpen(false);
                                setEstudianteRetroalimentacion(null);
                            }}
                            alumno={estudianteRetroalimentacion}
                            evaluacionId={isIntegradora ? null : evaluacion?.id}
                            evaluacionIntegradoraId={isIntegradora ? evaluacion?.id : null}
                            ramoId={ramoId}
                            ramoNombre={isIntegradora ? ramoNombre : evaluacion?.ramo?.nombre}
                        />
                    )}

                    {/* Modal de Comentarios */}
                    {modalComentariosOpen && pautaComentariosId && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
                                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#143A80] text-white rounded-t-2xl">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Comentarios del profesor</h2>
                                        {alumnoComentarios && (
                                            <p className="text-sm text-blue-100 mt-1">
                                                {alumnoComentarios.apellidoPaterno} {alumnoComentarios.apellidoMaterno}, {alumnoComentarios.nombres}
                                            </p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setModalComentariosOpen(false);
                                            setPautaComentariosId(null);
                                            setAlumnoComentarios(null);
                                            setPautaDetalle(null);
                                            setEditandoPautaComentarios(false);
                                            setPuntajesComentarios({});
                                        }}
                                        className="text-blue-100 hover:text-white text-xl font-bold"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 max-h-[80vh]">
                                    <div className="bg-blue-50/80 border border-blue-100 rounded-xl p-4 overflow-y-auto ghost-scroll">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="text-lg font-bold text-[#0F2F52]">Pauta evaluada</h3>
                                            {!editandoPautaComentarios ? (
                                                <button
                                                    disabled={pautaDetalleLoading || !pautaDetalle}
                                                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-lg px-3 py-1"
                                                    onClick={() => {
                                                        if (!pautaDetalle) return;
                                                        setEditandoPautaComentarios(true);
                                                        setPuntajesComentarios(pautaDetalle?.puntajesObtenidos || {});
                                                    }}
                                                >
                                                    Editar pauta
                                                </button>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <button
                                                        className="text-sm font-semibold text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg px-3 py-1"
                                                        onClick={() => {
                                                            setEditandoPautaComentarios(false);
                                                            setPuntajesComentarios(pautaDetalle?.puntajesObtenidos || {});
                                                        }}
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        className="text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-lg px-3 py-1"
                                                        onClick={async () => {
                                                            try {
                                                                const puntajesCompletos = {};
                                                                if (pauta?.criteriosPuntaje) {
                                                                    pauta.criteriosPuntaje.forEach((criterio) => {
                                                                        puntajesCompletos[criterio.nombre] = puntajesComentarios[criterio.nombre] || 0;
                                                                    });
                                                                }

                                                                const pautaEvaluadaData = {
                                                                    alumnoRut: alumnoComentarios?.rut,
                                                                    puntajes_obtenidos: puntajesCompletos
                                                                };

                                                                let result;
                                                                if (isIntegradora) {
                                                                    result = await updatePautaEvaluadaIntegradora(evaluacion?.id, alumnoComentarios?.rut, pautaEvaluadaData);
                                                                } else {
                                                                    result = await updatePautaEvaluada(evaluacion?.id, alumnoComentarios?.rut, pautaEvaluadaData);
                                                                }

                                                                setPautaDetalle(result);
                                                                setPuntajesComentarios(result?.puntajesObtenidos || {});
                                                                setEditandoPautaComentarios(false);

                                                                if (result && result.notaFinal) {
                                                                    setEstudiantes(prevEstudiantes =>
                                                                        prevEstudiantes.map(est =>
                                                                            est.id === alumnoComentarios?.id
                                                                                ? { ...est, nota: result.notaFinal, pautaEvaluadaId: result.id }
                                                                                : est
                                                                        )
                                                                    );
                                                                }

                                                                showSuccessAlert("Éxito", "Pauta actualizada correctamente");
                                                            } catch (error) {
                                                                console.error("Error al guardar pauta desde comentarios:", error);
                                                                showErrorAlert("Error", "No se pudo guardar la pauta: " + (error?.message || "Error desconocido"));
                                                            }
                                                        }}
                                                    >
                                                        Guardar cambios
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {pautaDetalleLoading ? (
                                            <p className="text-slate-600 text-sm">Cargando pauta evaluada...</p>
                                        ) : pautaDetalle ? (
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between text-sm text-slate-700 bg-white border border-blue-100 rounded-lg px-3 py-2">
                                                    <span className="font-semibold">Nota final</span>
                                                    <span className="text-blue-700 font-extrabold text-xl">
                                                        {editandoPautaComentarios
                                                            ? calcularNota(puntajesComentarios)
                                                            : (pautaDetalle.notaFinal?.toFixed ? pautaDetalle.notaFinal.toFixed(1) : pautaDetalle.notaFinal)
                                                        }
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {pauta?.criteriosPuntaje?.length ? (
                                                        pauta.criteriosPuntaje.map((crit, idx) => {
                                                            const obtenido = editandoPautaComentarios
                                                                ? (puntajesComentarios[crit.nombre] === 0 || puntajesComentarios[crit.nombre] === undefined ? '' : puntajesComentarios[crit.nombre])
                                                                : (pautaDetalle.puntajesObtenidos ? pautaDetalle.puntajesObtenidos[crit.nombre] || 0 : 0);
                                                            return (
                                                                <div key={idx} className="flex items-center justify-between text-sm bg-white border border-blue-100 rounded-lg px-3 py-2">
                                                                    <div className="text-[#0F2F52] font-semibold">{crit.nombre}</div>
                                                                    <div className="text-slate-600">
                                                                        {editandoPautaComentarios ? (
                                                                            <input
                                                                                type="number"
                                                                                min="0"
                                                                                max={crit.puntaje}
                                                                                step="0.1"
                                                                                value={obtenido}
                                                                                onChange={(e) => {
                                                                                    const val = parseFloat(e.target.value);
                                                                                    if (e.target.value === '' || (!isNaN(val) && val >= 0 && val <= crit.puntaje)) {
                                                                                        setPuntajesComentarios(prev => ({
                                                                                            ...prev,
                                                                                            [crit.nombre]: e.target.value === '' ? 0 : val
                                                                                        }));
                                                                                    }
                                                                                }}
                                                                                onKeyDown={handlePreventArrowChange}
                                                                                className="w-24 px-3 py-1 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-800 text-right appearance-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                                                            />
                                                                        ) : (
                                                                            <span className="font-semibold text-blue-700">{obtenido}</span>
                                                                        )}
                                                                        {!editandoPautaComentarios && ' / ' + crit.puntaje}
                                                                        {editandoPautaComentarios && <span className="text-slate-500 ml-1">/ {crit.puntaje}</span>}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <p className="text-slate-600 text-sm">Sin criterios de pauta.</p>
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-slate-600 text-sm">No se encontró la pauta evaluada.</p>
                                        )}
                                    </div>
                                    <div className="overflow-hidden">
                                        <ComentariosPauta pautaEvaluadaId={pautaComentariosId} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
