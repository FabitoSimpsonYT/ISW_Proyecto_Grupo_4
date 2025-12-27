// src/routes/slot.routes.js
import { Router } from "express";
import { authMiddleware, profesorMiddleware } from "../middleware/auth.js";
import { generarSlots, getSlotsEvento, eliminarSlot, quitarAlumnoSlot, inscribirSlot, bloquearSlot } from "../controllers/slot.controller.js";

const router = Router();

router.use(authMiddleware);

router.post("/:eventoId/generar", profesorMiddleware, generarSlots);
router.get("/:eventoId", getSlotsEvento);
router.delete("/slot/:slotId", profesorMiddleware, eliminarSlot);
router.patch("/slot/:slotId/quitar-alumno", profesorMiddleware, quitarAlumnoSlot);
router.patch("/slot/:slotId/bloquear", profesorMiddleware, bloquearSlot);

router.post("/slot/:slotId/inscribir", inscribirSlot);

export default router;