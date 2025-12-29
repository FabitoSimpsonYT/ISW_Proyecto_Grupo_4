import { useState, useEffect } from "react";
import { showSuccessAlert } from "@/utils/alertUtils";
import { createRamo, updateRamo } from "../services/ramos.service.js";
import { getAllProfesores, getJefeCarreraActual } from "../services/users.service.js";

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
  const [profesores, setProfesores] = useState([]);
  const [profSearch, setProfSearch] = useState('');
  const [showProfList, setShowProfList] = useState(false);
    useEffect(() => {
      // Cargar profesores y jefe de carrera al montar el formulario
      async function fetchProfesoresYJefe() {
        try {
          const profs = await getAllProfesores();
          let lista = profs || [];
          // Obtener jefe de carrera y agregarlo si existe
          try {
            const jefe = await getJefeCarreraActual();
            if (jefe && jefe.user) {
              // Evitar duplicados por rut
              const exists = lista.some(p => (p.user?.rut || p.rut) === jefe.user.rut);
              if (!exists) {
                lista = [...lista, { user: jefe.user, especialidad: 'Jefe de Carrera' }];
              }
            }
          } catch {}
          setProfesores(lista);
        } catch (e) {
          setProfesores([]);
        }
      }
      fetchProfesoresYJefe();
    }, []);
  
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
    if (name === "rutProfesorSearch") {
      setProfSearch(value);
      setShowProfList(true);
      setRamo({ ...ramo, rutProfesor: value });
    } else {
      setRamo({ ...ramo, [name]: value });
    }
  };

  // Filtrar profesores por nombre completo o RUT
  const getProfCoincidencias = () => {
    if (!profSearch.trim()) return [];
    const search = profSearch.trim().toLowerCase();
    return profesores.filter((prof) => {
      const user = prof.user || prof;
      const nombreCompleto = `${user.nombres} ${user.apellidoPaterno} ${user.apellidoMaterno}`.toLowerCase();
      return (
        user.rut.toLowerCase().includes(search) ||
        nombreCompleto.includes(search)
      );
    });
  };

  const handleSelectProf = (prof) => {
    const user = prof.user || prof;
    setRamo({ ...ramo, rutProfesor: user.rut });
    setProfSearch(`${user.nombres} ${user.apellidoPaterno} ${user.apellidoMaterno}`);
    setShowProfList(false);
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
    // Validar formato del código: 6 dígitos
    const codigoRegex = /^[0-9]{6}$/;
    if (!codigoRegex.test(ramo.codigo)) {
      setError('El código debe contener exactamente 6 números');
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
        showSuccessAlert('Éxito', 'Ramo actualizado correctamente');
        // Agregar pequeño delay para asegurar que los datos se procesaron en el backend
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        await createRamo(dataToSend);
        showSuccessAlert('Éxito', 'Ramo creado correctamente');
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
          placeholder="ej: Derecho Romano"
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
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
          placeholder="ej: 620515"
          pattern="[0-9]{6}"
          maxLength="6"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Formato: 6 dígitos numéricos</p>
      </div>

      <div className="relative">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Profesor (buscar por nombre o RUT):
        </label>
        <input
          type="text"
          name="rutProfesorSearch"
          value={profSearch}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: Juan Pérez o 12345678-9"
          autoComplete="off"
          onFocus={() => setShowProfList(true)}
        />
        <input type="hidden" name="rutProfesor" value={ramo.rutProfesor} />
        <p className="text-xs text-gray-500 mt-1">Selecciona un profesor para asignar el RUT</p>
        {showProfList && getProfCoincidencias().length > 0 && (
          <ul className="absolute z-10 bg-white border border-gray-300 rounded-lg w-full mt-1 max-h-48 overflow-y-auto shadow-lg">
            {getProfCoincidencias().map((prof, idx) => {
              const user = prof.user || prof;
              return (
                <li
                  key={user.rut}
                  className="px-4 py-2 cursor-pointer hover:bg-blue-100"
                  onClick={() => handleSelectProf(prof)}
                >
                  <span className="font-mono text-blue-700">{user.rut}</span> — {user.nombres} {user.apellidoPaterno} {user.apellidoMaterno}
                </li>
              );
            })}
          </ul>
        )}
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
