// Backend/src/routes/evento.routes.js
const express = require('express');
const router = express.Router();
const EventoController = require('../controllers/eventoController');
const { authMiddleware, profesorMiddleware, jefeCarreraMiddleware } = require('../middleware/auth');

const eventoController = new EventoController();

// Rutas para profesores
router.post(
  '/',
  authMiddleware,
  profesorMiddleware,
  eventoController.crearEvento
);

router.put(
  '/:id',
  authMiddleware,
  profesorMiddleware,
  eventoController.actualizarEvento
);

router.delete(
  '/:id',
  authMiddleware,
  profesorMiddleware,
  eventoController.eliminarEvento
);

router.get(
  '/profesor/mis-eventos',
  authMiddleware,
  profesorMiddleware,
  eventoController.obtenerEventosProfesor
);

// Rutas para alumnos
router.get(
  '/disponibles',
  authMiddleware,
  eventoController.obtenerEventosDisponibles
);

router.get(
  '/:id',
  authMiddleware,
  eventoController.obtenerEvento
);

// Rutas para días feriados (Jefe de Carrera)
router.post(
  '/feriados',
  authMiddleware,
  jefeCarreraMiddleware,
  eventoController.agregarDiaFeriado
);

router.get(
  '/feriados/lista',
  authMiddleware,
  eventoController.obtenerDiasFeriados
);

module.exports = router;