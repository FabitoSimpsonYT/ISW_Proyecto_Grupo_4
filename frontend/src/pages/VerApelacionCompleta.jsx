import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getApelacionById,
  responderApelacion,
} from "../services/apelaciones.service";

import ApelacionInfo from "../components/ApelacionInfo";
import FormularioApelacion from "../components/FormularioApelacion";

export default function VerApelacionCompleta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [apelacion, setApelacion] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadApelacion = async () => {
      try {
        const res = await getApelacionById(id);

        if (res?.data) {
          setApelacion(res.data);

          if (res.data.estado?.toLowerCase() === "pendiente") {
            await responderApelacion(id, { estado: "revisada" });
            setApelacion((prev) => ({
              ...prev,
              estado: "revisada",
            }));
          }
        }
      } catch (error) {
        console.error("Error cargando apelación:", error);
      }
    };

    loadApelacion();
  }, [id]);

  const handleResponder = async (data) => {
    setLoading(true);

    try {
      await responderApelacion(id, data);
      navigate("/apelaciones-profesor");
    } catch (error) {
      console.error("Error respondiendo apelación:", error);
      alert(error?.data?.message || "Error al responder la apelación");
    } finally {
      setLoading(false);
    }
  };

  if (!apelacion) {
    return <p className="p-8">Cargando apelación...</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ml-[250px] p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white px-8 py-6 rounded-t-2xl shadow-lg">
          <h1 className="text-3xl font-bold">Detalle de Apelación</h1>
          <p className="text-white/80 mt-1">
            Revisa la información y responde la apelación
          </p>
        </div>

        <div className="bg-white rounded-b-2xl shadow-xl p-8 space-y">
          <section>
            <ApelacionInfo apelacion={apelacion} />
          </section>

          <hr />

          <section>
            <h2 className="text-xl font-semibold mb-4">
              Responder apelación
            </h2>

            <FormularioApelacion
              modo="responder"
              apelacionInicial={apelacion}
              onSubmit={handleResponder}
              loading={loading}
            />
          </section>

          <div className="flex justify-center pt-6">
            <button
              onClick={() => navigate("/apelaciones-profesor")}
              className="bg-[#9cb0e5] text-[#0E2C66] px-8 py-2 rounded-full shadow hover:bg-[#8aa2d6] transition"
            >
              Volver a la bandeja
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
