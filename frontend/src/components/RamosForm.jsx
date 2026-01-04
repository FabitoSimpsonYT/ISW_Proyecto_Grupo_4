import { useState, useEffect } from "react";
import { showSuccessAlert } from "@/utils/alertUtils";
import { createRamo, updateRamo } from "../services/ramos.service.js";
import { getAllProfesores, getJefeCarreraActual } from "../services/users.service.js";

export default function RamosForm({ ramoEdit, onSaved }) {
  const initialState = {
    nombre: '',
    codigo: '',
    anio: '',
    periodo: '',
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
      let anioEdit = '';
      let periodoEdit = '';
      const rutAsignado = ramoEdit.rutProfesor || ramoEdit.profesor?.user?.rut || ramoEdit.profesor?.rut || '';
      if (ramoEdit.codigo) {
        const partesCodigo = ramoEdit.codigo.split('-');
        if (partesCodigo.length >= 3) {
          anioEdit = partesCodigo[1] || '';
          periodoEdit = partesCodigo[2] || '';
        }
      }
      setRamo({
        nombre: ramoEdit.nombre || '',
        codigo: (ramoEdit.codigo || '').split('-')[0] || '',
        anio: anioEdit,
        periodo: periodoEdit,
        rutProfesor: rutAsignado,
        originalCodigo: ramoEdit.codigo || null // Guardar el código original
      });
      
      // Mostrar el profesor actual aunque la lista aún no cargue; luego intentar resolver el nombre
      if (rutAsignado && rutAsignado.trim() !== '') {
        setProfSearch(rutAsignado);
        if (profesores.length > 0) {
          const profesorAsignado = profesores.find(prof => {
            const user = prof.user || prof;
            return user.rut === rutAsignado;
          });
          if (profesorAsignado) {
            const user = profesorAsignado.user || profesorAsignado;
            setProfSearch(`${user.nombres} ${user.apellidoPaterno} ${user.apellidoMaterno}`);
          }
        }
      } else {
        setProfSearch('');
      }
    } else {
      setRamo(initialState);
      setProfSearch('');
    }
  }, [ramoEdit, profesores]);
  
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
    // 1. Nombre del ramo
    if (!ramo.nombre.trim()) {
      setError('El nombre del ramo es obligatorio');
      return false;
    }
    if (ramo.nombre.length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }
    // 2. Código del ramo (6 dígitos)
    if (!ramo.codigo.trim()) {
      setError('El código del ramo es obligatorio');
      return false;
    }
    if (!/^\d{6}$/.test(ramo.codigo.trim())) {
      setError('El código debe tener 6 dígitos numéricos (ej: 620515)');
      return false;
    }
    // 3. Año
    if (!/^\d{4}$/.test(String(ramo.anio).trim())) {
      setError('El año debe ser un número de 4 dígitos (ej: 2025)');
      return false;
    }
    // 4. Periodo
    if (!(ramo.periodo === '1' || ramo.periodo === '2' || ramo.periodo === 1 || ramo.periodo === 2)) {
      setError('El periodo debe ser 1 o 2');
      return false;
    }
    // 5. Profesor (opcional): si se ingresó, debe ser de la lista
    const rutProfesorTrim = ramo.rutProfesor.trim();
    if (rutProfesorTrim) {
      const existe = profesores.some((prof) => {
        const user = prof.user || prof;
        return user.rut === rutProfesorTrim;
      });
      if (!existe) {
        setError('Debes seleccionar un profesor válido de la lista');
        return false;
      }
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
      // Construir código completo con año y periodo
      const codigoCompleto = `${ramo.codigo}-${ramo.anio}-${ramo.periodo}`;
      
      // Enviar los campos por separado
      const dataToSend = {
        nombre: ramo.nombre,
        codigo: codigoCompleto,
        anio: parseInt(ramo.anio, 10),
        periodo: parseInt(ramo.periodo, 10)
      };
      
      console.log('📤 Enviando ramo al backend:', dataToSend);
      
      if (ramo.rutProfesor.trim()) {
        dataToSend.rutProfesor = ramo.rutProfesor;
      }

      // Si originalCodigo existe, es una actualización
      if (ramo.originalCodigo) {
        await updateRamo(ramo.originalCodigo, dataToSend);
        showSuccessAlert('Éxito', 'Ramo actualizado correctamente');
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

  // Opciones de año válidas (año actual y anterior). Si el ramo editado tiene otro año válido, lo incluimos.
  const currentYear = new Date().getFullYear();
  const yearOptions = [currentYear - 1, currentYear];
  const anioNumber = parseInt(ramo.anio, 10);
  if (!Number.isNaN(anioNumber) && !yearOptions.includes(anioNumber)) {
    yearOptions.unshift(anioNumber);
  }

  // Periodos permitidos según año seleccionado y fecha actual
  const today = new Date();
  const isAfterJulyFirst = today.getMonth() > 6 || (today.getMonth() === 6 && today.getDate() >= 1);
  const isCurrentYearSelected = anioNumber === currentYear;
  const periodOptions = isCurrentYearSelected && !isAfterJulyFirst ? ['1'] : ['1', '2'];

  // Si el periodo seleccionado ya no es válido, limpiarlo
  useEffect(() => {
    if (ramo.periodo && !periodOptions.includes(String(ramo.periodo))) {
      setRamo(prev => ({ ...prev, periodo: '' }));
    }
  }, [ramo.anio, periodOptions.join('-')]);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
          className={`w-full px-4 py-2 border border-gray-300 rounded-lg font-mono ${
            ramo.originalCodigo 
              ? 'bg-gray-100 cursor-not-allowed' 
              : 'focus:outline-none focus:ring-2 focus:ring-blue-500'
          }`}
          placeholder="ej: 620515"
          maxLength="6"
          disabled={!!ramo.originalCodigo}
          required
        />
        <p className="text-xs text-gray-500 mt-1">6 dígitos numéricos</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Año:
          </label>
          <select
            name="anio"
            value={ramo.anio}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            required
          >
            <option value="">Seleccionar...</option>
            {yearOptions.map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Periodo:
          </label>
          <select
            name="periodo"
            value={ramo.periodo}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Seleccionar...</option>
            {periodOptions.map(p => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
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
