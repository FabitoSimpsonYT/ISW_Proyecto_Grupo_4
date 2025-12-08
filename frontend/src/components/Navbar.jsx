import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="fixed left-0 top-0 h-full w-64 bg-[#0E2C66] text-white shadow-xl flex flex-col p-6">
      
      {/* TÍTULO */}
      <h1 className="text-lg font-semibold mb-10 text-center">
        Plataforma Derecho
      </h1>

      {/* BOTONES */}
      <div className="flex flex-col gap-4 flex-1">

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
  );
};

export default Navbar;
