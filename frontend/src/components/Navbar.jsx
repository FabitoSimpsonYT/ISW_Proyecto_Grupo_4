import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { logout } from "../services/auth.service.js";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const handleApelaciones = () => {
    if (user?.role === "alumno") {
      navigate("/apelaciones/mis");  // Página del alumno
    } else if (user?.role === "profesor") {
      navigate("/apelaciones-profesor"); // Página del profesor
    } else {
      console.warn("Usuario sin rol válido para apelaciones");
    }
  };

  return (
    <>
      {/* BOTÓN PARA MOSTRAR/OCULTAR */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 z-50 p-2 bg-[#0E2C66] text-white rounded-lg hover:bg-[#1a3f8f] transition ${
          isOpen ? 'left-72' : 'left-4'
        }`}
        title={isOpen ? 'Ocultar menú' : 'Mostrar menú'}
      >
        {isOpen ? '◀' : '▶'}
      </button>

      {/* NAVBAR */}
      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-[#0E2C66] text-white shadow-xl flex flex-col p-6 transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* TÍTULO */}
        <h1 className="text-lg font-semibold mb-10 text-center">
          Plataforma Derecho
        </h1>


          {/* MI AGENDA */}
          <button
            onClick={() => navigate("/mi-agenda")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            📅 Mi Agenda
          </button>

          {/* APELACIONES */}
          <button
            onClick={() => navigate("/apelaciones/mis")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Apelaciones
          </button>

          {/* PROFESOR */}
          {user?.role === "profesor" && (
            <button
              onClick={() => navigate("/crear-pauta")}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              Crear Pauta
            </button>
          )}

          {/* GESTIONAR RAMOS - SOLO ADMIN Y JEFE DE CARRERA */}
          {(user?.role === "admin" || user?.role === "jefecarrera") && (
            <button
              onClick={() => navigate("/ramos")}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              📚 Gestionar Ramos
            </button>
          )}

          {/* GESTIÓN DE USUARIOS - SOLO ADMIN */}
          {user?.role === "admin" && (
            <button
              onClick={() => navigate("/usuarios")}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              👥 Gestionar Usuarios
            </button>
          )}

          {/* ALUMNO */}
          {user?.role === "alumno" && (
            <button
              onClick={() => navigate("/ver-pautas")}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              Ver Pautas
            </button>
          )}

          {/* VER PERFIL */}
          <button
            onClick={() => navigate("/mi-perfil")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Ver Perfil
          </button>


        {/* CERRAR SESIÓN - AL FINAL */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium border border-red-700"
        >
          🚪 Cerrar Sesión
        </button>
      </nav>

      {/* OVERLAY PARA CERRAR AL HACER CLICK */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
