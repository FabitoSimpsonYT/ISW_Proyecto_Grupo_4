import { useState, useEffect } from "react";
import { createPauta, updatePauta } from "../services/pauta.service.js";

export default function PautaForm({pautaEdit, onSaved}){
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
    
    useEffect(() => {
        if(pautaEdit) setPauta(pautaEdit);
    }, [pautaEdit]);
    
    const handleChange = (e) => {
        const {name, value} = e.target;
        if (name.startsWith('distribucionPuntaje.')) {
            const pregunta = name.split('.')[1];
            setPauta({
                ...pauta,
                distribucionPuntaje: {
                    ...pauta.distribucionPuntaje,
                    [pregunta]: Number(value)
                }
            });
        } else if (name === 'publicada') {
            setPauta({...pauta, [name]: e.target.checked});
        } else {
            setPauta({...pauta, [name]: value});
        }
    };

    const validatePuntajes = () => {
        const total = Object.values(pauta.distribucionPuntaje).reduce((sum, val) => sum + val, 0);
        if (total !== 100) {
            setError('La suma de los puntajes debe ser 100');
            return false;
        }
        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!pauta.criterios) {
            setError('Los criterios son obligatorios');
            return;
        }

        if (!validatePuntajes()) {
            return;
        }

        try {
            if(pauta.id){
                await updatePauta(pauta.id, pauta);
                alert('Pauta actualizada correctamente');
            } else {
                await createPauta(pauta);
                alert('Pauta creada correctamente');
            }

            setPauta(initialState);
            onSaved();
        } catch (error) {
            setError(error.message);
        }
    };
    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded bg-gray-50 space-y-4">
            <h2 className="text-xl font-semibold">
                {pauta.id ? 'Editar Pauta' : 'Nueva Pauta'}
            </h2>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                    {error}
                </div>
            )}

            <div>
                <label className="block mb-1">Criterios de Evaluación:</label>
                <textarea
                    name="criterios"
                    value={pauta.criterios}
                    onChange={handleChange}
                    className="border p-2 w-full rounded min-h-[100px]"
                    placeholder="Describe los criterios de evaluación..."
                    required
                />
            </div>

            <div className="space-y-3">
                <label className="block font-medium">Distribución de Puntajes:</label>
                <p className="text-sm text-gray-600">El total debe sumar 100 puntos</p>
                
                {Object.entries(pauta.distribucionPuntaje).map(([pregunta, puntaje]) => (
                    <div key={pregunta} className="flex items-center gap-3">
                        <label className="w-24">{pregunta}:</label>
                        <input
                            type="number"
                            name={`distribucionPuntaje.${pregunta}`}
                            value={puntaje}
                            onChange={handleChange}
                            className="border p-2 rounded w-20"
                            min="0"
                            max="100"
                            required
                        />
                        <span>puntos</span>
                    </div>
                ))}
                
                <div className="font-medium">
                    Total: {Object.values(pauta.distribucionPuntaje).reduce((a, b) => a + b, 0)} puntos
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    name="publicada"
                    checked={pauta.publicada}
                    onChange={handleChange}
                    className="h-4 w-4"
                />
                <label>Publicar pauta</label>
            </div>

            <button 
                type="submit" 
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded transition"
            >
                {pauta.id ? 'Actualizar' : 'Crear'}
            </button>
        </form>
    );
}