import { Router } from "express";
import {
  createAlumnoHandler,
  getAllAlumnosHandler,
  getAlumnoByIdHandler,
  updateAlumnoHandler,
  deleteAlumnoHandler,
  getEvaluacionesYNotasHandler
} from "../controllers/alumno.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createAlumnoValidation, updateAlumnoValidation } from "../validations/alumno.validation.js";

const router = Router();

// Solo admin puede crear alumnos
router.post("/", 
  authMiddleware,
  checkRole(["admin"]), 
  validateRequest(createAlumnoValidation), 
  createAlumnoHandler
);

// Admin y profesores ven lista, alumno ve su perfil
router.get("/", 
  authMiddleware,
  checkRole(["admin", "profesor", "alumno"]), 
  getAlumnoByIdHandler
);

// Admin y profesores pueden ver perfiles específicos
router.get("/:id", 
  authMiddleware,
  checkRole(["admin", "profesor"]), 
  getAlumnoByIdHandler
);

// Admin o alumno editan perfil (alumno solo puede editar el suyo)
router.put("/", 
  authMiddleware,
  checkRole(["admin", "alumno"]), 
  validateRequest(updateAlumnoValidation), 
  updateAlumnoHandler
);

// Solo admin puede eliminar perfiles
router.delete("/:id", 
  authMiddleware,
  checkRole(["admin"]), 
  deleteAlumnoHandler
);

// Obtener evaluaciones y notas de un alumno
router.get("/:id/evaluaciones", 
  authMiddleware,
  checkRole(["admin", "alumno"]), 
  getEvaluacionesYNotasHandler
);

export default router;