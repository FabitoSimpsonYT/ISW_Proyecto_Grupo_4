import { Router } from "express";
import { crearBloqueo, getBloqueos, eliminarBloqueo } from "../controllers/bloqueo.controller.js";
import { authMiddleware, adminOrJefeCarreraMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get('/', getBloqueos);
router.post('/', adminOrJefeCarreraMiddleware, crearBloqueo);
router.delete('/:id', adminOrJefeCarreraMiddleware, eliminarBloqueo);

export default router;