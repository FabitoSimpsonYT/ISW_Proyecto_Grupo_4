import { Router } from "express";
import {
  createEvaluacionIntegradora,
  getEvaluacionIntegradora,
  updateEvaluacionIntegradora,
  deleteEvaluacionIntegradora,
  createPautaIntegradora,
  updatePautaIntegradora,
  getPautasIntegradora,
  getNotaIntegradoraAlumno,
} from "../controllers/evaluacionIntegradora.controller.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

// Rutas para evaluación integradora
router.post("/:codigoRamo", authMiddleware, createEvaluacionIntegradora);
router.get("/:codigoRamo", authMiddleware, getEvaluacionIntegradora);
router.patch("/:evaluacionId", authMiddleware, updateEvaluacionIntegradora);
router.delete("/:evaluacionId", authMiddleware, deleteEvaluacionIntegradora);

// Rutas para pautas integradoras
router.post("/:evaluacionIntegradoraId/pauta/:alumnoRut", authMiddleware, createPautaIntegradora);
router.patch("/pauta/:pautaIntegradoraId", authMiddleware, updatePautaIntegradora);
router.get("/:evaluacionIntegradoraId/pautas", authMiddleware, getPautasIntegradora);

// Ruta para obtener nota integradora de un alumno
router.get("/:codigoRamo/alumno/:alumnoRut/nota", authMiddleware, getNotaIntegradoraAlumno);

export default router;
