import { useState, useEffect } from "react";
import { createRamo, updateRamo } from "../services/ramos.service.js";

export default function RamosForm({ ramoEdit, onSaved }) {
  const initialState = {
    nombre: '',
    codigo: '',
    rutProfesor: '',
    originalCodigo: null // Para guardar el código original cuando se edita
  };

  const [ramo, setRamo] = useState(initialState);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (ramoEdit) {
      setRamo({
        nombre: ramoEdit.nombre || '',
        codigo: ramoEdit.codigo || '',
        rutProfesor: ramoEdit.rutProfesor || '',
        originalCodigo: ramoEdit.codigo || null // Guardar el código original
      });
    } else {
      setRamo(initialState);
    }
  }, [ramoEdit]);
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setRamo({ ...ramo, [name]: value });
  };

  const validateForm = () => {
    if (!ramo.nombre.trim()) {
      setError('El nombre del ramo es obligatorio');
      return false;
    }
    if (ramo.nombre.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    if (!ramo.codigo.trim()) {
      setError('El código del ramo es obligatorio');
      return false;
    }
    // Validar formato del código: ABC1234
    const codigoRegex = /^[A-Z]{3}[0-9]{4}$/;
    if (!codigoRegex.test(ramo.codigo)) {
      setError('El código debe tener el formato ABC1234 (3 letras mayúsculas + 4 números)');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const dataToSend = {
        nombre: ramo.nombre,
        codigo: ramo.codigo
      };

      if (ramo.rutProfesor.trim()) {
        dataToSend.rutProfesor = ramo.rutProfesor;
      }

      // Si originalCodigo existe, es una actualización
      if (ramo.originalCodigo) {
        await updateRamo(ramo.originalCodigo, dataToSend);
        alert('Ramo actualizado correctamente');
        // Agregar pequeño delay para asegurar que los datos se procesaron en el backend
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await createRamo(dataToSend);
        alert('Ramo creado correctamente');
      }

      setRamo(initialState);
      onSaved();
    } catch (error) {
      setError(error.message || 'Error al guardar el ramo');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-gray-50 shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        {ramo.originalCodigo ? 'Editar Ramo' : 'Crear Nuevo Ramo'}
      </h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Nombre del Ramo:
        </label>
        <input
          type="text"
          name="nombre"
          value={ramo.nombre}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ej: Programación I"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Código del Ramo:
        </label>
        <input
          type="text"
          name="codigo"
          value={ramo.codigo}
          onChange={(e) => handleChange({ ...e, target: { ...e.target, value: e.target.value.toUpperCase() } })}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="ej: PRG0001"
          pattern="[A-Z]{3}[0-9]{4}"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Formato: 3 letras mayúsculas + 4 números</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          RUT del Profesor (Opcional):
        </label>
        <input
          type="text"
          name="rutProfesor"
          value={ramo.rutProfesor}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ej: 12345678-9"
        />
        <p className="text-xs text-gray-500 mt-1">Formato: 12345678-9 o 1234567-K</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {loading ? 'Guardando...' : (ramo.originalCodigo ? 'Actualizar Ramo' : 'Crear Ramo')}
      </button>
    </form>
  );
}
