import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginService } from '../services/auth.service.js';
import { useAuth } from '../context/AuthContext.jsx';

const Login = () => {
    const navigate = useNavigate();
    const { setUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await loginService({ email, password });
            if (res && res.status === 'Success') {
                // Actualizar el contexto con los datos del usuario
                setUser(res.data.user);
                // Redirigir a Home.jsx
                navigate('/home');
            } else {
                const msg = res?.message || 'Error en el login';
                alert(msg);
            }
        } catch (err) {
            console.error('Login error', err);
            alert('Error al conectar con el servidor');
        }
    };    return (
        <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] via-[#2c4a6b] to-[#1e3a5f] flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card principal */}
                <div className="bg-white/10 backdrop-blur-lg rounded-3xl shadow-2xl p-8 border border-white/20">
                    {/* Logo/Icono */}
                    <div className="flex justify-center mb-6">
                        <div className="bg-white/20 backdrop-blur-sm p-6 rounded-2xl">
                            <svg className="w-20 h-20 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                    </div>

                    {/* Título y subtítulo */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-white mb-2">
                        GESTION DE EVALUACIONES
                        </h1>
                        <p className="text-white/70 text-sm">
                            Ingresa tus credenciales para continuar
                        </p>
                    </div>

                    <form className="space-y-5" onSubmit={handleSubmit}>
                        {/* Input de Correo */}
                        <div className="space-y-2">
                            <label className="block text-white/90 text-sm font-medium ml-1">
                                Correo Electrónico
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a5f7f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                </svg>
                                <input
                                    type="email"
                                    id="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="usuario@ejemplo.com"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/95 text-[#1e3a5f] placeholder-[#6b7f9f] rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Input de Contraseña */}
                        <div className="space-y-2">
                            <label className="block text-white/90 text-sm font-medium ml-1">
                                Contraseña
                            </label>
                            <div className="relative">
                                <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#4a5f7f]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                                <input
                                    type="password"
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full pl-12 pr-4 py-4 bg-white/95 text-[#1e3a5f] placeholder-[#6b7f9f] rounded-xl focus:outline-none focus:ring-2 focus:ring-white/50 transition-all"
                                />
                            </div>
                        </div>

                        {/* Botón de Ingresar */}
                        <button 
                            type="submit" 
                            className="w-full bg-white hover:bg-white/90 text-[#1e3a5f] font-bold py-4 px-8 rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg mt-6"
                        >
                            Iniciar Sesión
                        </button>
                    </form>
                </div>

                {/* Pie de página */}
                <p className="text-center text-white/60 text-sm mt-6">
                    © 2025 Sistema de Gestión Académica
                </p>
            </div>
        </div>
    );
}

export default Login;
