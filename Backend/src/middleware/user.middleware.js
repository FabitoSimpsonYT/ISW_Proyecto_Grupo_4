import { findUserByRut } from "../services/user.service.js";
import { handleErrorClient } from "../Handlers/responseHandlers.js";

export async function loadUserMiddleware(req, res, next) {
    try {
        const userRut = req.user.sub;
        const user = await findUserByRut(userRut);
        
        if (!user) {
            return handleErrorClient(res, 401, "Usuario no encontrado");
        }

        req.fullUser = user;
        next();
    } catch (error) {
        return handleErrorClient(res, 500, "Error al cargar datos del usuario", error.message);
    }
}
