import { useState, useEffect } from "react";
import { createEvaluacion, updateEvaluacion } from "../services/evaluacion.service.js";
import { getAllPautas } from "../services/pauta.service.js";

export default function EvaluacionForm({ evaluacionEdit, onSaved }) {
    const initialState = {
        titulo: "",
        fechaProgramada: "",
        ponderacion: 0,
        contenidos: "",
        estado: "pendiente",
        pauta: { id: null },
        pautaPublicada: false,
    };

    const [evaluacion, setEvaluacion] = useState(initialState);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [pautas, setPautas] = useState([]);

    // Cargar pautas al montar el componente
    useEffect(() => {
        const loadPautas = async () => {
            try {
                const data = await getAllPautas();
                setPautas(data);
            } catch (error) {
                setError("Error al cargar las pautas");
            }
        };
        loadPautas();
    }, []);

    useEffect(() => {
        if (evaluacionEdit) setEvaluacion(evaluacionEdit);
    }, [evaluacionEdit]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        if (name === "pautaPublicada") {
            setEvaluacion({
                ...evaluacion,
                pautaPublicada: checked
            });
        } else if (name === "ponderacion") {
            setEvaluacion({
                ...evaluacion,
                ponderacion: Number(value)
            });
        } else if (name === "pauta") {
            setEvaluacion({
                ...evaluacion,
                pauta: { id: Number(value) }
            });
        } else {
            setEvaluacion({
                ...evaluacion,
                [name]: value
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        // Validaciones
        if (!evaluacion.titulo || !evaluacion.fechaProgramada || !evaluacion.contenidos) {
            setError("Todos los campos marcados son obligatorios");
            setIsLoading(false);
            return;
        }

        if (evaluacion.ponderacion <= 0 || evaluacion.ponderacion > 100) {
            setError("La ponderación debe estar entre 1 y 100");
            setIsLoading(false);
            return;
        }

        if (!evaluacion.pauta.id) {
            setError("Debe seleccionar una pauta");
            setIsLoading(false);
            return;
        }

        try {
            if (evaluacion.id) {
                await updateEvaluacion(evaluacion.id, evaluacion);
                alert("Evaluación actualizada correctamente");
            } else {
                await createEvaluacion(evaluacion);
                alert("Evaluación creada correctamente");
            }
            setEvaluacion(initialState);
            onSaved();
        } catch (error) {
            setError(error.message || "Error al guardar la evaluación");
        } finally {
            setIsLoading(false);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded bg-gray-50 space-y-4">
            <h2 className="text-xl font-semibold">
                {evaluacion.id ? "Editar Evaluación" : "Nueva Evaluación"}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block mb-1">Título: *</label>
                <input
                    type="text"
                    name="titulo"
                    value={evaluacion.titulo}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    placeholder="Título de la evaluación"
                    required
                />
            </div>

            <div>
                <label className="block mb-1">Fecha Programada: *</label>
                <input
                    type="date"
                    name="fechaProgramada"
                    value={evaluacion.fechaProgramada}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    required
                />
            </div>

            <div>
                <label className="block mb-1">Ponderación (%): *</label>
                <input
                    type="number"
                    name="ponderacion"
                    value={evaluacion.ponderacion}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    min="1"
                    max="100"
                    required
                />
            </div>

            <div>
                <label className="block mb-1">Contenidos: *</label>
                <textarea
                    name="contenidos"
                    value={evaluacion.contenidos}
                    onChange={handleChange}
                    className="border p-2 w-full rounded min-h-[100px]"
                    placeholder="Contenidos a evaluar"
                    required
                />
            </div>

            <div>
                <label className="block mb-1">Estado:</label>
                <select
                    name="estado"
                    value={evaluacion.estado}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                >
                    <option value="pendiente">Pendiente</option>
                    <option value="aplicada">Aplicada</option>
                    <option value="finalizada">Finalizada</option>
                </select>
            </div>

            <div>
                <label className="block mb-1">Pauta: *</label>
                <select
                    name="pauta"
                    value={evaluacion.pauta.id || ""}
                    onChange={handleChange}
                    className="border p-2 w-full rounded"
                    required
                >
                    <option value="">Seleccione una pauta</option>
                    {pautas.map(p => (
                        <option key={p.id} value={p.id}>
                            {p.criterios || `Pauta ${p.id}`}
                        </option>
                    ))}
                </select>
            </div>

            <div>
               
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="pautaPublicada"
                    checked={evaluacion.pautaPublicada}
                    onChange={handleChange}
                    className="h-4 w-4"
                />
                <label>Publicar pauta</label>
            </div>

            <button
                type="submit"
                disabled={isLoading}
                className={`w-full ${
                    isLoading 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-blue-500 hover:bg-blue-600"
                } text-white px-4 py-2 rounded transition`}
            >
                {isLoading 
                    ? "Guardando..." 
                    : (evaluacion.id ? "Actualizar Evaluación" : "Crear Evaluación")
                }
            </button>
        </form>
    );
}