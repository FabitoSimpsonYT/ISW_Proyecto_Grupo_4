// Backend/src/routes/inscripcion.routes.js
const express = require('express');
const router = express.Router();
const InscripcionController = require('../controllers/inscripcionController');
const { authMiddleware, alumnoMiddleware, profesorMiddleware, jefeCarreraMiddleware } = require('../middleware/auth');

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

module.exports = router;