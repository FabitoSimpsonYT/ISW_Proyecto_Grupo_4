import jwt from "jsonwebtoken";
import { handleErrorClient } from "../Handlers/responseHandlers.js";
import { findUserByRut } from "../services/user.service.js";

export async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  console.log(`✅ [auth] ${req.method} ${req.path}`);

  if (!authHeader) {
    return handleErrorClient(res, 401, "Acceso denegado. No se proporcionó token.");
  }

  const token = authHeader.split(" ")[1];

  if (!token) {
    return handleErrorClient(res, 401, "Acceso denegado. Token malformado.");
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log(`✅ [auth] Token OK - role=${payload.role}`);

    let resolvedId = payload.id ?? null;
    if (!resolvedId && payload.sub) {
      try {
        const user = await findUserByRut(payload.sub);
        if (user && user.id) {
          resolvedId = user.id;
          console.log(`✅ [auth] Resolved user id from RUT: ${resolvedId}`);
        } else {
          console.log(`⚠️ [auth] No se encontró usuario con RUT=${payload.sub}`);
        }
      } catch (err) {
        console.error(`❌ [auth] Error buscando user por RUT: ${err.message}`);
      }
    }

    req.user = {
      ...payload,
      id: resolvedId,
      rut: payload.sub ?? payload.rut ?? null,
      rol: payload.role || payload.rol || 'usuario',
    };

    next();
  } catch (error) {
    console.error(`❌ [auth] Token error: ${error.message}`);
    return handleErrorClient(res, 401, "Token inválido o expirado.", error.message);
  }
}
