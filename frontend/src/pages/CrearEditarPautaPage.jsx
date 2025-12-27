import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { createPauta, updatePauta, getPautaById } from "../services/pauta.service.js";
import { getEvaluacionById } from "../services/evaluacion.service.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function CrearEditarPautaPage() {
    let { codigoRamo, idEvaluacion, pautaId } = useParams();
    console.log("Parámetros recibidos:", { codigoRamo, idEvaluacion, pautaId });
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
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    // Cargar datos de evaluación y pauta si existe
    useEffect(() => {
        const loadData = async () => {
            try {
                // Cargar datos de la evaluación
                if (codigoRamo && idEvaluacion) {
                    const evalData = await getEvaluacionById(codigoRamo, idEvaluacion);
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
    }, [codigoRamo, idEvaluacion, pautaId]);

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
                } else if (c.puntaje < 0 || c.puntaje > 100) {
                    err[`criterio_puntaje_${idx}`] = 'El puntaje debe estar entre 0 y 100';
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
                await updatePauta(pauta.id, pautaToSend);
                alert('Pauta actualizada correctamente');
            } else {
                await createPauta(pautaToSend, idEvaluacion);
                alert('Pauta creada correctamente');
            }
            if (idEvaluacion) {
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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
            <div className="p-4 md:p-8 w-full max-w-3xl">
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
                            {pauta.id ? 'Editar Pauta' : 'Crear Pauta'}
                        </h1>
                        <p className="text-gray-600 mb-6">
                            Define los criterios y la distribución de puntajes para la evaluación.
                        </p>
                        {evaluacionData && (
                            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
                                <p className="text-sm text-gray-700">
                                    <span className="font-semibold text-indigo-700">Evaluación:</span> {evaluacionData.titulo}
                                </p>
                                <p className="text-sm text-gray-700 mt-2">
                                    <span className="font-semibold text-indigo-700">Puntaje Total:</span> {evaluacionData.puntajeTotal || 100}
                                </p>
                                {evaluacionData.fechaProgramada && (
                                    <p className="text-sm text-gray-700 mt-2">
                                        <span className="font-semibold text-indigo-700">Fecha:</span> {evaluacionData.fechaProgramada}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Formulario */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 md:p-8 space-y-6">
                        {error && (
                            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                <p className="text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        {/* Criterios */}
                        <div className="space-y-3">
                            <label className="block text-sm font-semibold text-gray-800">Criterios de evaluación *</label>
                            <textarea
                                name="criterios"
                                value={pauta.criterios}
                                onChange={handleChange}
                                className={`w-full rounded-xl border bg-white p-4 text-gray-800 shadow-sm outline-none focus:ring-4 min-h-[140px] transition ${
                                    hasFieldError("criterios")
                                        ? "border-red-500 bg-red-50 focus:ring-red-300"
                                        : "border-gray-300 focus:ring-indigo-300"
                                }`}
                                placeholder="Describe los criterios de evaluación que se van a usar..."
                            />
                            {hasFieldError("criterios") && (
                                <p className="text-red-600 text-sm">{getFieldError("criterios")}</p>
                            )}
                            <p className="text-xs text-gray-500">Mínimo 10 caracteres. Puedes usar saltos de línea para separar criterios.</p>
                        </div>

                        {/* Distribución de Puntajes Dinámica */}
                        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-gray-100 p-6 space-y-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800">Criterios y puntajes *</label>
                                    <p className="text-sm text-gray-600 mt-1">
                                        El total debe sumar exactamente <span className="font-bold">{puntajeTotalEval}</span> puntos.
                                    </p>
                                </div>
                                <div>
                                    <span
                                        className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold border ${
                                            totalOk
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : 'bg-red-50 text-red-700 border-red-200'
                                        }`}
                                    >
                                        <span className="font-bold">{totalPuntaje}</span>/{puntajeTotalEval}
                                    </span>
                                </div>
                            </div>

                            {hasFieldError("puntajeTotal") && (
                                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                                    <p className="text-red-600 text-sm font-medium">{getFieldError("puntajeTotal")}</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                {pauta.criteriosPuntaje.map((c, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row items-center gap-2">
                                        <input
                                            type="text"
                                            name={`criteriosPuntaje.nombre.${idx}`}
                                            value={c.nombre}
                                            onChange={handleChange}
                                            placeholder={`Nombre del criterio #${idx + 1}`}
                                            className={`w-full sm:w-1/2 rounded-xl border bg-white p-3 text-gray-800 shadow-sm outline-none focus:ring-4 transition ${
                                                hasFieldError(`criterio_nombre_${idx}`)
                                                    ? "border-red-500 bg-red-50 focus:ring-red-300"
                                                    : "border-gray-200 focus:ring-purple-300"
                                            }`}
                                        />
                                        <input
                                            type="number"
                                            name={`criteriosPuntaje.puntaje.${idx}`}
                                            value={c.puntaje}
                                            onChange={handleChange}
                                            min="0"
                                            max="100"
                                            inputMode="numeric"
                                            placeholder="Puntaje"
                                            className={`w-28 rounded-xl border bg-white p-3 text-gray-800 shadow-sm outline-none focus:ring-4 transition ${
                                                hasFieldError(`criterio_puntaje_${idx}`)
                                                    ? "border-red-500 bg-red-50 focus:ring-red-300"
                                                    : "border-gray-200 focus:ring-purple-300"
                                            }`}
                                        />
                                        <span className="text-sm text-gray-600">pts</span>
                                        {pauta.criteriosPuntaje.length > 1 && (
                                            <button type="button" onClick={() => handleRemoveCriterio(idx)} className="ml-2 px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200">-</button>
                                        )}
                                        {hasFieldError(`criterio_nombre_${idx}`) && (
                                            <p className="text-red-600 text-xs mt-1">{getFieldError(`criterio_nombre_${idx}`)}</p>
                                        )}
                                        {hasFieldError(`criterio_puntaje_${idx}`) && (
                                            <p className="text-red-600 text-xs mt-1">{getFieldError(`criterio_puntaje_${idx}`)}</p>
                                        )}
                                    </div>
                                ))}
                                <button type="button" onClick={handleAddCriterio} className="mt-2 px-4 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200">+ Agregar criterio</button>
                            </div>
                        </div>

                        {/* Publicar Pauta */}
                        <div className="flex items-center gap-3 p-5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 transition">
                            <input
                                type="checkbox"
                                id="publicada"
                                name="publicada"
                                checked={pauta.publicada}
                                onChange={handleChange}
                                className="h-5 w-5 cursor-pointer rounded border-gray-300"
                            />
                            <div className="flex-1">
                                <label htmlFor="publicada" className="text-sm font-semibold text-gray-800 cursor-pointer">
                                    Publicar pauta
                                </label>
                                <p className="text-xs text-gray-600 mt-1">Los estudiantes podrán ver esta pauta una vez publicada.</p>
                            </div>
                        </div>

                        {/* Botones de Acción */}
                        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => navigate(-1)}
                                className="px-6 py-3 rounded-lg border border-gray-300 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-all focus:outline-none focus:ring-2 focus:ring-gray-300"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading || !totalOk}
                                className={`font-semibold py-3 px-8 rounded-lg transition-all focus:outline-none focus:ring-2 ${
                                    isLoading || !totalOk
                                        ? "bg-gray-300 cursor-not-allowed text-gray-500"
                                        : "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white focus:ring-indigo-300"
                                }`}
                                title={!totalOk ? 'La suma de puntajes debe ser 100' : undefined}
                            >
                                {isLoading ? "Guardando..." : (pauta.id ? 'Guardar cambios' : 'Crear pauta')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
