import {
    obtenerNotificacionesPorUsuario,
    marcarNotificacionComoLeida,
} from "../services/notificacion.service.js"
import { handleErrorClient, handleErrorServer, handleSuccess } from "../Handlers/responseHandlers.js";

export const getNotificaciones = async (req, res) =>{
    try {
        const notificaciones = await obtenerNotificacionesPorUsuario(req.user.id);
        return handleSuccess(res, 200, "notificaciones obtenidas correctamente",notificaciones);

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