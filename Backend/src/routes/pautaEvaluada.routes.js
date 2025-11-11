import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { createPautaEvaluada, getPautaEvaluada, updatePautaEvaluada, deletePautaEvaluada } from "../controllers/pautaEvaluada.controller.js";

const router = Router();

router.post("/:evaluacionId", authMiddleware, createPautaEvaluada);

router.get("/:id", authMiddleware, getPautaEvaluada);

router.patch("/:id", authMiddleware, updatePautaEvaluada);

router.delete("/:id", authMiddleware, deletePautaEvaluada);

export default router;
