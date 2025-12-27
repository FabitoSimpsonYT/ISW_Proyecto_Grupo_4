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
} from "../controllers/pauta.controller.js";

const router = Router();
// Listar todas las pautas (si es alumno, solo publicadas)
router.get("/", authMiddleware, getAllPautas);

router.get("/:id", authMiddleware, getPautaById);

// Rutas para pautas de evaluaciones normales
router.post("/", authMiddleware, createPauta);
router.post("/:evaluacionId", authMiddleware, createPauta);

// Rutas específicas para pautas de evaluación integradora
router.post("/integradora/:evaluacionIntegradoraId", authMiddleware, createPautaIntegradora);
router.get("/integradora/:evaluacionIntegradoraId", authMiddleware, getPautaIntegradora);
router.patch("/integradora/:evaluacionIntegradoraId", authMiddleware, updatePautaIntegradora);
router.delete("/integradora/:evaluacionIntegradoraId", authMiddleware, deletePautaIntegradora);

router.patch("/:id", authMiddleware, updatePauta);
router.delete("/:id", authMiddleware, deletePauta);

export default router;
