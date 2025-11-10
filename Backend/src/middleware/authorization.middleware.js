"use strict";
import { handleErrorClient } from "../Handlers/responseHandlers.js";

// Función middleware para verificar si el usuario es administrador
export async function isAdmin(req, res, next) {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return handleErrorClient(res, 401, "Acceso denegado. Usuario no autenticado.");
    }
    
    // Verificar que el usuario sea admin
    if (req.user.role !== "admin") {
      return handleErrorClient(res, 403, "Acceso denegado. Se requiere rol de administrador.");
    }
    
    // Si el rol es administrador, continuar
    next();
  } catch (error) {
    handleErrorClient(res, 500, "Error interno del servidor", error.message);
  }
}

// Función middleware para verificar si el usuario es profesor
export async function isProfesor(req, res, next) {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return handleErrorClient(res, 401, "Acceso denegado. Usuario no autenticado.");
    }
    
    // Verificar que el usuario sea profesor
    if (req.user.role !== "profesor") {
      return handleErrorClient(res, 403, "Acceso denegado. Se requiere rol de profesor.");
    }
    
    // Si el rol es profesor, continuar
    next();
  } catch (error) {
    handleErrorClient(res, 500, "Error interno del servidor", error.message);
  }
}

// Función middleware para verificar si el usuario es alumno
export async function isAlumno(req, res, next) {
  try {
    // Verificar que el usuario esté autenticado
    if (!req.user) {
      return handleErrorClient(res, 401, "Acceso denegado. Usuario no autenticado.");
    }
    
    // Verificar que el usuario sea alumno
    if (req.user.role !== "alumno") {
      return handleErrorClient(res, 403, "Acceso denegado. Se requiere rol de alumno.");
    }
    
    // Si el rol es alumno, continuar
    next();
  } catch (error) {
    handleErrorClient(res, 500, "Error interno del servidor", error.message);
  }
}
