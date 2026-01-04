import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { FiTrash2, FiEdit2, FiPlus } from 'react-icons/fi';
import { getTiposEventos, crearTipoEvento, actualizarTipoEvento, eliminarTipoEvento } from '../services/tipoEvento.service';
import { useAuth } from '../context/AuthContext';

export default function TiposEventos() {
  const { user } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ nombre: '', descripcion: '', color: '#3B82F6' });

  // Cargar tipos de eventos
  const cargarTipos = async () => {
    try {
      setCargando(true);
      const res = await getTiposEventos();
      setTipos(Array.isArray(res) ? res : (res?.tipos || []));
    } catch (err) {
      toast.error('Error al cargar tipos de eventos');
      console.error(err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarTipos();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Crear o actualizar tipo
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    if (!/^#[0-9A-F]{6}$/i.test(form.color)) {
      toast.error('Color inválido. Usa formato hexadecimal (ej: #FF5733)');
      return;
    }

    try {
      if (editando) {
        await actualizarTipoEvento(editando.id, form);
        toast.success('Tipo de evento actualizado');
      } else {
        await crearTipoEvento(form);
        toast.success('Tipo de evento creado');
      }
      
      setForm({ nombre: '', descripcion: '', color: '#3B82F6' });
      setEditando(null);
      setMostrarForm(false);
      cargarTipos();
    } catch (err) {
      console.error('Error:', err);
      toast.error(err?.response?.data?.message || 'Error al guardar tipo de evento');
    }
  };

  // Editar tipo
  const handleEditar = (tipo) => {
    setEditando(tipo);
    setForm({ 
      nombre: tipo.nombre, 
      descripcion: tipo.descripcion || '', 
      color: tipo.color || '#3B82F6' 
    });
    setMostrarForm(true);
  };

  // Eliminar tipo
  const handleEliminar = async (id) => {
    if (!confirm('¿Está seguro de que desea eliminar este tipo de evento?')) {
      return;
    }

    try {
      await eliminarTipoEvento(id);
      toast.success('Tipo de evento eliminado');
      cargarTipos();
    } catch (err) {
      toast.error('Error al eliminar tipo de evento');
      console.error(err);
    }
  };

  // Cancelar edición
  const handleCancelar = () => {
    setForm({ nombre: '', descripcion: '', color: '#3B82F6' });
    setEditando(null);
    setMostrarForm(false);
  };

  // Verificar permisos
  if (!['admin', 'jefecarrera'].includes(user?.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Acceso Denegado</h1>
          <p className="text-gray-600 mt-2">No tienes permisos para acceder a esta página</p>
        </div>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Cargando tipos de eventos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestionar Tipos de Eventos</h1>
          <p className="text-gray-600 mt-2">Crea y gestiona los tipos de eventos disponibles en el sistema</p>
        </div>

        {/* Botón Crear */}
        {!mostrarForm && (
          <button
            onClick={() => setMostrarForm(true)}
            className="mb-6 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <FiPlus className="mr-2" /> Crear Nuevo Tipo
          </button>
        )}

        {/* Formulario */}
        {mostrarForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold mb-4">
              {editando ? 'Editar Tipo de Evento' : 'Crear Nuevo Tipo de Evento'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre *
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={form.nombre}
                    onChange={handleChange}
                    placeholder="Ej: Examen, Taller, Presentación"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Color *
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      name="color"
                      value={form.color}
                      onChange={handleChange}
                      className="h-10 w-20 border border-gray-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.color}
                      onChange={handleChange}
                      name="color"
                      placeholder="#FF0000"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descripción
                </label>
                <textarea
                  name="descripcion"
                  value={form.descripcion}
                  onChange={handleChange}
                  placeholder="Descripción del tipo de evento (opcional)"
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  {editando ? 'Actualizar' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={handleCancelar}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de tipos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tipos.length > 0 ? (
            tipos.map(tipo => (
              <div key={tipo.id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded"
                      style={{ backgroundColor: tipo.color || '#3B82F6' }}
                    />
                    <h3 className="text-lg font-bold text-gray-900">{tipo.nombre}</h3>
                  </div>
                </div>

                {tipo.descripcion && (
                  <p className="text-gray-600 text-sm mb-4">{tipo.descripcion}</p>
                )}

                <div className="text-xs text-gray-500 mb-4">
                  Color: {tipo.color || '#3B82F6'}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditar(tipo)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
                  >
                    <FiEdit2 className="mr-1" /> Editar
                  </button>
                  <button
                    onClick={() => handleEliminar(tipo.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                  >
                    <FiTrash2 className="mr-1" /> Eliminar
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <p className="text-gray-500 text-lg">No hay tipos de eventos creados</p>
              <button
                onClick={() => setMostrarForm(true)}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus className="mr-2" /> Crear el Primero
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
