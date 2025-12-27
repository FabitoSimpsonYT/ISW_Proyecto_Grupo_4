import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import PautaList from "../components/PautaList";
import PautaForm from "../components/PautaForm";
import { useAuth } from "../context/AuthContext.jsx";
import { getEvaluacionById } from "../services/evaluacion.service.js";

export default function PautaPage(){
    const [selectedPauta, setSelectedPauta] = useState(null);
    const [reload, setReload] = useState(false);
    const [evaluacionData, setEvaluacionData] = useState(null);
    const { user } = useAuth();
    const { evaluacionId, codigoRamo, idEvaluacion } = useParams();
    
    // Determinar si usamos la nueva ruta o la antigua
    const ramoParam = codigoRamo || evaluacionId;
    const evalIdParam = idEvaluacion;
    
    useEffect(() => {
        if (ramoParam) {
            const fetchEvaluacion = async () => {
                try {
                    const data = await getEvaluacionById(ramoParam, evalIdParam);
                    setEvaluacionData(data);
                    // Si la evaluación tiene pauta, seleccionarla
                    if (data?.pauta) {
                        setSelectedPauta(data.pauta);
                    }
                } catch (error) {
                    console.error("Error al cargar evaluación:", error);
                }
            };
            fetchEvaluacion();
        }
    }, [ramoParam, evalIdParam]);
    
    const handleSaved = () => {
        setSelectedPauta(null);
        setReload(!reload);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
            <div className="ml-64 p-4 md:p-8">
                <div className="mx-auto w-full max-w-5xl space-y-6">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Pautas</h1>
                                <p className="mt-1 text-sm md:text-base text-gray-600">
                                    Crea, edita y revisa pautas de evaluación.
                                </p>
                                {evaluacionData && (
                                    <p className="mt-2 text-sm text-gray-500">
                                        Evaluación: <strong>{evaluacionData.titulo}</strong>
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6">
                            {user?.role === 'profesor' ? (
                                <PautaForm pautaEdit={selectedPauta} evaluacionId={evaluacionData?.id} onSaved={handleSaved}/> 
                            ) : (
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <p className="text-gray-700">
                                        Solo profesores pueden crear o editar pautas.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-2xl p-6 md:p-10">
                        <PautaList onEdit={setSelectedPauta} key={reload}/>
                    </div>
                </div>
            </div>
        </div>
    );
}