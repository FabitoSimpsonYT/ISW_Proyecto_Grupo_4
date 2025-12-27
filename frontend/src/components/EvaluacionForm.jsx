import { useState, useEffect } from "react";
import { createEvaluacion, updateEvaluacion, getEvaluacionesByCodigoRamo } from "../services/evaluacion.service.js";
import { createEvaluacionIntegradora, updateEvaluacionIntegradora } from "../services/evaluacionIntegradora.service.js";
import { getAllPautas } from "../services/pauta.service.js";

export default function EvaluacionForm({ evaluacionEdit, onSaved, ramo, hideRamoFields = false, isIntegradora = false }) {
    const initialState = {
        titulo: "",
        fechaProgramada: "",
        horaInicio: "",
        horaFin: "",
        ponderacion: 0,
        contenidos: "",
        estado: "pendiente",
        pauta: { id: null },
        pautaPublicada: false,
        ramo_id: "",
        codigoRamo: "",
        puntajeTotal: 0,
    };

    const [evaluacion, setEvaluacion] = useState(initialState);
    const [error, setError] = useState("");
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [pautas, setPautas] = useState([]);

    const normalizeFechaInput = (value) => {
        if (!value) return "";
        if (value instanceof Date) return value.toISOString().slice(0, 10);
        const str = String(value);
        return str.includes("T") ? str.split("T")[0] : str;
    };

    const normalizePauta = (pautaValue) => {
        if (!pautaValue) return { id: null };
        if (typeof pautaValue === "object") {
            return { id: pautaValue.id ?? null };
        }
        const n = Number(pautaValue);
        return Number.isFinite(n) ? { id: n } : { id: null };
    };

    
    useEffect(() => {
        const loadPautas = async () => {
            try {
                const data = await getAllPautas();
                setPautas(Array.isArray(data) ? data : (data?.data || []));
            } catch (error) {
                console.error("Error al cargar pautas:", error);
                setPautas([]);
                // No establecemos error para no romper la UI
            }
        };
        loadPautas();
    }, []);

    useEffect(() => {
        if (evaluacionEdit) {
            console.log("Editando evaluación:", evaluacionEdit);
            const next = {
                ...initialState,
                ...evaluacionEdit,
            };

            next.fechaProgramada = normalizeFechaInput(next.fechaProgramada);
            next.pauta = normalizePauta(evaluacionEdit.pauta ?? next.pauta);

            const ramoId =
                evaluacionEdit.ramo_id ??
                evaluacionEdit.ramo?.id ??
                ramo?.id ??
                "";
            const codigoRamo =
                evaluacionEdit.codigoRamo ??
                evaluacionEdit.ramo?.codigo ??
                ramo?.codigo ??
                "";

            next.ramo_id = ramoId ? String(ramoId) : "";
            next.codigoRamo = codigoRamo ? String(codigoRamo) : "";

            console.log("Estado actualizado:", next);
            setEvaluacion(next);
            setErrors({});
            return;
        }

        if (ramo) {
            console.log("Nueva evaluación para ramo:", ramo);
            setEvaluacion({
                ...initialState,
                ramo_id: ramo?.id ? String(ramo.id) : "",
                codigoRamo: ramo?.codigo ? String(ramo.codigo) : "",
            });
            setErrors({});
        }
    }, [evaluacionEdit, ramo]);


    /**
     * Valida que la suma de ponderaciones no exceda 100%
     */
    const validarPonderacion = async (codigoRamo, nuevaPonderacion, evaluacionIdActual = null) => {
        try {
            if (!codigoRamo || !nuevaPonderacion) return null;
            
            const evaluaciones = await getEvaluacionesByCodigoRamo(codigoRamo);
            
            // Filtrar evaluaciones integradoras y la evaluación actual (si es update)
            const evaluacionesNormales = evaluaciones.filter(ev => {
                const esIntegradora = ev.esIntegradora || ev.evaluacionIntegradoraId;
                const esActual = evaluacionIdActual && ev.id === evaluacionIdActual;
                return !esIntegradora && !esActual;
            });
            
            const sumaPonderacionesExistentes = evaluacionesNormales.reduce((sum, ev) => sum + (Number(ev.ponderacion) || 0), 0);
            const sumaTotalPonderaciones = sumaPonderacionesExistentes + Number(nuevaPonderacion);
            
            if (sumaTotalPonderaciones > 100) {
                return `La suma de ponderaciones no puede exceder 100%. Evaluaciones existentes suman ${sumaPonderacionesExistentes}% + nueva ${nuevaPonderacion}% = ${sumaTotalPonderaciones}%`;
            }
            
            return null;
        } catch (error) {
            console.error("Error validando ponderación:", error);
            return null;
        }
    };
    
    const validarEvaluacion = (eval_data) => {
        const err = {};
        const isEditing = !!eval_data.id; // Si tiene ID, es modo edición

      
        if (!eval_data.titulo || eval_data.titulo.trim() === "") {
            err.titulo = "El título es obligatorio";
        } else if (eval_data.titulo.trim().length < 3) {
            err.titulo = "El título debe tener al menos 3 caracteres";
        } else if (eval_data.titulo.length > 255) {
            err.titulo = "El título no puede exceder los 255 caracteres";
        }

     
        if (!eval_data.fechaProgramada) {
            err.fechaProgramada = "La fecha programada es obligatoria";
        } else if (!isEditing) {
            // Solo validar que sea futura si estamos creando
            const fecha = new Date(eval_data.fechaProgramada);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            const manana = new Date(hoy);
            manana.setDate(manana.getDate() + 1);

            if (isNaN(fecha.getTime())) {
                err.fechaProgramada = "La fecha debe ser válida";
            } else if (fecha < manana) {
                err.fechaProgramada = "La fecha debe ser igual o posterior a mañana";
            }
        }

        
        if (!eval_data.horaInicio) {
            err.horaInicio = "La hora de inicio es obligatoria";
        } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(eval_data.horaInicio)) {
            err.horaInicio = "La hora de inicio debe estar en formato HH:mm (ej: 10:30)";
        }

       
        if (!eval_data.horaFin) {
            err.horaFin = "La hora de fin es obligatoria";
        } else if (!/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(eval_data.horaFin)) {
            err.horaFin = "La hora de fin debe estar en formato HH:mm (ej: 11:30)";
        }

       
        if (eval_data.horaInicio && eval_data.horaFin) {
            if (eval_data.horaInicio >= eval_data.horaFin) {
                err.horaFin = "La hora de fin debe ser posterior a la hora de inicio";
            }
        }

      
        if (eval_data.ponderacion === "" || eval_data.ponderacion === null) {
            if (!isEditing) {
                err.ponderacion = "La ponderación es obligatoria";
            }
        } else if (isNaN(eval_data.ponderacion)) {
            err.ponderacion = "La ponderación debe ser un número";
        } else if (eval_data.ponderacion < 0) {
            err.ponderacion = "La ponderación no puede ser menor a 0";
        } else if (eval_data.ponderacion > 100) {
            err.ponderacion = "La ponderación no puede superar los 100";
        }

       
        if (!eval_data.contenidos || eval_data.contenidos.trim() === "") {
            if (!isEditing) {
                err.contenidos = "El campo contenido es obligatorio";
            }
        } else if (eval_data.contenidos.trim().length < 10) {
            err.contenidos = "El contenido debe tener al menos 10 caracteres";
        }

       
        if (!ramo && (!eval_data.codigoRamo || eval_data.codigoRamo.trim() === "")) {
            err.codigoRamo = "El código del ramo es obligatorio";
        }

       
        if (!ramo && (!eval_data.ramo_id || eval_data.ramo_id.trim() === "")) {
            err.ramo_id = "El ID del ramo es obligatorio";
        }

        
        if (eval_data.puntajeTotal === "" || eval_data.puntajeTotal === null) {
            if (!isEditing) {
                err.puntajeTotal = "El puntaje total es obligatorio";
            }
        } else if (isNaN(eval_data.puntajeTotal)) {
            err.puntajeTotal = "El puntaje total debe ser un número entero";
        } else if (!Number.isInteger(Number(eval_data.puntajeTotal))) {
            err.puntajeTotal = "El puntaje total debe ser un número entero";
        } else if (eval_data.puntajeTotal < 1) {
            err.puntajeTotal = "El puntaje total debe ser al menos 1";
        }

        
        const estadosValidos = ["pendiente", "aplicada", "finalizada"];
        if (!estadosValidos.includes(eval_data.estado)) {
            err.estado = "El estado debe ser 'pendiente', 'aplicada' o 'finalizada'";
        }

        
        // La pauta es opcional (comentado para hacerla opcional)
        // if (!eval_data.pauta?.id || eval_data.pauta.id === null) {
        //     err.pauta = "Debe seleccionar una pauta";
        // }

        return err;
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        if (name === "pautaPublicada") {
            setEvaluacion({
                ...evaluacion,
                pautaPublicada: checked,
            });
            setErrors({ ...errors, pautaPublicada: "" });
            return;
        }

        if (name === "pauta") {
            setEvaluacion({
                ...evaluacion,
                pauta: { id: Number(value) },
            });
            setErrors({ ...errors, pauta: "" });
            return;
        }

        if (type === "number") {
            setEvaluacion({ ...evaluacion, [name]: Number(value) });
        } else {
            setEvaluacion({ ...evaluacion, [name]: value });
        }

        
        setErrors({ ...errors, [name]: "" });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        
        const validationErrors = validarEvaluacion(evaluacion);
        console.log("Errores de validación:", validationErrors);
        console.log("Datos del formulario:", evaluacion);

        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            console.error("Validación fallida, no se envía");
            return;
        }

        // Validar ponderación si se trata de una evaluación normal
        if (!isIntegradora && evaluacion.codigoRamo && evaluacion.ponderacion) {
            const ponderacionError = await validarPonderacion(
                evaluacion.codigoRamo, 
                evaluacion.ponderacion,
                evaluacion.id // pasar el ID si es una actualización
            );
            
            if (ponderacionError) {
                setError(ponderacionError);
                setIsLoading(false);
                return;
            }
        }

        setErrors({});
        setIsLoading(true);
        try {
            const pautaVal = evaluacion.pauta?.id ?? evaluacion.pauta ?? null;
            // Convertir pauta a número o null
            let pautaFinal = null;
            if (pautaVal !== null && pautaVal !== undefined && pautaVal !== '') {
                const num = Number(pautaVal);
                pautaFinal = Number.isFinite(num) ? num : null;
            }

            const payload = {
                titulo: evaluacion.titulo,
                fechaProgramada: evaluacion.fechaProgramada,
                horaInicio: evaluacion.horaInicio,
                horaFin: evaluacion.horaFin,
                ponderacion: evaluacion.ponderacion,
                contenidos: evaluacion.contenidos,
                estado: evaluacion.estado,
                pauta: pautaFinal,
                pautaPublicada: evaluacion.pautaPublicada,
                puntajeTotal: evaluacion.puntajeTotal,
            };

            // Solo agregar codigoRamo y ramo_id si tienen valor
            if (evaluacion.codigoRamo) {
                payload.codigoRamo = evaluacion.codigoRamo;
            }
            if (evaluacion.ramo_id) {
                payload.ramo_id = evaluacion.ramo_id;
            }

            console.log("Payload a enviar:", payload);

            if (evaluacion.id) {
                console.log("Actualizando evaluación...");
                let updateResult;
                if (isIntegradora) {
                    updateResult = await updateEvaluacionIntegradora(evaluacion.id, payload);
                } else {
                    updateResult = await updateEvaluacion(evaluacion.id, payload);
                }
                console.log("Resultado de actualización:", updateResult);
                alert("Evaluación actualizada correctamente");
            } else {
                console.log("Creando nueva evaluación...");
                let createResult;
                if (isIntegradora) {
                    createResult = await createEvaluacionIntegradora(ramo?.codigo, payload);
                } else {
                    createResult = await createEvaluacion(payload);
                }
                console.log("Resultado de creación:", createResult);
                alert("Evaluación creada correctamente");
            }
            setEvaluacion(initialState);
            setErrors({});
            onSaved();
        } catch (error) {
            console.error("Error en handleSubmit:", error);
            const errorMessage = error?.message || error?.error || "Error al guardar la evaluación";
            setError(errorMessage);
            alert("Error: " + errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const getFieldError = (fieldName) => errors[fieldName];
    const hasFieldError = (fieldName) => !!errors[fieldName];

    return (
        <form onSubmit={handleSubmit} className="p-6 border rounded bg-gray-50 space-y-5">
            <h2 className="text-xl font-semibold text-gray-800">
                {evaluacion.id ? "Editar Evaluación" : "Nueva Evaluación"}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
                    {error}
                </div>
            )}


            {/* Título */}
            <div>
                <label className="block mb-1 font-semibold text-gray-700">Título: *</label>
                <input
                    type="text"
                    name="titulo"
                    value={evaluacion.titulo}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded transition ${
                        hasFieldError("titulo")
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-blue-500"
                    }`}
                    placeholder="Título de la evaluación"
                />
                {hasFieldError("titulo") && (
                    <p className="text-red-600 text-sm mt-1">{getFieldError("titulo")}</p>
                )}
            </div>

            {/* Fecha Programada */}
            <div>
                <label className="block mb-1 font-semibold text-gray-700">Fecha Programada: *</label>
                <input
                    type="date"
                    name="fechaProgramada"
                    value={evaluacion.fechaProgramada}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded transition ${
                        hasFieldError("fechaProgramada")
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-blue-500"
                    }`}
                />
                {hasFieldError("fechaProgramada") && (
                    <p className="text-red-600 text-sm mt-1">{getFieldError("fechaProgramada")}</p>
                )}
            </div>

            {/* Horas */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block mb-1 font-semibold text-gray-700">Hora Inicio: *</label>
                    <input
                        type="time"
                        name="horaInicio"
                        value={evaluacion.horaInicio}
                        onChange={handleChange}
                        className={`border p-2 w-full rounded transition ${
                            hasFieldError("horaInicio")
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 focus:border-blue-500"
                        }`}
                    />
                    {hasFieldError("horaInicio") && (
                        <p className="text-red-600 text-sm mt-1">{getFieldError("horaInicio")}</p>
                    )}
                </div>
                <div>
                    <label className="block mb-1 font-semibold text-gray-700">Hora Fin: *</label>
                    <input
                        type="time"
                        name="horaFin"
                        value={evaluacion.horaFin}
                        onChange={handleChange}
                        className={`border p-2 w-full rounded transition ${
                            hasFieldError("horaFin")
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 focus:border-blue-500"
                        }`}
                    />
                    {hasFieldError("horaFin") && (
                        <p className="text-red-600 text-sm mt-1">{getFieldError("horaFin")}</p>
                    )}
                </div>
            </div>

            {/* Ponderación */}
            <div>
                <label className="block mb-1 font-semibold text-gray-700">Ponderación (%): *</label>
                <input
                    type="number"
                    name="ponderacion"
                    value={evaluacion.ponderacion}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded transition ${
                        hasFieldError("ponderacion")
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-blue-500"
                    }`}
                    min="0"
                    max="100"
                />
                {hasFieldError("ponderacion") && (
                    <p className="text-red-600 text-sm mt-1">{getFieldError("ponderacion")}</p>
                )}
            </div>

            {/* Ramo y Puntaje Total */}
            <div className="grid grid-cols-3 gap-4">
                {!hideRamoFields && (
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Código Ramo:</label>
                        <input
                            type="text"
                            name="codigoRamo"
                            value={evaluacion.codigoRamo}
                            onChange={handleChange}
                            className={`border p-2 w-full rounded transition ${
                                hasFieldError("codigoRamo")
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                            placeholder="Código del ramo"
                            disabled={!!ramo}
                        />
                        {hasFieldError("codigoRamo") && (
                            <p className="text-red-600 text-sm mt-1">{getFieldError("codigoRamo")}</p>
                        )}
                    </div>
                )}
                {!hideRamoFields && (
                    <div>
                        <label className="block mb-1 font-semibold text-gray-700">Ramo ID:</label>
                        <input
                            type="text"
                            name="ramo_id"
                            value={evaluacion.ramo_id}
                            onChange={handleChange}
                            className={`border p-2 w-full rounded transition ${
                                hasFieldError("ramo_id")
                                    ? "border-red-500 bg-red-50"
                                    : "border-gray-300 focus:border-blue-500"
                            }`}
                            placeholder="ID del ramo"
                            disabled={!!ramo}
                        />
                        {hasFieldError("ramo_id") && (
                            <p className="text-red-600 text-sm mt-1">{getFieldError("ramo_id")}</p>
                        )}
                    </div>
                )}
                <div className={!hideRamoFields ? "" : "col-span-3"}>
                    <label className="block mb-1 font-semibold text-gray-700">Puntaje Total: *</label>
                    <input
                        type="number"
                        name="puntajeTotal"
                        value={evaluacion.puntajeTotal}
                        onChange={handleChange}
                        className={`border p-2 w-full rounded transition ${
                            hasFieldError("puntajeTotal")
                                ? "border-red-500 bg-red-50"
                                : "border-gray-300 focus:border-blue-500"
                        }`}
                        min="1"
                    />
                    {hasFieldError("puntajeTotal") && (
                        <p className="text-red-600 text-sm mt-1">{getFieldError("puntajeTotal")}</p>
                    )}
                </div>
            </div>

            {/* Contenidos */}
            <div>
                <label className="block mb-1 font-semibold text-gray-700">Contenidos: *</label>
                <textarea
                    name="contenidos"
                    value={evaluacion.contenidos}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded min-h-[100px] transition ${
                        hasFieldError("contenidos")
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-blue-500"
                    }`}
                    placeholder="Contenidos a evaluar"
                />
                {hasFieldError("contenidos") && (
                    <p className="text-red-600 text-sm mt-1">{getFieldError("contenidos")}</p>
                )}
            </div>

            {/* Estado */}
            <div>
                <label className="block mb-1 font-semibold text-gray-700">Estado:</label>
                <select
                    name="estado"
                    value={evaluacion.estado}
                    onChange={handleChange}
                    className={`border p-2 w-full rounded transition ${
                        hasFieldError("estado")
                            ? "border-red-500 bg-red-50"
                            : "border-gray-300 focus:border-blue-500"
                    }`}
                >
                    <option value="pendiente">Pendiente</option>
                    <option value="aplicada">Aplicada</option>
                    <option value="finalizada">Finalizada</option>
                </select>
                {hasFieldError("estado") && (
                    <p className="text-red-600 text-sm mt-1">{getFieldError("estado")}</p>
                )}
            </div>

            {/* Publicar Evaluación */}
            <div className="flex items-center gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                <input
                    type="checkbox"
                    name="pautaPublicada"
                    id="pautaPublicada"
                    checked={evaluacion.pautaPublicada}
                    onChange={handleChange}
                    className="h-4 w-4 cursor-pointer"
                />
                <label htmlFor="pautaPublicada" className="cursor-pointer font-semibold text-gray-700">
                    Publicar evaluación
                </label>
            </div>

            {/* Botón Submit */}
            <button
                type="submit"
                disabled={isLoading}
                className={`w-full py-3 px-4 rounded font-semibold transition ${
                    isLoading
                        ? "bg-gray-400 cursor-not-allowed text-gray-600"
                        : "bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg"
                }`}
            >
                {isLoading
                    ? "Guardando..."
                    : evaluacion.id
                    ? "Actualizar Evaluación"
                    : "Crear Evaluación"}
            </button>
        </form>
    );
}