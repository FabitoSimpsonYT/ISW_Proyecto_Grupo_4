import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getApelacionById, responderApelacion } from "../services/apelaciones.service";

import ApelacionInfo from "../components/ApelacionInfo";
import ResponderApelacion from "../components/ResponderApelacion";

export default function VerApelacionCompleta() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [apelacion, setApelacion] = useState(null);
  const [estado, setEstado] = useState("");
  const [comentario, setComentario] = useState("");
  const [fechaLimiteEdicion, setFechaLimiteEdicion] = useState("");

  useEffect(() => {
    getApelacionById(id).then((res) => {
      const data = res.data;
      setApelacion(data);
      setEstado(data.estado ? data.estado.toLowerCase() : "");
      setFechaLimiteEdicion(
        data.fechaLimiteEdicion
          ? data.fechaLimiteEdicion.slice(0, 16)
          : ""
      );
    });
  }, [id]);

  const enviarRespuesta = async () => {
    const res = await responderApelacion(id, {
      estado,
      respuestaDocente: comentario,
      fechaLimiteEdicion: fechaLimiteEdicion || null
    });

    if (res?.data) {
      setApelacion(res.data);
      navigate("/apelaciones-profesor");
    }
  };

  if (!apelacion) return <p>Cargando...</p>;

  return (
    <div className="p-6 bg-[#e9f7fb] min-h-screen ml-[250px]">

      {/* TÍTULO PRINCIPAL */}
      <div className="bg-[#113C63] text-white px-6 py-4 rounded">
        <h2 className="text-3xl font-bold">Perfil de Profesor</h2>
      </div>

      {/* Línea separadora blanca */}
      <div className="mt-6 bg-white h-4 rounded"></div>

      {/* Subtítulo */}
      <h3 className="mt-6 text-xl font-semibold ml-2">
        Detalle de la apelación:
      </h3>

      {/* Línea azul */}
      <div className="mt-2 bg-[#9cb0e5] h-3 rounded"></div>

      {/* CONTENIDO */}
      <div className="mt-6 bg-white shadow-md rounded-lg p-6 max-w-4xl">

        <h4 className="text-2xl font-bold mb-4">
          Apelación completa
        </h4>

        <ApelacionInfo apelacion={apelacion} />

        <hr className="my-6" />

        <ResponderApelacion
          estado={estado}
          setEstado={setEstado}
          comentario={comentario}
          setComentario={setComentario}
          fechaLimiteEdicion={fechaLimiteEdicion}
          setFechaLimiteEdicion={setFechaLimiteEdicion}
          enviarRespuesta={enviarRespuesta}
        />
      </div>

      {/* VOLVER */}
<div className="flex justify-center mt-8">
        <button
          onClick={() => navigate("/apelaciones-profesor")}
          className="bg-[#9cb0e5] text-[#0E2C66] px-6 py-2 rounded-full shadow hover:bg-[#8aa2d6] transition"
        >
          Volver a la bandeja
        </button>
      </div>
    </div>
  );
}
