import { Router } from 'express';
import { authMiddleware, profesorMiddleware } from '../middleware/auth.js';
import EventoController from '../controllers/evento.controller.js';

const router = Router();

router.use(authMiddleware);

// Rutas GET específicas ANTES de las genéricas
router.get('/profesor', profesorMiddleware, EventoController.obtenerEventosProfesor);
router.get('/alumno/disponibles-slots', EventoController.obtenerEventosDisponiblesSlots);
router.get('/alumno', EventoController.obtenerEventosAlumno);

// Rutas CRUD genéricas
router.post('/', profesorMiddleware, EventoController.crearEvento);
router.patch('/:id', profesorMiddleware, EventoController.actualizarEvento);
router.delete('/:id', profesorMiddleware, EventoController.eliminarEvento);

export default router;