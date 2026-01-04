import axios from './root.service.js';

export async function getProfile() {
    try {
        const response = await axios.get('/profile/private');
        return response.data;
    } catch (error) {
        return error.response?.data || { message: 'Error al obtener perfil' };
    }
}

export async function updateProfile(data) {
    try {
        const response = await axios.patch('/profile/private', data);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Error al actualizar perfil' };
    }
}
