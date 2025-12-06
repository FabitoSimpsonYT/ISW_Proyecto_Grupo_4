import { UnauthorizedError } from "../Handlers/responseHandlers.js";

export const checkRole = (roles) => {
  return (req, res, next) => {
    const { user } = req;
    
    if (!user) {
      console.error("❌ [role] No user in request");
      return res.status(401).json({ message: "Usuario no autenticado" });
    }

    if (!roles.includes(user.role)) {
      console.error(`❌ [role] User role "${user.role}" not allowed. Expected: [${roles}]`);
      return res.status(403).json({ message: "No tienes permisos para acceder a este recurso" });
    }

    console.log(`✅ [role] Role check passed for ${user.role}`);
    next();
  };
};