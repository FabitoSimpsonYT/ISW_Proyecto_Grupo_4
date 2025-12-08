import MisApelaciones from "./MisApelaciones";
import { useNavigate } from "react-router-dom";

export default function ApelacionesPage() {
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="text-3xl mb-6 text-white font-bold">Apelaciones</h1>

      <MisApelaciones />

      <button
        onClick={() => navigate("/apelaciones/crear")}
        className="mt-6 px-4 py-2 bg-white text-[#0E2C66] rounded-lg font-semibold"
      >
        Crear Apelación
      </button>
    </div>
  );
}
