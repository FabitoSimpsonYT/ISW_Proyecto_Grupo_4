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
  checkRole(["admin"]), 
  validateRequest(createAlumnoValidation), 
  createAlumnoHandler
);

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

router.put("/", 
  authMiddleware,
  checkRole(["admin", "alumno"]), 
  validateRequest(updateAlumnoValidation), 
  updateAlumnoHandler
);

router.delete("/:id", 
  authMiddleware,
  checkRole(["admin"]), 
  deleteAlumnoHandler
);

router.get("/:id/evaluaciones", 
  authMiddleware,
  checkRole(["admin", "alumno"]), 
  getEvaluacionesYNotasHandler
);

export default router;
