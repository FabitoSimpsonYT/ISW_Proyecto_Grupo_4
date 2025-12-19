import {Router} from "express";
import {authMiddleware} from "../middleware/auth.middleware.js"; 
import {
  getEvaluaciones,
  getEvaluacionById,
  createEvaluacion,
  updateEvaluacion,
  deleteEvaluacion,
  getMisEventos,
  crearEventoFlexible,
} from "../controllers/evaluacion.controller.js"; 

const router = Router();

router.get("/mis-eventos", authMiddleware, getMisEventos);
router.post("/eventos/crear", authMiddleware, crearEventoFlexible);
router.post("/", authMiddleware, createEvaluacion);
router.get("/", authMiddleware,  getEvaluaciones);
router.get("/:id", authMiddleware, getEvaluacionById);
router.patch("/:id", authMiddleware,  updateEvaluacion);
router.delete("/:id", authMiddleware, deleteEvaluacion);

export default router;
