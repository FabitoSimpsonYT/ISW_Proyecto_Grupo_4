import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import{
    createPauta,
    getPautaById,
    updatePauta,
    deletePauta,
} from "../controllers/pauta.controller.js";

const router = Router();

router.get("/:id", authMiddleware, getPautaById);
router.post("/", authMiddleware, createPauta);

router.patch("/:id", authMiddleware,updatePauta);
router.delete("/:id", authMiddleware,deletePauta);

export default router;
