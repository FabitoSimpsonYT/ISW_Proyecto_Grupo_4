import { loginUser } from "../services/auth.service.js";
import { createUser } from "../services/user.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { createValidation, loginValidation } from "../validations/users.validation.js";
import jwt from "jsonwebtoken";

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    const { error } = loginValidation.validate(req.body);

    if (error) {
      return handleErrorClient(res, 400, error.message);
    }
    
    const data = await loginUser(email, password);
    handleSuccess(res, 200, "Login exitoso", data);
  } catch (error) {
    handleErrorClient(res, 401, error.message);
  }
}

export async function register(req, res) {
  try {
    const data = req.body;
    const { error } = createValidation.validate(req.body);
    
    if (error) {
      return handleErrorClient(res, 400, error.message);
    }
    // Si se intenta crear un profesor o alumno, exigir que la petición la haga un admin autenticado
    if (data.role === "profesor" || data.role === "alumno") {
      const authHeader = req.headers["authorization"];
      if (!authHeader) {
        return handleErrorClient(res, 401, "Acceso denegado. Solo administradores pueden crear profesores o alumnos.");
      }
      const token = authHeader.split(" ")[1];
      if (!token) {
        return handleErrorClient(res, 401, "Acceso denegado. Token malformado.");
      }
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload || payload.role !== "admin") {
          return handleErrorClient(res, 403, "Acceso denegado. Solo administradores pueden realizar esta acción.");
        }
      } catch (err) {
        return handleErrorClient(res, 401, "Token inválido o expirado.");
      }
    }
    
    const newUser = await createUser(data);
    delete newUser.password; // Nunca devolver la contraseña
    handleSuccess(res, 201, "Usuario registrado exitosamente", newUser);
  } catch (error) {
    if (error.code === '23505') { // Código de error de PostgreSQL para violación de unique constraint
      handleErrorClient(res, 409, "El email ya está registrado");
    } else {
      handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
  }
}
