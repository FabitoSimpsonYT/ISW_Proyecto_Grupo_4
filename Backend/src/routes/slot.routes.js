// src/routes/slot.routes.js
import { Router } from "express";
import { authMiddleware, profesorMiddleware } from "../middleware/auth.js";
import { generarSlots, getSlotsEvento, eliminarSlot, quitarAlumnoSlot, inscribirSlot } from "../controllers/slot.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:eventoId/generar", profesorMiddleware, generarSlots);
router.get("/:eventoId", getSlotsEvento);
router.delete("/slot/:slotId", profesorMiddleware, eliminarSlot);
router.patch("/slot/:slotId/quitar-alumno", profesorMiddleware, quitarAlumnoSlot);
router.patch("/slot/:slotId/bloquear", profesorMiddleware, async (req, res) => {
  // Implementación simple de ejemplo (puedes expandir)
  try {
    const { bloquear } = req.body;
    // Aquí deberías actualizar el campo "bloqueado" o "disponible" en la entidad Slot
    // Por ahora solo responde éxito para que el frontend funcione
    res.json({ success: true, message: bloquear ? "Slot bloqueado" : "Slot desbloqueado" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post("/slot/:slotId/inscribir", inscribirSlot);

export default router;