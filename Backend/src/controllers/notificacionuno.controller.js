import {
    obtenerNotificacionesPorUsuario,
    marcarNotificacionComoLeida,
    obtenerNotificacionesSinLeer,
    obtenerNotificacionesPorTipo,
    marcarTodoComoLeido,
} from "../services/notificacionuno.service.js"
import { handleErrorClient, handleErrorServer, handleSuccess } from "../Handlers/responseHandlers.js";

export const getNotificaciones = async (req, res) =>{
    try {
        const notificaciones = await obtenerNotificacionesPorUsuario(req.user.id);
        if (!notificaciones || notificaciones.length === 0) {
            return handleSuccess(res, 200, "No hay notificaciones", []);
        }

        return handleSuccess(res, 200, "notificaciones obtenidas correctamente", notificaciones);

    } catch (error) {
        return handleErrorServer(res, 500, "error al obtener las nofiticaicones", error);
        
    }
};

export const markNotificacionLeida = async(req, res) =>{
    try {
    const notificacion = await marcarNotificacionComoLeida(req.params.id);
        if(!notificacion)
            return handleErrorClient(res, 404,"notificacion no encontrada");

        return handleSuccess(res, 200, "notificacion marcada como leida", notificacion);
    } catch (error) {
        return  handleErrorServer (res, 500, "error al marcar notificaciones", error );
    }
};

/**
 * Obtiene notificaciones sin leer del usuario actual
 */
export const getNotificacionesSinLeer = async (req, res) => {
    try {
        const notificaciones = await obtenerNotificacionesSinLeer(req.user.id);
        return handleSuccess(res, 200, "notificaciones sin leer obtenidas", notificaciones);
    } catch (error) {
        return handleErrorServer(res, 500, "error al obtener notificaciones sin leer", error);
    }
};

/**
 * Obtiene notificaciones filtradas por tipo
 */
export const getNotificacionesPorTipo = async (req, res) => {
    try {
        const { tipo } = req.params;
        const notificaciones = await obtenerNotificacionesPorTipo(req.user.id, tipo);
        return handleSuccess(res, 200, `notificaciones de tipo ${tipo} obtenidas`, notificaciones);
    } catch (error) {
        return handleErrorServer(res, 500, "error al obtener notificaciones por tipo", error);
    }
};

/**
 * Marca todas las notificaciones como leídas
 */
export const markAllAsRead = async (req, res) => {
    try {
        const cantidad = await marcarTodoComoLeido(req.user.id);
        return handleSuccess(res, 200, `${cantidad} notificaciones marcadas como leídas`, { affected: cantidad });
    } catch (error) {
        return handleErrorServer(res, 500, "error al marcar notificaciones como leídas", error);
    }
};