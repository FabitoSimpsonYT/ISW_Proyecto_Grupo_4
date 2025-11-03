import { Router } from "express";
import {
  createAlumnoHandler,
  getAllAlumnosHandler,
  getAlumnoByIdHandler,
  updateAlumnoHandler,
  deleteAlumnoHandler
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

// Admin y profesores pueden listar (por ejemplo)
router.get("/", 
  authMiddleware,
  checkRole(["admin", "profesor"]), 
  getAllAlumnosHandler
);

router.get("/:id", 
  authMiddleware,
  checkRole(["admin", "profesor"]), 
  getAlumnoByIdHandler
);

router.put("/:id", 
  authMiddleware,
  checkRole(["admin"]), 
  validateRequest(updateAlumnoValidation), 
  updateAlumnoHandler
);

router.delete("/:id", 
  authMiddleware,
  checkRole(["admin"]), 
  deleteAlumnoHandler
);

export default router;