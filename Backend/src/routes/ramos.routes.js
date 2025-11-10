import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isProfesor } from "../middleware/authorization.middleware.js";
import { inscribirAlumno } from "../controllers/ramos.controller.js";

const router = Router();

// Ruta para que el profesor inscriba alumnos en sus ramos
router.post("/inscribir", authMiddleware, isProfesor, inscribirAlumno);

export default router;