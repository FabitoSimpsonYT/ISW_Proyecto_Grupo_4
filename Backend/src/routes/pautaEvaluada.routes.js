import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createPautaEvaluada, getPautaEvaluada, getPautasEvaluadasByEvaluacion, updatePautaEvaluada, deletePautaEvaluada } from "../controllers/pautaEvaluada.controller.js";

const router = Router();

router.post("/:evaluacionId/:pautaId", authMiddleware, createPautaEvaluada);

// Ruta más específica primero (con alumnoRut)
router.get("/:evaluacionId/:alumnoRut", authMiddleware, getPautaEvaluada);

router.patch("/:evaluacionId/:alumnoRut", authMiddleware, updatePautaEvaluada);

router.delete("/:evaluacionId/:alumnoRut", authMiddleware, deletePautaEvaluada);

// Ruta más general al final (solo evaluacionId)
router.get("/:evaluacionId", authMiddleware, getPautasEvaluadasByEvaluacion);

export default router;
