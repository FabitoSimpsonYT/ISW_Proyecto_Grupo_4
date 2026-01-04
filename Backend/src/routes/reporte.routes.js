import { Router } from "express";
import { descargarReporteEvaluaciones, descargarReporteSlots } from "../controllers/reporte.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

/**
 * GET /api/reportes/evaluaciones
 * Descargar reporte de evaluaciones en Excel
 * Query params:
 *   - codigoRamo (opcional): Filtrar por código de ramo
 */
router.get("/evaluaciones", authMiddleware, descargarReporteEvaluaciones);

/**
 * GET /api/reportes/slots
 * Descargar reporte de slots en Excel
 */
router.get("/slots", authMiddleware, descargarReporteSlots);

export default router;
