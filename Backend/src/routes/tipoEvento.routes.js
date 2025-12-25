import { Router } from "express";
import { authMiddleware, profesorMiddleware } from "../middleware/auth.js";
import { getTiposEventos, createTipoEvento, updateTipoEvento, deleteTipoEvento } from "../controllers/tipoEvento.controller.js";

const router = Router();

router.use(authMiddleware);

router.get('/', getTiposEventos);
router.post('/', profesorMiddleware, createTipoEvento);
router.patch('/:id', profesorMiddleware, updateTipoEvento);
router.delete('/:id', profesorMiddleware, deleteTipoEvento);

export default router;