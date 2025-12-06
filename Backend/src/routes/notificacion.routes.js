import express from "express";
import { getNotificaciones, markNotificacionLeida } from "../controllers/notificacion.controller.js";
import {authMiddleware} from "../middleware/auth.middleware.js"

const router = express.Router();

router.get("/",authMiddleware,getNotificaciones);
router.patch("/:id/leer", authMiddleware,markNotificacionLeida);

export default router;
