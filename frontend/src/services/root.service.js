import axios from 'axios';
import cookies from 'js-cookie';

const API_URL = import.meta.env.VITE_BASE_URL || 'http://localhost:3000/api';

const instance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

instance.interceptors.request.use(
  (config) => {
    const token = cookies.get('jwt-auth', { path: '/' }) || localStorage.getItem('token');
    console.log('🔍 [root.service] Request a:', config.url);
    console.log('🔑 [root.service] Token encontrado:', !!token);
    if(token) {
      console.log('📝 [root.service] Enviando token en header Authorization');
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.log('❌ [root.service] No hay token disponible');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default instance;
