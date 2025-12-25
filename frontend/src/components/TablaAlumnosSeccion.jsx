import { useEffect, useState } from "react";

function TablaAlumnosSeccion({ ramoId, seccionId }) {
  const [alumnos, setAlumnos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!ramoId || !seccionId) return;
    fetch(`/api/ramos/alumnos/${ramoId}/${seccionId}`)
      .then(res => res.json())
      .then(data => {
        setAlumnos(data.data || []);
        setLoading(false);
      });
  }, [ramoId, seccionId]);

  if (loading) return <div>Cargando...</div>;

  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="bg-[#113C63] text-white">
          <th className="px-4 py-2 border">Nombre</th>
          <th className="px-4 py-2 border">RUT</th>
        </tr>
      </thead>
      <tbody>
        {alumnos.map(alumno => (
          <tr key={alumno.id} className="hover:bg-blue-50">
            <td className="px-4 py-2 border">{alumno.nombres} {alumno.apellidoPaterno} {alumno.apellidoMaterno}</td>
            <td className="px-4 py-2 border">{alumno.rut}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default TablaAlumnosSeccion;
