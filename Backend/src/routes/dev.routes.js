import { Router } from 'express';
import devController from '../controllers/dev.controller.js';
import { authMiddleware } from '../middleware/auth.middleware.js';

const router = Router();

// Solo en development: inscribir alumno autenticado en una seccion (por defecto seccionId=1)
router.post('/enroll-seccion', authMiddleware, devController.enrollAlumnoEnSeccion);

export default router;
