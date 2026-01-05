import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Navigate } from "react-router-dom";
import { useNavbar } from "../context/NavbarContext";
import RegistroUsuariosForm from "../components/RegistroUsuariosForm.jsx";
import UsuariosList from "../components/UsuariosList.jsx";

export default function GestionUsuariosPage() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const [reload, setReload] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedUsuario, setSelectedUsuario] = useState(null);

  // Verificar permisos: solo admin y jefe de carrera
  if (!user || (user.role !== 'admin' && user.role !== 'jefecarrera')) {
    return <Navigate to="/home" replace />;
  }

  const handleSaved = () => {
    setShowForm(false);
    setSelectedUsuario(null);
    setReload(!reload);
  };

  const handleCancel = () => {
    setShowForm(false);
    setSelectedUsuario(null);
  };

  const handleEdit = (usuario) => {
    setSelectedUsuario(usuario);
    setShowForm(true);
  };

  return (
    <div className={`min-h-screen bg-gray-50 transition-all duration-300 ${isNavbarOpen ? 'ml-0 md:ml-64' : 'ml-0'}`}>
      <header className="bg-[#1e3a5f] text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div>
            <h1 className="text-2xl font-bold">🧑 Gestión de Usuarios</h1>
            <p className="text-sm text-gray-300">{user?.email || 'Usuario'}</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">

      {/* Título y Botón en una fila */}
      <div className="mt-6 flex justify-between items-center">
        <h3 className="text-xl font-semibold">Lista de usuarios:</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-[#0E2C66] hover:bg-[#143A80] text-white font-bold py-2 px-6 rounded transition-colors"
        >
          + Crear Nuevo Usuario
        </button>
      </div>
      <div className="mt-2 bg-[#d5e8f6] h-3 rounded"></div>

      {/* Lista */}
      <div className="mt-6 bg-white shadow-md rounded-lg overflow-hidden">
        <UsuariosList reload={reload} onEdit={handleEdit} />
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

            <RegistroUsuariosForm onSaved={handleSaved} usuarioEdit={selectedUsuario} />
          </div>
        </div>
      )}
    </div>
  );
}
