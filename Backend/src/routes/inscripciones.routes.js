import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { inscribirSlot } from "../controllers/slot.controller.js";

const router = Router();

// Obtener inscripciones por evento (solo profesores)
router.get('/evento/:eventoId', authMiddleware, async (req, res) => {
  try {
    const { eventoId } = req.params;
    const user = req.user;

    if (user.role !== 'profesor') {
      return res.status(403).json({ success: false, message: 'Solo profesores pueden acceder a inscripciones' });
    }

    // TODO: implementar lectura real desde BD. Por ahora respuesta ejemplo.
    const inscripciones = [
      {
        id: 1,
        eventoId: eventoId,
        alumnoEmail: 'alumno1@example.com',
        estado: 'confirmado',
        horarioAsignado: {
          inicio: new Date().toISOString(),
          fin: new Date(Date.now() + 30 * 60000).toISOString()
        },
        cantidadMiembros: 1,
        miembrosGrupo: []
      }
    ];

    res.json({ success: true, data: inscripciones, message: 'Inscripciones obtenidas exitosamente' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error al obtener inscripciones', error: error.message });
  }
});

// Endpoint para que un alumno se inscriba (frontend usa POST /api/inscripciones)
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const { slotId } = req.body || {};
    if (slotId) {
      // Delegar a la lógica de slots (inscribirSlot espera req.params.slotId)
      req.params = req.params || {};
      req.params.slotId = slotId;
      return inscribirSlot(req, res, next);
    }

    // Si no viene slotId, implementar lógica para inscripciones sin slots (grupos/parejas)
    return res.status(400).json({ success: false, message: 'slotId es requerido para inscribirse vía este endpoint' });
  } catch (error) {
    next(error);
  }
});

export default router;
