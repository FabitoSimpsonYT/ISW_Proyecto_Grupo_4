import { useState, useEffect } from "react";
import { getAllUsers, promoverProfesorAJefeCarrera, degradarJefeCarreraAProfesor, getJefeCarreraActual } from "../services/users.service.js";

export default function UsuariosList({ reload }) {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRango, setSelectedRango] = useState('profesores');
  const [jefeCarreraActual, setJefeCarreraActual] = useState(null);

  useEffect(() => {
    fetchUsuarios();
    fetchJefeCarrera();
  }, [reload]);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      console.log('📊 Usuarios cargados:', data);
      setUsuarios(data);
    } catch (error) {
      setError(error.message || 'Error al cargar usuarios');
      console.error('❌ Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJefeCarrera = async () => {
    try {
      const jefe = await getJefeCarreraActual();
      setJefeCarreraActual(jefe);
    } catch (error) {
      console.log('No hay jefe de carrera asignado');
    }
  };

  const handlePromover = async (rut) => {
    if (window.confirm(`¿Promover este profesor a Jefe de Carrera?`)) {
      try {
        await promoverProfesorAJefeCarrera(rut);
        alert('Profesor promovido a Jefe de Carrera');
        fetchUsuarios();
        fetchJefeCarrera();
        setSelectedRango('jefecarrera'); // Cambiar a la pestaña de Jefe de Carrera
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleDegradar = async () => {
    if (window.confirm(`¿Degradar el Jefe de Carrera actual a profesor?`)) {
      try {
        await degradarJefeCarreraAProfesor();
        alert('Jefe de Carrera degradado a profesor');
        fetchUsuarios();
        fetchJefeCarrera();
        setSelectedRango('profesores'); // Cambiar a la pestaña de Profesores
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
  };

  // Obtener usuarios del rango seleccionado
  const getUsuariosSeleccionados = () => {
    console.log('📍 Rango seleccionado:', selectedRango);
    console.log('📍 Usuarios disponibles:', usuarios);
    if (selectedRango === 'jefecarrera') {
      return jefeCarreraActual ? [{ user: jefeCarreraActual.user }] : [];
    }
    const resultado = usuarios[selectedRango] || [];
    console.log('📍 Usuarios filtrados:', resultado);
    return resultado;
  };

  const usuariosSeleccionados = getUsuariosSeleccionados();

  const renderTabla = (usuariosLista) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left font-semibold">RUT</th>
            <th className="px-6 py-3 text-left font-semibold">Nombre</th>
            <th className="px-6 py-3 text-left font-semibold">Email</th>
            <th className="px-6 py-3 text-left font-semibold">Teléfono</th>
            {selectedRango === 'profesores' && <th className="px-6 py-3 text-center font-semibold">Acciones</th>}
            {selectedRango === 'jefecarrera' && <th className="px-6 py-3 text-center font-semibold">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {usuariosLista.map((usuario, idx) => {
            const user = usuario.user || usuario;
            return (
              <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-blue-600">{user.rut}</td>
                <td className="px-6 py-4 text-gray-800">
                  {user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-gray-600">{user.telefono}</td>
                {selectedRango === 'profesores' && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handlePromover(user.rut)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Promover a Jefe
                    </button>
                  </td>
                )}
                {selectedRango === 'jefecarrera' && (
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={handleDegradar}
                      className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Degradar
                    </button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Cargando usuarios...</div>
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Lista de Usuarios</h2>

      {/* BOTONES DE RANGO */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setSelectedRango('admins')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'admins'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          👨‍💼 Administradores
        </button>
        <button
          onClick={() => setSelectedRango('jefecarrera')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'jefecarrera'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🎓 Jefe de Carrera
        </button>
        <button
          onClick={() => setSelectedRango('profesores')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'profesores'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📚 Profesores
        </button>
        <button
          onClick={() => setSelectedRango('alumnos')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'alumnos'
              ? 'bg-blue-600 text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          👨‍🎓 Alumnos
        </button>
      </div>

      {/* TABLA */}
      {usuariosSeleccionados.length === 0 ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-center">
          No hay {selectedRango === 'jefecarrera' ? 'jefe de carrera' : selectedRango} registrados
        </div>
      ) : (
        renderTabla(usuariosSeleccionados)
      )}
    </div>
  );
}
