import { useAuth } from "../context/AuthContext.jsx";
import { useNavbar } from "../context/NavbarContext.jsx";
import { useNavigate } from "react-router-dom";
import { logout } from "../services/auth.service.js";

const Navbar = () => {
  const { user } = useAuth();
  const { isNavbarOpen: isOpen, setIsNavbarOpen: setIsOpen } = useNavbar();
  const navigate = useNavigate();

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
      {/* NAVBAR */}
      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-[#0E2C66] text-white shadow-xl flex flex-col p-6 transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* CABECERA CON TÍTULO Y BOTÓN */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <button aria-label="Logo" className="p-1 rounded-md hover:bg-[#1a3f8f] transition">
              {/* Vertical three dots (logo) */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="5" r="1.8" fill="white" />
                <circle cx="12" cy="12" r="1.8" fill="white" />
                <circle cx="12" cy="19" r="1.8" fill="white" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">
              Plataforma Derecho
            </h1>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[#1a3f8f] rounded-lg transition"
            title="Ocultar menú"
          >
            {/* Close icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* MENÚ DE OPCIONES */}
        <div className="flex flex-col gap-3 flex-1">
          {/* INICIO */}
          <button
            onClick={() => navigate("/home")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            🏠 Inicio
          </button>

          {/* MI AGENDA */}
          <button
            onClick={() => navigate("/mi-agenda")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            📅 Mi Agenda
          </button>

          {/* ALUMNO: Inscribir evaluaciones (acceso directo) */}
          {user?.role === "alumno" && (
            <button
              onClick={() => navigate("/inscribir-evaluaciones")}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              ✍️ Inscribir Evaluaciones
            </button>
          )}

          {/* APELACIONES */}
          {user?.role === "alumno" && (
            <button
              onClick={() => navigate("/apelaciones/mis")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Apelaciones
            </button>
          )}
          
          {user?.role === "profesor" && (
            <button
              onClick={() => navigate("/apelaciones-profesor")}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Apelaciones
            </button>
          )}





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

          {/* ADMIN / JEFE DE CARRERA: ADMINISTRAR BLOQUEOS */}
          {(user?.role === "admin" || user?.role === "jefecarrera") && (
            <button
              onClick={() => navigate("/bloqueos")}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              ⛔ Administrar Bloqueos
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
        </div>
        {/* CERRAR SESIÓN - AL FINAL */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium border border-red-700"
        >
          🚪 Cerrar Sesión
        </button>
      </nav>

      {/* BOTÓN FLOTANTE PARA ABRIR CUANDO ESTÁ CERRADO */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-30 p-3 bg-[#0E2C66] text-white rounded-lg hover:bg-[#1a3f8f] transition shadow-lg"
          title="Mostrar menú"
          aria-label="Abrir menú"
        >
          {/* Hamburger icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 12h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M3 18h18" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {/* OVERLAY PARA CERRAR AL HACER CLICK */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-20 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Navbar;
