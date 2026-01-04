import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { showSuccessAlert, showErrorAlert, showConfirmAlert } from "@/utils/alertUtils";
import { getAllRamos, deleteRamo, getAlumnosBySeccion } from "../services/ramos.service.js";

export default function RamosList({ onEdit, reload, searchTerm = "", selectedPeriodo = "", onRamosLoaded }) {
  const navigate = useNavigate();
  const [ramos, setRamos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  const [alumnosModalData, setAlumnosModalData] = useState([]);
  const [modalSeccion, setModalSeccion] = useState(null);
  const [showGestionSecciones, setShowGestionSecciones] = useState(false);
  const [ramoGestion, setRamoGestion] = useState(null);

  useEffect(() => {
    fetchRamos();
  }, [reload]);

  const fetchRamos = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllRamos();
      setRamos(data || []);
      if (onRamosLoaded) {
        onRamosLoaded(data || []);
      }
    } catch (error) {
      setError(error.message || 'Error al cargar ramos');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar ramos según el término de búsqueda y período
  const filteredRamos = ramos.filter((ramo) => {
    // Filtro por período (formato: "2025-2")
    if (selectedPeriodo) {
      // El código del ramo tiene formato CCCCCC-YYYY-P (ej: 620515-2025-1)
      const codigoParts = ramo.codigo.split('-');
      if (codigoParts.length >= 3) {
        const ramoPeriodo = `${codigoParts[1]}-${codigoParts[2]}`; // "2025-1"
        if (ramoPeriodo !== selectedPeriodo) return false;
      } else if (ramo.anio && ramo.periodo) {
        // Si el ramo tiene campos anio y periodo directamente
        const ramoPeriodo = `${ramo.anio}-${ramo.periodo}`;
        if (ramoPeriodo !== selectedPeriodo) return false;
      }
    }

    // Filtro por término de búsqueda
    if (!searchTerm.trim()) return true;

    // Si comienza con número, buscar por código
    if (/^\d/.test(searchTerm)) {
      return ramo.codigo.includes(searchTerm);
    }

    // Si comienza con letra, buscar por nombre
    return ramo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleDelete = async (codigo) => {
    const result = await showConfirmAlert(
      "¿Está seguro?",
      `¿Estás seguro de que deseas eliminar el ramo ${codigo}?`,
      "Eliminar",
      "Cancelar"
    );
    if (result.isConfirmed) {
      try {
        await deleteRamo(codigo);
        showSuccessAlert('Ramo eliminado', 'El ramo y todas sus evaluaciones y pautas asociadas han sido eliminados correctamente.');
        fetchRamos();
      } catch (error) {
        console.error('Error al eliminar:', error);
        showErrorAlert('Error', `Error al eliminar ramo: ${error.message || 'Intenta nuevamente'}`);
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
      {ramos.length === 0 ? (
        <div className="bg-[#d5e8f6] border border-[#b3d9f2] text-gray-600 px-4 py-3 rounded-lg text-center">
          No hay ramos creados aún
        </div>
      ) : filteredRamos.length === 0 ? (
        <div className="bg-[#d5e8f6] border border-[#b3d9f2] text-gray-600 px-4 py-3 rounded-lg text-center">
          No se encontraron ramos que coincidan con tu búsqueda
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#113C63] text-white">
                <th className="px-4 py-2 border">Código</th>
                <th className="px-4 py-2 border">Nombre</th>
                <th className="px-4 py-2 border">Profesor</th>
                <th className="px-4 py-2 border">Secciones</th>
                <th className="px-4 py-2 border text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredRamos.map((ramo, index) => (
                <tr
                  key={ramo.id || index}
                  className={`transition ${
                    index % 2 === 0 ? "bg-[#f4f8ff]" : "bg-white"
                  } hover:bg-[#dbe7ff]`}
                >
                  <td className="px-4 py-2 border font-mono font-bold text-blue-600">{ramo.codigo}</td>
                  <td className="px-4 py-2 border text-gray-800">{ramo.nombre}</td>
                  <td className="px-4 py-2 border text-gray-600">
                    {ramo.profesor && ramo.profesor.user ? (
                      <div>
                        <div className="font-semibold text-gray-800">
                          {ramo.profesor.user.nombres} {ramo.profesor.user.apellidoPaterno} {ramo.profesor.user.apellidoMaterno}
                        </div>
                        <div className="text-xs text-gray-500 font-mono">{ramo.profesor.user.rut}</div>
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin asignar</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border text-center">
                    {ramo.secciones?.length > 0 ? (
                      <div className="space-y-1">
                        {ramo.secciones.map(seccion => (
                          <div key={seccion.id} className="flex items-center justify-between">
                            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold mr-2">
                              Sección {seccion.numero}
                            </span>
                            <button
                              className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                              onClick={async () => {
                                setModalSeccion(seccion.numero);
                                setShowAlumnosModal(true);
                                try {
                                  const alumnos = await getAlumnosBySeccion(seccion.id);
                                  setAlumnosModalData(alumnos);
                                } catch (e) {
                                  setAlumnosModalData([]);
                                }
                              }}
                            >
                              Ver alumnos
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 italic">Sin secciones</span>
                    )}
                  </td>
                  <td className="px-4 py-2 border text-center space-x-2">
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
                    <button
                      onClick={() => navigate(`/ramos/${ramo.codigo}/secciones`)}
                      className="bg-blue-600 hover:bg-blue-800 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Gestionar secciones
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    {/* Modal de gestión de secciones */}
    {showGestionSecciones && ramoGestion && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[340px] max-w-[95vw]">
          <h2 className="text-xl font-bold mb-4">Gestionar secciones de {ramoGestion.nombre}</h2>
          {ramoGestion.secciones?.length > 0 ? (
            <div className="space-y-4">
              {ramoGestion.secciones.map(seccion => (
                <div key={seccion.id} className="border-b pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-700">Sección {seccion.numero}</span>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={async () => {
                        setModalSeccion(seccion.numero);
                        setShowAlumnosModal(true);
                        try {
                          const alumnos = await getAlumnosBySeccion(seccion.id);
                          setAlumnosModalData(alumnos);
                        } catch (e) {
                          setAlumnosModalData([]);
                        }
                      }}
                    >
                      Ver alumnos
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No hay secciones creadas para este ramo.</div>
          )}
          <button
            className="mt-6 bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
            onClick={() => setShowGestionSecciones(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    )}
    {/* Modal de alumnos */}
    {showAlumnosModal && (
      <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-lg p-6 min-w-[320px] max-w-[90vw]">
          <h2 className="text-lg font-bold mb-4">Alumnos inscritos en sección {modalSeccion}</h2>
          {alumnosModalData.length === 0 ? (
            <div className="text-gray-500">No hay alumnos inscritos.</div>
          ) : (
            <ul className="space-y-2">
              {alumnosModalData.map(alumno => (
                <li key={alumno.id} className="border-b pb-2">
                  <span className="font-semibold">{alumno.nombres} {alumno.apellidoPaterno} {alumno.apellidoMaterno}</span>
                  <span className="ml-2 text-xs text-gray-500 font-mono">{alumno.rut}</span>
                </li>
              ))}
            </ul>
          )}
          <button
            className="mt-6 bg-gray-500 hover:bg-gray-700 text-white px-4 py-2 rounded"
            onClick={() => setShowAlumnosModal(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    )}
  </div>
  );
}
