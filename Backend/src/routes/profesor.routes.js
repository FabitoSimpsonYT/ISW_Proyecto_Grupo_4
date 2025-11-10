import { Router } from "express";
import {
  createProfesorHandler,
  getAllProfesoresHandler,
  getProfesorByIdHandler,
  updateProfesorHandler,
  deleteProfesorHandler
} from "../controllers/profesor.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createProfesorValidation, updateProfesorValidation } from "../validations/profesor.validation.js";

const router = Router();

// Aplicar autenticación a todas las rutas de profesores
router.use(authMiddleware);

// Rutas protegidas por rol
router.post("/", 
  checkRole(["admin"]), 
  validateRequest(createProfesorValidation), 
  createProfesorHandler
);

// Admin ve todos los profesores, profesor ve su perfil
router.get("/", 
  checkRole(["admin", "profesor"]), 
  getProfesorByIdHandler
);

// Admin ve cualquier profesor específico
router.get("/:id", 
  checkRole(["admin"]), 
  getProfesorByIdHandler
);

// Admin o profesor editan perfil (profesor solo puede editar el suyo)
router.put("/", 
  checkRole(["admin", "profesor"]), 
  validateRequest(updateProfesorValidation), 
  updateProfesorHandler
);

// Solo admin puede eliminar perfiles
router.delete("/:id", 
  checkRole(["admin"]), 
  deleteProfesorHandler
);

export default router;