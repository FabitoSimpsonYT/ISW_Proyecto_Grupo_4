import { useState, useEffect } from "react";
import { createPauta, updatePauta } from "../services/pauta.service.js";

export default function PautaForm({ pautaEdit, onSaved }) {
    const initialState = {
        criterios: '',
        distribucionPuntaje: {
            pregunta1: 0,
            pregunta2: 0,
            pregunta3: 0
        },
        publicada: false
    };

    const [pauta, setPauta] = useState(initialState);
    const [error, setError] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (pautaEdit) setPauta(pautaEdit);
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

        // ===== DISTRIBUCION PUNTAJE =====
        const distribucionStr = JSON.stringify(pauta_data.distribucionPuntaje);
        if (!distribucionStr || distribucionStr.trim() === "" || distribucionStr === "{}") {
            err.distribucionPuntaje = "La distribución de puntaje es obligatoria";
        } else if (distribucionStr.length < 5) {
            err.distribucionPuntaje = "La distribución de puntaje debe tener al menos 5 caracteres";
        }

        // ===== VALIDAR QUE LA SUMA SEA 100 =====
        const total = Object.values(pauta_data.distribucionPuntaje).reduce((sum, val) => sum + val, 0);
        if (total !== 100) {
            err.puntajeTotal = `La suma de los puntajes debe ser 100 (actual: ${total})`;
        }

        // ===== VALIDAR QUE CADA PUNTAJE SEA VÁLIDO =====
        Object.entries(pauta_data.distribucionPuntaje).forEach(([pregunta, puntaje]) => {
            if (puntaje < 0 || puntaje > 100) {
                err[`puntaje_${pregunta}`] = `${pregunta} debe estar entre 0 y 100`;
            }
        });

        // ===== PUBLICADA (BOOLEAN) =====
        if (typeof pauta_data.publicada !== "boolean") {
            err.publicada = "La 'publicada' debe ser verdadero o falso";
        }

        return err;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        
        if (name.startsWith('distribucionPuntaje.')) {
            const pregunta = name.split('.')[1];
            setPauta({
                ...pauta,
                distribucionPuntaje: {
                    ...pauta.distribucionPuntaje,
                    [pregunta]: Number(value)
                }
            });
            // Limpiar errores de puntaje
            setErrors({
                ...errors,
                [`puntaje_${pregunta}`]: "",
                puntajeTotal: ""
            });
        } else if (name === 'publicada') {
            setPauta({ ...pauta, [name]: e.target.checked });
            setErrors({ ...errors, publicada: "" });
        } else {
            setPauta({ ...pauta, [name]: value });
            // Limpiar error del campo cuando el usuario empieza a escribir
            setErrors({ ...errors, [name]: "" });
        }
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

        try {
            if (pauta.id) {
                await updatePauta(pauta.id, pauta);
                alert('Pauta actualizada correctamente');
            } else {
                await createPauta(pauta);
                alert('Pauta creada correctamente');
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

    const totalPuntaje = Object.values(pauta.distribucionPuntaje).reduce((sum, val) => sum + val, 0);
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

            {/* Distribución de Puntajes */}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 md:p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-gray-800">Distribución de puntajes *</label>
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {Object.entries(pauta.distribucionPuntaje).map(([pregunta, puntaje]) => (
                        <div key={pregunta} className="space-y-2">
                            <label className="block text-sm font-medium text-gray-800">{pregunta} *</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    name={`distribucionPuntaje.${pregunta}`}
                                    value={puntaje}
                                    onChange={handleChange}
                                    className={`w-full rounded-xl border bg-white p-3 text-gray-800 shadow-sm outline-none focus:ring-4 transition ${
                                        hasFieldError(`puntaje_${pregunta}`)
                                            ? "border-red-500 bg-red-50 focus:ring-red-300"
                                            : "border-gray-200 focus:ring-purple-300"
                                    }`}
                                    min="0"
                                    max="100"
                                    inputMode="numeric"
                                />
                                <span className="text-sm text-gray-600">pts</span>
                            </div>
                            {hasFieldError(`puntaje_${pregunta}`) && (
                                <p className="text-red-600 text-xs mt-1">{getFieldError(`puntaje_${pregunta}`)}</p>
                            )}
                        </div>
                    ))}
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
                    <p className="text-xs text-gray-500"></p>
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