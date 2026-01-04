import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import{
    createPauta,
    getPautaById,
    getAllPautas,
    updatePauta,
    deletePauta,
    createPautaIntegradora,
    getPautaIntegradora,
    updatePautaIntegradora,
    deletePautaIntegradora,
    getPautaByEvaluacion,
    getPautaByEvaluacionIntegradora,
    publishPauta,
    publishPautaIntegradora,
} from "../controllers/pauta.controller.js";

const router = Router();
// Listar todas las pautas (si es alumno, solo publicadas)
router.get("/", authMiddleware, getAllPautas);

// Rutas específicas PRIMERO (antes de la ruta genérica /:id)
router.get("/by-evaluacion/:evaluacionId", authMiddleware, getPautaByEvaluacion);
router.get("/by-evaluacion-integradora/:evaluacionIntegradoraId", authMiddleware, getPautaByEvaluacionIntegradora);

// Rutas específicas para pautas de evaluación integradora (ANTES de rutas genéricas)
router.post("/integradora/:evaluacionIntegradoraId", authMiddleware, createPautaIntegradora);
router.get("/integradora/:evaluacionIntegradoraId", authMiddleware, getPautaIntegradora);
router.patch("/integradora/:evaluacionIntegradoraId/publicar", authMiddleware, publishPautaIntegradora);
router.patch("/integradora/:evaluacionIntegradoraId", authMiddleware, updatePautaIntegradora);
router.delete("/integradora/:evaluacionIntegradoraId", authMiddleware, deletePautaIntegradora);

// Rutas para pautas de evaluaciones normales
router.post("/", authMiddleware, createPauta);
router.post("/:evaluacionId", authMiddleware, createPauta);

// Ruta genérica al final
router.get("/:id", authMiddleware, getPautaById);
router.patch("/:id/publicar", authMiddleware, publishPauta);
router.patch("/:id", authMiddleware, updatePauta);
router.delete("/:id", authMiddleware, deletePauta);

export default router;
