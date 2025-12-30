import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { showSuccessAlert } from "@/utils/alertUtils";
import { createPauta, updatePauta, getPautaById, createPautaIntegradora, getPautaIntegradora, updatePautaIntegradora } from "../services/pauta.service.js";
import { getEvaluacionById } from "../services/evaluacion.service.js";
import { getEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CrearEditarPautaPage() {
    let { codigoRamo, idEvaluacion, pautaId } = useParams();
    const location = useLocation();
    const isNew = new URLSearchParams(location.search).get('new') === 'true';
    console.log("Parámetros recibidos:", { codigoRamo, idEvaluacion, pautaId, isNew });
    const navigate = useNavigate();
    const { user } = useAuth();

    const initialState = {
        criterios: '',
        criteriosPuntaje: [
            { nombre: '', puntaje: 0 }
        ],
        publicada: false
    };

    const [pauta, setPauta] = useState(initialState);
    const [evaluacionData, setEvaluacionData] = useState(null);
    const [evaluacionId, setEvaluacionId] = useState(null); // Para guardar el ID de evaluación integradora
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Cargar datos de evaluación y pauta si existe
    useEffect(() => {
        const loadData = async () => {
            try {
                // Si isNew=true, cargar la evaluación integradora específica
                if (isNew && codigoRamo) {
                    console.log("Creando nueva pauta para integradora de ramo:", codigoRamo);
                    try {
                        // Obtener evaluación integradora con datos correctos
                        const integradoRes = await getEvaluacionIntegradora(codigoRamo);
                        const integradoData = integradoRes?.data;
                        console.log("Evaluación integradora cargada:", integradoData);
                        setEvaluacionId(integradoData?.id); // Guardar el ID de la evaluación integradora
                        setEvaluacionData({
                            id: integradoData?.id,
                            titulo: integradoData?.titulo || "Evaluación Integradora",
                            puntajeTotal: integradoData?.puntajeTotal || 100,
                            fechaProgramada: integradoData?.fechaProgramada || new Date().toISOString().split('T')[0],
                        });
                        
                        // Intentar cargar la pauta integradora si existe
                        try {
                            let pautaData;
                            if (integradoData?.idPauta) {
                                // Si la evaluación integradora tiene idPauta, cargar esa pauta
                                console.log("Cargando pauta asociada con ID:", integradoData.idPauta);
                                pautaData = await getPautaById(integradoData.idPauta);
                            } else {
                                // Si no, intentar cargar por evaluacionIntegradoraId
                                console.log("Cargando pauta integradora por evaluacionIntegradoraId:", integradoData?.id);
                                pautaData = await getPautaIntegradora(integradoData?.id);
                            }
                            console.log("Pauta integradora cargada:", pautaData);
                            setPauta({
                                ...pautaData,
                                criteriosPuntaje: pautaData.distribucionPuntaje
                                    ? Object.entries(pautaData.distribucionPuntaje).map(([nombre, puntaje]) => ({ nombre, puntaje }))
                                    : [{ nombre: '', puntaje: 0 }],
                            });
                        } catch (err) {
                            // No existe pauta aún, usar initialState
                            console.log("No existe pauta integradora aún");
                            setPauta(initialState);
                        }
                    } catch (err) {
                        console.error("Error al obtener evaluación integradora:", err);
                        // Fallback si hay error
                        setEvaluacionData({
                            titulo: "Evaluación Integradora",
                            puntajeTotal: 100,
                            fechaProgramada: new Date().toISOString().split('T')[0],
                        });
                        setPauta(initialState);
                    }
                    setPageLoading(false);
                    return;
                }

                // Cargar datos de evaluación para evaluaciones normales
                if (codigoRamo && idEvaluacion) {
                    const evalData = await getEvaluacionById(codigoRamo, idEvaluacion);
                    
                    // Si es un error o no encontrado, intentar cargar como integradora
                    if (!evalData || evalData?.message || evalData?.error) {
                        console.log("Evaluación normal no encontrada, intentando como integradora...", evalData);
                        try {
                            // Obtener la evaluación integradora del ramo para conseguir su ID
                            const integradoRes = await getEvaluacionIntegradora(codigoRamo);
                            const integradoData = integradoRes?.data;
                            if (!integradoData?.id) {
                                throw new Error("No se encontró evaluación integradora para este ramo");
                            }
                            console.log("Evaluación integradora cargada:", integradoData);
                            setEvaluacionId(integradoData?.id);
                            setEvaluacionData({
                                id: integradoData?.id,
                                titulo: integradoData?.titulo || "Evaluación Integradora",
                                puntajeTotal: integradoData?.puntajeTotal || 100,
                                fechaProgramada: integradoData?.fechaProgramada || new Date().toISOString().split('T')[0],
                            });
                            
                            // Intentar cargar la pauta integradora con el ID de pauta asociada
                            try {
                                let pautaData;
                                if (integradoData?.idPauta) {
                                    // Si la evaluación integradora tiene idPauta, cargar esa pauta
                                    console.log("Cargando pauta asociada con ID:", integradoData.idPauta);
                                    pautaData = await getPautaById(integradoData.idPauta);
                                } else {
                                    // Si no, intentar cargar por evaluacionIntegradoraId
                                    console.log("Cargando pauta integradora por evaluacionIntegradoraId:", integradoData.id);
                                    pautaData = await getPautaIntegradora(integradoData.id);
                                }
                                console.log("Pauta integradora cargada:", pautaData);
                                setPauta({
                                    ...pautaData,
                                    criteriosPuntaje: pautaData.distribucionPuntaje
                                        ? Object.entries(pautaData.distribucionPuntaje).map(([nombre, puntaje]) => ({ nombre, puntaje }))
                                        : [{ nombre: '', puntaje: 0 }],
                                });
                            } catch (err) {
                                console.log("No existe pauta integradora aún");
                                setPauta(initialState);
                            }
                            setPageLoading(false);
                            return;
                        } catch (integError) {
                            console.error("Error al obtener evaluación integradora:", integError);
                            setError("No se encontró la evaluación ni la evaluación integradora");
                            setPageLoading(false);
                            return;
                        }
                    }
                    
                    console.log("Evaluación cargada:", evalData);
                    setEvaluacionData(evalData);
                    
                    // Si la evaluación tiene idPauta, cargar la pauta automáticamente
                    if (evalData?.idPauta) {
                        console.log("Cargando pauta con ID:", evalData.idPauta);
                        const pautaData = await getPautaById(evalData.idPauta);
                        console.log("Datos de pauta cargados:", pautaData);
                        setPauta({
                            ...pautaData,
                            criteriosPuntaje: pautaData.distribucionPuntaje
                                ? Object.entries(pautaData.distribucionPuntaje).map(([nombre, puntaje]) => ({ nombre, puntaje }))
                                : [{ nombre: '', puntaje: 0 }],
                        });
                        setPageLoading(false);
                        return;
                    }
                }
                
                // Cargar pauta si se passa pautaId como parámetro
                if (pautaId) {
                    const pautaData = await getPautaById(pautaId);
                    setPauta({
                        ...pautaData,
                        criteriosPuntaje: pautaData.distribucionPuntaje
                            ? Object.entries(pautaData.distribucionPuntaje).map(([nombre, puntaje]) => ({ nombre, puntaje }))
                            : [{ nombre: '', puntaje: 0 }],
                    });
                } else {
                    setPauta(initialState);
                }
            } catch (err) {
                console.error("Error cargando datos:", err);
                setError("Error al cargar los datos");
            } finally {
                setPageLoading(false);
            }
        };
        loadData();
    }, [codigoRamo, idEvaluacion, pautaId, isNew]);

    // Validaciones
    const validarPauta = (pauta_data) => {
        const err = {};
        if (!pauta_data.criterios || pauta_data.criterios.trim() === "") {
            err.criterios = "El criterio es obligatorio";
        } else if (pauta_data.criterios.trim().length < 10) {
            err.criterios = "Los criterios deben tener al menos 10 caracteres";
        }
        if (!pauta_data.criteriosPuntaje || pauta_data.criteriosPuntaje.length === 0) {
            err.criteriosPuntaje = "Debe agregar al menos un criterio";
        } else {
            pauta_data.criteriosPuntaje.forEach((c, idx) => {
                if (!c.nombre || c.nombre.trim() === '') {
                    err[`criterio_nombre_${idx}`] = 'El nombre del criterio es obligatorio';
                }
                if (c.puntaje === '' || isNaN(c.puntaje)) {
                    err[`criterio_puntaje_${idx}`] = 'El puntaje es obligatorio';
                } else if (c.puntaje < 0) {
                    err[`criterio_puntaje_${idx}`] = 'El puntaje debe ser mayor o igual a 0';
                }
            });
        }
        if (typeof pauta_data.publicada !== "boolean") {
            err.publicada = "La 'publicada' debe ser verdadero o falso";
        }
        return err;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (name.startsWith('criteriosPuntaje.')) {
            const [_, field, idx] = name.split('.');
            const newCriterios = pauta.criteriosPuntaje.map((c, i) =>
                i === Number(idx) ? { ...c, [field]: field === 'puntaje' ? Number(value) : value } : c
            );
            setPauta({ ...pauta, criteriosPuntaje: newCriterios });
            setErrors({ ...errors, [`criterio_${field}_${idx}`]: '', puntajeTotal: '' });
        } else if (name === 'publicada') {
            setPauta({ ...pauta, publicada: checked });
            setErrors({ ...errors, publicada: '' });
        } else {
            setPauta({ ...pauta, [name]: value });
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleAddCriterio = () => {
        setPauta({ ...pauta, criteriosPuntaje: [...pauta.criteriosPuntaje, { nombre: '', puntaje: 0 }] });
    };

    const handleRemoveCriterio = (idx) => {
        setPauta({ ...pauta, criteriosPuntaje: pauta.criteriosPuntaje.filter((_, i) => i !== idx) });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationErrors = validarPauta(pauta);
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }
        setErrors({});
        setIsLoading(true);

        // Formatear para backend: convertir array a objeto
        const distribucionPuntaje = pauta.criteriosPuntaje.reduce((acc, c) => {
            acc[c.nombre] = Number(c.puntaje);
            return acc;
        }, {});

        const pautaToSend = {
            ...pauta,
            distribucionPuntaje,
        };
        delete pautaToSend.criteriosPuntaje;

        try {
            if (pauta.id) {
                try {
                    // Si evaluacionId está set pero no idEvaluacion, es integradora
                    if (evaluacionId && !idEvaluacion) {
                        await updatePautaIntegradora(evaluacionId, pautaToSend);
                    } else {
                        // Es normal: usar updatePauta con id de pauta
                        await updatePauta(pauta.id, pautaToSend);
                    }
                    showSuccessAlert('Pauta actualizada', 'La pauta y todas las pautas evaluadas asociadas han sido actualizadas correctamente.');
                } catch (error) {
                    showErrorAlert('Error', `Error al actualizar la pauta: ${error.message || 'Intenta nuevamente'}`);
                }
            } else {
                // Si evaluacionId está set pero no idEvaluacion, es integradora
                if (evaluacionId && !idEvaluacion) {
                    await createPautaIntegradora(pautaToSend, evaluacionId);
                } else {
                    // Es normal: usar createPauta con idEvaluacion
                    await createPauta(pautaToSend, idEvaluacion || null);
                }
                showSuccessAlert('Éxito', 'Pauta creada correctamente');
            }
            if (idEvaluacion || evaluacionId) {
                navigate(`/evaluaciones`);
            } else {
                navigate(`/pautas`);
            }
        } catch (error) {
            setError(error.message || "Error al guardar la pauta");
        } finally {
            setIsLoading(false);
        }
    };

    // Si no hay evaluacionData, buscar en pauta (por si es edición)
    const puntajeTotalEval = evaluacionData?.puntajeTotal || pauta?.puntajeTotal || 100;
    const totalPuntaje = pauta.criteriosPuntaje.reduce((sum, c) => sum + Number(c.puntaje), 0);
    const totalOk = totalPuntaje === puntajeTotalEval;
    const getFieldError = (fieldName) => errors[fieldName];
    const hasFieldError = (fieldName) => !!errors[fieldName];

    // Validar rol
    if (user?.role !== 'profesor' && user?.role !== 'jefecarrera') {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
                <div className="ml-0 md:ml-64 p-4 md:p-8">
                    <div className="mx-auto w-full max-w-3xl">
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <h1 className="text-3xl font-bold text-gray-800 mb-4">Acceso Denegado</h1>
                            <p className="text-gray-600 mb-6">
                                Solo los profesores y jefes de carrera pueden crear y editar pautas de evaluación.
                            </p>
                            <button
                                onClick={() => navigate(-1)}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold transition"
                            >
                                Volver
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (pageLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-600 mb-4">
                        <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </div>
                    <p className="text-gray-600">Cargando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#e9f7fb] p-4 md:p-8">
            <div className="mx-auto w-full max-w-6xl">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(-1)}
                        className="mb-4 text-blue-700 hover:text-blue-900 transition font-medium"
                    >
                        ← Volver
                    </button>
                    <h1 className="text-4xl font-bold text-[#113C63]">
                        {pauta.id ? 'Editar Pauta' : 'Crear Pauta'}
                    </h1>
                    {evaluacionData && (
                        <div className="mt-2">
                            <p className="text-sm text-blue-600">
                                <strong>Evaluación:</strong> {evaluacionData.titulo}
                            </p>
                            <p className="text-sm text-blue-600">
                                <strong>Puntaje Total:</strong> {evaluacionData.puntajeTotal || 100}
                            </p>
                        </div>
                    )}
                </div>

                {/* Formulario */}
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-lg overflow-hidden">
                    {/* Encabezado del Formulario */}
                    <div className="bg-[#113C63] px-6 md:px-8 py-6">
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {pauta.id ? 'Editar' : 'Nueva'} Pauta de Evaluación
                        </h2>
                        <p className="text-blue-100 text-sm">
                            Define los criterios y la distribución de puntajes
                        </p>
                    </div>

                    {/* Contenido */}
                    <div className="p-6 md:p-8 space-y-6">
                        {error && (
                            <div className="rounded-lg border-l-4 border-red-500 bg-red-100 px-4 py-3">
                                <p className="text-red-700 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Criterios */}
                        <div>
                            <label className="block text-sm font-bold text-[#113C63] mb-3">
                                Criterios de evaluación *
                            </label>
                            <textarea
                                name="criterios"
                                value={pauta.criterios}
                                onChange={handleChange}
                                className={`w-full rounded border p-4 text-gray-800 outline-none focus:ring-2 transition min-h-[100px] ${
                                    hasFieldError("criterios")
                                        ? "border-red-500 bg-red-50 focus:ring-red-400"
                                        : "border-gray-300 bg-white focus:ring-blue-400"
                                }`}
                                placeholder="Describe los criterios de evaluación..."
                            />
                            {hasFieldError("criterios") && (
                                <p className="text-red-600 text-sm mt-2">{getFieldError("criterios")}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Mínimo 10 caracteres</p>
                        </div>

                        {/* Distribución de Puntajes */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <label className="block text-sm font-bold text-[#113C63]">
                                    Criterios y puntajes *
                                </label>
                                <span
                                    className={`px-3 py-1 rounded text-sm font-bold ${
                                        totalOk
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {totalPuntaje}/{puntajeTotalEval}
                                </span>
                            </div>

                            {hasFieldError("puntajeTotal") && (
                                <div className="rounded border-l-4 border-red-500 bg-red-100 px-4 py-3 mb-4">
                                    <p className="text-red-700 text-sm font-medium">{getFieldError("puntajeTotal")}</p>
                                </div>
                            )}

                            <div className="space-y-3 border rounded-lg p-4 bg-gray-50">
                                {pauta.criteriosPuntaje.map((c, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row items-end gap-3">
                                        <div className="flex-1 w-full md:w-auto">
                                            <label className="text-xs text-gray-600 font-semibold block mb-1">
                                                Criterio #{idx + 1}
                                            </label>
                                            <input
                                                type="text"
                                                name={`criteriosPuntaje.nombre.${idx}`}
                                                value={c.nombre}
                                                onChange={handleChange}
                                                placeholder="Nombre del criterio"
                                                className={`w-full rounded border p-3 text-gray-800 outline-none focus:ring-2 transition ${
                                                    hasFieldError(`criterio_nombre_${idx}`)
                                                        ? "border-red-500 bg-red-50 focus:ring-red-400"
                                                        : "border-gray-300 bg-white focus:ring-blue-400"
                                                }`}
                                            />
                                            {hasFieldError(`criterio_nombre_${idx}`) && (
                                                <p className="text-red-600 text-xs mt-1">{getFieldError(`criterio_nombre_${idx}`)}</p>
                                            )}
                                        </div>
                                        <div className="w-32">
                                            <label className="text-xs text-gray-600 font-semibold block mb-1">
                                                Puntaje
                                            </label>
                                            <input
                                                type="number"
                                                name={`criteriosPuntaje.puntaje.${idx}`}
                                                value={c.puntaje}
                                                onChange={handleChange}
                                                min="0"
                                                placeholder="0"
                                                className={`w-full rounded border p-3 text-gray-800 outline-none focus:ring-2 transition ${
                                                    hasFieldError(`criterio_puntaje_${idx}`)
                                                        ? "border-red-500 bg-red-50 focus:ring-red-400"
                                                        : "border-gray-300 bg-white focus:ring-blue-400"
                                                }`}
                                            />
                                            {hasFieldError(`criterio_puntaje_${idx}`) && (
                                                <p className="text-red-600 text-xs mt-1">{getFieldError(`criterio_puntaje_${idx}`)}</p>
                                            )}
                                        </div>
                                        <span className="text-sm text-gray-600 font-medium hidden md:inline">pts</span>
                                        {pauta.criteriosPuntaje.length > 1 && (
                                            <button 
                                                type="button" 
                                                onClick={() => handleRemoveCriterio(idx)} 
                                                className="w-full md:w-auto px-4 py-3 rounded bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition"
                                            >
                                                Eliminar
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button 
                                    type="button" 
                                    onClick={handleAddCriterio} 
                                    className="w-full px-4 py-3 mt-4 rounded bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition"
                                >
                                    + Agregar criterio
                                </button>
                            </div>
                        </div>

                    </div>

                    {/* Botones */}
                    <div className="bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-200 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-2 rounded border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-100 transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !totalOk}
                            className={`px-6 py-2 rounded font-semibold text-white transition ${
                                isLoading || !totalOk
                                    ? "bg-gray-400 cursor-not-allowed"
                                    : "bg-[#143A80] hover:bg-[#0f2d5f]"
                            }`}
                        >
                            {isLoading ? "Guardando..." : (pauta.id ? 'Guardar cambios' : 'Crear pauta')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
