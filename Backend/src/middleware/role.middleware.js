import { UnauthorizedError } from "../Handlers/responseHandlers.js";

export const checkRole = (roles) => {
  return (req, res, next) => {
    const { user } = req;
    
    if (!user) {
      throw new UnauthorizedError("Usuario no autenticado");
    }

    if (!roles.includes(user.role)) {
      throw new UnauthorizedError("No tienes permisos para acceder a este recurso");
    }

    next();
  };
};