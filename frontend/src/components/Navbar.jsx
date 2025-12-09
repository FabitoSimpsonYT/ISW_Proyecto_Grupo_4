import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);

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

        {/* BOTONES */}
        <div className="flex flex-col gap-4 flex-1">

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
        </div>
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
