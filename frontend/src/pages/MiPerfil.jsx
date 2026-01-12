import { useAuth } from '../context/AuthContext';
import { useNavbar } from '../context/NavbarContext';
import { useState, useEffect } from 'react';
import { updateProfile } from '../services/profile.service.js';

export default function MiPerfil() {
  const { user, setUser } = useAuth();
  const { isNavbarOpen } = useNavbar();
  const [profile, setProfile] = useState(user || JSON.parse(localStorage.getItem('user') || '{}'));
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [phoneForm, setPhoneForm] = useState({ telefono: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [loading, setLoading] = useState(false);
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  useEffect(() => {
    if (user) setProfile(user);
  }, [user]);

  const persistUser = (updated) => {
    setProfile(updated);
    try { localStorage.setItem('user', JSON.stringify(updated)); } catch (e) {}
    if (setUser) {
      try { setUser(updated); } catch (e) {}
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    if (!pwdForm.current || !pwdForm.next || !pwdForm.confirm) {
      setStatus({ type: 'error', message: 'Completa todos los campos de contraseña.' });
      return false;
    }
    if (pwdForm.next !== pwdForm.confirm) {
      setStatus({ type: 'error', message: 'Las contraseñas nuevas no coinciden.' });
      return false;
    }
    if (pwdForm.next.length < 6) {
      setStatus({ type: 'error', message: 'La nueva contraseña debe tener al menos 6 caracteres.' });
      return false;
    }
    try {
      setLoading(true);
      const resp = await updateProfile({ password: pwdForm.next, currentPassword: pwdForm.current });
      if (resp?.data?.user) {
        persistUser(resp.data.user);
      }
      setStatus({ type: 'success', message: 'Contraseña actualizada.' });
      setPwdForm({ current: '', next: '', confirm: '' });
      return true;
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'No se pudo actualizar la contraseña.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', message: '' });
    if (!phoneForm.telefono) {
      setStatus({ type: 'error', message: 'Ingresa un número de teléfono.' });
      return false;
    }
    try {
      setLoading(true);
      const resp = await updateProfile({ telefono: phoneForm.telefono });
      if (resp?.data?.user) {
        persistUser(resp.data.user);
      }
      setStatus({ type: 'success', message: 'Teléfono actualizado.' });
      setPhoneForm({ telefono: '' });
      return true;
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'No se pudo actualizar el teléfono.' });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-[#e9f7fb] to-[#d5e8f6] transition-all duration-300 ${isNavbarOpen ? 'ml-0 md:ml-64' : 'ml-0'} p-4 md:p-8`}>
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
                {profile.nombres} {profile.apellidoPaterno} {profile.apellidoMaterno}
              </p>
            </div>

            {/* RUT */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                RUT
              </label>
              <p className="text-xl font-medium text-[#0E2C66]">
                {profile.rut || 'No disponible'}
              </p>
            </div>

            {/* Email */}
            <div className="border-b border-gray-200 pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Correo Electrónico
              </label>
              <p className="text-xl font-medium text-[#0E2C66]">
                {profile.email}
              </p>
            </div>

            {/* Rol */}
            <div className="pb-4">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Rol
              </label>
              <span className={`inline-block px-6 py-2 rounded-full text-lg font-bold ${
                profile.role === 'admin' ? 'bg-red-100 text-red-700' :
                profile.role === 'profesor' ? 'bg-blue-100 text-blue-700' :
                profile.role === 'jefecarrera' ? 'bg-purple-100 text-purple-700' :
                'bg-green-100 text-green-700'
              }`}>
                {profile.role === 'admin' ? '👔 Administrador' :
                 profile.role === 'profesor' ? '👨‍🏫 Profesor' :
                 profile.role === 'jefecarrera' ? '📋 Jefe de Carrera' :
                 '👨‍🎓 Alumno'}
              </span>
            </div>

            {/* Información adicional según el rol */}
            {profile.role === 'alumno' && profile.generacion && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Generación
                </label>
                <p className="text-lg font-medium text-[#0E2C66]">
                  {profile.generacion}
                </p>
              </div>
            )}

            {profile.role === 'profesor' && profile.especialidad && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Especialidad
                </label>
                <p className="text-lg font-medium text-[#0E2C66]">
                  {profile.especialidad}
                </p>
              </div>
            )}

            {/* Teléfono si está disponible */}
            {profile.telefono && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Teléfono
                </label>
                <p className="text-lg font-medium text-[#0E2C66]">
                  {profile.telefono}
                </p>
              </div>
            )}

            {/* Acciones */}
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <button
                className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-left hover:border-blue-300 transition"
                onClick={() => { setShowPwdModal(true); setStatus({ type: '', message: '' }); }}
              >
                <h3 className="font-semibold text-[#0E2C66] mb-2">Cambiar contraseña</h3>
                <p className="text-sm text-gray-600">Solicita la contraseña actual y la nueva.</p>
              </button>

              <button
                className="p-4 rounded-xl border border-gray-200 bg-gray-50 text-left hover:border-blue-300 transition"
                onClick={() => { setShowPhoneModal(true); setStatus({ type: '', message: '' }); setPhoneForm({ telefono: profile.telefono || '' }); }}
              >
                <h3 className="font-semibold text-[#0E2C66] mb-2">Actualizar teléfono</h3>
                <p className="text-sm text-gray-600">Modifica tu número de contacto.</p>
              </button>
            </div>

            {status.message && (
              <div className={`mt-3 text-sm font-semibold ${status.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {status.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal cambiar contraseña */}
      {showPwdModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPwdModal(false)}
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold text-[#0E2C66] mb-4">Cambiar contraseña</h3>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                const ok = await handlePasswordSubmit(e);
                if (ok) setShowPwdModal(false);
              }}
            >
              <div>
                <label className="text-sm text-gray-600 block mb-1">Contraseña actual</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={pwdForm.current}
                  onChange={(e) => setPwdForm({ ...pwdForm, current: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nueva contraseña</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={pwdForm.next}
                  onChange={(e) => setPwdForm({ ...pwdForm, next: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Confirmar nueva contraseña</label>
                <input
                  type="password"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={pwdForm.confirm}
                  onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0E2C66] text-white rounded-lg py-2 font-semibold hover:bg-[#143a80] transition disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Actualizar contraseña'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal actualizar teléfono */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
              onClick={() => setShowPhoneModal(false)}
            >
              ✕
            </button>
            <h3 className="text-xl font-semibold text-[#0E2C66] mb-4">Actualizar teléfono</h3>
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                const ok = await handlePhoneSubmit(e);
                if (ok) setShowPhoneModal(false);
              }}
            >
              <div>
                <label className="text-sm text-gray-600 block mb-1">Nuevo teléfono</label>
                <input
                  type="text"
                  className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
                  placeholder="Ej: +56912345678"
                  value={phoneForm.telefono}
                  onChange={(e) => setPhoneForm({ telefono: e.target.value })}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0E2C66] text-white rounded-lg py-2 font-semibold hover:bg-[#143a80] transition disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Actualizar teléfono'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
