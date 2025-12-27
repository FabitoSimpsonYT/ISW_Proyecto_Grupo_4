import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { getAllUsers, getAllAlumnos, promoverProfesorAJefeCarrera, degradarJefeCarreraAProfesor, getJefeCarreraActual } from "../services/users.service.js";

export default function UsuariosList({ reload }) {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRango, setSelectedRango] = useState('profesores');
  const [jefeCarreraActual, setJefeCarreraActual] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (selectedRango === 'alumnos') {
      fetchAlumnos();
    } else {
      fetchUsuarios();
      fetchJefeCarrera();
    }
  }, [reload, selectedRango]);

  const fetchUsuarios = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers();
      setUsuarios(data);
    } catch (error) {
      setError(error.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const fetchAlumnos = async () => {
    setLoading(true);
    setError('');
    try {
      const alumnos = await getAllAlumnos();
      setUsuarios({ alumnos });
    } catch (error) {
      setError(error.message || 'Error al cargar alumnos');
    } finally {
      setLoading(false);
    }
  };

  const fetchJefeCarrera = async () => {
    try {
      const jefe = await getJefeCarreraActual();
      setJefeCarreraActual(jefe);
    } catch (error) {
      console.log('Error al cargar jefe de carrera:', error);
      setJefeCarreraActual(null);
    }
  };

  const handlePromover = async (rut) => {
    // Verificar si ya hay un Jefe de Carrera asignado
    if (jefeCarreraActual && jefeCarreraActual.user) {
      setShowErrorModal(true);
      return;
    }

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

  // Función para normalizar texto (eliminar acentos y convertir a minúsculas)
  const normalizarTexto = (texto) => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Obtener usuarios del rango seleccionado
  const getUsuariosSeleccionados = () => {
    console.log('📍 Rango seleccionado:', selectedRango);
    console.log('📍 Usuarios disponibles:', usuarios);
    let usuariosLista;
    if (selectedRango === 'jefecarrera') {
      usuariosLista = jefeCarreraActual ? [{ user: jefeCarreraActual }] : [];
    } else {
      usuariosLista = usuarios[selectedRango] || [];
    }
    console.log('📍 Usuarios filtrados:', usuariosLista);
    
    // Aplicar búsqueda
    if (searchTerm.trim()) {
      const searchNormalizado = normalizarTexto(searchTerm);
      const palabras = searchNormalizado.split(/\s+/).filter(Boolean);
      const isNumeric = /^\d+$/.test(searchTerm);

      return usuariosLista.filter(usuario => {
        const user = usuario.user || usuario;
        // Búsqueda por RUT si es numérico
        if (isNumeric) {
          return user.rut && user.rut.toLowerCase().includes(searchTerm.toLowerCase());
        }
        // Concatenar nombre completo y rut normalizados
        const nombreCompleto = normalizarTexto(
          `${user.nombres || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim()
        );
        const rut = normalizarTexto(user.rut || '');
        // Cada palabra debe estar en el nombre completo o rut
        return palabras.every(palabra =>
          nombreCompleto.includes(palabra) || rut.includes(palabra)
        );
      });
    }
    return usuariosLista;
  };

  const usuariosSeleccionados = getUsuariosSeleccionados();

  const renderTabla = (usuariosLista) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#113C63] text-white">
            <th className="px-4 py-2 border">RUT</th>
            <th className="px-4 py-2 border">Nombre</th>
            <th className="px-4 py-2 border">Email</th>
            <th className="px-4 py-2 border">Teléfono</th>
            {selectedRango === 'profesores' && <th className="px-4 py-2 border text-center">Acciones</th>}
            {selectedRango === 'jefecarrera' && <th className="px-4 py-2 border text-center">Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {usuariosLista.map((usuario, idx) => {
            const user = usuario.user || usuario;
            return (
              <tr key={idx} className={`transition ${
                idx % 2 === 0 ? "bg-[#f4f8ff]" : "bg-white"
              } hover:bg-[#dbe7ff]`}>
                <td className="px-4 py-2 border font-mono font-bold text-blue-600">{user.rut}</td>
                <td className="px-4 py-2 border text-gray-800">
                  {user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}
                </td>
                <td className="px-4 py-2 border text-gray-600">{user.email}</td>
                <td className="px-4 py-2 border text-gray-600">{user.telefono}</td>
                {selectedRango === 'profesores' && user?.role === 'admin' && (
                  <td className="px-4 py-2 border text-center">
                    <button
                      onClick={() => handlePromover(user.rut)}
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                      Promover a Jefe
                    </button>
                  </td>
                )}
                {selectedRango === 'jefecarrera' && user?.role === 'admin' && (
                  <td className="px-4 py-2 border text-center">
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
              ? 'bg-[#113C63] text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          👨‍💼 Administradores
        </button>
        <button
          onClick={() => setSelectedRango('jefecarrera')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'jefecarrera'
              ? 'bg-[#113C63] text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          🎓 Jefe de Carrera
        </button>
        <button
          onClick={() => setSelectedRango('profesores')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'profesores'
              ? 'bg-[#113C63] text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          📚 Profesores
        </button>
        <button
          onClick={() => setSelectedRango('alumnos')}
          className={`px-4 py-3 font-semibold rounded-lg transition-all ${
            selectedRango === 'alumnos'
              ? 'bg-[#113C63] text-white shadow-lg scale-105'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          👨‍🎓 Alumnos
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Busca por RUT (números) o por nombre/apellidos (letras)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-[#113C63] focus:ring-2 focus:ring-[#113C63] focus:ring-opacity-50 transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* TABLA */}
      {usuariosSeleccionados.length === 0 ? (
        <div className="bg-gray-100 border border-gray-300 text-gray-600 px-4 py-3 rounded-lg text-center">
          No hay {selectedRango === 'jefecarrera' ? 'jefe de carrera' : selectedRango} registrados
        </div>
      ) : (
        renderTabla(usuariosSeleccionados)
      )}

      {/* Modal de Error - Jefe de Carrera ya existe */}
      {showErrorModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full p-8 relative border-t-4 border-red-500">
            {/* Botón cerrar */}
            <button
              onClick={() => setShowErrorModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-3xl font-light"
            >
              ×
            </button>

            {/* Icono y Título */}
            <div className="text-center mb-6">
              <div className="text-5xl mb-3">⚠️</div>
              <h3 className="text-2xl font-bold text-gray-800">Jefe de Carrera Existente</h3>
            </div>

            {/* Mensaje principal */}
            <p className="text-gray-700 text-center mb-6">
              Ya existe un Jefe de Carrera asignado. Debes degradar al Jefe de Carrera actual antes de promover a otro profesor.
            </p>

            {/* Información del Jefe de Carrera Actual */}
            {jefeCarreraActual && jefeCarreraActual.user && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wide">Jefe de Carrera Actual:</p>
                <p className="font-bold text-gray-800 text-lg">
                  {jefeCarreraActual.user.nombres} {jefeCarreraActual.user.apellidoPaterno} {jefeCarreraActual.user.apellidoMaterno}
                </p>
                <p className="text-sm text-gray-600 font-mono mt-1">{jefeCarreraActual.user.rut}</p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowErrorModal(false)}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setShowErrorModal(false);
                  await handleDegradar();
                }}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Degradar Jefe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
