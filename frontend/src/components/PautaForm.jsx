import { useState, useEffect } from "react";
import { showSuccessAlert } from "@/utils/alertUtils";
import { createPauta, updatePauta } from "../services/pauta.service.js";
import { updateEvaluacion } from "../services/evaluacion.service.js";

export default function PautaForm({ pautaEdit, evaluacionId, onSaved }) {
    const initialState = {
        criterios: '',
        // Ahora es un array de criterios
        criteriosPuntaje: [
            { nombre: '', puntaje: 0 }
        ],
        publicada: false
    };

    const [pauta, setPauta] = useState(initialState);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (pautaEdit) {
            // Si viene del backend, transformar distribucionPuntaje a array
            if (pautaEdit.distribucionPuntaje && typeof pautaEdit.distribucionPuntaje === 'object' && !Array.isArray(pautaEdit.distribucionPuntaje)) {
                setPauta({
                    ...pautaEdit,
                    criteriosPuntaje: Object.entries(pautaEdit.distribucionPuntaje).map(([nombre, puntaje]) => ({ nombre, puntaje })),
                });
            } else {
                setPauta(pautaEdit);
            }
        }
    }, [pautaEdit]);

    /**
     * Validaciones integradas basadas en Joi
     */
    const validarPauta = (pauta_data) => {
        const err = {};

        // ===== CRITERIOS =====
        if (!pauta_data.criterios || pauta_data.criterios.trim() === "") {
            err.criterios = "El criterio es obligatorio";
        } else if (pauta_data.criterios.trim().length < 10) {
            err.criterios = "Los criterios deben tener al menos 10 caracteres";
        }

        // ===== CRITERIOS PUNTAJE =====
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

        // ===== VALIDAR QUE LA SUMA SEA 100 =====
        const total = pauta_data.criteriosPuntaje.reduce((sum, c) => sum + Number(c.puntaje), 0);
        if (total !== 100) {
            err.puntajeTotal = `La suma de los puntajes debe ser 100 (actual: ${total})`;
        }

        // ===== PUBLICADA (BOOLEAN) =====
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

        // Validar antes de enviar
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
                showSuccessAlert('Éxito', 'Pauta actualizada correctamente');
            } else {
                const createdPauta = await createPauta(pautaToSend, evaluacionId);
                
                // Si se creó exitosamente y hay evaluacionId, actualizar la evaluación
                if (createdPauta && createdPauta.id && evaluacionId) {
                    console.log("Actualizando evaluación con idPauta:", createdPauta.id);
                    await updateEvaluacion(evaluacionId, { idPauta: createdPauta.id });
                }
                
                showSuccessAlert('Éxito', 'Pauta creada correctamente');
            }

            setPauta(initialState);
            setErrors({});
            onSaved();
        } catch (error) {
            setError(error.message || "Error al guardar la pauta");
        } finally {
            setIsLoading(false);
        }
    };

    const totalPuntaje = pauta.criteriosPuntaje.reduce((sum, c) => sum + Number(c.puntaje), 0);
    const totalOk = totalPuntaje === 100;
    const getFieldError = (fieldName) => errors[fieldName];
    const hasFieldError = (fieldName) => !!errors[fieldName];

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
                        {pauta.id ? 'Editar pauta' : 'Nueva pauta'}
                    </h2>
                    <p className="mt-1 text-sm text-gray-600">
                        Define criterios y asigna puntajes (total 100).
                    </p>
                </div>
                <div>
                    <span
                        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                            pauta.publicada
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                    >
                        {pauta.publicada ? 'Publicada' : 'Borrador'}
                    </span>
                </div>
            </div>

            {/* Criterios */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-800">Criterios de evaluación *</label>
                <textarea
                    name="criterios"
                    value={pauta.criterios}
                    onChange={handleChange}
                    className={`w-full rounded-xl border bg-white p-3 text-gray-800 shadow-sm outline-none focus:ring-4 min-h-[120px] transition ${
                        hasFieldError("criterios")
                            ? "border-red-500 bg-red-50 focus:ring-red-300"
                            : "border-gray-200 focus:ring-purple-300"
                    }`}
                    placeholder="Describe los criterios de evaluación..."
                />
                {hasFieldError("criterios") && (
                    <p className="text-red-600 text-sm mt-1">{getFieldError("criterios")}</p>
                )}
                <p className="text-xs text-gray-500">Puedes usar saltos de línea para separar criterios. Mínimo 10 caracteres.</p>
            </div>

            {/* Distribución de Puntajes Dinámica */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800">Criterios y puntajes *</label>
                        <p className="text-sm text-gray-600">El total debe sumar exactamente 100 puntos.</p>
                    </div>
                    <div>
                        <span
                            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold border ${
                                totalOk
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : 'bg-red-50 text-red-700 border-red-200'
                            }`}
                        >
                            Total: {totalPuntaje}/100
                        </span>
                    </div>
                </div>

                {/* Error de Puntaje Total */}
                {hasFieldError("puntajeTotal") && (
                    <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2">
                        <p className="text-red-600 text-sm">{getFieldError("puntajeTotal")}</p>
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
            <div className="flex items-center gap-3 p-4 rounded-xl border border-gray-200 bg-gray-50">
                <input
                    type="checkbox"
                    id="publicada"
                    name="publicada"
                    checked={pauta.publicada}
                    onChange={handleChange}
                    className="h-4 w-4 cursor-pointer"
                />
                <div className="flex-1">
                    <label htmlFor="publicada" className="text-sm font-medium text-gray-800 cursor-pointer">
                        Publicar pauta
                    </label>
                </div>
            </div>

            {/* Botón Submit */}
            <div className="flex items-center justify-end">
                <button
                    type="submit"
                    disabled={isLoading || !totalOk}
                    className={`font-bold py-3 px-6 rounded-xl transition-all duration-300 focus:outline-none focus:ring-4 ${
                        isLoading || !totalOk
                            ? "bg-gray-400 cursor-not-allowed text-gray-600"
                            : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white focus:ring-purple-300"
                    }`}
                    title={!totalOk ? 'La suma de puntajes debe ser 100' : undefined}
                >
                    {isLoading
                        ? "Guardando..."
                        : (pauta.id ? 'Guardar cambios' : 'Crear pauta')}
                </button>
            </div>
        </form>
    );
}