import { Router } from "express";
import { authMiddleware } from "../middleware/auth.middleware.js";
import {
  obtenerTiposEventos,
  obtenerTiposEventosTodos,
  obtenerTipoEvento,
  crearTipo,
  actualizarTipo,
  eliminarTipo,
} from "../controllers/tipoEvento.controller.js";

const router = Router();

/**
 * GET /api/tipos-eventos
 * Obtener todos los tipos de eventos activos
 */
router.get("/", obtenerTiposEventos);

/**
 * GET /api/tipos-eventos/admin/todos
 * Obtener todos los tipos de eventos incluyendo inactivos (solo admin)
 */
router.get("/admin/todos", authMiddleware, obtenerTiposEventosTodos);

/**
 * GET /api/tipos-eventos/:id
 * Obtener un tipo de evento por ID
 */
router.get("/:id", obtenerTipoEvento);

/**
 * POST /api/tipos-eventos
 * Crear un nuevo tipo de evento
 */
router.post("/", authMiddleware, crearTipo);

/**
 * PUT /api/tipos-eventos/:id
 * Actualizar un tipo de evento
 */
router.put("/:id", authMiddleware, actualizarTipo);

/**
 * DELETE /api/tipos-eventos/:id
 * Eliminar un tipo de evento
 */
router.delete("/:id", authMiddleware, eliminarTipo);

export default router;