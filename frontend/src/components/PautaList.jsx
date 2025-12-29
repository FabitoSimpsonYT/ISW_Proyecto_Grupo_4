import { useEffect, useState } from "react";
import { showConfirmAlert } from "@/utils/alertUtils";
import { getAllPautas, deletePauta } from "../services/pauta.service.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function PautaList({onEdit}){
    const [pautas, setPautas] = useState([]);
  const { user } = useAuth();
    const [error, setError] = useState('');

    useEffect(()=>{
      async function fetchData() {
        try {
          const data = await getAllPautas();
          setPautas(data);
        } catch (err) {
          console.error('Error cargando pautas:', err);
          setError(err.message || 'Error al cargar pautas');
        }
      }
      fetchData();
    }, []);

    const handleDelete = async (id) =>{
        const result = await showConfirmAlert(
          "¿Está seguro?",
          "¿Estás seguro de que deseas eliminar esta pauta?",
          "Eliminar",
          "Cancelar"
        );
        if(result.isConfirmed){
            await deletePauta(id);
            setPautas(pautas.filter((p) => p.id !== id));
        }
    };


    
    return (
    <div>
      <div className="flex items-end justify-between gap-4 mb-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Lista de pautas</h2>
          <p className="text-sm text-gray-600">Revisa las pautas existentes y edítalas si corresponde.</p>
        </div>
      </div>
      {error ? (
        <p className="text-red-500 text-center py-4">{error}</p>
      ) : pautas.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay pautas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {pautas.map((pauta) => (
            <li key={pauta.id} className="border border-gray-200 p-4 rounded-2xl bg-white shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-medium">Criterios:</h3>
                  <p className="text-gray-600 whitespace-pre-line">{pauta.criterios}</p>
                </div>
                <div className="shrink-0 ml-4">
                  <span className={`inline-block px-2 py-1 rounded text-sm ${
                    pauta.publicada 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pauta.publicada ? 'Publicada' : 'No publicada'}
                  </span>
                </div>
              </div>

              <div className="mb-3">
                <h4 className="font-medium mb-2">Distribución de Puntajes:</h4>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(pauta.distribucionPuntaje).map(([pregunta, puntaje]) => (
                    <div key={pregunta} className="text-sm">
                      <span className="font-medium">{pregunta}:</span> {puntaje} pts
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                {user?.role === 'profesor' && (
                  <>
                    <button
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold px-4 py-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-purple-300"
                      onClick={() => onEdit(pauta)}
                    >
                      Editar
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold px-4 py-2 rounded-xl transition-all focus:outline-none focus:ring-4 focus:ring-red-200"
                      onClick={() => handleDelete(pauta.id)}
                    >
                      Eliminar
                    </button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}