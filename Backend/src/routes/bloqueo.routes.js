import { Router } from "express";
import { crearBloqueo, getBloqueos, eliminarBloqueo } from "../controllers/bloqueo.controller.js";
import { authMiddleware, jefeCarreraMiddleware } from "../middleware/auth.js";

const router = Router();

router.use(authMiddleware);

router.get('/', getBloqueos);
router.post('/', jefeCarreraMiddleware, crearBloqueo);
router.delete('/:id', jefeCarreraMiddleware, eliminarBloqueo);

export default router;