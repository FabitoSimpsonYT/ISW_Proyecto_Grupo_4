import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createPautaEvaluada, getPautaEvaluada, updatePautaEvaluada, deletePautaEvaluada } from "../controllers/pautaEvaluada.controller.js";

const router = Router();

// Crear pauta evaluada para una evaluación (profesor)
// POST /pauta-evaluadas/{evaluacionId}
router.post("/:evaluacionId", authMiddleware, createPautaEvaluada);

// Obtener pauta evaluada por id
router.get("/:id", authMiddleware, getPautaEvaluada);

// Actualizar pauta evaluada (profesor que creó o admin)
router.patch("/:id", authMiddleware, updatePautaEvaluada);

// Eliminar pauta evaluada (profesor que creó o admin)
router.delete("/:id", authMiddleware, deletePautaEvaluada);

export default router;
