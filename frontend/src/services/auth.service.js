import axios from './root.service.js';
import cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

export async function login(dataUser) {
    try {
        const { email, password } = dataUser;

        const response = await axios.post('/auth/login', {
            email,
            password
        });

        const { token, user } = response.data.data;

        // 🟢 AGREGADO: para ver qué trae exactamente el backend
        console.log("🔍 Usuario recibido desde el backend:", user);

        cookies.set('jwt-auth', token, { path: '/' });
        sessionStorage.setItem('usuario', JSON.stringify(user));

        return response.data;

    } catch (error) {
        return error.response?.data || { message: 'Error al conectar con el servidor' };
    }
}

export async function register(data) {
    try {
        const { email, password } = data;
        const response = await axios.post('/auth/register', {
            email,
            password
        });
        return response.data;
    } catch (error) {
        return error.response?.data || { message: 'Error al conectar con el servidor' };
    }
}

export async function logout() {
    try {
        await axios.post('/auth/logout');
        sessionStorage.removeItem('usuario');
        cookies.remove('jwt-auth');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        // Aún así removemos los tokens locales aunque falle la petición al servidor
        sessionStorage.removeItem('usuario');
        cookies.remove('jwt-auth');
    }
}
