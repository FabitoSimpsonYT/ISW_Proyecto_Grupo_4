import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { inscribirSlot } from "../controllers/slot.controller.js";
import { getClient } from "../config/database.js";

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
    // Aceptar varias formas: slotId, slot_id, slot
    const body = req.body || {};
    console.log('[inscripciones] body recibido:', body);
    const rawSlot = body.slotId ?? body.slot_id ?? body.slot ?? null;
    const slotData = body.slotData ?? null;
    const eventoId = body.eventoId ?? body.event_id ?? body.evento ?? null;

    // If the frontend sent explicit slotData (inicio/fin), create a DB slot and assign the alumno
    if (slotData && eventoId) {
      const client = await getClient();
      try {
        const alumnoId = parseInt(req.user?.id, 10);
        if (isNaN(alumnoId)) return res.status(401).json({ success: false, message: 'No autorizado' });

        // Ensure alumno not already enrolled in this evento
        const exists = await client.query(`SELECT 1 FROM slots WHERE evento_id = $1 AND alumno_id = $2 LIMIT 1`, [eventoId, alumnoId]);
        if (exists.rows.length > 0) {
          return res.status(400).json({ success: false, message: 'Ya estás inscrito(a) en un slot de esta evaluación' });
        }

        const ins = await client.query(
          `INSERT INTO slots (evento_id, fecha_hora_inicio, fecha_hora_fin, alumno_id, disponible) VALUES ($1, $2, $3, $4, false) RETURNING *`,
          [eventoId, slotData.inicio, slotData.fin, alumnoId]
        );

        const created = ins.rows[0];
        return res.status(201).json({ success: true, message: 'Inscripción aceptada (slot creado)', data: created });
      } catch (err) {
        console.error('[inscripciones] error creando slot con slotData:', err);
        return res.status(500).json({ success: false, message: 'Error al crear el slot', error: err.message });
      } finally {
        try { client.release(); } catch (e) {}
      }
    }

    if (rawSlot !== undefined && rawSlot !== null) {
      const slotIdInt = parseInt(rawSlot, 10);
      if (isNaN(slotIdInt)) {
        return res.status(400).json({ success: false, message: 'slotId inválido (debe ser un número entero)' });
      }
      req.params = req.params || {};
      req.params.slotId = slotIdInt;
      return inscribirSlot(req, res, next);
    }

    // Si no viene slotId, devolver info para frontend (puede ser inscripción sin slot)
    return res.status(400).json({ success: false, message: 'slotId es requerido para inscribirse vía este endpoint' });
  } catch (error) {
    next(error);
  }
});

export default router;
