import { useState, useEffect } from 'react';

export default function CalendarioAlumno() {
  const [evaluaciones, setEvaluaciones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    cargarEvaluaciones();
  }, []);

  const cargarEvaluaciones = async () => {
    setLoading(true);
    setError(null);
    try {
      setEvaluaciones([]);
    } catch (err) {
      console.error('Error:', err);
      setError('Error al cargar las evaluaciones');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">Cargando evaluaciones...</p>
        </div>
      );
    }

    if (evaluaciones.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">No tienes evaluaciones agendadas</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {evaluaciones.map((evaluacion) => (
          <div key={evaluacion.id} className="border rounded-lg p-4 hover:bg-gray-50">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-lg">{evaluacion.nombre}</p>
                <p className="text-sm text-gray-600">
                  📅 {new Date(evaluacion.fechaInicio).toLocaleString('es-CL')}
                </p>
                <p className="text-sm text-gray-600">
                  📍 {evaluacion.modalidad === 'presencial' ? `Sala: ${evaluacion.sala}` : `Online: ${evaluacion.linkOnline}`}
                </p>
              </div>
              <span 
                className={`px-3 py-1 rounded-full text-sm ${
                  evaluacion.estado === 'confirmado' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {evaluacion.estado}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-6">📅 Mis Evaluaciones Agendadas</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        {renderContent()}
      </div>
    </div>
  );
}
