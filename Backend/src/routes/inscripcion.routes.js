// Backend/src/routes/inscripcion.routes.js
import express from 'express';
import InscripcionController from '../controllers/inscripcion.controller.js';
import { authMiddleware, alumnoMiddleware, profesorMiddleware, jefeCarreraMiddleware } from '../middleware/auth.js';

const router = express.Router();
const inscripcionController = new InscripcionController();

// Rutas para alumnos
router.post(
  '/',
  authMiddleware,
  alumnoMiddleware,
  inscripcionController.inscribirAlumno
);

router.delete(
  '/:id',
  authMiddleware,
  alumnoMiddleware,
  inscripcionController.cancelarInscripcion
);

router.get(
  '/mis-inscripciones',
  authMiddleware,
  alumnoMiddleware,
  inscripcionController.obtenerInscripcionesAlumno
);

router.get(
  '/calendario',
  authMiddleware,
  alumnoMiddleware,
  inscripcionController.obtenerCalendarioAlumno
);

// Rutas para profesores
router.get(
  '/evento/:eventoId',
  authMiddleware,
  profesorMiddleware,
  inscripcionController.obtenerInscripcionesEvento
);

// Rutas para jefe de carrera
router.post(
  '/reasignar-seccion',
  authMiddleware,
  jefeCarreraMiddleware,
  inscripcionController.reasignarSeccion
);

export default router;