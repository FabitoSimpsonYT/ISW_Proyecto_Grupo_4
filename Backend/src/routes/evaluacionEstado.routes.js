import { Router } from "express";
import { cambiarEstadoEvaluacion, getEvaluacionPorId } from "../controllers/evaluacionEstado.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/evaluaciones-estado/:id
 * Obtener evaluación por ID
 */
router.get("/:id", authMiddleware, getEvaluacionPorId);

/**
 * PUT /api/evaluaciones-estado/:id/cambiar
 * Cambiar estado de evaluación
 * Body: { estado, motivo_cambio? }
 */
router.put("/:id/cambiar", authMiddleware, cambiarEstadoEvaluacion);

export default router;
