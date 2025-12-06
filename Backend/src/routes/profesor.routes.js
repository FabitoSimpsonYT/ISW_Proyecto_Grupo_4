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

router.use(authMiddleware);

router.post("/", 
  checkRole(["admin"]), 
  validateRequest(createProfesorValidation), 
  createProfesorHandler
);

router.get("/", 
  checkRole(["admin", "profesor"]), 
  getProfesorByIdHandler
);

router.get("/:id", 
  checkRole(["admin"]), 
  getProfesorByIdHandler
);

router.put("/", 
  checkRole(["admin", "profesor"]), 
  validateRequest(updateProfesorValidation), 
  updateProfesorHandler
);

router.delete("/:id", 
  checkRole(["admin"]), 
  deleteProfesorHandler
);

export default router;
