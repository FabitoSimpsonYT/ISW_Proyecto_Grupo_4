import { useAuth } from "../context/AuthContext.jsx";

const Navbar = ({ onCrearPauta, onVerPerfil }) => {
  const { user } = useAuth();

  return (
    <nav className="w-full bg-gray-900 text-white py-4 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-6">
        {/* Izquierda: Navegación */}
        <div className="flex gap-4">
          {user?.role === "profesor" ? (
            <button
              onClick={onCrearPauta}
              className="px-4 py-2 bg-green-600 text-sm rounded-lg hover:bg-green-700 transition"
            >
              Crear Pauta
            </button>
          ) : user?.role === "alumno" ? (
            <a
              href="/ver-pautas"
              className="px-4 py-2 bg-blue-600 text-sm rounded-lg hover:bg-blue-700 transition"
            >
              Ver Pautas
            </a>
          ) : null}
        </div>

        {/* Centro: Nombre institucional */}
        <h1 className="text-lg font-semibold tracking-wide">
          Facultad de Derecho – Plataforma Evaluaciones
        </h1>

        {/* Derecha: Ver Perfil */}
        <button
          onClick={onVerPerfil}
          className="px-4 py-2 bg-indigo-600 text-sm rounded-lg hover:bg-indigo-700 transition"
        >
          Ver Perfil
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
