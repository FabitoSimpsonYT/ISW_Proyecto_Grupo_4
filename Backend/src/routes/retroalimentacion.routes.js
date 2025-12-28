import { Router } from "express";
import { 
  addRetroalimentacion, 
  getRetroalimentaciones,
  crearRetroalimentacionMensaje,
  obtenerRetroalimentacionMensajes,
  marcarRetroalimentacionVistos,
  obtenerConversacionesRamo,
  obtenerNoVistos,
} from "../controllers/retroalimentacion.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";
import { checkRole } from "../middleware/role.middleware.js";

const router = Router();

// ========== RUTAS ANTIGUAS (compatibilidad) ==========
router.post("/pautas/:pautaId/retroalimentacion",
  authMiddleware,
  checkRole(["profesor", "alumno"]),
  addRetroalimentacion
);

router.get("/pautas/:pautaId/retroalimentacion",
  authMiddleware,
  checkRole(["profesor", "alumno"]),
  getRetroalimentaciones
);

// ========== NUEVAS RUTAS PARA MENSAJERÍA CON WEBSOCKET ==========

// Crear mensaje de retroalimentación
router.post("/mensaje/crear", authMiddleware, crearRetroalimentacionMensaje);

// Obtener mensajes de retroalimentación
router.get("/mensajes/:alumnoRut/:ramoId", authMiddleware, obtenerRetroalimentacionMensajes);

// Marcar mensajes como vistos
router.patch("/mensajes/:alumnoRut/:ramoId/marcar-vistos", authMiddleware, marcarRetroalimentacionVistos);

// Obtener conversaciones del profesor
router.get("/conversaciones/:ramoId", authMiddleware, obtenerConversacionesRamo);

// Obtener mensajes no vistos del alumno
router.get("/no-vistos/:ramoId", authMiddleware, obtenerNoVistos);

export default router;