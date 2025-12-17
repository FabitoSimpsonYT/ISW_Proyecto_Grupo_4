import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createPautaEvaluada, getPautaEvaluada, updatePautaEvaluada, deletePautaEvaluada } from "../controllers/pautaEvaluada.controller.js";

const router = Router();

router.post("/:evaluacionId/:pautaId", authMiddleware, createPautaEvaluada);

router.get("/:evaluacionId/:alumnoRut", authMiddleware, getPautaEvaluada);

router.patch("/:evaluacionId/:alumnoRut", authMiddleware, updatePautaEvaluada);

router.delete("/:evaluacionId/:alumnoRut", authMiddleware, deletePautaEvaluada);

export default router;
