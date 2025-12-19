import { useState, useEffect } from "react";
import { getAllRamos, deleteRamo } from "../services/ramos.service.js";

export default function RamosList({ onEdit, reload }) {
  const [ramos, setRamos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRamos();
  }, [reload]);

  const fetchRamos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllRamos();
      console.log('Ramos obtenidos:', data);
      data.forEach((ramo, idx) => {
        console.log(`Ramo ${idx}:`, {
          codigo: ramo.codigo,
          nombre: ramo.nombre,
          profesor: ramo.profesor,
          profesorData: ramo.profesor ? {
            id: ramo.profesor.id,
            user: ramo.profesor.user
          } : 'null'
        });
      });
      setRamos(data || []);
    } catch (error) {
      setError(error.message || 'Error al cargar ramos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (codigo) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el ramo ${codigo}?`)) {
      try {
        await deleteRamo(codigo);
        alert('Ramo eliminado correctamente');
        fetchRamos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        alert(`Error al eliminar ramo: ${error.message || 'Intenta nuevamente'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Cargando ramos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Lista de Ramos</h2>
      
      {ramos.length === 0 ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-center">
          No hay ramos creados aún
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-md rounded-lg overflow-hidden">
            <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Código</th>
                <th className="px-6 py-3 text-left font-semibold">Nombre</th>
                <th className="px-6 py-3 text-left font-semibold">Profesor</th>
                <th className="px-6 py-3 text-left font-semibold">Secciones</th>
                <th className="px-6 py-3 text-center font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ramos.map((ramo, index) => (
                <tr
                  key={ramo.id || index}
                  className="border-b hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 font-mono font-bold text-blue-600">{ramo.codigo}</td>
                  <td className="px-6 py-4 text-gray-800">{ramo.nombre}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {ramo.profesor ? (
                      <div>
                        <div className="font-semibold text-gray-800">
                          {ramo.profesor.user?.nombre} {ramo.profesor.user?.apellido}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{ramo.profesor.user?.rut}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                      {ramo.secciones?.length || 0}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center space-x-2">
                    <button
                      onClick={() => onEdit(ramo)}
                      className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(ramo.codigo)}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
