import { Router } from 'express';
import { authMiddleware, profesorMiddleware } from '../middleware/auth.js';
import EventoController from '../controllers/evento.controller.js';

const router = Router();

router.use(authMiddleware);

router.post('/', profesorMiddleware, EventoController.crearEvento);
router.patch('/:id', profesorMiddleware, EventoController.actualizarEvento);
router.delete('/:id', profesorMiddleware, EventoController.eliminarEvento);
router.get('/profesor', profesorMiddleware, EventoController.obtenerEventosProfesor);

router.get('/alumno', EventoController.obtenerEventosAlumno);

export default router;