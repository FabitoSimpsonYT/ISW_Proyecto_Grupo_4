import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllPautas } from "../services/pauta.service";

export default function VisualizarPautas() {
    const [pautas, setPautas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const cargarPautas = async () => {
            try {
                const response = await getAllPautas();
                // Si es alumno, filtrar solo las pautas publicadas
                const pautasFiltradas = user?.role === "alumno" 
                    ? response.filter(p => p.publicada)
                    : response;
                setPautas(pautasFiltradas);
            } catch (err) {
                setError("Error al cargar las pautas");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        cargarPautas();
    }, [user]);

    if (loading) return <div className="text-center p-4">Cargando pautas...</div>;
    if (error) return <div className="text-red-500 text-center p-4">{error}</div>;

    return (
        <div className="max-w-4xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-6">Pautas de Evaluación</h1>
            
            {pautas.length === 0 ? (
                <p className="text-gray-500 text-center">No hay pautas disponibles.</p>
            ) : (
                <div className="space-y-4">
                    {pautas.map((pauta) => (
                        <div key={pauta.id} className="bg-white shadow rounded-lg p-6">
                            <div className="mb-4">
                                <h3 className="text-lg font-semibold mb-2">Criterios de Evaluación</h3>
                                <p className="text-gray-600">{pauta.criterios}</p>
                            </div>
                            
                            <div>
                                <h4 className="font-medium mb-2">Distribución de Puntajes</h4>
                                <div className="grid grid-cols-2 gap-2">
                                    {Object.entries(pauta.distribucionPuntaje || {}).map(([criterio, puntaje]) => (
                                        <div key={criterio} className="bg-gray-50 p-2 rounded">
                                            <span className="font-medium">{criterio}:</span> {puntaje} puntos
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}