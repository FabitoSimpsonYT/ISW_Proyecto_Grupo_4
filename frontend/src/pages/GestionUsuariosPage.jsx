import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import RegistroUsuariosForm from "../components/RegistroUsuariosForm.jsx";
import UsuariosList from "../components/UsuariosList.jsx";

export default function GestionUsuariosPage() {
  const { user } = useAuth();
  const [reload, setReload] = useState(false);

  // Verificar permisos: solo admin
  if (!user || user.role !== 'admin') {
    return <Navigate to="/home" replace />;
  }

  const handleSaved = () => {
    setReload(!reload);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Gestión de Usuarios</h1>
          <p className="text-blue-100">
            Administrador - Crea y gestiona usuarios del sistema (admins, profesores, alumnos)
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* FORMULARIO */}
          <div className="lg:col-span-1">
            <RegistroUsuariosForm onSaved={handleSaved} />
          </div>

          {/* LISTA */}
          <div className="lg:col-span-2">
            <UsuariosList reload={reload} />
          </div>
        </div>
      </div>
    </div>
  );
}
