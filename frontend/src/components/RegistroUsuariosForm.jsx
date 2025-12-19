import { useState } from "react";
import { createAdmin, createProfesor, createAlumno } from "../services/users.service.js";

export default function RegistroUsuariosForm({ onSaved }) {
  const [tipo, setTipo] = useState("profesor");
  const [error, setError] = useState('');
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
      setError('El RUT no es válido. Verifica el dígito verificador');
      return false;
    }
    if (!formData.email.trim()) {
      setError('El email es obligatorio');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('El email no es válido');
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
    const formDataConRutFormateado = {
      ...formData,
      rut: rutFormateado
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
      setError('El RUT no es válido. Verifica el dígito verificador');
      return;
    }
    if (!formDataConRutFormateado.email.trim()) {
      setError('El email es obligatorio');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDataConRutFormateado.email)) {
      setError('El email no es válido');
      return;
    }
    if (!formDataConRutFormateado.password.trim()) {
      setError('La contraseña es obligatoria');
      return;
    }
    if (formDataConRutFormateado.password.length < 6) {
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
      // Preparar datos específicos según el tipo de usuario
      let dataToSend = {
        nombres: formDataConRutFormateado.nombres,
        apellidoPaterno: formDataConRutFormateado.apellidoPaterno,
        apellidoMaterno: formDataConRutFormateado.apellidoMaterno,
        rut: formDataConRutFormateado.rut,
        email: formDataConRutFormateado.email,
        password: formDataConRutFormateado.password,
        telefono: formDataConRutFormateado.telefono
      };

      if (tipo === "admin") {
        await createAdmin(dataToSend);
      } else if (tipo === "profesor") {
        await createProfesor({ ...dataToSend, especialidad: formDataConRutFormateado.especialidad });
      } else if (tipo === "alumno") {
        await createAlumno({ ...dataToSend, generacion: formDataConRutFormateado.generacion });
      }

      alert(`${tipo.charAt(0).toUpperCase() + tipo.slice(1)} creado correctamente`);
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
      onSaved();
    } catch (error) {
      setError(error.message || `Error al crear ${tipo}`);
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-gray-50 shadow-md space-y-4">
      <h2 className="text-2xl font-bold text-gray-800">Crear Nuevo Usuario</h2>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Usuario:</label>
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="admin">Administrador</option>
          <option value="profesor">Profesor</option>
          <option value="alumno">Alumno</option>
        </select>
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
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="12345678-9"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Acepta: 12345678-9, 12.345.678-9 o 123456789</p>
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
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Teléfono:</label>
          <input
            type="tel"
            name="telefono"
            value={formData.telefono}
            onChange={(e) => {
              const valor = e.target.value;
              const formateado = formatTelefono(valor);
              setFormData({ ...formData, telefono: formateado });
            }}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
            placeholder="+56912345678"
            required
          />
          <p className="text-xs text-gray-500 mt-1">Formato: +56912345678</p>
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

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-400 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-300"
      >
        {loading ? 'Creando...' : `Crear ${tipo.charAt(0).toUpperCase() + tipo.slice(1)}`}
      </button>
    </form>
  );
}
