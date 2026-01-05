import { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { getAllAlumnos } from "../services/users.service.js";
import { useParams, useNavigate } from "react-router-dom";
import { getRamosByCodigo, getAlumnosBySeccion, getSeccionesByRamo, createSeccion, inscribirAlumnoEnSeccion, deleteSeccion } from "../services/ramos.service.js";
import { useNavbar } from "../context/NavbarContext";
import { useAuth } from "../context/AuthContext.jsx";

export default function GestionSeccionesPage() {
  const { user } = useAuth();
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

  // Carga secciones junto con sus alumnos y retorna el arreglo para reuso
  const loadSeccionesConAlumnos = async () => {
    const ramoData = await getRamosByCodigo(codigoRamo);
    setRamo(ramoData);
    const seccionesData = ramoData.secciones || [];
    const seccionesConAlumnos = await Promise.all(
      seccionesData.map(async (seccion) => {
        try {
          const alumnos = await getAlumnosBySeccion(codigoRamo, seccion.numero);
          return { ...seccion, alumnos: alumnos || [], cantidadAlumnos: alumnos?.length || 0 };
        } catch (e) {
          return { ...seccion, alumnos: [], cantidadAlumnos: 0 };
        }
      })
    );
    setSecciones(seccionesConAlumnos);
    return seccionesConAlumnos;
  };

  // Función reutilizable para cargar secciones
  const fetchSecciones = async () => {
    setLoading(true);
    setError("");
    try {
      await loadSeccionesConAlumnos();
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
      // Refrescar todas las secciones con alumnos para mostrar la sección real de cada alumno
      await loadSeccionesConAlumnos();
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
      const nombreAlumno = alumno.user 
        ? `${alumno.user.nombres} ${alumno.user.apellidoPaterno} ${alumno.user.apellidoMaterno}`
        : `${alumno.nombres} ${alumno.apellidoPaterno} ${alumno.apellidoMaterno}`;
      
      // Verificar si el alumno ya está en otra sección del mismo ramo
      let seccionActual = null;
      for (const seccion of secciones) {
        if (seccion.id !== modalSeccion.id) {
          try {
            const alumnosSeccion = await getAlumnosBySeccion(codigoRamo, seccion.numero);
            const estaEnSeccion = alumnosSeccion.some(a => {
              const rutAlumno = a.user ? a.user.rut : a.rut;
              return rutAlumno === rut;
            });
            if (estaEnSeccion) {
              seccionActual = seccion;
              break;
            }
          } catch (e) {
            // Continuar con la siguiente sección si hay error
          }
        }
      }

      // Si el alumno está en otra sección, pedir confirmación
      if (seccionActual) {
        const result = await Swal.fire({
          icon: 'question',
          title: '¿Mover alumno?',
          html: `<p><strong>${nombreAlumno}</strong> ya está inscrito en la <strong>Sección ${seccionActual.numero}</strong>.</p>
                 <p>¿Deseas moverlo a la <strong>Sección ${modalSeccion.numero}</strong>?</p>`,
          showCancelButton: true,
          confirmButtonColor: '#3085d6',
          cancelButtonColor: '#d33',
          confirmButtonText: 'Sí, mover',
          cancelButtonText: 'Cancelar'
        });

        if (!result.isConfirmed) {
          return; // Usuario canceló, no hacer nada
        }
      }

      // Proceder a inscribir (el backend maneja automáticamente la desinscripción de la sección anterior)
      await inscribirAlumnoEnSeccion(codigoRamo, modalSeccion.id, rut);
      
      // Refrescar lista desde backend para evitar duplicados y asegurar persistencia
      const alumnosInscritos = await getAlumnosBySeccion(codigoRamo, modalSeccion.numero);
      setAlumnosModalData(alumnosInscritos || []);
      // Sincronizar secciones en memoria para que los botones reflejen la sección real
      setSecciones(prev => prev.map(seccion => {
        const coincideModal = (seccion.id && modalSeccion.id && seccion.id === modalSeccion.id) || seccion.numero === modalSeccion.numero;
        if (coincideModal) {
          return {
            ...seccion,
            alumnos: alumnosInscritos || [],
            cantidadAlumnos: alumnosInscritos?.length || 0
          };
        }
        const coincideAnterior = seccionActual && ((seccion.id && seccion.id === seccionActual.id) || seccion.numero === seccionActual.numero);
        if (coincideAnterior) {
          const filtrados = (seccion.alumnos || []).filter(a => {
            const aRut = (a.user && a.user.rut) || a.rut;
            return aRut !== rut;
          });
          return { ...seccion, alumnos: filtrados, cantidadAlumnos: filtrados.length };
        }
        // Eliminar el rut de cualquier otra sección por seguridad
        const filtrados = (seccion.alumnos || []).filter(a => {
          const aRut = (a.user && a.user.rut) || a.rut;
          return aRut !== rut;
        });
        return { ...seccion, alumnos: filtrados, cantidadAlumnos: filtrados.length };
      }));
      
      const mensaje = seccionActual 
        ? `El alumno fue movido exitosamente de la Sección ${seccionActual.numero} a la Sección ${modalSeccion.numero}`
        : `El alumno fue inscrito exitosamente en la sección`;
      
      Swal.fire({
        icon: 'success',
        title: seccionActual ? 'Alumno movido' : 'Alumno agregado',
        text: mensaje,
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    } catch (e) {
      setAddError("No se pudo agregar el alumno");
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: e.message || 'No se pudo agregar el alumno',
        toast: true,
        position: 'top-end',
        timer: 2000,
        showConfirmButton: false
      });
    }
  };

  // Botón para volver a la lista de ramos
  const handleVolverRamos = () => {
    navigate('/ramos');
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isNavbarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">📚 Gestión de Secciones</h1>
            <p className="text-sm text-gray-300">{user?.email || 'Usuario'}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        <button
          onClick={handleVolverRamos}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium mb-4"
        >
          ← Volver a Ramos
        </button>
        {/* Título y Botón en una fila */}
        <div className="mt-6 flex justify-between items-center">
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
                Swal.fire({
                  icon: 'success',
                  title: 'Sección creada',
                  text: `La sección ${nextNumero} fue creada exitosamente`,
                  toast: true,
                  position: 'top-end',
                  timer: 2500,
                  showConfirmButton: false
                });
              } catch (err) {
                Swal.fire({
                  icon: 'error',
                  title: 'Error',
                  text: err.message || "Error al crear sección",
                  toast: true,
                  position: 'top-end',
                  timer: 2500,
                  showConfirmButton: false
                });
              }
            }}
          >
            + Crear Nueva Sección
          </button>
        </div>
        {/* Tabla de secciones */}
        <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
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
                      Añadir alumnos
                    </button>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                      onClick={() => handleVerInscritos(seccion)}
                    >
                      Ver inscritos {seccion.cantidadAlumnos > 0 && `(${seccion.cantidadAlumnos})`}
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-700 text-white px-2 py-1 rounded text-xs"
                      onClick={async () => {
                        const confirm = await Swal.fire({
                          icon: 'warning',
                          title: '¿Eliminar sección?',
                          text: `Se eliminará la sección ${seccion.numero} y sus inscripciones.`,
                          showCancelButton: true,
                          confirmButtonColor: '#d33',
                          cancelButtonColor: '#3085d6',
                          confirmButtonText: 'Eliminar',
                          cancelButtonText: 'Cancelar'
                        });
                        if (!confirm.isConfirmed) return;
                        try {
                          await deleteSeccion(seccion.id, codigoRamo);
                          await fetchSecciones();
                          Swal.fire({
                            icon: 'success',
                            title: 'Sección eliminada',
                            text: `Se eliminó la sección ${seccion.numero}`,
                            toast: true,
                            position: 'top-end',
                            timer: 2500,
                            showConfirmButton: false
                          });
                        } catch (err) {
                          Swal.fire({
                            icon: 'error',
                            title: 'Error',
                            text: err.message || 'No se pudo eliminar la sección'
                          });
                        }
                      }}
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
                          const rut = user.rut || alumno.rut;
                          
                          // Buscar en qué sección está el alumno
                          let seccionInscrito = null;
                          for (const seccion of secciones) {
                            const alumnosSeccion = seccion.alumnos || [];
                            const estaEnSeccion = alumnosSeccion.some(a => {
                              const aUser = a.user || {};
                              return (aUser.rut || a.rut) === rut;
                            });
                            if (estaEnSeccion) {
                              seccionInscrito = seccion.numero;
                              break;
                            }
                          }
                          
                          // También verificar en alumnosModalData por si acabamos de agregarlo
                          if (!seccionInscrito) {
                            const yaInscrito = alumnosModalData.some(a => {
                              const aUser = a.user || {};
                              return aUser.id === user.id;
                            });
                            if (yaInscrito) {
                              seccionInscrito = modalSeccion.numero;
                            }
                          }
                          
                          const estaEnSeccionActual = seccionInscrito === modalSeccion.numero;
                          const estaEnOtraSeccion = seccionInscrito && !estaEnSeccionActual;
                          
                          return (
                            <tr key={alumno.id} className={`hover:bg-blue-50 transition ${idx % 2 === 0 ? 'bg-[#f4f8ff]' : 'bg-white'}`}>
                              <td className="px-4 py-2 border">{user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}</td>
                              <td className="px-4 py-2 border">{user.rut}</td>
                              <td className="px-4 py-2 border text-center">
                                {estaEnSeccionActual ? (
                                  <button
                                    disabled
                                    className="bg-gray-400 text-gray-200 px-2 py-1 rounded text-xs cursor-not-allowed"
                                  >
                                    En sección {seccionInscrito || modalSeccion.numero}
                                  </button>
                                ) : estaEnOtraSeccion ? (
                                  <div className="flex gap-2 justify-center">
                                    <button
                                      disabled
                                      className="bg-gray-400 text-gray-200 px-2 py-1 rounded text-xs cursor-not-allowed"
                                    >
                                      En sección {seccionInscrito}
                                    </button>
                                    <button
                                      className="bg-blue-500 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs"
                                      onClick={() => handleAgregarAlumno(alumno)}
                                    >
                                      Mover a esta sección
                                    </button>
                                  </div>
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
                              <td className="px-4 py-2 border text-gray-800">{user.apellidoPaterno} {user.apellidoMaterno}, {user.nombres}</td>
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
    </div>
  );
}
