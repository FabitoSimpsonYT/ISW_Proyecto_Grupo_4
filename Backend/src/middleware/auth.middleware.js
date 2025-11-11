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

    // Ensure req.user.id is available. Older tokens may only have 'sub' (rut).
    // If payload.id is missing but sub is present, try to resolve numeric id from DB.
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

    // Attach enriched user info to req.user
    req.user = {
      ...payload,
      id: resolvedId,
      rut: payload.sub ?? payload.rut ?? null,
    };

    next();
  } catch (error) {
    console.error(`❌ [auth] Token error: ${error.message}`);
    return handleErrorClient(res, 401, "Token inválido o expirado.", error.message);
  }
}
