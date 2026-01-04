// src/routes/slot.routes.js
import { Router } from "express";
import { authMiddleware, profesorMiddleware } from "../middleware/auth.js";
import { generarSlots, getSlotsEvento, eliminarSlot, quitarAlumnoSlot, inscribirSlot, bloquearSlot, eliminarAlumnoDelSlot, agregarAlumnoASlot } from "../controllers/slot.controller.js";

const router = Router();

router.use(authMiddleware);

// Rutas específicas primero para evitar conflictos
router.post("/:eventoId/generar", profesorMiddleware, generarSlots);
router.delete("/slot/:slotId", profesorMiddleware, eliminarSlot);
router.patch("/slot/:slotId/quitar-alumno", profesorMiddleware, quitarAlumnoSlot);
router.patch("/slot/:slotId/bloquear", profesorMiddleware, bloquearSlot);
router.post("/slot/:slotId/inscribir", inscribirSlot);

// Nuevas rutas para compatibilidad con Frontend GestionarSlotsProfesor
router.put("/:slotId/bloquear", profesorMiddleware, async (req, res) => {
  req.params.slotId = req.params.slotId;
  req.body.bloquear = true;
  return bloquearSlot(req, res);
});

router.put("/:slotId/desbloquear", profesorMiddleware, async (req, res) => {
  req.params.slotId = req.params.slotId;
  req.body.bloquear = false;
  return bloquearSlot(req, res);
});

router.delete("/:slotId/alumnos/:alumnoId", profesorMiddleware, eliminarAlumnoDelSlot);

router.post("/:slotId/alumnos", profesorMiddleware, agregarAlumnoASlot);

// Ruta DELETE para eliminar un slot completo
router.delete("/:slotId", profesorMiddleware, eliminarSlot);

// Ruta GET genérica al final
router.get("/:eventoId", getSlotsEvento);

export default router;