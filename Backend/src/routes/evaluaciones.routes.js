import {Router} from "express";
import {authMiddleware} from "../middleware/auth.middleware.js"; 
import {
  getEvaluaciones,
  getEvaluacionById,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
} from "../controllers/evaluacion.controller.js"; 

const router = Router();

router.post("/", authMiddleware, createEvaluacion);
router.get("/", authMiddleware,  getEvaluaciones);
router.get("/:codigoRamo/:idEvaluacion", authMiddleware, getEvaluacionById);
router.get("/:codigoRamo", authMiddleware, getEvaluacionById);
router.patch("/:id", authMiddleware,  updateEvaluacion);
router.delete("/:id", authMiddleware, deleteEvaluacion);

export default router;
