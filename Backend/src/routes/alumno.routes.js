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

router.post("/", 
  authMiddleware,
  checkRole(["admin", "jefecarrera"]), 
  validateRequest(createAlumnoValidation), 
  createAlumnoHandler
);

router.get("/", 
  authMiddleware,
  checkRole(["admin", "profesor", "alumno", "jefecarrera"]), 
  getAllAlumnosHandler
);

router.get("/:id", 
  authMiddleware,
  checkRole(["admin", "jefecarrera", "profesor"]), 
  getAlumnoByIdHandler
);

router.patch('/:id', 
  authMiddleware,
  checkRole(["admin", "alumno", "jefecarrera"]), 
  validateRequest(updateAlumnoValidation), 
  updateAlumnoHandler
);

router.delete("/:id", 
  authMiddleware,
  checkRole(["admin", "jefecarrera"]), 
  deleteAlumnoHandler
);

router.get("/:id/evaluaciones", 
  authMiddleware,
  checkRole(["admin", "alumno", "jefecarrera"]), 
  getEvaluacionesYNotasHandler
);

export default router;