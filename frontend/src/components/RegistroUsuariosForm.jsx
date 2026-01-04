import { useState, useEffect } from "react";
import { showSuccessAlert } from "@/utils/alertUtils";
// Validación de correo para profesores/administradores y alumnos
function validateEmail(email, tipo) {
  // Profesores y administradores: deben terminar en @ubiobio.cl
  if (tipo === "profesor" || tipo === "admin" || tipo === "jefecarrera") {
    return /^[^\s@]+@ubiobio\.cl$/.test(email);
  }
  // Alumnos: nombre.apellidoAAMM@alumnos.ubiobio.cl
  if (tipo === "alumno") {
    return /^[a-zA-Z]+\.[a-zA-Z]+\d{4}@alumnos\.ubiobio\.cl$/.test(email);
  }
  return false;
}
import { createAdmin, createProfesor, createAlumno, updateAdmin, updateProfesor, updateAlumno } from "../services/users.service.js";

export default function RegistroUsuariosForm({ onSaved, usuarioEdit }) {
  const [tipo, setTipo] = useState("profesor");
  // Normaliza valores de rol que pueden venir como etiquetas en español
  const normalizeRole = (role) => {
    if (!role) return 'profesor';
    const r = String(role).toLowerCase();
    if (r.includes('admin')) return 'admin';
    if (r.includes('profesor')) return 'profesor';
    if (r.includes('alum')) return 'alumno';
    return r;
  };
    const [error, setError] = useState('');
    const [telefonoError, setTelefonoError] = useState('');
    const [rutError, setRutError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombres: '',
    apellidoPaterno: '',
    apellidoMaterno: '',
    rut: '',
    email: '',
    password: '',
    telefono: '',
    especialidad: '',
    generacion: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Cargar datos del usuario a editar
  useEffect(() => {
    if (usuarioEdit) {
      // Los datos pueden venir directamente en usuarioEdit o dentro de usuarioEdit.user
      const userData = usuarioEdit.user || usuarioEdit;
      // Normalizar rol para que coincida con las claves esperadas por la validación
      // Priorizar `usuarioEdit.tipo` si viene presente (ej. 'jefecarrera')
      setTipo(normalizeRole(usuarioEdit.tipo || userData.role || 'profesor'));
      setFormData({
        nombres: userData.nombres || '',
        apellidoPaterno: userData.apellidoPaterno || '',
        apellidoMaterno: userData.apellidoMaterno || '',
        rut: userData.rut || '',
        email: userData.email || '',
        password: '', // No mostrar contraseña
        telefono: userData.telefono || '',
        especialidad: usuarioEdit.especialidad || '',
        generacion: usuarioEdit.generacion || ''
      });
    }
  }, [usuarioEdit]);

  const validateRut = (rut) => {
    // Validar formato básico: debe tener un guión
    if (!rut.includes('-')) {
      return false;
    }

    const [numero, dv] = rut.split('-');
    
    // Validar que el número sea solo dígitos
    if (!/^\d{7,8}$/.test(numero)) {
      return false;
    }

    // Validar que no sea RUT de empresa (> 50 millones)
    if (parseInt(numero) > 50000000) {
      return false;
    }

    // Validar dígito verificador
    let suma = 0;
    let multiplicador = 2;
    
    for (let i = numero.length - 1; i >= 0; i--) {
      suma += parseInt(numero[i]) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    
    const resto = suma % 11;
    const dvEsperado = 11 - resto;
    
    const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
    
    return dvCalculado.toUpperCase() === dv.toUpperCase();
  };

  const formatRut = (valor) => {
    // Eliminar todos los puntos y espacios
    let limpio = valor.replace(/\./g, '').replace(/\s/g, '').toUpperCase();
    
    // Si no tiene guión, intentar agregarlo
    if (!limpio.includes('-')) {
      // Tomar los últimos 1-2 caracteres como dígito verificador
      const dv = limpio.slice(-1);
      const numero = limpio.slice(0, -1);
      return numero + '-' + dv;
    }
    
    return limpio;
  };

  const validateTelefono = (telefono) => {
    const telefonoRegex = /^(\+569\d{8}|\+5641\d{7})$/;
    return telefonoRegex.test(telefono);
  };

  const formatTelefono = (valor) => {
    // Eliminar caracteres no numéricos
    const limpio = valor.replace(/\D/g, '');
    
    // Si comienza con 56, mantener el +56
    if (limpio.startsWith('56')) {
      const resto = limpio.substring(2);
      return '+56' + resto;
    }
    
    // Si comienza con 9 (celular), agregar +569
    if (limpio.startsWith('9')) {
      return '+569' + limpio;
    }
    
    // Si comienza con otro número regional
    if (limpio.startsWith('4') || limpio.startsWith('2')) {
      return '+5641' + limpio.substring(1);
    }
    
    return '+569' + limpio;
  };

  const validateForm = () => {
    if (!formData.nombres.trim()) {
      setError('El nombre es obligatorio');
      return false;
    }
    if (!formData.apellidoPaterno.trim()) {
      setError('El apellido paterno es obligatorio');
      return false;
    }
    if (!formData.apellidoMaterno.trim()) {
      setError('El apellido materno es obligatorio');
      return false;
    }
    if (!formData.rut.trim()) {
      setError('El RUT es obligatorio');
      return false;
    }
    if (!validateRut(formData.rut)) {
      // Extraer el número para verificar si es de empresa
      const [numero] = formData.rut.split('-');
      if (parseInt(numero) > 50000000) {
        setError('No se pueden registrar RUTs de empresa. Debes usar un RUT personal');
      } else {
        setError('El RUT no es válido. Verifica el dígito verificador');
      }
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return false;
    }
    if (!validateEmail(formData.email, tipo)) {
      if (tipo === "profesor" || tipo === "admin") {
        setError('El correo debe terminar en @ubiobio.cl');
      } else if (tipo === "alumno") {
        setError('El correo de alumno debe tener el formato nombre.apellidoAAMM@alumnos.ubiobio.cl');
      } else {
        setError('El correo no es válido');
      }
      return false;
    }
    if (!formData.password.trim()) {
      setError('La contraseña es obligatoria');
      return false;
    }
    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    if (!formData.telefono.trim()) {
      setError('El teléfono es obligatorio');
      return false;
    }
    if (!validateTelefono(formData.telefono)) {
      setError('El teléfono debe tener el formato +569XXXXXXXX (ejemplo: +56912345678)');
      return false;
    }
    if (tipo === "profesor" && !formData.especialidad.trim()) {
      setError('La especialidad es obligatoria para profesores');
      return false;
    }
    if (tipo === "alumno" && !formData.generacion.trim()) {
      setError('La generación es obligatoria para alumnos');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Formatear RUT antes de validar
    const rutFormateado = formatRut(formData.rut);
    // Formatear nombres, correo y teléfono
    // Capitaliza solo la primera letra de cada palabra si está después de un espacio
    const capitalizeWords = (str) =>
      str.replace(/(^|\s)([a-záéíóúüñ])/gi, (match, space, letter) =>
        space + letter.toUpperCase()
      ).replace(/(?<=\s)([A-ZÁÉÍÓÚÜÑ])([A-ZÁÉÍÓÚÜÑ]+)/g, (m, first, rest) => first + rest.toLowerCase());
    const telefonoFormateado = formatTelefono(formData.telefono);
    const formDataConRutFormateado = {
      ...formData,
      rut: rutFormateado,
      nombres: capitalizeWords(formData.nombres.trim()),
      apellidoPaterno: capitalizeWords(formData.apellidoPaterno.trim()),
      apellidoMaterno: capitalizeWords(formData.apellidoMaterno.trim()),
      email: formData.email.trim().toLowerCase(),
      telefono: telefonoFormateado
    };

    // Validar con el RUT formateado
    if (!formDataConRutFormateado.nombres.trim()) {
      setError('El nombre es obligatorio');
      return;
    }
    if (!formDataConRutFormateado.apellidoPaterno.trim()) {
      setError('El apellido paterno es obligatorio');
      return;
    }
    if (!formDataConRutFormateado.apellidoMaterno.trim()) {
      setError('El apellido materno es obligatorio');
      return;
    }
    if (!formDataConRutFormateado.rut.trim()) {
      setError('El RUT es obligatorio');
      return;
    }
    if (!validateRut(formDataConRutFormateado.rut)) {
      // Extraer el número para verificar si es de empresa
      const [numero] = formDataConRutFormateado.rut.split('-');
      if (parseInt(numero) > 50000000) {
        setError('El RUT no debe ser superior a 50 millones. Verifica que sea un RUT personal');
      } else {
        setError('El RUT no es válido. Verifica el dígito verificador');
      }
      return;
    }
    if (!formDataConRutFormateado.email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    if (!validateEmail(formDataConRutFormateado.email, tipo)) {
      if (tipo === "profesor" || tipo === "admin") {
        setError('El correo debe terminar en @ubiobio.cl');
      } else if (tipo === "alumno") {
        setError('El correo de alumno debe tener el formato nombre.apellidoAAMM@alumnos.ubiobio.cl');
      } else {
        setError('El correo no es válido');
      }
      return;
    }
        setTelefonoError('');
    if (!formDataConRutFormateado.password.trim() && !usuarioEdit) {
      setError('La contraseña es obligatoria');
      return;
    }
    if (formDataConRutFormateado.password && formDataConRutFormateado.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (!formDataConRutFormateado.telefono.trim()) {
      setError('El teléfono es obligatorio');
      return;
    }
    if (!validateTelefono(formDataConRutFormateado.telefono)) {
      setError('El teléfono debe tener el formato +569XXXXXXXX (ejemplo: +56912345678)');
      return;
    }
    if (tipo === "profesor" && !formDataConRutFormateado.especialidad.trim()) {
      setError('La especialidad es obligatoria para profesores');
      return;
    }
    if (tipo === "alumno" && !formDataConRutFormateado.generacion.trim()) {
      setError('La generación es obligatoria para alumnos');
      return;
    }

    setLoading(true);
    try {
      // Formatear teléfono
      const telefonoFormateado = formatTelefono(formDataConRutFormateado.telefono);
      
      // Preparar datos específicos según el tipo de usuario
      let dataToSend = {
        nombres: formDataConRutFormateado.nombres,
        apellidoPaterno: formDataConRutFormateado.apellidoPaterno,
        apellidoMaterno: formDataConRutFormateado.apellidoMaterno,
        // No enviar RUT en actualizaciones (backend no lo permite en el schema)
        ...(usuarioEdit ? {} : { rut: formDataConRutFormateado.rut }),
        email: formDataConRutFormateado.email,
        telefono: telefonoFormateado
      };
      
      // Solo agregar contraseña si se proporciona
      if (formDataConRutFormateado.password.trim()) {
        dataToSend.password = formDataConRutFormateado.password;
      }

      if (usuarioEdit) {
        // Modo edición - obtener el ID correcto
        const userId = usuarioEdit.user?.id || usuarioEdit.id;
        
          if (tipo === "admin") {
            await updateAdmin(userId, dataToSend);
          } else if (tipo === "profesor" || tipo === "jefecarrera") {
            // Jefe de carrera se modela como profesor en el backend
            // Preferir el valor enviado en el formulario, si está vacío usar el valor existente en usuarioEdit
            const especialVal = (formDataConRutFormateado.especialidad && formDataConRutFormateado.especialidad.trim()) || usuarioEdit?.especialidad;
            if (especialVal) dataToSend.especialidad = especialVal;
            await updateProfesor(userId, dataToSend);
          } else if (tipo === "alumno") {
            const genVal = (formDataConRutFormateado.generacion && formDataConRutFormateado.generacion.trim()) || usuarioEdit?.generacion;
            if (genVal) dataToSend.generacion = genVal;
            await updateAlumno(userId, dataToSend);
          }
        showSuccessAlert('Éxito', `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} actualizado correctamente`);
      } else {
        // Modo creación
        dataToSend.password = formDataConRutFormateado.password;
        if (tipo === "admin") {
          await createAdmin(dataToSend);
        } else if (tipo === "profesor") {
          await createProfesor({ ...dataToSend, especialidad: formDataConRutFormateado.especialidad });
        } else if (tipo === "alumno") {
          await createAlumno({ ...dataToSend, generacion: formDataConRutFormateado.generacion });
        }

        showSuccessAlert('Éxito', `${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente`);
      }
      
      if (!usuarioEdit) {
        setFormData({
          nombres: '',
          apellidoPaterno: '',
          apellidoMaterno: '',
          rut: '',
          email: '',
          password: '',
          telefono: '',
          especialidad: '',
          generacion: ''
        });
      }
      onSaved();
    } catch (error) {
      setError(error.message || `Error al crear ${tipo}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">
        {usuarioEdit ? `Editar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}` : 'Crear Nuevo Usuario'}
      </h2>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Usuario:</label>
        <div className="relative">
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            disabled={!!usuarioEdit}
            className={`appearance-none w-full p-3 pr-10 rounded-lg border border-gray-300 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
              usuarioEdit ? 'cursor-not-allowed opacity-70' : 'hover:border-gray-400'
            }`}
          >
            <option value="admin">Administrador</option>
            <option value="profesor">Profesor</option>
            <option value="alumno">Alumno</option>
          </select>

          <div className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 ${usuarioEdit ? 'opacity-60' : ''}`}>
            <svg className="w-5 h-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Nombres:</label>
          <input
            type="text"
            name="nombres"
            value={formData.nombres}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Juan"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido Paterno:</label>
          <input
            type="text"
            name="apellidoPaterno"
            value={formData.apellidoPaterno}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Pérez"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Apellido Materno:</label>
          <input
            type="text"
            name="apellidoMaterno"
            value={formData.apellidoMaterno}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="González"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">RUT:</label>
          <input
            type="text"
            name="rut"
            value={formData.rut}
            onChange={(e) => {
              // Limpiar mensaje general y de RUT cuando el usuario edita
              setError('');
              setRutError('');
              handleChange(e);
            }}
            onBlur={(e) => {
              const formatted = formatRut(e.target.value || '');
              setFormData(prev => ({ ...prev, rut: formatted }));
              if (formatted && !validateRut(formatted)) {
                setRutError('El RUT no es válido. Verifica el dígito verificador');
              } else {
                setRutError('');
              }
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="12345678-9"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Acepta: 12345678-9, 12.345.678-9 o 123456789</p>
          {rutError && (
            <div className="mt-2 text-sm text-red-700 bg-red-100 border border-red-300 px-3 py-2 rounded-lg">
              {rutError}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Email:</label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="usuario@example.com"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {!usuarioEdit && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contraseña:</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••"
              required
            />
            <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
          </div>
        )}
        <div className={!usuarioEdit ? '' : 'col-span-2'}>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={(e) => {
              setFormData({ ...formData, telefono: e.target.value });
            }}
            onBlur={(e) => {
              // Al perder foco, formatear el teléfono. Por defecto se asume celular (+569...) a menos que se especifique explícitamente.
              const formatted = formatTelefono(e.target.value || '');
              setFormData({ ...formData, telefono: formatted });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="+56912345678"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Si no escribes un prefijo explícito, se formatea como celular (+569...)</p>
        </div>
      </div>

      {tipo === "profesor" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Especialidad:</label>
          <input
            type="text"
            name="especialidad"
            value={formData.especialidad}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ej: Derecho Penal"
            required
          />
        </div>
      )}

      {tipo === "alumno" && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Generación:</label>
          <input
            type="text"
            name="generacion"
            value={formData.generacion}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="ej: 2025"
            required
          />
        </div>
      )}


      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {loading ? (usuarioEdit ? 'Actualizando...' : 'Creando...') : (usuarioEdit ? `Actualizar ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}` : `Crear ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`)}
      </button>
    </form>
  );
}
