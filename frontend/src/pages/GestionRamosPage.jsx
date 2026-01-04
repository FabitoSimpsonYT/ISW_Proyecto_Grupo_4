import { useState, useMemo, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";
import RamosForm from "../components/RamosForm.jsx";
import RamosList from "../components/RamosList.jsx";
import { createPromedioFinal } from "../services/alumnoPromedioRamo.service.js";

export default function GestionRamosPage() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const [selectedRamo, setSelectedRamo] = useState(null);
  const [reload, setReload] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingPromedios, setLoadingPromedios] = useState(false);
  const [selectedPeriodo, setSelectedPeriodo] = useState("");
  const [ramos, setRamos] = useState([]);

  // Extraer períodos únicos de los ramos (formato YYYY-P)
  const periodosUnicos = useMemo(() => {
    const periodos = new Set();
    ramos.forEach(ramo => {
      const partes = ramo.codigo?.split('-');
      if (partes && partes.length >= 3) {
        const yearPeriod = `${partes[1]}-${partes[2]}`;
        periodos.add(yearPeriod);
      }
    });
    return Array.from(periodos).sort().reverse();
  }, [ramos]);

  // Establecer el período más reciente por defecto
  useEffect(() => {
    if (periodosUnicos.length > 0 && !selectedPeriodo) {
      setSelectedPeriodo(periodosUnicos[0]);
    }
  }, [periodosUnicos]);

  // Verificar permisos: solo admin y jefe de carrera
  if (!user || (user.role !== 'admin' && user.role !== 'jefecarrera')) {
    return <Navigate to="/home" replace />;
  }

  const handleSaved = () => {
    setSelectedRamo(null);
    setShowForm(false);
    setReload(!reload);
  };

  const handleEdit = (ramo) => {
    setSelectedRamo(ramo);
    setShowForm(true);
  };

  const handleCancel = () => {
    setSelectedRamo(null);
    setShowForm(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">📚 Gestión de Ramos</h1>
            <p className="text-sm text-gray-300">{user?.email || 'Usuario'}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">

      {/* Título y Botón en una fila */}
      <div className="mt-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold">Lista de ramos:</h3>
        <div className="flex gap-3 items-center">
          <select
            value={selectedPeriodo}
            onChange={(e) => setSelectedPeriodo(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todos los períodos</option>
            {periodosUnicos.map(periodo => (
              <option key={periodo} value={periodo}>
                {periodo}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#0E2C66] hover:bg-[#143A80] text-white font-bold py-2 px-6 rounded transition-colors"
          >
            + Crear Nuevo Ramo
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="mt-6">
        <input
          type="text"
          placeholder="Buscar por código (ej: 620515) o nombre (ej: Derecho Romano)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <RamosList onEdit={handleEdit} reload={reload} searchTerm={searchTerm} selectedPeriodo={selectedPeriodo} onRamosLoaded={setRamos} />
      </div>
      </div>

      {/* Formulario Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 relative">
            {/* Botón cerrar */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>

            <RamosForm ramoEdit={selectedRamo} onSaved={handleSaved} />
          </div>
        </div>
      )}
    </div>
  );
}
