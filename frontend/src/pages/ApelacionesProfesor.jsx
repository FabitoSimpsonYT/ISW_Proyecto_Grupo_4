import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { showErrorAlert, showConfirmAlert } from "@/utils/alertUtils";
import {
  getApelacionesProfesor,
  eliminarApelacion
} from "../services/apelaciones.service";
import { useNavbar } from "../context/NavbarContext";

export default function ApelacionesProfesor() {
  const [apelaciones, setApelaciones] = useState([]);
  const [apelacionesFiltradas, setApelacionesFiltradas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState("todas");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [filtroRamo, setFiltroRamo] = useState("todos");
  const [busquedaRut, setBusquedaRut] = useState("");
  const [ramosDisponibles, setRamosDisponibles] = useState([]);
  const { isNavbarOpen } = useNavbar();
  const navigate = useNavigate();

  /* ===============================
     CARGAR APELACIONES
  =============================== */
  useEffect(() => {
    const cargarApelaciones = async () => {
      try {
        const res = await getApelacionesProfesor();
        if (res?.data) {
          setApelaciones(res.data);
          setApelacionesFiltradas(res.data);
          
          // Extraer ramos disponibles
          const ramosSet = new Set();
          res.data.forEach(apel => {
            if (apel.alumno?.ramo?.nombre) {
              ramosSet.add(apel.alumno.ramo.nombre);
            }
          });
          setRamosDisponibles(Array.from(ramosSet).sort());
        }
      } catch (error) {
        console.error("Error cargando apelaciones", error);
      } finally {
        setLoading(false);
      }
    };

    cargarApelaciones();
  }, []);

  /* ===============================
     FILTRAR APELACIONES
  =============================== */
  useEffect(() => {
    let filtradas = [...apelaciones];

    if (filtroEstado !== "todas") {
      filtradas = filtradas.filter(a => a.estado?.toLowerCase() === filtroEstado);
    }

    if (filtroTipo !== "todos") {
      filtradas = filtradas.filter(a => a.tipo?.toLowerCase() === filtroTipo);
    }

    if (filtroRamo !== "todos") {
      filtradas = filtradas.filter(a => a.alumno?.ramo?.nombre === filtroRamo);
    }

    if (busquedaRut.trim()) {
      const rutBusqueda = busquedaRut.toLowerCase().trim();
      filtradas = filtradas.filter(a => {
        const alumnoEmail = a.alumno?.email?.toLowerCase() || "";
        const alumnoNombre = a.alumno?.nombre?.toLowerCase() || "";
        return alumnoEmail.includes(rutBusqueda) || alumnoNombre.includes(rutBusqueda);
      });
    }

    setApelacionesFiltradas(filtradas);
  }, [filtroEstado, filtroTipo, filtroRamo, busquedaRut, apelaciones]);

  /* ===============================
     ELIMINAR (pendiente / revisada)
  =============================== */
  const handleEliminar = async (id) => {
    const result = await showConfirmAlert(
      "¿Está seguro?",
      "¿Estás seguro de que deseas eliminar esta apelación?",
      "Eliminar",
      "Cancelar"
    );

    if (!result.isConfirmed) return;

    try {
      await eliminarApelacion(id);
      setApelaciones((prev) => prev.filter((apel) => apel.id !== id));
    } catch (error) {
      console.error("Error al eliminar apelación", error);
      showErrorAlert("Error", "No se pudo eliminar la apelación.");
    }
  };

  if (loading) return <p>Cargando apelaciones...</p>;

  return (
    <div
      className={`min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 transition-all duration-300 ${
        isNavbarOpen ? "ml-64" : "ml-0"
      } p-8`}
    >
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">Bandeja de entrada</h1>
        <p className="text-gray-600">Gestiona las apelaciones de tus estudiantes</p>
      </div>

      {/* BUSCADOR Y FILTROS */}
      <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
        {/* Buscador Principal */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Buscar por alumno
          </label>
          <input
            type="text"
            placeholder="Buscar por nombre o correo del alumno..."
            className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors"
            value={busquedaRut}
            onChange={(e) => setBusquedaRut(e.target.value)}
          />
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              <option value="todas">📚 Todas</option>
              <option value="nota">📝 Nota</option>
              <option value="inasistencia">🚫 Inasistencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C6.5 6.253 2 10.998 2 17s4.5 10.747 10 10.747c5.5 0 10-4.998 10-10.747S17.5 6.253 12 6.253z" />
              </svg>
              Filtrar por Ramo
            </label>
            <select
              className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors bg-white"
              value={filtroRamo}
              onChange={(e) => setFiltroRamo(e.target.value)}
            >
              <option value="todos">📚 Todos los ramos</option>
              {ramosDisponibles.map((ramo) => (
                <option key={ramo} value={ramo}>{ramo}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Results counter */}
        <div className="text-sm text-gray-600 font-medium">
          Mostrando {apelacionesFiltradas.length} de {apelaciones.length} apelaciones
        </div>
      </div>

      {/* Table section */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0E2C66] text-white">
                <th className="px-6 py-4 text-left text-sm font-semibold">Tipo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Mensaje</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Alumno</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Ramo</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Fecha creación</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Última actualización</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Citación</th>
                <th className="px-4 py-4 text-center text-sm font-semibold w-20">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
            {apelacionesFiltradas.length === 0 && (
              <tr>
                <td colSpan="9" className="text-center py-12">
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
              const requiereCitacion = apel.subtipoInasistencia === "evaluacion";
              const puedeEliminar = estado === "pendiente" || estado === "revisada";

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
                  onClick={() => navigate(`/profesor/apelacion/${apel.id}`)}
                  className="group cursor-pointer hover:bg-[#E8EDF5] transition-colors duration-150"
                >
                  {/* TIPO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">
                        {apel.tipo === "evaluacion" ? "📝" : apel.tipo === "inasistencia" ? "🏥" : "🚨"}
                      </span>
                      <div>
                        <p className="font-medium text-gray-900 capitalize">{apel.tipo}</p>
                        {apel.tipo === "evaluacion" && apel.pautaEvaluada?.evaluacionTitulo && (
                          <span className="text-xs text-gray-500">
                            {apel.pautaEvaluada.evaluacionTitulo}
                          </span>
                        )}
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
                      {estado === "aceptada" && "✅ Aprobada"}
                      {estado === "rechazada" && "❌ Rechazada"}
                      {estado === "revisada" && "👀 Revisada"}
                      {estado === "pendiente" && "⏳ Pendiente"}
                      {estado === "cita" && "📅 Citada"}
                    </span>
                    {requiereCitacion && estado === "pendiente" && (
                      <span className="block text-xs text-[#0E2C66] mt-1 font-medium">
                        🔄 Requiere cita
                      </span>
                    )}
                  </td>

                  {/* ALUMNO */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-[#E8EDF5] rounded-full flex items-center justify-center">
                        <span className="text-[#0E2C66] font-semibold text-sm">
                          {apel.alumno?.email?.[0]?.toUpperCase() || "?"}
                        </span>
                      </div>
                      <span className="text-gray-700 text-sm">{apel.alumno?.email || "Desconocido"}</span>
                    </div>
                  </td>

                  {/* RAMO */}
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg">
                      {apel.alumno?.ramo?.nombre || "—"}
                    </span>
                  </td>

                  {/* FECHA CREACIÓN */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(apel.creadoEl).toLocaleString("es-CL", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>

                  {/* ÚLTIMA ACTUALIZACIÓN */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {["pendiente", "cita", "revisada"].includes(apel.estado?.toLowerCase()) ? (
                      new Date(apel.actualizadoEl).toLocaleString("es-CL", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* CITACIÓN */}
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {apel.fechaCitacion ? (
                      <div className="flex items-center gap-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(apel.fechaCitacion).toLocaleString("es-CL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </div>
                    ) : requiereCitacion && estado === "aceptada" ? (
                      <span className="text-orange-600 text-xs flex items-center gap-1">
                        ⚠️ Falta agendar
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  {/* ELIMINAR */}
                  <td className="px-4 py-4 text-center">
                    {puedeEliminar && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEliminar(apel.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 transition-all"
                        title="Eliminar apelación"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
