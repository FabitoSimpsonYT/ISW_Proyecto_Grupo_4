"use strict";
import { handleErrorClient } from "../Handlers/responseHandlers.js";


export async function isAdmin(req, res, next) {
  try {
    if (!req.user) {
      return handleErrorClient(res, 401, "Acceso denegado. Usuario no autenticado.");
    }
    
    if (req.user.role !== "admin") {
      return handleErrorClient(res, 403, "Acceso denegado. Se requiere rol de administrador.");
    }
    
    next();
  } catch (error) {
    handleErrorClient(res, 500, "Error interno del servidor", error.message);
  }
}

export async function isProfesor(req, res, next) {
  try {
    if (!req.user) {
      return handleErrorClient(res, 401, "Acceso denegado. Usuario no autenticado.");
    }

    if (req.user.role !== "profesor") {
      return handleErrorClient(res, 403, "Acceso denegado. Se requiere rol de profesor.");
    }
    
    next();
  } catch (error) {
    handleErrorClient(res, 500, "Error interno del servidor", error.message);
  }
}

export async function isAlumno(req, res, next) {
  try {
    if (!req.user) {
      return handleErrorClient(res, 401, "Acceso denegado. Usuario no autenticado.");
    }
    
    if (req.user.role !== "alumno") {
      return handleErrorClient(res, 403, "Acceso denegado. Se requiere rol de alumno.");
    }
    
    next();
  } catch (error) {
    handleErrorClient(res, 500, "Error interno del servidor", error.message);
  }
}
