import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';

export default function MiPerfil() {
  const { user } = useAuth();
  const { isNavbarOpen } = useNavbar();

  // Obtener el usuario del localStorage si no está en el contexto
  const userData = user || JSON.parse(localStorage.getItem('user') || '{}');

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? 'ml-64' : 'ml-0'} p-8`}>
      <div className="max-w-4xl mx-auto">
        {/* Encabezado */}
        <div className="bg-gradient-to-r from-[#0E2C66] to-[#1a3f8f] text-white px-8 py-6 rounded-t-2xl shadow-lg">
          <h1 className="text-3xl font-bold">Mi Perfil</h1>
          <p className="text-white/80 mt-1">Información de tu cuenta</p>
        </div>

        {/* Card de información */}
        <div className="bg-white rounded-b-2xl shadow-xl p-8">
          <div className="grid gap-6">
            {/* Nombre completo */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Nombre Completo
              </label>
              <p className="text-xl font-medium text-[#0E2C66]">
                {userData.nombres} {userData.apellidoPaterno} {userData.apellidoMaterno}
              </p>
            </div>

            {/* RUT */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                RUT
              </label>
              <p className="text-xl font-medium text-[#0E2C66]">
                {userData.rut || 'No disponible'}
              </p>
            </div>

            {/* Email */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Correo Electrónico
              </label>
              <p className="text-xl font-medium text-[#0E2C66]">
                {userData.email}
              </p>
            </div>

            {/* Rol */}
            <div className="pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Rol
              </label>
              <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                userData.role === 'admin' ? 'bg-red-100 text-red-700' :
                userData.role === 'profesor' ? 'bg-blue-100 text-blue-700' :
                'bg-green-100 text-green-700'
              }`}>
                {userData.role === 'admin' ? '👔 Administrador' :
                 userData.role === 'profesor' ? '👨‍🏫 Profesor' :
                 '👨‍🎓 Alumno'}
              </span>
            </div>

            {/* Información adicional según el rol */}
            {userData.role === 'alumno' && userData.generacion && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Generación
                </label>
                <p className="text-lg font-medium text-[#0E2C66]">
                  {userData.generacion}
                </p>
              </div>
            )}

            {userData.role === 'profesor' && userData.especialidad && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Especialidad
                </label>
                <p className="text-lg font-medium text-[#0E2C66]">
                  {userData.especialidad}
                </p>
              </div>
            )}

            {/* Teléfono si está disponible */}
            {userData.telefono && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Teléfono
                </label>
                <p className="text-lg font-medium text-[#0E2C66]">
                  {userData.telefono}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
