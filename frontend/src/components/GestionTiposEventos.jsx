// src/components/GestionTiposEventos.jsx
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { getTiposEventos, crearTipoEvento, actualizarTipoEvento, eliminarTipoEvento } from '../services/tipoEvento.service.js';

export default function GestionTiposEventos() {
  const [tipos, setTipos] = useState([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoColor, setNuevoColor] = useState('#3B82F6');
  const [editandoId, setEditandoId] = useState(null);
  const [editNombre, setEditNombre] = useState('');
  const [editColor, setEditColor] = useState('');

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    try {
      const res = await getTiposEventos();
      // la función `api` devuelve response.data, que en backend usa { success, data }
      const tiposData = res?.data || res || [];
      setTipos(tiposData);
    } catch (err) {
      Swal.fire('Error', 'No se pudieron cargar los tipos de evento', 'error');
    }
  };

  const crearTipo = async (e) => {
    e.preventDefault();
    if (!nuevoNombre.trim()) {
      Swal.fire('Error', 'El nombre es obligatorio', 'error');
      return;
    }

    try {
      await crearTipoEvento({ nombre: nuevoNombre, color: nuevoColor });
      Swal.fire('Éxito', 'Tipo de evento creado correctamente', 'success');
      setNuevoNombre('');
      setNuevoColor('#3B82F6');
      await cargarTipos();
      // Notificar a otras vistas que los tipos cambiaron
      window.dispatchEvent(new CustomEvent('tiposUpdated'));
    } catch (err) {
      Swal.fire('Error', 'No se pudo crear el tipo', 'error');
    }
  };

  const iniciarEdicion = (tipo) => {
    setEditandoId(tipo.id);
    setEditNombre(tipo.nombre);
    setEditColor(tipo.color);
  };

  const guardarEdicion = async () => {
    try {
      await actualizarTipoEvento(editandoId, { nombre: editNombre, color: editColor });
      Swal.fire('Éxito', 'Tipo actualizado correctamente', 'success');
      setEditandoId(null);
      await cargarTipos();
      window.dispatchEvent(new CustomEvent('tiposUpdated'));
    } catch (err) {
      Swal.fire('Error', 'No se pudo actualizar', 'error');
    }
  };

  const eliminarTipo = async (id, nombre) => {
    const confirmacion = await Swal.fire({
      title: '¿Eliminar tipo de evento?',
      text: `¿Estás seguro de eliminar "${nombre}"? Esta acción no se puede deshacer.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!confirmacion.isConfirmed) return;

    try {
      // API real
      const res = await eliminarTipoEvento(id);
      // la función api devuelve response.data o lanza error
      Swal.fire('Eliminado', `"${nombre}" ha sido eliminado`, 'success');
      await cargarTipos();
      window.dispatchEvent(new CustomEvent('tiposUpdated'));
    } catch (err) {
      Swal.fire('Error', 'Error de conexión al eliminar', 'error');
    }
  };

  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-8 text-center text-gray-800">
        Gestión de Tipos de Evento
      </h2>

      {/* Formulario para crear nuevo tipo */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8 mb-12 max-w-2xl mx-auto">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Crear nuevo tipo de evento</h3>
        <form onSubmit={crearTipo} className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del tipo *
            </label>
            <input
              type="text"
              value={nuevoNombre}
              onChange={(e) => setNuevoNombre(e.target.value)}
              placeholder="Ej. TALLER"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0E2C66] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Color del tipo *
            </label>
            <div className="flex justify-center">
              <input
                type="color"
                value={nuevoColor}
                onChange={(e) => setNuevoColor(e.target.value)}
                className="w-24 h-24 border-4 border-gray-300 rounded-xl cursor-pointer shadow-lg hover:shadow-xl transition"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              className="w-full px-8 py-4 bg-[#0E2C66] text-white rounded-lg hover:bg-[#0a1f4d] font-medium shadow-lg transition"
            >
              Crear Tipo
            </button>
          </div>
        </form>
      </div>

      {/* Listado de tipos existentes */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 p-8">
        <h3 className="text-xl font-semibold mb-6 text-gray-800">Tipos de evento existentes</h3>

        {tipos.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No hay tipos de evento registrados aún</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tipos.map((tipo) => (
              <div
                key={tipo.id}
                className="bg-gray-50 border border-gray-300 rounded-xl p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-6">
                  {editandoId === tipo.id ? (
                    <input
                      type="text"
                      value={editNombre}
                      onChange={(e) => setEditNombre(e.target.value)}
                      className="text-lg font-semibold px-3 py-2 border border-gray-400 rounded-lg w-full"
                    />
                  ) : (
                    <h4 className="text-lg font-semibold text-gray-800">{tipo.nombre}</h4>
                  )}

                  <div className="flex justify-center ml-4">
                    {editandoId === tipo.id ? (
                      <input
                        type="color"
                        value={editColor}
                        onChange={(e) => setEditColor(e.target.value)}
                        className="w-20 h-20 border-4 border-gray-400 rounded-xl cursor-pointer"
                      />
                    ) : (
                      <div
                        className="w-20 h-20 rounded-xl shadow-inner border-4 border-gray-300"
                        style={{ backgroundColor: tipo.color + 'CC' }} // semi-transparente
                      ></div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4">
                  {editandoId === tipo.id ? (
                    <>
                      <button
                        onClick={guardarEdicion}
                        className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => setEditandoId(null)}
                        className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 font-medium transition"
                      >
                        Cancelar
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => iniciarEdicion(tipo)}
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarTipo(tipo.id, tipo.nombre)}
                        className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}