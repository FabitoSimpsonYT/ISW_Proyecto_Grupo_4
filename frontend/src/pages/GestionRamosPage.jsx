import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";
import RamosForm from "../components/RamosForm.jsx";
import RamosList from "../components/RamosList.jsx";

export default function GestionRamosPage() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const [selectedRamo, setSelectedRamo] = useState(null);
  const [reload, setReload] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

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
    <div className={`p-6 bg-[#e9f7fb] min-h-screen transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'}`}>
      {/* Título */}
      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Gestión de Ramos</h2>
      </div>

      {/* Línea separadora */}
      <div className="mt-6 bg-white h-4 rounded"></div>

      {/* Título y Botón en una fila */}
      <div className="mt-6 flex justify-between items-center mr-8">
        <h3 className="text-xl font-semibold">Lista de ramos:</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0E2C66] hover:bg-[#143A80] text-white font-bold py-2 px-6 rounded transition-colors"
        >
          + Crear Nuevo Ramo
        </button>
      </div>
      <div className="mt-2 bg-[#d5e8f6] h-3 rounded"></div>

      {/* Buscador */}
      <div className="mt-6 mr-8">
        <input
          type="text"
          placeholder="Buscar por código (ej: 620515) o nombre (ej: Derecho Romano)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Lista */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden mr-8">
        <RamosList onEdit={handleEdit} reload={reload} searchTerm={searchTerm} />
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
