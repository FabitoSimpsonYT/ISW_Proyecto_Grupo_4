import { loginUser } from "../services/auth.service.js";
import { createUser } from "../services/user.service.js";
import { handleSuccess, handleErrorClient, handleErrorServer } from "../Handlers/responseHandlers.js";
import { createValidation, loginValidation } from "../validations/users.validation.js";
import { AppDataSource } from "../config/configDb.js";
import { User } from "../entities/user.entity.js";
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
    
    const userRole = req.user.role;

    if (userRole !== "admin") {
      return handleErrorClient(res, 403, "Debe ser rango administrador para crear usuarios.");
    }

    const { error } = createValidation.validate(req.body);

    if (data.role === "admin") {
      const adminExists = await AppDataSource
        .getRepository(User)
        .findOne({ where: { role: "admin" } });
      
      if (!adminExists) {
        return handleSuccess(res, 201, "Primer administrador registrado exitosamente", newUser);
      }
    }
    
    const newUser = await createUser(data);
    delete newUser.password;
    handleSuccess(res, 201, "Usuario registrado exitosamente", newUser);
  } catch (error) {
    if (error.code === "RUT_IN_USE") {
      handleErrorClient(res, 409, "El RUT ya está registrado");
    } else if (error.code === "EMAIL_IN_USE") {
      handleErrorClient(res, 409, "El email ya está registrado");
    } else if (error.code === "PHONE_IN_USE") {
      handleErrorClient(res, 409, "El teléfono ya está registrado");
    } else {
      handleErrorServer(res, 500, "Error interno del servidor", error.message);
    }
  }
}
