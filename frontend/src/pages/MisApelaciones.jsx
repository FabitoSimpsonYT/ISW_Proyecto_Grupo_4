import { useEffect, useState } from "react";
import { getMisApelaciones } from "../services/apelaciones.service";
import { useNavigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";

export default function MisApelaciones() {
  const [apelaciones, setApelaciones] = useState(null);
  const [apelacionesFiltradas, setApelacionesFiltradas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [busquedaTexto, setBusquedaTexto] = useState("");
  const [modalAbierto, setModalAbierto] = useState(false);
  const [respuestaSeleccionada, setRespuestaSeleccionada] = useState("");
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  useEffect(() => {
    async function load() {
      const result = await getMisApelaciones();
      setApelaciones(result.data || []);
      setApelacionesFiltradas(result.data || []);
    }
    load();
  }, []);

  useEffect(() => {
    if (!apelaciones) return;
    
    let filtradas = [...apelaciones];

    if (filtroEstado !== "todas") {
      filtradas = filtradas.filter(a => a.estado?.toLowerCase() === filtroEstado);
    }

    if (filtroTipo !== "todos") {
      filtradas = filtradas.filter(a => a.tipo?.toLowerCase() === filtroTipo);
    }

    if (busquedaTexto.trim()) {
      const termino = busquedaTexto.toLowerCase().trim();
      filtradas = filtradas.filter(a => 
        a.mensaje?.toLowerCase().includes(termino) ||
        a.profesor?.email?.toLowerCase().includes(termino) ||
        a.profesor?.nombre?.toLowerCase().includes(termino)
      );
    }

    setApelacionesFiltradas(filtradas);
  }, [filtroEstado, filtroTipo, busquedaTexto, apelaciones]);

  const puedeEditarApelacion = (apelacion) => {
    if (apelacion.estado !== "citada") return false;
    if (!apelacion.fechaCitacion) return false;
    
    const ahora = new Date();
    const citacion = new Date(apelacion.fechaCitacion);
    const horasRestantes = (citacion - ahora) / (1000 * 60 * 60);
    
    return horasRestantes >= 24;
  };



  if (apelaciones === null)
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 transition-all duration-300 flex flex-col items-center justify-center ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
        <p className="text-[#0E2C66] text-xl mb-6">
          Cargando apelaciones...
        </p>
      </div>
    );

  if (apelaciones.length === 0) {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 transition-all duration-300 flex flex-col items-center justify-center ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
        <div className="flex flex-col items-center justify-center text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <p className="text-lg font-medium text-gray-600">Aún no has creado una apelación</p>
          <p className="text-sm mt-2 text-gray-500">Crea tu primera apelación para verla aquí</p>
        </div>
        <button
          onClick={() => navigate("/apelaciones")}
          className="mt-6 bg-[#0E2C66] text-white px-8 py-3 rounded-lg shadow-lg hover:bg-[#143A80] transition"
        >
          Crear Apelación
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 transition-all duration-300 ${isNavbarOpen ? 'ml-0 md:ml-64' : 'ml-0'} p-4 md:p-8`}>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Mis Apelaciones</h1>
        <p className="text-gray-600">Gestiona todas tus apelaciones y sigue el estado de cada una</p>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* Buscador Principal */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar apelación
          </label>
          <input
            type="text"
            placeholder="Buscar por mensaje, profesor, etc..."
            className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            value={busquedaTexto}
            onChange={(e) => setBusquedaTexto(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Filtrar por Estado
            </label>
            <select
              className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-green-500 focus:outline-none transition-colors bg-white"
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="todas">📋 Todas</option>
              <option value="pendiente">⏳ Pendiente</option>
              <option value="revisada">👀 Revisada</option>
              <option value="aceptada">✅ Aceptada</option>
              <option value="rechazada">❌ Rechazada</option>
              <option value="cita">📅 Citación</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Filtrar por Tipo
            </label>
            <select
              className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none transition-colors bg-white"
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="todos">📚 Todos</option>
              <option value="evaluacion">📝 Evaluación</option>
              <option value="inasistencia">🚫 Inasistencia</option>
              <option value="emergencia">🚨 Emergencia</option>
            </select>
          </div>
        </div>

        {/* Results counter */}
        <div className="text-sm text-gray-600 font-medium mt-4">
          Mostrando {apelacionesFiltradas.length} de {apelaciones.length} apelaciones
        </div>
      </div>

      {/* Table section */}
      <div className="bg-cyan-50 rounded-xl shadow-lg overflow-hidden border border-cyan-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0E2C66] text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Mensaje</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Respuesta</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Profesor</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Fecha Citación</th>
                <th className="px-4 py-4 text-center text-sm font-semibold w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyan-100">
              {apelacionesFiltradas.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-12 bg-cyan-50">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                      </svg>
                      <p className="text-lg font-medium">No hay apelaciones que coincidan con los filtros</p>
                      <p className="text-sm mt-2">Intenta ajustar los criterios de búsqueda</p>
                    </div>
                  </td>
                </tr>
              )}

              {apelacionesFiltradas.map((apel, index) => {
                const estado = apel.estado?.toLowerCase();
                const esEditable = puedeEditarApelacion(apel);

                const estadoBadge =
                  estado === "aceptada"
                    ? "bg-green-100 text-green-800"
                    : estado === "rechazada"
                    ? "bg-red-100 text-red-800"
                    : estado === "cita"
                    ? "bg-[#E8EDF5] text-[#0E2C66]"
                    : estado === "revisada"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-gray-100 text-gray-800";

                return (
                  <tr
                    key={index}
                    onClick={() => navigate(`/apelaciones/${apel.id}/editar`)}
                    className="group cursor-pointer hover:bg-cyan-100 transition-colors duration-150 bg-white"
                  >
                    {/* TIPO */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">
                          {apel.tipo === "evaluacion" ? "📝" : apel.tipo === "inasistencia" ? "🚫" : "🚨"}
                        </span>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">{apel.tipo}</p>
                          {apel.subtipoInasistencia && (
                            <span className="text-xs text-gray-500">
                              {apel.subtipoInasistencia === "evaluacion" ? "Reagendar" : "Justificación"}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* MENSAJE */}
                    <td className="px-6 py-4">
                      <p className="text-gray-700 truncate max-w-xs">{apel.mensaje}</p>
                    </td>

                    {/* ESTADO */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${estadoBadge}`}>
                        {estado === "aceptada" && "✅ Aceptada"}
                        {estado === "rechazada" && "❌ Rechazada"}
                        {estado === "revisada" && "👀 Revisada"}
                        {estado === "pendiente" && "⏳ Pendiente"}
                        {estado === "cita" && "📅 Citación"}
                      </span>
                    </td>

                    {/* RESPUESTA */}
                    <td className="px-6 py-4">
                      {apel.respuestaDocente?.trim() ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRespuestaSeleccionada(apel.respuestaDocente);
                            setModalAbierto(true);
                          }}
                          className="text-gray-700 hover:text-gray-900 cursor-pointer truncate max-w-xs text-left transition-colors"
                          title="Haz clic para ver la respuesta completa"
                        >
                          {apel.respuestaDocente}
                        </button>
                      ) : (
                        <span className="text-gray-400 text-sm">Sin respuesta</span>
                      )}
                    </td>

                    {/* PROFESOR */}
                    <td className="px-6 py-4">
                      <p className="text-gray-700 text-sm">{apel.profesor?.nombre || apel.profesor?.email || "—"}</p>
                    </td>

                    {/* FECHA CITACIÓN */}
                    <td className="px-6 py-4 text-sm">
                      {apel.fechaCitacion ? (
                        <>
                          <p className="text-gray-700">
                            {new Date(apel.fechaCitacion).toLocaleDateString("es-CL")}
                          </p>
                          <p className="text-gray-500 text-xs">
                            {new Date(apel.fechaCitacion).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {esEditable && (
                            <span className="text-xs text-green-600 font-medium mt-1 block">
                              ✓ Editable
                            </span>
                          )}
                          {!esEditable && estado === "cita" && (
                            <span className="text-xs text-red-600 font-medium mt-1 block">
                              ⚠️ Menos de 24h
                            </span>
                          )}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* ACCIÓN */}
                    <td className="px-4 py-4 text-center">
                      {esEditable ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/apelaciones/${apel.id}/editar`);
                          }}
                          className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-200 transition-all hover:shadow-md group-hover:opacity-100 opacity-70"
                          title="Editar apelación"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                      ) : (
                        <span className="text-gray-400 text-xs font-medium">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* BOTÓN DE CREACIÓN */}
      <div className="flex justify-center mt-8">
        <button
          onClick={() => navigate("/apelaciones")}
          className="bg-[#0E2C66] text-white px-8 py-3 rounded-lg shadow-lg hover:bg-[#143A80] transition"
        >
          + Crear Apelación
        </button>
      </div>

      {/* MODAL RESPUESTA */}
      {modalAbierto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setModalAbierto(false)}
        >
          <div
            className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-screen overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0E2C66] text-white px-6 py-4 flex items-center justify-between sticky top-0">
              <h3 className="text-xl font-bold">Respuesta del Profesor</h3>
              <button
                onClick={() => setModalAbierto(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                {respuestaSeleccionada}
              </p>
            </div>

            <div className="bg-gray-50 px-6 py-4 flex justify-end border-t border-gray-200">
              <button
                onClick={() => setModalAbierto(false)}
                className="bg-[#0E2C66] text-white px-6 py-2 rounded-lg hover:bg-[#143A80] transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
