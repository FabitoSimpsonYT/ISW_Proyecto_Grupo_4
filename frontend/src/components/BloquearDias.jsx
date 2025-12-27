// src/components/BloquearDias.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

export default function BloquearDias() {
  const [bloqueos, setBloqueos] = useState([]);
  const [nuevoBloqueo, setNuevoBloqueo] = useState({
    fechaInicio: '',
    fechaFin: '',
    razon: ''
  });

  useEffect(() => {
    cargarBloqueos();
  }, []);

  const cargarBloqueos = async () => {
    try {
      // const res = await fetch('/api/bloqueos');
      // const data = await res.json();
      // setBloqueos(data.data || []);

      // Temporal para prueba
      setBloqueos([
        { id: 1, fechaInicio: '2025-12-24', fechaFin: '2025-12-25', razon: 'Navidad' },
        { id: 2, fechaInicio: '2025-12-31', fechaFin: '2026-01-01', razon: 'Año Nuevo' }
      ]);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los bloqueos', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoBloqueo(prev => ({ ...prev, [name]: value }));
  };

  const crearBloqueo = async (e) => {
    e.preventDefault();
    if (!nuevoBloqueo.fechaInicio || !nuevoBloqueo.fechaFin) {
      Swal.fire('Error', 'Las fechas son obligatorias', 'error');
      return;
    }

    if (new Date(nuevoBloqueo.fechaInicio) > new Date(nuevoBloqueo.fechaFin)) {
      Swal.fire('Error', 'La fecha inicio debe ser antes que la fin', 'error');
      return;
    }

    try {
      // API real:
      // await fetch('/api/bloqueos', { method: 'POST', body: JSON.stringify(nuevoBloqueo) });

      Swal.fire('Éxito', 'Período bloqueado correctamente', 'success');
      setNuevoBloqueo({ fechaInicio: '', fechaFin: '', razon: '' });
      cargarBloqueos();
    } catch (err) {
      Swal.fire('Error', 'No se pudo crear el bloqueo', 'error');
    }
  };

  const eliminarBloqueo = async (id, razon) => {
    const confirm = await Swal.fire({
      title: '¿Eliminar bloqueo?',
      text: `¿Eliminar el bloqueo por "${razon}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      // await fetch(`/api/bloqueos/${id}`, { method: 'DELETE' });

      Swal.fire('Eliminado', 'Bloqueo eliminado correctamente', 'success');
      cargarBloqueos();
    } catch (err) {
      Swal.fire('Error', 'No se pudo eliminar', 'error');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
        Bloquear Días (Jefe de Carrera)
      </h2>

      {/* Formulario para nuevo bloqueo */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-12 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Crear nuevo bloqueo</h3>
        <form onSubmit={crearBloqueo} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha inicio *
            </label>
            <input
              type="date"
              name="fechaInicio"
              value={nuevoBloqueo.fechaInicio}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fecha fin *
            </label>
            <input
              type="date"
              name="fechaFin"
              value={nuevoBloqueo.fechaFin}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Razón (opcional)
            </label>
            <input
              type="text"
              name="razon"
              value={nuevoBloqueo.razon}
              onChange={handleChange}
              placeholder="Ej. Receso Navidad"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66]"
            />
          </div>
        </form>
        <button
          type="submit"
          className="w-full md:w-auto px-8 py-4 bg-[#0E2C66] text-white rounded-lg hover:bg-[#0a1f4d] font-medium shadow-lg transition mt-6"
        >
          Bloquear Período
        </button>
      </div>

      {/* Listado de bloqueos existentes */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Períodos bloqueados existentes</h3>

        {bloqueos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay períodos bloqueados registrados</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {bloqueos.map((bloqueo) => (
              <div
                key={bloqueo.id}
                className="border border-gray-300 rounded-xl p-6 hover:shadow-xl transition-shadow bg-gray-50"
              >
                <h4 className="text-lg font-semibold text-gray-800 mb-2">
                  {bloqueo.fechaInicio} a {bloqueo.fechaFin}
                </h4>
                <p className="text-gray-600 mb-4">{bloqueo.razon || 'Sin razón especificada'}</p>

                <button
                  onClick={() => eliminarBloqueo(bloqueo.id, bloqueo.razon)}
                  className="w-full px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                >
                  Eliminar Bloqueo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}