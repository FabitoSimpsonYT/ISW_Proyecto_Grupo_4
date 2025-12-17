import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import{
    createPauta,
    getPautaById,
    getAllPautas,
    updatePauta,
    deletePauta,
} from "../controllers/pauta.controller.js";

const router = Router();
// Listar todas las pautas (si es alumno, solo publicadas)
router.get("/", authMiddleware, getAllPautas);

router.get("/:id", authMiddleware, getPautaById);
// Permitir crear pauta con o sin evaluacionId: registrar ambas rutas explícitamente
router.post("/", authMiddleware, createPauta);
router.post("/:evaluacionId", authMiddleware, createPauta);

router.patch("/:id", authMiddleware,updatePauta);
router.delete("/:id", authMiddleware,deletePauta);

export default router;
