import { Router } from "express";
import {
  createProfesorHandler,
  getAllProfesoresHandler,
  getProfesorByIdHandler,
  getProfesorByRutHandler,
  updateProfesorHandler,
  deleteProfesorHandler
} from "../controllers/profesor.controller.js";
import { checkRole } from "../middleware/role.middleware.js";
import { validateRequest } from "../middleware/validation.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createProfesorValidation, updateProfesorValidation } from "../validations/profesor.validation.js";

const router = Router();

router.use(authMiddleware);

router.post("/", 
  checkRole(["admin"]), 
  validateRequest(createProfesorValidation), 
  createProfesorHandler
);

router.get("/", 
  checkRole(["admin", "profesor", "jefecarrera", "alumno"]), 
  getAllProfesoresHandler
);

router.get("/rut/:rut", 
  checkRole(["admin", "profesor", "jefecarrera", "alumno"]), 
  getProfesorByRutHandler
);

router.get("/:id", 
  checkRole(["admin", "profesor", "jefecarrera", "alumno"]), 
  getProfesorByIdHandler
);

router.patch("/", 
  checkRole(["admin", "profesor", "jefecarrera"]), 
  validateRequest(updateProfesorValidation), 
  updateProfesorHandler
);
router.patch("/:id", 
  checkRole(["admin", "profesor", "jefecarrera"]), 
  validateRequest(updateProfesorValidation), 
  updateProfesorHandler
);

router.delete("/:id", 
  checkRole(["admin", "jefecarrera"]), 
  deleteProfesorHandler
);

export default router;
