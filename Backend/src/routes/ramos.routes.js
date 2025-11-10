import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { isProfesor } from "../middleware/authorization.middleware.js";
import { inscribirAlumno, crearRamo, crearSeccion } from "../controllers/ramos.controller.js";

const router = Router();

// Rutas para gestión de ramos
router.post("/", authMiddleware, isProfesor, crearRamo);
router.post("/:ramoId/secciones", authMiddleware, isProfesor, crearSeccion);

// Ruta para que el profesor inscriba alumnos en sus ramos
router.post("/inscribir", authMiddleware, isProfesor, inscribirAlumno);

export default router;