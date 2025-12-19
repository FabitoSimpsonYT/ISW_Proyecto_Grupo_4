import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import RamosForm from "../components/RamosForm.jsx";
import RamosList from "../components/RamosList.jsx";

export default function GestionRamosPage() {
  const { user } = useAuth();
  const [selectedRamo, setSelectedRamo] = useState(null);
  const [reload, setReload] = useState(false);

  // Verificar permisos: solo admin y jefe de carrera
  if (!user || (user.role !== 'admin' && user.role !== 'jefecarrera')) {
    return <Navigate to="/home" replace />;
  }

  const handleSaved = () => {
    setSelectedRamo(null);
    setReload(!reload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gestión de Ramos</h1>
          <p className="text-blue-100">
            {user.role === 'admin' ? 'Administrador - ' : 'Jefe de Carrera - '}
            Crea, edita y gestiona los ramos del sistema
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO */}
          <div className="lg:col-span-1">
            <RamosForm ramoEdit={selectedRamo} onSaved={handleSaved} />
          </div>

          {/* LISTA */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <RamosList onEdit={setSelectedRamo} reload={reload} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
