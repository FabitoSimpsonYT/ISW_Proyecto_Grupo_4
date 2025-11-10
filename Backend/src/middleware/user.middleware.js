import { findUserByRut } from "../services/user.service.js";
import { handleErrorClient } from "../Handlers/responseHandlers.js";

export async function loadUserMiddleware(req, res, next) {
    try {
        // El RUT viene en el campo sub del token JWT
        const userRut = req.user.sub;
        const user = await findUserByRut(userRut);
        
        if (!user) {
            return handleErrorClient(res, 401, "Usuario no encontrado");
        }

        // Añadimos el usuario completo a req.fullUser
        req.fullUser = user;
        next();
    } catch (error) {
        return handleErrorClient(res, 500, "Error al cargar datos del usuario", error.message);
    }
}