import { useAuth } from "../context/AuthContext.jsx";
import { useNavbar } from "../context/NavbarContext.jsx";
import { useNavigate } from "react-router-dom";
import { logout as logoutService } from "../services/auth.service.js";

const Navbar = () => {
  const { user, setUser } = useAuth();
  const { isNavbarOpen: isOpen, setIsNavbarOpen: setIsOpen } = useNavbar();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logoutService();
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
    // Limpiar estado y redirigir al login
    try {
      sessionStorage.removeItem('usuario');
    } catch (e) {}
    try {
      localStorage.removeItem('token');
    } catch (e) {}
    try {
      localStorage.removeItem('user');
    } catch (e) {}
    try {
      setUser(null);
    } catch (e) {}
    navigate('/');
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
          <h1 className="text-lg font-semibold">
            Plataforma Derecho
          </h1>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[#1a3f8f] rounded-lg transition"
            title="Ocultar menú"
          >
            ◀
          </button>
        </div>

        {/* MENÚ DE OPCIONES */}
        <div className="flex flex-col gap-4 flex-1">
          {/* INICIO */}
          <button
            onClick={() => {
              navigate("/home");
              setIsOpen(false);
            }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            🏠 Inicio
          </button>

          {/* MI AGENDA */}
          <button
            onClick={() => {
              navigate("/mi-agenda");
              setIsOpen(false);
            }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            📅 Mi Agenda
          </button>

          {/* APELACIONES */}
          <button
            onClick={() => {
              navigate("/apelaciones/mis");
              setIsOpen(false);
            }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Apelaciones
          </button>

          {/* EVALUACIONES */}
          <button
            onClick={() => {
              navigate("/evaluaciones");
              setIsOpen(false);
            }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Evaluaciones
          </button>

          {/* NOTIFICACIONES */}
          <button
            onClick={() => {
              navigate("/notificaciones");
              setIsOpen(false);
            }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Notificaciones
          </button>


          {/* PROFESOR */}
          {user?.role === "profesor" && (
            <button
              onClick={() => {
                navigate("/crear-pauta");
                setIsOpen(false);
              }}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              Crear Pauta
            </button>
          )}

          {/* GESTIONAR RAMOS - SOLO ADMIN Y JEFE DE CARRERA */}
          {(user?.role === "admin" || user?.role === "jefecarrera") && (
            <button
              onClick={() => {
                navigate("/ramos");
                setIsOpen(false);
              }}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              📚 Gestionar Ramos
            </button>
          )}

          {/* GESTIÓN DE USUARIOS - SOLO ADMIN Y JEFE DE CARRERA */}
          {(user?.role === "admin" || user?.role === "jefecarrera") && (
            <button
              onClick={() => {
                navigate("/usuarios");
                setIsOpen(false);
              }}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              👥 Gestionar Usuarios
            </button>
          )}

          {/* ALUMNO */}
          {user?.role === "alumno" && (
            <button
              onClick={() => {
                navigate("/ver-pautas");
                setIsOpen(false);
              }}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              Ver Pautas
            </button>
          )}

          {/* VER PERFIL */}
          <button
            onClick={() => {
              navigate("/mi-perfil");
              setIsOpen(false);
            }}
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
        >
          ▶
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
