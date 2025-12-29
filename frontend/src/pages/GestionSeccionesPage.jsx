import { useState, useEffect } from "react";
import { getAllAlumnos } from "../services/users.service.js";
import { useParams, useNavigate } from "react-router-dom";
import { getRamosByCodigo, getAlumnosBySeccion, getSeccionesByRamo, createSeccion, inscribirAlumnoEnSeccion } from "../services/ramos.service.js";
import { useNavbar } from "../context/NavbarContext";

export default function GestionSeccionesPage() {
  const { isNavbarOpen } = useNavbar ? useNavbar() : { isNavbarOpen: false };
  const { codigoRamo } = useParams();
  const navigate = useNavigate();
  const [ramo, setRamo] = useState(null);
  const [secciones, setSecciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAlumnosModal, setShowAlumnosModal] = useState(false);
  const [alumnosModalData, setAlumnosModalData] = useState([]);
  const [modalSeccion, setModalSeccion] = useState(null);
  const [searchAlumno, setSearchAlumno] = useState("");
  const [allAlumnos, setAllAlumnos] = useState([]);
  const [resultAlumnos, setResultAlumnos] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addError, setAddError] = useState("");
  const [showVerInscritosModal, setShowVerInscritosModal] = useState(false);
  const [verInscritosData, setVerInscritosData] = useState([]);
  const [verInscritosSeccion, setVerInscritosSeccion] = useState(null);

  // Función reutilizable para cargar secciones
  const fetchSecciones = async () => {
    setLoading(true);
    setError("");
    try {
      const ramoData = await getRamosByCodigo(codigoRamo);
      setRamo(ramoData);
      const seccionesData = ramoData.secciones || [];
      setSecciones(seccionesData);
    } catch (e) {
      if (e instanceof SyntaxError) {
        setError("Respuesta inesperada del servidor. Intenta recargar la página o inicia sesión nuevamente.");
      } else {
        setError(e.message || "Error al cargar ramo/secciones");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecciones();
  }, [codigoRamo]);

  const handleGestionarAlumnos = async (seccion) => {
    setModalSeccion(seccion);
    setShowAlumnosModal(true);
    setAddError("");
    try {
      // Cargar alumnos inscritos en la sección usando el service
      const alumnosInscritos = await getAlumnosBySeccion(codigoRamo, seccion.numero);
      setAlumnosModalData(alumnosInscritos || []);
      // Cargar todos los alumnos del sistema usando el endpoint de usuarios
      const alumnos = await getAllAlumnos();
      setAllAlumnos(alumnos);
      setResultAlumnos(alumnos);
    } catch (e) {
      setAlumnosModalData([]);
      setAllAlumnos([]);
      setResultAlumnos([]);
      setAddError(e.message || 'Error al cargar alumnos');
    }
  };

  const handleVerInscritos = async (seccion) => {
    setVerInscritosSeccion(seccion);
    setShowVerInscritosModal(true);
    try {
      const alumnosInscritos = await getAlumnosBySeccion(codigoRamo, seccion.numero);
      setVerInscritosData(alumnosInscritos || []);
    } catch (e) {
      setVerInscritosData([]);
    }
  };

  // Normalizar texto (eliminar acentos y pasar a minúsculas)
  const normalizarTexto = (texto) => {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Filtrar alumnos localmente por búsqueda
  const handleBuscarAlumno = (query) => {
    setSearching(true);
    setAddError("");
    try {
      if (!allAlumnos) {
        setResultAlumnos([]);
        setSearching(false);
        return;
      }
      if (query.trim()) {
        const searchNormalizado = normalizarTexto(query);
        const palabras = searchNormalizado.split(/\s+/).filter(Boolean);
        const isNumeric = /^\d+$/.test(query);
        const filtrados = allAlumnos.filter(alumno => {
          const user = alumno.user || {};
          if (isNumeric) {
            return user.rut && user.rut.toLowerCase().includes(query.toLowerCase());
          }
          const nombreCompleto = normalizarTexto(
            `${user.nombres || ''} ${user.apellidoPaterno || ''} ${user.apellidoMaterno || ''}`.trim()
          );
          const rut = normalizarTexto(user.rut || '');
          return palabras.some(palabra =>
            nombreCompleto.includes(palabra) || rut.includes(palabra)
          );
        });
        setResultAlumnos(filtrados);
      } else {
        setResultAlumnos(allAlumnos);
      }
    } catch (e) {
      setAddError("Error al buscar alumnos");
    } finally {
      setSearching(false);
    }
  };

  // Sugerencias automáticas al escribir
  useEffect(() => {
    handleBuscarAlumno(searchAlumno);
  }, [searchAlumno, allAlumnos]);

  // Agregar alumno a la sección
  const handleAgregarAlumno = async (alumno) => {
    setAddError("");
    try {
      const rut = alumno.user ? alumno.user.rut : alumno.rut;
      await inscribirAlumnoEnSeccion(codigoRamo, modalSeccion.id, rut);
      // Refrescar lista desde backend para evitar duplicados y asegurar persistencia
      const alumnosInscritos = await getAlumnosBySeccion(codigoRamo, modalSeccion.numero);
      setAlumnosModalData(alumnosInscritos || []);
    } catch (e) {
      setAddError("No se pudo agregar el alumno");
    }
  };

  return (
    <div className={`p-6 bg-[#e9f7fb] min-h-screen transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
      {/* Título */}
      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Gestión de Secciones</h2>
      </div>
      {/* Línea separadora */}
      <div className="mt-6 bg-white h-4 rounded"></div>
      {/* Título y Botón en una fila */}
      <div className="mt-6 flex justify-between items-center mr-8">
        <h3 className="text-xl font-semibold">Lista de secciones:</h3>
          <button
            className="bg-[#0E2C66] hover:bg-[#143A80] text-white font-bold py-2 px-6 rounded transition-colors"
            onClick={async () => {
              // Calcular el siguiente número de sección disponible
              const numeros = secciones.map(s => s.numero);
              let nextNumero = 1;
              while (numeros.includes(nextNumero)) nextNumero++;
              try {
                await createSeccion({ codigoRamo, numero: nextNumero });
                await fetchSecciones();
              } catch (err) {
                alert(err.message || "Error al crear sección");
              }
            }}
          >
            + Crear Nueva Sección
          </button>
      </div>
      <div className="mt-2 bg-[#d5e8f6] h-3 rounded"></div>
      {/* Tabla de secciones */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden mr-8">
        {loading ? (
          <div className="text-[#0E2C66] text-center py-8">Cargando secciones...</div>
        ) : error ? (
          <div className="text-red-500 text-center py-8">{error}</div>
        ) : secciones.length === 0 ? (
          <div className="text-[#0E2C66] text-center py-8">No hay secciones registradas.</div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#113C63] text-white">
                <th className="px-4 py-2 border">#</th>
                <th className="px-4 py-2 border">Sección</th>
                <th className="px-4 py-2 border text-center">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {secciones.map((seccion, idx) => (
                <tr key={seccion.id || idx} className={`transition ${idx % 2 === 0 ? 'bg-[#f4f8ff]' : 'bg-white'} hover:bg-[#dbe7ff]`}>
                  <td className="px-4 py-2 border font-mono font-bold text-blue-600">{idx + 1}</td>
                  <td className="px-4 py-2 border text-gray-800">Sección {seccion.numero}</td>
                  <td className="px-4 py-2 border text-center space-x-2">
                    <button
                      className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleGestionarAlumnos(seccion)}
                    >
                      Añadir alumno
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleVerInscritos(seccion)}
                    >
                      Ver inscritos
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => alert('Aquí se implementará la lógica para eliminar sección')}
                    >
                      Eliminar sección
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {/* Modal de alumnos */}
      {showAlumnosModal && modalSeccion && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                onClick={() => {
                  setShowAlumnosModal(false);
                  setAlumnosModalData([]);
                  setModalSeccion(null);
                  setSearchAlumno("");
                  setResultAlumnos([]);
                  fetchSecciones();
                }}
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4">Alumnos inscritos en sección {modalSeccion.numero}</h2>
              {/* Buscador de alumnos */}
              <div className="mb-4">
                <label className="block font-semibold mb-2">Buscar alumno por RUT, nombres o apellidos:</label>
                <input
                  type="text"
                  className="border px-3 py-2 rounded w-full"
                  placeholder="Ej: 20.123.456-7, Juan, Pérez"
                  value={searchAlumno}
                  onChange={e => setSearchAlumno(e.target.value)}
                />
                {addError && <div className="text-red-500 mt-2">{addError}</div>}
                {searching ? (
                  <div className="text-gray-500 mt-2">Buscando...</div>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#113C63] text-white">
                          <th className="px-4 py-2 border">Nombre</th>
                          <th className="px-4 py-2 border">RUT</th>
                          <th className="px-4 py-2 border text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultAlumnos.length === 0 ? (
                          <tr><td colSpan="3" className="text-center text-gray-500 py-2">No hay resultados</td></tr>
                        ) : resultAlumnos.map((alumno, idx) => {
                          const user = alumno.user || {};
                          const yaInscrito = alumnosModalData.some(a => {
                            const aUser = a.user || {};
                            return aUser.id === user.id;
                          });
                          return (
                            <tr key={alumno.id} className={`hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-[#f4f8ff]' : 'bg-white'}`}>
                              <td className="px-4 py-2 border">{user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}</td>
                              <td className="px-4 py-2 border">{user.rut}</td>
                              <td className="px-4 py-2 border text-center">
                                {yaInscrito ? (
                                  <button
                                    className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                                    onClick={() => alert('Aquí se implementará la lógica para eliminar alumno')}
                                  >
                                    Eliminar
                                  </button>
                                ) : (
                                  <button
                                    className="bg-green-500 hover:bg-green-700 text-white px-2 py-1 rounded text-xs"
                                    onClick={() => handleAgregarAlumno(alumno)}
                                  >
                                    Agregar
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Modal de ver inscritos */}
      {showVerInscritosModal && verInscritosSeccion && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
              <button
                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
                onClick={() => {
                  setShowVerInscritosModal(false);
                  setVerInscritosData([]);
                  setVerInscritosSeccion(null);
                  fetchSecciones();
                }}
              >
                ×
              </button>
              <h2 className="text-lg font-bold mb-4">Alumnos inscritos en sección {verInscritosSeccion.numero}</h2>
              {verInscritosData.length === 0 ? (
                <div className="text-gray-500">No hay alumnos inscritos.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#113C63] text-white">
                        <th className="px-4 py-2 border">#</th>
                        <th className="px-4 py-2 border">Nombre</th>
                        <th className="px-4 py-2 border">RUT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {verInscritosData
                        .slice()
                        .sort((a, b) => {
                          const aUser = a.user || a;
                          const bUser = b.user || b;
                          return (aUser.apellidoPaterno || '').localeCompare(bUser.apellidoPaterno || '');
                        })
                        .map((alumno, idx) => {
                          const user = alumno.user || alumno;
                          return (
                            <tr key={user.id || idx} className={`transition ${idx % 2 === 0 ? 'bg-[#f4f8ff]' : 'bg-white'} hover:bg-[#dbe7ff]`}>
                              <td className="px-4 py-2 border font-mono font-bold text-blue-600">{idx + 1}</td>
                              <td className="px-4 py-2 border text-gray-800">{user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}</td>
                              <td className="px-4 py-2 border text-gray-600">{user.rut}</td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
