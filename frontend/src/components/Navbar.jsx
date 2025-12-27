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
      console.error("Error al cerrar sesión:", err);
    }

    try { sessionStorage.removeItem("usuario"); } catch (e) {}
    try { localStorage.removeItem("token"); } catch (e) {}
    try { localStorage.removeItem("user"); } catch (e) {}
    try { setUser(null); } catch (e) {}

    navigate("/");
  };

  return (
    <>
      {/* NAVBAR */}
      <nav
        className={`fixed left-0 top-0 h-screen w-64 bg-[#0E2C66] text-white shadow-xl flex flex-col p-6 transition-transform duration-300 z-40 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* CABECERA */}
        <div className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <button
              aria-label="Logo"
              className="p-1 rounded-md hover:bg-[#1a3f8f] transition"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="5" r="1.8" fill="white" />
                <circle cx="12" cy="12" r="1.8" fill="white" />
                <circle cx="12" cy="19" r="1.8" fill="white" />
              </svg>
            </button>
            <h1 className="text-lg font-semibold">Plataforma Derecho</h1>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-[#1a3f8f] rounded-lg transition"
            title="Ocultar menú"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
              <path d="M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* MENÚ SCROLLEABLE */}
        <div className="flex flex-col gap-4 flex-1 overflow-y-auto pr-1">
          <button
            onClick={() => { navigate("/home"); setIsOpen(false); }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            🏠 Inicio
          </button>

          <button
            onClick={() => { navigate("/mi-agenda"); setIsOpen(false); }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            📅 Mi Agenda
          </button>

          {user?.role === "alumno" && (
            <>
              <button
                onClick={() => { navigate("/inscribir-evaluaciones"); setIsOpen(false); }}
                className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
              >
                ✍️ Inscribir Evaluaciones
              </button>

              <button
                onClick={() => { navigate("/mis-ramos-notas"); setIsOpen(false); }}
                className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
              >
                📊 Notas
              </button>
            </>
          )}

          {/* APELACIONES */}
          {user?.role === "alumno" && (
            <button
              onClick={() => { navigate("/apelaciones/mis"); setIsOpen(false); }}
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
              Apelaciones
            </button>
          )}

          {(user?.role === "profesor" || user?.role === "jefecarrera") && (
            <button
              onClick={() => { navigate("/evaluaciones"); setIsOpen(false); }}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              📊 Evaluaciones
            </button>
          )}

          <button
            onClick={() => { navigate("/notificaciones"); setIsOpen(false); }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Notificaciones
          </button>

          {(user?.role === "admin" || user?.role === "jefecarrera") && (
            <>
              <button
                onClick={() => { navigate("/ramos"); setIsOpen(false); }}
                className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
              >
                📚 Gestionar Ramos
              </button>

              <button
                onClick={() => { navigate("/bloqueos"); setIsOpen(false); }}
                className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
              >
                ⛔ Administrar Bloqueos
              </button>
            </>
          )}

          {(user?.role === "admin" || user?.role === "jefecarrera") && (
            <button
              onClick={() => { navigate("/usuarios"); setIsOpen(false); }}
              className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
            >
              👥 Gestionar Usuarios
            </button>
          )}

          <button
            onClick={() => { navigate("/mi-perfil"); setIsOpen(false); }}
            className="px-4 py-2 border border-white rounded-lg hover:bg-white hover:text-[#0E2C66] transition font-medium"
          >
            Ver Perfil
          </button>
        </div>

        {/* LOGOUT */}
        <button
          onClick={handleLogout}
          className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition font-medium border border-red-700 mt-6 shrink-0"
        >
          🚪 Cerrar Sesión
        </button>
      </nav>

      {/* BOTÓN ABRIR */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed left-4 top-4 z-30 p-3 bg-[#0E2C66] text-white rounded-lg hover:bg-[#1a3f8f] transition shadow-lg"
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M3 6h18" stroke="white" strokeWidth="2" />
            <path d="M3 12h18" stroke="white" strokeWidth="2" />
            <path d="M3 18h18" stroke="white" strokeWidth="2" />
          </svg>
        </button>
      )}

      {/* OVERLAY */}
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
