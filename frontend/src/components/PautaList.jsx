import { useEffect, useState } from "react";
import { getAllPautas, deletePauta } from "../services/pauta.service.js";

export default function PautaList({onEdit}){
    const [pautas, setPautas] = useState([]);
    useEffect(()=>{
        async function fetchData() {
            const data = await getAllPautas();
            setPautas(data);
            
        }
        fetchData();
    }, []);

    const handleDelete = async (id) =>{
        const confirm = window.confirm('¿estas seguro de eliminar este pauta?');
        if(confirm){
            await deletePauta(id);
            setPautas(pautas.filter((p) => p.id !== id));
        }
    };


    
    return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">Lista de Pautas</h2>
      {pautas.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No hay pautas registradas.</p>
      ) : (
        <ul className="space-y-3">
          {pautas.map((pauta) => (
            <li key={pauta.id} className="border p-4 rounded-lg bg-white shadow-sm">
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
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded transition"
                  onClick={() => onEdit(pauta)}
                >
                  Editar
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded transition"
                  onClick={() => handleDelete(pauta.id)}
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}